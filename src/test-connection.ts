// ABOUTME: Test script to validate Mattermost connection and configuration
// ABOUTME: Run before integrating with Claude Code to verify setup works

import { loadConfig } from './config.js';
import { MattermostClient } from './mattermost.js';

async function testConnection() {
  console.log('🧪 Testing Mattermost MCP Server Connection\n');

  try {
    // Step 1: Load and validate configuration
    console.log('1. Loading configuration...');
    const config = loadConfig();
    console.log(`   ✓ MATTERMOST_URL: ${config.url}`);
    console.log(`   ✓ MATTERMOST_BOT_TOKEN: ${config.token.substring(0, 10)}...`);
    console.log(`   ✓ MATTERMOST_CHANNEL_ID: ${config.channelId}`);
    console.log();

    // Step 2: Initialize Mattermost client
    console.log('2. Initializing Mattermost client...');
    const client = new MattermostClient(config);
    await client.initialize();
    console.log('   ✓ Client initialized successfully');
    console.log();

    // Step 3: Test retrieving recent messages
    console.log('3. Testing connection (fetching 1 recent message)...');
    const messages = await client.getRecentMessages(1);
    console.log(`   ✓ Successfully retrieved ${messages.length} message(s)`);
    if (messages.length > 0) {
      console.log(`   - Latest message from: ${messages[0].username}`);
      console.log(`   - Posted at: ${messages[0].timestamp}`);
    }
    console.log();

    // Step 4: Test posting a message
    console.log('4. Testing post capability (posting test message)...');
    const testIdentity = 'test-connection-bot';
    const testMessage = await client.postMessage(
      '🧪 Test connection successful - MCP server is working!',
      testIdentity
    );
    console.log(`   ✓ Posted message as: ${testMessage.username}`);
    console.log(`   - Message ID: ${testMessage.message_id}`);
    console.log();

    // Success summary
    console.log('✅ All tests passed! MCP server is ready to use.\n');
    console.log('Next steps:');
    console.log('1. Add this server to your Claude Code MCP configuration');
    console.log('2. Restart Claude Code');
    console.log('3. Verify the tools appear in Claude\'s tool list\n');

  } catch (error) {
    console.error('\n❌ Connection test failed!\n');
    if (error instanceof Error) {
      console.error('Error:', error.message);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('Unknown error:', error);
    }
    console.error('\nTroubleshooting:');
    console.error('- Verify environment variables are set correctly');
    console.error('- Check MATTERMOST_URL is accessible');
    console.error('- Verify MATTERMOST_BOT_TOKEN is valid and not expired');
    console.error('- Ensure bot account is member of the channel');
    console.error('- Check MATTERMOST_CHANNEL_ID is correct\n');
    process.exit(1);
  }
}

testConnection();
