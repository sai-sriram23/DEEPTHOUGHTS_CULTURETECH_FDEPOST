import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Phone,
  Mail,
  Send,
  Loader2,
  BookmarkCheck
} from 'lucide-react';

const OUTCOME_OPTIONS = [
  { value: 'agreed_to_receive_report', label: 'Agreed to receive report', group: 'Positive' },
  { value: 'next_step_agreed', label: 'Next step agreed (meeting/call)', group: 'Positive' },
  { value: 'interested', label: 'Interested (general)', group: 'Positive' },
  { value: 'follow_up', label: 'Follow up required', group: 'Positive' },
  { value: 'call_again', label: 'Call again (line/language issue)', group: 'Follow-up' },
  { value: 'not_interested', label: 'Not interested (declined)', group: 'Negative' },
  { value: 'do_not_call', label: 'Do not call', group: 'Negative' },
  { value: 'wrong_person', label: 'Wrong person reached', group: 'Dead-end' },
  { value: 'moved_company', label: 'Moved company / Left', group: 'Dead-end' },
  { value: 'not_logged', label: 'Not logged (no clear outcome)', group: 'Unresolved' }
];

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

export default function CloseDialog({
  isOpen,
  currentStage,
  stage5Words = '',
  stageResults = [],
  onClose,
  onSaveCall,
  isSubmitting = false
}) {
  if (!isOpen) return null;

  const [endedStage, setEndedStage] = useState(currentStage || 1);
  const [outcome, setOutcome] = useState('not_logged');
  const [nextStepType, setNextStepType] = useState('none');
  const [channel, setChannel] = useState('');
  const [whenTime, setWhenTime] = useState('');
  const [proposedBy, setProposedBy] = useState('unclear');
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  // Sync initial endedStage if currentStage changes
  useEffect(() => {
    setEndedStage(currentStage || 1);
  }, [currentStage]);

  // Evaluate pre-save confirmation checks (§7.4)
  const allWords = [
    stage5Words,
    ...stageResults.map(r => `${r.prospect_words || ''} ${r.what_happened || ''}`)
  ].join(' ').toLowerCase();

  const mentionsChannelOrTime = /whatsapp|email|mail|tuesday|wednesday|thursday|friday|monday|tomorrow|after\s+\w+|call\s+at|\d{1,2}(:\d{2})?\s*(am|pm)/i.test(allWords);
  const mentionsExplicitDNC = /do\s+not\s+call|don'?t\s+call|remove\s+my\s+number|stop\s+calling|never\s+call|block/i.test(allWords);
  const isPositiveOutcome = ['agreed_to_receive_report', 'next_step_agreed', 'interested', 'follow_up'].includes(outcome);

  let activeWarning = null;

  if (outcome === 'not_logged' && (nextStepType !== 'none' || mentionsChannelOrTime)) {
    activeWarning = {
      id: 'not_logged_with_step',
      message: 'You noted a channel, time, or agreed step in this call. Would you like to log it as a next step instead of "not logged"?'
    };
  } else if (outcome === 'do_not_call' && !mentionsExplicitDNC) {
    activeWarning = {
      id: 'dnc_without_request',
      message: 'The prospect gave a deflection or refusal, but did not explicitly say "do not call". Keep do-not-call?'
    };
  } else if (isPositiveOutcome && nextStepType === 'none') {
    activeWarning = {
      id: 'positive_without_step',
      message: `A positive outcome (${outcome.replace(/_/g, ' ')}) is selected with no next step. Would you like to specify one?`
    };
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextStepData = nextStepType === 'none' ? null : {
      type: nextStepType,
      channel: channel || null,
      when: whenTime || null,
      proposed_by: proposedBy
    };

    onSaveCall({
      ended_stage: Number(endedStage),
      outcome,
      next_step: nextStepData
    });
  };

  return (
    <div className="modal-overlay animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-dialog close-dialog-card">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">End Call & Record Outcome</h3>
            <span className="modal-subtitle">Confirm final stage reached and record call outcome</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="close-form">
          {/* Stage reached selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="ended-stage-select">Stage reached</label>
            <select
              id="ended-stage-select"
              className="form-select"
              value={endedStage}
              onChange={(e) => setEndedStage(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Stage {s}: {STAGE_NAMES[s]} {s === currentStage ? '(current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Outcome dropdown */}
          <div className="form-group">
            <label className="form-label" htmlFor="outcome-select">
              Logged Outcome <span className="text-red-400">*</span>
            </label>
            <select
              id="outcome-select"
              className="form-select"
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value);
                setWarningAcknowledged(false);
              }}
              required
            >
              {OUTCOME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.group})
                </option>
              ))}
            </select>
          </div>

          {/* Next Step Section */}
          <div className="form-group next-step-fieldset">
            <label className="form-label">Next Step</label>
            <div className="chip-row">
              {['none', 'document', 'call', 'meeting', 'referral'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`chip-btn ${nextStepType === type ? 'active' : ''}`}
                  onClick={() => setNextStepType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {nextStepType !== 'none' && (
              <div className="next-step-details animate-fade-in">
                <div className="detail-row">
                  <div className="detail-col">
                    <label className="sub-label">Channel</label>
                    <select
                      className="form-select-sm"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                    >
                      <option value="">Select channel...</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone call</option>
                    </select>
                  </div>

                  <div className="detail-col">
                    <label className="sub-label">When / Timing</label>
                    <input
                      type="text"
                      className="form-input-sm"
                      placeholder="e.g. Tue after 2pm"
                      value={whenTime}
                      onChange={(e) => setWhenTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="detail-row proposed-row">
                  <label className="sub-label">Who proposed it:</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="proposed_by"
                        value="them"
                        checked={proposedBy === 'them'}
                        onChange={() => setProposedBy('them')}
                      />
                      <span>Them (prospect)</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="proposed_by"
                        value="us"
                        checked={proposedBy === 'us'}
                        onChange={() => setProposedBy('us')}
                      />
                      <span>Us (caller)</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="proposed_by"
                        value="unclear"
                        checked={proposedBy === 'unclear'}
                        onChange={() => setProposedBy('unclear')}
                      />
                      <span>Unclear</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verbatim Stage 5 Need Words Reminder */}
          <div className="verbatim-need-box">
            <div className="verbatim-label">
              <BookmarkCheck size={14} className="text-emerald-400" />
              <span>Their need (Stage 5 captured words)</span>
            </div>
            <div className="verbatim-content">
              {stage5Words && stage5Words.trim() ? (
                <p className="verbatim-text">"{stage5Words.trim()}"</p>
              ) : (
                <p className="verbatim-empty">No verbatim words captured at Stage 5.</p>
              )}
            </div>
          </div>

          {/* Active Consistency Confirmation Banner */}
          {activeWarning && (
            <div className="consistency-warning-banner animate-fade-in">
              <AlertTriangle size={18} className="warning-icon" />
              <div className="warning-text">
                <strong>Consistency check:</strong> {activeWarning.message}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-save"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Call & Analyzing...</span>
                </>
              ) : (
                <span>Save Call</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
