"""
LLM Integration Module (Google Gemini / Fallback)
Provides one-line call summaries and outcome consistency checks.
Strictly preserves prospect words, returns summary_source, and provides reliable fallbacks.
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
import httpx

logger = logging.getLogger("coldcall.llm")

STAGE_NAMES = {
    1: "Opening",
    2: "Purpose",
    3: "Permission",
    4: "Their business",
    5: "Their need, in their words",
    6: "Objection",
    7: "Next step",
    8: "Close"
}


def build_fallback_summary(
    ended_stage: Optional[int],
    outcome: Optional[str],
    next_step: Optional[Dict[str, Any]],
    stage_results: List[Dict[str, Any]]
) -> str:
    """Deterministic fallback summary when LLM is unavailable or fails."""
    stage_num = ended_stage or 1
    stage_name = STAGE_NAMES.get(stage_num, f"Stage {stage_num}")
    outcome_str = (outcome or "in progress").replace("_", " ")

    # Check if stage 5 has verbatim need words
    stage_5 = next((r for r in stage_results if r.get("stage_number") == 5), None)
    need_words = stage_5.get("prospect_words", "").strip() if stage_5 else ""

    next_step_str = ""
    if next_step and next_step.get("type") and next_step.get("type") != "none":
        when = f" for {next_step.get('when')}" if next_step.get('when') else ""
        channel = f" via {next_step.get('channel')}" if next_step.get('channel') else ""
        next_step_str = f" Next step: {next_step.get('type')}{channel}{when}."

    if need_words:
        truncated_need = (need_words[:45] + "...") if len(need_words) > 45 else need_words
        return f"Ended at {stage_name} ({outcome_str}). Need: '{truncated_need}'.{next_step_str}".strip()

    return f"Ended at {stage_name} ({outcome_str}).{next_step_str}".strip()


async def generate_call_summary(
    prospect: str,
    company: Optional[str],
    ended_stage: Optional[int],
    outcome: Optional[str],
    next_step: Optional[Dict[str, Any]],
    stage_results: List[Dict[str, Any]]
) -> Tuple[str, str]:
    """
    Generates a concise one-line call summary (<25 words) using the configured LLM.
    Returns: (summary_text, summary_source) where summary_source is 'llm' or 'fallback'.
    """
    api_key = os.getenv("LLM_API_KEY", "").strip()
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    # Use current active Flash model from Google AI Studio (gemini-2.5-flash)
    model = os.getenv("LLM_MODEL", "gemini-2.5-flash").strip()

    if not api_key:
        logger.info("LLM_API_KEY not set. Using deterministic fallback summary.")
        return build_fallback_summary(ended_stage, outcome, next_step, stage_results), "fallback"

    # Format structured context strictly from saved data
    history_lines = []
    for sr in sorted(stage_results, key=lambda x: x.get("stage_number", 0)):
        num = sr.get("stage_number")
        sname = STAGE_NAMES.get(num, f"Stage {num}")
        taps = sr.get("what_happened") or "No tap recorded"
        words = sr.get("prospect_words") or ""
        history_lines.append(f"Stage {num} ({sname}): Tap='{taps}', Prospect words='{words}'")

    context_str = "\n".join(history_lines)
    next_step_json = json.dumps(next_step) if next_step else "None"

    system_prompt = (
        "You write a concise one-line summary of a cold call for a sales caller. "
        "Use ONLY the facts provided. Do NOT invent needs, commitments, or next steps. "
        "If the prospect's need or next step was not recorded, say so. "
        "Keep 'agreed to receive a document' strictly distinct from 'meeting confirmed'. "
        "Maximum 25 words. Plain text only, no markdown, no quotes."
    )

    user_prompt = (
        f"Prospect: {prospect}\n"
        f"Company: {company or 'Unknown'}\n"
        f"Ended Stage: {ended_stage or 'In progress'}\n"
        f"Logged Outcome: {outcome or 'not_logged'}\n"
        f"Next Step: {next_step_json}\n\n"
        f"Recorded Stage Data:\n{context_str}\n\n"
        "Provide the 1-sentence summary (under 25 words):"
    )

    try:
        if provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"parts": [{"text": user_prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 60,
                }
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                        if text:
                            cleaned = text.strip('"\' \n\r')
                            logger.info(f"Gemini ({model}) successfully generated summary.")
                            return cleaned, "llm"
                else:
                    logger.error(f"Gemini API returned status {res.status_code}: {res.text}")
        elif provider in ["mistral", "cerebras"]:
            endpoint = (
                "https://api.mistral.ai/v1/chat/completions"
                if provider == "mistral"
                else "https://api.cerebras.ai/v1/chat/completions"
            )
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 60
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    endpoint,
                    headers={"Authorization": f"Bearer {api_key}"},
                    json=payload
                )
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices:
                        text = choices[0].get("message", {}).get("content", "").strip()
                        if text:
                            return text.strip('"\' \n\r'), "llm"
                else:
                    logger.error(f"{provider.capitalize()} API returned status {res.status_code}: {res.text}")
    except Exception as exc:
        logger.error(f"LLM request failed: {exc}", exc_info=True)

    logger.warning("Falling back to deterministic rule-based summary.")
    return build_fallback_summary(ended_stage, outcome, next_step, stage_results), "fallback"
