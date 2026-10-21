import React from 'react';

export default function StageRail({ currentStage, completedStages = {}, onSelectStage }) {
  const stages = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="stage-rail-container">
      <div className="stage-rail-track">
        {stages.map((stageNum) => {
          const isActive = stageNum === currentStage;
          const isCompleted = completedStages[stageNum] || stageNum < currentStage;

          let stageClass = 'upcoming';
          if (isActive) {
            stageClass = 'active';
          } else if (isCompleted) {
            stageClass = 'completed';
          }

          return (
            <button
              key={stageNum}
              type="button"
              className={`stage-box-btn ${stageClass}`}
              onClick={() => onSelectStage && onSelectStage(stageNum)}
              title={`Stage ${stageNum}`}
              aria-label={`Go to Stage ${stageNum}`}
            >
              {stageNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
