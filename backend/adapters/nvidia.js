import OpenAI from 'openai';

class RateLimiter {
  constructor(delayMs) {
    this.delayMs = delayMs;
    this.lastExecution = 0;
    this.queue = [];
    this.isProcessing = false;
  }

  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLast = now - this.lastExecution;
      if (timeSinceLast < this.delayMs) {
        await new Promise(r => setTimeout(r, this.delayMs - timeSinceLast));
      }

      const { fn, resolve, reject } = this.queue.shift();
      this.lastExecution = Date.now();

      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    }
    
    this.isProcessing = false;
  }
}

// 35 requests per minute = 1 request every ~1714 ms. We use 1750ms to be safe.
const limiter = new RateLimiter(1750);

export class NvidiaAdapter {
  constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY;
    if (!this.apiKey && process.env.LLM_PROVIDER === 'nvidia') {
      console.warn('Warning: NVIDIA_API_KEY environment variable is not configured.');
    }
    
    this.client = new OpenAI({
      apiKey: this.apiKey || 'mock-key',
      baseURL: 'https://integrate.api.nvidia.com/v1'
    });
  }

  async complete({ systemPrompt, pageContent, history, userQuery }) {
    if (!this.apiKey) {
      console.log('[Backend Nvidia] API Key missing. Simulating mock LLM reply...');
      return {
        text: `[MOCK RESPONSE] You asked about "${(pageContent || 'no context').substring(0, 40)}...". Your query was: "${userQuery}".`,
        isInterpretation: true
      };
    }

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (pageContent) {
      messages.push({ role: 'system', content: `Context content of active webpage:\n"""\n${pageContent}\n"""` });
    }

    if (history) {
      history.forEach(turn => {
        messages.push({ role: turn.role, content: turn.content });
      });
    }

    messages.push({ role: 'user', content: userQuery });

    const apiCall = async () => {
      console.log('[Backend Nvidia] Sending request to Nemotron-3...');
      const completion = await this.client.chat.completions.create({
        model: "nvidia/nemotron-3-ultra-550b-a55b",
        messages: messages,
        temperature: 1,
        top_p: 0.95,
        max_tokens: 16384,
        reasoning_budget: 16384,
        chat_template_kwargs: { "enable_thinking": true },
        // The API key the user provided uses extra kwargs:
        // However, OpenAI SDK will automatically pass non-standard fields down 
        // to the fetch payload because the JS client doesn't strictly strip them.
        stream: true
      });

      let fullContent = '';
      let fullReasoning = '';

      for await (const chunk of completion) {
        const reasoning = chunk.choices[0]?.delta?.reasoning_content;
        if (reasoning) {
          fullReasoning += reasoning;
        }
        
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullContent += content;
        }
      }

      console.log('[Backend Nvidia] Completed stream.');
      if (fullReasoning) {
         console.log('[Backend Nvidia] Received reasoning output of length:', fullReasoning.length);
      }
      
      return {
        text: fullContent.trim(),
        isInterpretation: true
      };
    };

    return limiter.execute(apiCall);
  }
}
