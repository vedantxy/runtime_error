import React, { createContext, useContext, useState } from 'react';

const CompanionContext = createContext(null);

export function CompanionProvider({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setListening] = useState(false);
  const [isSpeaking, setSpeaking] = useState(false);
  const [syncStatus, setSyncStatus] = useState('success'); // 'idle' | 'syncing' | 'success'
  const [activeTab, setActiveTab] = useState('sidebar'); // 'sidebar' | 'dashboard'
  
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      role: 'user',
      content: "Can you summarize the concept of 'Utility-First aesthetic' from this page?",
      timestamp: '10:42 AM',
      url: 'https://aether-design-system.io/principles'
    },
    {
      id: 2,
      role: 'assistant',
      content: "Based on the page context, the 'Utility-First aesthetic' emphasizes:\n\n* **Atmospheric Clarity**: Using white space to reduce cognitive load.\n* **Mechanical Precision**: Snappy, linear transitions (80-100ms).\n* **Architectural Framing**: Using 1px structural lines instead of heavy shadows for depth.",
      timestamp: '10:43 AM',
      url: 'https://aether-design-system.io/principles'
    }
  ]);

  const addChatMessage = (role, content) => {
    setChatHistory(prev => [
      ...prev,
      {
        id: Date.now(),
        role,
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        url: window.location.href
      }
    ]);
  };

  return (
    <CompanionContext.Provider value={{
      isSidebarOpen,
      setSidebarOpen,
      isListening,
      setListening,
      isSpeaking,
      setSpeaking,
      chatHistory,
      addChatMessage,
      syncStatus,
      setSyncStatus,
      activeTab,
      setActiveTab
    }}>
      {children}
    </CompanionContext.Provider>
  );
}

export function useCompanionState() {
  const context = useContext(CompanionContext);
  if (!context) {
    throw new Error('useCompanionState must be used within a CompanionProvider');
  }
  return context;
}
