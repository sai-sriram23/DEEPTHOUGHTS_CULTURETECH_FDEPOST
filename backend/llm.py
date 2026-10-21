"""
LLM Integration Module (Groq / Gemini / Fallback)
Provides one-line call summaries and outcome consistency checks.
Supports high-throughput Groq API (llama-3.3-70b-versatile, llama-3.1-8b-instant)
while presenting as Gemini AI on the frontend UI.
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
    Generates a concise one-line call summary (<25 words) using Groq or Gemini.
    Returns: (summary_text, summary_source) where summary_source is 'llm' or 'fallback'.
    On the UI, 'llm' displays as '✨ Gemini AI'.
    """
    # 1. Resolve API keys: support GROQ_API_KEY, LLM_API_KEY, GEMINI_API_KEY
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    llm_api_key = os.getenv("LLM_API_KEY", "").strip()
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()

    provider = os.getenv("LLM_PROVIDER", "").lower().strip()
    model = os.getenv("LLM_MODEL", "").strip()

    # Auto-detect Groq: if GROQ_API_KEY exists, or LLM_API_KEY starts with 'gsk_', or provider is 'groq'
    active_key = ""
    is_groq = False

    if groq_api_key:
        active_key = groq_api_key
        is_groq = True
    elif llm_api_key.startswith("gsk_") or provider == "groq":
        active_key = llm_api_key
        is_groq = True
    elif llm_api_key:
        active_key = llm_api_key
        # Check if key is Groq or Gemini
        is_groq = llm_api_key.startswith("gsk_")
    elif gemini_api_key:
        active_key = gemini_api_key
        is_groq = False

    if not active_key:
        logger.info("No active LLM API key found (GROQ_API_KEY or LLM_API_KEY). Using fallback summary.")
        return build_fallback_summary(ended_stage, outcome, next_step, stage_results), "fallback"

    # Build prompt context strictly from captured stage data
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
        "Write a complete, informative 1-sentence summary of this call (10 to 25 words):"
    )

    # 2. Try Groq (Primary high free-tier engine)
    if is_groq:
        groq_model = model if (model and not model.startswith("gemini-")) else "llama-3.3-70b-versatile"
        endpoint = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {active_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": groq_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 80
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(endpoint, headers=headers, json=payload)

                # If 70b is rate-limited or fails, try 8b instant
                if res.status_code != 200 and groq_model != "llama-3.1-8b-instant":
                    logger.warning(f"Groq ({groq_model}) returned {res.status_code}. Retrying with llama-3.1-8b-instant...")
                    payload["model"] = "llama-3.1-8b-instant"
                    res = await client.post(endpoint, headers=headers, json=payload)

                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices:
                        raw_text = choices[0].get("message", {}).get("content", "").strip()
                        if raw_text:
                            cleaned = raw_text.strip('"\' \n\r')
                            logger.info(f"Groq API successfully generated summary: {cleaned}")
                            return cleaned, "llm"
                else:
                    logger.error(f"Groq API returned status {res.status_code}: {res.text}")
        except Exception as exc:
            logger.error(f"Groq API call error: {exc}", exc_info=True)

    # 3. Fallback to Gemini if key is a Gemini key or Groq failed
    if not is_groq:
        gemini_model = model if (model and model.startswith("gemini-")) else "gemini-3.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={active_key}"
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 100,
            }
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                        if text:
                            cleaned = text.strip('"\' \n\r')
                            logger.info(f"Gemini API successfully generated summary: {cleaned}")
                            return cleaned, "llm"
                else:
                    logger.error(f"Gemini API returned status {res.status_code}: {res.text}")
        except Exception as exc:
            logger.error(f"Gemini API call error: {exc}", exc_info=True)

    logger.warning("Falling back to deterministic rule-based summary.")
    return build_fallback_summary(ended_stage, outcome, next_step, stage_results), "fallback"
