# Cofounder Workflow Agent (Strands Agents + Amazon Bedrock)

The part of Cofounder that turns *"what you did this week"* into *"what I can take off your hands"*.

Cofounder's observer (a native macOS binary plus `electron/agent/observer.cjs`) records one line
per foreground change: which app, which window title, which site. It never records keystrokes,
passwords or field contents. This agent reads that stream and:

1. **mines** the ordered app/site sequences you repeat. This step is deterministic and needs no model: see `cofounder_agent/activity.py`;
2. **judges** each candidate with a Strands agent running on Amazon Bedrock. It looks at the real
   window titles and timestamps, rejects navigation noise, and checks existing memory so it does not duplicate;
3. **writes memory**: for each genuine workflow, a named card with steps, trigger, frequency, an
   honest time-saved estimate, a confidence score, the evidence ids, and an `automation_mission`
   that Cofounder's computer-use loop can execute. It also saves durable facts about how you work;
4. hands the result back to the Mac app (`electron/agent/strands.cjs`). The app stores it in the
   shared SQLite memory, so every later mission recalls it.

## Tools the model can call

| Tool | What it does |
|------|--------------|
| `get_activity_overview` | Events, days, sessions, time per app and per site |
| `find_repeated_workflows` | Deterministic sequence mining: non-overlapping repetitions, subsumption and rotation dedupe |
| `get_workflow_evidence` | Timestamped occurrences and window titles for one candidate |
| `recall_memory` | Workflows saved earlier, plus a read-only FTS search of Cofounder's memory DB |
| `save_workflow` | Persist a workflow. It must cite real candidate ids, so the model cannot invent one |
| `remember_fact` | Persist a durable fact about how the user works |

## Run it

Requirements: [uv](https://docs.astral.sh/uv/), Python 3.10+, AWS credentials with Amazon Bedrock
model access (default model: `global.anthropic.claude-sonnet-4-6`; override with `COFOUNDER_BEDROCK_MODEL`).

```bash
cd strands-agent
uv sync

# 1. Deterministic mining only (no AWS needed) — on the bundled synthetic week:
uv run python -m cofounder_agent.cli --offline --log demo/sample-observation.jsonl --hours 100000

# 2. Full Strands run on Bedrock, same data:
export AWS_REGION=us-west-2
uv run python -m cofounder_agent.cli --log demo/sample-observation.jsonl --hours 100000

# 3. Full run on this Mac's real activity (Cofounder must have been observing):
uv run python -m cofounder_agent.cli --hours 168

# 4. Serve the AgentCore contract locally (POST /invocations, GET /ping on :8080):
uv run python main.py
curl -s localhost:8080/invocations -H 'content-type: application/json' \
  -d "{\"events\": $(uv run python -c 'import json;print(json.dumps([json.loads(l) for l in open("demo/sample-observation.jsonl")]))')}"

# Tests (no model, no network)
uv run python tests/test_activity.py
```

The Mac app calls the agent when it runs with `COFOUNDER_STRANDS_AUTOSTART=1`: it starts the local
server itself, sends the last 7 days of activity every 30 minutes, and notifies you when it finds a new workflow.
Point `COFOUNDER_STRANDS_URL` at another endpoint to use a remote deployment.

## Deploy to Amazon Bedrock AgentCore Runtime

```bash
cd strands-agent
uv run --with bedrock-agentcore-starter-toolkit agentcore configure --entrypoint main.py --requirements-file requirements.txt --name cofounder_workflow_agent
uv run --with bedrock-agentcore-starter-toolkit agentcore deploy
uv run --with bedrock-agentcore-starter-toolkit agentcore invoke "$(cat demo/payload.json)"
```

The payload carries the events, so the deployed agent never needs access to the user's disk.
`recall_memory` then works on the `known_workflows` that the client sends.

## Privacy

- Only behaviour leaves the Mac: app name, bundle id, window title and URL. The clipboard sample is dropped client-side.
- E-mail addresses and long numbers in window titles are masked before the model sees them (`activity.redact`).
- The observer has its own pause and erase switches in the app. Deleting `observation.jsonl` or
  `strands-workflows.json` removes everything this agent ever used.
