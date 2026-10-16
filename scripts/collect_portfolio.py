#!/usr/bin/env python3
"""Collect public GitHub observations for Session Deck's public portfolio.

The Markdown ledger is authoritative. This script NEVER updates the ledger,
contacts private endpoints, reads chat transcripts, or writes to repositories.
Output is safe-for-publication metadata only (no issue/PR titles or bodies).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ALLOWED_OWNERS = frozenset(("moyashimisosoup", "yama-books"))
REPO_LINK = re.compile(r"https://github\.com/([A-Za-z0-9-]+)/([A-Za-z0-9_.-]+)")
APP_ID = re.compile(r"^\|\s*(APP-\d{3})\s*\|")
API_BASE = "https://api.github.com"
PREVIOUS_URL = (
    "https://moyashimisosoup.github.io/session-deck/"
    "data/portfolio-observations.json"
)
MAX_REPOSITORIES = 60
USER_AGENT = "session-deck-public-observer/1.1"
SHA = re.compile(r"^[a-fA-F0-9]{40}$")



class SourceError(Exception):
    """Deliberately contains only a status code, never a response body."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_ledger(markdown: str) -> list[dict]:
    in_section = False
    result = []
    ids = set()
    repos = set()
    for line in markdown.splitlines():
        if line.startswith("## A. "):
            in_section = True
            continue
        if line.startswith("## B. "):
            in_section = False
            continue
        if not in_section:
            continue
        match = APP_ID.match(line)
        if not match:
            continue
        parts = [x.strip() for x in line.split("|")[1:-1]]
        if len(parts) < 6:
            raise ValueError("Portfolio table row has too few columns")
        app_id = match.group(1)
        repo_match = REPO_LINK.search(parts[3])
        if not repo_match:
            raise ValueError("Portfolio row missing GitHub repository link: " + app_id)
        owner, repo = repo_match.groups()
        if owner not in ALLOWED_OWNERS or repo in (".", ".."):
            raise ValueError("Repository owner/path not approved: " + app_id)
        full_name = owner + "/" + repo
        if app_id in ids or full_name in repos:
            raise ValueError("Duplicate APP-ID or repository: " + app_id)
        ids.add(app_id)
        repos.add(full_name)
        result.append({"app_id": app_id, "repo": full_name})
    if not result or len(result) > MAX_REPOSITORIES:
        raise ValueError("Unexpected repository count in the ledger")
    return result


def request_json(path: str) -> object:
    if not path.startswith("/") or path.startswith("//"):
        raise ValueError("Refusing non-API path")
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": USER_AGENT,
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(API_BASE + path, headers=headers)
    try:
        with urlopen(req, timeout=20) as response:
            return json.load(response)
    except HTTPError as exc:
        raise SourceError("github_http_" + str(exc.code)) from None
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise SourceError("github_unavailable") from None


def load_review_checkpoints(path: Path, apps: list[dict]) -> dict[str, dict]:
    """Read explicit review anchors. Bootstrap does not mean human-reviewed.

    Invalid checkpoints fail the job rather than silently clearing pending work.
    New apps absent from the file are displayed as 'untracked'.
    """
    document = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(document, dict) or document.get("schema_version") != 1:
        raise ValueError("Unsupported review checkpoint schema")
    records = document.get("checkpoints")
    if not isinstance(records, list) or len(records) > MAX_REPOSITORIES:
        raise ValueError("Invalid review checkpoint list")
    allowed = {app["app_id"]: app["repo"] for app in apps}
    result = {}
    seen_repos = set()
    for entry in records:
        if not isinstance(entry, dict):
            raise ValueError("Invalid review checkpoint entry")
        app_id = entry.get("app_id")
        repo = entry.get("repo")
        sha = entry.get("anchor_sha")
        kind = entry.get("anchor_kind")
        if (
            not isinstance(app_id, str)
            or not isinstance(repo, str)
            or allowed.get(app_id) != repo
            or app_id in result
            or repo in seen_repos
            or not isinstance(sha, str)
            or not SHA.fullmatch(sha)
            or kind not in ("bootstrap", "reviewed")
        ):
            raise ValueError("Invalid or stale review checkpoint: " + str(app_id))
        if kind == "reviewed":
            if not safe_date(entry.get("reviewed_at")):
                raise ValueError("Reviewed checkpoint must have reviewed_at: " + app_id)
            if not isinstance(entry.get("evidence_url"), str) or not clean_url(entry["evidence_url"]):
                raise ValueError("Reviewed checkpoint must cite public GitHub evidence: " + app_id)
        seen_repos.add(repo)
        result[app_id] = entry
    return result


def annotate_review(record: dict, checkpoints: dict[str, dict]) -> None:
    """Add review state independent of last published observation comparison."""
    commit = record.get("commit")
    sha = commit.get("sha") if isinstance(commit, dict) else None
    if not isinstance(sha, str) or not SHA.fullmatch(sha):
        record["review_status"] = "unavailable"
        return
    checkpoint = checkpoints.get(record["app_id"])
    if not checkpoint:
        record["review_status"] = "untracked"
        return
    anchor = checkpoint["anchor_sha"]
    record["review_anchor_sha"] = anchor
    record["review_anchor_kind"] = checkpoint["anchor_kind"]
    if sha != anchor:
        record["review_status"] = "pending"
        record["review_compare_url"] = (
            "https://github.com/" + record["repo"] + "/compare/" + anchor + "..." + sha
        )
    elif checkpoint["anchor_kind"] == "reviewed":
        record["review_status"] = "reviewed"
    else:
        record["review_status"] = "baseline"


def read_previous(url: str = PREVIOUS_URL) -> dict:
    # This is a hard-coded public snapshot URL, not an arbitrary URL parameter.
    if url != PREVIOUS_URL:
        raise ValueError("Unapproved previous-snapshot URL")
    req = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(req, timeout=10) as response:
            previous = json.load(response)
        if (
            isinstance(previous, dict)
            and previous.get("schema_version") == 1
            and isinstance(previous.get("repositories"), list)
        ):
            return {
                x["repo"]: x
                for x in previous["repositories"]
                if isinstance(x, dict)
                and isinstance(x.get("repo"), str)
                and isinstance(x.get("app_id"), str)
            }
    except (HTTPError, URLError, OSError, ValueError, KeyError, TypeError):
        return {}
    return {}


def clean_url(value: object, host: str = "github.com") -> str | None:
    if not isinstance(value, str) or not value.startswith("https://" + host + "/"):
        return None
    return value


def safe_date(value: object) -> str | None:
    # Only fixed-format timestamps pass into the public artifact.
    if not isinstance(value, str):
        return None
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})", value):
        return value
    return None


def fetch_one(item: dict, previous: dict, checked_at: str) -> dict:
    repo = item["repo"]
    owner, name = repo.split("/", 1)
    path = "/repos/" + quote(owner, safe="") + "/" + quote(name, safe="")
    record = {
        "app_id": item["app_id"],
        "repo": repo,
        "fetch_status": "ok",
        "observed_at": checked_at,
        "commit": None,
        "workflow": None,
        "pull_requests": [],
        "issues": [],
        "comparison": "unavailable",
        "source": "github_rest_public",
    }
    try:
        meta = request_json(path)
        if not isinstance(meta, dict) or meta.get("private") is not False:
            record["fetch_status"] = "not_public"
            record["error_code"] = "repository_not_confirmed_public"
            return record
        branch = meta.get("default_branch")
        if not isinstance(branch, str) or not re.fullmatch(r"[A-Za-z0-9._/-]{1,150}", branch):
            raise SourceError("github_invalid_branch")
        record["default_branch"] = branch
        commits = request_json(path + "/commits?per_page=1")
        if not isinstance(commits, list):
            raise SourceError("github_invalid_commits")
        if commits:
            first = commits[0]
            sha = first.get("sha")
            if not isinstance(sha, str) or not re.fullmatch(r"[a-fA-F0-9]{40}", sha):
                raise SourceError("github_invalid_sha")
            record["commit"] = {
                "sha": sha,
                "url": clean_url(first.get("html_url")),
                "committed_at": safe_date(
                    ((first.get("commit") or {}).get("committer") or {}).get("date")
                ),
            }
    except SourceError as exc:
        record["fetch_status"] = "error"
        record["error_code"] = str(exc)
        return record

    optional_failures = []
    try:
        runs = request_json(path + "/actions/runs?per_page=1")
        if isinstance(runs, dict) and isinstance(runs.get("workflow_runs"), list):
            if runs["workflow_runs"]:
                run = runs["workflow_runs"][0]
                head = run.get("head_sha")
                valid_head = head if isinstance(head, str) and re.fullmatch(r"[a-fA-F0-9]{40}", head) else None
                record["workflow"] = {
                    "status": run.get("status") if run.get("status") in ("queued", "in_progress", "completed", "waiting", "requested", "pending") else "unknown",
                    "conclusion": run.get("conclusion") if run.get("conclusion") in ("success", "failure", "cancelled", "timed_out", "skipped", "action_required", "neutral", "startup_failure") else None,
                    "head_sha": valid_head,
                    "url": clean_url(run.get("html_url")),
                    "updated_at": safe_date(run.get("updated_at")),
                    "matches_latest_commit": bool(record["commit"] and valid_head == record["commit"]["sha"]),
                }
        else:
            optional_failures.append("workflow_unavailable")
    except SourceError:
        optional_failures.append("workflow_unavailable")
    for field, query, limit in (
        ("pull_requests", "/pulls?state=open&sort=updated&direction=desc&per_page=3", 3),
        ("issues", "/issues?state=open&sort=updated&direction=desc&per_page=10", 3),
    ):
        try:
            values = request_json(path + query)
            if not isinstance(values, list):
                raise SourceError("github_invalid_list")
            for x in values:
                if not isinstance(x, dict):
                    continue
                if field == "issues" and "pull_request" in x:
                    continue
                number = x.get("number")
                link = clean_url(x.get("html_url"))
                if isinstance(number, int) and number > 0 and link:
                    record[field].append({
                        "number": number,
                        "url": link,
                        "updated_at": safe_date(x.get("updated_at")),
                    })
                if len(record[field]) >= limit:
                    break
        except SourceError:
            optional_failures.append(field + "_unavailable")
    if optional_failures:
        record["fetch_status"] = "partial"
        record["unavailable_fields"] = optional_failures

    prior = previous.get(repo, {})
    prior_commit = (prior.get("commit") or {}).get("sha") if isinstance(prior, dict) else None
    current_commit = record["commit"]["sha"] if record["commit"] else None
    if prior_commit and current_commit:
        record["comparison"] = "changed" if prior_commit != current_commit else "unchanged"
        if prior_commit != current_commit and re.fullmatch(r"[a-fA-F0-9]{40}", prior_commit):
            record["previous_sha"] = prior_commit
    elif not prior and current_commit:
        record["comparison"] = "baseline"
    # Without a trusted prior snapshot, never claim "no change".
    return record


def collect(markdown: str, previous: dict | None = None, now: str | None = None, review_checkpoints: dict[str, dict] | None = None) -> dict:
    apps = parse_ledger(markdown)
    checked_at = now or utc_now()
    prior = previous if previous is not None else {}
    results = [None] * len(apps)
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(fetch_one, app, prior, checked_at): i for i, app in enumerate(apps)}
        for task in as_completed(futures):
            index = futures[task]
            try:
                results[index] = task.result()
            except Exception:
                app = apps[index]
                results[index] = {
                    "app_id": app["app_id"], "repo": app["repo"],
                    "source": "github_rest_public", "fetch_status": "error",
                    "error_code": "unexpected_source_error", "observed_at": checked_at,
                    "commit": None, "workflow": None, "pull_requests": [],
                    "issues": [], "comparison": "unavailable",
                }
    for record in results:
        annotate_review(record, review_checkpoints or {})
    usable = sum(x["fetch_status"] in ("ok", "partial") for x in results)
    if usable == 0:
        raise RuntimeError("All repository reads failed; keep the existing published snapshot")
    return {
        "schema_version": 1,
        "classification": "public_repository_metadata_only",
        "generated_at": checked_at,
        "repo_count": len(results),
        "usable_count": usable,
        "repositories": results,
    }


def main() -> int:
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--ledger", type=Path, default=Path("docs/APP_PORTFOLIO.md"))
    cli.add_argument("--output", type=Path, default=Path("_site/data/portfolio-observations.json"))
    cli.add_argument("--no-previous", action="store_true", help="Skip public prior snapshot (test only)")
    cli.add_argument("--checkpoints", type=Path, default=Path("docs/PORTFOLIO_REVIEW_CHECKPOINTS.json"))
    args = cli.parse_args()
    markdown = args.ledger.read_text(encoding="utf-8")
    checkpoints = load_review_checkpoints(args.checkpoints, parse_ledger(markdown))
    previous = {} if args.no_previous else read_previous()
    snapshot = collect(markdown, previous, review_checkpoints=checkpoints)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("public_repo_observations", snapshot["usable_count"], "/", snapshot["repo_count"], snapshot["generated_at"])
    print("changes", sum(x["comparison"] == "changed" for x in snapshot["repositories"]))
    print("pending_reviews", sum(x["review_status"] == "pending" for x in snapshot["repositories"]))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, RuntimeError) as error:
        print("Observer failed:", str(error), file=sys.stderr)
        sys.exit(1)
