//!/usr/bin/env node

/**
 * Complete Serverless Telegram Bot with File Upload/Download
 * Integrates file-to-link.js functionality for permanent file URLs
 * Provides comprehensive serverless file upload service
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
  retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
  retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
  timeout: parseInt(process.env.TIMEOUT) || 5000,
  debugMode: process.env.DEBUG_MODE === 'true' || true,
  webhookUrl: process.env.WEBHOOK_URL || '',
};

// Extract file IDs from Telegram response (based on file-to-link.js)
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
  const uniqueFileIds = [...new Set(fileIds)];
  return uniqueFileIds;
}

// Make HTTP requests with retry (based on file-to-link.js postReq)
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

// Serverless handler
exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { message, callback_query } = body;
    
    if (message) {
      return await handleMessage(message);
    } else if (callback_query) {
      return await handleCallbackQuery(callback_query);
    } else if (body.edit_message) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }
    
    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown update type' }) };
    
  } catch (error) {
    console.error('Serverless bot error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};