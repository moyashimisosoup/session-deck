"""Offline tests: no real GitHub credentials or repositories are used."""
import json
import unittest
from unittest.mock import patch

import create_repo as app


def body(**overrides):
    data = {
        "schema_version": 1,
        "repo_name": "sample-learning-tool",
        "app_name": "学習アプリ",
        "description": "学習教材を作る小さなWebアプリ",
        "visibility": "private",
        "decision": "adopted",
    }
    data.update(overrides)
    return app.MARKER + "\n~~~json\n" + json.dumps(data, ensure_ascii=False) + "\n~~~"


class ParseTests(unittest.TestCase):
    def test_valid_private_adoption(self):
        v = app.parse_request(body())
        self.assertEqual(v.repo_name, "sample-learning-tool")

    def test_reject_public(self):
        with self.assertRaises(app.FactoryError):
            app.parse_request(body(visibility="public"))

    def test_reject_unadopted(self):
        with self.assertRaises(app.FactoryError):
            app.parse_request(body(decision="idea"))

    def test_reject_unknown_fields(self):
        with self.assertRaises(app.FactoryError):
            app.parse_request(body(secret="NEVER INCLUDE ME"))

    def test_reject_reserved_and_unsafe_slugs(self):
        for slug in ["app-factory", "session-deck", "UPPER", "../bad", "aa", "-bad", "bad-", "bad name"]:
            with self.subTest(slug=slug), self.assertRaises(app.FactoryError):
                app.parse_request(body(repo_name=slug))

    def test_reject_multiple_request_blocks(self):
        with self.assertRaises(app.FactoryError):
            app.parse_request(body() + body(repo_name="another-app"))

    def test_reject_control_chars(self):
        with self.assertRaises(app.FactoryError):
            app.parse_request(body(description="one\nanother"))

    def test_reject_invalid_json(self):
        with self.assertRaises(app.FactoryError):
            app.parse_request(app.MARKER + "\n~~~json\n{missing}\n~~~")

    def test_reject_trailing_secret_not_in_block(self):
        # Other issue prose is ignored; never printed by the worker.
        parsed = app.parse_request("some notes\n" + body() + "\nsecret prose")
        self.assertEqual(parsed.repo_name, "sample-learning-tool")


class GitHubCalls(unittest.TestCase):
    def setUp(self):
        self.payload = app.parse_request(body())
        self.issue = 42

    @patch.object(app, "request_api")
    def test_create_private_with_idempotency_marker(self, req):
        req.side_effect = [
            (200, {"login": "moyashimisosoup"}),
            (404, None),
            (201, {"full_name": "moyashimisosoup/sample-learning-tool",
                   "private": True, "html_url": "https://github.com/moyashimisosoup/sample-learning-tool"}),
        ]
        url, created = app.create_repository(self.payload, self.issue, "dummy-not-real")
        self.assertTrue(created)
        self.assertTrue(url.endswith("sample-learning-tool"))
        method, path, created_payload = req.call_args.args[1:]
        self.assertEqual(method, "POST")
        self.assertEqual(path, "/user/repos")
        self.assertIs(created_payload["private"], True)
        self.assertIs(created_payload["auto_init"], True)
        self.assertEqual(created_payload["homepage"], "https://github.com/moyashimisosoup/app-factory/issues/42")

    @patch.object(app, "request_api")
    def test_no_create_when_existing_repo_is_unrelated(self, req):
        req.side_effect = [
            (200, {"login": "moyashimisosoup"}),
            (200, {"private": True, "homepage": "https://example.com/not-the-issue"}),
        ]
        with self.assertRaises(app.FactoryError):
            app.create_repository(self.payload, self.issue, "dummy-not-real")
        self.assertEqual(req.call_count, 2)

    @patch.object(app, "request_api")
    def test_retry_of_same_issue_is_noop(self, req):
        req.side_effect = [
            (200, {"login": "moyashimisosoup"}),
            (200, {"private": True,
                   "homepage": "https://github.com/moyashimisosoup/app-factory/issues/42",
                   "html_url": "https://github.com/moyashimisosoup/sample-learning-tool"}),
        ]
        _, created = app.create_repository(self.payload, self.issue, "dummy-not-real")
        self.assertFalse(created)
        self.assertEqual(req.call_count, 2)

    @patch.object(app, "request_api")
    def test_wrong_account_never_creates(self, req):
        req.return_value = (200, {"login": "yama-books"})
        with self.assertRaises(app.FactoryError):
            app.create_repository(self.payload, self.issue, "dummy-not-real")
        self.assertEqual(req.call_count, 1)

    def test_missing_credentials_fail_closed(self):
        with self.assertRaises(app.FactoryError):
            app.create_repository(self.payload, self.issue, "")


if __name__ == "__main__":
    unittest.main()
