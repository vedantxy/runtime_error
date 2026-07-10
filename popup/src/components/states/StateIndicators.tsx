import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Mic,
  Brain,
  Volume2,
  AlertCircle,
  WifiOff,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import { LoadingState } from '../../context/AppContext.js';

interface StateIndicatorProps {
  state: LoadingState;
  onClickAction?: () => void;
}

export const StateIndicator: React.FC<StateIndicatorProps> = ({ state, onClickAction }) => {
  const containerVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
  };

  switch (state) {
    case 'Empty':
      return (
        <motion.div
          key="empty"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col items-center justify-center text-center p-6 my-auto gap-4 h-full"
        >
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 dark:text-indigo-400 rounded-full shadow-inner border border-indigo-500/10">
            <ClipboardList className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-xs">
            <h3 className="font-semibold text-slate-850 dark:text-slate-100 text-sm">
              Ready to Extract
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Analyze webpage DOM contents to start summarizing or asking grounded questions.
            </p>
          </div>
          <button
            onClick={onClickAction}
            className="mt-2 py-2 px-4 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-950/20 transition-all border border-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Extract Tab Page
          </button>
        </motion.div>
      );

    case 'Loading':
      return (
        <motion.div
          key="loading"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col items-center justify-center text-center p-6 my-auto gap-4 h-full"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="p-4 bg-slate-100 dark:bg-slate-900/50 text-indigo-500 dark:text-indigo-400 rounded-full border border-slate-200/50 dark:border-slate-800/50"
          >
            <Loader2 className="w-10 h-10 stroke-[1.5]" />
          </motion.div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="font-semibold text-slate-805 dark:text-slate-100 text-sm">
              Reading Page
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Parsing DOM hierarchies, filtering noise, and compiling paragraphs...
            </p>
          </div>
        </motion.div>
      );

    case 'Listening':
      return (
        <motion.div
          key="listening"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col items-center justify-center text-center p-6 my-auto gap-4 h-full"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-rose-500/20 dark:bg-rose-500/10 rounded-full blur"
            />
            <div className="relative p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full border border-rose-500/10">
              <Mic className="w-10 h-10 stroke-[1.5]" />
            </div>
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="font-semibold text-slate-805 dark:text-slate-100 text-sm">Listening</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Speak now to ask a query about the page content...
            </p>
          </div>
        </motion.div>
      );

    case 'Thinking':
      return (
        <motion.div
          key="thinking"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col items-center justify-center text-center p-6 my-auto gap-4 h-full"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur"
            />
            <div className="relative p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-550 dark:text-indigo-400 rounded-full border border-indigo-500/10">
              <Brain className="w-10 h-10 stroke-[1.5]" />
            </div>
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="font-semibold text-slate-805 dark:text-slate-100 text-sm">Analyzing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Injecting text context and generating LLM responses...
            </p>
          </div>
        </motion.div>
      );

    case 'Speaking':
      return (
        <motion.div
          key="speaking"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col items-center justify-center text-center p-6 my-auto gap-4 h-full"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur"
            />
            <div className="relative p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full border border-emerald-500/10">
              <Volume2 className="w-10 h-10 stroke-[1.5]" />
            </div>
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="font-semibold text-slate-805 dark:text-slate-100 text-sm">
              Reading Aloud
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synthesizing speech response using TTS engine...
            </p>
          </div>
        </motion.div>
      );

    case 'Offline':
      return (
        <motion.div
          key="offline"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col items-center justify-center text-center p-6 my-auto gap-4 h-full"
        >
          <div className="p-4 bg-slate-100 dark:bg-slate-900/50 text-slate-400 rounded-full border border-slate-200/50 dark:border-slate-800/50">
            <WifiOff className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="font-semibold text-slate-805 dark:text-slate-100 text-sm">
              Network Offline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No internet connection detected. Please verify your connection settings.
            </p>
          </div>
        </motion.div>
      );

    case 'Error':
      return (
        <motion.div
          key="error"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col items-center justify-center text-center p-6 my-auto gap-4 h-full"
        >
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full border border-rose-500/10">
            <AlertCircle className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-xs">
            <h3 className="font-semibold text-slate-805 dark:text-slate-100 text-sm">
              Operation Failed
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              An exception occurred while querying the page context. Please try again.
            </p>
          </div>
          <button
            onClick={onClickAction}
            className="mt-2 py-1.5 px-3 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-lg shadow-rose-950/20 transition-all border border-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Retry Extraction
          </button>
        </motion.div>
      );

    case 'Idle':
    default:
      return null;
  }
};
