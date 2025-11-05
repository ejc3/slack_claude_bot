import dotenv from 'dotenv';

dotenv.config();

export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
  },
  port: parseInt(process.env.PORT || '3000', 10),
};

export function validateConfig(): void {
  const required = {
    'SLACK_BOT_TOKEN': config.slack.botToken,
    'SLACK_SIGNING_SECRET': config.slack.signingSecret,
    'SLACK_APP_TOKEN': config.slack.appToken,
    'ANTHROPIC_API_KEY': config.anthropic.apiKey,
    'GITHUB_TOKEN': config.github.token,
    'GITHUB_OWNER': config.github.owner,
    'GITHUB_REPO': config.github.repo,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the values.'
    );
  }
}
