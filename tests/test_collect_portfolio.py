"""Public portfolio observer: parser, privacy and regression tests (offline)."""
import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("collector", ROOT / "scripts" / "collect_portfolio.py")
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)
SHA_1 = "a" * 40
SHA_2 = "b" * 40
DATE = "2026-10-17T01:00:00Z"
LEDGER = """## A. リポジトリ確認済みのアプリ
| ID | アプリ | 段階 | 正本 | 確認済み | 次 |
| --- | --- | --- | --- | --- | --- |
| APP-001 | **Example** | 試作／検証待ち | [repo](https://github.com/moyashimisosoup/session-deck) | テスト | 次 |
## B. 会話で扱った構想
| APP-002 | **Chat-only** | 構想／未確認 | Repo未確認 | 次 |
"""


def mock_api(path):
    if path == "/repos/moyashimisosoup/session-deck":
        return {"private": False, "default_branch": "main"}
    if "/commits?" in path:
        return [{"sha": SHA_2, "html_url": "https://github.com/moyashimisosoup/session-deck/commit/" + SHA_2,
                 "commit": {"committer": {"date": DATE}}}]
    if "/actions/runs?" in path:
        return {"workflow_runs": [{"status": "completed", "conclusion": "success",
                                  "head_sha": SHA_1, "html_url": "https://github.com/moyashimisosoup/session-deck/actions/runs/42",
                                  "updated_at": DATE}]}
    if "/pulls?" in path:
        return [{"number": 3, "html_url": "https://github.com/moyashimisosoup/session-deck/pull/3",
                 "updated_at": DATE, "title": "privateish title never publish"}]
    if "/issues?" in path:
        return [{"number": 2, "html_url": "https://github.com/moyashimisosoup/session-deck/issues/2", "updated_at": DATE,
                 "title": "secret-looking content"},
                {"number": 4, "pull_request": {"url": "private"}, "html_url": "https://github.com/moyashimisosoup/session-deck/issues/4"}]
    raise ValueError("unexpected API call " + path)


class CollectorTests(unittest.TestCase):
    def test_current_ledger_has_registered_repo_rows(self):
        markdown = (ROOT / "docs" / "APP_PORTFOLIO.md").read_text(encoding="utf-8")
        apps = collector.parse_ledger(markdown)
        self.assertGreaterEqual(len(apps), 14)
        self.assertIn("APP-022", [x["app_id"] for x in apps])
        self.assertEqual("APP-001", apps[0]["app_id"])
        self.assertNotIn("APP-014", [x["app_id"] for x in apps])

    def test_parse_only_repo_section(self):
        apps = collector.parse_ledger(LEDGER)
        self.assertEqual([{"app_id": "APP-001", "repo": "moyashimisosoup/session-deck"}], apps)

    def test_unapproved_owner_fails_closed(self):
        self.assertRaises(ValueError, collector.parse_ledger,
                          LEDGER.replace("moyashimisosoup", "some-other-owner"))

    def test_duplicate_ids_rejected(self):
        extra = "| APP-001 | Other | 試作 | [repo](https://github.com/yama-books/koten) | ok | 次 |"
        self.assertRaises(ValueError, collector.parse_ledger,
                          LEDGER.replace("## B.", extra + "\n## B."))

    @patch.object(collector, "request_json", side_effect=mock_api)
    def test_public_metadata_and_ci_sha_accuracy(self, _):
        item = collector.parse_ledger(LEDGER)[0]
        old = {"moyashimisosoup/session-deck": {"commit": {"sha": SHA_1}}}
        result = collector.fetch_one(item, old, DATE)
        self.assertEqual("changed", result["comparison"])
        self.assertEqual(SHA_1, result["previous_sha"])
        self.assertFalse(result["workflow"]["matches_latest_commit"])
        self.assertEqual(1, len(result["issues"]))
        self.assertNotIn("title", result["issues"][0])
        self.assertNotIn("privateish title", str(result))
        self.assertNotIn("secret-looking content", str(result))
        self.assertEqual("ok", result["fetch_status"])

    @patch.object(collector, "request_json", side_effect=mock_api)
    def test_first_read_not_called_an_update(self, _):
        result = collector.fetch_one(collector.parse_ledger(LEDGER)[0], {}, DATE)
        self.assertEqual("baseline", result["comparison"])

    @patch.object(collector, "request_json", return_value={"private": True, "default_branch": "main"})
    def test_private_repo_is_rejected(self, request):
        result = collector.fetch_one(collector.parse_ledger(LEDGER)[0], {}, DATE)
        self.assertEqual("not_public", result["fetch_status"])
        self.assertIsNone(result["commit"])
        self.assertEqual(1, request.call_count)

    @patch.object(collector, "request_json", side_effect=collector.SourceError("github_http_403"))
    def test_error_does_not_mean_no_change(self, _):
        result = collector.fetch_one(collector.parse_ledger(LEDGER)[0], {}, DATE)
        self.assertEqual("error", result["fetch_status"])
        self.assertEqual("unavailable", result["comparison"])

    @patch.object(collector, "request_json", side_effect=mock_api)
    def test_collection_schema(self, _):
        r = collector.collect(LEDGER, {}, DATE)
        self.assertEqual(1, r["schema_version"])
        self.assertEqual("public_repository_metadata_only", r["classification"])
        self.assertEqual(1, r["usable_count"])
        self.assertEqual(1, len(r["repositories"]))

    def test_review_baseline_does_not_claim_review(self):
        record = {"app_id": "APP-001", "repo": "moyashimisosoup/session-deck", "commit": {"sha": SHA_1}}
        checkpoints = {"APP-001": {"repo": "moyashimisosoup/session-deck", "anchor_sha": SHA_1, "anchor_kind": "bootstrap"}}
        collector.annotate_review(record, checkpoints)
        self.assertEqual("baseline", record["review_status"])

    @patch.object(collector, "request_json", side_effect=mock_api)
    def test_pending_stays_pending_across_multiple_observations(self, _):
        checkpoints = {"APP-001": {"repo": "moyashimisosoup/session-deck", "anchor_sha": SHA_1, "anchor_kind": "bootstrap"}}
        for _ in range(3):
            result = collector.fetch_one(collector.parse_ledger(LEDGER)[0], {"moyashimisosoup/session-deck": {"commit": {"sha": SHA_2}}}, DATE)
            collector.annotate_review(result, checkpoints)
            self.assertEqual("unchanged", result["comparison"])
            self.assertEqual("pending", result["review_status"])
            self.assertIn(SHA_1 + "..." + SHA_2, result["review_compare_url"])

    def test_explicit_review_clears_pending(self):
        record = {"app_id": "APP-001", "repo": "moyashimisosoup/session-deck", "commit": {"sha": SHA_2}}
        collector.annotate_review(record, {"APP-001": {"repo": record["repo"], "anchor_sha": SHA_2, "anchor_kind": "reviewed"}})
        self.assertEqual("reviewed", record["review_status"])

    def test_unknown_app_is_not_auto_reviewed(self):
        record = {"app_id": "APP-001", "repo": "moyashimisosoup/session-deck", "commit": {"sha": SHA_2}}
        collector.annotate_review(record, {})
        self.assertEqual("untracked", record["review_status"])

    def test_source_failure_does_not_clear_review(self):
        record = {"app_id": "APP-001", "repo": "moyashimisosoup/session-deck", "commit": None}
        collector.annotate_review(record, {"APP-001": {"anchor_sha": SHA_1, "anchor_kind": "bootstrap"}})
        self.assertEqual("unavailable", record["review_status"])

    def test_review_checkpoint_validates_ledger_identity_and_evidence(self):
        import json
        from tempfile import TemporaryDirectory
        doc = {"schema_version": 1, "checkpoints": [
            {"app_id": "APP-001", "repo": "moyashimisosoup/session-deck", "anchor_sha": SHA_1, "anchor_kind": "bootstrap"}
        ]}
        with TemporaryDirectory() as directory:
            file = Path(directory) / "checkpoints.json"
            file.write_text(json.dumps(doc), encoding="utf-8")
            parsed = collector.load_review_checkpoints(file, collector.parse_ledger(LEDGER))
            self.assertEqual(SHA_1, parsed["APP-001"]["anchor_sha"])
            doc["checkpoints"][0]["repo"] = "moyashimisosoup/another"
            file.write_text(json.dumps(doc), encoding="utf-8")
            self.assertRaises(ValueError, collector.load_review_checkpoints, file, collector.parse_ledger(LEDGER))
            doc["checkpoints"][0]["repo"] = "moyashimisosoup/session-deck"
            doc["checkpoints"][0]["anchor_kind"] = "reviewed"
            file.write_text(json.dumps(doc), encoding="utf-8")
            self.assertRaises(ValueError, collector.load_review_checkpoints, file, collector.parse_ledger(LEDGER))
            doc["checkpoints"][0]["reviewed_at"] = DATE
            doc["checkpoints"][0]["evidence_url"] = "https://github.com/moyashimisosoup/session-deck/commit/" + SHA_1
            file.write_text(json.dumps(doc), encoding="utf-8")
            self.assertEqual("reviewed", collector.load_review_checkpoints(file, collector.parse_ledger(LEDGER))["APP-001"]["anchor_kind"])

    def test_full_checkpoint_manifest_aligns_to_all_registered_apps(self):
        apps = collector.parse_ledger((ROOT / "docs" / "APP_PORTFOLIO.md").read_text(encoding="utf-8"))
        checkpoints = collector.load_review_checkpoints(ROOT / "docs" / "PORTFOLIO_REVIEW_CHECKPOINTS.json", apps)
        self.assertEqual(len(apps), len(checkpoints))
        self.assertEqual(set(app["app_id"] for app in apps), set(checkpoints))


if __name__ == "__main__":
    unittest.main()
