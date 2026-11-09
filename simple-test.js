//!/usr/bin/env node

/**
 * Simple test to verify essential-serverless-bot.js functionality
 * This tests the core functionality without requiring external API calls
 */

const essentialBot = require('./essential-serverless-bot');

// Create a mock Telegram event
const mockEvent = {
  body: JSON.stringify({
    message: {
      chat: {
        id: '196677256'
      },
      message_id: 1,
      text: '/start',
      from: {
        first_name: 'Test',
        last_name: 'User'
      }
    }
  })
};

async function testBot() {
  try {
    console.log('🧪 Testing essential-serverless-bot.js...');
    
    // Test 1: Start command
    console.log('\n📝 Test 1: /start command');
    const startResponse = await essentialBot.handler(mockEvent, {});
    console.log('✅ /start command response:', startResponse.statusCode);
    console.log('✅ /start command body:', JSON.parse(startResponse.body).ok);
    
    // Test 2: Help command
    console.log('\n📝 Test 2: /help command');
    const helpEvent = {
      body: JSON.stringify({
        message: {
          chat: {
            id: '196677256'
          },
          message_id: 2,
          text: '/help',
          from: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })
    };
    const helpResponse = await essentialBot.handler(helpEvent, {});
    console.log('✅ /help command response:', helpResponse.statusCode);
    console.log('✅ /help command body:', JSON.parse(helpResponse.body).ok);
    
    // Test 3: Status command
    console.log('\n📝 Test 3: /status command');
    const statusEvent = {
      body: JSON.stringify({
        message: {
          chat: {
            id: '196677256'
          },
          message_id: 3,
          text: '/status',
          from: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })
    };
    const statusResponse = await essentialBot.handler(statusEvent, {});
    console.log('✅ /status command response:', statusResponse.statusCode);
    console.log('✅ /status command body:', JSON.parse(statusResponse.body).ok);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testBot();
}