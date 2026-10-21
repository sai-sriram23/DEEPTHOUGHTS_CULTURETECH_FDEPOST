import React from 'react';
import { CornerDownRight } from 'lucide-react';

export default function TapButtons({
  stageNumber,
  outcomes = [],
  selectedTap,
  onSelectTap,
  onShortcutClose
}) {
  const isStage1 = stageNumber === 1;

  return (
    <div className="what-happened-block">
      <div className="section-label-header">
        WHAT HAPPENED
      </div>

      <div className="tap-grid-2x2">
        {outcomes.map((tap, idx) => {
          const isSelected = selectedTap === tap;
          return (
            <button
              key={idx}
              type="button"
              className={`tap-option-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectTap(tap)}
            >
              <span>{tap}</span>
            </button>
          );
        })}
      </div>

      {/* Stage 1 Shortcut for quick exit if wrong person reached */}
      {isStage1 && selectedTap === "Wrong person or left" && (
        <div className="stage-shortcut-banner animate-fade-in">
          <span>Wrong person or left the company?</span>
          <div className="shortcut-actions">
            <button
              type="button"
              className="shortcut-pill-btn"
              onClick={() => onShortcutClose('wrong_person')}
            >
              <CornerDownRight size={13} />
              Close as Wrong Person
            </button>
            <button
              type="button"
              className="shortcut-pill-btn secondary"
              onClick={() => onShortcutClose('moved_company')}
            >
              <CornerDownRight size={13} />
              Close as Moved Company
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
