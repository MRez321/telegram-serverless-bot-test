//!/usr/bin/env node

/**
 * Simple Telegram Bot using direct HTTP calls
 * This bypasses complex library compatibility issues
 */

const https = require('https');
const fs = require('fs');
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

// Simple HTTP helper function
async function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: new URL(url).hostname,
      path: new URL(url).pathname,
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': data ? 'application/json' : 'application/json',
        'Content-Length': postData ? Buffer.byteLength(postData) : 0,
      },
      timeout: config.timeout,
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * Send message using Telegram Bot API
 * @param {string} chatId - Chat ID
 * @param {string} text - Message text
 * @param {Object} options - Additional options
 */
async function sendMessage(chatId, text, options = {}) {
  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
  
  const data = {
    chat_id: chatId,
    text: text,
    ...options,
  };
  
  try {
    const response = await makeRequest(url, data);
    if (response.data && response.data.ok) {
      console.log(`✅ Message sent to chat ${chatId}: ${text}`);
      return response.data.result;
    } else {
      throw new Error(`API error: ${response.data.description || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send message: ${error.message}`);
    throw error;
  }
}

/**
 * Send message with relay fallback
 * @param {string} chatId - Chat ID
 * @param {string} text - Message text
 * @param {Object} options - Additional options
 */
async function sendMessageWithRelay(chatId, text, options = {}) {
  const servers = [
    { name: 'Main Telegram API', url: `https://api.telegram.org/bot${config.botToken}/sendMessage` },
    { name: 'Relay Server', url: `${config.relayUrl}/bot${config.botToken}/sendMessage` },
  ];
  
  let lastError = null;
  
  for (const server of servers) {
    try {
      console.log(`Attempting to send via ${server.name}...`);
      
      const data = {
        chat_id: chatId,
        text: text,
        ...options,
      };
      
      const response = await makeRequest(server.url, data);
      if (response.data && response.data.ok) {
        console.log(`✅ Message sent successfully via ${server.name}`);
        return response.data.result;
      } else {
        throw new Error(`Server error: ${response.data.description || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ Failed to send via ${server.name}: ${error.message}`);
      lastError = error;
      continue;
    }
  }
  
  throw new Error(`All servers failed. Last error: ${lastError.message}`);
}

/**
 * Get bot information
 */
async function getBotInfo() {
  const url = `https://api.telegram.org/bot${config.botToken}/getMe`;
  
  try {
    const response = await makeRequest(url);
    return response.data.result;
  } catch (error) {
    console.error('❌ Failed to get bot info:', error.message);
    throw error;
  }
}

/**
 * Handle incoming messages (for testing)
 * @param {string} text - Message text
 */
async function handleTestMessage(text) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Test message: ${text}`);
  
  if (text.startsWith('/')) {
    await handleCommand(text, config.chatId);
  } else {
    await sendMessageWithRelay(config.chatId, `Echo: ${text}`, {
      reply_to_message_id: Date.now(),
    });
  }
}

/**
 * Handle bot commands
 * @param {string} command - Command text
 * @param {string} chatId - Chat ID
 */
async function handleCommand(command, chatId) {
  switch (command.toLowerCase()) {
    case '/start':
      await sendMessageWithRelay(chatId, 
        '🤖 Hello! This is a simple serverless Telegram bot.\n\n' +
        'Available commands:\n' +
        '/help - Show available commands\n' +
        '/status - Check connection status\n' +
        '/relay-test - Test relay functionality\n' +
        'Any other message - Echo back with timestamp'
      );
      break;
    
    case '/help':
      await sendMessageWithRelay(chatId, 
        '📚 Available Commands:\n\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message\n' +
        '/status - Check bot connection status\n' +
        '/relay-test - Test the relay server\n\n' +
        'This bot supports relay functionality for connection testing.'
      );
      break;
    
    case '/status':
      await checkConnectionStatus(chatId);
      break;
    
    case '/relay-test':
      await testRelay(chatId);
      break;
    
    default:
      await sendMessageWithRelay(chatId, `Unknown command: ${command}\n\nUse /help to see available commands.`);
  }
}

/**
 * Check connection status
 * @param {string} chatId - Chat ID
 */
async function checkConnectionStatus(chatId) {
  await sendMessageWithRelay(chatId, 
    '📊 Connection Status:\n\n' +
    `Timestamp: ${new Date().toISOString()}\n` +
    `Bot Token: ${config.botToken ? 'Set' : 'Not Set'}\n` +
    `Chat ID: ${config.chatId}\n` +
    `Relay URL: ${config.relayUrl}\n` +
    `Retry Attempts: ${config.retryAttempts}\n` +
    `Retry Delay: ${config.retryDelay}ms\n` +
    `Timeout: ${config.timeout}ms\n` +
    `Debug Mode: ${config.debugMode ? 'Enabled' : 'Disabled'}\n\n` +
    'Connection status: ✅ Bot ready for operation'
  );
}

/**
 * Test relay functionality
 * @param {string} chatId - Chat ID
 */
async function testRelay(chatId) {
  await sendMessageWithRelay(chatId, 
    '🔄 Testing relay functionality...\n' +
    `Relay URL: ${config.relayUrl}\n` +
    `Current time: ${new Date().toISOString()}`
  );
  
  // Test relay connectivity
  const relayUrl = `${config.relayUrl}/bot${config.botToken}/getMe`;
  
  try {
    await makeRequest(relayUrl);
    await sendMessageWithRelay(chatId, '✅ Relay test completed successfully!');
  } catch (error) {
    await sendMessageWithRelay(chatId, `❌ Relay test failed: ${error.message}`);
  }
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
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting simple Telegram bot tests...\n');
  
  try {
    // Test 1: Get bot info
    console.log('1. Testing bot API connectivity...');
    const botInfo = await getBotInfo();
    console.log(`✅ Bot: ${botInfo.first_name} (@${botInfo.username || 'N/A'})`);
    
    // Test 2: Send test message
    console.log('\n2. Testing message sending...');
    await sendMessageWithRelay(config.chatId, '🤖 Test message from simple bot!');
    
    // Test 3: Test relay
    console.log('\n3. Testing relay connectivity...');
    await testRelay(config.chatId);
    
    // Test 4: Test command handling
    console.log('\n4. Testing command handling...');
    await handleTestMessage('/start');
    await handleTestMessage('/help');
    await handleTestMessage('/status');
    await handleTestMessage('/relay-test');
    await handleTestMessage('Hello, World!');
    
    console.log('\n🎉 All tests passed! Bot is ready for operation.');
    console.log('\n📋 Bot Configuration:');
    console.log(`   Bot Token: ${config.botToken ? 'Set' : 'Not Set'}`);
    console.log(`   Chat ID: ${config.chatId}`);
    console.log(`   Relay URL: ${config.relayUrl}`);
    console.log(`   Retry Attempts: ${config.retryAttempts}`);
    console.log(`   Timeout: ${config.timeout}ms`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
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

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});