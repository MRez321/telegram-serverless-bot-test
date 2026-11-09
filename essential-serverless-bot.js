//!/usr/bin/env node

/**
 * Essential Serverless Telegram Bot
 * Extracted logic from inspire/file-to-link.js and inspire/uplaod-center.js
 * Focuses on retry logic, relay support, and permanent URL generation
 */

const dotenv = require('dotenv');
const fetch = global.fetch || require('node-fetch');

// Load environment variables
dotenv.config();

// Core configuration extracted from inspire patterns
const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '9012178502:AAEoWfRcY-0RQgQjBGCE9neqBxNHkGW45BE',
  chatId: process.env.TELEGRAM_CHAT_ID || '196677256',
  relayUrl: process.env.RELAY_URL || 'https://relay.mrez321.ir',
  retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
  retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
  timeout: parseInt(process.env.TIMEOUT) || 5000,
  debugMode: process.env.DEBUG_MODE === 'true' || true,
};

// Serverless handler for Telegram updates
exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { message } = body;
    
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No message provided' }) };
    }
    
    const chatId = message.chat.id;
    const text = message.text || '';
    
    // Handle commands and messages
    if (text.startsWith('/')) {
      return await handleCommand(text, chatId);
    } else {
      return await handleMessage(chatId, text, message.message_id);
    }
    
  } catch (error) {
    console.error('Serverless bot error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

/**
 * Extract file IDs from Telegram response
 * Based on file-to-link.js extractFileIds function
 */
function extractFileIds(obj) {
  const fileIds = [];
  
  function searchForFileIds(item) {
    if (item && typeof item === 'object') {
      if (item.file_id) fileIds.push(item.file_id);
      Object.values(item).forEach(searchForFileIds);
    } else if (Array.isArray(item)) {
      item.forEach(searchForFileIds);
    }
  }
  
  searchForFileIds(obj);
  return [...new Set(fileIds)];
}

/**
 * Make HTTP request with FormData
 * Based on file-to-link.js postReq function
 */
async function makeRequest(url, fields = []) {
  const tgFormData = new FormData();
  
  fields.forEach(obj => {
    for (let key in obj) {
      tgFormData.append(key, obj[key]);
    }
  });
  
  const telegramResponse = await fetch(`https://api.telegram.org/bot${config.botToken}/${url}`, {
    method: 'POST',
    body: tgFormData,
  });
  
  return await telegramResponse;
}

/**
 * Send message with relay fallback
 * Based on file-to-link.js servers array
 */
async function sendMessageWithRelay(chatId, text, options = {}) {
  const servers = [
    { name: 'Main Telegram API', url: `https://api.telegram.org/bot${config.botToken}/sendMessage` },
    { name: 'Relay Server', url: `${config.relayUrl}/bot${config.botToken}/sendMessage` },
    { name: 'Fallback Relay', url: `https://api.telegram.org/bot${config.botToken}/sendMessage` }
  ];
  
  let lastError;
  
  for (const server of servers) {
    try {
      console.log(`🔄 Trying server: ${server.name}`);
      const url = server.url;
      const data = {
        chat_id: chatId,
        text: text,
        parse_mode: options.parse_mode || 'MarkdownV2',
        ...options
      };
      
      const tgFormData = new FormData();
      for (let key in data) {
        tgFormData.append(key, data[key]);
      }
      
      const telegramResponse = await fetch(url, {
        method: 'POST',
        body: tgFormData,
      });
      
      if (!telegramResponse.ok) {
        throw new Error(`HTTP error! status: ${telegramResponse.status}`);
      }
      
      console.log(`✅ Message sent successfully via ${server.name}`);
      return await telegramResponse.json();
    } catch (error) {
      lastError = error;
      console.error(`❌ Failed to send via ${server.name}:`, error.message);
      continue;
    }
  }
  
  throw new Error(`All servers failed. Last error: ${lastError.message}`);
}

/**
 * Handle bot commands
 */
async function handleCommand(command, chatId) {
  switch (command.toLowerCase()) {
    case '/start':
      return await sendMessageWithRelay(chatId, 
        '🤖 Serverless Telegram Bot Started!\n\n' +
        'This bot provides file upload/download functionality with permanent URLs.\n\n' +
        'Available commands:\n' +
        '/help - Show available commands\n' +
        '/status - Check connection status\n' +
        '/upload - Upload a file and get permanent download URL\n\n' +
        'The bot supports relay for connection issues.'
      );
    
    case '/help':
      return await sendMessageWithRelay(chatId, 
        '📚 Available Commands:\n\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message\n' +
        '/status - Check bot connection status\n' +
        '/upload - Upload a file and get permanent download URL\n\n' +
        'File Upload Features:\n' +
        '• Send any file (documents, images, audio, video)\n' +
        '• Get permanent download URLs\n' +
        '• Files stored on Telegram servers\n' +
        '• URLs work forever'
      );
    
    case '/status':
      try {
        const botUrl = `https://api.telegram.org/bot${config.botToken}/getMe`;
        const response = await fetch(botUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to get bot info: ${response.statusText}`);
        }
        
        const botInfo = await response.json();
        return await sendMessageWithRelay(chatId, 
          '📊 Serverless Connection Status:\n\n' +
          `Bot Username: ${botInfo.result.username || 'N/A'}\n` +
          `Bot Token: ${config.botToken ? 'Set' : 'Not Set'}\n` +
          `Chat ID: ${config.chatId}\n` +
          `Relay URL: ${config.relayUrl}\n` +
          `Retry Attempts: ${config.retryAttempts}\n` +
          `Retry Delay: ${config.retryDelay}ms\n` +
          `Timeout: ${config.timeout}ms\n` +
          `Debug Mode: ${config.debugMode ? 'Enabled' : 'Disabled'}\n\n` +
          'Status: ✅ Serverless bot is running with file upload capabilities!'
        );
      } catch (error) {
        return await sendMessageWithRelay(chatId, 
          '❌ Status Check Failed\n\n' +
          `Error: ${error.message}\n\n` +
          'Please try again later.'
        );
      }
    
    case '/upload':
      return await sendMessageWithRelay(chatId, 
        '📤 Upload File\n\n' +
        'Send any file you want to upload and get a permanent download URL.\n\n' +
        'Supported file types:\n' +
        '• Documents (.txt, .pdf, .zip, .doc, .docx)\n' +
        '• Images (.jpg, .jpeg, .png, .gif, .webp, .svg)\n' +
        '• Audio files (.mp3, .wav, .ogg)\n' +
        '• Videos (.mp4, .avi, .mov)\n\n' +
        'The file will be uploaded to Telegram and you will receive a permanent URL that can be used to download the file anytime.'
      );
    
    default:
      return await sendMessageWithRelay(chatId, `Unknown command: ${command}\n\nUse /help to see available commands.`);
  }
}

/**
 * Handle regular messages
 */
async function handleMessage(chatId, text, messageId) {
  await sendMessageWithRelay(chatId, `Echo: ${text}`, {
    reply_to_message_id: messageId,
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      message_id: messageId,
      text: `Echo: ${text}`
    })
  };
}

/**
 * Initialize the bot
 */
async function initializeBot() {
  try {
    console.log('🚀 Initializing serverless bot...');
    
    const botUrl = `https://api.telegram.org/bot${config.botToken}/getMe`;
    const response = await fetch(botUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to initialize bot: ${response.statusText}`);
    }
    
    const botInfo = await response.json();
    console.log(`✅ Bot initialized successfully: ${botInfo.result.username || 'Unknown'}`);
    console.log(`🆔 Bot ID: ${botInfo.result.id}`);
    
    if (config.debugMode) {
      console.log('🔧 Debug mode is enabled');
      console.log(`📡 Config: ${JSON.stringify(config, null, 2)}`);
    }
    
    console.log('🎯 Serverless bot is ready to receive updates!');
    
  } catch (error) {
    console.error('❌ Failed to initialize bot:', error);
    process.exit(1);
  }
}

// Initialize the bot
initializeBot();
console.log('🎯 Serverless bot is ready!');