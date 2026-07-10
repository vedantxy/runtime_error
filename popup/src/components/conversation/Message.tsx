import React from 'react';
import { motion } from 'framer-motion';
import { UserBubble } from './UserBubble.js';
import { AssistantBubble } from './AssistantBubble.js';
import { ChatMessage } from '../../context/AppContext.js';

interface MessageProps {
  message: ChatMessage;
}

const messageVariants = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 250, damping: 20 } },
};

export const Message: React.FC<MessageProps> = ({ message }) => {
  return (
    <motion.div variants={messageVariants} initial="initial" animate="animate" className="flex flex-col w-full">
      {message.role === 'user' ? (
        <UserBubble text={message.text} timestamp={message.timestamp} />
      ) : (
        <AssistantBubble text={message.text} timestamp={message.timestamp} />
      )}
    </motion.div>
  );
};
