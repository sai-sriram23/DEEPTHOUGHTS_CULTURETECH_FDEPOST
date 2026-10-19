-- ====================================================================
-- DeepThought Cold-Call Companion - Seed Stages
-- ====================================================================

insert into stages (stage_number, name, purpose, likely_statements, quick_outcomes, watch_out, next_stage_number)
values
(
  1,
  'Opening',
  'Reach the right person and say who you are.',
  '["\"Who is this? Which department are you looking for?\"", "\"I am driving / in a meeting, who is calling?\"", "\"He left the company a long time ago.\"]'::jsonb,
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
  '["\"Yes, go ahead.\" (then silence)", "\"Call me after two, or tomorrow.\"", "\"Send it on WhatsApp first.\"]'::jsonb,
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
  '["\"Send it in writing and we will see.\"", "\"Not me. Talk to our CFO or head office.\"", "\"We already have an internal team or consultant.\"]'::jsonb,
  '["Send it in writing", "Not the right person", "Already have a team", "Not interested"]'::jsonb,
  'Most objections are deflections (send it in writing, not me), not hard refusals. Deflections often still lead to a next step.',
  7
),
(
  7,
  'Next step',
  'Agree one thing, named, with a channel or a time.',
  '["\"Yes, send the document.\"", "\"Call me on Tuesday after two.\"", "\"Talk to my colleague, here is the number.\"]'::jsonb,
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
