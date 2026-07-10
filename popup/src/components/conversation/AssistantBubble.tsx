import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Sparkles } from 'lucide-react';

interface AssistantBubbleProps {
  text: string;
  timestamp: string;
}

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block my-2">
      <div className="code-block-header">
        <span className="font-semibold uppercase tracking-widest text-[9px]">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="code-block-content custom-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/* ─── Inline markdown parser ─── */
const parseInline = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return (
        <strong key={i} className="font-extrabold text-brand-600 dark:text-brand-400 drop-shadow-sm">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith('*') && part.endsWith('*'))
      return (
        <em key={i} className="italic text-[var(--text-secondary)]">
          {part.slice(1, -1)}
        </em>
      );
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <code
          key={i}
          className="font-mono text-[11px] px-1 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
};

/* ─── Block markdown renderer ─── */
const renderMarkdown = (raw: string): React.ReactNode => {
  if (!raw) return null;
  const segments = raw.split(/(```[\s\S]*?```)/g);

  return segments.map((seg, si) => {
    // Code block
    if (seg.startsWith('```') && seg.endsWith('```')) {
      const inner = seg.slice(3, -3).trim().split('\n');
      let lang = 'code';
      let code = inner.join('\n');
      if (inner[0] && inner[0].length < 20 && !inner[0].includes(' ') && inner.length > 1) {
        lang = inner[0];
        code = inner.slice(1).join('\n');
      }
      return <CodeBlock key={si} code={code} language={lang} />;
    }

    // Normal text lines
    const lines = seg.split('\n');
    return (
      <React.Fragment key={si}>
        {lines.map((line, li) => {
          if (line.startsWith('# '))
            return (
              <h2 key={li} className="text-sm font-black text-[var(--text-primary)] mt-3 mb-1">
                {parseInline(line.slice(2))}
              </h2>
            );
          if (line.startsWith('## '))
            return (
              <h3 key={li} className="text-xs font-bold text-[var(--text-primary)] mt-2.5 mb-1">
                {parseInline(line.slice(3))}
              </h3>
            );
          if (line.startsWith('### '))
            return (
              <h4
                key={li}
                className="text-[11px] font-semibold text-[var(--text-secondary)] mt-2 mb-0.5"
              >
                {parseInline(line.slice(4))}
              </h4>
            );
          if (line.startsWith('- ') || line.startsWith('* '))
            return (
              <div key={li} className="flex items-start gap-1.5 my-0.5">
                <span className="text-indigo-500 mt-0.5 flex-shrink-0 text-[10px]">▸</span>
                <span className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  {parseInline(line.slice(2))}
                </span>
              </div>
            );
          const olMatch = line.match(/^(\d+)\.\s(.*)/);
          if (olMatch)
            return (
              <div key={li} className="flex items-start gap-1.5 my-0.5">
                <span className="text-indigo-500 text-[10px] font-bold mt-0.5 flex-shrink-0 w-4 text-right">
                  {olMatch[1]}.
                </span>
                <span className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  {parseInline(olMatch[2])}
                </span>
              </div>
            );
          if (line.trim() === '') return <div key={li} className="h-1.5" />;
          return (
            <p key={li} className="text-[11px] leading-relaxed text-[var(--text-secondary)] my-0.5">
              {parseInline(line)}
            </p>
          );
        })}
      </React.Fragment>
    );
  });
};

export const AssistantBubble: React.FC<AssistantBubbleProps> = ({ text, timestamp }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex gap-2.5 max-w-[92%] mr-auto group"
    >
      {/* AI avatar */}
      <div className="w-6 h-6 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-[var(--accent-glow)] ring-1 ring-white/10">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="bubble-assistant md-content">{renderMarkdown(text)}</div>

        {/* Meta row */}
        <div className="flex items-center gap-2 px-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <span className="text-[8.5px] text-[var(--text-muted)] select-none font-medium">{timestamp}</span>
          <span className="text-[var(--text-muted)] text-[9px]">·</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-0.5 text-[8.5px] text-[var(--text-muted)] hover:text-brand-500 transition-colors font-medium"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="w-2.5 h-2.5 text-emerald-500" />
            ) : (
              <Copy className="w-2.5 h-2.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
