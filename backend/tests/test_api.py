import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Ensure test uses local SQLite
os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = ""
os.environ["LLM_API_KEY"] = ""

from main import app
from checks import check_outcome_consistency

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_stages():
    response = client.get("/stages")
    assert response.status_code == 200
    stages = response.json()
    assert len(stages) == 8
    for s in stages:
        assert 1 <= s["stage_number"] <= 8
        assert len(s["likely_statements"]) == 3
        assert len(s["quick_outcomes"]) == 4
        assert s["purpose"] != ""


def test_call_lifecycle_and_upsert():
    # 1. Start call
    create_res = client.post("/calls", json={
        "prospect": "Arvind Sharma",
        "company": "Sharma Precision Components"
    })
    assert create_res.status_code == 201
    call = create_res.json()
    call_id = call["id"]
    assert call["prospect"] == "Arvind Sharma"
    assert call["current_stage"] == 1

    # 2. Record Stage 1
    s1_res = client.post(f"/calls/{call_id}/stages", json={
        "stage_number": 1,
        "what_happened": "Right person",
        "prospect_words": "reception put me through to desk"
    })
    assert s1_res.status_code == 200
    assert s1_res.json()["stage_number"] == 1

    # 3. Re-save/edit Stage 1 (ensure upsert, not duplicate)
    s1_edit_res = client.post(f"/calls/{call_id}/stages", json={
        "stage_number": 1,
        "what_happened": "Right person",
        "prospect_words": "reception put me through directly"
    })
    assert s1_edit_res.status_code == 200

    # 4. Record Stage 5 with exact verbatim need words
    exact_words = "want to grow exports, plant is running at sixty percent"
    s5_res = client.post(f"/calls/{call_id}/stages", json={
        "stage_number": 5,
        "what_happened": "Named a goal",
        "prospect_words": exact_words
    })
    assert s5_res.status_code == 200

    # 5. Check call detail before close
    detail_res = client.get(f"/calls/{call_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["current_stage"] == 5
    # Should only have 2 stage results (stage 1 and stage 5), no duplicates
    assert len(detail["stage_results"]) == 2

    # 6. Close call with positive outcome and next step
    close_res = client.post(f"/calls/{call_id}/close", json={
        "ended_stage": 7,
        "outcome": "next_step_agreed",
        "next_step": {
            "type": "call",
            "channel": "phone",
            "when": "Tue after 2",
            "proposed_by": "prospect"
        }
    })
    assert close_res.status_code == 200
    closed_call = close_res.json()
    assert closed_call["ended_stage"] == 7
    assert closed_call["outcome"] == "next_step_agreed"
    assert closed_call["summary"] is not None
    assert closed_call["summary_source"] in ["llm", "fallback"]
    assert closed_call["ended_at"] is not None

    # Verify Stage 5 verbatim words were completely untouched
    detail_after = client.get(f"/calls/{call_id}").json()
    s5_saved = next(r for r in detail_after["stage_results"] if r["stage_number"] == 5)
    assert s5_saved["prospect_words"] == exact_words


def test_early_end_stage_one():
    # Test early end at stage 1 (e.g. wrong person)
    create_res = client.post("/calls", json={"prospect": "Unknown", "company": "ABC Corp"})
    call_id = create_res.json()["id"]

    client.post(f"/calls/{call_id}/stages", json={
        "stage_number": 1,
        "what_happened": "Wrong person or left",
        "prospect_words": "he left six months ago"
    })

    close_res = client.post(f"/calls/{call_id}/close", json={
        "ended_stage": 1,
        "outcome": "wrong_person",
        "next_step": None
    })
    assert close_res.status_code == 200
    assert close_res.json()["outcome"] == "wrong_person"
    assert close_res.json()["ended_stage"] == 1


def test_validation_errors():
    # 1. Non-existent call id
    res_404 = client.get("/calls/00000000-0000-0000-0000-000000000000")
    assert res_404.status_code == 404

    # 2. Invalid stage number (<1 or >8)
    create_res = client.post("/calls", json={"prospect": "Test"})
    cid = create_res.json()["id"]

    res_stage_invalid = client.post(f"/calls/{cid}/stages", json={
        "stage_number": 9,
        "what_happened": "Something"
    })
    assert res_stage_invalid.status_code == 422

    # 3. Invalid outcome
    res_outcome_invalid = client.post(f"/calls/{cid}/close", json={
        "ended_stage": 2,
        "outcome": "made_up_outcome"
    })
    assert res_outcome_invalid.status_code == 422


def test_consistency_checks():
    # Outcome not_logged but WhatsApp mentioned in prospect words
    flag = check_outcome_consistency(
        outcome="not_logged",
        next_step=None,
        stage_results=[{"stage_number": 3, "what_happened": "Send WhatsApp first", "prospect_words": "send details on whatsapp"}]
    )
    assert flag is not None
    assert "channel, time, or next step" in flag

    # Outcome do_not_call without explicit request
    flag_dnc = check_outcome_consistency(
        outcome="do_not_call",
        next_step=None,
        stage_results=[{"stage_number": 6, "what_happened": "Already have a team", "prospect_words": "we have an in-house consultant"}]
    )
    assert flag_dnc is not None
    assert "without explicitly requesting removal" in flag_dnc
