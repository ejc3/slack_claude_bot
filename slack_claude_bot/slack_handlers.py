"""Slack Bolt application wiring."""

from __future__ import annotations

import logging
import os
from datetime import datetime

from slack_bolt import App

from .claude_executor import ClaudeExecutionError, execute_task
from .github_client import GitHubIssueError, create_issue

logger = logging.getLogger(__name__)


def build_app() -> App:
    """Create and configure the Slack Bolt application."""

    bot_token = os.environ["SLACK_BOT_TOKEN"]
    signing_secret = os.environ.get("SLACK_SIGNING_SECRET")

    app = App(token=bot_token, signing_secret=signing_secret)

    @app.event("app_mention")
    def handle_app_mention(body, say, client, logger):  # type: ignore[override]
        event = body.get("event", {})
        user = event.get("user")
        text = event.get("text", "")
        task_request = _extract_task_request(text, client.bot_user_id)

        acknowledgement = (
            f"Hi <@{user}>! I'm sending your request to Claude Code now."
            if user
            else "Processing your request with Claude Code."
        )
        say(acknowledgement)

        try:
            execution_output = execute_task(task_request)
        except ValueError as exc:
            say(f"I need a task description to run. {exc}")
            return
        except ClaudeExecutionError as exc:
            logger.exception("Claude Code execution failed")
            say(f"Claude Code could not complete the task: {exc}")
            return

        issue_url = None
        try:
            issue_url = create_issue(
                title=task_request,
                body=_format_issue_body(user=user, task=task_request, output=execution_output),
            )
        except GitHubIssueError as exc:
            logger.exception("Unable to create GitHub issue")
            say(
                "Task completed, but I could not create a GitHub issue: "
                f"{exc}. Please verify the GitHub configuration."
            )
        else:
            say(
                "Task completed by Claude Code! "
                f"GitHub issue created at {issue_url}."
            )

    return app


def _extract_task_request(message: str, bot_user_id: str | None) -> str:
    text = message or ""
    if bot_user_id:
        text = text.replace(f"<@{bot_user_id}>", "")
    return text.strip()


def _format_issue_body(*, user: str | None, task: str, output: str) -> str:
    timestamp = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    header = f"Slack request from <@{user}>" if user else "Slack request"

    sections = [
        header,
        "",
        f"**Task**\n{task.strip() or 'N/A'}",
        "",
        f"**Claude Code output**\n{output.strip() or 'No output produced.'}",
        "",
        f"_Logged at {timestamp}_",
    ]
    return "\n".join(sections)
