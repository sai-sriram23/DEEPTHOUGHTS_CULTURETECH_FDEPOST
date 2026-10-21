import pytest
import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from llm import generate_call_summary


@pytest.mark.asyncio
async def test_groq_api_call_success():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Arvind Sharma discussed manufacturing plant rejection rate; agreed to phone follow-up on Tuesday."
                }
            }
        ]
    }

    with patch.dict(os.environ, {"GROQ_API_KEY": "gsk_test123456789", "LLM_PROVIDER": "groq"}):
        with patch("httpx.AsyncClient.post", return_value=mock_response):
            summary, source = await generate_call_summary(
                prospect="Arvind Sharma",
                company="Sharma Precision Components",
                ended_stage=7,
                outcome="next_step_agreed",
                next_step={"type": "call", "when": "Tue after 2"},
                stage_results=[
                    {"stage_number": 5, "what_happened": "Named a goal", "prospect_words": "plant rejection rate is 12 percent"}
                ]
            )

            assert source == "llm"
            assert "Arvind Sharma" in summary


@pytest.mark.asyncio
async def test_groq_fallback_on_error():
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"

    with patch.dict(os.environ, {"GROQ_API_KEY": "gsk_test123456789", "LLM_PROVIDER": "groq"}):
        with patch("httpx.AsyncClient.post", return_value=mock_response):
            summary, source = await generate_call_summary(
                prospect="Dr. Anjali Menon",
                company="Menon Family Clinic",
                ended_stage=2,
                outcome="not_interested",
                next_step=None,
                stage_results=[]
            )

            assert source == "fallback"
            assert "Ended at Purpose" in summary
