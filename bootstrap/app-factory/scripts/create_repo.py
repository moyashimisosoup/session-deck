#!/usr/bin/env python3
"""App Factory v0.1: validated, private-only GitHub repository creation.

Designed to run in a PRIVATE intake repository on an owner-approved Issue label.
No token is needed for dry-run or parsing. Requires Python 3.11+.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

OWNER = "moyashimisosoup"
FACTORY_REPOSITORY = f"{OWNER}/app-factory"
MARKER = "<!-- APP_FACTORY_REQUEST_V1 -->"
ISSUE_BLOCK = re.compile(
    re.escape(MARKER) + r"\s*" + ("~" * 3) + r"json\s*\n(.*?)\n" + ("~" * 3), re.DOTALL
)
REPO_NAME = re.compile(r"^[a-z][a-z0-9-]{2,48}[a-z0-9]$")
RESERVED = {"app-factory", "session-deck", "koten", "tradingsystem"}
FIELDS = {"schema_version", "repo_name", "app_name", "description", "visibility", "decision"}
BASE = "https://api.github.com"
API_VERSION = "2022-11-28"


class FactoryError(RuntimeError):
    """Safe, user-readable validation or remote API error."""


@dataclass(frozen=True)
class RequestData:
    repo_name: str
    app_name: str
    description: str


def parse_request(body: str) -> RequestData:
    if not isinstance(body, str) or len(body) > 16000:
        raise FactoryError("Issue body is missing or too large (maximum 16000 characters).")
    blocks = ISSUE_BLOCK.findall(body)
    if len(blocks) != 1:
        raise FactoryError("Exactly one APP_FACTORY_REQUEST_V1 JSON block is required.")
    try:
        data = json.loads(blocks[0])
    except ValueError as exc:
        raise FactoryError("Request JSON is invalid.") from exc
    if not isinstance(data, dict) or set(data) != FIELDS:
        raise FactoryError("Unexpected request fields; use the approved v1 schema only.")
    if type(data["schema_version"]) is not int or data["schema_version"] != 1:
        raise FactoryError("schema_version must be 1.")
    if data["visibility"] != "private" or data["decision"] != "adopted":
        raise FactoryError("Only explicitly adopted, private repositories are permitted.")
    slug = data["repo_name"]
    if not isinstance(slug, str) or not REPO_NAME.fullmatch(slug) or slug in RESERVED:
        raise FactoryError("repo_name must be a unique, lowercase ASCII kebab-case slug.")
    title, desc = data["app_name"], data["description"]
    if not isinstance(title, str) or not 1 <= len(title.strip()) <= 80:
        raise FactoryError("app_name must be 1-80 characters.")
    if not isinstance(desc, str) or not 1 <= len(desc.strip()) <= 200:
        raise FactoryError("description must be 1-200 characters.")
    if any(c in title + desc for c in ("\r", "\n", "\x00")):
        raise FactoryError("app_name and description cannot contain line breaks or NUL.")
    return RequestData(repo_name=slug, app_name=title.strip(), description=desc.strip())


def request_api(token: str, method: str, path: str, payload: dict | None = None):
    req = Request(
        BASE + path,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": API_VERSION,
            "User-Agent": "session-deck-app-factory/0.1",
        },
        data=None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8"),
    )
    if payload is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urlopen(req, timeout=20) as response:
            return response.status, json.load(response)
    except HTTPError as exc:
        if exc.code == 404 and method == "GET":
            return 404, None
        raise FactoryError(f"GitHub API rejected {method} {path}: HTTP {exc.code}.") from exc
    except (URLError, TimeoutError) as exc:
        raise FactoryError("GitHub API connection failed. Repository creation was not confirmed.") from exc


def create_repository(data: RequestData, issue_number: int, token: str) -> tuple[str, bool]:
    if type(issue_number) is not int or not 1 <= issue_number <= 10_000_000:
        raise FactoryError("A positive source Issue number is required.")
    if not token:
        raise FactoryError("APP_FACTORY_REPO_CREATOR secret is missing.")
    status, me = request_api(token, "GET", "/user")
    if status != 200 or me.get("login", "").lower() != OWNER:
        raise FactoryError("Credential identity does not match the approved repository owner.")

    existing_status, existing = request_api(token, "GET", f"/repos/{OWNER}/{quote(data.repo_name)}")
    marker_url = f"https://github.com/{FACTORY_REPOSITORY}/issues/{issue_number}"
    if existing_status == 200:
        if existing.get("private") is True and existing.get("homepage") == marker_url:
            return existing["html_url"], False
        raise FactoryError("Repository name already exists and is not owned by this request.")
    if existing_status != 404:
        raise FactoryError("Repository existence could not be determined; creation aborted.")

    payload = {
        "name": data.repo_name,
        "description": data.description,
        "private": True,
        "auto_init": True,
        "has_issues": True,
        "has_projects": False,
        "has_wiki": False,
        "homepage": marker_url,
    }
    created_status, new_repo = request_api(token, "POST", "/user/repos", payload)
    if (
        created_status != 201
        or new_repo.get("full_name", "").lower() != f"{OWNER}/{data.repo_name}"
        or new_repo.get("private") is not True
    ):
        raise FactoryError("GitHub did not confirm a private repository with the expected owner.")
    return new_repo["html_url"], True


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--issue", type=int, required=True)
    parser.add_argument("--execute", action="store_true", help="Create, if authorized. Default: dry-run.")
    args = parser.parse_args(argv)
    try:
        data = parse_request(os.environ.get("APP_FACTORY_ISSUE_BODY", ""))
        if args.issue < 1:
            raise FactoryError("Issue number must be positive.")
        if args.execute:
            repo_url, created = create_repository(
                data, args.issue, os.environ.get("APP_FACTORY_REPO_CREATOR", "")
            )
            result = {"status": "created" if created else "already-created", "repo_url": repo_url}
        else:
            result = {"status": "validated-only", "repo_name": data.repo_name, "visibility": "private"}
        print(json.dumps(result, ensure_ascii=False))
        output = os.environ.get("GITHUB_OUTPUT")
        if output and args.execute:
            with open(output, "a", encoding="utf-8") as f:
                f.write(f"repo_url={result['repo_url']}\nstatus={result['status']}\n")
        return 0
    except FactoryError as exc:
        print(f"App Factory: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
