//!/usr/bin/env node

/**
 * Test script for the working serverless bot
 */

const serverlessBot = require('./serverless-bot-working');

// Test data
const testEvent = {
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
    console.log('🧪 Testing working serverless bot...');
    
    // Test 1: Start command
    console.log('\n📝 Test 1: /start command');
    const startResponse = await serverlessBot.handler(testEvent, {});
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
    const helpResponse = await serverlessBot.handler(helpEvent, {});
    console.log('✅ /help command response:', helpResponse.statusCode);
    console.log('✅ /help command body:', JSON.parse(helpResponse.body).ok);
    
    // Test 3: Upload command
    console.log('\n📝 Test 3: /upload command');
    const uploadEvent = {
      body: JSON.stringify({
        message: {
          chat: {
            id: '196677256'
          },
          message_id: 3,
          text: '/upload',
          from: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })
    };
    const uploadResponse = await serverlessBot.handler(uploadEvent, {});
    console.log('✅ /upload command response:', uploadResponse.statusCode);
    console.log('✅ /upload command body:', JSON.parse(uploadResponse.body).ok);
    
    // Test 4: Echo message (non-command)
    console.log('\n📝 Test 4: Echo message (non-command)');
    const echoEvent = {
      body: JSON.stringify({
        message: {
          chat: {
            id: '196677256'
          },
          message_id: 4,
          text: 'Hello, bot!',
          from: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })
    };
    const echoResponse = await serverlessBot.handler(echoEvent, {});
    console.log('✅ Echo message response:', echoResponse.statusCode);
    console.log('✅ Echo message body:', JSON.parse(echoResponse.body).ok);
    
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