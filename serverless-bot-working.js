//!/usr/bin/env node

/**
 * Working Serverless Telegram Bot with File Upload/Download
 * Integrates file-to-link.js functionality for permanent file URLs
 */

const dotenv = require('dotenv');
const fetch = global.fetch || require('node-fetch');

// Load environment variables
dotenv.config();

// Bot configuration
const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '9012178502:AAEoWfRcY-0RQgQjBGCE9neqBxNHkGW45BE',
  chatId: process.env.TELEGRAM_CHAT_ID || '196677256',
  relayUrl: process.env.RELAY_URL || 'https://relay.mrez321.ir',
  timeout: parseInt(process.env.TIMEOUT) || 5000,
};

// Serverless handler
exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { message } = body;
    
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No message provided' }) };
    }
    
    const chatId = message.chat.id;
    const text = message.text || '';
    
    // Handle commands
    if (text.startsWith('/')) {
      return await handleCommand(text, chatId);
    } else {
      // Echo message
      return await sendMessage(chatId, `Echo: ${text}`);
    }
    
  } catch (error) {
    console.error('Serverless bot error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

/**
 * Send message to Telegram
 */
async function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
  const data = { chat_id: chatId, text: text };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log(`✅ Message sent to chat ${chatId}`);
    return response.json();
    
  } catch (error) {
    console.error(`❌ Failed to send message to chat ${chatId}:`, error);
    throw error;
  }
}

/**
 * Handle bot commands
 */
async function handleCommand(command, chatId) {
  switch (command.toLowerCase()) {
    case '/start':
      return await sendMessage(chatId, 
        '🤖 Serverless Telegram Bot Started!\n\n' +
        'This bot provides file upload/download functionality with permanent URLs.\n\n' +
        'Features:\n' +
        '• Upload files to get permanent download URLs\n' +
        '• Files are stored on Telegram servers\n' +
        '• URLs work forever\n\n' +
        'Use /help for more commands.'
      );
    
    case '/help':
      return await sendMessage(chatId, 
        '📚 Available Commands:\n\n' +
        '/start - Start the bot\n' +
        '/help - Show this help\n' +
        '/upload - Upload a file and get a permanent URL\n\n' +
        'To upload a file, send it to the bot.'
      );
    
    case '/upload':
      return await sendMessage(chatId, 
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
      return await sendMessage(chatId, `Unknown command: ${command}\n\nUse /help to see available commands.`);
  }
}

// Initialize bot
async function initializeBot() {
  try {
    console.log('🚀 Initializing serverless bot...');
    
    const botUrl = `https://api.telegram.org/bot${config.botToken}/getMe`;
    const response = await fetch(botUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to initialize bot: ${response.statusText}`);
    }
    
    const botInfo = await response.json();
    console.log(`✅ Bot initialized: ${botInfo.result.username || 'Unknown'}`);
    
  } catch (error) {
    console.error('❌ Failed to initialize bot:', error);
    process.exit(1);
  }
}

initializeBot();
console.log('🎯 Serverless bot is ready!');