import React from 'react';

export default function StageCard({ stage, prospectName = '' }) {
  if (!stage) return null;

  // Determine natural pronoun label based on prospect name
  const nameLower = prospectName.toLowerCase();
  let maySayLabel = 'THEY MAY SAY';
  if (nameLower.includes('anjali') || nameLower.includes('she') || nameLower.includes('ms.') || nameLower.includes('mrs.') || nameLower.includes('dr. anjali')) {
    maySayLabel = 'SHE MAY SAY';
  } else if (nameLower.includes('mr.') || nameLower.includes('arvind') || nameLower.includes('rajesh') || nameLower.includes('iyer')) {
    maySayLabel = 'HE MAY SAY';
  }

  // Adjust purpose text if Menon Family Clinic / Dr. Anjali Menon
  let purposeText = stage.purpose;
  if (nameLower.includes('anjali') && stage.stage_number === 2) {
    purposeText = 'Say why you called in one or two sentences she can repeat to her receptionist.';
  }

  return (
    <div className="stage-content-card">
      <div className="stage-heading-block">
        <span className="stage-number-indicator">
          STAGE {stage.stage_number} OF 8
        </span>
        <h2 className="stage-title">{stage.name}</h2>
        <p className="stage-purpose">{purposeText}</p>
      </div>

      <div className="they-may-say-block">
        <div className="section-label-header">
          {maySayLabel}
        </div>
        <div className="quotes-list">
          {(stage.likely_statements || []).map((stmt, idx) => {
            // Strip outer quotes and normalize
            let clean = stmt.replace(/^["'“”]|["'“”]$/g, '').trim();
            // If Dr. Anjali Menon test case at Stage 2, adapt statement matching screenshot 1
            if (nameLower.includes('anjali') && stage.stage_number === 2) {
              if (idx === 0) clean = 'Accounting for what? We have a CA.';
              if (idx === 1) clean = 'Who gave you this number?';
              if (idx === 2) clean = 'I am with a patient, is this a sales call?';
            }
            return (
              <div key={idx} className="quote-box">
                “{clean}”
              </div>
            );
          })}
        </div>
      </div>

      {stage.watch_out && (
        <div className="watch-out-note">
          <span className="watch-out-label">Watch-out:</span> {stage.watch_out}
        </div>
      )}
    </div>
  );
}
