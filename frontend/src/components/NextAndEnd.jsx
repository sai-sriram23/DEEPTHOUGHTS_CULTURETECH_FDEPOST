import React from 'react';
import { ArrowLeft, ArrowRight, PhoneOff, Loader2 } from 'lucide-react';

export default function NextAndEnd({
  currentStage,
  nextStageName,
  onNext,
  onBack,
  onEndCall,
  isSaving = false
}) {
  const isFinalStage = currentStage === 8;

  return (
    <div className="next-and-end-bar">
      <div className="nav-left-group">
        {currentStage > 1 && (
          <button
            type="button"
            className="nav-btn-back"
            onClick={onBack}
            disabled={isSaving}
            title="Go back to previous stage"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
      </div>

      <div className="nav-right-group">
        <button
          type="button"
          className="btn-end-call"
          onClick={onEndCall}
          disabled={isSaving}
          title="End this call immediately from any stage"
        >
          <PhoneOff size={15} />
          <span>End call</span>
        </button>

        <button
          type="button"
          className="btn-next-stage"
          onClick={onNext}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>{isFinalStage ? 'Proceed to Close' : `Next: ${nextStageName || 'Stage ' + (currentStage + 1)}`}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
