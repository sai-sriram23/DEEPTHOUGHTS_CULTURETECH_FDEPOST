-- ====================================================================
-- DeepThought Cold-Call Companion - Supabase Schema
-- Run this entire script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nhoqyfscwlshgcdycghl/sql/new
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

-- Indexes for fast query performance
create index if not exists idx_stage_results_call on stage_results (call_id);
create index if not exists idx_calls_started on calls (started_at desc);

-- Row Level Security (RLS) configuration
-- The backend uses the service-role key, which bypasses RLS.
-- Enabling RLS prevents unauthorized direct client access via anon keys.
alter table stages        enable row level security;
alter table calls         enable row level security;
alter table stage_results enable row level security;

-- Safe migration for existing tables:
alter table calls add column if not exists summary_source text;

-- 4. Seed all eight call stages (derived from the 100 call transcripts)
insert into stages (stage_number, name, purpose, likely_statements, quick_outcomes, watch_out, next_stage_number)
values
  (
    1,
    'Opening',
    'Reach the right person and say who you are.',
    '["\"Who is this? Which department are you looking for?\"", "\"I am driving / in a meeting, who is calling?\"", "\"He left the company a long time ago.\""]'::jsonb,
    '["Right person", "Switchboard or assistant", "Wrong person or left", "Busy, call later"]'::jsonb,
    'Confirm the name before anything else. About 1 in 6 calls ends here.',
    2
  ),
  (
    2,
    'Purpose',
    'Say why you called in one or two sentences they can repeat to a colleague.',
    '["\"What is this regarding? Which company are you from?\"", "\"Where did you get my number?\"", "\"Is this a sales call?\""]'::jsonb,
    '["Asked what we do", "Asked where we got the number", "Said it is a sales call", "Let me go on"]'::jsonb,
    'If they ask twice, the first answer was a label. Say it in plain words.',
    3
  ),
  (
    3,
    'Permission',
    'Find out whether they will talk now. A clear yes, a clear no or a time to call back are all good.',
    '["\"Yes, go ahead.\" (then silence)", "\"Call me after two, or tomorrow.\"", "\"Send it on WhatsApp first.\""]'::jsonb,
    '["Clear yes", "Call back at a time", "Send WhatsApp first", "No"]'::jsonb,
    'A short yes followed by silence is not permission. Wait for the actual answer.',
    4
  ),
  (
    4,
    'Their business',
    'Ask about their company and work before saying more about yours.',
    '["One line about what they do, then wait for the pitch.", "\"We do not make that. That is a different division.\"", "\"First tell me about your company.\""]'::jsonb,
    '["Described their business", "Corrected us", "Asked about us first", "One line, waiting"]'::jsonb,
    'Callers often skip this stage. Ask one question about their work, then listen.',
    5
  ),
  (
    5,
    'Their need, in their words',
    'Hear what they are trying to do or struggling with. Write down exactly what was said.',
    '["A goal: a new market, a product line, better margins.", "\"Everything is fine, we do not need anything.\"", "\"What can you do for a company like ours?\""]'::jsonb,
    '["Named a goal", "Said all fine", "Asked what we can do", "Could not answer"]'::jsonb,
    'Their words, not yours. The AI never overwrites this box.',
    6
  ),
  (
    6,
    'Objection',
    'Hear the reason for a no and understand it before answering.',
    '["\"Send it in writing and we will see.\"", "\"Not me. Talk to our CFO or head office.\"", "\"We already have an internal team or consultant.\""]'::jsonb,
    '["Send it in writing", "Not the right person", "Already have a team", "Not interested"]'::jsonb,
    'Most objections are deflections (send it in writing, not me), not hard refusals. Deflections often still lead to a next step.',
    7
  ),
  (
    7,
    'Next step',
    'Agree one thing, named, with a channel or a time.',
    '["\"Yes, send the document.\"", "\"Call me on Tuesday after two.\"", "\"Talk to my colleague, here is the number.\""]'::jsonb,
    '["Meeting or call set", "Document on WhatsApp", "Document on email", "Referral given"]'::jsonb,
    'A time they name is worth more than a time you propose. A yes to a document may be politeness.',
    8
  ),
  (
    8,
    'Close',
    'End clearly and record what happened.',
    '["The line drops mid-sentence.", "A warm goodbye after a no, which is still a no.", "\"Okay, thank you.\" (after agreeing something)"]'::jsonb,
    '["Next step agreed", "Report agreed", "Declined", "Line dropped"]'::jsonb,
    'Record the outcome the words support, not the friendliest goodbye.',
    null
  )
on conflict (stage_number) do update set
  name = excluded.name,
  purpose = excluded.purpose,
  likely_statements = excluded.likely_statements,
  quick_outcomes = excluded.quick_outcomes,
  watch_out = excluded.watch_out,
  next_stage_number = excluded.next_stage_number;
