//!/usr/bin/env node

/**
 * Serverless Telegram Bot Implementation with File Upload/Download
 * Integrates file-to-link.js functionality into a serverless architecture
 * Provides permanent URLs for file downloads
 */

const dotenv = require('dotenv');
const fetch = global.fetch || require('node-fetch');

// Load environment variables
dotenv.config();

// Serverless-compatible exports
exports.handler = async (event, context) => {
  try {
    // Parse the incoming request
    const body = JSON.parse(event.body || '{}');
    const { message, callback_query, type, query } = body;
    
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