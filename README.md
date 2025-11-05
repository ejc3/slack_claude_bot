# Slack Claude Code Bot

This project provides a Slack bot that invokes the Claude Code SDK (or CLI) to
execute user requests sent via Slack mentions. After the task is executed, the
bot automatically files a GitHub issue summarising the request and Claude's
output.

## Features

- Listens for `@bot` mentions in Slack and extracts the user's request.
- Executes the request using the Claude Code SDK when available, falling back to
the CLI otherwise.
- Creates a GitHub issue containing the original request and Claude's output.
- Supports Socket Mode or HTTP mode for Slack event delivery.

## Configuration

Set the following environment variables before running the bot:

| Variable | Required | Description |
| --- | --- | --- |
| `SLACK_BOT_TOKEN` | ✅ | Bot token for your Slack app. |
| `SLACK_SIGNING_SECRET` | ❔ | Needed when running in HTTP mode. |
| `SLACK_APP_TOKEN` | ❔ | Enables Socket Mode when provided. |
| `CLAUDE_CODE_API_KEY` | ❔ | API key passed to the Claude Code SDK. |
| `CLAUDE_CODE_PREFER_SDK` | ❔ | Set to `0`/`false` to force CLI usage. |
| `CLAUDE_CODE_CLI` | ❔ | Override the Claude Code CLI executable. |
| `CLAUDE_CODE_CLI_ARGS` | ❔ | Extra CLI arguments before the task string. |
| `GITHUB_TOKEN` | ✅ | GitHub token with `repo` scope to create issues. |
| `GITHUB_REPO` | ✅ | Target repository in `owner/name` format. |

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Install the Claude Code SDK or CLI separately according to its official
instructions.

## Running the bot

```bash
# Socket Mode (requires SLACK_APP_TOKEN)
python app.py

# HTTP mode (requires SLACK_SIGNING_SECRET)
PORT=3000 python app.py
```

Once running, mention the bot in Slack with a description of the task you would
like Claude Code to complete. The bot will respond with the execution status and
provide a link to the GitHub issue it creates.
