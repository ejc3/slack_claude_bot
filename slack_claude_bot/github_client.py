"""Minimal GitHub issue helper."""

from __future__ import annotations

import logging
import os
import textwrap

import requests

logger = logging.getLogger(__name__)

GITHUB_API_URL = "https://api.github.com"


class GitHubIssueError(RuntimeError):
    """Raised when the GitHub issue creation fails."""


def create_issue(title: str, body: str) -> str:
    """Create a GitHub issue and return the issue URL."""

    token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPO")

    if not token:
        raise GitHubIssueError("GITHUB_TOKEN environment variable is not set.")

    if not repo:
        raise GitHubIssueError("GITHUB_REPO environment variable is not set.")

    title = _sanitise_title(title)
    payload = {"title": title, "body": body.strip() or title}

    response = requests.post(
        f"{GITHUB_API_URL}/repos/{repo}/issues",
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout=30,
    )

    if response.status_code >= 300:
        logger.error("GitHub issue creation failed: %s", response.text)
        raise GitHubIssueError(
            f"GitHub API responded with status {response.status_code}: {response.text}"
        )

    data = response.json()
    html_url = data.get("html_url")
    if not html_url:
        raise GitHubIssueError("GitHub API response missing 'html_url'.")

    return html_url


def _sanitise_title(title: str) -> str:
    if not title:
        return "Slack request"

    title = " ".join(title.split())  # normalise whitespace
    title = textwrap.shorten(title, width=256, placeholder="…")
    return title
