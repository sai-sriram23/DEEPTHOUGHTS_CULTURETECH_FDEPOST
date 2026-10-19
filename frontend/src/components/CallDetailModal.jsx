import React from 'react';
import {
  X,
  Clock,
  Building,
  User,
  Sparkles,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';

const STAGE_NAMES = {
  1: 'Opening',
  2: 'Purpose',
  3: 'Permission',
  4: 'Their business',
  5: 'Their need, in their words',
  6: 'Objection',
  7: 'Next step',
  8: 'Close'
};

export default function CallDetailModal({ call, onClose }) {
  if (!call) return null;

  const stageResults = call.stage_results || [];

  return (
    <div className="modal-overlay animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-dialog call-detail-card">
        <div className="modal-header">
          <div>
            <div className="modal-title-row">
              <h3 className="modal-title">{call.prospect}</h3>
              <span className={`outcome-pill outcome-${call.outcome || 'not_logged'}`}>
                {(call.outcome || 'in progress').replace(/_/g, ' ')}
              </span>
            </div>
            <div className="modal-subtitle-row">
              <span className="subtitle-item">
                <Building size={14} />
                {call.company || 'Private Company'}
              </span>
              <span className="subtitle-item">
                <Clock size={14} />
                {new Date(call.started_at).toLocaleString()}
              </span>
              <span className="stage-reached-badge">
                Stage {call.ended_stage || call.current_stage || 1} reached
              </span>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="call-detail-body">
          {/* Consistency Alert if mismatch was detected */}
          {call.outcome_flag && (
            <div className="detail-mismatch-alert">
              <AlertTriangle size={18} className="text-amber-400 shrink-0" />
              <div>
                <strong>Consistency check flagged:</strong>
                <p>{call.outcome_flag}</p>
              </div>
            </div>
          )}

          {/* AI Call Summary */}
          {call.summary && (
            <div className="detail-summary-card">
              <div className="summary-card-header">
                <Sparkles size={16} className="text-indigo-400" />
                <span className="summary-title">One-Line Call Summary (LLM)</span>
              </div>
              <p className="summary-text">{call.summary}</p>
            </div>
          )}

          {/* Next Step Information if recorded */}
          {call.next_step && call.next_step.type && call.next_step.type !== 'none' && (
            <div className="detail-next-step-card">
              <div className="next-step-header">
                <Calendar size={15} className="text-sky-400" />
                <span className="next-step-title">Agreed Next Step: {call.next_step.type}</span>
              </div>
              <div className="next-step-meta">
                {call.next_step.channel && <span>Channel: <strong>{call.next_step.channel}</strong></span>}
                {call.next_step.when && <span>When: <strong>{call.next_step.when}</strong></span>}
                {call.next_step.proposed_by && <span>Proposed by: <strong>{call.next_step.proposed_by}</strong></span>}
              </div>
            </div>
          )}

          {/* Stage-by-Stage History */}
          <div className="stage-results-section">
            <h4 className="stage-results-heading">Stage-by-Stage Transcript Record</h4>
            {stageResults.length === 0 ? (
              <p className="no-stages-text">No intermediate stages were saved for this call.</p>
            ) : (
              <div className="stage-results-list">
                {stageResults.map((res) => {
                  const sName = STAGE_NAMES[res.stage_number] || `Stage ${res.stage_number}`;
                  return (
                    <div key={res.id || res.stage_number} className="stage-result-item">
                      <div className="stage-item-top">
                        <span className="stage-item-number">Stage {res.stage_number}</span>
                        <span className="stage-item-name">{sName}</span>
                        {res.what_happened && (
                          <span className="stage-item-tap-badge">
                            Tap: {res.what_happened}
                          </span>
                        )}
                      </div>
                      {res.prospect_words ? (
                        <div className="stage-item-words">
                          <span className="words-label">Prospect's words:</span>
                          <span className="words-content">"{res.prospect_words}"</span>
                        </div>
                      ) : (
                        <div className="stage-item-words empty">
                          <span className="words-content">(No free-text recorded)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-modal-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
