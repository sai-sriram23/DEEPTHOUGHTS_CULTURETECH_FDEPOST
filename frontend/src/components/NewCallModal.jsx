import React, { useState } from 'react';
import { X, PhoneCall, Sparkles, Building2, User } from 'lucide-react';

const PRESETS = [
  { prospect: 'Dr. Anjali Menon', company: 'Menon Family Clinic', note: 'Reference case study' },
  { prospect: 'Dr. Rao', company: 'Sunrise Dental', note: 'Agreed next step' },
  { prospect: 'Reception', company: 'Lotus Skin Clinic', note: 'Opening gatekeeper' },
  { prospect: 'Dr. Fernandes', company: 'Harbour Physio', note: 'Accountant objection' },
  { prospect: 'Mr. Iyer', company: 'Iyer Eye Care', note: 'Their need on WhatsApp' },
  { prospect: 'Arvind Sharma', company: 'Sharma Precision Components', note: 'Standard manufacturing' }
];

export default function NewCallModal({ isOpen, onClose, onStartCall, isStarting }) {
  const [prospect, setProspect] = useState('Dr. Anjali Menon');
  const [company, setCompany] = useState('Menon Family Clinic');

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
            <span className="modal-subtitle">Launch companion beside your dialer</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isStarting}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="new-call-form">
          <div className="form-group">
            <label className="form-label" htmlFor="prospect-input">
              <User size={14} className="inline mr-1 text-slate-500" />
              Prospect Name <span className="text-red-500">*</span>
            </label>
            <input
              id="prospect-input"
              type="text"
              className="form-input"
              placeholder="e.g. Dr. Anjali Menon"
              value={prospect}
              onChange={(e) => setProspect(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="company-input">
              <Building2 size={14} className="inline mr-1 text-slate-500" />
              Company / Clinic Name
            </label>
            <input
              id="company-input"
              type="text"
              className="form-input"
              placeholder="e.g. Menon Family Clinic"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          {/* Quick presets matching screenshot cases */}
          <div className="presets-section">
            <span className="presets-label">
              <Sparkles size={12} className="text-amber-500 inline mr-1" />
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
              <PhoneCall size={14} />
              <span>{isStarting ? 'Starting...' : 'Begin Call'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
