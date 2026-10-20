import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mic, MicOff, Languages, AlertCircle } from 'lucide-react';

export default function ProspectWords({
  stageNumber,
  value = '',
  onChange,
  disabled = false
}) {
  const isStage5 = stageNumber === 5;
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [lang, setLang] = useState('en-IN'); // Indian English default, or hi-IN
  const [notice, setNotice] = useState(null);

  const recognitionRef = useRef(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  // Keep refs synchronized with props so effect doesn't tear down on every keystroke
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize SpeechRecognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let speechText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          speechText += event.results[i][0].transcript;
        }
      }
      if (speechText.trim()) {
        const prev = valueRef.current || '';
        const updated = prev ? `${prev.trim()} ${speechText.trim()}` : speechText.trim();
        if (onChangeRef.current) {
          onChangeRef.current(updated.slice(0, 2000));
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition notice:', event.error);
      if (event.error === 'not-allowed') {
        setNotice('Mic blocked. Click lock icon in browser address bar to allow.');
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // User paused speaking; keep active
      } else {
        setNotice(`Mic notice: ${event.error}`);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {}
    };
  }, [lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setNotice('Speech recognition not supported in this browser.');
      return;
    }

    setNotice(null);

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech start warning:', err);
        // If already active or transitioning, stop then restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              setNotice('Please click Dictate again to start.');
            }
          }, 200);
        } catch (e) {}
      }
    }
  };

  const toggleLang = () => {
    const nextLang = lang === 'en-IN' ? 'hi-IN' : 'en-IN';
    setLang(nextLang);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.lang = nextLang;
          recognitionRef.current.start();
        }, 200);
      } catch (e) {}
    }
  };

  return (
    <div className={`prospect-words-section ${isStage5 ? 'stage-5-focus' : ''}`}>
      <div className="section-label-row">
        <span className="section-label">
          Their words
          {isStage5 && <span className="highlight-tag">Focus: Verbatim Need</span>}
        </span>

        <div className="words-header-actions">
          {speechSupported && (
            <div className="dictate-controls">
              <button
                type="button"
                className="lang-toggle-btn"
                onClick={toggleLang}
                title={`Click to switch speech language (Current: ${lang === 'en-IN' ? 'Indian English' : 'Hindi'})`}
              >
                <Languages size={11} className="inline mr-1" />
                <span>{lang === 'en-IN' ? 'EN-IN' : 'HI-IN'}</span>
              </button>

              <button
                type="button"
                className={`mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                title={isListening ? 'Click to stop live dictation' : 'Click to dictate into words box'}
                disabled={disabled}
              >
                {isListening ? (
                  <>
                    <MicOff size={13} />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic size={13} />
                    <span>Dictate</span>
                  </>
                )}
              </button>
            </div>
          )}
          <span className="char-count">{value.length}/2000</span>
        </div>
      </div>

      {notice && (
        <div className="dictate-notice-banner animate-fade-in">
          <AlertCircle size={13} className="shrink-0 text-amber-400" />
          <span>{notice}</span>
        </div>
      )}

      <div className="textarea-wrapper">
        <textarea
          className={`words-textarea ${isStage5 ? 'stage-5-textarea' : ''}`}
          rows={isStage5 ? 4 : 2}
          placeholder={
            isStage5
              ? "Capture their exact words about goals, bottlenecks, or obstacles... (e.g. want to grow exports, plant running at sixty percent)"
              : "Capture what the prospect actually said in their own words..."
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={2000}
        />
      </div>

      {isStage5 && (
        <div className="stage-5-guarantee">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Verbatim capture: exact prospect words are permanently preserved and never rewritten by AI.</span>
        </div>
      )}
    </div>
  );
}
