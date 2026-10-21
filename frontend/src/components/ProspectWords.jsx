import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mic, MicOff, Languages, AlertCircle } from 'lucide-react';

export default function ProspectWords({
  stageNumber,
  value = '',
  onChange,
  disabled = false,
  prospectName = ''
}) {
  const isStage5 = stageNumber === 5;
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [lang, setLang] = useState('en-IN'); // Indian English default, or hi-IN
  const [notice, setNotice] = useState(null);

  const recognitionRef = useRef(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  // Determine pronoun label: HER WORDS / HIS WORDS / THEIR WORDS
  const nameLower = prospectName.toLowerCase();
  let wordsLabel = 'THEIR WORDS';
  if (nameLower.includes('anjali') || nameLower.includes('she') || nameLower.includes('ms.') || nameLower.includes('mrs.')) {
    wordsLabel = 'HER WORDS';
  } else if (nameLower.includes('mr.') || nameLower.includes('arvind') || nameLower.includes('rajesh') || nameLower.includes('iyer')) {
    wordsLabel = 'HIS WORDS';
  }

  // Keep refs synchronized with props
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
    <div className="her-words-block">
      <div className="words-header-row">
        <span className="section-label-header">{wordsLabel}</span>

        <div className="words-voice-tools">
          {speechSupported && (
            <div className="voice-buttons-group">
              <button
                type="button"
                className="voice-lang-btn"
                onClick={toggleLang}
                title="Switch voice language"
              >
                <Languages size={11} className="inline mr-1" />
                <span>{lang === 'en-IN' ? 'EN-IN' : 'HI-IN'}</span>
              </button>

              <button
                type="button"
                className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                title={isListening ? 'Stop listening' : 'Start voice dictation'}
                disabled={disabled}
              >
                {isListening ? (
                  <>
                    <MicOff size={12} />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic size={12} />
                    <span>Dictate</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div className="dictate-notice-banner animate-fade-in">
          <AlertCircle size={13} className="shrink-0 text-amber-500" />
          <span>{notice}</span>
        </div>
      )}

      <div className="words-input-wrapper">
        <textarea
          className="her-words-textarea"
          rows={3}
          placeholder={
            isStage5
              ? "Capture their exact words about goals, bottlenecks, or obstacles... (e.g. export margin drop, rejection rate is twelve percent)"
              : "accounting for what, we already have a CA who files everything"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={2000}
        />
      </div>

      {isStage5 && (
        <div className="stage-5-guarantee">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Verbatim capture: exact prospect words are permanently preserved and never rewritten by AI.</span>
        </div>
      )}
    </div>
  );
}
