"""No-network tests for idempotent, optimistic private event records."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parent.parent/"scripts"))
from private_journal import (
    EVENT_PREFIX, prepare_append, parse_doc_paragraphs, verify_saved,
    summarize_work, preview_from_doc,
)

def event(event_id="PILOT_START_001",event_type="START",session="fake-claude-001",**fields):
    base={
       "schema_version":1,"event_id":event_id,"event_type":event_type,
       "app_id":"APP-001","work_id":"APP-001-W9999",
       "session_id":session,"platform":"claude_code",
       "event_at":None, "recorded_at":"2026-10-17T00:54:52Z",
       "time_verification":"not_observed","native_id_verified":False,
       "privacy_classification":"private_session_metadata",
       "summary":"FICTIONAL TEST EVENT, not a real session.",
       "next_action":"Check the synthetic handoff"
    }
    base.update(fields)
    return base

def lines_for(*events):
    from private_journal import canonical_event
    return [{"text": "PRIVATE TEST JOURNAL\n"}] + [{"text":EVENT_PREFIX+canonical_event(e)} for e in events]

class PrivateJournalTest(unittest.TestCase):
    def test_produces_revision_guarded_append(self):
        e=event()
        plan=prepare_append([{"text":"PRIVATE TEST JOURNAL"}],"document-revision-1",e)
        self.assertEqual("append",plan.action)
        self.assertEqual("document-revision-1",plan.expected_revision)
        self.assertTrue(plan.text.startswith(EVENT_PREFIX))
        self.assertTrue(plan.text.endswith("\n"))
        self.assertNotIn("PRIVATE_DOC_ID",plan.text)

    def test_idempotent_same_event_is_noop(self):
        e=event()
        plan=prepare_append(lines_for(e),"revision-2",e)
        self.assertEqual("already_present",plan.action)
        self.assertEqual("",plan.text)
        self.assertTrue(verify_saved(lines_for(e),e))

    def test_collision_fails_closed(self):
        e=event()
        changed=event(summary="DIFFERENT")
        self.assertRaises(ValueError,prepare_append,lines_for(e),"revision-2",changed)

    def test_duplicate_journal_entries_rejected(self):
        e=event()
        self.assertRaises(ValueError,parse_doc_paragraphs,lines_for(e,e))

    def test_tampered_prefixed_line_rejected(self):
        self.assertRaises(ValueError,parse_doc_paragraphs,[{"text":EVENT_PREFIX+"{bad json}"}])

    def test_pilot_probe_without_prefix_ignored(self):
        old=[{"text":'{"event_type":"PROBE","session_id":"not_real"}'}]
        self.assertEqual([],parse_doc_paragraphs(old))

    def test_resume_chain_state(self):
        start=event("PILOT_START_001","START",event_at="2026-10-17T01:00:00Z",time_verification="manually_confirmed")
        ckpt=event("PILOT_CHECKPOINT_001","CHECKPOINT",next_action="Write handoff memo",head_sha="a"*40)
        handoff=event("PILOT_HANDOFF_001","HANDOFF",next_action="Inspect current HEAD and CI")
        resume=summarize_work([start,ckpt,handoff])
        self.assertEqual(1,len(resume))
        w=resume[0]
        self.assertEqual("handoff_recorded",w["recorded_state"])
        self.assertEqual("Inspect current HEAD and CI",w["next_action"])
        self.assertEqual("a"*40,w["head_sha"])
        self.assertTrue(w["sessions"][0]["started_at"].startswith("2026-10-17T01:00:00"))
        self.assertIsNone(w["sessions"][0]["ended_at"])
        self.assertEqual("HANDOFF",w["last_event_type"])

    def test_no_inferred_activity_or_end_time(self):
        checkpoint=event("PILOT_CHECKPOINT_001","CHECKPOINT")
        state=summarize_work([checkpoint])[0]
        self.assertEqual("checkpoint_recorded",state["recorded_state"])
        self.assertIsNone(state["sessions"][0]["started_at"])
        self.assertIsNone(state["sessions"][0]["ended_at"])
        self.assertFalse(state["has_verified_event_time"])

    def test_explicit_end_only(self):
        start=event()
        stop=event("PILOT_END_0001","END",event_at="2026-10-17T01:20:00Z",time_verification="instrumented")
        result=summarize_work([start,stop])[0]
        self.assertEqual("closed_recorded",result["recorded_state"])
        self.assertEqual("2026-10-17T01:20:00+00:00",result["sessions"][0]["ended_at"])

    def test_same_work_multiple_sessions_dont_mix(self):
        a=event("PILOT_START_001","START")
        b=event("PILOT_HANDOFF_001","HANDOFF",session="fake-claude-002")
        snap=summarize_work([a,b])[0]
        self.assertEqual(2,snap["session_count"])
        self.assertIsNone(snap["sessions"][0]["ended_at"])

    def test_readback_missing_event_not_success(self):
        self.assertFalse(verify_saved(lines_for(),event()))

    def test_revision_must_be_present(self):
        self.assertRaises(ValueError,prepare_append,[], "",event())

    def test_journal_bounds(self):
        self.assertRaises(ValueError,parse_doc_paragraphs,[{"text":"X" * 500001}])
        self.assertRaises(ValueError,parse_doc_paragraphs,[{"wrong":"shape"}])

    def test_multiwork_sorting(self):
        e=event("PILOT_START_001","START")
        f=event("PILOT_START_002","START",work_id="APP-001-W9998")
        w=preview_from_doc(lines_for(e,f))
        self.assertEqual(["APP-001-W9998","APP-001-W9999"],[x["work_id"] for x in w])

if __name__ == "__main__":
    unittest.main()
