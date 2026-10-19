/**
 * API Client for Cold-Call Companion Backend
 */
import fallbackStages from './data/stage_content.json';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

async function handleResponse(res) {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const data = await res.json();
      if (data && (data.error || data.detail)) {
        if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(d => d.msg || JSON.stringify(d)).join('; ');
        } else {
          errorMsg = data.error || JSON.stringify(data.detail);
        }
      }
    } catch (e) {
      // not json
    }
    const err = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}

export async function fetchStages() {
  try {
    const res = await fetch(`${API_BASE}/stages`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Unable to load stages from backend, using bundled stage_content.json', err);
  }
  return fallbackStages;
}

export async function createCall(prospect, company) {
  const res = await fetch(`${API_BASE}/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prospect, company: company || null })
  });
  return handleResponse(res);
}

export async function saveStageResult(callId, stageNumber, whatHappened, prospectWords) {
  const res = await fetch(`${API_BASE}/calls/${callId}/stages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stage_number: stageNumber,
      what_happened: whatHappened || null,
      prospect_words: prospectWords || null
    })
  });
  return handleResponse(res);
}

export async function closeCall(callId, endedStage, outcome, nextStep) {
  const res = await fetch(`${API_BASE}/calls/${callId}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ended_stage: endedStage,
      outcome,
      next_step: nextStep || null
    })
  });
  return handleResponse(res);
}

export async function fetchCalls() {
  const res = await fetch(`${API_BASE}/calls`);
  return handleResponse(res);
}

export async function fetchCallDetail(callId) {
  const res = await fetch(`${API_BASE}/calls/${callId}`);
  return handleResponse(res);
}
