"""Amazon Bedrock AgentCore Runtime entrypoint.

The same file runs locally (`python -m cofounder_agent.app` serves POST /invocations
and GET /ping on :8080, the AgentCore contract) and deploys unchanged to AgentCore
Runtime. The Mac app sends the recent activity in the payload, so the cloud agent
never needs access to the user's disk.

Payload:
    {"events": [...observation lines...], "known_workflows": [...], "request": "optional"}
When `events` is omitted (local run only), the observation log on this machine is read.
"""

from __future__ import annotations

from bedrock_agentcore.runtime import BedrockAgentCoreApp

from . import activity
from .agent import analyze

app = BedrockAgentCoreApp()


@app.entrypoint
def invoke(payload: dict) -> dict:
    payload = payload or {}
    events = payload.get("events")
    local = events is None
    if local:
        events = activity.load_events(hours=float(payload.get("hours", 168)))
    return analyze(
        events,
        known_workflows=payload.get("known_workflows") or [],
        known_facts=payload.get("known_facts") or [],
        memory_db=str(activity.default_memory_db()) if local else None,
        request=payload.get("request"),
    )


if __name__ == "__main__":
    app.run()
