import React from 'react';
import { Check, CornerDownRight } from 'lucide-react';

export default function TapButtons({
  stageNumber,
  outcomes = [],
  selectedTap,
  onSelectTap,
  onShortcutClose
}) {
  const isStage1 = stageNumber === 1;
  const isStage6 = stageNumber === 6;

  // Classify Stage 6 objections as deflection or hard no
  const getObjectionTag = (tap) => {
    if (!tap) return null;
    if (tap.toLowerCase().includes('not interested')) {
      return { text: 'Hard no', className: 'tag-hard-no' };
    }
    return { text: 'Deflection', className: 'tag-deflection' };
  };

  const objectionTag = isStage6 && selectedTap ? getObjectionTag(selectedTap) : null;

  return (
    <div className="what-happened-section">
      <div className="section-label-row">
        <span className="section-label">What happened</span>
        {objectionTag && (
          <span className={`objection-badge ${objectionTag.className}`}>
            Tag: {objectionTag.text}
          </span>
        )}
      </div>

      <div className="tap-grid">
        {outcomes.map((tap, idx) => {
          const isSelected = selectedTap === tap;
          return (
            <button
              key={idx}
              type="button"
              className={`tap-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectTap(tap)}
            >
              {isSelected && <Check size={14} className="tap-check-icon" />}
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
