"""
FastAPI Backend for DeepThought Cold-Call Companion.
Complies with the exact API contract in Section 9 of the project specification.
"""
import os
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv

from db import get_db
from checks import check_outcome_consistency
from llm import generate_call_summary

load_dotenv()

app = FastAPI(
    title="Cold-Call Companion API",
    description="Backend API for DeepThought Cold-Call Companion application",
    version="1.0.0"
)

# CORS configuration: allow all web origins (Vercel production, preview branches, localhost)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://deepthoughts-culturetech-fdepost.vercel.app"
]
frontend_origin = os.getenv("FRONTEND_ORIGIN", "").strip()
if frontend_origin and frontend_origin not in origins:
    origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_OUTCOMES = {
    "agreed_to_receive_report",
    "next_step_agreed",
    "interested",
    "follow_up",
    "call_again",
    "not_interested",
    "do_not_call",
    "wrong_person",
    "moved_company",
    "not_logged"
}


# --- Pydantic Schemas ---

class CreateCallRequest(BaseModel):
    prospect: str = Field(..., min_length=1, max_length=200, description="Name of the prospect")
    company: Optional[str] = Field(None, max_length=200, description="Company name")


class StageResultRequest(BaseModel):
    stage_number: int = Field(..., ge=1, le=8, description="Stage number from 1 to 8")
    what_happened: Optional[str] = Field(None, max_length=200, description="Selected tap description")
    prospect_words: Optional[str] = Field(None, max_length=2000, description="Verbatim prospect words")


class CloseCallRequest(BaseModel):
    ended_stage: int = Field(..., ge=1, le=8, description="Stage reached when call ended")
    outcome: str = Field(..., description="One of the ten logged outcome values")
    next_step: Optional[Dict[str, Any]] = Field(None, description="Structured next step details")

    @field_validator("outcome")
    @classmethod
    def validate_outcome(cls, v: str) -> str:
        if v not in VALID_OUTCOMES:
            raise ValueError(f"Invalid outcome '{v}'. Must be one of: {sorted(list(VALID_OUTCOMES))}")
        return v


class SummarizeCallRequest(BaseModel):
    call_id: Optional[str] = None
    prospect: Optional[str] = "Prospect"
    company: Optional[str] = None
    ended_stage: Optional[int] = None
    outcome: Optional[str] = None
    next_step: Optional[Dict[str, Any]] = None
    stage_results: Optional[List[Dict[str, Any]]] = None


# --- API Routes ---

@app.get("/health", status_code=status.HTTP_200_OK)
def health():
    """Liveness check for cold-start gating and monitoring."""
    return {"status": "ok"}


@app.get("/stages", status_code=status.HTTP_200_OK)
def get_stages():
    """Returns the eight cold-call stages with guidance and options."""
    try:
        db = get_db()
        stages = db.get_stages()
        return stages
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Database unavailable")


@app.post("/calls", status_code=status.HTTP_201_CREATED)
def start_call(payload: CreateCallRequest):
    """Starts a new call session and creates a persistent database record."""
    try:
        db = get_db()
        new_call = db.create_call(payload.prospect.strip(), payload.company.strip() if payload.company else None)
        return new_call
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Database unavailable")


@app.post("/calls/{call_id}/stages", status_code=status.HTTP_200_OK)
def save_stage_result(call_id: str, payload: StageResultRequest):
    """Upserts a stage result for the given call and advances current_stage."""
    db = get_db()
    call = db.get_call(call_id)
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="call not found")

    try:
        result = db.upsert_stage_result(
            call_id=call_id,
            stage_number=payload.stage_number,
            what_happened=payload.what_happened,
            prospect_words=payload.prospect_words
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Database unavailable")


@app.post("/calls/{call_id}/close", status_code=status.HTTP_200_OK)
async def close_call(call_id: str, payload: CloseCallRequest):
    """
    Closes the call record, evaluates consistency checks, triggers
    LLM summary generation, and stores the final call record.
    """
    db = get_db()
    call = db.get_call(call_id)
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="call not found")

    stage_results = db.get_stage_results(call_id)

    # 1. Outcome consistency check
    outcome_flag = check_outcome_consistency(
        outcome=payload.outcome,
        next_step=payload.next_step,
        stage_results=stage_results
    )

    # 2. LLM Summary generation (falls back gracefully if LLM fails)
    summary, summary_source = await generate_call_summary(
        prospect=call.get("prospect", "Prospect"),
        company=call.get("company"),
        ended_stage=payload.ended_stage,
        outcome=payload.outcome,
        next_step=payload.next_step,
        stage_results=stage_results
    )

    try:
        updated_call = db.close_call(
            call_id=call_id,
            ended_stage=payload.ended_stage,
            outcome=payload.outcome,
            next_step=payload.next_step,
            summary=summary,
            outcome_flag=outcome_flag,
            summary_source=summary_source
        )
        return updated_call
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Database unavailable")


@app.get("/calls", status_code=status.HTTP_200_OK)
def list_calls():
    """Lists saved calls ordered newest first."""
    try:
        db = get_db()
        return db.list_calls()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Database unavailable")


@app.get("/calls/{call_id}", status_code=status.HTTP_200_OK)
def get_call_detail(call_id: str):
    """Returns a specific call along with its stage results."""
    db = get_db()
    call = db.get_call(call_id)
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="call not found")

    stage_results = db.get_stage_results(call_id)
    return {
        **call,
        "stage_results": stage_results
    }


@app.post("/ai/summarize-call", status_code=status.HTTP_200_OK)
async def summarize_call_route(payload: SummarizeCallRequest):
    """Direct route to generate a one-line LLM summary from call data."""
    db = get_db()
    prospect = payload.prospect or "Prospect"
    company = payload.company
    ended_stage = payload.ended_stage
    outcome = payload.outcome
    next_step = payload.next_step
    stage_results = payload.stage_results or []

    if payload.call_id:
        call = db.get_call(payload.call_id)
        if call:
            prospect = call.get("prospect", prospect)
            company = call.get("company", company)
            ended_stage = call.get("ended_stage", ended_stage)
            outcome = call.get("outcome", outcome)
            next_step = call.get("next_step", next_step)
            stage_results = db.get_stage_results(payload.call_id)

    summary, summary_source = await generate_call_summary(
        prospect=prospect,
        company=company,
        ended_stage=ended_stage,
        outcome=outcome,
        next_step=next_step,
        stage_results=stage_results
    )
    return {"summary": summary, "summary_source": summary_source}
