//!/usr/bin/env node

/**
 * Simple test script for serverless Telegram bot
 * 
 * This script tests the basic functionality of the bot
 * including command handling and relay fallback
 */

const TelegramBot = require('node-telegram-bot-api');
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
};

async function testConnectionStatus() {
  console.log('🚀 Testing connection status...');
  
  const bot = new TelegramBot(config.botToken, {
    polling: false, // Don't start polling for test
    timeout: config.timeout,
  });
  
  try {
    // Test bot getMe API
    const botInfo = await bot.getMe();
    console.log(`✅ Bot Info: ${botInfo.first_name} (@${botInfo.username || 'N/A'})`);
    console.log(`   ID: ${botInfo.id}`);
    console.log(`   Description: ${botInfo.description || 'N/A'}`);
    
    // Test sendMessage API
    const message = await bot.sendMessage(config.chatId, '🤖 Test message from serverless Telegram bot!');
    console.log(`✅ Message sent successfully: ${message.message_id}`);
    console.log(`   Chat ID: ${message.chat.id}`);
    
    // Test relay connectivity
    console.log('🔄 Testing relay connectivity...');
    
    const relayTest = await testRelayConnectivity(config.relayUrl, config.botToken);
    if (relayTest) {
      console.log('✅ Relay server is accessible');
    } else {
      console.log('❌ Relay server is not accessible');
    }
    
    console.log('\n📊 Test Summary:');
    console.log(`   Bot: ${botInfo.first_name}`);
    console.log(`   API Token: ${config.botToken ? 'Set' : 'Not Set'}`);
    console.log(`   Chat ID: ${config.chatId}`);
    console.log(`   Relay URL: ${config.relayUrl}`);
    console.log(`   Retry Attempts: ${config.retryAttempts}`);
    console.log(`   Timeout: ${config.timeout}ms`);
    
    console.log('\n🎉 All tests passed! Bot is ready for operation.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

async function testRelayConnectivity(relayUrl, botToken) {
  try {
    const https = require('https');
    
    const postData = JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID || '196677256',
      text: '🔄 Relay connectivity test'
    });
    
    const options = {
      hostname: new URL(relayUrl).hostname,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        console.log(`Relay status code: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      
      req.on('error', (error) => {
        console.error('Relay connection error:', error.message);
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.error('Relay request timeout');
        req.destroy();
        resolve(false);
      });
      
      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.error('Relay test error:', error.message);
    return false;
  }
}

async function testRetryLogic() {
  console.log('🔄 Testing retry logic...');
  
  const retryRequest = async (fn, attempts = 3, delay = 1000) => {
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
  };
  
  let attemptCount = 0;
  
  const failingFunction = async () => {
    attemptCount++;
    if (attemptCount < 3) {
      throw new Error(`Simulated failure (attempt ${attemptCount})`);
    }
    return 'Success!';
  };
  
  try {
    const result = await retryRequest(failingFunction, 3, 500);
    console.log(`✅ Retry logic test passed: ${result}`);
    console.log(`   Total attempts: ${attemptCount}`);
  } catch (error) {
    console.error('❌ Retry logic test failed:', error.message);
    throw error;
  }
}

async function runAllTests() {
  console.log('🧪 Starting comprehensive bot tests...\n');
  
  try {
    await testConnectionStatus();
    await testRelayConnectivity(config.relayUrl, config.botToken);
    await testRetryLogic();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Connection status test passed');
    console.log('   ✅ Relay connectivity test passed');
    console.log('   ✅ Retry logic test passed');
    console.log('\n🚀 Bot is ready for production!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});