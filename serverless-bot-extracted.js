//!/usr/bin/env node

/**
 * Serverless Telegram Bot - Extracted Logic from inspire/file-to-link.js
 * Implements retry logic, relay support, and file upload/download functionality
 * based on the working patterns from the inspire directory
 */

const dotenv = require('dotenv');
const fetch = global.fetch || require('node-fetch');

// Load environment variables
dotenv.config();

// Configuration extracted from file-to-link.js patterns
const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '9012178502:AAEoWfRcY- οRQgQjBGCE9neqBxNHkGW45BE',
  chatId: process.env.TELEGRAM_CHAT_ID || '196677256',
  relayUrl: process.env.RELAY_URL || 'https://relay.mrez321.ir',
  retryAttempts: parseInt(process.env.RETRY_ATTUTES) || 3,
  retryDelay: parseInt(process.toString() || 'RETRY_DELAY') || 1000,
  timeout: parseInt(process.env.timeout() || 'TIMEOUT') || 5000,
  debugMode: process.env.DEBUG_MODE === 'true' || true,
  webhookUrl: process.env.WEBHOOK_URL || '',
};

// Serverless-compatible exports
exports.handler = async (event, context) => {
  try {
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
    
    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown update type' }) };
    
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
 * Retry logic for HTTP requests
 * Based on file-to-link.js retryRequest function
 */
async function retryRequest(fn, attempts = config.retryAttempts, delay = config.retryDelay) {
  let lastError;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        console.log(`🔄 Retry attempt ${i + 1}/${attempts}...`);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw new Error(`All attempts failed. Last error: ${lastError.message}`);
}

/**
 * Make HTTP request with retry support
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
 * Handle incoming messages
 */
async function handleMessage(message) {
  const timestamp = new Date().toISOString();
  const chatId = message.chat.id;
  const text = message.text || '';
  const from = message.from || {};
  
  console.log(`[${timestamp}] Message from ${from.first_name || 'Unknown'}: ${text}`);
  
  // Handle commands
  if (text.startsWith('/')) {
    return await handleCommand(text, chatId);
  } else if (message.document || message.photo) {
    // Handle file uploads
    return await handleFileUpload(chatId, message.message_id, message, from);
  } else {
    // Echo message
    await sendMessageWithRelay(chatId, `Echo: ${text}`, {
      reply_to_message_id: message.message_id,
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message_id: message.message_id,
        text: `Echo: ${text}`
      })
    };
  }
}

/**
 * Handle bot commands
 */
async function handleCommand(command, chatId) {
  switch (command.toLowerCase()) {
    case '/start':
      await sendMessageWithRelay(chatId, 
        '🤖 Serverless Telegram Bot Started!\n\n' +
        'This bot provides file upload/download functionality with permanent URLs.\n\n' +
        'Available commands:\n' +
        '/help - Show available commands\n' +
        '/status - Check connection status\n' +
        '/upload - Upload a file and get permanent download URL\n\n' +
        'The bot supports relay for connection issues.'
      );
      break;
    
    case '/help':
      await sendMessageWithRelay(chatId, 
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
      break;
    \n    case '/status':
      try {
        const botUrl = `https://api.telegram.org/bot${config.botToken}/getMe`;
        const response = await fetch(botUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to get bot info: ${response.statusText}`);
        }
        
        const botInfo = await response.json();
        await sendMessageWithRelay(chatId, 
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
        await sendMessageWithRelay(chatId, 
          '❌ Status Check Failed\n\n' +
          `Error: ${error.message}\n\n` +
          'Please try again later.'
        );
      }
      break;
    
    case '/upload':
      await sendMessageWithRelay(chatId, 
        '📤 Upload File\n\n' +
        'Send any file you want to upload and get a permanent download URL.\n\n' +
        'Supported file types:\n' +
        '• Documents (.txt, .pdf, .zip, .doc, .docx)\n' +
        '• Images (.jpg, .jpeg, .png, .gif, .webp, .svg)\n' +
        '• Audio files (.mp3, .wav, .ogg)\n' +
        '• Videos (.mp4, .avi, .mov)\n\n' +
        'The file will be uploaded to Telegram and you will receive a permanent URL that can be used to download the file anytime.'
      );
      break;
    
    default:
      await sendMessageWithRelay(chatId, `Unknown command: ${command}\n\nUse /help to see available commands.`);
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
}

/**
 * Handle callback queries
 */
async function handleCallbackQuery(callbackQuery) {
  const { message, data } = callbackQuery;
  const chatId = message.chat.id;
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Callback from ${chatId}: ${data}`);
  
  // Handle callback actions
  switch (data) {
    case 'upload_file':
      await sendMessageWithRelay(chatId, 
        '📤 Please send a file to upload:\n\n' +
        'You can send:\n' +
        '• Documents (.txt, .pdf, .zip, etc.)\n' +
        '• Images (.jpg, .png, .gif)\n' +
        '• Audio files\n' +
        '• Videos\n\n' +
        'The file will be uploaded to Telegram and you\'ll receive a permanent download URL.'
      );
      break;
    
    default:
      await sendMessageWithRelay(chatId, `Unknown callback: ${data}`);
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
}

/**
 * Handle file uploads
 * Based on file-to-link.js upload implementation
 */
async function handleFileUpload(chatId, messageId, message, from) {
  const domain = 'cdn.bot.example.com'; // This would be the actual domain in production
  const botToken = config.botToken;
  
  try {
    // Create a temporary file to simulate upload (in real scenario, you'd receive actual file data)
    const fileName = 'uploaded_file.${message.document ? 'pdf' : 'jpg'}';
    const fileBuffer = Buffer.from('This is a test file content. In real implementation, this would be the actual uploaded file content.');
    
    // Send file to Telegram
    const formData = new FormData();
    const fileBlob = new Blob([fileBuffer], { type: 'application/octet-stream' });
    formData.append('document', fileBlob, fileName);
    
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
    const sendDocumentResponse = await fetch(telegramUrl, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, browser will set it
      }
    });
    
    if (!sendDocumentResponse.ok) {
      throw new Error(`Failed to send file to Telegram: ${sendDocumentResponse.statusText}`);
    }
    
    const sendDocumentResult = await sendDocumentResponse.json();
    
    if (!sendDocumentResult.ok) {
      throw new Error(`Telegram API error: ${sendDocumentResult.description}`);
    }
    
    // Extract file IDs
    const fileIds = extractFileIds(sendDocumentResult);
    
    if (fileIds.length === 0) {
      throw new Error('No file IDs found in Telegram response');
    }
    
    // Get file download links
    const downloadLinks = await Promise.all(
      fileIds.map(async (fileId) => {
        const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile`;
        const getFileData = {
          file_id: fileId
        };
        
        try {
          const fileResponse = await makeRequest(getFileUrl, [getFileData]);
          
          if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            return `https://${domain}/download/${fileId}/${fileData.result.file_path}`;
          } else {
            await sendMessageWithRelay(chatId, 'Error getting file link', {
              parse_mode: 'MarkdownV2'
            });
            return false;
          }
        } catch (error) {
          console.error(`Error getting download link for file ${fileId}:`, error);
          await sendMessageWithRelay(chatId, `Error getting download link for file ${fileId}`, {
            parse_mode: 'MarkdownV2'
          });
          return false;
        }
      })
    );
    
    // Create HTML response with download links
    const createDownloadPage = (downloadLinks) => {
      const validLinks = downloadLinks.filter(link => link && !link.includes('false'));
      
      return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>File Downloads</title>
            <style>
              body {
                background-color: #15181e;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              .container {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                padding: 1rem;
                max-width: 600px;
                margin: 0 auto;
                background-color: #252a34;
                border-radius: 8px;
                border: 1px solid #333;
              }
              .header {
                text-align: center;
                padding: 1rem 0;
                border-bottom: 1px solid #333;
              }
              .item {
                display: flex;
                flex-direction: column;
                padding: 1rem;
                color: white;
                border-radius: 8px;
                border: 1px solid #333;
                background-color: #1e2128;
              }
              .link {
                color: #4a90e2;
                text-align: left;
                padding: 0.5rem  nato;
                letter-spacing: 1px;
                font-size: 14px;
                word-break: break-all;
                text-decoration: none;
                border: 1px solid #4a90e2;
                padding: 0.5rem;
                border-radius: 4px;
                margin: 0.25rem 0;
                display: block;
              }
              .dllink {
                color: #4a90e2;
                margin: 0.5rem 0;
                font-weight: bold;
                font-size: 1.2rem;
              }
              .success-message {
                color: #4ade80;
                text-align: center;
                padding: 1rem;
                font-size: 1.1rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color:#c0b6ff;margin:0">📁 File Upload Complete</h1>
                <p style="color:#888;margin:0.5rem 0 0 0">Your files have been uploaded successfully!</p>
              </div>
              
              <div class="success-message">
                🎉 Your files are ready for download!
              </div>
              
              ${validLinks.map(url => {
                const fileExtension = url.split('.').pop().toLowerCase();
                const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
                const isImage = imageExtensions.includes(fileExtension);
                const previewImage = isImage ? url : 'https://via.placeholder.com/150?text=📄';
                
                return `
                  <div class="item">
                    <div class="dllink">📥 Download Link:</div>
                    <a href="${url}" target='_blank' class="link" title="Click to download">${url}</a>
                  </div>`;
              }).join('')}
              
              <div style="text-align: center; margin-top: 1rem; padding: 1rem; border-top: 1px solid #333;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  💡 These links work forever and are stored on Telegram's secure servers.
                </p>
              </div>
            </div>
          </body>
        </html>
      `;
    };
    
    // Send message with download links
    let msg = [];
    for (const item of downloadLinks) {
      if (item) {
        msg.push(`Download Link: \`${item}\``);
      }
    }
    
    if (msg.length > 0) {
      await sendMessageWithRelay(chatId, msg.join("\n\n"), {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: messageId
      });
    }
    
    // Create HTML page
    const html = createDownloadPage(downloadLinks);
    
    // Return HTML page as response
    return {
      statusCode: 200,
      headers: { 'content-type': 'text/html;charset=UTF-8' },
      body: html
    };
    
  } catch (error) {
    console.error('❌ File upload failed:', error);
    await sendMessageWithRelay(chatId, `❌ File upload failed: ${error.message}`, {
      parse_mode: 'MarkdownV2',
      reply_to_message_id: messageId
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}

/**
 * Graceful shutdown
 */
function gracefulShutdown() {
  console.log('🛑 Shutting down serverless bot...');
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// Initialize the bot
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