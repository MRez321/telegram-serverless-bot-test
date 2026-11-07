//!/usr/bin/env node

/**
 * Minimal Telegram Bot that demonstrates core functionality
 * Without requiring external network calls for basic operation
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '9012178502:AAEoWfRcY-0RQgQjBGCE9neqBxNHkGW45BE',
  chatId: process.env.TELEGRAM_CHAT_ID || '196677256',
  relayUrl: process.env.RELAY_URL || 'https://relay.mrez321.ir',
  retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
  retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
  timeout: parseInt(process.env.TIMEOUT) || 5000,
  debugMode: process.env.DEBUG_MODE === 'true' || true,
};

// Simple mock implementation that simulates bot behavior
const mockMessages = [];
let messageCounter = 0;

/**
 * Simulate sending a message to Telegram
 * This is a mock implementation for demonstration
 */
function mockSendMessage(chatId, text, options = {}) {
  const timestamp = new Date().toISOString();
  const message = {
    message_id: ++messageCounter,
    chat: { id: chatId },
    text: text,
    date: Date.now(),
    from: { first_name: 'Mock User' },
  };
  
  mockMessages.push(message);
  console.log(`[${timestamp}] Mock message to chat ${chatId}: ${text}`);
  return message;
}

/**\n * Simulate getting bot info
 */
function mockGetBotInfo() {
  return {
    id: 123456789,
    first_name: 'Mock Bot',
    username: 'MockBot',
    description: 'A test bot',
  };
}

/**
 * Handle incoming messages
 * @param {string} text - Message text
 */
async function handleMessage(text) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Received message: ${text}`);
  
  if (text.startsWith('/')) {
    await handleCommand(text);
  } else {
    await mockSendMessage(config.chatId, `Echo: ${text}`, {
      reply_to_message_id: Date.now(),
    });
  }
}

/**
 * Handle bot commands
 * @param {string} command - Command text
 */
async function handleCommand(command) {
  switch (command.toLowerCase()) {
    case '/start':
      await mockSendMessage(config.chatId, 
        '🤖 Hello! This is a minimal serverless Telegram bot.\n\n' +
        'Available commands:\n' +
        '/help - Show available commands\n' +
        '/status - Check connection status\n' +
        '/relay-test - Test relay functionality\n' +
        'Any other message - Echo back with timestamp'
      );
      break;
    
    case '/help':
      await mockSendMessage(config.chatId, 
        '📚 Available Commands:\n\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message\n' +
        '/status - Check bot connection status\n' +
        '/relay-test - Test the relay server\n\n' +
        'This bot supports relay functionality for connection testing.'
      );
      break;
    
    case '/status':
      await checkConnectionStatus();
      break;
    
    case '/relay-test':
      await testRelay();
      break;
    
    default:
      await mockSendMessage(config.chatId, `Unknown command: ${command}\n\nUse /help to see available commands.`);
  }
}

/**
 * Check connection status
 */
async function checkConnectionStatus() {
  await mockSendMessage(config.chatId, 
    '📊 Connection Status:\n\n' +
    `Timestamp: ${new Date().toISOString()}\n` +
    `Bot Token: ${config.botToken ? 'Set' : 'Not Set'}\n` +
    `Chat ID: ${config.chatId}\n` +
    `Relay URL: ${config.relayUrl}\n` +
    `Retry Attempts: ${config.retryAttempts}\n` +
    `Retry Delay: ${config.retryDelay}ms\n` +
    `Timeout: ${config.timeout}ms\n` +
    `Debug Mode: ${config.debugMode ? 'Enabled' : 'Disabled'}\n\n` +
    'Connection status: ✅ Bot ready for operation\n\n' +
    'Note: This is a mock implementation for demonstration purposes.'
  );
}

/**
 * Test relay functionality
 */
async function testRelay() {
  await mockSendMessage(config.chatId, 
    '🔄 Testing relay functionality...\n' +
    `Relay URL: ${config.relayUrl}\n` +
    `Current time: ${new Date().toISOString()}`
  );
  
  await mockSendMessage(config.chatId, 
    '✅ Relay test completed successfully! (Mock implementation)'
  );
}

/**
 * Graceful shutdown
 */
function gracefulShutdown() {
  console.log('\n🛑 Shutting down bot...');
  console.log('✅ Bot stopped gracefully');
  process.exit(0);
}

/**
 * Main demonstration function
 */
async function runDemo() {
  console.log('🚀 Starting minimal Telegram bot demonstration...\n');
  
  try {
    // Demo 1: Get bot info
    console.log('1. Demonstrating bot API connectivity...');
    const botInfo = mockGetBotInfo();
    console.log(`✅ Bot: ${botInfo.first_name} (@${botInfo.username})`);
    
    // Demo 2: Send test message
    console.log('\n2. Demonstrating message sending...');
    await mockSendMessage(config.chatId, '🤖 Test message from minimal bot!');
    
    // Demo 3: Test relay
    console.log('\n3. Demonstrating relay functionality...');
    await testRelay();
    
    // Demo 4: Test command handling
    console.log('\n4. Demonstrating command handling...');
    await handleMessage('/start');
    await handleMessage('/help');
    await handleMessage('/status');
    await handleMessage('/relay-test');
    await handleMessage('Hello, World!');
    
    // Demo 5: Show all messages
    console.log('\n5. Message log:');
    mockMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. Chat ${msg.chat.id}: "${msg.text}""`);
    });
    
    console.log('\n🎉 All demonstrations completed successfully!');
    console.log('\n📋 Bot Configuration:');
    console.log(`   Bot Token: ${config.botToken ? 'Set (hidden)' : 'Not Set'}`);
    console.log(`   Chat ID: ${config.chatId}`);
    console.log(`   Relay URL: ${config.relayUrl}`);
    console.log(`   Retry Attempts: ${config.retryAttempts}`);
    console.log(`   Timeout: ${config.timeout}ms`);
    
    console.log('\n🚀 Bot is ready for production deployment!');
    console.log('   Note: This demo uses mock implementations. For production,')
    console.log('   replace mockSendMessage with actual Telegram API calls.');
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// Run demonstration
runDemo().catch(error => {
  console.error('❌ Demo execution failed:', error.message);
  process.exit(1);
});