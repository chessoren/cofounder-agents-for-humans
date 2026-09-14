"""The Strands agent: evidence in, workflows and memory out.

The model never sees the raw stream. It works through tools that return counted,
timestamped evidence, and it can only persist what it saves through `save_workflow`
and `remember_fact` — so every automation Cofounder proposes is traceable to real
occurrences on the user's machine.
"""

from __future__ import annotations

import json
import os
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime

from strands import Agent, tool
from strands.models.bedrock import BedrockModel

# When Bedrock cannot serve the call (a brand-new account starts with a 0 quota,
# model access pending, no network to AWS), the same agent, tools and prompt run
# on a local model through Ollama, so detection never silently stops.
FALLBACK_ERRORS = ("Throttl", "AccessDenied", "ResourceNotFound", "ValidationException", "access",
                   "agreement", "NoCredentials", "EndpointConnection", "Could not connect")

from . import activity

SYSTEM_PROMPT = """You are the Workflow Analyst inside Cofounder, a macOS agent that watches how a \
professional works (which app, which window, which site, in what order — never keystrokes or \
passwords) and takes repetitive work off their hands.

Your job on every run:
1. Call get_activity_overview to understand the period, the tools and the sites this person uses.
2. Call find_repeated_workflows. Candidates are mined deterministically; you judge them.
3. For each promising candidate, call get_workflow_evidence and read the window titles. Decide whether \
it is a genuine, automatable professional workflow (e.g. copying invoice data from Gmail into a \
spreadsheet, then filing it in an accounting tool) or just navigation noise (checking messages, \
switching tabs, entertainment). Reject noise.
4. Call recall_memory before saving, so you update known workflows instead of duplicating them.
5. For each genuine workflow call save_workflow with: a short name a human would use, what it achieves, \
the concrete steps, what triggers it, how often it happens, an honest estimate of minutes saved per \
week, your confidence (0-1), and `automation_mission` — a precise, imperative instruction that \
Cofounder's computer-use agent can execute end to end (apps, sites, what to read, what to write, \
where to stop and ask the human).
6. Call remember_fact for durable facts that make future help more precise (tools of record, working \
hours, recurring counterparts, naming conventions). No sensitive personal data.
7. Finish with a 2-3 sentence summary for the user, in plain English, starting with the most valuable \
automation. If nothing qualifies, say so plainly: never invent a workflow the evidence does not show."""


@dataclass
class RunContext:
    events: list[dict]
    known_workflows: list[dict] = field(default_factory=list)
    known_facts: list[dict] = field(default_factory=list)
    memory_db: str | None = None
    candidates: dict[str, dict] = field(default_factory=dict)
    workflows: list[dict] = field(default_factory=list)
    facts: list[dict] = field(default_factory=list)


def build_tools(ctx: RunContext) -> list:
    @tool
    def get_activity_overview() -> dict:
        """Summarise the observed period: event count, days, work sessions, time per app and per website."""
        return activity.overview(ctx.events)

    @tool
    def find_repeated_workflows(min_occurrences: int = 2, max_steps: int = 5) -> list[dict]:
        """Mine ordered app/site sequences the user repeats.

        Args:
            min_occurrences: minimum number of non-overlapping repetitions (2 or more).
            max_steps: longest sequence to consider (2 to 8).
        """
        found = activity.find_workflows(ctx.events, max(2, min_occurrences), min(8, max(2, max_steps)))
        ctx.candidates = {c["id"]: c for c in found}
        return [activity.public(c) for c in found]

    @tool
    def get_workflow_evidence(candidate_id: str) -> dict:
        """Return the timestamped occurrences and window titles behind one candidate.

        Args:
            candidate_id: an id returned by find_repeated_workflows (wf_...).
        """
        c = ctx.candidates.get(candidate_id)
        if not c:
            return {"error": f"unknown candidate {candidate_id}; call find_repeated_workflows first"}
        return {"steps": c["steps"], "occurrences": activity.evidence(c)}

    @tool
    def recall_memory(query: str) -> dict:
        """Search what Cofounder already knows: workflows saved on earlier runs and the long-term memory notes.

        Args:
            query: a few keywords (app names, site names, task words).
        """
        words = [w.lower() for w in query.split() if len(w) > 2]
        known = [
            w for w in ctx.known_workflows + ctx.workflows
            if any(x in json.dumps(w).lower() for x in words)
        ][:8]
        facts = [f for f in ctx.known_facts + ctx.facts if any(x in json.dumps(f).lower() for x in words)][:12]
        notes = []
        if ctx.memory_db and os.path.exists(ctx.memory_db) and words:
            try:
                con = sqlite3.connect(f"file:{ctx.memory_db}?mode=ro", uri=True)
                fts = " OR ".join('"' + w.replace('"', "") + '"' for w in words)
                rows = con.execute(
                    "SELECT n.kind, n.title, n.narrative FROM notes n "
                    "WHERE n.id IN (SELECT id FROM notes_fts WHERE notes_fts MATCH ?) LIMIT 8",
                    (fts,),
                ).fetchall()
                con.close()
                notes = [{"kind": k, "title": t, "narrative": (n or "")[:300]} for k, t, n in rows]
            except sqlite3.Error as err:
                notes = [{"error": f"memory unavailable: {err}"}]
        return {"known_workflows": known, "known_facts": facts, "memory_notes": notes}

    @tool
    def save_workflow(
        name: str,
        summary: str,
        steps: list[str],
        trigger: str,
        frequency: str,
        minutes_saved_per_week: float,
        confidence: float,
        automation_mission: str,
        candidate_ids: list[str],
    ) -> dict:
        """Persist a confirmed repetitive workflow to Cofounder's memory, with a mission to automate it.

        Args:
            name: short human name, e.g. "Weekly invoice reconciliation".
            summary: one sentence on what the workflow achieves.
            steps: ordered concrete steps.
            trigger: what starts it (time of day, an incoming e-mail, end of week...).
            frequency: how often it was observed, e.g. "4 times over 3 days".
            minutes_saved_per_week: honest estimate of time Cofounder would give back.
            confidence: 0 to 1, how sure the evidence makes you.
            automation_mission: imperative instruction for Cofounder's computer-use agent.
            candidate_ids: the wf_ ids that support this workflow.
        """
        evidence = []
        for cid in candidate_ids:
            c = ctx.candidates.get(cid)
            if c:
                evidence.append({"id": cid, "occurrences": c["occurrences"], "last_seen": c["last_seen"]})
        if not evidence:
            return {"saved": False, "error": "a workflow must cite at least one real candidate id"}
        wf = {
            "id": evidence[0]["id"],
            "name": name.strip()[:80],
            "summary": summary.strip()[:400],
            "steps": [s.strip()[:200] for s in steps][:12],
            "trigger": trigger.strip()[:200],
            "frequency": frequency.strip()[:120],
            "minutes_saved_per_week": max(0.0, float(minutes_saved_per_week)),
            "confidence": min(1.0, max(0.0, float(confidence))),
            "automation_mission": automation_mission.strip()[:2000],
            "evidence": evidence,
            "detected_at": datetime.now().isoformat(timespec="seconds"),
        }
        ctx.workflows = [w for w in ctx.workflows if w["id"] != wf["id"]] + [wf]
        return {"saved": True, "id": wf["id"]}

    @tool
    def remember_fact(fact: str, concepts: list[str]) -> dict:
        """Store one durable fact about how this person works.

        Args:
            fact: a single precise sentence, e.g. "Uses Pennylane for accounting and Gmail for client invoices".
            concepts: 1-6 keywords for retrieval.
        """
        fact = fact.strip()[:300]
        if not fact:
            return {"saved": False}
        if all(f["fact"] != fact for f in ctx.facts):
            ctx.facts.append({"fact": fact, "concepts": [c.strip()[:40] for c in concepts][:6]})
        return {"saved": True}

    return [get_activity_overview, find_repeated_workflows, get_workflow_evidence,
            recall_memory, save_workflow, remember_fact]


def build_model(model_id: str | None = None) -> BedrockModel:
    kwargs = {"temperature": 0.2}
    model_id = model_id or os.environ.get("COFOUNDER_BEDROCK_MODEL")
    if model_id:
        kwargs["model_id"] = model_id
    region = os.environ.get("AWS_REGION")
    if region:
        kwargs["region_name"] = region
    return BedrockModel(**kwargs)


def bedrock_probe() -> None:
    import boto3
    from botocore.config import Config

    model = build_model()
    client = boto3.client("bedrock-runtime", region_name=model.config.get("region_name") or os.environ.get("AWS_REGION", "us-west-2"),
                          config=Config(retries={"max_attempts": 1, "mode": "standard"}, connect_timeout=5, read_timeout=20))
    client.converse(modelId=model.config["model_id"], messages=[{"role": "user", "content": [{"text": "ping"}]}],
                    inferenceConfig={"maxTokens": 1})


def ollama_host() -> str:
    return os.environ.get("COFOUNDER_OLLAMA_HOST", "http://127.0.0.1:11434")


def ollama_available() -> bool:
    import urllib.request

    try:
        with urllib.request.urlopen(f"{ollama_host()}/api/tags", timeout=2) as r:
            return r.status == 200
    except OSError:
        return False


def build_local_model():
    from strands.models.ollama import OllamaModel

    return OllamaModel(host=ollama_host(), model_id=os.environ.get("COFOUNDER_OLLAMA_MODEL", "gemma4:e2b"), temperature=0.2)


def analyze(events: list[dict], known_workflows: list[dict] | None = None,
            memory_db: str | None = None, request: str | None = None, verbose: bool = False,
            known_facts: list[dict] | None = None) -> dict:
    ctx = RunContext(
        events=activity.normalize(events),
        known_workflows=known_workflows or [],
        known_facts=known_facts or [],
        memory_db=memory_db,
    )
    if not ctx.events:
        return {"summary": "No activity observed yet — nothing to analyse.",
                "workflows": [], "facts": [], "stats": {"events": 0}}

    options = {} if verbose else {"callback_handler": None}  # default handler streams to stdout
    agent = Agent(
        model=build_model(),
        system_prompt=SYSTEM_PROMPT,
        tools=build_tools(ctx),
        name="cofounder-workflow-analyst",
        **options,
    )
    prompt = request or "Analyse my recent activity and find the repetitive workflows you can take over."
    provider = "bedrock"
    try:
        # A one-shot probe with no retries: a refused account fails in a second here,
        # instead of minutes of throttling back-off inside the agent loop.
        bedrock_probe()
        result = agent(prompt)
    except Exception as err:
        if not any(k in f"{type(err).__name__} {err}" for k in FALLBACK_ERRORS) or not ollama_available():
            raise
        provider = "ollama"
        ctx.candidates, ctx.workflows, ctx.facts = {}, [], []
        agent = Agent(model=build_local_model(), system_prompt=SYSTEM_PROMPT, tools=build_tools(ctx),
                      name="cofounder-workflow-analyst", **options)
        result = agent(prompt)
    return {
        "summary": str(result).strip(),
        "workflows": ctx.workflows,
        "facts": ctx.facts,
        "stats": {"events": len(ctx.events), "candidates": len(ctx.candidates)},
        "model_provider": provider,
    }
