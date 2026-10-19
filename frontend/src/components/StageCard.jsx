import React from 'react';
import { HelpCircle, AlertTriangle } from 'lucide-react';

export default function StageCard({ stage }) {
  if (!stage) return null;

  return (
    <div className="stage-card">
      <div className="stage-card-header">
        <h2 className="stage-card-title">{stage.name}</h2>
        <p className="stage-card-purpose">{stage.purpose}</p>
      </div>

      <div className="they-may-say-section">
        <div className="section-label-row">
          <span className="section-label">They may say</span>
        </div>
        <ul className="they-may-say-list">
          {(stage.likely_statements || []).map((stmt, idx) => (
            <li key={idx} className="they-may-say-item">
              <span className="bullet">·</span>
              <span className="quote-text">{stmt}</span>
            </li>
          ))}
        </ul>
      </div>

      {stage.watch_out && (
        <div className="watch-out-tip">
          <AlertTriangle size={14} className="watch-out-icon" />
          <span><strong>Watch-out:</strong> {stage.watch_out}</span>
        </div>
      )}
    </div>
  );
}
