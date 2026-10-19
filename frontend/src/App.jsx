import React, { useState, useEffect } from 'react';
import HealthGate from './components/HealthGate';
import NewCallModal from './components/NewCallModal';
import CallScreen from './pages/CallScreen';
import CallList from './pages/CallList';
import {
  checkHealth,
  fetchStages,
  createCall,
  saveStageResult,
  closeCall,
  fetchCalls,
  fetchCallDetail
} from './api';
import { Phone, ListFilter, PhoneCall, Shield } from 'lucide-react';
import './App.css';

export default function App() {
  const [isHealthy, setIsHealthy] = useState(true);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [stages, setStages] = useState([]);
  const [calls, setCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'call' | 'list'
  const [isNewCallOpen, setIsNewCallOpen] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);

  // Initial load: check health, fetch stages, load calls, check active call in storage
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    // 1. Health check
    verifyHealth();

    // 2. Fetch stages
    try {
      const stageData = await fetchStages();
      setStages(stageData);
    } catch (e) {
      console.warn('Using bundled stages');
    }

    // 3. Load past calls
    loadCalls();

    // 4. Restore active call from localStorage if present
    const savedCallId = localStorage.getItem('coldcall_active_call_id');
    if (savedCallId) {
      try {
        const callData = await fetchCallDetail(savedCallId);
        if (callData && !callData.ended_at) {
          setActiveCall(callData);
          setCurrentView('call');
        } else {
          localStorage.removeItem('coldcall_active_call_id');
        }
      } catch (e) {
        localStorage.removeItem('coldcall_active_call_id');
      }
    }
  };

  const verifyHealth = async () => {
    setIsCheckingHealth(true);
    try {
      await checkHealth();
      setIsHealthy(true);
    } catch (err) {
      setIsHealthy(false);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const loadCalls = async () => {
    setIsLoadingCalls(true);
    try {
      const data = await fetchCalls();
      setCalls(data || []);
    } catch (err) {
      console.error('Error loading calls:', err);
    } finally {
      setIsLoadingCalls(false);
    }
  };

  // Start new call
  const handleStartCall = async (prospect, company) => {
    setIsStartingCall(true);
    try {
      const newCall = await createCall(prospect, company);
      setActiveCall(newCall);
      localStorage.setItem('coldcall_active_call_id', newCall.id);
      setCurrentView('call');
      setIsNewCallOpen(false);
    } catch (err) {
      alert(`Could not start call: ${err.message}`);
    } finally {
      setIsStartingCall(false);
    }
  };

  // Save intermediate stage result
  const handleSaveStage = async (callId, stageNumber, tap, words) => {
    return await saveStageResult(callId, stageNumber, tap, words);
  };

  // Close call
  const handleCloseCall = async (callId, endedStage, outcome, nextStep) => {
    const updated = await closeCall(callId, endedStage, outcome, nextStep);
    localStorage.removeItem('coldcall_active_call_id');
    setActiveCall(null);
    setCurrentView('list');
    await loadCalls();
    return updated;
  };

  const handleSelectCallDetail = async (callId) => {
    return await fetchCallDetail(callId);
  };

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <nav className="app-navbar">
        <div className="nav-brand">
          <div className="brand-logo-icon">
            <Phone size={18} />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">Cold-Call Companion</span>
            <span className="brand-sub">Meridian Growth Partners · Dial-side Guide</span>
          </div>
        </div>

        <div className="nav-view-toggles">
          {activeCall && (
            <button
              type="button"
              className={`view-toggle-btn ${currentView === 'call' ? 'active' : ''}`}
              onClick={() => setCurrentView('call')}
            >
              <PhoneCall size={15} />
              <span>Active Call</span>
              <span className="pulse-indicator" />
            </button>
          )}

          <button
            type="button"
            className={`view-toggle-btn ${currentView === 'list' ? 'active' : ''}`}
            onClick={() => setCurrentView('list')}
          >
            <ListFilter size={15} />
            <span>Past Calls</span>
            <span className="badge-count">{calls.length}</span>
          </button>

          {!activeCall && (
            <button
              type="button"
              className="btn-start-call-nav"
              onClick={() => setIsNewCallOpen(true)}
            >
              <PhoneCall size={15} />
              <span>New Call</span>
            </button>
          )}
        </div>
      </nav>

      {/* Render cold-start health gate banner if backend is waking */}
      <HealthGate
        isHealthy={isHealthy}
        isChecking={isCheckingHealth}
        onRetry={verifyHealth}
      />

      {/* Main Content Area */}
      <main className="app-main-viewport">
        {currentView === 'call' && activeCall ? (
          <CallScreen
            call={activeCall}
            stages={stages}
            onSaveStage={handleSaveStage}
            onCloseCall={handleCloseCall}
          />
        ) : (
          <CallList
            calls={calls}
            isLoading={isLoadingCalls}
            onRefresh={loadCalls}
            onOpenNewCall={() => setIsNewCallOpen(true)}
            onSelectCall={handleSelectCallDetail}
          />
        )}
      </main>

      {/* New Call Modal */}
      <NewCallModal
        isOpen={isNewCallOpen}
        onClose={() => setIsNewCallOpen(false)}
        onStartCall={handleStartCall}
        isStarting={isStartingCall}
      />
    </div>
  );
}
