import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAIAdapter } from './adapters/openai.js';
import { GeminiAdapter } from './adapters/gemini.js';
import { OllamaAdapter } from './adapters/ollama.js';
import { NvidiaAdapter } from './adapters/nvidia.js';
import { chunkText } from './lib/contentChunker.js';
import { getSystemPrompt } from './lib/promptBuilder.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

dotenv.config();

/**
 * Strips all Markdown formatting from a text string so it reads
 * naturally when spoken aloud by a TTS engine.
 * Removes: headers, bold, italic, code fences, inline code,
 * links, blockquotes, horizontal rules, and bullet/numbered lists.
 */
function stripMarkdown(text) {
  if (!text) return text;
  const BT = '\u0060'; // backtick, kept out of regex literals to avoid parse issues
  const fenceRe   = new RegExp(BT + BT + BT + '[\\s\\S]*?' + BT + BT + BT, 'g');
  const inlineRe  = new RegExp(BT + '[^' + BT + ']+' + BT, 'g');
  return text
    .replace(fenceRe,  '')                           // fenced code blocks
    .replace(inlineRe, (m) => m.slice(1, -1))        // inline code -> plain text
    .replace(/#{1,6}\s+/g, '')                       // ATX headings
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')           // bold+italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')               // bold
    .replace(/\*([^*]+)\*/g, '$1')                   // italic
    .replace(/___([^_]+)___/g, '$1')                 // bold+italic (underscore)
    .replace(/__([^_]+)__/g, '$1')                   // bold (underscore)
    .replace(/_([^_]+)_/g, '$1')                     // italic (underscore)
    .replace(/~~([^~]+)~~/g, '$1')                   // strikethrough
    .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1')       // images / links -> keep label
    .replace(/^\s*>+\s?/gm, '')                      // blockquotes
    .replace(/^\s*[-*+]\s+/gm, '')                   // unordered list bullets
    .replace(/^\s*\d+\.\s+/gm, '')                   // ordered list numbers
    .replace(/^[-*_]{3,}$/gm, '')                    // horizontal rules
    .replace(/\n{3,}/g, '\n\n')                      // collapse excess blank lines
    .trim();
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Swappable LLM Provider selection
let llm;
const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();

switch (provider) {
  case 'gemini':
    console.log('[Backend] Initializing Gemini LLM Provider.');
    llm = new GeminiAdapter();
    break;
  case 'ollama':
    console.log('[Backend] Initializing Ollama (Local) LLM Provider.');
    llm = new OllamaAdapter();
    break;
  case 'nvidia':
    console.log('[Backend] Initializing NVIDIA LLM Provider.');
    llm = new NvidiaAdapter();
    break;
  case 'openai':
  default:
    console.log('[Backend] Initializing OpenAI LLM Provider.');
    llm = new OpenAIAdapter();
    break;
}

app.get('/api/health', (req, res) => {
  const activeModel = provider === 'nvidia' ? 'nvidia/nemotron-3-ultra-550b-a55b' : (provider === 'ollama' ? (process.env.OLLAMA_MODEL || 'llama3') : (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'));
  res.json({ status: 'ok', provider, model: activeModel, time: new Date().toISOString() });
});

app.get('/api/status', async (req, res) => {
  try {
    if (provider === 'ollama') {
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      const pingRes = await fetch(`${ollamaHost}/api/tags`).catch(() => null);
      if (!pingRes || !pingRes.ok) {
        return res.json({ status: 'offline', provider: 'ollama', models: [] });
      }
      const data = await pingRes.json();
      const modelsList = data.models ? data.models.map(m => m.name) : [];
      return res.json({ 
        status: 'online', 
        provider: 'ollama', 
        models: modelsList, 
        activeModel: process.env.OLLAMA_MODEL || 'llama3.1:8b' 
      });
    } else {
      // Cloud LLM Fallback (gemini/openai)
      const cloudModel = provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini';
      return res.json({ 
        status: 'online', 
        provider, 
        models: [cloudModel], 
        activeModel: cloudModel 
      });
    }
  } catch (e) {
    res.json({ status: 'offline', provider, models: [], error: e.message });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const { text, lang } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    let voice = 'af_bella';
    if (lang && lang.startsWith('en-GB')) {
      voice = 'bf_emma';
    }

    const kokoroUrl = process.env.KOKORO_SERVER_URL || 'http://localhost:8880/v1/audio/speech';
    const response = await fetch(kokoroUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: text,
        voice: voice,
        speed: 1.0
      })
    });

    if (!response.ok) {
      throw new Error(`Kokoro server status: ${response.status}`);
    }

    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'audio/wav');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('[TTS Proxy Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/parse-pdf', async (req, res) => {
  try {
    const { fileData } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'No fileData provided' });
    }
    const buffer = Buffer.from(fileData, 'base64');
    const data = await pdf(buffer);
    res.json({ text: data.text });
  } catch (err) {
    console.error('[PDF Parse Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Grounded Query Route
app.post('/api/query', async (req, res) => {
  const { pageContent, history, userQuery, intent, targetLanguage } = req.body;

  const hasContext = !!(pageContent && typeof pageContent.textContent === 'string' && pageContent.textContent.trim().length > 0);
  const systemPrompt = getSystemPrompt(intent, targetLanguage, hasContext);

  // Build a rich, structured context block for the LLM
  let pageText = '';
  if (hasContext) {
    const meta = [];
    if (pageContent.title) meta.push(`Title: ${pageContent.title}`);
    if (pageContent.byline) meta.push(`Author: ${pageContent.byline}`);
    if (pageContent.url) meta.push(`URL: ${pageContent.url}`);
    if (pageContent.excerpt) meta.push(`Summary: ${pageContent.excerpt}`);
    if (pageContent.extractionMethod) meta.push(`Extraction Method: ${pageContent.extractionMethod}`);
    if (pageContent.wordCount) meta.push(`Word Count: ${pageContent.wordCount}`);

    // Truncate webpage content if it exceeds context limit (3500 words ~ 4600 tokens)
    let textContent = pageContent.textContent || '';
    const words = textContent.split(/\s+/).filter(Boolean);
    if (words.length > 3500) {
      textContent = words.slice(0, 3500).join(' ') + '\n\n... [Content truncated due to length limits]';
    }

    pageText = meta.length > 0
      ? `--- PAGE METADATA ---\n${meta.join('\n')}\n\n--- PAGE CONTENT ---\n${textContent}`
      : textContent;
  }

  try {
    const result = await llm.complete({
      systemPrompt,
      pageContent: pageText,
      history: history || [],
      userQuery: userQuery
    });

    res.json({
      text: stripMarkdown(result.text),
      isInterpretation: result.isInterpretation,
      groundedInPage: hasContext
    });
  } catch (err) {
    console.error('[Backend Query Route Error]:', err);
    res.status(500).json({
      error: {
        code: 'LLM_ERROR',
        message: err.message
      }
    });
  }
});

// Dedicated Map-Reduce Summarize Route
app.post('/api/summarize', async (req, res) => {
  const { pageContent, targetLanguage } = req.body;

  if (!pageContent || typeof pageContent.textContent !== 'string') {
    return res.status(420).json({ error: 'Missing or invalid pageContent' });
  }

  try {
    // Build metadata prefix so each chunk summary has context about its source
    const meta = [];
    if (pageContent.title) meta.push(`Title: ${pageContent.title}`);
    if (pageContent.byline) meta.push(`Author: ${pageContent.byline}`);
    if (pageContent.url) meta.push(`URL: ${pageContent.url}`);
    if (pageContent.excerpt) meta.push(`Excerpt: ${pageContent.excerpt}`);
    const metaHeader = meta.length > 0 ? `--- PAGE METADATA ---\n${meta.join('\n')}\n\n--- PAGE CONTENT ---\n` : '';

    const text = metaHeader + pageContent.textContent;
    // Chunking threshold: 3000 words
    const chunks = chunkText(text, 1500, 100);

    if (chunks.length === 1) {
      // Small page: single call summarization
      const result = await llm.complete({
        systemPrompt: getSystemPrompt('SUMMARIZE', targetLanguage),
        pageContent: text,
        history: [],
        userQuery: 'Summarize the webpage context.'
      });
      return res.json({
        text: stripMarkdown(result.text),
        isInterpretation: result.isInterpretation,
        groundedInPage: true
      });
    }

    // Large page: Map phase (summarize each chunk sequentially to avoid local LLM resource exhaustion)
    console.log(`[Backend Map-Reduce] Processing ${chunks.length} chunks sequentially...`);
    const chunkSummaries = [];
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      console.log(`[Backend Map-Reduce] Summarizing chunk ${idx + 1}/${chunks.length}...`);
      const res = await llm.complete({
        systemPrompt: 'You are an AI Browser Companion. Provide a detailed, comprehensive summary of this portion of the webpage context. Retain all key arguments, core concepts, metrics, names, and important figures.',
        pageContent: chunk,
        history: [],
        userQuery: 'Analyze and summarize this section in detail, ensuring all key context is preserved.'
      });
      chunkSummaries.push(`[Section ${idx + 1} Summary]: ${res.text}`);
    }

    // Reduce phase (summarize the combined summaries)
    let combinedSummaryText = chunkSummaries.join('\n\n');
    console.log('[Backend Map-Reduce] Reducing summaries...');
    
    // Ensure combined summaries do not exceed context window limits (max 3000 words)
    const combinedWords = combinedSummaryText.split(/\s+/).filter(Boolean);
    if (combinedWords.length > 3000) {
      combinedSummaryText = combinedWords.slice(0, 3000).join(' ') + '\n\n... [Content truncated due to length limits]';
    }

    const reduceResult = await llm.complete({
      systemPrompt: getSystemPrompt('SUMMARIZE', targetLanguage),
      pageContent: combinedSummaryText,
      history: [],
      userQuery: 'Synthesize these section summaries into a final coherent summary.'
    });

    res.json({
      text: stripMarkdown(reduceResult.text),
      isInterpretation: reduceResult.isInterpretation,
      groundedInPage: true
    });
  } catch (err) {
    console.error('[Backend Summarize Route Error]:', err);
    res.status(500).json({
      error: {
        code: 'LLM_ERROR',
        message: err.message
      }
    });
  }
});

// Autonomous Browser Agent Route
app.post('/api/agent', async (req, res) => {
  const { goal, domContext, history } = req.body;
  
const systemPrompt = `You are an Autonomous Browser Agent.
Your goal is to navigate the web to fulfill the user's request.
You will be provided with the current DOM context, which includes a list of "Interactive Elements" and their selectors.
CRITICAL INSTRUCTIONS:
1. You MUST use the exact selector provided in the "Interactive Elements" list when using AGENT_CLICK or AGENT_TYPE.
2. If you are stuck in a loop, you MUST output a DONE or ERROR action.
3. If you have successfully accomplished the user's goal (e.g. you navigated to the requested URL, or typed the requested text), you MUST output a DONE action immediately. Do not repeat the same action.
4. You must output a JSON object with EXACTLY two fields:
{
  "thought": "Explain what you see, what you did previously, and what you plan to do next",
  "action": {
    "type": "AGENT_GOTO_URL" | "AGENT_CLICK" | "AGENT_TYPE" | "AGENT_GET_DOM" | "DONE" | "ERROR" | "AGENT_SCROLL" | "AGENT_WAIT" | "AGENT_EXTRACT_DATA",
    "url": "https://example.com" (only if AGENT_GOTO_URL),
    "selector": "#id or .class or [data-agent-id=...]" (only if AGENT_CLICK, AGENT_TYPE, or AGENT_EXTRACT_DATA),
    "text": "text to type" (only if AGENT_TYPE),
    "direction": "up or down" (only if AGENT_SCROLL),
    "time": 2000 (milliseconds to wait, only if AGENT_WAIT),
    "message": "final answer or error message" (only if DONE or ERROR)
  }
}
Ensure your output is raw, strictly valid JSON. Do not wrap in markdown code blocks.`;

  const prompt = `Goal: ${goal}\n\nCurrent DOM Context:\n${domContext ? domContext.substring(0, 5000) : 'None'}`;

  try {
    const result = await llm.complete({
      systemPrompt,
      pageContent: '',
      history: history || [],
      userQuery: prompt
    });

    let jsonStr = result.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        jsonStr = jsonStr.substring(start, end + 1);
      }
    }
    
    console.log('[Backend Agent] Pre-parsed JSON string:', jsonStr);
    
    let parsed;
    try {
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseErr) {
      console.error('[Backend Agent] JSON Parse Error:', parseErr.message, 'Raw JSON string:', jsonStr);
      parsed = {
        thought: "Failed to parse JSON",
        action: {
          type: "ERROR",
          message: `JSON Parse Error! Raw output: ${jsonStr.substring(0, 200)}...`
        }
      };
    }
    
    res.json(parsed);
  } catch (err) {
    console.error('[Agent Route Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT} using provider [${provider}]`);
});
