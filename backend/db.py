"""
Database layer for Cold-Call Companion.
Supports Supabase PostgREST directly when configured, with seamless local SQLite fallback for dev/testing.
"""
import os
import json
import uuid
import sqlite3
import datetime
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("coldcall.db")

SQLITE_PATH = Path(__file__).parent / "local_coldcall.db"
STAGE_CONTENT_PATH = Path(__file__).resolve().parent.parent / "stage_content.json"


def get_current_iso_time() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


class LocalSQLiteDB:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS stages (
                stage_number INTEGER PRIMARY KEY CHECK (stage_number BETWEEN 1 AND 8),
                name TEXT NOT NULL,
                purpose TEXT NOT NULL,
                likely_statements TEXT NOT NULL,
                quick_outcomes TEXT NOT NULL,
                watch_out TEXT,
                next_stage_number INTEGER
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS calls (
                id TEXT PRIMARY KEY,
                prospect TEXT NOT NULL,
                company TEXT,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                current_stage INTEGER NOT NULL DEFAULT 1,
                ended_stage INTEGER,
                outcome TEXT,
                next_step TEXT,
                summary TEXT,
                summary_source TEXT,
                outcome_flag TEXT,
                created_at TEXT NOT NULL
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS stage_results (
                id TEXT PRIMARY KEY,
                call_id TEXT NOT NULL,
                stage_number INTEGER NOT NULL,
                what_happened TEXT,
                prospect_words TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE (call_id, stage_number),
                FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
            );
            """)
            conn.commit()

        # Seed stages if empty
        self._seed_stages_if_empty()

    def _seed_stages_if_empty(self):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM stages")
            if cursor.fetchone()[0] == 0 and STAGE_CONTENT_PATH.exists():
                with open(STAGE_CONTENT_PATH, "r", encoding="utf-8") as f:
                    stages_data = json.load(f)
                for s in stages_data:
                    cursor.execute("""
                    INSERT INTO stages (stage_number, name, purpose, likely_statements, quick_outcomes, watch_out, next_stage_number)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        s["stage_number"],
                        s["name"],
                        s["purpose"],
                        json.dumps(s.get("likely_statements", [])),
                        json.dumps(s.get("quick_outcomes", [])),
                        s.get("watch_out", ""),
                        s.get("next_stage_number")
                    ))
                conn.commit()

    def get_stages(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM stages ORDER BY stage_number ASC")
            rows = cursor.fetchall()
            results = []
            for r in rows:
                results.append({
                    "stage_number": r["stage_number"],
                    "name": r["name"],
                    "purpose": r["purpose"],
                    "likely_statements": json.loads(r["likely_statements"]),
                    "quick_outcomes": json.loads(r["quick_outcomes"]),
                    "watch_out": r["watch_out"],
                    "next_stage_number": r["next_stage_number"]
                })
            return results

    def create_call(self, prospect: str, company: Optional[str]) -> Dict[str, Any]:
        call_id = str(uuid.uuid4())
        now = get_current_iso_time()
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO calls (id, prospect, company, started_at, current_stage, created_at)
            VALUES (?, ?, ?, ?, 1, ?)
            """, (call_id, prospect, company, now, now))
            conn.commit()
        return self.get_call(call_id)

    def get_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM calls WHERE id = ?", (call_id,))
            row = cursor.fetchone()
            if not row:
                return None
            res = dict(row)
            if res.get("next_step"):
                try:
                    res["next_step"] = json.loads(res["next_step"])
                except Exception:
                    pass
            return res

    def list_calls(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM calls ORDER BY started_at DESC")
            rows = cursor.fetchall()
            calls = []
            for r in rows:
                item = dict(r)
                if item.get("next_step"):
                    try:
                        item["next_step"] = json.loads(item["next_step"])
                    except Exception:
                        pass
                calls.append(item)
            return calls

    def upsert_stage_result(self, call_id: str, stage_number: int, what_happened: Optional[str], prospect_words: Optional[str]) -> Dict[str, Any]:
        now = get_current_iso_time()
        result_id = str(uuid.uuid4())
        with self._get_conn() as conn:
            cursor = conn.cursor()
            # Upsert stage_result
            cursor.execute("""
            INSERT INTO stage_results (id, call_id, stage_number, what_happened, prospect_words, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(call_id, stage_number) DO UPDATE SET
                what_happened = excluded.what_happened,
                prospect_words = excluded.prospect_words,
                updated_at = excluded.updated_at
            """, (result_id, call_id, stage_number, what_happened, prospect_words, now, now))

            # Update call's current_stage if greater
            cursor.execute("""
            UPDATE calls SET current_stage = MAX(current_stage, ?) WHERE id = ?
            """, (stage_number, call_id))
            conn.commit()

            cursor.execute("SELECT * FROM stage_results WHERE call_id = ? AND stage_number = ?", (call_id, stage_number))
            row = cursor.fetchone()
            return dict(row)

    def get_stage_results(self, call_id: str) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM stage_results WHERE call_id = ? ORDER BY stage_number ASC", (call_id,))
            return [dict(r) for r in cursor.fetchall()]

    def close_call(
        self,
        call_id: str,
        ended_stage: int,
        outcome: str,
        next_step: Optional[Dict[str, Any]],
        summary: Optional[str],
        outcome_flag: Optional[str],
        summary_source: Optional[str] = "fallback"
    ) -> Optional[Dict[str, Any]]:
        now = get_current_iso_time()
        next_step_json = json.dumps(next_step) if next_step else None
        with self._get_conn() as conn:
            cursor = conn.cursor()
            # Ensure column exists if table was created earlier
            try:
                cursor.execute("ALTER TABLE calls ADD COLUMN summary_source TEXT")
            except Exception:
                pass

            cursor.execute("""
            UPDATE calls
            SET ended_at = coalesce(ended_at, ?),
                ended_stage = ?,
                outcome = ?,
                next_step = ?,
                summary = ?,
                summary_source = ?,
                outcome_flag = ?
            WHERE id = ?
            """, (now, ended_stage, outcome, next_step_json, summary, summary_source, outcome_flag, call_id))
            conn.commit()
        return self.get_call(call_id)


class SupabaseDB:
    def __init__(self, supabase_url: str, service_key: str):
        clean_url = supabase_url.strip().rstrip("/")
        if clean_url.endswith("/rest/v1"):
            clean_url = clean_url[:-len("/rest/v1")]
        self.base_url = clean_url + "/rest/v1"
        self.headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def get_stages(self) -> List[Dict[str, Any]]:
        with httpx.Client(timeout=8.0) as client:
            res = client.get(f"{self.base_url}/stages?select=*&order=stage_number.asc", headers=self.headers)
            res.raise_for_status()
            return res.json()

    def create_call(self, prospect: str, company: Optional[str]) -> Dict[str, Any]:
        payload = {
            "prospect": prospect,
            "company": company,
            "current_stage": 1
        }
        with httpx.Client(timeout=8.0) as client:
            res = client.post(f"{self.base_url}/calls", json=payload, headers=self.headers)
            res.raise_for_status()
            data = res.json()
            return data[0] if data else {}

    def get_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        with httpx.Client(timeout=8.0) as client:
            res = client.get(f"{self.base_url}/calls?id=eq.{call_id}&select=*", headers=self.headers)
            res.raise_for_status()
            data = res.json()
            return data[0] if data else None

    def list_calls(self) -> List[Dict[str, Any]]:
        with httpx.Client(timeout=8.0) as client:
            res = client.get(f"{self.base_url}/calls?select=*&order=started_at.desc", headers=self.headers)
            res.raise_for_status()
            return res.json()

    def upsert_stage_result(self, call_id: str, stage_number: int, what_happened: Optional[str], prospect_words: Optional[str]) -> Dict[str, Any]:
        now = get_current_iso_time()
        payload = {
            "call_id": call_id,
            "stage_number": stage_number,
            "what_happened": what_happened,
            "prospect_words": prospect_words,
            "updated_at": now
        }
        headers = dict(self.headers)
        headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        with httpx.Client(timeout=8.0) as client:
            res = client.post(f"{self.base_url}/stage_results?on_conflict=call_id,stage_number", json=payload, headers=headers)
            res.raise_for_status()
            saved = res.json()[0]

            # Update call's current_stage if higher
            call = self.get_call(call_id)
            if call and call.get("current_stage", 1) < stage_number:
                client.patch(f"{self.base_url}/calls?id=eq.{call_id}", json={"current_stage": stage_number}, headers=self.headers)

            return saved

    def get_stage_results(self, call_id: str) -> List[Dict[str, Any]]:
        with httpx.Client(timeout=8.0) as client:
            res = client.get(f"{self.base_url}/stage_results?call_id=eq.{call_id}&select=*&order=stage_number.asc", headers=self.headers)
            res.raise_for_status()
            return res.json()

    def close_call(
        self,
        call_id: str,
        ended_stage: int,
        outcome: str,
        next_step: Optional[Dict[str, Any]],
        summary: Optional[str],
        outcome_flag: Optional[str],
        summary_source: Optional[str] = "fallback"
    ) -> Optional[Dict[str, Any]]:
        now = get_current_iso_time()
        payload = {
            "ended_stage": ended_stage,
            "outcome": outcome,
            "next_step": next_step,
            "summary": summary,
            "summary_source": summary_source,
            "outcome_flag": outcome_flag,
            "ended_at": now
        }
        with httpx.Client(timeout=8.0) as client:
            res = client.patch(f"{self.base_url}/calls?id=eq.{call_id}", json=payload, headers=self.headers)
            if res.status_code == 400 and "summary_source" in res.text:
                payload_fallback = dict(payload)
                del payload_fallback["summary_source"]
                res = client.patch(f"{self.base_url}/calls?id=eq.{call_id}", json=payload_fallback, headers=self.headers)
            res.raise_for_status()
            data = res.json()
            return data[0] if data else None


class ResilientDB:
    """
    Transparently tries Supabase first. If Supabase is unavailable,
    misconfigured (e.g. invalid key), or returns an error, it logs the exact
    issue and immediately falls back to LocalSQLiteDB so the user's call session
    is never interrupted with a 502 error.
    """
    def __init__(self, supabase: SupabaseDB, local: LocalSQLiteDB):
        self.supabase = supabase
        self.local = local

    def get_stages(self) -> List[Dict[str, Any]]:
        try:
            return self.supabase.get_stages()
        except Exception as exc:
            logger.error(f"Supabase get_stages failed: {exc}. Using SQLite fallback.")
            return self.local.get_stages()

    def create_call(self, prospect: str, company: Optional[str]) -> Dict[str, Any]:
        try:
            return self.supabase.create_call(prospect, company)
        except Exception as exc:
            logger.error(f"Supabase create_call failed: {exc}. Using SQLite fallback.")
            return self.local.create_call(prospect, company)

    def get_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        try:
            res = self.supabase.get_call(call_id)
            if res:
                return res
        except Exception as exc:
            logger.error(f"Supabase get_call failed: {exc}. Using SQLite fallback.")
        return self.local.get_call(call_id)

    def list_calls(self) -> List[Dict[str, Any]]:
        try:
            return self.supabase.list_calls()
        except Exception as exc:
            logger.error(f"Supabase list_calls failed: {exc}. Using SQLite fallback.")
            return self.local.list_calls()

    def upsert_stage_result(self, call_id: str, stage_number: int, what_happened: Optional[str], prospect_words: Optional[str]) -> Dict[str, Any]:
        try:
            return self.supabase.upsert_stage_result(call_id, stage_number, what_happened, prospect_words)
        except Exception as exc:
            logger.error(f"Supabase upsert_stage_result failed: {exc}. Using SQLite fallback.")
            return self.local.upsert_stage_result(call_id, stage_number, what_happened, prospect_words)

    def get_stage_results(self, call_id: str) -> List[Dict[str, Any]]:
        try:
            return self.supabase.get_stage_results(call_id)
        except Exception as exc:
            logger.error(f"Supabase get_stage_results failed: {exc}. Using SQLite fallback.")
            return self.local.get_stage_results(call_id)

    def close_call(
        self,
        call_id: str,
        ended_stage: int,
        outcome: str,
        next_step: Optional[Dict[str, Any]],
        summary: Optional[str],
        outcome_flag: Optional[str],
        summary_source: Optional[str] = "fallback"
    ) -> Optional[Dict[str, Any]]:
        try:
            return self.supabase.close_call(call_id, ended_stage, outcome, next_step, summary, outcome_flag, summary_source)
        except Exception as exc:
            logger.error(f"Supabase close_call failed: {exc}. Using SQLite fallback.")
            return self.local.close_call(call_id, ended_stage, outcome, next_step, summary, outcome_flag, summary_source)


# Singleton instance selector
_db_instance = None

def get_db():
    global _db_instance
    if _db_instance is None:
        supabase_url = os.getenv("SUPABASE_URL", "").strip()
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        local_db = LocalSQLiteDB(SQLITE_PATH)
        if supabase_url and service_key and not supabase_url.startswith("https://your-project"):
            supabase_db = SupabaseDB(supabase_url, service_key)
            _db_instance = ResilientDB(supabase_db, local_db)
        else:
            _db_instance = local_db
    return _db_instance

