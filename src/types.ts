/**
 * Type definitions for the Slack Claude Bot
 */

export interface SlackMessage {
  text: string;
  user: string;
  channel: string;
  ts: string;
}

export interface TaskRequest {
  task: string;
  userId: string;
  channelId: string;
  timestamp: string;
}

export interface TaskResult {
  success: boolean;
  output?: string;
  error?: string;
  githubIssue?: {
    number: number;
    url: string;
  };
}

export interface BotConfig {
  slack: {
    botToken: string;
    signingSecret: string;
    appToken: string;
  };
  anthropic: {
    apiKey: string;
  };
  github: {
    token: string;
    owner: string;
    repo: string;
  };
  port: number;
}

export interface ClaudeExecutionOptions {
  workingDirectory?: string;
  timeout?: number;
  useCliMode?: boolean;
}
