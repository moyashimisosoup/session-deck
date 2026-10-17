import unittest
import sys
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parent.parent/"scripts"))
from validate_private_event import validate,validate_events

EXAMPLE={
  "schema_version":1,
  "event_id":"DEMO_EVENT_001",
  "event_type":"CHECKPOINT",
  "app_id":"APP-001",
  "work_id":"APP-001-W0003",
  "session_id":"demo-not-a-real-session",
  "platform":"chatgpt",
  "event_at":None,
  "recorded_at":"2026-10-17T00:54:52Z",
  "time_verification":"not_observed",
  "native_id_verified":False,
  "privacy_classification":"private_session_metadata",
  "summary":"Fake data for validator tests only.",
  "next_action":"Review code",
  "evidence_urls":[]
}

class ValidationTests(unittest.TestCase):
    def test_valid_event_without_fabricated_time(self):
        self.assertEqual("CHECKPOINT", validate(dict(EXAMPLE))["event_type"])
    def test_observed_timestamp_requires_real_flag(self):
        e=dict(EXAMPLE,event_at="2026-10-17T00:55:00Z")
        self.assertRaises(ValueError,validate,e)
        e["time_verification"]="manually_confirmed"
        self.assertEqual(e,validate(e))
    def test_reject_mismatched_work_id(self):
        self.assertRaises(ValueError,validate,dict(EXAMPLE,work_id="APP-002-W0003"))
    def test_reject_transcript_or_tokens(self):
        self.assertRaises(ValueError,validate,dict(EXAMPLE,transcript="private chat"))
        self.assertRaises(ValueError,validate,dict(EXAMPLE,api_key="private credential"))
    def test_reject_unverified_time_claim(self):
        self.assertRaises(ValueError,validate,dict(EXAMPLE,time_verification="manually_confirmed"))
    def test_reject_duplicate_event_ids(self):
        self.assertRaises(ValueError,validate_events,[dict(EXAMPLE),dict(EXAMPLE)])
    def test_acceptable_evidence(self):
        url="https://github.com/moyashimisosoup/session-deck/commit/"+"a"*40
        validate(dict(EXAMPLE,evidence_urls=[url]))
    def test_bad_evidence_url(self):
        self.assertRaises(ValueError,validate,dict(EXAMPLE,evidence_urls=["https://attacker.example/"]))
    def test_reject_non_private_classification(self):
        self.assertRaises(ValueError,validate,dict(EXAMPLE,privacy_classification="public"))
    def test_bad_date(self):
        self.assertRaises(ValueError,validate,dict(EXAMPLE,recorded_at="2026-10-17 09:54"))

if __name__=="__main__":
    unittest.main()
