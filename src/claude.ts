import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface TaskExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export class ClaudeService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }

  /**
   * Execute a task using the Claude Code CLI
   * This spawns a child process that runs the claude-code CLI
   */
  async executeTaskViaCLI(task: string, workingDir: string): Promise<TaskExecutionResult> {
    return new Promise((resolve) => {
      const outputLines: string[] = [];
      const errorLines: string[] = [];

      // Create a temporary file with the task
      const taskFile = path.join(workingDir, '.claude_task.txt');
      fs.writeFileSync(taskFile, task);

      // Spawn claude-code CLI process
      // Note: This assumes claude-code is installed globally or in PATH
      const claude = spawn('claude-code', ['--message', task], {
        cwd: workingDir,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: config.anthropic.apiKey,
        },
      });

      claude.stdout.on('data', (data) => {
        const output = data.toString();
        outputLines.push(output);
        console.log('Claude output:', output);
      });

      claude.stderr.on('data', (data) => {
        const error = data.toString();
        errorLines.push(error);
        console.error('Claude error:', error);
      });

      claude.on('close', (code) => {
        // Clean up temp file
        if (fs.existsSync(taskFile)) {
          fs.unlinkSync(taskFile);
        }

        const result: TaskExecutionResult = {
          success: code === 0,
          output: outputLines.join('\n'),
          error: errorLines.length > 0 ? errorLines.join('\n') : undefined,
        };

        resolve(result);
      });

      // Set a timeout to prevent hanging
      setTimeout(() => {
        claude.kill();
        resolve({
          success: false,
          output: outputLines.join('\n'),
          error: 'Task execution timed out after 5 minutes',
        });
      }, 5 * 60 * 1000); // 5 minutes timeout
    });
  }

  /**
   * Execute a task using the Anthropic SDK directly
   * This uses the Messages API with extended thinking capabilities
   */
  async executeTaskViaSDK(task: string): Promise<TaskExecutionResult> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8096,
        thinking: {
          type: 'enabled',
          budget_tokens: 5000,
        },
        messages: [
          {
            role: 'user',
            content: task,
          },
        ],
      });

      let output = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          output += block.text + '\n';
        }
      }

      return {
        success: true,
        output: output.trim(),
      };
    } catch (error) {
      console.error('Error executing task via SDK:', error);
      return {
        success: false,
        output: '',
        error: `Failed to execute task: ${error}`,
      };
    }
  }

  /**
   * Execute a task - tries CLI first, falls back to SDK
   */
  async executeTask(task: string, workingDir?: string): Promise<TaskExecutionResult> {
    // Try CLI approach if working directory is provided
    if (workingDir) {
      try {
        return await this.executeTaskViaCLI(task, workingDir);
      } catch (error) {
        console.warn('CLI execution failed, falling back to SDK:', error);
      }
    }

    // Fall back to SDK approach
    return await this.executeTaskViaSDK(task);
  }

  /**
   * Analyze a task and provide a summary without executing
   */
  async analyzeTask(task: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Analyze this task and provide a brief summary of what it entails and how you would approach it:\n\n${task}`,
          },
        ],
      });

      let analysis = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          analysis += block.text;
        }
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing task:', error);
      return 'Unable to analyze task';
    }
  }
}
