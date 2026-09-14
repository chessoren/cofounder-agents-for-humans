#!/usr/bin/env bash
# Deploy the Strands workflow agent to Amazon Bedrock AgentCore Runtime and point
# the desktop app at it (writes agentcore-runtime.json at the repo root).
#
# Requires: uv, AWS credentials with permissions for AgentCore, IAM, ECR/CodeBuild
# and Bedrock model access. Region defaults to us-west-2.
set -euo pipefail
cd "$(dirname "$0")/../strands-agent"
export AWS_REGION="${AWS_REGION:-us-west-2}"
TOOLKIT=(uv run --with bedrock-agentcore-starter-toolkit agentcore)

"${TOOLKIT[@]}" configure \
  --entrypoint main.py \
  --name cofounder_workflow_agent \
  --requirements-file requirements.txt \
  --region "$AWS_REGION" \
  --non-interactive

"${TOOLKIT[@]}" deploy

ARN=$(uv run python - <<'PY'
import yaml, sys
cfg = yaml.safe_load(open(".bedrock_agentcore.yaml"))
agents = cfg.get("agents", {})
agent = agents.get(cfg.get("default_agent")) or next(iter(agents.values()))
print(agent["bedrock_agentcore"]["agent_arn"])
PY
)
printf '{ "agentRuntimeArn": "%s" }\n' "$ARN" > ../agentcore-runtime.json
echo "AgentCore runtime: $ARN"
echo "Wrote agentcore-runtime.json. The desktop app now calls the deployed agent."
