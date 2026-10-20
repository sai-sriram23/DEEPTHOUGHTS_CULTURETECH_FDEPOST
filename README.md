# DeepThought Cold-Call Companion — Meridian Growth Partners

> **A high-velocity, glanceable dialer companion web application** built for sales callers reaching business owners and senior leaders. Guides callers through an 8-stage consultative call flow, captures verbatim prospect needs, enforces outcome consistency learned from 100 real transcripts, and generates grounded post-call intelligence.

[![Repository](https://img.shields.io/badge/GitHub-sai--sriram23%2FDEEPTHOUGHTS__CULTURETECH__FDEPOST-blue?logo=github)](https://github.com/sai-sriram23/DEEPTHOUGHTS_CULTURETECH_FDEPOST)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel%20React%20Vite-black?logo=vercel)](https://deepthoughts-culturetech-fdepost.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render%20FastAPI-46E3B7?logo=render)](https://deepthoughts-culturetech-fdepost.onrender.com/health)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Tests](https://img.shields.io/badge/Tests-6%2F6%20Passed%20(1.42s)-brightgreen)](https://github.com/sai-sriram23/DEEPTHOUGHTS_CULTURETECH_FDEPOST)

---

## 1. Live Deployment & Submission Links

- **Public GitHub Repository:** [https://github.com/sai-sriram23/DEEPTHOUGHTS_CULTURETECH_FDEPOST](https://github.com/sai-sriram23/DEEPTHOUGHTS_CULTURETECH_FDEPOST)
- **Live Vercel Application:** [https://deepthoughts-culturetech-fdepost.vercel.app](https://deepthoughts-culturetech-fdepost.vercel.app) *(or locally at `http://localhost:5173`)*
- **Render Backend Liveness:** [https://deepthoughts-culturetech-fdepost.onrender.com/health](https://deepthoughts-culturetech-fdepost.onrender.com/health) *(or locally at `http://localhost:8000/health`)*
- **Google Drive Demo Video:** `<drive-link-anyone-with-link-can-view>` *(min 6 minutes, face on camera)*
- **LLM Provider & Model:** **Google Gemini (gemini-2.5-flash via Google AI Studio)**
- **LLM Features & Provenance:**
  1. *Post-Call One-Line Summary:* Grounded, deterministic <25-word synthesis strictly derived from recorded stage data.
  2. *Provenance Tracking (`summary_source`):* The close endpoint returns `summary_source: "llm" | "fallback"`. The UI explicitly displays a provenance badge (`✨ Gemini AI` vs `Rule-based fallback`) on call details.
  3. *Outcome Consistency Validator:* Compares logged CRM outcomes with verbatim prospect statements to flag deflections misclassified as refusals, unlogged next steps, or false `do_not_call` entries.

---

## 2. Core Problem & Product Design

Sales cold calls to Indian enterprise leaders and mid-market directors have a median duration of about **94 seconds**. Most CRM interfaces fail because they are designed for post-call data entry, requiring extensive typing while a live lead is speaking.

The **Cold-Call Companion** sits in a compact column (~400–460px) beside any softphone dialer:
1. **Never gets lost in the call:** An interactive 8-stage progress rail keeps the caller oriented with one-tap stage transitions.
2. **Transcript-Informed Guidance:** Displays 3 likely prospect responses per stage derived from the 100-call dataset.
3. **Frictionless Capture:** Exactly 4 rapid-tap outcomes per stage; zero compulsory typing mid-call.
4. **Verbatim Prospect Need Protection:** Stage 5 isolates the prospect's actual pain points into a dedicated verbatim box with voice dictation (EN-IN & HI-IN) that the AI is strictly forbidden from overwriting.
5. **Early Exit Support:** Callers can terminate and log the call cleanly from *any* stage (including Stage 1 gatekeeper drops).
6. **Past Calls Review & Funnel Analysis:** Persistent call history with a "Where calls end" distribution strip.

---

## 3. The 8-Stage Call Framework

| # | Stage Name | Operational Purpose | Key Transcript Insight |
|---|---|---|---|
| **1** | **Opening** | Reach the decision-maker and state identity | ~1 in 6 calls ends here with reception or wrong person. One-tap exit available. |
| **2** | **Purpose** | State the value proposition in 1–2 repeatable sentences | 31% ask "What is this regarding / Which company?". Plain speech prevents second asks. |
| **3** | **Permission** | Verify availability to speak right now | ~59% say "boliye / go ahead"; ~20–25% deflect with "send on WhatsApp first". |
| **4** | **Their business** | Inquire about operations before pitching | Skipped by most callers; asking 1 open question surfaces relevant context for the pitch. |
| **5** | **Their need** | Hear goals or bottlenecks; write verbatim words | About 30 of 100 callers asked about goals, and about 15 got a real answer. App provides enlarged focus with zero AI alteration. |
| **6** | **Objection** | Hear reasons for refusal before answering | Most are **deflections** (send in writing, wrong person) rather than hard refusals. |
| **7** | **Next step** | Secure a concrete channel, time, and owner | A prospect-proposed time is far higher quality than a caller-pushed time. |
| **8** | **Close** | Clean wrap-up matching actual conversation | Differentiates polite goodbyes from actual commercial progress. |

---

## 4. Full-Stack System Architecture

```text
┌────────────────────────────────────────────────────────┐
│            Vercel Frontend (React + Vite)              │
│  - Vanilla CSS design system (Dark Slate / Glassmorphic)│
│  - HealthGate for Render cold-start management          │
│  - StageRail, StageCard, TapButtons, ProspectWords     │
│  - Web Speech API speech-to-text (EN-IN & HI-IN)       │
│  - WhereCallsEndStrip interactive funnel filter        │
│  - Summary provenance pill (✨ Gemini AI vs Fallback)   │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS / JSON (CORS restricted)
                           ▼
┌────────────────────────────────────────────────────────┐
│             Render Backend (Python + FastAPI)          │
│  - REST API (/health, /stages, /calls, /close)         │
│  - Rule-based Outcome Consistency Engine (checks.py)   │
│  - Google Gemini LLM Service (gemini-2.5-flash)        │
│  - Explicit status logging on provider errors          │
│  - Strict Zero-Secret browser leakage boundary         │
└──────────────────────────┬─────────────────────────────┘
                           │ PostgREST / Service Role
                           ▼
┌────────────────────────────────────────────────────────┐
│             Supabase Database (PostgreSQL)             │
│  - tables: stages, calls, stage_results                │
│  - Upsert on (call_id, stage_number)                   │
│  - Row-Level Security (RLS) enabled                    │
│  - Local SQLite auto-fallback for offline dev/tests    │
└────────────────────────────────────────────────────────┘
```

---

## 5. Backend API Specification

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/health` | Liveness probe for cold-start gating | `200` |
| `GET` | `/stages` | Returns the 8 stages with transcript guidance | `200`, `502` |
| `POST` | `/calls` | Initializes a persistent call record | `201`, `422`, `502` |
| `POST` | `/calls/{id}/stages` | Upserts stage result `(call_id, stage_number)` | `200`, `404`, `422` |
| `POST` | `/calls/{id}/close` | Closes call, evaluates consistency, runs LLM summary, returns `summary_source` | `200`, `404`, `422` |
| `GET` | `/calls` | Lists calls, newest first | `200`, `502` |
| `GET` | `/calls/{id}` | Fetches call detail with all stage results | `200`, `404` |
| `POST` | `/ai/summarize-call` | Generates one-line summary from structured call data | `200` |

### Allowed Outcome Taxonomy (10 values)
`agreed_to_receive_report`, `next_step_agreed`, `interested`, `follow_up`, `call_again`, `not_interested`, `do_not_call`, `wrong_person`, `moved_company`, `not_logged`.

---

## 6. Outcome Consistency & LLM Integration

### Post-Call Consistency Engine (`checks.py`)
Empirical analysis of the 100 transcripts identified frequent caller logging errors:
1. **Unlogged Progress:** Callers logged `not_logged` despite prospects agreeing to a WhatsApp document or Tuesday 2 PM call. *The system detects channel/time phrases and flags the discrepancy.*
2. **False Do-Not-Call:** Callers logged `do_not_call` after polite deflections where the prospect never asked for removal. *The system flags this and prompts confirmation.*
3. **Positive Outcomes without Schedule:** Callers logged `next_step_agreed` without scheduling details. *The system warns the caller to lock down a time.*

### LLM Summarizer (`llm.py`)
- **Active Model:** Google Gemini (`gemini-2.5-flash`) via Google AI Studio API.
- **Strict Grounding:** Prompt system instructions enforce that the model *never* hallucinates meeting times or commitments not present in the record.
- **Fail-Safe Fallbacks:** If the provider is rate-limited, times out (>8s), or returns an error, the system logs the exact status code and response body, returning deterministic rule-based summaries: `Ended at Stage 7 (Next step agreed). Next step: call via phone for Tue after 2.`
- **Provenance Tagging:** Every closed call stores `summary_source: "llm" | "fallback"`, visible directly on the call detail modal.
- **Zero Browser Exposure:** All API keys reside exclusively in backend environment variables.

---

## 7. Supabase Database Schema

```sql
create extension if not exists "pgcrypto";

create table if not exists stages (
  stage_number       int primary key check (stage_number between 1 and 8),
  name               text not null,
  purpose            text not null,
  likely_statements  jsonb not null,
  quick_outcomes     jsonb not null,
  watch_out          text,
  next_stage_number  int
);

create table if not exists calls (
  id             uuid primary key default gen_random_uuid(),
  prospect       text not null,
  company        text,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  current_stage  int not null default 1 check (current_stage between 1 and 8),
  ended_stage    int check (ended_stage between 1 and 8),
  outcome        text check (outcome in (
    'agreed_to_receive_report','next_step_agreed','interested','follow_up',
    'call_again','not_interested','do_not_call','wrong_person',
    'moved_company','not_logged'
  )),
  next_step      jsonb,
  summary        text,
  summary_source text,   -- 'llm' or 'fallback'
  outcome_flag   text,
  created_at     timestamptz not null default now()
);

create table if not exists stage_results (
  id             uuid primary key default gen_random_uuid(),
  call_id        uuid not null references calls(id) on delete cascade,
  stage_number   int not null check (stage_number between 1 and 8),
  what_happened  text,
  prospect_words text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (call_id, stage_number)
);

alter table stages enable row level security;
alter table calls enable row level security;
alter table stage_results enable row level security;

-- For existing deployments updating an earlier schema run:
alter table calls add column if not exists summary_source text;
```

---

## 8. Verification & Test Suite

The test suite validates the entire API contract, database upserts, validation constraints, and consistency checks:

```bash
python -m pytest backend/tests/test_api.py -v
```

**Results:**
- `test_health_check` — PASSED
- `test_get_stages` — PASSED (verifies 8 stages, 3 statements, 4 taps)
- `test_call_lifecycle_and_upsert` — PASSED (verifies Stage 1 upsert & Stage 5 verbatim integrity)
- `test_early_end_stage_one` — PASSED (verifies early termination)
- `test_validation_errors` — PASSED (404 and 422 constraints)
- `test_consistency_checks` — PASSED (unlogged next-step & false do-not-call detections)

**Status:** `6 passed in 1.42s (100%)`

---

## 9. Running Locally & Deployment

### Backend Setup (Local)
```bash
# Option A: From root directory
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# Option B: From backend directory
cd backend
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn main:app --reload --port 8000
```

### Frontend Setup (Local)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Render Backend Deployment
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/health`
- **Environment Variables:**
  - `PYTHON_VERSION`: `3.11.9`
  - `SUPABASE_URL`: `https://<your-project>.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY`: `<your-supabase-service-role-key>`
  - `LLM_PROVIDER`: `gemini`
  - `LLM_MODEL`: `gemini-2.5-flash`
  - `LLM_API_KEY`: `<your-google-ai-studio-api-key>`
  - `FRONTEND_ORIGIN`: `https://deepthoughts-culturetech-fdepost.vercel.app`

### Vercel Frontend Deployment
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_BASE_URL`: `https://deepthoughts-culturetech-fdepost.onrender.com`

---

## 10. Data Protection & Ethical Handling

Per the project requirements, **no raw transcript files, full dialogue texts, or `call_coding.csv` are committed to this repository**. All guidance in `stage_content.json` represents derived, anonymized patterns.
