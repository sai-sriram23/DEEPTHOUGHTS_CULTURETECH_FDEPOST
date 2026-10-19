import React from 'react';
import { BarChart2, Filter } from 'lucide-react';

const STAGE_SHORT_LABELS = {
  1: 'Opening',
  2: 'Purpose',
  3: 'Permission',
  4: 'Business',
  5: 'Need',
  6: 'Objection',
  7: 'Next step',
  8: 'Close'
};

export default function WhereCallsEndStrip({ calls = [], selectedStageFilter, onSelectFilter }) {
  // Aggregate counts per stage (1..8)
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
  calls.forEach((c) => {
    const stage = c.ended_stage || c.current_stage || 1;
    if (counts[stage] !== undefined) {
      counts[stage]++;
    }
  });

  const totalCalls = calls.length;
  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="where-calls-end-card">
      <div className="where-header">
        <div className="title-row">
          <BarChart2 size={16} className="text-indigo-400" />
          <span className="where-title">Where calls end</span>
        </div>
        <span className="where-instruction">
          {selectedStageFilter ? (
            <button
              className="clear-filter-btn"
              onClick={() => onSelectFilter(null)}
            >
              Filtering Stage {selectedStageFilter} (Click to clear)
            </button>
          ) : (
            'Tap a stage to filter'
          )}
        </span>
      </div>

      <div className="where-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
          const count = counts[s];
          const isSelected = selectedStageFilter === s;
          const percentage = totalCalls > 0 ? (count / maxCount) * 100 : 0;

          return (
            <button
              key={s}
              type="button"
              className={`where-stage-pill ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectFilter(isSelected ? null : s)}
            >
              <div className="stage-pill-top">
                <span className="stage-name">{STAGE_SHORT_LABELS[s]}</span>
                <span className="stage-count">{count}</span>
              </div>
              <div className="stage-bar-bg">
                <div
                  className="stage-bar-fill"
                  style={{ width: `${Math.max(percentage, count > 0 ? 12 : 2)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
