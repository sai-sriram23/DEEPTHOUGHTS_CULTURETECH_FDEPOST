import React, { useState } from 'react';
import WhereCallsEndStrip from '../components/WhereCallsEndStrip';
import CallDetailModal from '../components/CallDetailModal';
import {
  PhoneCall,
  RefreshCw,
  AlertTriangle,
  Inbox
} from 'lucide-react';

const STAGE_NAMES = {
  1: 'Opening',
  2: 'Purpose',
  3: 'Permission',
  4: 'Their business',
  5: 'Their need',
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
    if (!isoString) return 'Today 11:40';
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    return isToday ? `Today ${timeStr}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
  };

  return (
    <div className="call-list-screen animate-fade-in">
      {/* Top Header */}
      <header className="call-list-header-bar">
        <div className="header-meta-group">
          <span className="brand-uppercase-tag">CLINICBOOKS · PAST CALLS</span>
          <h1 className="list-main-title">Call History & Outcomes</h1>
          <span className="calls-count-text">
            {calls.length} {calls.length === 1 ? 'call' : 'calls'} logged
          </span>
        </div>

        <div className="header-action-buttons">
          <button
            type="button"
            className="btn-header-refresh"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh calls"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-header-new-call"
            onClick={onOpenNewCall}
          >
            <PhoneCall size={14} />
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

      {/* Calls Table / List Container matching Screenshot 3 */}
      <div className="calls-table-container">
        {filteredCalls.length === 0 ? (
          <div className="empty-state-card">
            <Inbox size={36} className="text-slate-400" />
            <h3 className="empty-state-title">
              {selectedStageFilter ? `No calls ended at Stage ${selectedStageFilter}` : 'No calls recorded yet'}
            </h3>
            <p className="empty-state-desc">
              {selectedStageFilter
                ? 'Try selecting another stage or clear the filter.'
                : 'Click "New Call" to start your first call beside the phone.'}
            </p>
            {!selectedStageFilter && (
              <button type="button" className="btn-header-new-call mt-2" onClick={onOpenNewCall}>
                <PhoneCall size={14} />
                <span>Start First Call</span>
              </button>
            )}
          </div>
        ) : (
          <div className="calls-table-rows">
            {filteredCalls.map((call) => {
              const stageNum = call.ended_stage || call.current_stage || 1;
              const stageName = (STAGE_NAMES[stageNum] || `Stage ${stageNum}`).toUpperCase();
              const hasMismatch = Boolean(call.outcome_flag);

              // Title: Prospect, Company
              const titleText = call.company
                ? `${call.prospect}, ${call.company}`
                : call.prospect;

              // Subtitle: Agreed next step summary or summary
              let subtitleText = call.summary;
              if (!subtitleText) {
                if (call.next_step_details?.when_time) {
                  subtitleText = `Call ${call.next_step_details.when_time}`;
                } else if (call.outcome) {
                  subtitleText = call.outcome.replace(/_/g, ' ');
                } else {
                  subtitleText = call.ended_at ? 'Completed call' : 'Call in progress...';
                }
              }

              return (
                <div
                  key={call.id}
                  className="call-list-row-item"
                  onClick={() => handleRowClick(call)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleRowClick(call)}
                >
                  <div className="call-row-left">
                    <div className="row-prospect-company">
                      {titleText}
                    </div>
                    <div className="row-summary-note">
                      {subtitleText}
                    </div>
                  </div>

                  <div className="call-row-right">
                    <div className="row-stage-tag">
                      {stageName}
                    </div>
                    <div className="row-time-text">
                      {formatCallTime(call.started_at)}
                    </div>
                    {hasMismatch && (
                      <span className="row-mismatch-dot" title={call.outcome_flag}>
                        <AlertTriangle size={11} className="inline mr-1 text-amber-500" />
                        Mismatch
                      </span>
                    )}
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
