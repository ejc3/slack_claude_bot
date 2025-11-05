# Slack App Setup Guide

This guide will walk you through creating and configuring a Slack app for the Claude Bot.

## Step 1: Create a Slack App

1. Go to https://api.slack.com/apps
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter:
   - **App Name**: "Claude Bot" (or your preferred name)
   - **Workspace**: Select your workspace
5. Click **"Create App"**

## Step 2: Configure OAuth & Permissions

1. In the left sidebar, click **"OAuth & Permissions"**
2. Scroll down to **"Scopes"**
3. Under **"Bot Token Scopes"**, add the following scopes:

   ```
   app_mentions:read     - View messages that mention @your_bot
   chat:write            - Send messages as the bot
   chat:write.public     - Send messages to channels without joining
   channels:history      - View messages in public channels
   channels:read         - View basic channel information
   groups:history        - View messages in private channels
   groups:read           - View basic private channel information
   im:history            - View messages in DMs
   im:read               - View basic DM information
   im:write              - Start DMs with people
   mpim:history          - View messages in group DMs
   mpim:read             - View basic group DM information
   commands              - Add slash commands
   ```

4. Scroll up to **"OAuth Tokens for Your Workspace"**
5. Click **"Install to Workspace"**
6. Authorize the app
7. Copy the **"Bot User OAuth Token"** (starts with `xoxb-`)
   - Save this as `SLACK_BOT_TOKEN` in your `.env` file

## Step 3: Enable Socket Mode

1. In the left sidebar, click **"Socket Mode"**
2. Toggle **"Enable Socket Mode"** to **ON**
3. You'll be prompted to create an app-level token:
   - **Token Name**: "socket_token" (or your preferred name)
   - **Scopes**: Select `connections:write`
4. Click **"Generate"**
5. Copy the token (starts with `xapp-`)
   - Save this as `SLACK_APP_TOKEN` in your `.env` file
6. Click **"Done"**

## Step 4: Enable Event Subscriptions

1. In the left sidebar, click **"Event Subscriptions"**
2. Toggle **"Enable Events"** to **ON**
3. Under **"Subscribe to bot events"**, add:
   ```
   app_mention           - When bot is mentioned
   message.channels      - Messages in public channels (if bot is in channel)
   message.groups        - Messages in private channels (if bot is in channel)
   message.im            - Direct messages to the bot
   message.mpim          - Messages in group DMs
   ```
4. Click **"Save Changes"**

## Step 5: Create Slash Command (Optional)

1. In the left sidebar, click **"Slash Commands"**
2. Click **"Create New Command"**
3. Enter:
   - **Command**: `/claude-task`
   - **Short Description**: "Execute a task with Claude Code"
   - **Usage Hint**: "[task description]"
4. Click **"Save"**

## Step 6: App Home

1. In the left sidebar, click **"App Home"**
2. Under **"Show Tabs"**:
   - Enable **"Messages Tab"**
   - Check **"Allow users to send Slash commands and messages from the messages tab"**

## Step 7: Get Your Signing Secret

1. In the left sidebar, click **"Basic Information"**
2. Scroll down to **"App Credentials"**
3. Copy the **"Signing Secret"**
   - Save this as `SLACK_SIGNING_SECRET` in your `.env` file

## Step 8: Install the App to Your Workspace (if not done already)

1. In the left sidebar, click **"Install App"**
2. Click **"Install to Workspace"** (or "Reinstall to Workspace" if updating)
3. Authorize the app

## Step 9: Verify Your Configuration

Your `.env` file should now have these values:

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...
```

## Step 10: Test the Bot

1. Start your bot:
   ```bash
   npm run dev
   ```

2. In Slack, try one of the following:
   - Send a DM to your bot: "Hello"
   - Mention the bot in a channel: "@ClaudeBot test"
   - Use the slash command: `/claude-task test`

3. You should receive a response from the bot!

## Troubleshooting

### Bot doesn't appear in Slack

- Make sure you installed the app to your workspace
- Check that you're looking in the right workspace
- Try refreshing your Slack app

### Bot doesn't respond to messages

- Verify all three tokens are correct in `.env`
- Check that Socket Mode is enabled
- Ensure the bot is running (check console for "⚡️ Slack bot is running!")
- Check bot logs for error messages

### "Not in channel" errors

- The bot needs to be invited to channels to see messages
- In a channel, type: `/invite @ClaudeBot`
- Or mention the bot first, then invite it

### Permission errors

- Review the scopes in Step 2
- Reinstall the app after adding new scopes
- Generate a new Bot User OAuth Token if needed

## Next Steps

Once your Slack app is configured:

1. Set up your GitHub token (see main README.md)
2. Set up your Anthropic API key (see main README.md)
3. Complete your `.env` file with all required values
4. Start building with your Claude Bot!

## Advanced Configuration

### Custom Bot Name and Icon

1. Go to **"Basic Information"** in your app settings
2. Scroll to **"Display Information"**
3. Upload an app icon (512x512 px recommended)
4. Set a custom background color
5. Add a description
6. Click **"Save Changes"**

### Restrict to Specific Channels

Add logic in `src/bot.ts` to check `channelId` and only respond in whitelisted channels.

### Add Interactive Components

For buttons and menus, enable **"Interactivity & Shortcuts"** in your app settings.

## Security Best Practices

- Never share your tokens publicly
- Rotate tokens if they may have been compromised
- Use workspace with limited members for testing
- Review app permissions regularly
- Monitor bot activity through GitHub issues
