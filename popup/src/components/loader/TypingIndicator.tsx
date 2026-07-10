import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  const dots = [0, 0.15, 0.3];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 max-w-[60%]"
    >
      {/* AI avatar */}
      <div className="w-6 h-6 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-[var(--accent-glow)] ring-1 ring-white/10 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Dots */}
      <div
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl rounded-tl-none"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-shadow)',
        }}
        role="status"
        aria-label="AI is thinking"
      >
        {dots.map((delay, i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-sm"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
};
