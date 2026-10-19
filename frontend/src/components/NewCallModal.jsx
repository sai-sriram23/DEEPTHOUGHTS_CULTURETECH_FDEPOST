import React, { useState } from 'react';
import { X, PhoneCall, Sparkles, Building2, User } from 'lucide-react';

const PRESETS = [
  { prospect: 'Arvind Sharma', company: 'Sharma Precision Components', note: 'Standard pitch & next step' },
  { prospect: 'Reception / Switchboard', company: 'Orbit Fasteners', note: 'Early gatekeeper test' },
  { prospect: 'Rajesh Mehra', company: 'Kalyx Enterprises', note: 'Objection & deflection test' }
];

export default function NewCallModal({ isOpen, onClose, onStartCall, isStarting }) {
  const [prospect, setProspect] = useState('');
  const [company, setCompany] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prospect.trim()) return;
    onStartCall(prospect.trim(), company.trim());
  };

  const handleSelectPreset = (p) => {
    setProspect(p.prospect);
    setCompany(p.company);
  };

  return (
    <div className="modal-overlay animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-dialog new-call-dialog">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Start New Cold Call</h3>
            <span className="modal-subtitle">Initialize call session beside your dialer</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isStarting}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="new-call-form">
          <div className="form-group">
            <label className="form-label" htmlFor="prospect-input">
              <User size={14} className="inline mr-1" />
              Prospect Name <span className="text-red-400">*</span>
            </label>
            <input
              id="prospect-input"
              type="text"
              className="form-input"
              placeholder="e.g. Arvind Sharma or Reception"
              value={prospect}
              onChange={(e) => setProspect(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="company-input">
              <Building2 size={14} className="inline mr-1" />
              Company Name (optional)
            </label>
            <input
              id="company-input"
              type="text"
              className="form-input"
              placeholder="e.g. Sharma Precision Components"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          {/* Quick presets for swift testing/demo */}
          <div className="presets-section">
            <span className="presets-label">
              <Sparkles size={12} className="text-amber-400 inline mr-1" />
              Quick Demo Presets:
            </span>
            <div className="presets-list">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-chip"
                  onClick={() => handleSelectPreset(p)}
                >
                  <span className="preset-name">{p.prospect}</span>
                  <span className="preset-co">({p.company})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isStarting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-start"
              disabled={!prospect.trim() || isStarting}
            >
              <PhoneCall size={15} />
              <span>{isStarting ? 'Connecting...' : 'Begin Call'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
