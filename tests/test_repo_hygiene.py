"""Offline safety and correctness tests for public repository hygiene scans."""
import importlib.util
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import scan_repo_hygiene as scan

LEDGER = (ROOT / "docs" / "APP_PORTFOLIO.md").read_text(encoding="utf-8")
DECISIONS_PATH = ROOT / "docs" / "REPO_HYGIENE_DECISIONS.json"
NOW = "2026-10-17T01:00:00Z"


def repo(owner, name, pushed_at="2026-08-01T00:00:00Z", size=20, private=False):
    return {
        "name": name, "full_name": owner + "/" + name,
        "owner": {"login": owner},
        "private": private, "visibility": "private" if private else "public",
        "size": size, "fork": False, "archived": False,
        "html_url": "https://github.com/" + owner + "/" + name,
        "pushed_at": pushed_at,
        # This field must NEVER reach a public artifact:
        "private_notes": "PASSWORD_THIS_MUST_NOT_LEAK"
    }


class HygieneTests(unittest.TestCase):
    def test_private_repo_never_leaks_into_public_results(self):
        mixed = [repo("moyashimisosoup", "word"), repo("moyashimisosoup", "secret-project", private=True)]
        public = scan.public_repos_from_pages("moyashimisosoup", [mixed])
        self.assertEqual(1, len(public))
        content = json.dumps(public)
        self.assertNotIn("secret-project", content)
        self.assertNotIn("PASSWORD_", content)
        self.assertEqual(
            set(public[0]),
            {"repo", "url", "archived", "fork", "pushed_at", "size_kb"}
        )

    def test_invalid_owner_and_forged_repo_rejected(self):
        self.assertRaises(ValueError, scan.public_repos_from_pages, "foreign-owner", [[]])
        forged = repo("moyashimisosoup", "word")
        forged["html_url"] = "https://attacker.example/word"
        self.assertEqual([], scan.public_repos_from_pages("moyashimisosoup", [[forged]]))

    @patch.object(scan, "request_json")
    def test_finite_pagination(self, req):
        req.return_value = [repo("moyashimisosoup", "word")]
        self.assertEqual(1, len(scan.fetch_public_repositories("moyashimisosoup")))
        self.assertEqual(1, req.call_count)
        self.assertTrue(req.call_args[0][0].startswith("/users/moyashimisosoup/repos?"))

    def test_duplicate_and_unregistered_detection(self):
        by_owner = {
            "moyashimisosoup": scan.public_repos_from_pages("moyashimisosoup", [[
                repo("moyashimisosoup", "soba-price", size=0),
                repo("moyashimisosoup", "word", pushed_at="2026-06-01T00:00:00Z")
            ]]),
            "yama-books": scan.public_repos_from_pages("yama-books", [[
                repo("yama-books", "soba-price", pushed_at="2026-10-16T00:00:00Z")
            ]])
        }
        snapshot = scan.build_snapshot(by_owner, LEDGER, json.loads(DECISIONS_PATH.read_text()), NOW)
        d = {x["repo"]: x for x in snapshot["repositories"]}
        self.assertEqual(3, snapshot["total_public_repositories"])
        self.assertIn("same_name", d["moyashimisosoup/soba-price"]["flags"])
        self.assertIn("same_name", d["yama-books/soba-price"]["flags"])
        self.assertIn("not_in_app_ledger", d["moyashimisosoup/soba-price"]["flags"])
        self.assertIn("minimal_content", d["moyashimisosoup/soba-price"]["flags"])
        self.assertIn("push_90d_plus", d["moyashimisosoup/word"]["flags"])
        self.assertNotIn("push_30d_plus", d["yama-books/soba-price"]["flags"])
        self.assertEqual("review_required", d["moyashimisosoup/soba-price"]["review_status"])

    def test_review_decisions_need_grounded_public_evidence(self):
        known = {"yama-books/soba-price"}
        invalid = {"schema_version": 1, "decisions": [{"repo": "yama-books/soba-price", "status": "canonical"}]}
        self.assertRaises(ValueError, scan.validate_decisions, invalid, known)
        invalid["decisions"][0].update({"reviewed_at": NOW, "evidence_url": "https://example.com/whatever"})
        self.assertRaises(ValueError, scan.validate_decisions, invalid, known)
        invalid["decisions"][0]["evidence_url"] = "https://github.com/yama-books/soba-price"
        result = scan.validate_decisions(invalid, known)
        self.assertEqual("canonical", result["yama-books/soba-price"]["status"])

    def test_nonpublic_decision_is_not_accepted(self):
        bad = {"schema_version":1, "decisions":[{"repo":"moyashimisosoup/private-name","status":"review_required"}]}
        self.assertRaises(ValueError, scan.validate_decisions, bad, set())

    def test_missing_owner_refuses_incomplete_snapshot(self):
        self.assertRaises(ValueError, scan.build_snapshot, {"moyashimisosoup":[]}, LEDGER, {}, NOW)

    def test_no_auto_archive(self):
        by_owner = {
            "moyashimisosoup":scan.public_repos_from_pages("moyashimisosoup", [[repo("moyashimisosoup", "word")]]),
            "yama-books":[],
        }
        snapshot=scan.build_snapshot(by_owner, LEDGER, now=NOW)
        self.assertFalse(snapshot["repositories"][0]["archived"])
        self.assertIn("manual review",snapshot["warning"])
        self.assertNotIn("archive_action",json.dumps(snapshot))

    def test_current_decisions_are_schema_valid(self):
        doc = json.loads(DECISIONS_PATH.read_text(encoding="utf-8"))
        self.assertEqual(1, doc["schema_version"])
        self.assertIsInstance(doc["decisions"], list)


if __name__ == "__main__":
    unittest.main()
