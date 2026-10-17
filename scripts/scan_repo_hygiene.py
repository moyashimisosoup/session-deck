#!/usr/bin/env python3
"""Public-only repository hygiene scan. Evidence-based suggestions, NEVER archive/delete.

WARNING: GitHub's authorized /users/{owner}/repos may return private repos. All
private metadata is discarded *before* making any public artifact or log.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from collect_portfolio import ALLOWED_OWNERS, parse_ledger, request_json, utc_now, SourceError

OWNERS = ("moyashimisosoup", "yama-books")
SAFE_NAME = re.compile(r"^[a-zA-Z0-9_.-]{1,100}$")
SAFE_TS = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
MAX_PAGES_PER_OWNER = 3
PER_PAGE = 100
MAX_PUBLIC_REPOS = 300
DECISION_VALUES = frozenset(("review_required", "canonical", "intentional_parallel", "maintenance", "out_of_scope"))


def valid_utc(value: str) -> datetime | None:
    if not isinstance(value, str) or not SAFE_TS.fullmatch(value):
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt if dt.tzinfo is not None else None
    except ValueError:
        return None


def public_repos_from_pages(owner: str, pages: list[list]) -> list[dict]:
    """Strip all provider fields not in the explicitly approved public schema."""
    if owner not in ALLOWED_OWNERS:
        raise ValueError("Unknown repository owner")
    results = {}
    for page in pages:
        if not isinstance(page, list):
            raise ValueError("GitHub repository listing was not an array")
        for item in page:
            if not isinstance(item, dict) or item.get("private") is not False:
                continue
            if item.get("visibility") not in (None, "public"):
                continue
            if (item.get("owner") or {}).get("login") != owner:
                continue
            name = item.get("name")
            if not isinstance(name, str) or not SAFE_NAME.fullmatch(name) or name in (".", ".."):
                continue
            full_name = owner + "/" + name
            if item.get("full_name") != full_name:
                continue
            url = item.get("html_url")
            if url != "https://github.com/" + full_name:
                continue
            results[full_name] = {
                "repo": full_name, "url": url,
                "archived": item.get("archived") is True,
                "fork": item.get("fork") is True,
                "pushed_at": item.get("pushed_at") if valid_utc(item.get("pushed_at")) else None,
                "size_kb": item.get("size") if isinstance(item.get("size"), int) and 0 <= item["size"] <= 2_000_000 else None,
            }
    return list(results.values())


def fetch_public_repositories(owner: str) -> list[dict]:
    pages = []
    for page in range(1, MAX_PAGES_PER_OWNER + 1):
        url = f"/users/{owner}/repos?type=owner&per_page={PER_PAGE}&page={page}"
        response = request_json(url)
        if not isinstance(response, list):
            raise SourceError("github_invalid_public_repo_listing")
        pages.append(response)
        if len(response) < PER_PAGE:
            break
    else:
        # Do not publish an incomplete inventory as comprehensive.
        raise SourceError("github_repo_pagination_limit")
    return public_repos_from_pages(owner, pages)


def validate_decisions(document: dict, known_repos: set[str]) -> dict[str, dict]:
    """Only whitelisted public names, safe labels and documented review evidence."""
    if not isinstance(document, dict) or document.get("schema_version") != 1:
        raise ValueError("Invalid repository decision schema")
    entries = document.get("decisions")
    if not isinstance(entries, list) or len(entries) > MAX_PUBLIC_REPOS:
        raise ValueError("Invalid decision list")
    indexed = {}
    for value in entries:
        if not isinstance(value, dict):
            raise ValueError("Malformed decision")
        repo = value.get("repo")
        status = value.get("status")
        if not isinstance(repo, str) or repo not in known_repos or repo in indexed or status not in DECISION_VALUES:
            raise ValueError("Decision uses unknown/duplicate/non-public repository")
        if status != "review_required":
            reviewed = valid_utc(value.get("reviewed_at"))
            evidence = value.get("evidence_url")
            if reviewed is None or not isinstance(evidence, str):
                raise ValueError("Confirmed decisions require date and evidence")
            if not (
                evidence.startswith("https://github.com/" + repo + "/")
                or evidence == "https://github.com/" + repo
            ):
                raise ValueError("Decision evidence URL must belong to the public repository")
        indexed[repo] = {
            "status": status,
            "reviewed_at": value.get("reviewed_at") if status != "review_required" else None,
        }
    return indexed


def build_snapshot(public_by_owner: dict[str, list[dict]], ledger: str, decisions: dict | None = None, now: str | None = None) -> dict:
    now_date = valid_utc(now or utc_now())
    if not now_date:
        raise ValueError("Invalid scan time")
    tracked = {x["repo"]: x["app_id"] for x in parse_ledger(ledger)}
    repos = []
    for owner in OWNERS:
        if owner not in public_by_owner:
            raise ValueError("Missing owner listing")
        repos.extend(public_by_owner[owner])
    if not repos or len(repos) > MAX_PUBLIC_REPOS or len({r["repo"] for r in repos}) != len(repos):
        raise ValueError("Incomplete/duplicated public inventory")
    known = {x["repo"] for x in repos}
    resolution = validate_decisions(decisions or {"schema_version": 1, "decisions": []}, known)
    name_counts = Counter(x["repo"].split("/", 1)[1].casefold() for x in repos)
    result = []
    for repo in sorted(repos, key=lambda x: x["repo"]):
        name = repo["repo"].split("/", 1)[1]
        flags = []
        if name_counts[name.casefold()] > 1:
            flags.append("same_name")
        if repo["repo"] not in tracked:
            flags.append("not_in_app_ledger")
        if repo["size_kb"] == 0:
            flags.append("minimal_content")
        pushed_date = valid_utc(repo["pushed_at"]) if repo["pushed_at"] else None
        age = max(0, (now_date.date() - pushed_date.date()).days) if pushed_date else None
        if age is None:
            flags.append("push_time_unknown")
        elif age >= 90:
            flags.append("push_90d_plus")
        elif age >= 60:
            flags.append("push_60d_plus")
        elif age >= 30:
            flags.append("push_30d_plus")
        if repo["archived"]:
            flags.append("archived")
        decision = resolution.get(repo["repo"], {"status": "review_required", "reviewed_at": None})
        result.append({
            "repo": repo["repo"], "url": repo["url"],
            "app_id": tracked.get(repo["repo"]),
            "pushed_at": repo["pushed_at"],
            "days_since_push": age,
            "size_kb": repo["size_kb"],
            "archived": repo["archived"],
            "flags": flags,
            "review_status": decision["status"],
            "reviewed_at": decision.get("reviewed_at"),
            "source": "github_public_repo_listing",
        })
    flagged = sum(bool(x["flags"]) and x["review_status"] == "review_required" for x in result)
    return {
        "schema_version": 1,
        "classification": "public_repository_metadata_only",
        "generated_at": now_date.isoformat(timespec="seconds").replace("+00:00", "Z"),
        "total_public_repositories": len(result),
        "flagged_for_review": flagged,
        "repositories": result,
        "warning": "Flags are evidence for manual review, not archive/delete instructions. Commit/push time is not session activity.",
    }


def main() -> int:
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--ledger", type=Path, default=Path("docs/APP_PORTFOLIO.md"))
    cli.add_argument("--decisions", type=Path, default=Path("docs/REPO_HYGIENE_DECISIONS.json"))
    cli.add_argument("--output", type=Path, default=Path("_site/data/repo-hygiene.json"))
    args = cli.parse_args()
    scans = {owner: fetch_public_repositories(owner) for owner in OWNERS}
    decisions = json.loads(args.decisions.read_text(encoding="utf-8"))
    snapshot = build_snapshot(scans, args.ledger.read_text(encoding="utf-8"), decisions)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("public_repository_hygiene", snapshot["total_public_repositories"], "flagged", snapshot["flagged_for_review"])
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, RuntimeError, SourceError) as exc:
        # Do not leak API raw payloads or potentially private metadata into logs.
        print("Public hygiene scan failed:", type(exc).__name__, file=sys.stderr)
        sys.exit(1)
