"""
Outcome Consistency and Validation Checks
Implements transcript-informed validation rules described in Section 7.4 and Section 11.
"""
import re
from typing import Dict, Any, List, Optional


TIME_CHANNEL_PATTERNS = [
    r"\bwhatsapp\b",
    r"\bemail\b",
    r"\bmail\b",
    r"\btuesday\b",
    r"\bwednesday\b",
    r"\bthursday\b",
    r"\bfriday\b",
    r"\bmonday\b",
    r"\btomorrow\b",
    r"\bafter\s+\w+\b",
    r"\bcall\s+at\b",
    r"\bcall\s+after\b",
    r"\bcall\s+back\b",
    r"\bmeeting\b",
    r"\b\d{1,2}(:\d{2})?\s*(am|pm)\b",
]

DO_NOT_CALL_WORDS = [
    r"\bdo\s+not\s+call\b",
    r"\bdon'?t\s+call\b",
    r"\bremove\s+my\s+number\b",
    r"\bstop\s+calling\b",
    r"\bnever\s+call\b",
    r"\bblock\b"
]


def check_outcome_consistency(
    outcome: Optional[str],
    next_step: Optional[Dict[str, Any]],
    stage_results: List[Dict[str, Any]]
) -> Optional[str]:
    """
    Evaluates whether the logged outcome matches the conversation content.
    Returns a warning/discrepancy description if an inconsistency is detected, or None.
    """
    if not outcome:
        return None

    # Collect all prospect words and what_happened across all stages
    all_words = " ".join([
        (r.get("prospect_words") or "") + " " + (r.get("what_happened") or "")
        for r in stage_results
    ]).lower()

    has_time_or_channel = any(re.search(pat, all_words, re.IGNORECASE) for pat in TIME_CHANNEL_PATTERNS)
    has_explicit_dnc = any(re.search(pat, all_words, re.IGNORECASE) for pat in DO_NOT_CALL_WORDS)
    has_next_step = bool(next_step and next_step.get("type") and next_step.get("type") != "none")

    # 1. Outcome is not_logged but conversation indicated a channel, time, or agreed step
    if outcome == "not_logged":
        if has_next_step or has_time_or_channel:
            return "A channel, time, or next step was noted in conversation, but call outcome was left as not_logged."

    # 2. Outcome is do_not_call, but no explicit do-not-call request was made
    if outcome == "do_not_call":
        if not has_explicit_dnc:
            return "Logged as do_not_call, but prospect gave a deflection or standard refusal without explicitly requesting removal."

    # 3. Positive outcome without any next step
    positive_outcomes = {"agreed_to_receive_report", "next_step_agreed", "interested", "follow_up"}
    if outcome in positive_outcomes and not has_next_step:
        return f"Positive outcome '{outcome}' was logged without specifying a concrete next step or follow-up schedule."

    # 4. next_step_agreed but next step type is empty or 'none'
    if outcome == "next_step_agreed" and not has_next_step:
        return "Logged as next_step_agreed, but no concrete meeting, call, or document step was recorded."

    # 5. Outcome is wrong_person or moved_company, but next step was logged
    if outcome in {"wrong_person", "moved_company", "not_interested"} and has_next_step:
        return f"Call ended as '{outcome}', but a conflicting next step was also recorded."

    return None
