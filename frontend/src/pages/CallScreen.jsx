import React, { useState, useEffect, useRef } from 'react';
import StageRail from '../components/StageRail';
import StageCard from '../components/StageCard';
import TapButtons from '../components/TapButtons';
import ProspectWords from '../components/ProspectWords';
import NextAndEnd from '../components/NextAndEnd';
import CloseDialog from '../components/CloseDialog';
import { Phone, Clock, AlertCircle } from 'lucide-react';

export default function CallScreen({
  call,
  stages = [],
  onCallSaved,
  onCancelCall,
  onSaveStage,
  onCloseCall
}) {
  const [currentStageNum, setCurrentStageNum] = useState(call?.current_stage || 1);
  const [stageData, setStageData] = useState({}); // { [stageNum]: { tap: string, words: string } }
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer since call started
  useEffect(() => {
    const startTime = call?.started_at ? new Date(call.started_at).getTime() : Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [call?.started_at]);

  const formatTimer = (totalSec) => {
    const m = Math.floor(Math.max(totalSec, 0) / 60);
    const s = Math.max(totalSec, 0) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find active stage object
  const currentStageObj = stages.find(s => s.stage_number === currentStageNum) || stages[0];
  const nextStageObj = stages.find(s => s.stage_number === currentStageNum + 1);

  // Get current state for this stage
  const currentTap = stageData[currentStageNum]?.tap || '';
  const currentWords = stageData[currentStageNum]?.words || '';

  const handleSelectTap = (tap) => {
    setStageData(prev => ({
      ...prev,
      [currentStageNum]: {
        ...(prev[currentStageNum] || {}),
        tap: prev[currentStageNum]?.tap === tap ? '' : tap
      }
    }));
  };

  const handleWordsChange = (text) => {
    setStageData(prev => ({
      ...prev,
      [currentStageNum]: {
        ...(prev[currentStageNum] || {}),
        words: text
      }
    }));
  };

  // Save current stage before advancing
  const handleNextStage = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      if (onSaveStage) {
        await onSaveStage(call.id, currentStageNum, currentTap, currentWords);
      }
      if (currentStageNum < 8) {
        setCurrentStageNum(prev => prev + 1);
      } else {
        // At stage 8, "Proceed to Close" opens the close dialog
        setIsCloseDialogOpen(true);
      }
    } catch (err) {
      setErrorMessage(`Failed to save stage: ${err.message}. Your notes are preserved.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackStage = () => {
    if (currentStageNum > 1) {
      setCurrentStageNum(prev => prev - 1);
    }
  };

  // Immediate shortcut close from Stage 1 (wrong person / moved company)
  const handleStage1Shortcut = async (outcomeKey) => {
    setIsSaving(true);
    try {
      if (onSaveStage) {
        await onSaveStage(call.id, 1, currentTap, currentWords);
      }
      await onCloseCall(call.id, 1, outcomeKey, null);
    } catch (err) {
      setErrorMessage(`Could not close call: ${err.message}`);
      setIsSaving(false);
    }
  };

  const handleSaveCloseCall = async (closeData) => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      // First ensure current stage is saved
      if (onSaveStage && (currentTap || currentWords)) {
        await onSaveStage(call.id, currentStageNum, currentTap, currentWords);
      }
      await onCloseCall(call.id, closeData.ended_stage, closeData.outcome, closeData.next_step);
      setIsCloseDialogOpen(false);
    } catch (err) {
      setErrorMessage(`Failed to close call: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Extract all stage results formatted for CloseDialog
  const stageResultsList = Object.entries(stageData).map(([sNum, d]) => ({
    stage_number: Number(sNum),
    what_happened: d.tap,
    prospect_words: d.words
  }));

  const stage5Words = stageData[5]?.words || '';

  return (
    <div className="call-screen-layout animate-fade-in">
      {/* Dialer Companion Live Header */}
      <header className="call-screen-header">
        <div className="header-top-row">
          <span className="company-guide-tag">Meridian Growth Partners · call guide</span>
          <span className="live-timer-badge">
            <Clock size={13} className="timer-icon" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </span>
        </div>

        <div className="prospect-header-card">
          <h1 className="prospect-name">{call?.prospect || 'Prospect'}</h1>
          <div className="prospect-meta">
            <span className="company-text">{call?.company || 'Indian Business'}</span>
            <span className="meta-dot">·</span>
            <span className="first-call-tag">first call</span>
          </div>
        </div>
      </header>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="call-screen-error-banner animate-fade-in">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stage Rail Navigation */}
      <StageRail
        currentStage={currentStageNum}
        completedStages={Object.keys(stageData).reduce((acc, k) => {
          if (stageData[k]?.tap || stageData[k]?.words) acc[k] = true;
          return acc;
        }, {})}
        onSelectStage={(s) => setCurrentStageNum(s)}
      />

      {/* Active Stage Card (Purpose + 3 Statements + Watchout) */}
      <StageCard stage={currentStageObj} />

      {/* What Happened: Exactly 4 quick taps */}
      <TapButtons
        stageNumber={currentStageNum}
        outcomes={currentStageObj?.quick_outcomes || []}
        selectedTap={currentTap}
        onSelectTap={handleSelectTap}
        onShortcutClose={handleStage1Shortcut}
      />

      {/* Their Words: Exactly 1 free text box on the live screen */}
      <ProspectWords
        stageNumber={currentStageNum}
        value={currentWords}
        onChange={handleWordsChange}
        disabled={isSaving}
      />

      {/* Navigation Footer (Back, Next Stage, End Call on every stage) */}
      <NextAndEnd
        currentStage={currentStageNum}
        nextStageName={nextStageObj?.name}
        onNext={handleNextStage}
        onBack={handleBackStage}
        onEndCall={() => setIsCloseDialogOpen(true)}
        isSaving={isSaving}
      />

      {/* Close Call Dialog */}
      <CloseDialog
        isOpen={isCloseDialogOpen}
        currentStage={currentStageNum}
        stage5Words={stage5Words}
        stageResults={stageResultsList}
        onClose={() => setIsCloseDialogOpen(false)}
        onSaveCall={handleSaveCloseCall}
        isSubmitting={isSaving}
      />
    </div>
  );
}
