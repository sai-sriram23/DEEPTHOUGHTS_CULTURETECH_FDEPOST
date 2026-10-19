import React, { useState } from 'react';
import WhereCallsEndStrip from '../components/WhereCallsEndStrip';
import CallDetailModal from '../components/CallDetailModal';
import {
  PhoneCall,
  RefreshCw,
  Building,
  Clock,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Inbox
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

export default function CallList({
  calls = [],
  isLoading = false,
  onRefresh,
  onOpenNewCall,
  onSelectCall
}) {
  const [selectedStageFilter, setSelectedStageFilter] = useState(null);
  const [activeCallDetail, setActiveCallDetail] = useState(null);

  // Apply stage filter if selected
  const filteredCalls = selectedStageFilter
    ? calls.filter(c => (c.ended_stage || c.current_stage || 1) === selectedStageFilter)
    : calls;

  const handleRowClick = async (call) => {
    if (onSelectCall) {
      const fullDetail = await onSelectCall(call.id);
      setActiveCallDetail(fullDetail || call);
    } else {
      setActiveCallDetail(call);
    }
  };

  const formatCallTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Today ${timeStr}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
  };

  return (
    <div className="call-list-layout animate-fade-in">
      {/* Top Header */}
      <header className="call-list-header">
        <div className="header-meta">
          <span className="brand-tag">Meridian Growth Partners · past calls</span>
          <h1 className="list-title">Call History & Outcomes</h1>
          <span className="calls-count-badge">
            {calls.length} {calls.length === 1 ? 'call' : 'calls'} recorded
          </span>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh from persisted database"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-new-call"
            onClick={onOpenNewCall}
          >
            <PhoneCall size={15} />
            <span>New Call</span>
          </button>
        </div>
      </header>

      {/* Where Calls End Distribution Strip */}
      <WhereCallsEndStrip
        calls={calls}
        selectedStageFilter={selectedStageFilter}
        onSelectFilter={setSelectedStageFilter}
      />

      {/* Calls List */}
      <div className="calls-list-container">
        {filteredCalls.length === 0 ? (
          <div className="empty-state-box">
            <Inbox size={36} className="empty-state-icon" />
            <h3 className="empty-title">
              {selectedStageFilter ? `No calls ended at Stage ${selectedStageFilter}` : 'No calls yet'}
            </h3>
            <p className="empty-subtitle">
              {selectedStageFilter
                ? 'Try clearing the filter or start a new call.'
                : 'Start a call beside your dialer to track stages and capture prospect needs.'}
            </p>
            {!selectedStageFilter && (
              <button type="button" className="btn-new-call mt-3" onClick={onOpenNewCall}>
                <PhoneCall size={15} />
                <span>Start First Call</span>
              </button>
            )}
          </div>
        ) : (
          <div className="calls-cards-grid">
            {filteredCalls.map((call) => {
              const stageNum = call.ended_stage || call.current_stage || 1;
              const stageName = STAGE_NAMES[stageNum] || `Stage ${stageNum}`;
              const hasMismatch = Boolean(call.outcome_flag);

              return (
                <div
                  key={call.id}
                  className={`call-card-row ${hasMismatch ? 'has-mismatch-flag' : ''}`}
                  onClick={() => handleRowClick(call)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleRowClick(call)}
                >
                  <div className="call-card-left">
                    <div className="call-card-identity">
                      <span className="call-prospect-name">{call.prospect}</span>
                      {call.company && (
                        <span className="call-company-name">
                          <Building size={12} className="inline mr-1" />
                          {call.company}
                        </span>
                      )}
                    </div>

                    {/* One line summary note */}
                    <p className="call-summary-note">
                      {call.summary || (call.ended_at ? `Ended at ${stageName}.` : 'Call in progress...')}
                    </p>

                    <div className="call-card-footer-meta">
                      <span className="stage-pill-tag">
                        {stageName} (Stage {stageNum})
                      </span>
                      <span className={`outcome-pill-sm outcome-${call.outcome || 'not_logged'}`}>
                        {(call.outcome || 'in progress').replace(/_/g, ' ')}
                      </span>
                      {hasMismatch && (
                        <span className="mismatch-dot-indicator" title={call.outcome_flag}>
                          <span className="dot-pulse" />
                          <span>Outcome Mismatch</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="call-card-right">
                    <span className="call-timestamp">
                      <Clock size={12} className="inline mr-1" />
                      {formatCallTime(call.started_at)}
                    </span>
                    <ChevronRight size={18} className="chevron-icon" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Call Detail Modal */}
      <CallDetailModal
        call={activeCallDetail}
        onClose={() => setActiveCallDetail(null)}
      />
    </div>
  );
}
