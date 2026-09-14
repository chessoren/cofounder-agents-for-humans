# Cofounder: Agents for Humans submission kit

Track: **Professional Agents**

## Elevator pitch
Cofounder watches how you work on your Mac, and a Strands agent on Amazon Bedrock AgentCore spots the workflows you repeat. It keeps a precise memory of them and offers to take them over.

## The problem
Professionals lose hours every week to small sequences they repeat without noticing: an invoice from Gmail, copied into a
spreadsheet, then booked in the accounting tool; or CRM numbers pasted into the Friday report. Automation tools
start from a question nobody can answer: *"what do you want to automate?"* The repetition is invisible from the
inside, and describing it precisely enough for a bot takes longer than doing it.

## Who it's for
Freelancers, bookkeepers, recruiters, account managers and operations people. They work in a browser and a few SaaS tools, and have no engineering team.

## What it does
1. **Observes behaviour, not content.** Every 2 seconds, the app records which app is in front, the window title and the tab URL.
   It records no keystrokes, clipboard or screenshots. Observation is visible and can be paused or erased in one click.
2. **Detects repeated workflows.** Every 30 minutes, or on demand, the last 7 days of activity go to the **Workflow
   Analyst**, a **Strands Agents** agent running on **Amazon Bedrock AgentCore Runtime** with Claude on **Amazon Bedrock**.
   A deterministic miner first extracts the repeated app and site sequences. The agent then reads the evidence, rejects noise,
   checks memory, and saves only genuine workflows. `save_workflow` must cite real occurrences.
3. **Remembers precisely.** Each workflow is stored with its steps, trigger, frequency, time saved per week, confidence,
   evidence and an executable *automation mission*. Durable facts about how you work are reconfirmed, never duplicated.
4. **Speaks up and takes over.** A macOS notification announces each new workflow. "Take it over" hands the mission to the
   computer-use executor. The executor plans with Bedrock, reads the macOS accessibility tree (with vision as a fallback),
   and drives the real mouse and keyboard while an overlay shows every step.

## How we built it
- **Strands Agents SDK (Python)**: one agent and six `@tool` functions (`get_activity_overview`, `find_repeated_workflows`,
  `get_workflow_evidence`, `recall_memory`, `save_workflow`, `remember_fact`), with `BedrockModel` (Claude Sonnet 4.6).
- **Amazon Bedrock AgentCore Runtime**: `BedrockAgentCoreApp` entrypoint, deployed with the AgentCore starter toolkit
  (`scripts/deploy-agentcore.sh`). The desktop app calls it with `InvokeAgentRuntime` (AWS SDK for JavaScript, SigV4).
  The activity travels in the payload, so the cloud agent never touches the disk.
- **Amazon Bedrock Converse API**: the desktop app's chat, the executor's planner and the vision fallback.
- **Electron desktop app**: System Events observer, JSON memory, React UI, nut.js input, a JXA accessibility reader.

## Challenges
- Separating *workflows* from *navigation*: raw sequences are dominated by alt-tab laps and rotations of the same loop.
- Making the model trustworthy: it may only save workflows backed by counted, timestamped evidence.
- Privacy by construction: behaviour only, with e-mails and long numbers in titles masked before any model call.

## What's next
AgentCore Memory for cross-device recall, one-sentence corrections to a detected workflow, and team-level workflow detection.

---

## Pre-existing code disclosure
> **Owner: check every line before submitting.** The rules require projects to be created during the Submission
> Period (Aug 10 – Sep 14, 2026) and pre-existing code to be disclosed. Timestamps of the files are visible to anyone.

The Cofounder project began on **10 August 2026**.

It reuses an earlier prototype by the same author, the **Mira desktop** app, whose files are dated **25 June – 6 July 2026**:
- the Electron window and the onboarding UI (`src/pages/Index.tsx`, `src/index.css`), whose visual design comes from the author's SixSense landing page;
- the nut.js mouse/keyboard bridge;
- the skeleton of the agent orchestrator (planner / matcher / macro replay). It was Windows-only and used a local Ollama model.

Built for this hackathon, during the Submission Period:
- **Workflow agent:** the Strands workflow agent and its deterministic miner (`strands-agent/`), plus the AgentCore deployment (`scripts/deploy-agentcore.sh`).
- **Proactive layer:** the macOS activity observer (`electron/observer.cjs`), the workflow memory (`electron/memory.cjs`), the AgentCore client (`electron/workflows.cjs`), and the workflows UI and notifications (`src/WorkflowsPanel.tsx`, IPC in `electron/main.cjs` / `preload.cjs`).
- **Bedrock migration:** the Bedrock model client (`electron/bedrock.cjs`), and moving the chat, planner and vision from Google Vertex / Ollama to Amazon Bedrock.
- **macOS executor:** the accessibility reader (JXA), app launching and key mapping (`electron/agent/*`).
- **Clean-up:** removal of the Supabase and Google back-ends, and a local account store.

Third-party open source: see `package.json` and `strands-agent/pyproject.toml`.

## Testing instructions for judges
Agent only (any OS):
```bash
git clone https://github.com/chessoren/cofounder-agents-for-humans && cd cofounder-agents-for-humans/strands-agent
uv sync && uv run python tests/test_activity.py
uv run python -m cofounder_agent.cli --offline --log demo/sample-observation.jsonl --hours 100000   # no AWS needed
AWS_REGION=us-west-2 uv run python -m cofounder_agent.cli --log demo/sample-observation.jsonl --hours 100000
```
Desktop app (macOS): `npm install && npm run electron:dev`. Grant Accessibility and Automation. AWS credentials with Bedrock access are required.

## Demo video script (≈3:30, max 5:00)
| Time | Screen | Voice-over |
|------|--------|-----------|
| 0:00 | Title | "Automation tools ask *what do you want to automate?* Nobody can answer that." |
| 0:20 | A bookkeeper repeats Gmail → Google Sheets → Pennylane | "Léa, a freelance bookkeeper, does this every morning without counting." |
| 0:45 | Cofounder home, observation indicator, Pause button | "Cofounder watches behaviour: apps, windows, sites. Never keystrokes. One click pauses it." |
| 1:05 | Architecture diagram | "Every 30 minutes the last week goes to our Workflow Analyst, a Strands agent on Bedrock AgentCore." |
| 1:30 | "Analyse now", then the AgentCore invocation (console or logs) | "A deterministic miner finds sequences that repeat. The agent reads the evidence, rejects noise, and saves only real workflows." |
| 2:15 | Notification + workflow card: steps, 11× in 5 days, ~40 min/week | "The result is a precise memory: steps, trigger, frequency, time saved, and a mission to execute." |
| 2:45 | "Take it over": overlay and cursor running the flow | "One click, and Cofounder does it with the real mouse and keyboard." |
| 3:15 | Closing | "Cofounder: an agent for humans that notices what you repeat and gives you the time back." |

## Submission checklist
- [ ] Public repo, MIT license in the About section
- [ ] README + `docs/architecture.svg`
- [ ] Public video ≤5 min (YouTube/Vimeo)
- [ ] AWS Builder ID
- [ ] Pre-existing code disclosure checked by the owner
- [ ] Track: Professional Agents
