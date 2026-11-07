const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const fetch = global.fetch || require('node-fetch');

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

// Initialize main bot (without webhook for testing)
const bot = new TelegramBot(config.botToken, {
  polling: true,
  timeout: config.timeout,
});

/**
 * Main message handler
 * @param {Object} msg - Telegram message object
 * @param {Object} chatId - Chat ID
 */
async function handleMessage(msg, chatId) {
  const timestamp = new Date().toISOString();
  const text = msg.text || '[non-text message]';
  
  // Log the message
  console.log(`[${timestamp}] Message from ${msg.from?.first_name || 'Unknown'}: ${text}`);
  
  // Process commands
  if (text.startsWith('/')) {
    await handleCommand(text, chatId, msg);
  } else {
    // Echo back for non-command messages
    await sendMessageWithFallback(chatId, `Echo: ${text}`, {
      replyToMessageId: msg.message_id,
    });
  }
}

/**
 * Handle bot commands
 * @param {string} command - Command text
 * @param {string} chatId - Chat ID
 * @param {Object} msg - Original message object
 */
async function handleCommand(command, chatId, msg) {
  switch (command.toLowerCase()) {
    case '/start':
      await sendMessageWithFallback(chatId, 
        '🤖 Hello! This is a serverless Telegram bot for testing connections.\n\n' +
        'Available commands:\n' +
        '/help - Show available commands\n' +
        '/status - Check connection status\n' +
        '/relay-test - Test relay functionality\n' +
        'Any other message - Echo back with timestamp'
      );
      break;
    
    case '/help':
      await sendMessageWithFallback(chatId, 
        '📚 Available Commands:\n\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message\n' +
        '/status - Check bot connection status\n' +
        '/relay-test - Test the relay server\n\n' +
        'The bot supports relay functionality to handle connection issues in regions with poor internet connectivity.'
      );
      break;
    
    case '/status':
      await checkConnectionStatus(chatId);
      break;
    
    case '/relay-test':
      await testRelay(chatId);
      break;
    
    default:
      await sendMessageWithFallback(chatId, `Unknown command: ${command}\n\nUse /help to see available commands.`);
  }
}

/**
 * Send message with fallback to multiple servers
 * @param {string} chatId - Chat ID
 * @param {string} text - Message text
 * @param {Object} options - Additional options
 */
async function sendMessageWithFallback(chatId, text, options = {}) {
  const servers = [
    { name: 'Main Telegram API', url: `https://api.telegram.org/bot${config.botToken}/sendMessage` },
    { name: 'Relay Server', url: `${config.relayUrl}/bot${config.botToken}/sendMessage` },
    { name: 'Fallback Relay', url: 'https://api.telegram.org/bot${config.botToken}/sendMessage' },
  ];
  
  let lastError = null;
  
  for (const server of servers) {
    try {
      console.log(`Attempting to send via ${server.name}...`);
      
      const payload = {
        chat_id: chatId,
        text: text,
        ...options,
      };
      
      const response = await fetchWithRetry(server.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      if (data.ok) {
        console.log(`Message sent successfully via ${server.name}`);
        return data;
      } else {
        throw new Error(`Server returned error: ${data.description || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Failed to send via ${server.name}: ${error.message}`);
      lastError = error;
      continue; // Try next server
    }
  }
  
  // If all servers fail, throw the last error
  throw new Error(`All servers failed. Last error: ${lastError ? lastError.message : 'Unknown error'}`);
}

/**
 * Fetch wrapper with retry and relay support
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise} Response object
 */
async function fetchWithRetry(url, options = {}) {
  return await retryRequest(async () => {
    const response = await fetch(url, {
      ...options,
      timeout: config.timeout,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  });
}

/**
 * Check if a URL is accessible
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} True if accessible
 */
async function checkUrlAccessibility(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error(`Failed to access ${url}: ${error.message}`);
    return false;
  }
}

/**
 * Check connection status
 * @param {string} chatId - Chat ID
 */
async function checkConnectionStatus(chatId) {
  // Test main API accessibility
  const mainApiAccessible = await checkUrlAccessibility('https://api.telegram.org');
  const relayAccessible = await checkUrlAccessibility(config.relayUrl);
  
  const status = {
    timestamp: new Date().toISOString(),
    mainApiAccessible,
    relayAccessible,
    botToken: config.botToken ? 'Set' : 'Not Set',
    chatId: config.chatId ? 'Set' : 'Not Set',
    relayUrl: config.relayUrl,
    retryAttempts: config.retryAttempts,
    retryDelay: config.retryDelay,
    timeout: config.timeout,
    debugMode: config.debugMode,
  };
  
  const statusText = 
    '📊 Connection Status:\n\n' +
    `Timestamp: ${status.timestamp}\n` +
    `Main Telegram API: ${status.mainApiAccessible ? '✅ Accessible' : '❌ Not Accessible'}\n` +
    `Relay Server: ${status.relayAccessible ? '✅ Accessible' : '❌ Not Accessible'}\n` +
    `Bot Token: ${status.botToken}\n` +
    `Chat ID: ${status.chatId}\n` +
    `Relay URL: ${status.relayUrl}\n` +
    `Retry Attempts: ${status.retryAttempts}\n` +
    `Retry Delay: ${status.retryDelay}ms\n` +
    `Timeout: ${status.timeout}ms\n` +
    `Debug Mode: ${status.debugMode ? 'Enabled' : 'Disabled'}\n\n` +
    'Connection status: ' + (status.mainApiAccessible ? '✅ Bot initialized and ready for operation' : '⚠️ Bot initialized but main API not accessible');
  
  await sendMessageWithFallback(chatId, statusText);
}

/**
 * Test relay functionality
 * @param {string} chatId - Chat ID
 */
async function testRelay(chatId) {
  await sendMessageWithFallback(chatId, 
    '🔄 Testing relay functionality...\n' +
    `Relay URL: ${config.relayUrl}\n` +
    `Current time: ${new Date().toISOString()}`
  );
  
  // Test relay connectivity
  const relayTest = await checkUrlAccessibility(config.relayUrl);
  await sendMessageWithFallback(chatId, 
    relayTest 
      ? '✅ Relay test completed successfully!'
      : '❌ Relay test failed - relay server not accessible'
  );
}

/**
 * Handle bot errors
 * @param {Error} error - Error object
 */
function handleError(error) {
  console.error('Bot error:', error);
  
  if (error.code === 'ETIMEDOUT') {
    console.log('Request timed out, attempting to use relay...');
    // Relay fallback is handled in sendMessageWithFallback
  }
}

/**
 * Retrying function for failed requests
 * @param {Function} fn - Function to retry
 * @param {number} attempts - Number of attempts
 * @param {number} delay - Delay between attempts
 * @returns {Promise} Result of the function
 */
async function retryRequest(fn, attempts = config.retryAttempts, delay = config.retryDelay) {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) {
      throw error;
    }
    
    console.log(`Retrying... Attempts remaining: ${attempts - 1}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, attempts - 1, delay);
  }
}

/**
 * Start the bot
 */
async function startBot() {
  console.log('🚀 Starting serverless Telegram bot...');
  console.log(`Bot Token: ${config.botToken ? 'Set (hidden)' : 'Not Set'}`);
  console.log(`Chat ID: ${config.chatId}`);
  console.log(`Relay URL: ${config.relayUrl}`);
  
  // Set up error handling
  bot.on('error', handleError);
  
  // Handle bot start
  bot.onText(/\/start/, async (msg) => {
    await handleMessage(msg, msg.chat.id);
  });
  
  // Handle all other messages
  bot.on('message', async (msg) => {
    if (msg.chat.type === 'private') { // Only respond to private messages
      await handleMessage(msg, msg.chat.id);
    }
  });
  
  console.log('✅ Bot started successfully!');
  console.log('Bot is now listening for messages...');
}

/**
 * Graceful shutdown
 */
function gracefulShutdown() {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  console.log('✅ Bot stopped gracefully');
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// Start the bot
startBot();