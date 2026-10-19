import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mic, MicOff, Languages } from 'lucide-react';

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
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = lang;

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript.trim()) {
          const newText = value ? `${value.trim()} ${transcript.trim()}` : transcript.trim();
          onChange(newText.slice(0, 2000));
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [lang, value, onChange]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  const toggleLang = () => {
    const nextLang = lang === 'en-IN' ? 'hi-IN' : 'en-IN';
    setLang(nextLang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = nextLang;
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
