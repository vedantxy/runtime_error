import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sun, Moon, Monitor, Cpu, Wifi, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Button } from '../buttons/Button.js';

type OllamaStatus = 'idle' | 'checking' | 'online' | 'offline';

const PROVIDERS = [
  {
    id: 'ollama' as const,
    name: 'Llama 3.2 (3B)',
    detail: 'llama3.2:3b via Ollama',
    desc: '100% local · privacy-first · no API key',
    badge: 'LOCAL',
    badgeColor: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/25',
    icon: '🦙',
  },
] as const;

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Hindi',
  'Japanese',
  'Arabic',
];

export const SettingsPanel: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    provider,
    setProvider,
    language,
    setLanguage,
    voiceEnabled,
    setVoiceEnabled,
    autoSummarize,
    setAutoSummarize,
    resetAllSettings,
    clearConversation,
  } = useApp();

  const { theme, setTheme } = useTheme();
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>('idle');

  // Check Ollama health when settings panel opens
  useEffect(() => {
    if (!isSettingsOpen) return;
    checkOllama();
  }, [isSettingsOpen]);

  const checkOllama = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch('http://localhost:4000/health', {
        signal: AbortSignal.timeout(4000),
      });
      const data = await res.json();
      setOllamaStatus(data?.providers?.ollama ? 'online' : 'offline');
    } catch {
      setOllamaStatus('offline');
    }
  };

  if (!isSettingsOpen) return null;

  const OllamaStatusBadge = () => {
    if (ollamaStatus === 'checking') {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-amber-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Checking...
        </span>
      );
    }
    if (ollamaStatus === 'online') {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-500">
          <CheckCircle2 className="w-3 h-3" />
          Online · llama3.2:3b
        </span>
      );
    }
    if (ollamaStatus === 'offline') {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-rose-500">
          <AlertCircle className="w-3 h-3" />
          Offline — run: ollama serve
        </span>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="absolute inset-0 z-50 flex flex-col w-full h-full select-none"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex flex-col">
          <h2
            className="text-[11px] font-black uppercase tracking-widest"
            style={{ color: 'var(--text-primary)' }}
          >
            Settings
          </h2>
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            Configure provider, theme, language
          </span>
        </div>
        <button
          id="close-settings"
          onClick={() => setSettingsOpen(false)}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close settings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
        {/* ── AI Provider ── */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              AI Inference Provider
            </label>
            <OllamaStatusBadge />
          </div>

          <div className="flex flex-col gap-2">
            {PROVIDERS.map((p) => {
              const isActive = provider === p.id;
              return (
                <button
                  key={p.id}
                  id={`provider-${p.id}`}
                  onClick={() => {
                    setProvider(p.id);
                    if (p.id === 'ollama') checkOllama();
                  }}
                  className={`flex items-center gap-3 text-left p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'border-indigo-500/60 bg-indigo-500/5 dark:bg-indigo-500/8'
                      : 'hover:bg-[var(--bg-secondary)]'
                  }`}
                  style={{ borderColor: isActive ? undefined : 'var(--border-subtle)' }}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                      isActive ? 'bg-indigo-500/10' : 'bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {p.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {p.name}
                      </span>
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${p.badgeColor}`}
                      >
                        {p.badge}
                      </span>
                      {p.id === 'ollama' && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-600">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {p.desc}
                    </div>
                    <div
                      className="text-[9px] font-mono mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {p.detail}
                    </div>
                  </div>

                  {/* Active dot */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                      isActive
                        ? 'bg-indigo-500 shadow shadow-indigo-500/50'
                        : 'bg-[var(--border-default)]'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Ollama quick-start tip */}
          {provider === 'ollama' && (
            <div
              className="text-[9px] leading-relaxed p-2.5 rounded-lg font-mono"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <div className="flex items-center gap-1 mb-1">
                {ollamaStatus === 'online' ? (
                  <Wifi className="w-3 h-3 text-emerald-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-rose-500" />
                )}
                <span className="font-bold text-[var(--text-secondary)]">Quick Start</span>
              </div>
              <span className="text-indigo-400">$</span> ollama serve
              <br />
              <span className="text-indigo-400">$</span> ollama pull llama3.2:3b
              <button
                onClick={checkOllama}
                className="ml-2 text-indigo-500 hover:text-indigo-400 underline text-[9px]"
              >
                recheck
              </button>
            </div>
          )}
        </section>

        {/* ── Theme ── */}
        <section className="flex flex-col gap-2">
          <label
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            Visual Theme
          </label>
          <div
            className="grid grid-cols-3 gap-1.5 p-1 rounded-xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                id={`theme-${t}`}
                onClick={() => setTheme(t)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                  theme === t ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' : ''
                }`}
                style={{ color: theme === t ? undefined : 'var(--text-secondary)' }}
              >
                {t === 'light' ? (
                  <Sun className="w-3 h-3" />
                ) : t === 'dark' ? (
                  <Moon className="w-3 h-3" />
                ) : (
                  <Monitor className="w-3 h-3" />
                )}
                <span>{t}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Language ── */}
        <section className="flex flex-col gap-2">
          <label
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            Translation Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full text-[11px] py-2.5 px-3 rounded-xl outline-none transition-all cursor-pointer font-semibold"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </section>

        {/* ── Toggles ── */}
        <section
          className="flex flex-col gap-4 p-3 rounded-2xl"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          {[
            {
              key: 'voice',
              label: 'Text-to-Speech',
              desc: 'Speak responses aloud',
              value: voiceEnabled,
              toggle: () => setVoiceEnabled(!voiceEnabled),
              id: 'toggle-voice',
            },
            {
              key: 'auto',
              label: 'Auto-Summarize',
              desc: 'Summarize on page extract',
              value: autoSummarize,
              toggle: () => setAutoSummarize(!autoSummarize),
              id: 'toggle-auto-summarize',
            },
          ].map((item, i, arr) => (
            <React.Fragment key={item.key}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </div>
                  <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                    {item.desc}
                  </div>
                </div>
                <button
                  id={item.id}
                  onClick={item.toggle}
                  className={`toggle ${item.value ? 'on' : 'off'}`}
                  aria-label={item.label}
                  aria-checked={item.value}
                  role="switch"
                />
              </div>
              {i < arr.length - 1 && (
                <div style={{ height: 1, background: 'var(--border-subtle)' }} />
              )}
            </React.Fragment>
          ))}
        </section>

        {/* ── Danger zone ── */}
        <section
          className="flex flex-col gap-2.5 p-3 rounded-2xl"
          style={{
            background: 'rgba(239,68,68,0.03)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}
        >
          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
            Danger Zone
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 text-[10px]"
              onClick={() => {
                clearConversation();
                setSettingsOpen(false);
              }}
            >
              Clear Chat
            </Button>
            <Button
              variant="danger"
              className="flex-1 text-[10px]"
              onClick={() => {
                resetAllSettings();
                setSettingsOpen(false);
              }}
            >
              Reset Settings
            </Button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 flex justify-between items-center text-[9px] flex-shrink-0"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
        }}
      >
        <span>Manifest V3 · llama3.2:3b</span>
        <span>v1.0.0</span>
      </div>
    </motion.div>
  );
};
