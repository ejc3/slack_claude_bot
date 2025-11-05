"""Entry point for the Slack Claude Code bot."""

from __future__ import annotations

import logging
import os

from slack_bolt.adapter.socket_mode import SocketModeHandler

from slack_claude_bot.slack_handlers import build_app


def main() -> None:
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))

    app = build_app()

    app_token = os.environ.get("SLACK_APP_TOKEN")
    if app_token:
        handler = SocketModeHandler(app, app_token)
        handler.start()
    else:
        port = int(os.environ.get("PORT", 3000))
        app.start(port=port)


if __name__ == "__main__":
    main()
