#!/usr/bin/env python3
"""Offline validation of *private* Session Deck event records.

No API calls, network, file writes or automatic session discovery. Never put
real event records in the public Session Deck repository / GitHub Pages.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from datetime import datetime

APP = re.compile(r"^APP-\d{3}$")
WORK = re.compile(r"^APP-\d{3}-W\d{3,5}$")
EVENT_ID = re.compile(r"^[A-Za-z0-9_-]{6,80}$")
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$")
PLATFORMS = {"chatgpt", "claude_code", "codex"}
EVENT_TYPES = {"START", "MILESTONE", "CHECKPOINT", "HANDOFF", "END"}
STATUS = {"not_observed", "manually_confirmed", "instrumented"}
ALLOWED_FIELDS = {
    "schema_version", "event_id", "event_type", "app_id", "work_id", "session_id",
    "platform", "event_at", "recorded_at", "time_verification", "summary",
    "next_action", "evidence_urls", "repository", "branch", "head_sha",
    "native_id_verified", "privacy_classification"
}
URL = re.compile(r"^https://github\.com/[A-Za-z0-9-]+/[A-Za-z0-9_.-]+(?:/(?:commit|pull|issues|actions)/[A-Za-z0-9_./-]+)?$")
SHA = re.compile(r"^[0-9a-f]{40}$", re.I)


def valid_time(t: object) -> bool:
    if not isinstance(t, str) or not ISO.fullmatch(t):
        return False
    try:
        datetime.fromisoformat(t.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def validate(record: object) -> dict:
    """Fail closed. No invalid or extra fields may be published/committed."""
    if not isinstance(record, dict):
        raise ValueError("Event must be a JSON object")
    if record.keys() - ALLOWED_FIELDS:
        raise ValueError("Unexpected event fields")
    mandatory = {"schema_version", "event_id", "event_type", "app_id", "work_id",
                 "session_id", "platform", "recorded_at", "event_at",
                 "time_verification", "privacy_classification", "native_id_verified"}
    if not mandatory <= record.keys():
        raise ValueError("Missing mandatory event fields")
    if record["schema_version"] != 1 or record["privacy_classification"] != "private_session_metadata":
        raise ValueError("Unsupported/private event classification")
    if not isinstance(record["event_id"], str) or not EVENT_ID.fullmatch(record["event_id"]):
        raise ValueError("Invalid event ID")
    if record["event_type"] not in EVENT_TYPES or record["platform"] not in PLATFORMS:
        raise ValueError("Invalid type/platform")
    if not isinstance(record["app_id"], str) or not APP.fullmatch(record["app_id"]):
        raise ValueError("Invalid APP-ID")
    if not isinstance(record["work_id"], str) or not WORK.fullmatch(record["work_id"]):
        raise ValueError("Invalid Work-ID")
    if not record["work_id"].startswith(record["app_id"] + "-W"):
        raise ValueError("Work-ID must belong to APP-ID")
    if not isinstance(record["session_id"], str) or not 1 <= len(record["session_id"]) <= 128:
        raise ValueError("Invalid Session-ID")
    if not isinstance(record["native_id_verified"], bool):
        raise ValueError("native_id_verified must be explicit")
    if not valid_time(record["recorded_at"]):
        raise ValueError("Invalid saved timestamp")
    if record["time_verification"] not in STATUS:
        raise ValueError("Unknown time source")
    event_time=record["event_at"]
    if event_time is not None and not valid_time(event_time):
        raise ValueError("Invalid event time")
    if event_time is None and record["time_verification"] != "not_observed":
        raise ValueError("Cannot claim verified timing without an event timestamp")
    if event_time is not None and record["time_verification"] == "not_observed":
        raise ValueError("Unobserved event must not have a fabricated time")
    for key, max_length in (("summary",500),("next_action",300),("repository",150),("branch",120)):
        value=record.get(key)
        if value is not None and (not isinstance(value,str) or len(value)>max_length):
            raise ValueError("Invalid bounded event string: "+key)
    sha=record.get("head_sha")
    if sha is not None and (not isinstance(sha,str) or not SHA.fullmatch(sha)):
        raise ValueError("Invalid Git commit SHA")
    refs=record.get("evidence_urls",[])
    if not isinstance(refs,list) or len(refs)>12:
        raise ValueError("Evidence must be a short URL list")
    for ref in refs:
        if not isinstance(ref,str) or not URL.fullmatch(ref):
            raise ValueError("Evidence URL must be a verified GitHub reference")
    return record


def validate_events(events: object) -> list:
    if not isinstance(events,list) or len(events)>1000:
        raise ValueError("Event batch must be bounded")
    ids=set()
    for event in events:
        validate(event)
        if event["event_id"] in ids:
            raise ValueError("Duplicate event ID")
        ids.add(event["event_id"])
    return events


def main() -> int:
    cli=argparse.ArgumentParser(description="Validate private events offline, no network, no persistence")
    cli.add_argument("json_file",help="JSON array containing private metadata. DO NOT commit to public repo.")
    args=cli.parse_args()
    try:
        with open(args.json_file,encoding="utf-8") as stream:
            record=json.load(stream)
        if isinstance(record,list):validate_events(record)
        else:validate(record)
    except (OSError,ValueError,TypeError) as exc:
        print("PRIVATE_EVENT_INVALID:",type(exc).__name__,file=sys.stderr)
        return 1
    print("PRIVATE_EVENT_VALID (not saved, not synced)")
    return 0


if __name__=="__main__":
    sys.exit(main())
