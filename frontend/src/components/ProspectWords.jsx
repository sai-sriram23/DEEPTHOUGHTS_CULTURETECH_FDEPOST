import React from 'react';
import { MessageSquare, ShieldCheck } from 'lucide-react';

export default function ProspectWords({
  stageNumber,
  value = '',
  onChange,
  disabled = false
}) {
  const isStage5 = stageNumber === 5;

  return (
    <div className={`prospect-words-section ${isStage5 ? 'stage-5-focus' : ''}`}>
      <div className="section-label-row">
        <span className="section-label">
          Their words
          {isStage5 && <span className="highlight-tag">Focus: Verbatim Need</span>}
        </span>
        <span className="char-count">{value.length}/2000</span>
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
