import React from 'react';
import { Check } from 'lucide-react';

export default function StageRail({ currentStage, completedStages = {}, onSelectStage }) {
  const stages = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="stage-rail-container">
      <div className="stage-rail-header">
        <span className="stage-rail-steps-track">
          {stages.map((stageNum) => {
            const isActive = stageNum === currentStage;
            const isCompleted = completedStages[stageNum];
            return (
              <button
                key={stageNum}
                type="button"
                className={`stage-pill ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => onSelectStage && onSelectStage(stageNum)}
                title={`Stage ${stageNum}`}
                aria-label={`Go to Stage ${stageNum}`}
              >
                {isCompleted && !isActive ? <Check size={12} strokeWidth={3} /> : stageNum}
              </button>
            );
          })}
        </span>
        <span className="stage-rail-counter">Stage {currentStage} of 8</span>
      </div>
    </div>
  );
}
