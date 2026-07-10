import React, { useState, useEffect, useRef } from 'react';
import { useSpeechSynthesis, useSpeechRecognition } from './hooks/useSpeech';
import { classifyIntent, Intents } from './utils/intentClassifier';

function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [uiState, setUiState] = useState('Idle'); // Idle | Thinking | Listening | Speaking | Error
  const [statusLabel, setStatusLabel] = useState('Ready');
  
  // Custom states for dropdown menus
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isIntentOpen, setIsIntentOpen] = useState(false);
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // chat | archive | models
  const [archiveSearch, setArchiveSearch] = useState('');
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);
  const [backendStatus, setBackendStatus] = useState('offline'); // online | offline
  const [downloadedModels, setDownloadedModels] = useState([]);
  const [showModelHub, setShowModelHub] = useState(false); // for extension popup overlay

  // Model & Timer State
  const [activeModel, setActiveModel] = useState('llama3.1:8b'); // Loaded dynamically
  const [timerVal, setTimerVal] = useState('0.0');
  const [generationTime, setGenerationTime] = useState(null);

  const [inputText, setInputText] = useState('');
  const [hasConsent, setHasConsent] = useState(null); // null checking

<<<<<<< Updated upstream
=======
  // Web Agent States
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [agentTask, setAgentTask] = useState('');
  const [agentHistory, setAgentHistory] = useState([]);
  const [agentLog, setAgentLog] = useState('');

  const [spokenText, setSpokenText] = useState('');

>>>>>>> Stashed changes
  const chatHistoryRef = useRef(null);
  const langRef = useRef(null);
  const intentRef = useRef(null);
  const fileInputRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync spoken text with TTS state
  useEffect(() => {
    if (!tts.isPlaying) {
      setSpokenText('');
    }
  }, [tts.isPlaying]);
  // Refs to avoid stale closures in async callbacks
  const sessionsRef = useRef([]);
  const currentSessionIdRef = useRef(null);

  // Speech Controllers
  const tts = useSpeechSynthesis();
  const stt = useSpeechRecognition();



  // Helper to map language names to language codes
  const getLangCode = (langName) => {
    switch (langName) {
      case 'Hindi': return 'hi-IN';
      case 'Bengali': return 'bn-IN';
      case 'Tamil': return 'ta-IN';
      case 'Telugu': return 'te-IN';
      case 'Marathi': return 'mr-IN';
      case 'Gujarati': return 'gu-IN';
      case 'Kannada': return 'kn-IN';
      case 'Malayalam': return 'ml-IN';
      case 'Punjabi': return 'pa-IN';
      case 'Odia': return 'or-IN';
      case 'Urdu': return 'ur-IN';
      case 'Sanskrit': return 'sa-IN';
      case 'English (UK)': return 'en-GB';
      case 'English (US)':
      default: return 'en-US';
    }
  };

  // Get active session — always read from ref to avoid stale closures in async callbacks
  const getActiveSession = () => {
    return sessionsRef.current.find(s => s.id === currentSessionIdRef.current) || null;
  };

  // Load saved sessions on startup
  useEffect(() => {
    const loadSessions = () => {
      const defaultSession = {
        id: Date.now(),
        title: 'Central Command',
        messages: [{ role: 'assistant', content: 'MOMENTUM OS v4.0.12 INITIALIZED. SECURE CHANNEL ACCESSED VIA LOCALHOST. READY TO PROCESS INSTRUCTIONS.' }],
        pageContent: null,
        targetLanguage: 'English (US)',
        activeIntent: 'SUMMARIZE',
        intentResponses: {
          SUMMARIZE: 'SYSTEM LOG: Awaiting page extraction. Click "Extract Page" below to compile context.',
          EXPLAIN_SIMPLE: 'SYSTEM LOG: ELI5 explanation cache is empty. Extract context first.',
          EXAMPLE: 'SYSTEM LOG: Topic illustration compiler is offline. Extract context first.',
        }
      };

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['savedSessions', 'lastSessionId'], (result) => {
          let loaded = result.savedSessions || [];
          let lastId = result.lastSessionId;
          if (loaded.length === 0) {
            loaded = [defaultSession];
            lastId = defaultSession.id;
            chrome.storage.local.set({ savedSessions: loaded, lastSessionId: lastId });
          }
          const resolvedId = lastId || loaded[0].id;
          // Sync refs immediately so async callbacks have fresh data from startup
          sessionsRef.current = loaded;
          currentSessionIdRef.current = resolvedId;
          setSessions(loaded);
          setCurrentSessionId(resolvedId);
        });
      } else {
        // Local Storage fallback
        let loaded = [];
        try {
          loaded = JSON.parse(localStorage.getItem('savedSessions')) || [];
        } catch(e) {}
        let lastId = localStorage.getItem('lastSessionId');
        if (loaded.length === 0) {
          loaded = [defaultSession];
          lastId = defaultSession.id.toString();
          localStorage.setItem('savedSessions', JSON.stringify(loaded));
          localStorage.setItem('lastSessionId', lastId);
        }
        const resolvedId = Number(lastId) || loaded[0].id;
        // Sync refs immediately so async callbacks have fresh data from startup
        sessionsRef.current = loaded;
        currentSessionIdRef.current = resolvedId;
        setSessions(loaded);
        setCurrentSessionId(resolvedId);
      }
    };

    loadSessions();
  }, []);

  // Save sessions to storage
  const saveSessionsToStorage = (updatedList, activeId) => {
    // Keep refs fresh so async callbacks always see current data
    sessionsRef.current = updatedList;
    currentSessionIdRef.current = activeId;
    setSessions(updatedList);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ savedSessions: updatedList, lastSessionId: activeId });
    } else {
      localStorage.setItem('savedSessions', JSON.stringify(updatedList));
      localStorage.setItem('lastSessionId', activeId.toString());
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load consent state on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['privacyConsent'], (result) => {
        setHasConsent(!!result.privacyConsent);
      });
    } else {
      const localConsent = localStorage.getItem('privacyConsent');
      setHasConsent(!!localConsent);
    }
  }, []);

  // Auto-detect local running backend/model status on mount and every 5 seconds
  useEffect(() => {
    const checkBackendStatus = () => {
      fetch('http://localhost:4000/api/status')
        .then(res => {
          if (!res.ok) throw new Error('Network response not ok');
          return res.json();
        })
        .then(data => {
          setBackendStatus(data.status);
          if (data.status === 'online') {
            setDownloadedModels(data.models || []);
            if (data.activeModel) {
              setActiveModel(data.activeModel);
            }
          } else {
            setDownloadedModels([]);
          }
        })
        .catch(err => {
          console.warn('[Backend Status Poll failed]', err);
          setBackendStatus('offline');
          setDownloadedModels([]);
        });
    };

    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-request microphone permission if opened in a tab with ?request_mic=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('request_mic') === 'true') {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          console.log('[Permission Tab] Microphone permission successfully granted.');
          // Stop the stream tracks immediately to release the microphone
          stream.getTracks().forEach(track => track.stop());
          alert('🎙️ Microphone access granted! You can now close this tab and use voice commands in the extension.');
        })
        .catch((err) => {
          console.error('[Permission Tab] Microphone permission denied:', err);
        });
    }
  }, []);

  // Auto-extract page content on mount if session has no content yet
  useEffect(() => {
    const timer = setTimeout(() => {
      const active = getActiveSession();
      if (active && !active.pageContent) {
        console.log('[Auto-Extract] Triggering automatic page extraction on mount...');
        handleExtract();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentSessionId]);

  // Save consent
  const handleAcceptConsent = () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ privacyConsent: true }, () => {
        setHasConsent(true);
      });
    } else {
      localStorage.setItem('privacyConsent', 'true');
      setHasConsent(true);
    }
  };

  // Stopwatch controls
  const startTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGenerationTime(null);
    setTimerVal('0.0');
    const startTime = Date.now();
    timerIntervalRef.current = setInterval(() => {
      setTimerVal(((Date.now() - startTime) / 1000).toFixed(1));
    }, 100);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Fetch active LLM model on startup
  useEffect(() => {
    fetch('http://localhost:4000/api/health')
      .then(res => res.json())
      .then(data => {
        if (data && data.model) {
          setActiveModel(data.model);
        }
      })
      .catch(err => {
        console.warn('Could not fetch active model from health check.', err);
      });
  }, []);

  // Scroll chat history to bottom
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, uiState]);

  // Handle TTS state reflection to UI State
  useEffect(() => {
    if (tts.isPlaying) {
      if (tts.isPaused) {
        setUiState('Idle');
        setStatusLabel('Paused');
      } else {
        setUiState('Speaking');
        setStatusLabel('Speaking...');
      }
    } else {
      setUiState('Idle');
      setStatusLabel('Ready');
    }
  }, [tts.isPlaying, tts.isPaused]);

  // Set UI State and status text
  const updateUIState = (state, label = '') => {
    setUiState(state);
    setStatusLabel(label || state);
  };

  const filteredSessions = sessions.filter(s => {
    const queryText = archiveSearch.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(queryText);
    const urlMatch = s.pageContent && s.pageContent.url && s.pageContent.url.toLowerCase().includes(queryText);
    return titleMatch || urlMatch;
  });

  const archivePreviewSession = sessions.find(s => s.id === selectedArchiveId) || null;

  // Create a new chat session
  const handleNewChat = () => {
    const newSession = {
      id: Date.now(),
      title: `Session ${sessions.length + 1}`,
      messages: [{ role: 'assistant', content: 'MOMENTUM OS CHANNEL RESET. STANDING BY FOR INPUT.' }],
      pageContent: null,
      targetLanguage: 'English (US)',
      activeIntent: 'SUMMARIZE',
      intentResponses: {
        SUMMARIZE: 'SYSTEM LOG: Awaiting page extraction. Click "Extract Page" below to compile context.',
        EXPLAIN_SIMPLE: 'SYSTEM LOG: ELI5 explanation cache is empty. Extract context first.',
        EXAMPLE: 'SYSTEM LOG: Topic illustration compiler is offline. Extract context first.',
      }
    };
    const updated = [newSession, ...sessions];
    saveSessionsToStorage(updated, newSession.id);
    currentSessionIdRef.current = newSession.id;
    setCurrentSessionId(newSession.id);
    setIsSidebarActive(false);
  };

  // Switch to selected session
  const handleSwitchSession = (sessionId) => {
    currentSessionIdRef.current = sessionId;
    setCurrentSessionId(sessionId);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ lastSessionId: sessionId });
    } else {
      localStorage.setItem('lastSessionId', sessionId.toString());
    }
  };

  // Delete an old chat session
  const handleDeleteSession = (sessionId) => {
    if (sessions.length <= 1) {
      alert("Cannot delete the only remaining session.");
      return;
    }
    const updated = sessions.filter(s => s.id !== sessionId);
    let nextActiveId = currentSessionId;
    if (currentSessionId === sessionId) {
      nextActiveId = updated[0].id;
    }
    saveSessionsToStorage(updated, nextActiveId);
    setCurrentSessionId(nextActiveId);
    if (selectedArchiveId === sessionId) {
      setSelectedArchiveId(null);
    }
  };

  // Export chat transcript as Markdown document
  const exportSessionMarkdown = (s) => {
    const header = `# Chat Transcript: ${s.title}\n` +
      `* **Date:** ${new Date(s.id).toLocaleString()}\n` +
      (s.pageContent ? `* **Source Webpage:** ${s.pageContent.url}\n` : '') +
      `\n---\n\n`;
    
    const body = s.messages.map(msg => {
      const roleName = msg.role === 'user' ? 'User' : 'AI Companion';
      return `### **${roleName}**:\n${msg.content}\n\n`;
    }).join('---\n\n');

    const blob = new Blob([header + body], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_transcript.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lazy Extract + Intent Trigger Action
  const handleIntentAction = (intentType) => {
    const active = getActiveSession();
    if (!active) return;

    if (!active.pageContent) {
      updateUIState('Thinking', 'Extracting...');
      startTimer();

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'TRIGGER_EXTRACTION' }, (response) => {
          stopTimer();
          if (response && response.status === 'success') {
            active.pageContent = response.data;
            active.title = response.data.title;
            active.messages.push({
              role: 'assistant',
              content: `📖 EXTRACTED CONTEXT FROM "${response.data.title.toUpperCase()}" SUCCESSFUL. WORD COUNT: ${response.data.wordCount}.`
            });
            const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? active : s);
            saveSessionsToStorage(updated, currentSessionIdRef.current);
            triggerIntentFetch(response.data, intentType);
          } else {
            updateUIState('Error', 'Extraction failed');
          }
        });
      } else {
        // mock logic
        setTimeout(() => {
          stopTimer();
          const mockData = {
            url: window.location.href,
            title: 'Steam Operational Manifesto',
            textContent: 'Centralized gaming analytics compilation covering operational revision 4.0.12 parameters.',
            wordCount: 11,
            extractionMethod: 'mock-dom',
            truncated: false
          };
          active.pageContent = mockData;
          active.title = mockData.title;
          active.messages.push({
            role: 'assistant',
            content: `📖 [MOCK ACCESSED] COMPILING "${mockData.title.toUpperCase()}" DATA STREAM.`
          });
          const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? active : s);
          saveSessionsToStorage(updated, currentSessionIdRef.current);
          triggerIntentFetch(mockData, intentType);
        }, 800);
      }
    } else {
      triggerIntentFetch(active.pageContent, intentType);
    }
  };

  // EXTRACT PAGE content
  const handleExtract = () => {
    updateUIState('Thinking', 'Extracting...');
    startTimer();

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'TRIGGER_EXTRACTION' }, (response) => {
        if (response && response.status === 'success') {
          stopTimer();
          updateUIState('Idle', 'Ready');
          
          const active = getActiveSession();
          if (active) {
            active.pageContent = response.data;
            active.title = response.data.title;
            active.messages.push({
              role: 'assistant',
              content: `📖 EXTRACTED CONTEXT FROM "${response.data.title.toUpperCase()}" SUCCESSFUL. WORD COUNT: ${response.data.wordCount}.`
            });
            const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? active : s);
            saveSessionsToStorage(updated, currentSessionIdRef.current);
          }
        } else {
          stopTimer();
          updateUIState('Error', 'Failed');
          const errorMsg = response ? response.message : 'Unknown error';
          const active = getActiveSession();
          if (active) {
            active.messages.push({
              role: 'assistant',
              content: `CRITICAL ERROR: CONTEXT EXTRACTION FAILED (${errorMsg.toUpperCase()}). REFRESH SYSTEM CHANNEL.`
            });
            const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? active : s);
            saveSessionsToStorage(updated, currentSessionIdRef.current);
          }
        }
      });
    } else {
      // Mock for local browser development
      setTimeout(() => {
        stopTimer();
        updateUIState('Idle', 'Ready');
        const mockData = {
          url: window.location.href,
          title: 'Steam Operational Manifesto',
          textContent: 'Centralized gaming analytics compilation covering operational revision 4.0.12 parameters.',
          wordCount: 11,
          extractionMethod: 'mock-dom',
          truncated: false
        };
        const active = getActiveSession();
        if (active) {
          active.pageContent = mockData;
          active.title = mockData.title;
          active.messages.push({
            role: 'assistant',
            content: `📖 [MOCK ACCESSED] COMPILING "${mockData.title.toUpperCase()}" DATA STREAM.`
          });
          const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? active : s);
          saveSessionsToStorage(updated, currentSessionIdRef.current);
        }
      }, 800);
    }
  };

  // Helper to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Helper to extract text from PDF via backend parser
  const extractTextFromPDF = async (arrayBuffer) => {
    const base64 = arrayBufferToBase64(arrayBuffer);
    const response = await fetch('http://localhost:4000/api/parse-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData: base64 })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }
    const data = await response.json();
    return data.text;
  };

  // File Upload Handler (Text & PDF support)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    updateUIState('Thinking', 'Reading file...');
    startTimer();

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const text = await extractTextFromPDF(arrayBuffer);
          
          stopTimer();
          updateUIState('Idle', 'Ready');

          if (!text.trim()) {
            throw new Error("No text content could be extracted from this PDF.");
          }

          const fileContent = {
            url: `file://${file.name}`,
            title: file.name,
            textContent: text,
            wordCount: text.split(/\s+/).filter(Boolean).length,
            extractionMethod: 'file-upload',
            truncated: false
          };

          const active = getActiveSession();
          if (active) {
            active.title = file.name;
            active.pageContent = fileContent;
            active.messages.push({
              role: 'assistant',
              content: `📎 SYSTEM ATTACHMENT INDEXED: "${file.name.toUpperCase()}" (${fileContent.wordCount} words). AWAITING QUERIES.`
            });
            const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? active : s);
            saveSessionsToStorage(updated, currentSessionIdRef.current);
          }
        } catch (error) {
          stopTimer();
          updateUIState('Error', 'Failed to read PDF');
          console.error('[PDF Read Error]', error);
          const active = getActiveSession();
          if (active) {
            active.messages.push({
              role: 'assistant',
              content: `CRITICAL ERROR: Failed to parse PDF file "${file.name}". Ensure it is a valid, readable text document.`
            });
            const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? active : s);
            saveSessionsToStorage(updated, currentSessionIdRef.current);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Plain text reader fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        stopTimer();
        updateUIState('Idle', 'Ready');
        const text = event.target.result;
        const fileContent = {
          url: `file://${file.name}`,
          title: file.name,
          textContent: text,
          wordCount: text.split(/\s+/).filter(Boolean).length,
          extractionMethod: 'file-upload',
          truncated: false
        };

        const active = getActiveSession();
        if (active) {
          active.title = file.name;
          active.pageContent = fileContent;
          active.messages.push({
            role: 'assistant',
            content: `📎 SYSTEM ATTACHMENT INDEXED: "${file.name.toUpperCase()}" (${fileContent.wordCount} words). AWAITING QUERIES.`
          });
          const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? active : s);
          saveSessionsToStorage(updated, currentSessionIdRef.current);
        }
      };
      reader.readAsText(file);
    }
  };

  // Fetch specific intent data from API
  const triggerIntentFetch = (pageData, intentType) => {
    if (intentType === 'SUMMARIZE') {
      startTimer();
      updateUIState('Thinking', 'Thinking...');
    }

    const active = getActiveSession();
    const payload = {
      pageContent: pageData,
      history: [],
      userQuery: getQueryPrompt(intentType),
      intent: intentType,
      targetLanguage: active ? active.targetLanguage : targetLanguage
    };

    const handleSuccess = (text) => {
      const activeS = getActiveSession();
      if (activeS) {
        activeS.intentResponses[intentType] = text;
        
        // If it's the SUMMARIZE intent, append it directly to the chat log
        if (intentType === 'SUMMARIZE') {
          activeS.messages.push({
            role: 'assistant',
            content: `📄 **SUMMARY REPORT:**\n\n${text}`
          });
        }

        const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? activeS : s);
        saveSessionsToStorage(updated, currentSessionIdRef.current);
        
        if (intentType === 'SUMMARIZE') {
          updateUIState('Idle', 'Ready');
          stopTimer();
          setGenerationTime(timerVal);
        }
      }
    };

    const handleFailure = (errorMsg) => {
      const activeS = getActiveSession();
      if (activeS) {
        const errorText = `CRITICAL DECODE FAULT inside ${intentType}: ${errorMsg.toUpperCase()}`;
        activeS.intentResponses[intentType] = errorText;

        if (intentType === 'SUMMARIZE') {
          activeS.messages.push({
            role: 'assistant',
            content: `⚠️ Failed to generate summary: ${errorMsg}`
          });
        }

        const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? activeS : s);
        saveSessionsToStorage(updated, currentSessionIdRef.current);

        if (intentType === 'SUMMARIZE') {
          updateUIState('Error', 'Failed');
          stopTimer();
        }
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'USER_QUERY', payload }, (response) => {
        if (chrome.runtime.lastError) {
          handleFailure(chrome.runtime.lastError.message);
          return;
        }
        if (response && response.status === 'success') {
          handleSuccess(response.data.text);
        } else {
          handleFailure(response ? response.message : 'Unknown error');
        }
      });
    } else {
      // Standalone webpage mode: direct HTTP fetch to backend server
      const BACKEND_URL = 'http://localhost:4000';
      const endpoint = intentType === 'SUMMARIZE' ? `${BACKEND_URL}/api/summarize` : `${BACKEND_URL}/api/query`;
      
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(responseData => handleSuccess(responseData.text))
      .catch(err => handleFailure(err.message));
    }
  };

  const getQueryPrompt = (intent) => {
    if (intent === 'SUMMARIZE') return 'Summarize the webpage context.';
    if (intent === 'EXPLAIN_SIMPLE') return 'Explain this page simply like I am 5.';
    if (intent === 'EXAMPLE') return 'Give an illustrative example of this topic.';
    return '';
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'ABORT_QUERY' });
    }

    updateUIState('Idle', 'Ready');
    stopTimer();

    const activeS = getActiveSession();
    if (activeS) {
      activeS.messages.push({
        role: 'assistant',
        content: '⚠️ Generation cancelled by user.'
      });
      const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? activeS : s);
      saveSessionsToStorage(updated, currentSessionIdRef.current);
    }
  };

  // SEND MESSAGE (FREEFORM QA)
  const handleSend = (textToSend = '') => {
    const queryStr = (typeof textToSend === 'string' && textToSend.trim()) ? textToSend : inputText;
    const query = (queryStr || '').trim();
    if (!query) return;

    setInputText('');
    
    // Check if voice control intent
    const voiceIntent = classifyIntent(query);
    if (voiceIntent === Intents.PAUSE) { tts.pause(); return; }
    if (voiceIntent === Intents.RESUME) { tts.resume(); return; }
    if (voiceIntent === Intents.STOP) { tts.stop(); return; }

    const active = getActiveSession();
    if (!active) return;

    active.messages.push({ role: 'user', content: query });
    active.activeIntent = 'FREEFORM_QA'; // Switch to Chat mode
    const updatedWithUser = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? active : s);
    saveSessionsToStorage(updatedWithUser, currentSessionIdRef.current);

    updateUIState('Thinking', 'Thinking...');
    startTimer();

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const payload = {
      pageContent: active.pageContent,
      history: active.messages.filter(m => m.role !== 'system'),
      userQuery: query,
      intent: 'FREEFORM_QA',
      targetLanguage: active.targetLanguage
    };

    const handleResponse = (responseText) => {
      updateUIState('Speaking', 'Reading...');
      stopTimer();
      setGenerationTime(timerVal);
      const activeS = getActiveSession();
      if (activeS) {
        activeS.messages.push({ role: 'assistant', content: responseText });
        const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? activeS : s);
        saveSessionsToStorage(updated, currentSessionIdRef.current);
        tts.speak(responseText, getLangCode(activeS.targetLanguage));
      }
    };

    const handleError = (errorMsg) => {
      updateUIState('Error', 'API Error');
      stopTimer();
      const activeS = getActiveSession();
      if (activeS) {
        activeS.messages.push({ role: 'assistant', content: `Error: ${errorMsg}` });
        const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? activeS : s);
        saveSessionsToStorage(updated, currentSessionIdRef.current);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'USER_QUERY', payload }, (response) => {
        if (chrome.runtime.lastError) {
          handleError(chrome.runtime.lastError.message);
          return;
        }
        if (response && response.status === 'success') {
          handleResponse(response.data.text);
        } else {
          handleError(response ? response.message : 'Unknown error');
        }
      });
    } else {
      // Standalone webpage mode: direct HTTP fetch to backend server
      const BACKEND_URL = 'http://localhost:4000';
      fetch(`${BACKEND_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: signal
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(responseData => handleResponse(responseData.text))
      .catch(err => handleError(err.message));
    }
  };

  // MIC EVENT
  const handleMicToggle = () => {
    const active = getActiveSession();
    if (!active) return;

    if (stt.isListening) {
      // User manually stops mic
      stt.stopListening();
      updateUIState('Idle', 'Ready');
    } else {
      tts.stop(); // Stop any active TTS before recording
      updateUIState('Listening', 'Listening...');

      stt.startListening(
        getLangCode(active.targetLanguage),

        // onInterim: show live transcript in input box as user speaks
        (interimText) => {
          setInputText(interimText);
        },

        // onFinalResult: auto-send the committed final transcript
        (finalText) => {
          if (finalText.trim()) {
            setInputText(finalText);
            handleSend(finalText);
          }
          updateUIState('Idle', 'Ready');
        },

        // onEnd: clean up state
        () => {
          updateUIState('Idle', 'Ready');
        },

        // onError: show friendly message in chat
        (err) => {
          console.error('[STT error]', err);
          updateUIState('Idle', 'Ready');
          
          const isPermissionError = err.message.toLowerCase().includes('permission') || 
                                    err.message.toLowerCase().includes('not-allowed') || 
                                    err.message.toLowerCase().includes('allow') ||
                                    err.message.toLowerCase().includes('denied');
          
          const activeS = getActiveSession();
          if (activeS) {
            let msgContent = `🎙️ Microphone error: ${err.message}`;
            if (isPermissionError && typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
              msgContent = `🎙️ MICROPHONE PERMISSION REQUIRED: Google Chrome blocks permission prompts inside popup side panels. \n\nI have automatically opened a permission tab for you. Please click "Allow" on the browser prompt there, then close that tab and return here!`;
              chrome.tabs.create({ url: chrome.runtime.getURL("popup/index.html?request_mic=true") });
            }
            
            activeS.messages.push({
              role: 'assistant',
              content: msgContent
            });
            const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? activeS : s);
            saveSessionsToStorage(updated, currentSessionIdRef.current);
          }
        }
      );
    }
  };

  // Open Full-Page Dashboard Tab
  const handleOpenDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL("popup/index.html") });
    } else {
      alert("Running in standalone web view.");
    }
  };

  // Close floating window or extension panel
  const handleClose = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'COMPANION_CLOSE' }, '*');
    } else {
      window.close();
    }
  };

  // Drag handler for the floating window titlebar
  const handleTitlebarPointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.mac-circle') || e.target.closest('.mac-icon-btn') || e.target.closest('button') || e.target.closest('select')) return;

    e.preventDefault();
    if (window.parent !== window) {
      window.parent.postMessage({ 
        type: 'COMPANION_DRAG_START', 
        screenX: e.screenX, 
        screenY: e.screenY 
      }, '*');
    }
  };

  // Parse lines to display as bullet points (for Summarize/Explain/Example)
  const getRenderContent = () => {
    const active = getActiveSession();
    if (!active) return [];
    
    const text = active.intentResponses[active.activeIntent] || '';
    const lines = text.split('\n')
      .map(line => line.replace(/^[\s*\-•]+/g, '').trim())
      .filter(line => line.length > 0);
      
    if (lines.length === 0) {
      return [<li key="0" className="bullet-item">{text}</li>];
    }
    return lines.map((line, idx) => (
      <li key={idx} className="bullet-item">{line}</li>
    ));
  };

  const renderThinkingState = () => {
    return (
      <div className="thinking-container">
        <div className="thinking-header">
          <span className="thinking-brain">🤖</span>
          <span>COMPILING DECODE STREAM... (⏱️ {timerVal}s)</span>
        </div>
        <div className="skeleton-card">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      </div>
    );
  };

  const renderExtractionState = () => {
    return (
      <div className="thinking-container">
        <div className="thinking-header">
          <span className="thinking-brain">🔍</span>
          <span>COMPILING DOM ELEMENTS... (⏱️ {timerVal}s)</span>
        </div>
        <div className="skeleton-card">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      </div>
    );
  };

  const activeSession = getActiveSession();

  if (hasConsent === false) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        background: '#0c0d0e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#f8fafc',
        fontFamily: "'Outfit', sans-serif",
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>MOMENTUM OS // PRIVACY PERMIT</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
          This companion reads the text content of your active tab <strong>only</strong> when you explicitly trigger an extraction. We do not store your browsing history.
        </p>
        <button 
          onClick={handleAcceptConsent}
          style={{
            padding: '12px 28px',
            borderRadius: '0px',
            border: '2px solid #000',
            background: '#d90429',
            color: '#fff',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(217, 4, 41, 0.3)'
          }}
        >
          ACCEPT PERMIT
        </button>
      </div>
    );
  }

  if (hasConsent === null) return null;

  return (
    <div className="extension-container">
      <div className="mac-window" style={{ width: '100%', height: '100%', borderRadius: '12px' }}>
        <div className="mac-titlebar" onPointerDown={handleTitlebarPointerDown} style={{ cursor: 'move' }}>
          <div className="mac-titlebar-left">
            <div className="mac-circle mac-red" onClick={handleClose}></div>
            <div className="mac-circle mac-yellow"></div>
            <div className="mac-circle mac-green"></div>
          </div>
          <div className="mac-titlebar-center">AI Browser Companion</div>
          <div className="mac-titlebar-right">
            <button className={`mac-icon-btn ${showSidebar ? 'active' : ''}`} onClick={() => setShowSidebar(!showSidebar)} title="Toggle Sidebar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm0 1v10h10V3H3zm1 1h2v8H4V4z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mac-body">
          {showSidebar && (
            <div className="mac-sidebar">
              <div className="mac-section">
                <span className="mac-section-title">MODEL RUNNER</span>
                <div 
                  className="mac-model-card" 
                  onClick={() => setShowModelHub(!showModelHub)} 
                  style={{ 
                    cursor: 'pointer', 
                    padding: '8px 12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                >
                  <span className={`mac-status-dot ${backendStatus}`}></span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                      <span className="mac-model-provider" style={{ fontSize: '11px', fontWeight: 'bold', color: '#22c55e' }}>LM</span>
                      <span className="mac-model-provider" style={{ fontSize: '11px', fontWeight: 'bold', color: '#22c55e' }}>Studio</span>
                    </div>
                    <span className="mac-model-name" style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85px' }}>
                      ({activeModel})
                    </span>
                  </div>
                </div>
              </div>

              <div className="mac-section">
                <span className="mac-section-title">VOICE CONTROLS</span>
                <div className="mac-voice-controls">
                  <button className="mac-ctrl-btn" onClick={tts.resume} title="Play / Resume">▶</button>
                  <button className="mac-ctrl-btn" onClick={tts.pause} title="Pause">⏸</button>
                  <button className="mac-ctrl-btn" onClick={tts.stop} title="Stop">⏹</button>
                </div>
              </div>

              <div className="mac-section">
                <span className="mac-section-title">SPEAKER VOICE</span>
                <div className="mac-select-wrapper">
                  <select 
                    value={activeSession ? activeSession.targetLanguage : targetLanguage}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      if (activeSession) {
                        activeSession.targetLanguage = newLang;
                        const updated = sessionsRef.current.map(s => s.id === currentSessionIdRef.current ? activeSession : s);
                        saveSessionsToStorage(updated, currentSessionIdRef.current);
                      } else {
                        setTargetLanguage(newLang);
                      }
                    }}
                    className="mac-select"
                  >
                    {['English (US)', 'English (UK)', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Urdu', 'Sanskrit'].map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mac-section" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="mac-new-chat-btn" onClick={handleNewChat} style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#475569'
                }}>
                  ➕ New Chat
                </button>
                
                <button className="mac-extract-btn" onClick={handleExtract} style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                  background: '#3b82f6',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#ffffff',
                  marginTop: '2px'
                }}>
                  ⚡ Extract Page
                </button>
                
                <div style={{ marginTop: '2px' }}>
                  <button 
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: '#475569'
                    }}
                  >
                    📎 Upload PDF
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".txt,.js,.css,.html,.md,.json,.csv,.pdf" 
                    style={{ display: 'none' }} 
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mac-chat-pane">
            <div className="mac-messages-container" ref={chatHistoryRef}>
              {activeSession && activeSession.messages.length > 0 ? (
                activeSession.messages.map((msg, index) => {
                  if (index === 0 && activeSession.messages.length > 1 && msg.content.includes("MOMENTUM OS")) return null;
                  return (
                    <div key={index} className={`mac-msg-row ${msg.role}`}>
                      <div className="mac-msg-bubble">
                        {msg.content}
                        {msg.role === 'assistant' && (() => {
                          const cleanText = msg.content.replace(/[#*`_]/g, '');
                          const isThisSpoken = spokenText === cleanText;
                          
                          let btnIcon = '🔊';
                          let btnTitle = 'Read aloud';
                          let handleBubbleSpeakerClick = () => {
                            tts.stop();
                            setSpokenText(cleanText);
                            tts.speak(cleanText, getLangCode(activeSession.targetLanguage));
                          };

                          if (isThisSpoken && tts.isPlaying) {
                            if (tts.isPaused) {
                              btnIcon = '▶';
                              btnTitle = 'Resume speech';
                              handleBubbleSpeakerClick = () => tts.resume();
                            } else {
                              btnIcon = '⏸';
                              btnTitle = 'Pause speech';
                              handleBubbleSpeakerClick = () => tts.pause();
                            }
                          }

                          return (
                            <div style={{ display: 'inline-flex', gap: '4px', verticalAlign: 'middle' }}>
                              <button
                                onClick={handleBubbleSpeakerClick}
                                className="mac-bubble-speaker"
                                title={btnTitle}
                              >
                                {btnIcon}
                              </button>
                              {isThisSpoken && tts.isPlaying && (
                                <button
                                  onClick={() => tts.stop()}
                                  className="mac-bubble-speaker"
                                  title="Stop speech"
                                  style={{ color: '#ef4444' }}
                                >
                                  ⏹
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="mac-empty-state">
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#333333' }}>Hello! I am your macOS browser assistant.</h3>
                  <p style={{ fontSize: '11px', color: '#888888' }}>Type a message or speak to start.</p>

                  <div className="mac-chips-container" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button className="mac-chip-btn" onClick={() => handleIntentAction('SUMMARIZE')}>
                      📝 Summarize Page
                    </button>
                    <button className="mac-chip-btn" onClick={() => handleIntentAction('EXPLAIN_SIMPLE')}>
                      👁️ Explain Simply
                    </button>
                    <button className="mac-chip-btn" onClick={() => handleIntentAction('EXAMPLE')}>
                      📂 Generate Example
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mac-footer">
              <input 
                type="text" 
                className="mac-input"
                placeholder={stt.isListening ? "Listening..." : "Type a message or ask a question..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              {stt.isSupported !== false && (
                <button 
                  className={`mac-btn-mic ${stt.isListening ? 'listening' : ''}`}
                  onClick={handleMicToggle}
                  title={stt.isListening ? "Listening... Click to stop" : "Speak to type"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="9" width="2" height="6" rx="1" fill="currentColor"/>
                    <rect x="9" y="5" width="2" height="14" rx="1" fill="currentColor"/>
                    <rect x="13" y="7" width="2" height="10" rx="1" fill="currentColor"/>
                    <rect x="17" y="9" width="2" height="6" rx="1" fill="currentColor"/>
                  </svg>
                </button>
              )}
              {uiState === 'Thinking' ? (
                <button 
                  className="mac-btn-send" 
                  onClick={handleCancelGeneration} 
                  style={{ background: '#ef4444', color: '#ffffff' }} 
                  title="Stop generating"
                >
                  Stop
                </button>
              ) : (
                <button className="mac-btn-send" onClick={handleSend}>
                  Send
                </button>
              )}
            </div>
          </div>
        </div>

        {showModelHub && (
          <div className="mac-overlay">
            <div className="mac-overlay-header">
              <span>🤖 Local Model Hub</span>
              <button onClick={() => setShowModelHub(false)}>✕</button>
            </div>
            <div className="mac-overlay-body">
              <div className="mac-status-row">
                <span className={`mac-dot ${backendStatus === 'online' ? 'online' : 'offline'}`}></span>
                <span>Ollama Status: <strong>{backendStatus === 'online' ? 'Online' : 'Offline'}</strong></span>
              </div>
              {backendStatus === 'offline' && (
                <div className="mac-alert-box">
                  Ollama is offline. Start it by running <code>ollama serve</code> in terminal.
                </div>
              )}
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', display: 'block', marginBottom: '4px' }}>DOWNLOADED MODELS:</span>
                {downloadedModels.length === 0 ? (
                  <span style={{ fontSize: '11px', color: '#aaa' }}>No models downloaded.</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {downloadedModels.map(m => (
                      <span 
                        key={m} 
                        className={`mac-model-tag ${activeModel === m ? 'active' : ''}`}
                        onClick={() => {
                          setActiveModel(m);
                          setShowModelHub(false);
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
