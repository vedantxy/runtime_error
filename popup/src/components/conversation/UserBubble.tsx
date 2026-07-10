import React from 'react';
import { motion } from 'framer-motion';

interface UserBubbleProps {
  text: string;
  timestamp: string;
}

export const UserBubble: React.FC<UserBubbleProps> = ({ text, timestamp }) => {
  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-col items-end gap-1 max-w-[88%] ml-auto"
    >
      <div className="bubble-user break-words">{text}</div>
      <span className="text-[8.5px] font-medium text-[var(--text-secondary)] px-1 select-none">{timestamp}</span>
    </motion.div>
  );
};
