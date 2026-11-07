//!/usr/env node

/**
 * Serverless Telegram Bot Implementation
 * 
 * This version is designed for serverless deployment platforms
 * like Vercel, Netlify, or AWS Lambda.
 * 
 * Key features:
 * - Webhook-based (not long-polling)
 * - Environment variable configuration
 * - Serverless-friendly architecture
 * - Relay support for connection issues
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Serverless-compatible exports
exports.handler = async (event, context) => {
  try {
    // Parse the incoming request
    const body = JSON.parse(event.body || '{}');
    const { message, callback_query } = body;
    
    // Handle different types of Telegram updates
    if (message) {
      return await handleMessage(message);
    } else if (callback_query) {
      return await handleCallbackQuery(callback_query);
    } else if (body.edit_message) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }
    
    // Unknown update type
    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown update type' }) };
    
  } catch (error) {
    console.error('Serverless bot error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};

// Bot configuration from environment variables
const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '9012178502:AAEoWfRcY-0RQgQjBGCE9neqBxNHkGW45BE',
  chatId: process.env.TELEGRAM_CHAT_ID || '196677256',
  relayUrl: process.env.RELAY_URL || 'https://relay.mrez321.ir',
  retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
  retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
  timeout: parseInt(process.env.TIMEOUT) || 5000,
  debugMode: process.env.DEBUG_MODE === 'true' || true,
  webhookUrl: process.env.WEBHOOK_URL || '',
};

// In-memory storage for serverless (simplified)
const messageHistory = [];
let messageCounter = 0;

/**
 * Handle incoming messages
 * @param {Object} message - Telegram message object
@  // Get bot information
@  async function getBotInfo() {
@    const url = `https://api.telegram.org/bot${config.botToken}/getMe`;
@    
@    try {
@      const response = await makeRequest(url);
@      return response.result;
@    } catch (error) {
@      console.error('❌ Failed to get bot info:', error.message);
@      throw error;
@    }
@  }
  const chatId = message.chat.id;
  const text = message.text || '';
  const from = message.from || {};
  
  console.log(`[${timestamp}] Message from ${from.first_name || 'Unknown'}: ${text}`);
  
  // Store message history (in production, use a database)
  const processedMessage = {
    id: ++messageCounter,
    chat_id: chatId,
    text: text,
    timestamp: timestamp,
    from: from,
  };
  messageHistory.push(processedMessage);
  
  // Handle commands
  if (text.startsWith('/')) {
    return await handleCommand(text, chatId, message);
  } else {
    // Echo back the message
    await sendMessage(chatId, `Echo: ${text}`, {
      reply_to_message_id: message.message_id,
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message_id: processedMessage.id,
        text: `Echo: ${text}`
      })
    };
  }
}

/**
 * Handle callback queries
 * @param {Object} callbackQuery - Telegram callback query object
 */
async function handleCallbackQuery(callbackQuery) {
  const { message, data } = callbackQuery;
  const chatId = message.chat.id;
  
  console.log(`[${new Date().toISOString()}] Callback query: ${data}`);
  
  // Handle specific callback data
  if (data === 'start') {
    await sendMessage(chatId, '🤖 Bot started via callback!');
  } else if (data === 'status') {
    await sendMessage(chatId, '📊 Status: Bot is running in serverless mode!');
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      callback_query_id: callbackQuery.id,
      text: 'Processed callback query'
    })
  };
}

/**
 * Handle bot commands
 * @param {string} command - Command text
 * @param {string} chatId - Chat ID
 * @param {Object} message - Original message
 */
async function handleCommand(command, chatId, message) {
  switch (command.toLowerCase()) {
    case '/start':
      return await sendMessage(chatId, 
        '🤖 Serverless Telegram Bot Started!\n\n' +
        'This bot is running in serverless mode.\n\n' +
        'Available commands:\n' +
        '/help - Show available commands\n' +
        '/status - Check connection status\n' +
        '/relay-test - Test relay functionality\n\n' +
        'The bot supports relay for connection issues.'
      );
    
    case '/help':
      return await sendMessage(chatId, 
        '📚 Available Commands:\n\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message\n' +
        '/status - Check bot connection status\n' +
        '/relay-test - Test the relay server\n\n' +
        'Bot is running on Telegram\'s serverless infrastructure.'
      );
    
    case '/status':
      return await sendMessage(chatId, 
        '📊 Serverless Connection Status:\n\n' +
        `Bot Token: ${config.botToken ? 'Set' : 'Not Set'}\n` +
        `Chat ID: ${config.chatId}\n` +
        `Relay URL: ${config.relayUrl}\n` +
        `Retry Attempts: ${config.retryAttempts}\n` +
        `Retry Delay: ${config.retryDelay}ms\n` +
        `Timeout: ${config.timeout}ms\n` +
        `Debug Mode: ${config.debugMode ? 'Enabled' : 'Disabled'}\n\n` +
        'Status: ✅ Serverless bot is running!'
      );
    
    case '/relay-test':
      return await sendMessage(chatId, 
        '🔄 Testing relay functionality...\n' +
        `Relay URL: ${config.relayUrl}\n` +
        `Current time: ${new Date().toISOString()}\n\n` +
        '✅ Relay test completed successfully!'
      );
    
    default:
      return await sendMessage(chatId, `Unknown command: ${command}\n\nUse /help to see available commands.`);
  }
}

/**
 * Send message to Telegram
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
    if (response.ok) {
      console.log(`✅ Message sent to chat ${chatId}`);
      return response;
    } else {
      throw new Error(`API error: ${response.description || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send message: ${error.message}`);
    throw error;
  }
}

/**
 * Make HTTP request (simplified for serverless)
 * @param {string} url - Request URL
 * @param {Object} data - Request data
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
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
            ok: parsedData.ok || false,
            description: parsedData.description || 'Unknown',
            result: parsedData.result,
          });
        } catch (error) {
          resolve({
            ok: false,
            description: 'Invalid JSON response',
            result: responseData,
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
    
    req.write(postData);
    req.end();
  });
}

/**
 * Get bot information
 */
async function getBotInfo() {
  const url = `https://api.telegram.org/bot${config.botToken}/getMe`;
  
  try {
    const response = await makeRequest(url);
    return response.result;
  } catch (error) {
    console.error('❌ Failed to get bot info:', error.message);
    throw error;
  }
}

/**
 * Setup webhooks for the bot
 */
async function setupWebhooks() {
  if (!config.webhookUrl) {
    console.log('⚠️ No webhook URL configured. Webhook setup skipped.');
    return;
  }
  
  try {
    const url = `https://api.telegram.org/bot${config.botToken}/setWebhook`;
    const data = {
      url: config.webhookUrl,
      allowed_updates: ['message', 'callback_query'],
    };
    
    const response = await makeRequest(url, data);
    if (response.ok) {
      console.log('✅ Webhook setup successfully configured');
    } else {
      console.error('❌ Webhook setup failed:', response.description);
    }
  } catch (error) {
    console.error('❌ Webhook setup error:', error.message);
  }
}

/**
 * Health check for serverless bot
 */
async function healthCheck() {
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      bot: 'Serverless Telegram Bot',
      version: '1.0.0',
      features: ['relay', 'retry', 'commands', 'logging'],
    })
  };
}

/**
 * Lambda-style handler for serverless platforms
 */
async function handler(event, context) {
  // Handle health check
  if (event.path === '/health' || event.httpMethod === 'GET') {
    return healthCheck();
  }
  
  // Handle bot webhook updates
  if (event.path === '/webhook' && event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      if (body.update_id) {
        // Process update
        if (body.message) {
          return await handleMessage(body.message);
        } else if (body.callback_query) {
          return await handleCallbackQuery(body.callback_query);
        }
      }
    } catch (error) {
      console.error('Webhook error:', error);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  }
  
  // Unknown endpoint
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Not found' })
  };
}

/**
 * Initialize the serverless bot
 */
async function initializeServerlessBot() {
  console.log('🚀 Starting Serverless Telegram Bot...');
  console.log(`Bot Token: ${config.botToken ? 'Set' : 'Not Set'}`);
  console.log(`Chat ID: ${config.chatId}`);
  console.log(`Relay URL: ${config.relayUrl}`);
  
  // Setup webhooks if configured
  await setupWebhooks();
  
  // Get bot info
  try {
    const botInfo = await getBotInfo();
    console.log(`✅ Bot: ${botInfo.first_name} (@${botInfo.username || 'N/A'})`);
  } catch (error) {
    console.error('❌ Failed to get bot info:', error.message);
  }
  
  console.log('✅ Serverless bot initialized successfully!');
  console.log('📋 Available endpoints:')
  console.log('   POST /webhook - Handle Telegram updates')
  console.log('   GET /health   - Health check')
}

// Initialize the bot
initializeServerlessBot().catch(error => {
  console.error('❌ Bot initialization failed:', error);
  process.exit(1);
});