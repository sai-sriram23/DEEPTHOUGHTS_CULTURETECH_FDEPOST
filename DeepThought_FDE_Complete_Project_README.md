# DeepThought FDE Assignment — Cold-Call Companion

> **What this document is:** the complete working brief for understanding, building, testing, deploying and submitting the DeepThought Forward Deployed Engineer cold-call companion task. It combines the assignment requirements, the transcript analysis, the final stage content, every screen, the data model, the API, the LLM design, the build plan, the demo plan and the submission checklist.
>
> **Honest status:** this is a plan and specification. Nothing here proves that code has been written, tested or deployed. Replace every `<placeholder>` with a real, verified value before submitting.
>
> **Companion files:** `stage_content.json` (the eight stages as data, ready to seed) and `call_coding.csv` (private per-call coding of the transcripts; **do not commit it**).

---

## Contents

1. [Assignment overview and deadline](#1-assignment-overview-and-deadline)
2. [Official requirements and where each is met](#2-official-requirements-and-where-each-is-met)
3. [The eight stages](#3-the-eight-stages)
4. [Transcript analysis (results, method, limits)](#4-transcript-analysis-results-method-limits)
5. [Dataset files and safe handling](#5-dataset-files-and-safe-handling)
6. [Final stage content](#6-final-stage-content)
7. [Screens: live call, close, past calls](#7-screens-live-call-close-past-calls)
8. [Frontend design](#8-frontend-design)
9. [Backend API contract](#9-backend-api-contract)
10. [Supabase schema](#10-supabase-schema)
11. [LLM features and security](#11-llm-features-and-security)
12. [Technology choices](#12-technology-choices)
13. [Build procedure and time plan](#13-build-procedure-and-time-plan)
14. [Environment variables](#14-environment-variables)
15. [Repository structure](#15-repository-structure)
16. [Testing and acceptance checklist](#16-testing-and-acceptance-checklist)
17. [Demo video plan](#17-demo-video-plan)
18. [Submission and the CEO message](#18-submission-and-the-ceo-message)
19. [Risks and mitigations](#19-risks-and-mitigations)
20. [Limitations and honest status](#20-limitations-and-honest-status)
21. [References](#21-references)
22. [Appendices](#22-appendices)

---

## 1. Assignment overview and deadline

DeepThought asks for a small web application a caller keeps open beside a phone during a cold call. It must:

- keep the caller oriented inside an **eight-stage** call structure,
- show stage-specific guidance **learned from the 100 supplied transcripts**,
- let the caller record what happened with a tap and capture the prospect's own words,
- save every call, and
- show a second screen listing past calls and the stage each reached.

It is a **working, deployed workflow**: Vercel frontend, Render backend, Supabase database, and at least one LLM feature called from the backend. It is not a static mock-up and not a generic CRM.

### The task steps (from the task page)

1. **Register.** The 48-hour clock starts. The task and readings open.
2. **Build** the screen, deploy it, and record a video (four links and a six-minute video).
3. **Message the CEO on WhatsApp** from your own page. It opens the chat with your links and questions already in the message.

The page also states: no follow-ups, nobody will remind you, and going quiet is read as your answer.

### Deadline

The task page shows **Wednesday, 21 October 2026, 9:47 am**. That implies registration at about 9:47 am on Monday 19 October. The live page is the authority: if the timer on your page differs, follow it.

### Intended caller workflow

1. The caller opens the app and starts a new call.
2. A persistent call record is created.
3. The app shows Stage 1: its purpose, three things prospects tend to say, four taps for what happened, one box for the prospect's words, the next stage, and End Call.
4. The caller records what happened and moves through the stages as the real call allows.
5. The caller can end the call from any stage.
6. The app records the final outcome, the next step if any, and the exact Stage 5 wording.
7. The call is saved and appears on the Past Calls screen with the stage reached.
8. The caller can open an earlier call and inspect its stage results.

### Unknown: the evaluation criteria

The task page has a "What we read for" list with six bullets. In the text copied so far those bullets are **empty**. Open the live page and read them before you finalise the build and the video. They are the real scoring criteria. This README's plan should be checked against them.

---

## 2. Official requirements and where each is met

### Requirement checklist

| # | Requirement (from the brief) | Built in | Verified by |
|---|---|---|---|
| 1 | Cover all eight stages in the given order | §6 stage content, §7 live screen | Walk stages 1→8 |
| 2 | Show stage number/name and a short line on what it is for | §7 live screen | Visual check each stage |
| 3 | Show three things prospects tend to say, informed by the transcripts | §4 analysis, §6 content | Each stage has exactly 3 lines |
| 4 | Four tap-able choices for what happened | §6 content, §7 | Each stage has exactly 4 taps |
| 5 | One free-text box for the prospect's own words (the only free text on the live screen) | §7 | Only one `<textarea>` on the live screen |
| 6 | Name the next stage | §7 | "Next: <stage>" on every stage except 8 |
| 7 | End Call available at every stage | §7 | Click End Call at stage 1 and stage 6 |
| 8 | Capture outcome and next step | §7 close dialog | Close with and without a next step |
| 9 | Preserve exact Stage 5 words | §9 save rules | Stage 5 text unchanged after summary runs |
| 10 | Past-calls screen lists saved calls with stage reached, from persisted data | §7, §10 | Refresh keeps the list |
| 11 | Supabase stores calls, stage results, what happened, prospect words, outcome | §10 | SQL schema in repo |
| 12 | Render backend: start call, save stage result, close call, list calls, health | §9 | Each endpoint tested live |
| 13 | Vercel frontend | §8 | Live URL works in a private window |
| 14 | At least one LLM feature, called from the backend; key never in browser | §11 | Network tab shows no key; env var only |
| 15 | Public GitHub repo with frontend, backend, SQL schema, README with Vercel URL, Render URL, which LLM and for what | §15, §18 | Repo opens signed out |
| 16 | Google Drive video, at least 6 minutes, you on camera, anyone with the link can view | §17 | Opened in a private window |
| 17 | Transcripts are for this task only, never published | §5 | No raw text in repo |

### Things the brief says about quality

- AI coding assistants are allowed for the build. The **video and the WhatsApp message are the parts that are only you**.
- The video must be **unscripted** and show you on camera. They look at body language and how convinced you are by what you say.
- The uploaded file is checked automatically: it must open, be the right kind of file, and be at least six minutes long. Up to 10 submissions per hour.

---

## 3. The eight stages

Use these stages in this order. They describe the shape of a call, not a rigid script.

| # | Stage | What it is for | What tends to happen (from the structure page) |
|---|---|---|---|
| 1 | Opening | Reach the right person and say who you are | Switchboard or assistant answers; person is busy; number belongs to someone who left |
| 2 | Purpose | Say in one or two sentences why you called, in words the prospect can repeat | They ask what the company does; where you got the number; guess it is a sales call |
| 3 | Permission | Find out whether they will talk now. A clear yes, a clear no, or a time to call back are all good | "Call after two"; "send it on WhatsApp first"; a short yes then silence |
| 4 | Their business | Ask about their company and work before saying more about yours | One-line answer then wait; they correct you; they ask about you first |
| 5 | Their need, in their words | Hear what they are trying to do or struggling with; write down exactly what was said | A goal; "all fine"; "what can you do for us?" |
| 6 | Objection | Hear the reason for a no and understand it | Existing agency or team; not the right person; send it in writing |
| 7 | Next step | Agree one concrete thing with a time or channel | Document yes (maybe politeness); a time they name; a referral |
| 8 | Close | End clearly and record outcome, next step and the stage 5 words | Dropped line; warm goodbye after a no; logged outcome not matching the call |

A call may end before stage 8. The app must allow ending from any stage and record the stage reached. Never force a caller through all eight.

---

## 4. Transcript analysis (results, method, limits)

> **Read this before quoting any number.** The figures below come from keyword and rule-based analysis of all 100 transcripts, plus hand-reading of roughly 15 calls and a 20-call spot-check of the automatic stage coding. They are good enough to design the screen. They are **not** exact statistics. Before you state a figure on camera, re-check it against the raw files.

### 4.1 The data in one view

- **Caller:** a fictional Hyderabad firm, *Meridian Growth Partners*, selling growth reports and growth work to directors and senior managers of Indian companies. 15 different callers appear.
- **Prospects:** 31 at India arms of multinationals, about 42 at mid-size private companies and manufacturers, 10 at listed Indian companies, 8 at startups, the rest large, small or public-sector.
- **Length:** median about 94 seconds. 68 calls are under two minutes, 25 under one minute, only 6 over five minutes. The longest is 687 seconds.
- **Turns:** median about 18 turns per call.
- **Languages:** most calls are English. A good minority switch to Hindi or Hinglish. A few are in Marathi, one is in Devanagari Hindi, one prospect asks for Kannada.

### 4.2 Logged outcomes (the caller's own label)

| Logged outcome | Calls | Median duration (s) |
|---|---:|---:|
| not_interested | 14 | 91 |
| agreed_to_receive_report | 14 | 158 |
| follow_up | 14 | 121 |
| not_logged | 13 | 90 |
| next_step_agreed | 11 | 113 |
| do_not_call | 10 | 77 |
| wrong_person | 8 | 58 |
| interested | 7 | 145 |
| moved_company | 5 | 71 |
| call_again | 4 | 45 |

Grouped: **17** never reached the right person (wrong person, moved company, call again); **24** ended in a decline (not interested, do not call); **46** ended in some positive outcome (report agreed, next step, interested, follow-up); **13** were not logged.

The shorter a call, the worse the outcome. Positive outcomes run 2 to 2.5 minutes. Wrong-person calls run about one minute.

### 4.3 Question A: where do calls end?

**Method (rule-based coding of the last substantive stage reached)**

1. Read each transcript into turns. Treat the `RECEPTION` speaker as the prospect side. One transcript contains an unlabelled stage note, which the parser must tolerate.
2. A stage counts as reached only if the transcript shows evidence of it:
   - *Opening:* always reached.
   - *Purpose:* caller states what Meridian does or why it called, beyond the introduction.
   - *Permission:* caller asks whether it is a good time or asks for a couple of minutes.
   - *Their business:* caller asks about the prospect's company or work.
   - *Their need:* caller asks about goals or challenges and the prospect answers, or the prospect states a goal.
   - *Objection:* the prospect gives a reason for declining or deflecting.
   - *Next step:* a channel, time or document is proposed **and** the other side accepts it, with no refusal in the last few prospect turns.
3. "Last substantive stage" is the highest stage with evidence.
4. **Close is merged into Next step for reporting.** Almost every call ends with thanks and goodbye whatever happened, so a clean goodbye is not evidence of a real Close. The brief warns against calling every ending a Close.
5. The logged outcome is kept separate. It is the caller's word and is never used as ground truth.

**Result of the rule-based coding (100 calls)**

| Last substantive stage | Calls (rule-based) |
|---|---:|
| Opening | 2 |
| Purpose | 7 |
| Permission | 10 |
| Their business | 1 |
| Their need, in their words | 4 |
| Objection | 21 |
| Next step / Close | 55 |
| **Total** | **100** |

16 calls were flagged ambiguous (for example, an objection and a next step both present, or a call cut off mid-sentence after next-step language).

**Accuracy check.** I read the last turns of 20 randomly chosen calls and compared them with the coded stage: about 12 were clearly right, about 3 plausible, and about 5 wrong. That is roughly **60 to 75 percent agreement**. The coder is weak in two places:

- **Opening is under-counted.** Wrong-person and left-the-company calls can be fairly long conversations, so keyword rules miss them. Use the logged outcomes (17 calls) as the better guide for the Opening dead end.
- **Declines after the pitch are sometimes read as Business or Next step** when the prospect refuses politely ("thank you", "okay").

**The picture to use**

> About **1 in 6** calls ends at the opening without the right person. About **1 in 4** ends on a decline or a deflection. About **half** end with an agreed document or time, and many of those are "send it on WhatsApp". Hardly any calls spend real time on stage 4 (their business) or stage 5 (their need).

**To make this defensible:** open `call_coding.csv`, check the 16 ambiguous calls and the ones coded Business or Permission by hand, correct the coding, and recount. The table above is a first pass, not a verified distribution.

### 4.4 Question B: what do prospects say at stages 2, 3 and 6?

Counts are the number of calls (out of 100) where the pattern appears, from keyword matching. They overlap, and a call can appear in several rows.

**Stage 2: Purpose**

| What the prospect says | Calls |
|---|---:|
| "What is this regarding? Who are you? Which company?" (including Hindi equivalents) | about 31 |
| "Where did you get my number?" | about 5 |
| "What is that report? What will I do with it?" | about 2 |
| Guesses it is a sales call | not measured separately |

**Stage 3: Permission**

| What the prospect says | Calls |
|---|---:|
| A short yes: "go ahead", "boliye", "tell me" | well over half (about 59) |
| Busy, driving, in a meeting, or call later | about 19 |
| Send it on WhatsApp or email first | about 20 to 25 |

**Stage 6: Objection**

| What the prospect says | Calls |
|---|---:|
| Send it in writing: WhatsApp, email, "share the details" | about 24 |
| Not the right person: ask the CFO, head office, another team, "I am junior" | about 16 |
| Already have an internal team, consultant, agency or "our own model" | about 12 |
| Plain "not interested", "no need", "no time" | about 5 |
| "How is this different from the reports we already get?" | about 2 |

**Insight for the screen:** most stage 6 responses are **deflections** (send it in writing, not me) rather than hard refusals. Deflections usually still lead to a stage 7 next step. Hard refusals end the call.

### 4.5 Question C: what did the prospect say at stage 5, and was it written down?

- Only about **30 of 100** callers ask any question about goals, challenges, bottlenecks or priorities. Of those, about **15** get a direct answer of a sentence or more.
- About **13** calls use a scripted set of yes/no "growth" questions instead (for example, whether regular review is key to growth). Those answers are short and agree by default.
- When asked about obstacles, some prospects cannot or will not say. One answered that they could not answer.
- Prospects who volunteer a goal mention things like recovering from a dip, growing a margin measure, expansion or exports, but this appears in a minority of calls.

**What cannot be known.** The dataset has **no field** for what the caller typed into any CRM. So the data cannot say whether the caller "wrote it down". It can only show whether the caller **acknowledged or repeated** the need during the call. Do not claim to know what was saved elsewhere. This is exactly why the app's stage 5 box exists: callers rarely capture the prospect's words.

### 4.6 Outcome versus conversation mismatches

The brief says the logged outcome does not always match the call. Findings:

- **do_not_call (10 calls):** none contains an explicit "do not call me" request in English, Hindi or Marathi phrasing (keyword check, plus reading several). The prospects say things like "not the right person", "we have an internal team", "I cannot share that". The caller judged it a do-not-call.
- **not_logged (13 calls):** about 9 mention a channel or a time. In several I read (for example calls where the prospect asks for WhatsApp or email, or agrees to a call Tuesday or Wednesday around 10 to 10:30), a real next step was agreed and still nothing was logged.
- **Calls end abruptly** a few times because the line dropped. Mid-sentence endings appear in only a handful of calls.

**Design consequence:** the Close step asks the caller to confirm an outcome, and a check flags a logged outcome that disagrees with the words (§7.4, §11).

### 4.7 Limitations of this analysis

- Keyword and rule-based, partly checked by hand. Not exhaustive human coding of all 100 calls.
- Caller and prospect labels may be swapped in places (the dataset README says so), which affects speaker-based rules.
- Transcript length does not always match duration, because of silences.
- One caller company only. Stage content reflects consultative growth-report selling, not every trade.
- Hindi, Hinglish and Marathi matching is incomplete.
- The "stage 4" and "stage 5" frequencies are the least reliable numbers.

---

## 5. Dataset files and safe handling

The ZIP contains:

- `README.md` — format, outcome definitions, language notes, limitations.
- `index.csv` and `index.json` — one row per call (id, duration, outcome, prospect role, company kind, company, caller, turns).
- `transcripts/T001.txt` … `T100.txt` — one call each.

**File format notes for any script you write**

- Files use Windows line endings (`\r\n`). Strip them.
- The header block is separated from the dialogue by a blank line.
- Speakers are `CALLER`, `PROSPECT`, and on a few calls `RECEPTION`.
- One transcript (T048) has an unlabelled stage note in brackets about a hold. Handle lines without a speaker label.
- Some lines are in Devanagari or Hinglish. Read files as UTF-8.
- Phone numbers and emails are replaced with bracketed placeholders.

**Use restrictions (from the dataset README)**

- For this task only. Do not publish. Do not try to identify the original companies or people.
- **Do not commit the ZIP, any raw transcript, or long verbatim excerpts** to the public repository. Commit only short, derived stage guidance.
- Keep `call_coding.csv` private. It contains only call IDs, logged outcomes and stage flags, but it is derived from the task material.

---

## 6. Final stage content

Every stage has **exactly one purpose line, three "they may say" lines, and four quick taps**. The lines are paraphrased patterns, not quotes from the transcripts. They are also in `stage_content.json`.

> Stage 4 and 5 lines rely more on the structure page than on transcript counts, because few calls spend time there. Say so in the video if asked.

### Stage 1: Opening
- **Purpose:** Reach the right person and say who you are.
- **They may say:**
  - "Who is this? Which department are you looking for?"
  - "I am driving / in a meeting, who is calling?"
  - "He left the company a long time ago."
- **Taps:** Right person · Switchboard or assistant · Wrong person or left · Busy, call later
- **Watch-out:** Confirm the name before anything else. About 1 in 6 calls ends here.

### Stage 2: Purpose
- **Purpose:** Say why you called in one or two sentences they can repeat to a colleague.
- **They may say:**
  - "What is this regarding? Which company are you from?"
  - "Where did you get my number?"
  - "Is this a sales call?"
- **Taps:** Asked what we do · Asked where we got the number · Said it is a sales call · Let me go on
- **Watch-out:** If they ask twice, the first answer was a label. Say it in plain words.

### Stage 3: Permission
- **Purpose:** Find out whether they will talk now. A clear yes, a clear no or a time to call back are all good.
- **They may say:**
  - "Yes, go ahead." (then silence)
  - "Call me after two, or tomorrow."
  - "Send it on WhatsApp first."
- **Taps:** Clear yes · Call back at a time · Send WhatsApp first · No
- **Watch-out:** A short yes followed by silence is not permission. Wait for the actual answer.

### Stage 4: Their business
- **Purpose:** Ask about their company and work before saying more about yours.
- **They may say:**
  - One line about what they do, then wait for the pitch.
  - "We do not make that. That is a different division."
  - "First tell me about your company."
- **Taps:** Described their business · Corrected us · Asked about us first · One line, waiting
- **Watch-out:** Callers often skip this stage. Ask one question about their work, then listen.

### Stage 5: Their need, in their words
- **Purpose:** Hear what they are trying to do or struggling with. Write down exactly what was said.
- **They may say:**
  - A goal: a new market, a product line, better margins.
  - "Everything is fine, we do not need anything."
  - "What can you do for a company like ours?"
- **Taps:** Named a goal · Said all fine · Asked what we can do · Could not answer
- **Watch-out:** The words box is large and focused here. Their words, not yours. Never overwritten by the AI.

### Stage 6: Objection
- **Purpose:** Hear the reason for a no and understand it before answering.
- **They may say:**
  - "Send it in writing and we will see."
  - "Not me. Talk to our CFO or head office."
  - "We already have an internal team or consultant."
- **Taps:** Send it in writing · Not the right person · Already have a team · Not interested
- **Watch-out:** Mark each as **Deflection** (send it in writing, not me) or **Hard no** (not interested). Deflections often still lead to a next step.

### Stage 7: Next step
- **Purpose:** Agree one thing, named, with a channel or a time.
- **They may say:**
  - "Yes, send the document."
  - "Call me on Tuesday after two."
  - "Talk to my colleague, here is the number."
- **Taps:** Meeting or call set · Document on WhatsApp · Document on email · Referral given
- **Watch-out:** A time they name is worth more than a time you propose. A yes to a document may be politeness.

### Stage 8: Close
- **Purpose:** End clearly and record what happened.
- **They may say:**
  - The line drops mid-sentence.
  - A warm goodbye after a no, which is still a no.
  - "Okay, thank you." (after agreeing something)
- **Taps:** Next step agreed · Report agreed · Declined · Line dropped
- **Watch-out:** Record the outcome the **words** support, not the friendliest goodbye.

> **Close has four taps like every other stage.** The full list of ten outcomes is chosen in the close dialog (§7.4), not as extra taps on the live screen.

---

## 7. Screens: live call, close, past calls

The reference screen shows one stage in this layout. Every stage uses it.

### 7.1 Layout of every live-call stage

```
<Company> · call guide                                    mm:ss
<Prospect name>
<Role>, <Company> · first call
1 2 3 4 5 6 7 8                                  Stage N of 8

<Stage name>
<One line: what this stage is for>

They may say
 · <line 1>
 · <line 2>
 · <line 3>

What happened
 [tap 1]  [tap 2]  [tap 3]  [tap 4]          (selected one is highlighted)

Their words
 <the single free-text box>

Next: <next stage name>                                  End call
```

Design for a narrow column of about 400 px, set next to a dialer. Large tap targets, short lines, minimal typing.

### 7.2 The eight stages on screen

The prospect below is invented (Meridian is the caller from the transcripts). A ✓ marks the tap already pressed.

**Stage 1**
```
Meridian Growth Partners · call guide                     00:08
Mr. Arvind Sharma
Director, Sharma Precision Components · first call
1 2 3 4 5 6 7 8                                  Stage 1 of 8

Opening
Reach the right person and say who you are.

They may say
 · "Who is this? Which department are you looking for?"
 · "I am driving / in a meeting, who is calling?"
 · "He left the company a long time ago."

What happened
 [✓ Right person] [Switchboard or assistant] [Wrong person or left] [Busy, call later]

Their words
 reception asked what it is about, put me through to his desk

Next: Purpose                                          End call
```

**Stage 2**
```
Meridian Growth Partners · call guide                     00:25
Mr. Arvind Sharma
Director, Sharma Precision Components · first call
1 2 3 4 5 6 7 8                                  Stage 2 of 8

Purpose
Say why you called in one or two sentences he can repeat to a colleague.

They may say
 · "What is this regarding? Which company are you from?"
 · "Where did you get my number?"
 · "Is this a sales call?"

What happened
 [Asked what we do] [Asked where we got the number] [Said it is a sales call] [✓ Let me go on]

Their words
 what is this regarding, which company did you say

Next: Permission                                       End call
```

**Stage 3**
```
Meridian Growth Partners · call guide                     00:48
Mr. Arvind Sharma
Director, Sharma Precision Components · first call
1 2 3 4 5 6 7 8                                  Stage 3 of 8

Permission
Find out whether he will talk now. A clear yes, a clear no, or a time to call back are all good.

They may say
 · "Yes, go ahead." (then silence)
 · "Call me after two, or tomorrow."
 · "Send it on WhatsApp first."

What happened
 [Clear yes] [Call back at a time] [✓ Send WhatsApp first] [No]

Their words
 not now, send me details on whatsapp, i will see

Next: Their business                                   End call
```

**Stage 4**
```
Meridian Growth Partners · call guide                     01:10
Mr. Arvind Sharma
Director, Sharma Precision Components · first call
1 2 3 4 5 6 7 8                                  Stage 4 of 8

Their business
Ask about their company and work before saying more about yours.

They may say
 · One line about what they do, then wait for the pitch.
 · "We do not make that. That is a different division."
 · "First tell me about your company."

What happened
 [Described their business] [✓ Corrected us] [Asked about us first] [One line, waiting]

Their words
 we are into auto components, not textiles, plant is in Pune

Next: Their need                                       End call
```

**Stage 5**
```
Meridian Growth Partners · call guide                     01:45
Mr. Arvind Sharma
Director, Sharma Precision Components · first call
1 2 3 4 5 6 7 8                                  Stage 5 of 8

Their need, in their words
Hear what they are trying to do or struggling with. Write down exactly what was said.

They may say
 · A goal: a new market, a product line, better margins.
 · "Everything is fine, we do not need anything."
 · "What can you do for a company like ours?"

What happened
 [✓ Named a goal] [Said all fine] [Asked what we can do] [Could not answer]

Their words   (large box, focused)
 want to grow exports, plant is running at sixty percent

Next: Objection                                        End call
```

**Stage 6**
```
Meridian Growth Partners · call guide                     02:20
Mr. Arvind Sharma
Director, Sharma Precision Components · first call
1 2 3 4 5 6 7 8                                  Stage 6 of 8

Objection
Hear the reason for a no and understand it before answering.

They may say
 · "Send it in writing and we will see."
 · "Not me. Talk to our CFO or head office."
 · "We already have an internal team or consultant."

What happened                                  (tag shown: Deflection)
 [✓ Send it in writing] [Not the right person] [Already have a team] [Not interested]

Their words
 mail me the details, i will forward to my finance head

Next: Next step                                        End call
```

**Stage 7**
```
Meridian Growth Partners · call guide                     02:50
Mr. Arvind Sharma
Director, Sharma Precision Components · first call
1 2 3 4 5 6 7 8                                  Stage 7 of 8

Next step
Agree one thing, named, with a channel or a time.

They may say
 · "Yes, send the document."
 · "Call me on Tuesday after two."
 · "Talk to my colleague, here is the number."

What happened
 [Meeting or call set] [✓ Document on WhatsApp] [Document on email] [Referral given]

Their words
 whatsapp is fine, then call tuesday after two

Next: Close                                            End call
```
*Small extra fields under the taps (optional, not free text):* channel, a time chip row, and a toggle **who proposed it: them / us**.

**Stage 8**
```
Meridian Growth Partners · call guide                     03:05
Mr. Arvind Sharma
Director, Sharma Precision Components · first call
1 2 3 4 5 6 7 8                                  Stage 8 of 8

Close
End clearly and record what happened.

They may say
 · The line drops mid-sentence.
 · A warm goodbye after a no, which is still a no.
 · "Okay, thank you." (after agreeing something)

What happened
 [✓ Next step agreed] [Report agreed] [Declined] [Line dropped]

Their words
 warm goodbye, said call on tuesday

Next: —                                                End call
```
At stage 8, **End call** opens the close dialog. A reminder line shows the stage 5 words.

### 7.3 Interaction rules

- **Start call:** asks for prospect name and company (company optional), creates the record, opens stage 1.
- **Tap:** highlights; saved when the caller advances or ends. Tapping again changes the choice.
- **Next:** saves the current stage result, then moves forward. Back is allowed and edits the same stage (no duplicates).
- **End call:** available on **every** stage including stage 1. It opens the close dialog.
- **Shortcut:** at stage 1, "Wrong person or left" offers a one-tap close with outcome `wrong_person` or `moved_company`.
- **Errors:** a failed save shows an error and keeps the typed words. Never show a fake success.
- **Cold start:** on load the app calls `/health`. If it is slow, show "waking server…" and retry.
- **Resume:** the open call id is remembered so a refresh returns to the same call. The database stays the source of truth.

### 7.4 Close dialog

```
End call

Stage reached        Objection (6)          (auto, editable)
Outcome              [ choose one of ten ]
Next step            [ none | document | call | meeting | referral ]
Channel / time       [ whatsapp | email | phone ]   [ Tue after 2 ]
Who proposed it      ( them ) ( us ) ( unclear )

Their need (stage 5)
  "want to grow exports, plant is running at sixty percent"

[ Save call ]   [ Cancel ]
```

**Ten outcome values** (the same words the dataset uses):
`agreed_to_receive_report`, `next_step_agreed`, `interested`, `follow_up`, `call_again`, `not_interested`, `do_not_call`, `wrong_person`, `moved_company`, `not_logged`.

Show a clear difference between **"no outcome recorded"** (`not_logged`) and **"not interested"**.

**Confirmation checks before saving** (rule-based, no LLM needed):

- Outcome is `not_logged` but the words mention WhatsApp, email or a time → "You noted a channel or time. Log it as a next step?"
- Outcome is `do_not_call` but no stage record says they asked not to be called → "They did not ask to be removed. Keep do-not-call?"
- Outcome is positive but no next step is set → "Positive outcome with no next step. Add one?"

### 7.5 Past-calls screen

```
Meridian Growth Partners · past calls                    Today · 8 calls

Where calls end
 Opening ▇▇▇ 3   Purpose ▇ 1   Permission ▇ 1   Business ▏0
 Need ▇ 1   Objection ▇▇ 2   Next step ▇▇▇ 3   Close ▏0
 (tap a stage to filter)

Mr. Arvind Sharma, Sharma Precision Components
Tuesday 2pm call agreed, he named the time
Next step
Today 11:40

Reception, Orbit Fasteners
Director not in, call after 2
Opening
Today 10:30
```

Each row: **prospect and company**, **one-line note** (the summary, with a plain fallback), **stage reached tag**, **time**. Optional outcome tag and a small dot where a mismatch is unresolved. Tap a row to open the stage-by-stage record. An unfinished call shows "In progress". Empty state: "No calls yet. Start one from the call screen."

---

## 8. Frontend design

**Stack:** React with Vite, hosted on Vercel. All data goes through the backend. No keys in the browser.

**Components**

```
App
├── HealthGate            pings /health, shows "waking server…"
├── CallScreen
│   ├── StageRail         eight numbered steps
│   ├── StageCard         purpose, three statements
│   ├── TapButtons        exactly four, one selected
│   ├── ProspectWords     the one text box
│   ├── NextAndEnd        Next: <stage>, End call
│   └── CloseDialog       outcome, next step, confirmation checks
└── CallList              past calls, where-calls-end strip, call detail
```

**State.** A small state machine: `idle → in_call(stage 1..8) → closing → saved`. Keep the current call id, stage, selected tap and words in component state, and mirror the call id in browser storage for refresh. Everything else is fetched.

**Behaviour to get right**

- Disable buttons while a save is in flight to prevent double clicks.
- Keep typed words if a save fails.
- The stage content comes from `GET /stages` (or the bundled `stage_content.json`), never hard-coded in components.
- Make the layout usable on a phone-width screen.
- Support Devanagari text in the words box and list (use a font stack with a Devanagari fallback).
- Keyboard: tab order follows the screen; Enter on a focused tap selects it.

---

## 9. Backend API contract

**Stack:** Python with FastAPI on Render. The backend holds the Supabase service key and the LLM key. CORS allows only the Vercel origin (plus localhost in development).

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/stages` | The eight stages with content |
| POST | `/calls` | Start a call |
| POST | `/calls/{call_id}/stages` | Save or update a stage result |
| POST | `/calls/{call_id}/close` | Close the call |
| GET | `/calls` | List calls, newest first |
| GET | `/calls/{call_id}` | One call with its stage results |
| POST | `/ai/summarize-call` | LLM one-line summary (also run during close) |

The first five rows other than `/stages` and `/calls/{id}` are the routes the brief names. The others are additions. Route names are your choice as long as the behaviours exist.

### Request and response examples

**`GET /health`** → `200 {"status":"ok"}`

**`POST /calls`**
```json
{ "prospect": "Arvind Sharma", "company": "Sharma Precision Components" }
```
→ `201`
```json
{ "id": "6f1c…", "prospect": "Arvind Sharma", "company": "Sharma Precision Components",
  "started_at": "2026-10-19T06:10:00Z", "current_stage": 1, "ended_stage": null,
  "outcome": null, "summary": null }
```

**`POST /calls/{call_id}/stages`** (upsert on `(call_id, stage_number)`)
```json
{ "stage_number": 5, "what_happened": "Named a goal",
  "prospect_words": "want to grow exports, plant is running at sixty percent" }
```
→ `200` the saved stage result. Also sets `calls.current_stage` to the highest stage saved.

**`POST /calls/{call_id}/close`**
```json
{ "outcome": "next_step_agreed", "ended_stage": 7,
  "next_step": { "type": "call", "channel": "phone", "when": "Tue after 2", "proposed_by": "prospect" } }
```
→ `200` the updated call, with `summary` if the LLM succeeded and `outcome_flag` if a check disagreed. Closing is idempotent: closing an already closed call returns it unchanged.

**`GET /calls`** → `200` array, newest first, each with `id, prospect, company, started_at, ended_at, ended_stage, current_stage, outcome, summary, outcome_flag`.

### Validation and errors

| Case | Response |
|---|---|
| Unknown `call_id` | `404 {"error":"call not found"}` |
| `stage_number` outside 1 to 8 | `422` with a clear message |
| Outcome not in the ten values | `422` |
| Words over the length cap (for example 2,000 characters) | `422` |
| Malformed JSON | `400` |
| Database failure | `502 {"error":"database unavailable"}`, never a stack trace |
| LLM failure | Close still succeeds; `summary` falls back to a plain line |

**Save rules**

- Prospect words are stored exactly as typed. The AI never edits them.
- Keep stage records when a call ends early.
- Do not require reaching stage 8.
- Log without secrets.

---

## 10. Supabase schema

Create these in the Supabase SQL editor (and commit the file as `supabase/schema.sql`).

```sql
create extension if not exists "pgcrypto";

create table if not exists stages (
  stage_number   int primary key check (stage_number between 1 and 8),
  name           text not null,
  purpose        text not null,
  likely_statements jsonb not null,   -- array of exactly 3 strings
  quick_outcomes jsonb not null,      -- array of exactly 4 strings
  watch_out      text,
  next_stage_number int
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
    'moved_company','not_logged')),
  next_step      jsonb,               -- {type, channel, when, proposed_by}
  summary        text,                -- LLM one-liner; never replaces prospect words
  outcome_flag   text,                -- reason a consistency check disagreed
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

create index if not exists idx_stage_results_call on stage_results (call_id);
create index if not exists idx_calls_started on calls (started_at desc);

-- The backend uses the service-role key. Turn on row-level security so the
-- tables are closed to anyone using the public anon key.
alter table stages        enable row level security;
alter table calls         enable row level security;
alter table stage_results enable row level security;
```

**Seed the `stages` table** from `stage_content.json` (a small script, or paste inserts into `supabase/seed_stages.sql`). The seed holds only your derived stage guidance, no transcript text.

**Notes**

- One stage result per stage per call (`unique (call_id, stage_number)`) with an upsert. Going back and editing a stage updates the same row.
- `ended_stage` is the stage where the caller ended the call. `current_stage` is the furthest stage opened.
- Never put the service-role key in frontend code.

---

## 11. LLM features and security

### Provider

Use one of Gemini (Google AI Studio), Cerebras, or Mistral on a free key. A reasonable default is **Gemini via Google AI Studio**. Keep the provider and model in environment variables (`LLM_PROVIDER`, `LLM_MODEL`) so you can swap them without code changes. State the actual provider and model in the README and in the video.

### Feature 1 (required minimum): one-line call summary

- **Input:** only the call's saved structured data: stage outcomes, the prospect's words, the final outcome, the next step.
- **Output:** one sentence, under about 25 words, stored in `calls.summary`.
- **Prompt rules:**
  - Do not invent needs, commitments, meeting times or next steps.
  - If nothing was recorded for something, say it was not recorded.
  - Keep "agreed to receive a document" distinct from "meeting confirmed".
  - Do not rewrite or quote beyond the supplied words.
  - Return plain text only.

**Prompt sketch (system):**
> You write a one-line summary of a cold call for a sales caller. Use only the facts provided. Do not add anything that is not in the data. If the prospect's need or next step is not recorded, say so. Do not claim a meeting unless the data says a meeting was agreed. Maximum 25 words.

### Feature 2 (optional, strong for the video): outcome consistency check

The logged-outcome mismatch is a real defect in the data (§4.6). After close, the model (and the rule checks in §7.4) compare the logged outcome with the prospect's words and return a verdict.

**Structured output (JSON only):**
```json
{
  "outcome_consistent": true,
  "reason": "",
  "suggested_outcome": "",
  "next_step_found": { "channel": "", "when": "", "proposed_by": "" }
}
```

- Validate that `suggested_outcome` is one of the ten values or empty.
- This **suggests**; it never silently overwrites the caller's choice. The caller confirms.

### Why after the call, not live

A live suggestion adds latency in a conversation that lasts about a minute and a half, and a wrong hint mid-call is worse than none. After the call there is no time pressure, and a failure costs nothing. Be ready to say this when asked why you chose that feature.

### Robustness

- Timeout (for example 10 seconds), one retry, then fall back.
- Strip code fences, parse JSON, and validate every field.
- Fallback summary example: "Reached stage 6 (Objection). Outcome: not interested."
- Saving and listing calls must work even if the LLM is down.
- Verify the original prospect words are unchanged after the LLM runs.

### Security

- API key only in Render environment variables.
- The frontend calls the backend, never the LLM provider.
- Never prefix a secret with `VITE_` (Vite embeds those in client code).
- Do not commit `.env` files. Keep `.env.example` with names only.
- If a key is ever committed, revoke and rotate it. Deleting it in a later commit is not enough.
- Handle provider timeouts, rate limits and malformed responses.
- Do not send more call data to the provider than needed.

---

## 12. Technology choices

DeepThought specifies the hosting (Supabase, Render, Vercel) and the LLM options, not the frameworks. A straightforward stack:

- **Frontend:** React + Vite
- **Backend:** Python + FastAPI (with `httpx` or the Supabase Python client)
- **Database:** Supabase Postgres
- **Hosting:** Vercel (frontend), Render (backend)
- **LLM:** Gemini, Cerebras or Mistral

Use a stack you can finish and explain. AI coding assistants are allowed, but you must be able to explain every part on camera.

---

## 13. Build procedure and time plan

### Time plan (work back from Wednesday 21 October, 9:47 am)

| Window | Goal |
|---|---|
| **Monday, first hours** | Read the three materials, set up repo, Supabase, Render and Vercel accounts, get the LLM key. Deploy a **skeleton end to end** early (Vercel → Render → Supabase, saving one stage). |
| **Monday, rest** | Stage content, backend endpoints, live-call screen working against the database. |
| **Tuesday morning** | Past-calls screen, close dialog and checks, error states, cold-start handling. |
| **Tuesday midday** | LLM feature with validation and fallback. Deployed end-to-end test. |
| **Tuesday afternoon** | README with real URLs, clean repo, final checks. |
| **Tuesday evening** | Rehearse once, record the video, upload to Drive, verify the link. |
| **Tuesday night** | Submit (repo and video), then send the CEO message. Leave the morning as a **buffer**, not a plan. |

Aim to be submission-ready by Tuesday evening. A deadline at 9:47 am Wednesday is a bad time to find a broken link.

### Phase 1: Read and analyze before writing content

1. Read the structure page and reference screen.
2. Extract the eight stages.
3. Open the ZIP, read its README and index.
4. Hand-read a spread of calls (good and bad outcomes, short and long, English and Hindi).
5. Use §4 as the starting analysis; fix the ambiguous cases in `call_coding.csv`.
6. Write the short evidence and limitations note.
7. Finalise `stage_content.json`.

### Phase 2: Database

1. Create the Supabase project.
2. Run `schema.sql`, then the seed.
3. Confirm the tables and foreign key exist.
4. Test an insert and a read.
5. Keep keys out of source control.

### Phase 3: Backend

1. `/health`
2. `/stages`
3. `POST /calls`
4. `POST /calls/{id}/stages` (upsert)
5. `POST /calls/{id}/close` (with checks)
6. `GET /calls` and `GET /calls/{id}`
7. LLM route with validation and fallback
8. Validation, error responses, CORS
9. Test each endpoint locally

### Phase 4: Frontend

1. Health gate and cold-start message
2. Stage rail, stage card, taps, words box
3. All eight stages from the API
4. Next, Back and End call on every stage
5. Close dialog and confirmation checks
6. Past-calls list, filter strip, call detail
7. Error handling that keeps typed input
8. Confirm saved calls survive a refresh

### Phase 5: LLM integration

1. Get the key and store it in Render only.
2. Send only the saved call data.
3. Validate the output; keep a fallback.
4. Confirm prospect words are untouched.
5. Test with the LLM failing.

### Phase 6: Local end-to-end test

Run every scenario in §16.

### Phase 7: Deploy

1. Push to a public GitHub repo.
2. Deploy the backend on Render; set env vars and CORS.
3. Verify the Render health URL.
4. Deploy the frontend on Vercel; set the API base URL.
5. Verify start, save, close and list on the live app.
6. Update the README with the real URLs.

Render free services sleep when idle. Allow for a 30 to 60 second cold start, and warm the service right before recording and submitting.

### Phase 8: Demo and submission

See §17 and §18.

---

## 14. Environment variables

**Backend (Render)**
```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL=
FRONTEND_ORIGIN=
```

**Frontend (Vercel)**
```env
VITE_API_BASE_URL=
```

Only public configuration belongs in frontend variables. The service-role key can bypass database policies, so protect it.

---

## 15. Repository structure

```text
cold-call-companion/
├── README.md                 # this file, with real URLs filled in
├── .gitignore                # .env, node_modules, venv, any local data
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── api.js
│       ├── components/
│       ├── pages/
│       └── data/stage_content.json
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── main.py
│   ├── llm.py
│   ├── checks.py
│   └── tests/
└── supabase/
    ├── schema.sql
    └── seed_stages.sql
```

**Never commit:** the transcript ZIP, any raw transcript, `call_coding.csv`, `.env` files, or keys.

---

## 16. Testing and acceptance checklist

### Product workflow
- [ ] All eight stages appear in order
- [ ] Each stage shows a purpose line
- [ ] Each stage shows three transcript-informed statements
- [ ] Each stage has exactly four taps
- [ ] The live screen has one free-text box
- [ ] The next stage is named
- [ ] End Call works from every stage, including stage 1
- [ ] Early endings are supported
- [ ] Outcome and next step can be recorded
- [ ] Stage 5 wording is preserved exactly
- [ ] Past Calls lists persisted calls with the stage reached

### Scenarios to run
- [ ] Start a call, save stage 1, advance a few stages
- [ ] Go back to a stage and edit it (no duplicate row)
- [ ] End at stage 1 with "wrong person"
- [ ] End at stage 2 or 3 (early)
- [ ] End at stage 6 with a deflection and still set a next step
- [ ] Finish at stage 7 or 8 with a next step
- [ ] Close with no confirmed next step
- [ ] `not_logged` with a WhatsApp mention → confirmation appears
- [ ] `do_not_call` with no request → confirmation appears
- [ ] Refresh mid-call → call resumes
- [ ] Refresh on the list → calls remain
- [ ] Open a saved call and see its stage results
- [ ] Hindi or Hinglish text saves and displays correctly
- [ ] Double-click Next → no duplicate stage result
- [ ] Missing or invalid input, nonexistent call ID → clean errors
- [ ] LLM key removed → close still succeeds with a fallback summary
- [ ] Cold start → "waking server…" appears and clears

### Backend and database
- [ ] `/health` works on Render
- [ ] Each endpoint behaves as in §9
- [ ] Records survive refreshes and redeploys
- [ ] The key is not visible in the browser or the repo
- [ ] A few automated tests exist for validation and the consistency checks

### Research integrity
- [ ] The stage-ending rule is documented (§4.3)
- [ ] Ambiguous calls were reviewed by hand
- [ ] Stage 2, 3 and 6 lines come from the transcript analysis
- [ ] Counts you plan to say were re-checked
- [ ] Dataset limitations are documented
- [ ] No raw transcripts in the repo

### Deployment and submission
- [ ] Public repo opens signed out
- [ ] Repo has frontend, backend and SQL schema
- [ ] README has the real Vercel and Render URLs
- [ ] README names the LLM and what it does
- [ ] Vercel app works in a private window
- [ ] Health endpoint responds
- [ ] Deployed app saves and retrieves calls
- [ ] Video is at least six minutes
- [ ] Camera visible throughout the walkthrough
- [ ] Drive link set to "Anyone with the link", opened signed out
- [ ] Repo and video links submitted through the form
- [ ] CEO WhatsApp message sent

---

## 17. Demo video plan

**Format:** you on camera, with the screen recording shown. **At least six minutes** (no upper limit; aim for 6:30 to 8). **Unscripted.** A read-out video "tells us nothing we want to know". Use prompts, not sentences.

### Which transcript to walk through

Pick one call and play the caller yourself. Good options (read them first and choose what you can narrate naturally):

- **T046** (about 162 s): the prospect asks for WhatsApp and agrees to a call on a named day and time, yet the caller logged nothing. It shows stages 1 to 3, a thin stage 5, a stage 7 next step, and the **outcome mismatch** your close dialog catches.
- **T001** (about 75 s): a clean follow-up call that ends with a meeting the prospect time-boxes. Good for a short, tidy run.
- **T028** or **T003**: an **early end** at stage 1 or an early decline, to show End Call from the first stage.

### Outline

1. **0:00 – 0:45 — Problem and design.** What the companion is, why it must be glanceable.
2. **0:45 – 1:45 — The stages.** Show the eight stages; say how reading the calls shaped what each shows.
3. **1:45 – 3:30 — Live walkthrough.** Start a call, tap, type the prospect's words, move through stages on a real transcript.
4. **3:30 – 4:15 — Early end.** End a call before stage 8 and record the outcome.
5. **4:15 – 5:00 — Past calls.** Show the saved call and the stage reached; refresh to prove persistence.
6. **5:00 – 5:45 — The LLM.** Show a real generated summary; name the provider and why that feature; say its limits.
7. **5:45 – 7:00 — One decision and why.** For example: asking for confirmation when a logged outcome disagrees with the words, because the transcripts showed that mismatch. State a trade-off and what you would do with another week.

### Things worth saying (as ideas, not a script)

- Most calls are short (median about a minute and a half), so the screen has to be glanceable.
- The stage that matters most (their need, in their words) is the one callers skip most, so the box is large and the AI can never overwrite it.
- Most objections are deflections, not refusals, so the screen separates them.
- The caller's logged outcome is not always what the call supports.
- Why the LLM runs after the call, not live.

### Questions to be ready for

- Why this LLM and this feature?
- What does the model do when it is wrong, and what happens if it is down?
- How did the transcripts change the screen?
- What would you build next?
- How reliable are your counts, and how did you check?

### Recording checklist

- [ ] Backend warmed up just before recording
- [ ] Camera on, face visible the whole time; screen visible too
- [ ] Quiet room, good light, notifications off
- [ ] Run the live app, not slides
- [ ] Longer than six minutes (check the file duration)
- [ ] Upload to Google Drive; set to "Anyone with the link" as Viewer
- [ ] Open the link in a private window to confirm it plays and shows the duration

---

## 18. Submission and the CEO message

### Fields to prepare

- **Public GitHub repository:** `https://github.com/<your-username>/<your-repository>`
- **Live Vercel app:** `<actual Vercel URL>`
- **Render health endpoint:** `<actual Render URL>/health`
- **Google Drive demo video:** `<share link, Anyone with the link can view>`
- **LLM used:** `<provider and model>`
- **LLM feature:** `<what it does>`

Replace every placeholder with a verified value. Never invent a URL or claim a deployment works without checking.

### Order of submission

1. Verify every link in a private window.
2. Warm the Render service and the Supabase project (free projects can pause when idle).
3. Send the repo link and the video link through the **"Send my repo and video"** form. Each file is opened and checked; a link that cannot be opened is refused. You may send up to 10 times an hour.
4. Then use the **WhatsApp message to the CEO** from your own task page. It opens the chat with your links and questions already filled in once your work is in.

### The CEO message

This step is yours. Do not outsource the thinking to an assistant. The page says the video and the WhatsApp message are the parts that are only you. Read the questions that appear in the prefilled message and think about your answers before you send it.

---

## 19. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Render cold start looks like a bug | Health gate with "waking server…"; warm before recording |
| Supabase project paused by inactivity | Make a request just before submitting |
| Drive video set to Restricted | Test the link signed out |
| Video shorter than six minutes | Check the file duration; aim for 6:30 or more |
| LLM down or rate-limited | Fallback summary; saving never depends on the LLM |
| Key leaked in the repo | `.gitignore`, `.env.example`; rotate immediately if leaked |
| Transcript text in the repo | Commit derived guidance only; keep the CSV private |
| Quoting an unreliable statistic | Re-check any number before saying it; say "roughly" |
| Running out of time | Skeleton deployed early; submit Tuesday night |
| Hidden scoring criteria not read | Read "What we read for" on the live page |
| Over-building | Out of scope: login, dialer integration, audio, analytics dashboards, multi-user |

---

## 20. Limitations and honest status

- This document specifies and plans. It does not prove any code was written, tested or deployed.
- The transcript analysis is a first pass: rule-based, partly hand-checked, roughly 60 to 75 percent agreement on a 20-call spot-check. The stage-ending distribution is **not verified** until the ambiguous calls are reviewed by hand.
- The dataset warns about outcome labels that do not match the call, swapped speaker labels, truncated turns, and mixed languages.
- Stage 4 and 5 content rests more on the structure page than on transcript frequency.
- The app has no accounts, no dialer integration and no audio. Stage content fits consultative growth-report calls best.

---

## 21. References

- Task page: https://sainikpuri.deepthought.education/fde-hyderabad-v2
- Structure of a cold call: https://sainikpuri.deepthought.education/fde-hyderabad-v2/structure
- Reference screen: https://sainikpuri.deepthought.education/fde-hyderabad-v2/reference
- 100-call transcript ZIP: https://sainikpuri.deepthought.education/fde/cold-call-transcripts-100.zip
- Gemini API key: https://aistudio.google.com/apikey
- Cerebras: https://cloud.cerebras.ai/
- Mistral: https://console.mistral.ai/

The transcripts are provided for this task only. Do not publish them or attempt to identify the original people or companies.

---

## 22. Appendices

### A. The ten outcome values

| Value | Meaning as the callers used it |
|---|---|
| `agreed_to_receive_report` | Prospect agreed to receive a document on WhatsApp or email |
| `next_step_agreed` | A meeting, a call at a set time, or a report plus a follow-up call was agreed |
| `interested` | Prospect said they were interested, no fixed next step |
| `follow_up` | Caller is to call again |
| `call_again` | Number to be called again, often because of language or line quality |
| `not_interested` | Prospect declined |
| `do_not_call` | Prospect asked not to be called, or the caller judged it so |
| `wrong_person` | Person reached was not the person listed, or not the right person |
| `moved_company` | Person no longer works at the listed company |
| `not_logged` | Caller logged nothing |

### B. Stage-to-database mapping

| Screen element | Database field |
|---|---|
| Stage number | `stage_results.stage_number`, `calls.current_stage` |
| Selected tap | `stage_results.what_happened` |
| Prospect's words | `stage_results.prospect_words` |
| Stage reached on the list | `calls.ended_stage` (fallback `current_stage`) |
| Outcome | `calls.outcome` |
| Next step | `calls.next_step` |
| One-line note on the list | `calls.summary` |
| Mismatch dot | `calls.outcome_flag` is not null |
| "Where calls end" strip | `select ended_stage, count(*) from calls group by ended_stage` |

### C. Out of scope (do not build)

Login or accounts, real phone or dialer integration, call recording or audio, analytics dashboards, multi-user or team features, a mobile app, fine-tuned models.

### D. Definition of done

A stranger can open the Vercel link in a private window, start a call, walk the stages, end it from any stage, close it with an outcome, see it in Past Calls after a refresh, and see a model-written summary, while the repo contains no secrets and no transcripts, and the video plays for anyone with the link.
