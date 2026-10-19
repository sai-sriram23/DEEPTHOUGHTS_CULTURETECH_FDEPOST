import React from 'react';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function HealthGate({ isHealthy, isChecking, onRetry }) {
  if (isHealthy) return null;

  return (
    <div className="health-gate-banner" role="alert">
      <div className="health-gate-content">
        <div className="health-gate-icon-spinner">
          <RefreshCw className="animate-spin" size={18} />
        </div>
        <div>
          <strong>Connecting to backend server...</strong>
          <span className="health-gate-subtext">
            Render free-tier instances may take 30-50 seconds to wake up from idle sleep.
          </span>
        </div>
      </div>
      <button 
        className="health-gate-retry-btn"
        onClick={onRetry}
        disabled={isChecking}
      >
        {isChecking ? 'Checking...' : 'Retry Now'}
      </button>
    </div>
  );
}
