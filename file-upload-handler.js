//!/usr/bin/env node

/**
 * File Upload Handler Module
 * Integrates file-to-link.js functionality for permanent file URLs
 * Based on the working file-to-link.js implementation
 */

const fetch = global.fetch || require('node-fetch');

class FileUploadHandler {
  constructor(config) {
    this.botToken = config.botToken;
    this.chatId = config.chatId;
    this.domain = 'cdn.bot.example.com'; // In production, this would be your actual domain
  }

  /**
   * Extract file IDs from Telegram response
   * Based on file-to-link.js extractFileIds function
   */
  extractFileIds(obj) {
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

  /**
   * Make request to Telegram API
   */
  async makeTelegramRequest(url, data = null) {
    const urlObj = new URL(url);
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const options = {
      method: data ? 'POST' : 'GET',
      headers: headers
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(urlObj, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
      
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  /**
   * Send file to Telegram and generate download links
   * Based on file-to-link.js upload implementation
   */
  async uploadFileAndGetLinks(fileBuffer, fileName, chatId, messageId) {
    try {
      // Send file to Telegram
      const formData = new FormData();
      const fileBlob = new Blob([fileBuffer], { type: 'application/octet-stream' });
      formData.append('document', fileBlob, fileName);
      
      const telegramUrl = `https://api.telegram.org/bot${this.botToken}/sendDocument`;
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
      const fileIds = this.extractFileIds(sendDocumentResult);
      
      if (fileIds.length === 0) {
        throw new Error('No file IDs found in Telegram response');
      }
      
      // Get file download links
      const downloadLinks = await Promise.all(
        fileIds.map(async (fileId) => {
          const getFileUrl = `https://api.telegram.org/bot${this.botToken}/getFile`;
          const getFileData = {
            file_id: fileId
          };
          
          try {
            const fileResponse = await this.makeTelegramRequest(getFileUrl, getFileData);
            
            if (fileResponse.ok) {
              return `https://${this.domain}/download/${fileId}/${fileResponse.result.file_path}`;
            } else {
              throw new Error('Error getting file link');
            }
          } catch (error) {
            console.error(`Error getting download link for file ${fileId}:`, error);
            throw error;
          }
        })
      );
      
      // Create response with download links
      const responseData = {
        success: true,
        message: 'File uploaded successfully!',
        downloadLinks: downloadLinks,
        fileIds: fileIds,
        messageId: messageId
      };
      
      return responseData;
      
    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw error;
    }
  }

  /**
   * Create HTML page for file download links
   */
  createDownloadPage(downloadLinks) {
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
              padding: 0.5rem 0;
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
  }
}

module.exports = FileUploadHandler;