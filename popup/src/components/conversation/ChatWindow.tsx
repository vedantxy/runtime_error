import React, { useEffect, useRef } from 'react';
import { Message } from './Message.js';
import { ChatMessage } from '../../context/AppContext.js';
import { TypingIndicator } from '../loader/TypingIndicator.js';

interface ChatWindowProps {
  messages: ChatMessage[];
  loadingState: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loadingState }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll on new message append or thinking state transitions
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingState]);

  return (
    <div className="flex-grow overflow-y-auto px-4 py-2 flex flex-col gap-4 custom-scrollbar max-h-full">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      {loadingState === 'Thinking' && <TypingIndicator />}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
};
