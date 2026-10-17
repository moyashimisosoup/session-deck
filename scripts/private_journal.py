#!/usr/bin/env python3
"""Private Session Deck event journal: deterministic parsing, replay and append plans.

This library is OFFLINE and has no OAuth, GitHub, Docs or network calls.
An authenticated operator reads the owner-only Google Doc, uses an expected
revision for the write, then reads the Doc back before reporting success.

DO NOT publish event lines, document IDs, real session IDs, or snapshots to
the public repository or GitHub Pages.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from validate_private_event import validate, validate_events

EVENT_PREFIX = "SD_EVENT_V1 "
MAX_EVENT_LINES = 1000
MAX_DOCUMENT_CHARS = 500_000


@dataclass(frozen=True)
class AppendPlan:
    action: str  # append or already_present
    event_id: str
    expected_revision: str
    text: str  # Only for authenticated append, never public UI


def canonical_event(record: dict) -> str:
    validated = validate(record)
    return json.dumps(validated, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def parse_doc_paragraphs(paragraphs: list[dict]) -> list[dict]:
    """Ignore non-event prose and historical PROBE. Reject malformed prefixed data."""
    if not isinstance(paragraphs, list):
        raise ValueError("A Google Doc paragraph list is required")
    lines: list[str] = []
    total_chars = 0
    for paragraph in paragraphs:
        if not isinstance(paragraph, dict) or not isinstance(paragraph.get("text"), str):
            raise ValueError("Malformed document paragraph")
        text = paragraph["text"]
        total_chars += len(text)
        if total_chars > MAX_DOCUMENT_CHARS:
            raise ValueError("Private journal exceeds safe PoC bounds")
        for line in text.splitlines():
            if line.startswith(EVENT_PREFIX):
                lines.append(line[len(EVENT_PREFIX):])
    if len(lines) > MAX_EVENT_LINES:
        raise ValueError("Private journal exceeds safe event bounds")
    events = []
    for payload in lines:
        try:
            entry = json.loads(payload)
        except (ValueError, TypeError):
            raise ValueError("Malformed private journal event payload") from None
        validate(entry)
        events.append(entry)
    validate_events(events)
    return events


def prepare_append(paragraphs: list[dict], revision: str, new_event: dict) -> AppendPlan:
    """Idempotency + optimistic revision check. Caller must use requiredRevisionId."""
    if not isinstance(revision, str) or not revision.strip():
        raise ValueError("Source document revision is required")
    payload = canonical_event(new_event)
    prior = parse_doc_paragraphs(paragraphs)
    for event in prior:
        if event["event_id"] == new_event["event_id"]:
            if canonical_event(event) != payload:
                raise ValueError("Event ID collision with different content")
            return AppendPlan("already_present",new_event["event_id"],revision,"")
    if len(prior) >= MAX_EVENT_LINES:
        raise ValueError("Journal capacity reached: migrate to a private database")
    if len(EVENT_PREFIX) + len(payload) > 6000:
        raise ValueError("Event line too large")
    return AppendPlan("append", new_event["event_id"], revision, EVENT_PREFIX + payload + "\n")


def verify_saved(paragraphs: list[dict], record: dict) -> bool:
    """Call only after Drive readback. Never infer saved from update response alone."""
    expected = canonical_event(record)
    events = parse_doc_paragraphs(paragraphs)
    return sum(canonical_event(e) == expected for e in events if e["event_id"]==record["event_id"]) == 1


def _when(value: str | None) -> str | None:
    if value is None: return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).isoformat()


def summarize_work(events: list[dict]) -> list[dict]:
    """Read-only handoff projection. A Git commit is never called session activity.

    The insertion order is the append sequence, not a guessed event timestamp.
    Session/work status reflects LAST RECORDED EVENT, not true active processes.
    """
    validate_events(events)
    per_work: dict[str, dict] = {}
    for event in events:
        key = event["work_id"]
        state = per_work.setdefault(key, {
            "app_id": event["app_id"], "work_id": key,
            "sessions": {}, "last_recorded_at": None, "last_event_type": None,
            "summary": None, "next_action": None, "evidence_urls": [],
            "repository": None, "branch": None, "head_sha": None,
            "has_verified_event_time": False,
        })
        if state["app_id"] != event["app_id"]:
            raise ValueError("Work ID reused across apps")
        sid = event["session_id"]
        session = state["sessions"].setdefault(sid, {
            "session_id": sid, "platform": event["platform"],
            "started_at": None, "ended_at": None, "last_recorded_at": None,
            "last_event_type": None, "time_verified": False,
        })
        if session["platform"] != event["platform"]:
            raise ValueError("A session_id was reused by a different platform")
        typ=event["event_type"]
        timestamp=event["event_at"]
        if typ == "START" and session["started_at"] is None and timestamp:
            session["started_at"] = _when(timestamp)
        if typ == "END" and timestamp:
            session["ended_at"] = _when(timestamp)
        # No inferred start from CHECKPOINT and no inferred END from silence.
        session["last_event_type"] = typ
        session["last_recorded_at"] = _when(event["recorded_at"])
        if timestamp:
            session["time_verified"] = True
        state["last_event_type"] = typ
        state["last_recorded_at"] = _when(event["recorded_at"])
        state["has_verified_event_time"] = bool(timestamp)
        # Missing optional text must never erase previously verified data.
        for field in ("summary","next_action","repository","branch","head_sha"):
            if field in event and event[field] is not None:
                state[field] = event[field]
        if "evidence_urls" in event:
            state["evidence_urls"] = list(event["evidence_urls"])
    result=[]
    for state in per_work.values():
        last=state["last_event_type"]
        state["recorded_state"] = (
            "closed_recorded" if last == "END" else
            "handoff_recorded" if last == "HANDOFF" else
            "checkpoint_recorded" if last == "CHECKPOINT" else
            "milestone_recorded" if last == "MILESTONE" else
            "start_recorded"
        )
        state["sessions"] = sorted(state["sessions"].values(), key=lambda x:x["session_id"])
        state["session_count"] = len(state["sessions"])
        # Never label in progress from silence or only a START event.
        result.append(state)
    return sorted(result,key=lambda x:(x["app_id"],x["work_id"]))


def preview_from_doc(paragraphs: list[dict]) -> list[dict]:
    return summarize_work(parse_doc_paragraphs(paragraphs))
