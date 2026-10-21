import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NextAndEnd({
  currentStage,
  nextStageName,
  onNext,
  onBack,
  onEndCall,
  isSaving = false
}) {
  const isFinalStage = currentStage === 8;

  let nextLabel = 'NEXT';
  if (isFinalStage) {
    nextLabel = 'PROCEED TO CLOSE';
  } else if (nextStageName) {
    nextLabel = `NEXT: ${nextStageName.toUpperCase()}`;
  } else {
    nextLabel = `NEXT: STAGE ${currentStage + 1}`;
  }

  return (
    <div className="next-and-end-container">
      {currentStage > 1 && (
        <div className="back-step-row">
          <button
            type="button"
            className="btn-back-step"
            onClick={onBack}
            disabled={isSaving}
          >
            <ArrowLeft size={13} />
            <span>Back to Stage {currentStage - 1}</span>
          </button>
        </div>
      )}

      <div className="action-buttons-row">
        <button
          type="button"
          className="btn-primary-next"
          onClick={onNext}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin inline mr-2" />
              <span>SAVING...</span>
            </>
          ) : (
            <span>{nextLabel}</span>
          )}
        </button>

        <button
          type="button"
          className="btn-secondary-end"
          onClick={onEndCall}
          disabled={isSaving}
        >
          <span>END CALL</span>
        </button>
      </div>
    </div>
  );
}
