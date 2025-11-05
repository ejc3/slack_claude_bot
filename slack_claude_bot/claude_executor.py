"""Helpers for executing tasks with the Claude Code SDK or CLI."""

from __future__ import annotations

import json
import logging
import os
import shlex
import subprocess
from typing import Any

logger = logging.getLogger(__name__)


class ClaudeExecutionError(RuntimeError):
    """Raised when a Claude Code invocation fails."""


def execute_task(task_description: str) -> str:
    """Execute a task with Claude Code and return the textual result.

    The function prefers the Claude Code SDK when available. If the SDK cannot
    be imported or does not expose an execution method, the CLI is used as a
    fallback. The behaviour can be influenced with the following environment
    variables:

    ``CLAUDE_CODE_PREFER_SDK``
        When set to ``0``/``false``/``no`` (case-insensitive), the CLI is used
        directly without attempting to import the SDK.
    ``CLAUDE_CODE_API_KEY``
        Optional API key passed to the SDK constructor, when supported.
    ``CLAUDE_CODE_CLI``
        Overrides the CLI executable. Defaults to ``claude_code``.
    ``CLAUDE_CODE_CLI_ARGS``
        Extra arguments appended before the task description when calling the
        CLI.
    """

    task_description = task_description.strip()
    if not task_description:
        raise ValueError("Task description must not be empty.")

    prefer_sdk = os.environ.get("CLAUDE_CODE_PREFER_SDK", "1").lower() not in {
        "0",
        "false",
        "no",
    }

    if prefer_sdk:
        try:
            return _execute_with_sdk(task_description)
        except ImportError:
            logger.info("Claude Code SDK not available, falling back to CLI.")
        except Exception as exc:  # pragma: no cover - defensive path
            logger.exception("Claude Code SDK execution failed: %s", exc)
            raise ClaudeExecutionError(str(exc)) from exc

    try:
        return _execute_with_cli(task_description)
    except subprocess.CalledProcessError as exc:
        logger.exception("Claude Code CLI execution failed: %s", exc)
        raise ClaudeExecutionError(exc.stderr or str(exc)) from exc


def _execute_with_sdk(task_description: str) -> str:
    import claude_code  # type: ignore[import-not-found]

    api_key = os.environ.get("CLAUDE_CODE_API_KEY")

    client_cls = getattr(claude_code, "ClaudeCode", None) or getattr(
        claude_code, "Client", None
    )
    if client_cls is None:
        raise RuntimeError("claude_code SDK does not expose a recognised client class")

    try:
        client = client_cls(api_key=api_key) if api_key else client_cls()
    except TypeError:
        # Some constructors may use different parameter names.
        if api_key:
            client = client_cls(api_key)
        else:
            client = client_cls()

    for method_name in ("execute", "run", "run_task", "__call__"):
        method = getattr(client, method_name, None)
        if callable(method):
            result = method(task_description)
            return _normalise_result(result)

    raise RuntimeError(
        "claude_code client does not expose an execute/run method. "
        "Supported method names: execute, run, run_task, __call__."
    )


def _execute_with_cli(task_description: str) -> str:
    cli_executable = os.environ.get("CLAUDE_CODE_CLI", "claude_code")
    cli_args = os.environ.get("CLAUDE_CODE_CLI_ARGS", "exec --task")

    command = shlex.split(cli_executable) + shlex.split(cli_args) + [task_description]
    logger.debug("Invoking Claude Code CLI: %s", command)

    completed = subprocess.run(
        command,
        check=True,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip() or completed.stderr.strip()


def _normalise_result(result: Any) -> str:
    if result is None:
        return ""

    if isinstance(result, str):
        return result.strip()

    if isinstance(result, (bytes, bytearray)):
        return result.decode().strip()

    if isinstance(result, dict):
        return json.dumps(result, indent=2, sort_keys=True)

    if hasattr(result, "model_dump"):
        return json.dumps(result.model_dump(), indent=2, sort_keys=True)

    return str(result).strip()
