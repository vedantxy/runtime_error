/**
 * intentClassifier.js
 * 
 * Lightweight client-side intent classifier. Maps transcripts to command intents.
 * Prevents unnecessary backend LLM calls for standard control instructions.
 */

export const Intents = {
  READ_ALOUD: 'READ_ALOUD',
  SUMMARIZE: 'SUMMARIZE',
  EXPLAIN_SIMPLE: 'EXPLAIN_SIMPLE',
  STOP: 'STOP',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  FREEFORM_QA: 'FREEFORM_QA'
};

/**
 * Classifies the query string.
 * @param {string} text - The input spoken transcript or text query.
 * @returns {string} The matched Intent value.
 */
export function classifyIntent(text) {
  const clean = text.toLowerCase().trim();

  // READ ALOUD rule
  if (/^(read this page|read it|read the article|start reading|read aloud)/.test(clean)) {
    return Intents.READ_ALOUD;
  }

  // SUMMARIZE rule
  if (/^(summarize|give me a summary|what is this about|tell me what this is|two-minute summary)/.test(clean)) {
    return Intents.SUMMARIZE;
  }

  // EXPLAIN SIMPLE rule
  if (/explain like (i'm a beginner|i'm five|im five|a kid)/.test(clean)) {
    return Intents.EXPLAIN_SIMPLE;
  }

  // PAUSE / RESUME / STOP controls
  if (clean === 'pause' || clean === 'pause reading') {
    return Intents.PAUSE;
  }
  if (clean === 'resume' || clean === 'continue' || clean === 'resume reading') {
    return Intents.RESUME;
  }
  if (clean === 'stop' || clean === 'stop reading' || clean === 'shut up') {
    return Intents.STOP;
  }

  // Default to Q&A
  return Intents.FREEFORM_QA;
}
