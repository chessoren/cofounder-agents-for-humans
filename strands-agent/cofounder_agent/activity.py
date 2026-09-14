"""Activity mining: turns Cofounder's raw observation stream into evidence.

The Electron observer writes one JSON line per foreground change:

    {"t": 1788217561.3, "app": "Google Chrome", "bundle": "com.google.Chrome",
     "title": "Invoices - Google Sheets", "url": "https://docs.google.com/...", "sig": "..."}

Nothing here calls a model. This module is deterministic on purpose: the agent
reasons over *evidence* (counted, timestamped occurrences), never over a guess.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse

# Switching to Cofounder itself, to Claude, to Finder or to Settings is the
# mechanics of using a computer, not a work step. Same list as observer.cjs.
EXCLUDED_BUNDLES = {
    "com.github.Electron", "io.cofounder.app", "com.anthropic.claudefordesktop",
    "com.apple.finder", "com.apple.dock", "com.apple.loginwindow",
    "com.apple.systempreferences", "com.apple.controlcenter", "com.apple.notificationcenterui",
}
EXCLUDED_NAMES = ("cofounder", "mira", "electron", "claude", "finder")
# macOS system surfaces that take the foreground without being anyone's work:
# the lock screen, permission prompts, notification alerts.
SYSTEM_NAMES = {"loginwindow", "usernotificationcenter", "universalaccessauthwarn", "securityagent",
                "coreservicesuiagent", "screencaptureui", "dock", "controlcenter", "notificationcenter"}
INVISIBLE_RE = re.compile(r"[​-‏‪-‮⁠﻿]")

SESSION_GAP_S = 15 * 60      # a pause longer than this starts a new work session
FLICKER_S = 2.0              # a station visited for less than this is an alt-tab pass
MAX_DWELL_S = 5 * 60         # cap per-event dwell when computing time spent

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
LONG_NUM_RE = re.compile(r"\b\d{6,}\b")


# The desktop app's own data folder (electron/main.cjs sets it explicitly).
APP_DATA = Path.home() / "Library" / "Application Support" / "Cofounder Agents for Humans"


def default_log_path() -> Path:
    override = os.environ.get("COFOUNDER_OBSERVATION_LOG")
    if override:
        return Path(override).expanduser()
    return APP_DATA / "observation.jsonl"


def default_memory_db() -> Path:
    override = os.environ.get("COFOUNDER_MEMORY_DB")
    if override:
        return Path(override).expanduser()
    return APP_DATA / "cofounder-memory.db"


def redact(text: str) -> str:
    """Window titles can carry e-mail addresses and account numbers: mask them."""
    return LONG_NUM_RE.sub("#", EMAIL_RE.sub("<email>", text or ""))


def _seconds(t) -> float:
    t = float(t or 0)
    return t / 1000.0 if t > 1e12 else t


def _host(url: str) -> str:
    if not url:
        return ""
    try:
        host = urlparse(url).hostname or ""
    except ValueError:
        return ""
    if "." not in host and host != "localhost":
        return ""  # chrome://new-tab-page, about:blank, placeholders: not a site
    return host[4:] if host.startswith("www.") else host


def _app_name(ev: dict) -> str:
    return INVISIBLE_RE.sub("", str(ev.get("app") or "")).strip()


def _excluded(ev: dict) -> bool:
    if ev.get("bundle") in EXCLUDED_BUNDLES:
        return True
    name = _app_name(ev).lower()
    return not name or name in SYSTEM_NAMES or any(x == name or x in name for x in EXCLUDED_NAMES)


@dataclass
class Station:
    """One stop in a work sequence: an app, narrowed to a site when it is a browser."""

    key: str
    label: str
    start: float
    end: float
    titles: list[str] = field(default_factory=list)


@dataclass
class Occurrence:
    session: int
    index: int
    start: float
    end: float
    titles: list[str]


def load_events(path: Path | None = None, hours: float = 168, now: float | None = None) -> list[dict]:
    path = path or default_log_path()
    if not path.exists():
        return []
    horizon = (now or datetime.now(timezone.utc).timestamp()) - hours * 3600
    events = []
    with path.open("r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except json.JSONDecodeError:
                continue
            if _seconds(ev.get("t")) >= horizon:
                events.append(ev)
    return events


def normalize(events: Iterable[dict]) -> list[dict]:
    out = []
    for ev in events:
        if not isinstance(ev, dict) or ev.get("clipboard"):
            continue
        t = _seconds(ev.get("t"))
        if not t or _excluded(ev):
            continue
        host = _host(str(ev.get("url") or ""))
        app = _app_name(ev)
        out.append({
            "t": t,
            "app": app,
            "host": host,
            "key": f"{ev.get('bundle') or app}|{host}",
            "label": f"{app} ({host})" if host else app,
            "title": redact(str(ev.get("title") or ""))[:120],
        })
    out.sort(key=lambda e: e["t"])
    return out


def sessions(events: list[dict]) -> list[list[Station]]:
    """Split into work sessions and collapse the stream into stations."""
    result: list[list[Station]] = []
    current: list[Station] = []
    last_t = None
    for ev in events:
        if last_t is not None and ev["t"] - last_t > SESSION_GAP_S:
            if current:
                current[-1].end = min(current[-1].end, last_t + MAX_DWELL_S)
                result.append(current)
            current = []
        if current and current[-1].key == ev["key"]:
            if ev["title"] and ev["title"] not in current[-1].titles:
                current[-1].titles.append(ev["title"])
        else:
            if current:
                current[-1].end = ev["t"]
            current.append(Station(ev["key"], ev["label"], ev["t"], ev["t"], [ev["title"]] if ev["title"] else []))
        last_t = ev["t"]
    if current:
        current[-1].end = (last_t or current[-1].start) + 30
        result.append(current)

    cleaned = []
    for sess in result:
        kept = [s for i, s in enumerate(sess) if i == len(sess) - 1 or s.end - s.start >= FLICKER_S]
        merged: list[Station] = []
        for s in kept:
            if merged and merged[-1].key == s.key:
                merged[-1].end = s.end
                merged[-1].titles.extend(x for x in s.titles if x not in merged[-1].titles)
            else:
                merged.append(s)
        if merged:
            cleaned.append(merged)
    return cleaned


def overview(events: list[dict]) -> dict:
    minutes: Counter = Counter()
    hosts: Counter = Counter()
    days = set()
    for i, ev in enumerate(events):
        nxt = events[i + 1]["t"] if i + 1 < len(events) else ev["t"] + 30
        dwell = max(0.0, min(nxt - ev["t"], MAX_DWELL_S))
        minutes[ev["app"]] += dwell / 60
        if ev["host"]:
            hosts[ev["host"]] += dwell / 60
        days.add(datetime.fromtimestamp(ev["t"]).strftime("%Y-%m-%d"))
    sess = sessions(events)
    return {
        "events": len(events),
        "days": sorted(days),
        "sessions": len(sess),
        "first": _iso(events[0]["t"]) if events else None,
        "last": _iso(events[-1]["t"]) if events else None,
        "top_apps": [{"app": a, "minutes": round(m, 1)} for a, m in minutes.most_common(12)],
        "top_sites": [{"site": h, "minutes": round(m, 1)} for h, m in hosts.most_common(12)],
    }


def _iso(t: float) -> str:
    return datetime.fromtimestamp(t).isoformat(timespec="minutes")


def find_workflows(events: list[dict], min_occurrences: int = 2, max_steps: int = 5, limit: int = 12) -> list[dict]:
    """Mine the station sequences a person repeats.

    A candidate is an ordered run of 2..max_steps distinct stations that shows up
    at least `min_occurrences` times without overlapping itself. Shorter runs that
    are fully explained by a longer one (same count) are dropped, so "Sheets ->
    Gmail" disappears when "Sheets -> Gmail -> Stripe" carries the same evidence.
    """
    sess = sessions(events)
    found: dict[tuple, list[Occurrence]] = defaultdict(list)
    for si, stations in enumerate(sess):
        keys = [s.key for s in stations]
        for n in range(2, max_steps + 1):
            last_end: dict[tuple, int] = {}
            for i in range(0, len(keys) - n + 1):
                gram = tuple(keys[i:i + n])
                if len(set(gram)) < n:
                    continue  # a workflow visits each station once; A→B→A→B is two laps of A→B
                if last_end.get(gram, -1) > i:
                    continue  # overlapping with the previous hit of the same run
                last_end[gram] = i + n
                chunk = stations[i:i + n]
                found[gram].append(Occurrence(si, i, chunk[0].start, chunk[-1].end,
                                              [(c.titles[0] if c.titles else "") for c in chunk]))

    labels = {s.key: s.label for stations in sess for s in stations}
    candidates = []
    for gram, occ in found.items():
        if len(occ) < min_occurrences:
            continue
        days = {datetime.fromtimestamp(o.start).strftime("%Y-%m-%d") for o in occ}
        durations = sorted(max(0.0, o.end - o.start) for o in occ)
        hours = Counter(datetime.fromtimestamp(o.start).hour for o in occ)
        candidates.append({
            "id": "wf_" + hashlib.sha1("→".join(gram).encode()).hexdigest()[:10],
            "keys": list(gram),
            "steps": [labels.get(k, k) for k in gram],
            "occurrences": len(occ),
            "distinct_days": len(days),
            "median_duration_min": round(durations[len(durations) // 2] / 60, 1),
            "usual_hour": hours.most_common(1)[0][0],
            "first_seen": _iso(occ[0].start),
            "last_seen": _iso(occ[-1].start),
            "score": round(len(occ) * (len(gram) - 1) * (1 + 0.5 * (len(days) - 1)), 2),
            "_occ": occ,
        })

    # Subsumption: drop a run contained in a longer run with at least as many hits.
    candidates.sort(key=lambda c: (-len(c["keys"]), -c["occurrences"]))
    kept: list[dict] = []
    for c in candidates:
        if any(_contains(k["keys"], c["keys"]) and k["occurrences"] >= c["occurrences"] for k in kept):
            continue
        kept.append(c)
    kept.sort(key=lambda c: -c["score"])
    # Back-to-back laps of A→B→C also produce B→C→A and C→A→B: keep the strongest rotation.
    final: list[dict] = []
    for c in kept:
        if any(len(k["keys"]) == len(c["keys"]) and _is_rotation(k["keys"], c["keys"]) for k in final):
            continue
        final.append(c)
    return final[:limit]


def _is_rotation(a: list, b: list) -> bool:
    return len(a) == len(b) and any(a[i:] + a[:i] == b for i in range(len(a)))


def _contains(big: list, small: list) -> bool:
    n = len(small)
    return len(big) > n and any(big[i:i + n] == small for i in range(len(big) - n + 1))


def evidence(candidate: dict, max_items: int = 8) -> list[dict]:
    return [
        {
            "at": _iso(o.start),
            "duration_min": round(max(0.0, o.end - o.start) / 60, 1),
            "window_titles": o.titles,
        }
        for o in candidate["_occ"][-max_items:]
    ]


def public(candidate: dict) -> dict:
    return {k: v for k, v in candidate.items() if not k.startswith("_")}
