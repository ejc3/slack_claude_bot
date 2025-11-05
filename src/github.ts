import { Octokit } from '@octokit/rest';
import { config } from './config';

export interface CreateIssueParams {
  title: string;
  body: string;
  userId: string;
  channelId: string;
}

export interface GitHubIssue {
  number: number;
  html_url: string;
  title: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: config.github.token,
    });
  }

  async createIssue(params: CreateIssueParams): Promise<GitHubIssue> {
    const { title, body, userId, channelId } = params;

    const issueBody = `
## Request from Slack

**Requested by:** <@${userId}>
**Channel:** ${channelId}
**Timestamp:** ${new Date().toISOString()}

---

${body}

---

*This issue was automatically created by the Slack Claude Bot*
`;

    try {
      const response = await this.octokit.issues.create({
        owner: config.github.owner,
        repo: config.github.repo,
        title: title,
        body: issueBody,
        labels: ['slack-bot', 'automated'],
      });

      return {
        number: response.data.number,
        html_url: response.data.html_url,
        title: response.data.title,
      };
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      throw new Error(`Failed to create GitHub issue: ${error}`);
    }
  }

  async addCommentToIssue(issueNumber: number, comment: string): Promise<void> {
    try {
      await this.octokit.issues.createComment({
        owner: config.github.owner,
        repo: config.github.repo,
        issue_number: issueNumber,
        body: comment,
      });
    } catch (error) {
      console.error('Error adding comment to GitHub issue:', error);
      throw new Error(`Failed to add comment to GitHub issue: ${error}`);
    }
  }

  async closeIssue(issueNumber: number): Promise<void> {
    try {
      await this.octokit.issues.update({
        owner: config.github.owner,
        repo: config.github.repo,
        issue_number: issueNumber,
        state: 'closed',
      });
    } catch (error) {
      console.error('Error closing GitHub issue:', error);
      throw new Error(`Failed to close GitHub issue: ${error}`);
    }
  }
}
