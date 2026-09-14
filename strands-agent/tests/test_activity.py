"""Deterministic tests for the mining layer (no model, no network).

    uv run python -m pytest tests      # or: uv run python tests/test_activity.py
"""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from cofounder_agent import activity  # noqa: E402


def sample_events():
    out = subprocess.run([sys.executable, str(ROOT / "demo" / "make_sample.py")],
                         check=True, capture_output=True, text=True).stdout
    return [json.loads(line) for line in out.splitlines() if line.strip()]


def test_invoice_workflow_is_the_top_candidate():
    events = activity.normalize(sample_events())
    found = activity.find_workflows(events)
    assert found, "no candidate mined"
    top = found[0]
    assert top["steps"] == [
        "Google Chrome (mail.google.com)",
        "Google Chrome (docs.google.com)",
        "Google Chrome (app.pennylane.com)",
    ] or "app.pennylane.com" in " ".join(top["steps"]), top["steps"]
    assert top["occurrences"] >= 10
    assert top["distinct_days"] == 5


def test_self_and_flicker_are_ignored():
    raw = [
        {"t": 1000, "app": "Electron", "bundle": "com.github.Electron", "title": "Cofounder"},
        {"t": 1001, "app": "Notes", "bundle": "com.apple.Notes", "title": "a"},
        {"t": 1001.5, "app": "Mail", "bundle": "com.apple.mail", "title": "flick"},
        {"t": 1002, "app": "Notes", "bundle": "com.apple.Notes", "title": "b"},
    ]
    sess = activity.sessions(activity.normalize(raw))
    assert [s.label for s in sess[0]] == ["Notes"]


def test_redaction():
    assert activity.redact("Invoice for jane@acme.com #12345678") == "Invoice for <email> ##"


def test_milliseconds_are_accepted():
    raw = [{"t": 1788217561304, "app": "Notes", "bundle": "com.apple.Notes", "title": "x"}]
    assert activity.normalize(raw)[0]["t"] == 1788217561.304


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
