# Serverless Telegram Bot - API Reference

This document provides detailed information about the Telegram Bot API endpoints and data structures used by the serverless Telegram bot.

## Telegram Bot API Endpoints

### Core Bot Endpoints

1. **getMe**
   - **Description**: Returns basic information about the bot
   - **Method**: POST
   - **URL**: `https://api.telegram.org/bot{BOT_TOKEN}/getMe`
   - **Parameters**: None
   - **Response**: User object with bot information

2. **sendMessage**
   - **Description**: Send text messages to users
   - **Method**: POST
   - **URL**: `https://api.telegram.org/bot{BOT_TOKEN}/sendMessage`
   - **Required Parameters**:
     - `chat_id`: Unique identifier for the target chat
     - `text`: Message text to send
   - **Optional Parameters**:
     - `reply_to_message_id`: Message ID to reply to
     - `parse_mode`: Text parse mode (Markdown, HTML)
     - `disable_notification`: Send silently

3. **getUpdates**
   - **Description**: Receive incoming updates
   - **Method**: POST
   - **URL**: `https://api.telegram.org/bot{BOT_TOKEN}/getUpdates`
   - **Optional Parameters**:
     - `offset`: Identifier of the first update to return
     - `timeout`: Timeout for long polling (seconds)

### Relay Server Endpoints

4. **Relay sendMessage**
   - **Description**: Send message via relay server
   - **Method**: POST
   - **URL**: `{RELAY_URL}/bot{BOT_TOKEN}/sendMessage`
   - **Same parameters**: Same as regular sendMessage

## Message Objects

### Message Object Structure

```json
{
  "message_id": 123456,
  "from": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
   igmatism": "john.doe",
    "language_code": "en"
  },
  "chat": {
    "id": -123456789,
    "first_name": "John",
    "type": "private"
  },
  "date": 1640905200,
  "text": "Hello, world!",
  "entities": [],
  "reply_to_message": null
}
```

### Update Object

```json
{
  "update_id": 123456,
  "message": {
    "message_id": 123456,
    "from": { /* user object */ },
    "chat": { /* chat object */ },
    "date": 1640905200,
    "text": "Hello",
    "entities": []
  },
  "edited_message": { /* if message was edited */ },
  "channel_post": { /* if post in channel */ },
  "edited_channel_post": { /* if channel post was edited */ }
}
```

## Command Reference

### Available Commands

#### /start
- **Description**: Display welcome message and available commands
- **Parameters**: None
- **Response**: Welcome message with command list

#### /help
- **Description**: Show detailed help and available commands
- **Parameters**: None
- **Response**: Complete command reference with descriptions

#### /status
- **Description**: Check bot connection status and API accessibility
- **Parameters**: None
- **Response**: Connection status including:
  - Main API accessibility
  - Relay server accessibility
  - Bot configuration summary

#### /relay-test
- **Description**: Test relay server functionality
- **Parameters**: None
- **Response**: Relay test results and connectivity status

## Bot Configuration

### Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | String | Yes | - | Telegram Bot API token |
| `TELEGRAM_CHAT_ID` | String | Yes | - | Default chat ID for messages |
| `RELAY_URL` | String | Yes | `https://relay.mrez321.ir` | Relay server URL |
| `RETRY_ATTEMPTS` | Number | No | `3` | Number of retry attempts |
| `RETRY_DELAY` | Number | No | `1000` | Delay between retries (ms) |
| `TIMEOUT` | Number | No | `5000` | Request timeout (ms) |
| `DEBUG_MODE` | Boolean | No | `true` | Enable debug logging |

### Response Format

#### Successful Response

```json
{
  "ok": true,
  "result": {
    "message_id": 123456,
    "from": { /* user object */ },
    "chat": { /* chat object */ },
    "date": 1640905200,
    "text": "Response message",
    "entities": []
  }
}
```

#### Error Response

```json
{
  "ok": false,
  "description": "Bad Request: chat not found",
  "parameters": {
    "migrate_to_chat_id": -123456789,
    "retry_after": 30
  }
}
```

## Error Handling

### Common Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 400 | Bad Request | Check parameters, correct formatting |
| 401 | Unauthorized | Verify bot token is valid |
| 403 | Forbidden | Bot doesn't have permission |
| 404 | Not Found | Chat doesn't exist |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Internal Server Error | Retry, check server health |
| 502 | Bad Gateway | Relay server issue |

### Error Types in Bot

1. **BotApiError**
   - Thrown by Telegram API calls
   - Contains: `code`, `description`, `method`, `parameters`
   - Handled by relay fallback

2. **EndpointError**
   - Used for business logic errors
   - Contains: `message`, `parameters`
   - Used in relay responses

## Development Guidelines

### Best Practices

1. **Environment Variables**
   - Use `.env` file for local development
   - Never commit secrets to version control
   - Use `.env.example` as template

2. **Command Structure**
   - All commands start with `/`
   - Commands are case-insensitive
   - Responses are formatted with markdown

3. **Error Handling**
   - Use try-catch for API calls
   - Implement retry logic
   - Graceful fallback to relay servers

4. **Logging**
   - Log important events (start, errors)
   - Log relay attempts and results
   - Use debug mode for troubleshooting

### Code Examples

#### Sending a Message

```javascript
// Send via main API
await bot.sendMessage(chatId, 'Hello World!', {
  reply_to_message_id: msg.message_id
});

// Send via relay (with fallback)
await sendMessageWithFallback(chatId, 'Hello World!', {
  reply_to_message_id: msg.message_id
});
```

#### Handling Commands

```javascript
async function handleCommand(command, chatId, msg) {
  switch (command.toLowerCase()) {
    case '/start':
      await sendMessageWithFallback(chatId, 'Welcome!');
      break;
    case '/status':
      await checkConnectionStatus(chatId);
      break;
  }
}
```

## Testing

### Testing Commands

Use the bot in Telegram and send these commands:

1. `/start` - Verify welcome message
2. `/help` - Check command list
3. `/status` - Validate status reporting
4. `/relay-test` - Test relay functionality

### Testing API

Use cURL for API testing:

```bash
# Test bot info
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe \
  -d chat_id=${TELEGRAM_CHAT_ID}

# Send test message
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage \
  -d chat_id=${TELEGRAM_CHAT_ID} \
  -d text="Test message"

# Test relay
curl -X POST ${RELAY_URL}/bot${TELEGRAM_BOT_TOKEN}/sendMessage \
  -d chat_id=${TELEGRAM_CHAT_ID} \
  -d text="Relay test"
```

## Integration Notes

### Relay Integration

The bot automatically uses relay when:

1. Main API fails with an error
2. Connection times out
3. Rate limiting is detected

### Fallback Chain

1. **Primary**: Direct Telegram API (`api.telegram.org`)
2. **Relay**: Configured relay server (`relay.mrez321.ir`)
3. **Secondary**: Backup Telegram API endpoint

### Monitoring

Monitor these metrics:

- **Success Rate**: Percentage of successful API calls
- **Response Time**: Average time for API calls
- **Relay Usage**: Frequency of relay fallback
- **Error Rate**: Percentage of failed calls

## Migration Notes

### From Original Configuration

If migrating from the original `.env` file:

1. **Copy values**: The bot retains original values by default
   - `TELEGRAM_BOT_TOKEN=9012178502:AAEoWfRcY-0RQgQjBGCE9neqBxNHkGW45BE`
   - `TELEGRAM_CHAT_ID=196677256`
   - `RELAY_URL=https://relay.mrez321.ir`

2. **Add new variables**: As needed
3. **Test thoroughly**: Verify relay fallback works

### Bot Migration

When deploying to different environments:

1. **Environment variables**: Update `.env` file
2. **Configuration**: Verify all settings
3. **Testing**: Test all functionality
4. **Monitoring**: Set up alerts and logging

## Conclusion

This API reference provides comprehensive documentation for:

- **API endpoints**: All Telegram Bot API methods used
- **Data structures**: Message and update object formats
- **Commands**: All available bot commands
- **Error handling**: Common error codes and solutions
- **Testing**: API and integration testing procedures
- **Integration**: Relay server and fallback mechanisms

The reference is designed to help developers:

- **Understand**: Bot functionality and capabilities
- **Implement**: API calls and command handlers
- **Maintain**: Bot and relay infrastructure
- **Troubleshoot**: Issues and connectivity problems

## References

- [Telegram Bot API Documentation](https://www.telegram.org/docs)
- [Bot API Methods](https://core.telegram.org/bots/api)
- [node-telegram-bot-api](https://github.com/fadinn/node-telegram-bot-api)
- [Relay Server Documentation](https://relay.mrez321.ir)