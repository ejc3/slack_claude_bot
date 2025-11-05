import { App, LogLevel } from '@slack/bolt';
import { config } from './config';
import { ClaudeService } from './claude';
import { GitHubService } from './github';

export class SlackBot {
  private app: App;
  private claudeService: ClaudeService;
  private githubService: GitHubService;
  private processingTasks: Set<string>;

  constructor() {
    this.app = new App({
      token: config.slack.botToken,
      signingSecret: config.slack.signingSecret,
      appToken: config.slack.appToken,
      socketMode: true,
      logLevel: LogLevel.INFO,
    });

    this.claudeService = new ClaudeService();
    this.githubService = new GitHubService();
    this.processingTasks = new Set();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Handle app mentions (@bot)
    this.app.event('app_mention', async ({ event, say }) => {
      await this.handleTaskRequest(event.text, event.user, event.channel, say);
    });

    // Handle direct messages
    this.app.message(async ({ message, say }) => {
      // Only process regular messages, not bot messages
      if (message.subtype === undefined || message.subtype === 'message_changed') {
        const text = (message as any).text;
        const user = (message as any).user;
        const channel = (message as any).channel;

        if (text && user) {
          await this.handleTaskRequest(text, user, channel, say);
        }
      }
    });

    // Handle slash commands (e.g., /claude-task)
    this.app.command('/claude-task', async ({ command, ack, say }) => {
      await ack();
      await this.handleTaskRequest(
        command.text,
        command.user_id,
        command.channel_id,
        say
      );
    });
  }

  private async handleTaskRequest(
    text: string,
    userId: string,
    channelId: string,
    say: any
  ) {
    // Remove bot mention from text if present
    const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim();

    if (!cleanText) {
      await say({
        text: 'Please provide a task for me to work on!',
        thread_ts: undefined,
      });
      return;
    }

    // Check if already processing this task
    const taskKey = `${userId}-${cleanText}`;
    if (this.processingTasks.has(taskKey)) {
      await say({
        text: '⏳ Already processing a similar task for you...',
      });
      return;
    }

    this.processingTasks.add(taskKey);

    try {
      // Send initial acknowledgment
      const ackMessage = await say({
        text: `🤖 Received your request! I'll:\n1. Create a GitHub issue\n2. Execute the task using Claude Code\n3. Report back with results\n\n*Task:* ${cleanText}`,
      });

      // Step 1: Create GitHub issue
      await say({
        text: '📝 Creating GitHub issue...',
        thread_ts: ackMessage.ts,
      });

      let issue;
      try {
        issue = await this.githubService.createIssue({
          title: this.generateIssueTitle(cleanText),
          body: cleanText,
          userId: userId,
          channelId: channelId,
        });

        await say({
          text: `✅ GitHub issue created: <${issue.html_url}|#${issue.number} - ${issue.title}>`,
          thread_ts: ackMessage.ts,
        });
      } catch (error) {
        await say({
          text: `❌ Failed to create GitHub issue: ${error}`,
          thread_ts: ackMessage.ts,
        });
        return;
      }

      // Step 2: Execute task with Claude
      await say({
        text: '🧠 Executing task with Claude Code...',
        thread_ts: ackMessage.ts,
      });

      try {
        const result = await this.claudeService.executeTask(cleanText);

        if (result.success) {
          // Split output into chunks if needed (Slack has message length limits)
          const chunks = this.splitIntoChunks(result.output, 3000);

          await say({
            text: `✅ Task completed successfully!`,
            thread_ts: ackMessage.ts,
          });

          for (const chunk of chunks) {
            await say({
              text: `\`\`\`\n${chunk}\n\`\`\``,
              thread_ts: ackMessage.ts,
            });
          }

          // Update GitHub issue with results
          await this.githubService.addCommentToIssue(
            issue.number,
            `## Task Completed ✅\n\n### Output:\n\n\`\`\`\n${result.output}\n\`\`\``
          );

          await this.githubService.closeIssue(issue.number);
        } else {
          await say({
            text: `❌ Task failed: ${result.error || 'Unknown error'}`,
            thread_ts: ackMessage.ts,
          });

          if (result.output) {
            await say({
              text: `Output:\n\`\`\`\n${result.output}\n\`\`\``,
              thread_ts: ackMessage.ts,
            });
          }

          // Update GitHub issue with error
          await this.githubService.addCommentToIssue(
            issue.number,
            `## Task Failed ❌\n\n### Error:\n${result.error}\n\n### Partial Output:\n\n\`\`\`\n${result.output}\n\`\`\``
          );
        }
      } catch (error) {
        await say({
          text: `❌ Error executing task: ${error}`,
          thread_ts: ackMessage.ts,
        });

        await this.githubService.addCommentToIssue(
          issue.number,
          `## Execution Error ❌\n\n${error}`
        );
      }
    } finally {
      this.processingTasks.delete(taskKey);
    }
  }

  private generateIssueTitle(task: string): string {
    // Extract first sentence or limit to 100 chars
    const firstSentence = task.split(/[.!?]/)[0];
    const title = firstSentence.length > 100
      ? firstSentence.substring(0, 97) + '...'
      : firstSentence;

    return `[Slack Bot] ${title}`;
  }

  private splitIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    const lines = text.split('\n');

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }

        // If single line is too long, split it
        if (line.length > maxLength) {
          for (let i = 0; i < line.length; i += maxLength) {
            chunks.push(line.substring(i, i + maxLength));
          }
        } else {
          currentChunk = line;
        }
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  async start() {
    await this.app.start();
    console.log('⚡️ Slack bot is running!');
  }

  async stop() {
    await this.app.stop();
    console.log('Bot stopped');
  }
}
