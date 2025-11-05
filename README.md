# Slack Claude Bot

A Slack bot that uses the Claude Code SDK to execute tasks and automatically creates GitHub issues for tracking.

## Features

- 🤖 **Slack Integration**: Responds to mentions, DMs, and slash commands
- 🧠 **Claude Code Execution**: Uses Claude Code SDK/CLI to execute complex tasks
- 📝 **GitHub Integration**: Automatically creates and updates GitHub issues
- 🔄 **Real-time Updates**: Provides status updates in Slack threads
- ✅ **Task Tracking**: Tracks task completion and updates GitHub issues

## Architecture

```
Slack User → Slack Bot → Claude Code SDK → GitHub Issues
                ↓
            Task Results
```

1. User sends a task request via Slack (mention, DM, or slash command)
2. Bot creates a GitHub issue to track the request
3. Bot executes the task using Claude Code SDK
4. Bot reports results back to Slack and updates the GitHub issue

## Prerequisites

- Node.js 18+ and npm
- A Slack workspace with admin access
- Anthropic API key
- GitHub account with a repository for tracking issues
- Claude Code CLI installed (optional, for CLI execution mode)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/slack-claude-bot.git
cd slack-claude-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Slack App

Follow the detailed instructions in [SLACK_SETUP.md](./SLACK_SETUP.md) to:
- Create a Slack app
- Configure OAuth & Permissions
- Enable Socket Mode
- Install the app to your workspace

### 4. Set up GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "Slack Claude Bot"
4. Select scopes:
   - `repo` (for full repository access)
   - `public_repo` (if only using public repositories)
5. Generate and save the token

### 5. Get Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys
4. Create a new API key
5. Save the key securely

### 6. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token

# Anthropic Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key

# GitHub Configuration
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-github-username-or-org
GITHUB_REPO=your-repo-name

# Optional: Port for the bot server
PORT=3000
```

### 7. Build the project

```bash
npm run build
```

## Usage

### Start the bot

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Using the bot in Slack

#### 1. Mention the bot
```
@ClaudeBot Create a REST API endpoint for user authentication
```

#### 2. Direct message
Just send a DM to the bot:
```
Fix the bug in the authentication module
```

#### 3. Slash command
```
/claude-task Write unit tests for the user service
```

### What happens when you send a task

1. **Acknowledgment**: Bot confirms it received your request
2. **GitHub Issue**: Creates an issue with your request and a link to it
3. **Task Execution**: Executes your task using Claude Code
4. **Results**: Posts results back to Slack in a thread
5. **Issue Update**: Updates the GitHub issue with results and closes it (if successful)

## Development

### Project Structure

```
slack-claude-bot/
├── src/
│   ├── index.ts          # Main entry point
│   ├── bot.ts            # Slack bot logic
│   ├── claude.ts         # Claude Code SDK integration
│   ├── github.ts         # GitHub API integration
│   └── config.ts         # Configuration management
├── dist/                 # Compiled JavaScript
├── .env.example          # Environment variables template
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled bot
- `npm run dev` - Run in development mode with ts-node
- `npm run watch` - Watch for changes and recompile

### Execution Modes

The bot supports two execution modes:

1. **CLI Mode** (default if working directory provided):
   - Spawns `claude-code` CLI process
   - Full tool access (file system, git, etc.)
   - Requires Claude Code CLI installed

2. **SDK Mode** (fallback):
   - Uses Anthropic Messages API directly
   - Limited to text-based responses
   - No file system access

## Troubleshooting

### Bot doesn't respond to messages

1. Check that Socket Mode is enabled in Slack app settings
2. Verify `SLACK_APP_TOKEN` is set correctly
3. Ensure bot is invited to the channel where you're testing
4. Check bot logs for errors

### Claude Code execution fails

1. For CLI mode: Verify `claude-code` is installed and in PATH
2. Check `ANTHROPIC_API_KEY` is valid
3. Review task complexity - very complex tasks may timeout
4. Check bot logs for detailed error messages

### GitHub issue creation fails

1. Verify `GITHUB_TOKEN` has correct permissions
2. Check `GITHUB_OWNER` and `GITHUB_REPO` are correct
3. Ensure the repository exists and you have access
4. Verify token has `repo` scope

### Environment variables not loading

1. Ensure `.env` file exists in root directory
2. Verify `.env` file format (no spaces around `=`)
3. Restart the bot after changing `.env`

## Security Considerations

- **Never commit `.env` file** - it's in `.gitignore` for a reason
- **Rotate tokens regularly** - especially if they may have been exposed
- **Use minimal GitHub permissions** - only grant `repo` scope to necessary repositories
- **Monitor bot usage** - review GitHub issues to track what tasks are being executed
- **Restrict Slack access** - only allow trusted users to interact with the bot

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/slack-claude-bot/issues
- Slack API Documentation: https://api.slack.com/
- Anthropic Documentation: https://docs.anthropic.com/
- Claude Code Documentation: https://docs.claude.com/

## Acknowledgments

- Built with [@slack/bolt](https://slack.dev/bolt-js/)
- Powered by [Anthropic Claude](https://www.anthropic.com/)
- GitHub integration via [@octokit/rest](https://octokit.github.io/rest.js/)
