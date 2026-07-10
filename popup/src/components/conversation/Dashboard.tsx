import React from 'react';
import { Sparkles, FileText, Volume2, Zap, ArrowRight, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext.js';

const container = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
};

export const Dashboard: React.FC = () => {
  const { extractCurrentPage, sendMessage, loadingState, extractedData } = useApp();
  const isLoading = loadingState === 'Loading' || loadingState === 'Thinking';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good morning', emoji: '🌤️' };
    if (h < 18) return { text: 'Good afternoon', emoji: '☀️' };
    return { text: 'Good evening', emoji: '🌙' };
  };

  const { text: greeting, emoji } = getGreeting();

  const handleShortcut = (q: string) => {
    if (isLoading) return;
    sendMessage(q);
  };

  return (
    <motion.div 
      variants={container}
      initial="initial"
      animate="animate"
      className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 p-4"
    >
      {/* Greeting */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{emoji}</span>
          <h2 className="text-sm font-black text-[var(--text-primary)] leading-none">{greeting}</h2>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-0.5">
          AI-powered browser companion. Extract any page, ask questions, translate, or listen.
        </p>
      </motion.div>

      {/* Primary CTA — AI Summarizer */}
      <motion.button
        variants={fadeUp}
        onClick={() => {
          if (extractedData) {
            handleShortcut(
              'Provide a concise, comprehensive summary of the key facts and highlights of this document.'
            );
          } else {
            extractCurrentPage();
          }
        }}
        disabled={isLoading}
        className="group relative overflow-hidden rounded-2xl p-px bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-left w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        id="action-ai-summarize"
      >
        <div className="relative rounded-[15px] bg-gradient-to-br from-indigo-600 to-violet-700 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white leading-tight">
              {extractedData ? 'AI Summarize' : 'Extract & Summarize'}
            </div>
            <div className="text-[10px] text-white/70 mt-0.5 leading-tight">
              {extractedData
                ? `"${extractedData.title?.slice(0, 40)}..."`
                : 'Smart digest of any webpage in seconds'}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </motion.button>

      {/* 2-column grid */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 gap-2.5"
      >
        {/* Extract */}
        <button
          onClick={extractCurrentPage}
          disabled={isLoading}
          className="action-card flex-col items-start gap-2"
          id="action-extract-page"
        >
          <div className="action-card-icon">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-primary)]">Extract Page</div>
            <div className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">
              Parse DOM content
            </div>
          </div>
        </button>

        {/* Read aloud */}
        <button
          onClick={() => {
            if (extractedData) {
              handleShortcut('Please read this article aloud.');
            } else {
              extractCurrentPage();
            }
          }}
          disabled={isLoading}
          className="action-card flex-col items-start gap-2"
          id="action-read-aloud"
        >
          <div className="action-card-icon">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-primary)]">Read Aloud</div>
            <div className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">
              Audiobook mode
            </div>
          </div>
        </button>

        {/* Quick Q&A */}
        <button
          onClick={() => handleShortcut('What are the 3 most important takeaways from this page?')}
          disabled={isLoading || !extractedData}
          className="action-card flex-col items-start gap-2"
          id="action-quick-qa"
        >
          <div className="action-card-icon">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-primary)]">Key Points</div>
            <div className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">
              Top 3 takeaways
            </div>
          </div>
        </button>

        {/* Translate */}
        <button
          onClick={() => handleShortcut('Translate the main content of this page to Spanish.')}
          disabled={isLoading || !extractedData}
          className="action-card flex-col items-start gap-2"
          id="action-translate"
        >
          <div className="action-card-icon">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-primary)]">Translate</div>
            <div className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-tight">
              En Español
            </div>
          </div>
        </button>
      </motion.div>

      {/* Features note */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 flex flex-col gap-1.5"
      >
        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
          🚀 What's new
        </div>
        <ul className="text-[10px] text-[var(--text-muted)] leading-relaxed flex flex-col gap-1">
          <li className="flex items-start gap-1.5">
            <span className="text-indigo-500 mt-0.5 flex-shrink-0">▸</span>
            Multi-provider support: GPT-4o, Gemini, Ollama
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-violet-500 mt-0.5 flex-shrink-0">▸</span>
            GitHub, Wikipedia, Medium extractors
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-purple-500 mt-0.5 flex-shrink-0">▸</span>
            Interrupt TTS when you start talking
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
};
