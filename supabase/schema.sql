-- ====================================================================
-- DeepThought Cold-Call Companion - Supabase Schema
-- ====================================================================

create extension if not exists "pgcrypto";

-- 1. Stages definition table
create table if not exists stages (
  stage_number       int primary key check (stage_number between 1 and 8),
  name               text not null,
  purpose            text not null,
  likely_statements  jsonb not null,   -- array of exactly 3 strings
  quick_outcomes     jsonb not null,   -- array of exactly 4 strings
  watch_out          text,
  next_stage_number  int
);

-- 2. Calls master table
create table if not exists calls (
  id             uuid primary key default gen_random_uuid(),
  prospect       text not null,
  company        text,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  current_stage  int not null default 1 check (current_stage between 1 and 8),
  ended_stage    int check (ended_stage between 1 and 8),
  outcome        text check (outcome in (
    'agreed_to_receive_report',
    'next_step_agreed',
    'interested',
    'follow_up',
    'call_again',
    'not_interested',
    'do_not_call',
    'wrong_person',
    'moved_company',
    'not_logged'
  )),
  next_step      jsonb,               -- {type, channel, when, proposed_by}
  summary        text,                -- LLM one-liner; never replaces prospect words
  summary_source text,                -- 'llm' or 'fallback'
  outcome_flag   text,                -- reason a consistency check disagreed
  created_at     timestamptz not null default now()
);

-- 3. Stage results per call (upserted on call_id, stage_number)
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

-- Indexes for performance
create index if not exists idx_stage_results_call on stage_results (call_id);
create index if not exists idx_calls_started on calls (started_at desc);

-- Row Level Security (RLS) configuration
-- The backend uses the service-role key, which bypasses RLS.
-- Enabling RLS prevents unauthorized direct client access via anon keys.
alter table stages        enable row level security;
alter table calls         enable row level security;
alter table stage_results enable row level security;

-- For existing deployments updating an earlier schema run:
alter table calls add column if not exists summary_source text;

