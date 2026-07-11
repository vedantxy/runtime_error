import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechSynthesis
 * Wraps the browser Web Speech API TTS engine.
 */
export function useSpeechSynthesis() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const audioRef = useRef(null);

  const stop = useCallback(() => {
    if (synthRef.current) {
      try { synthRef.current.cancel(); } catch (_) {}
    }
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (_) {}
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const fallbackSpeak = useCallback((text, langCode, onEnd, onError) => {
    if (!synthRef.current) {
      setIsPlaying(false);
      if (onError) onError(new Error('No TTS engine available'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utteranceRef.current = utterance;

    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false); };
    utterance.onend   = () => { setIsPlaying(false); setIsPaused(false); if (onEnd) onEnd(); };
    utterance.onerror = (e) => { setIsPlaying(false); setIsPaused(false); if (onError) onError(e); };

    setIsPlaying(true);
    synthRef.current.speak(utterance);
  }, []);

  const speak = useCallback(async (text, langCode = 'en-US', onEnd, onError) => {
    if (!text || !text.trim()) return;

    stop();

    setIsPlaying(true);
    setIsPaused(false);

    try {
      const response = await fetch('http://localhost:4000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: langCode })
      });

      if (!response.ok) {
        throw new Error('Kokoro TTS server not available');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        if (onEnd) onEnd();
      };

      audio.onerror = (e) => {
        console.warn('[useSpeechSynthesis] Kokoro playback failed, falling back to Web Speech:', e);
        fallbackSpeak(text, langCode, onEnd, onError);
      };

      await audio.play();
    } catch (err) {
      console.warn('[useSpeechSynthesis] Kokoro fetch failed, falling back to Web Speech:', err.message);
      fallbackSpeak(text, langCode, onEnd, onError);
    }
  }, [stop, fallbackSpeak]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying && !isPaused) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (synthRef.current && isPlaying && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  const resume = useCallback(() => {
    if (audioRef.current && isPlaying && isPaused) {
      audioRef.current.play().catch(() => {});
      setIsPaused(false);
    } else if (synthRef.current && isPlaying && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, [isPlaying, isPaused]);

  return { speak, pause, resume, stop, isPlaying, isPaused };
}

/**
 * useSpeechRecognition
 * Wraps the browser Web Speech API STT engine.
 *
 * Improvements over the basic version:
 *  - continuous = true: keeps listening through pauses
 *  - interim results shown live in the input box
 *  - onFinalResult fires separately from onInterimResult
 *  - Silence timeout: auto-stops after 2s of no speech
 *  - Graceful unsupported browser handling
 */
export function useSpeechRecognition() {
  const [transcript, setTranscript]   = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError]             = useState(null);

  const recognitionRef    = useRef(null);
  const silenceTimerRef   = useRef(null);
  const onFinalResultRef  = useRef(null);
  const accumulatedRef    = useRef(''); // accumulate final results across pauses

  // Initialise SpeechRecognition once on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[useSpeechRecognition] Web Speech API not supported in this browser.');
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;   // Don't stop after first sentence
    recognition.interimResults  = true;   // Show live partial results
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
  }, []);

  /**
   * Clear the silence timeout timer.
   */
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  /**
   * Start a 2-second silence timer that auto-stops recognition.
   */
  const resetSilenceTimer = (stopFn) => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      stopFn();
    }, 2000);
  };

  /**
   * Start listening.
   * @param {string}   langCode       - BCP 47 language tag e.g. 'en-US'
   * @param {function} onInterim      - Called with interim text as the user speaks
   * @param {function} onFinalResult  - Called with final committed text when silence detected
   * @param {function} onEnd          - Called when recognition session ends
   * @param {function} onError        - Called with error object on failure
   */
  const startListening = useCallback((
    langCode = 'en-US',
    onInterim,
    onFinalResult,
    onEnd,
    onError
  ) => {
    if (!recognitionRef.current) {
      if (onError) onError(new Error('SpeechRecognition not supported in this browser.'));
      return;
    }
    if (isListening) return;

    onFinalResultRef.current = onFinalResult;
    accumulatedRef.current = '';
    let errorOccurred = false;
    setTranscript('');
    setError(null);

    recognitionRef.current.lang = langCode;

    // ── Event handlers ────────────────────────────────────────────────────────
    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      let interimText = '';
      let newFinal    = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newFinal += event.results[i][0].transcript;
        } else {
          interimText += event.results[i][0].transcript;
        }
      }

      if (newFinal) {
        accumulatedRef.current += newFinal + ' ';
      }

      const combined = accumulatedRef.current + interimText;
      setTranscript(combined.trim());
      if (onInterim) onInterim(combined.trim());

      // Reset silence timer on each result
      resetSilenceTimer(() => stopListening());
    };

    recognitionRef.current.onspeechend = () => {
      // Speech paused — start silence countdown
      resetSilenceTimer(() => stopListening());
    };

    recognitionRef.current.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      // Don't call onFinalResult if an error already handled the session
      if (!errorOccurred) {
        const finalText = accumulatedRef.current.trim();
        if (finalText && onFinalResultRef.current) {
          onFinalResultRef.current(finalText);
        }
      }
      if (onEnd) onEnd();
    };

    recognitionRef.current.onerror = (event) => {
      try {
        clearSilenceTimer();
        setIsListening(false);

        // These are non-fatal: no-speech is a normal timeout, aborted fires on manual stop
        if (event.error === 'no-speech' || event.error === 'aborted') {
          if (onEnd) onEnd();
          return;
        }

        errorOccurred = true;

        const errMsg = {
          'not-allowed':   'Microphone access was denied. Please allow microphone in browser settings.',
          'audio-capture': 'No microphone found. Please connect a microphone.',
          'network':       'Network error during speech recognition.',
        }[event.error] || `Speech recognition error: ${event.error}`;

        setError(errMsg);
        if (onError) onError(new Error(errMsg));
      } catch (handlerErr) {
        // Prevent the onerror handler itself from crashing the extension
        console.error('[useSpeechRecognition] Error inside onerror handler:', handlerErr);
      }
    };

    // ── Start ─────────────────────────────────────────────────────────────────
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Recognition may already be running — stop first then retry
      try { recognitionRef.current.stop(); } catch (_) {}
      setTimeout(() => {
        try { recognitionRef.current.start(); } catch (_) {}
      }, 200);
    }
  }, [isListening]);

  /**
   * Stop listening manually.
   */
  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setIsListening(false);
  }, []);

  return {
    startListening,
    stopListening,
    isListening,
    isSupported,
    transcript,
    error
  };
}
