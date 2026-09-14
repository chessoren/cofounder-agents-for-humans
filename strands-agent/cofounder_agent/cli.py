"""Command line: run the analysis once against this Mac's observation log.

    uv run python -m cofounder_agent.cli --hours 168            # full Strands run (Bedrock)
    uv run python -m cofounder_agent.cli --hours 168 --offline  # deterministic mining only, no model
    uv run python -m cofounder_agent.cli --log demo/sample-observation.jsonl
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import activity


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="cofounder-agent")
    p.add_argument("--hours", type=float, default=168, help="how far back to look")
    p.add_argument("--log", type=Path, help="observation.jsonl to read (default: Cofounder's data dir)")
    p.add_argument("--offline", action="store_true", help="skip the model; print mined candidates")
    p.add_argument("--request", help="extra instruction for the agent")
    p.add_argument("--now", type=float, help="treat this epoch second as 'now' (for replaying sample logs)")
    args = p.parse_args(argv)

    events = activity.load_events(args.log, hours=args.hours, now=args.now)
    if args.offline:
        norm = activity.normalize(events)
        out = {
            "overview": activity.overview(norm),
            "candidates": [
                {**activity.public(c), "evidence": activity.evidence(c, 3)}
                for c in activity.find_workflows(norm)
            ],
        }
    else:
        from .agent import analyze

        out = analyze(events, memory_db=str(activity.default_memory_db()), request=args.request)
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
