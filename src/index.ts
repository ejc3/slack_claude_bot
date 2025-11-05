import { SlackBot } from './bot';
import { validateConfig } from './config';

async function main() {
  console.log('🚀 Starting Slack Claude Bot...');

  try {
    // Validate configuration
    validateConfig();
    console.log('✅ Configuration validated');

    // Create and start bot
    const bot = new SlackBot();
    await bot.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down...');
      await bot.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main();
