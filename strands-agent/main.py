"""AgentCore entrypoint file (`agentcore configure --entrypoint main.py`)."""

from cofounder_agent.app import app

if __name__ == "__main__":
    app.run()
