# Serverless Telegram Bot - Backend Architecture

This document describes the backend architecture, components, and implementation details of the serverless Telegram bot.

## Overview

The serverless Telegram bot is designed to work with connection issues common in certain regions. It includes built-in relay support to ensure reliable communication when the main Telegram API is unavailable.

## Key Components

### 1. Main Bot Application (`index.js`)

**Purpose**: Core bot functionality including message handling, command processing, and API communication.

**Features**:
- Telegram bot polling for real-time message handling
- Built-in relay support for connection issues
- Retry logic with configurable attempts and delays
- Error handling and graceful shutdown
- Multiple fallback servers (main API, relay, fallback relay)

**Architecture**:
- Uses `node-telegram-bot-api` for Telegram integration
- Implements `fetchWithRetry` for HTTP requests with retry logic
- Supports multiple servers with automatic failover
- Clean separation of concerns with dedicated functions

### 2. Configuration (.env)

**Purpose**: Environment variable management for bot customization.

**Variables**:
- `TELEGRAM_BOT_TOKEN`: Telegram Bot API token (required)
- `TELEGRAM_CHAT_ID`: Default chat ID for messages (required)
- `RELAY_URL`: Relay server URL for fallback (required)
- `RETRY_ATTEMPTS`: Number of retry attempts (default: 3)
- `RETRY_DELAY`: Delay between retries in milliseconds (default: 1000)
- `TIMEOUT`: Request timeout in milliseconds (default: 5000)
- `DEBUG_MODE`: Enable debug logging (default: true)

### 3. Package Configuration (package.json)

**Purpose**: Project dependency management and script definitions.

**Scripts**:
- `start`: Run the bot normally
- `dev`: Run the bot in development mode

**Dependencies**:
- `node-telegram-bot-api`: Telegram Bot API integration
- `dotenv`: Environment variable management
- `node-fetch`: HTTP requests with modern API

## Relay Architecture

### Why Relay?

In regions with poor internet connectivity, the main Telegram API may be unreliable. The relay system provides:

1. **Backup Connectivity**: Automatic fallback when main API fails
2. **Load Distribution**: Multiple relay options to handle traffic spikes
3. **Geographic Flexibility**: Relay servers in different locations
4. **Fault Tolerance**: Multiple retry mechanisms and fallback chains

### Relay Implementation

The bot uses a tiered server approach:

1. **Primary Server**: Direct Telegram API (`api.telegram.org`)
2. **Relay Server**: Configured relay URL (`relay.mrez321.ir`)
3. **Fallback Server**: Secondary Telegram API endpoint

### Failover Logic

```javascript
const servers = [
  { name: 'Main Telegram API', url: `https://api.telegram.org/bot${config.botToken}/sendMessage` },
  { name: 'Relay Server', url: `${config.relayUrl}/bot${config.botToken}/sendMessage` },
  { name: 'Fallback Relay', url: 'https://api.telegram.org/bot${config.botToken}/sendMessage' },
];
```

The bot attempts each server in sequence and automatically moves to the next on failure.

## Message Handling

### Command Processing

The bot recognizes the following commands:

- `/start`: Display welcome message and available commands
- `/help`: Show detailed command list
- `/status`: Check connection status and API accessibility
- `/relay-test`: Test relay functionality and connectivity

### Message Processing

- **Commands**: Processed and responded to immediately
- **Regular Messages**: Echoed back with timestamp for testing
- **Non-text Messages**: Handled with generic response
- **Private Messages Only**: Bot responds only to private chats

### Error Handling

- **API Errors**: Logged and retried with fallback servers
- **Network Errors**: Automatic retry with exponential backoff
- **Timeout Errors**: Fallback to relay servers
- **Graceful Shutdown**: Proper cleanup of resources

## Performance Considerations

### Retry Logic

- **Maximum Attempts**: Configurable (default: 3)
- **Retry Delay**: Configurable (default: 1000ms)
- **Exponential Backoff**: Implemented in `retryRequest` function
- **Progressive Failure**: Multiple server fallback

### Resource Management

- **Connection Pooling**: HTTP requests reuse connections
- **Timeout Controls**: Prevents hanging requests
- **Memory Management**: Clean shutdown procedures
- **Logging**: Configurable debug output

### Scalability

- **Stateless Design**: Can be deployed in any environment
- **Modular Architecture**: Easy to extend with new features
- **Configuration-Driven**: Behavior controlled by environment variables
- **Testable**: Individual functions can be unit tested

## Security Considerations

### API Token Protection

- **Environment Variables**: Tokens stored in `.env` file (not committed)
- **Hidden Display**: Tokens masked in console output
- **Access Control**: Chat ID validation

### Input Validation

- **Message Length**: Telegram API handles this
- **Command Validation**: Only recognized commands processed
- **Error Sanitization**: Safe error messages without sensitive data

### Rate Limiting

- **Telegram API**: Built into the API client
- **Relay Usage**: Rate limiting handled by relay server
- **Local Throttling**: Built-in retry mechanisms

## Testing and Development

### Development Scripts

```bash
npm run dev
```

### Testing Relay

1. Start the bot with relay configured
2. Send `/relay-test` command
3. Check relay connectivity status

### Testing Connection

1. Send `/status` command
2. Verify API accessibility
3. Test relay fallback if needed

## Deployment Considerations

### Environment Variables

Required environment variables:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
RELAY_URL=https://relay.mrez321.ir
```

### Production Considerations

1. **Use `.env.production`**: Different config for production
2. **Monitor Logs**: Track API usage and relay performance
3. **Backup Relay**: Have alternative relay server ready
4. **Security**: Restrict access to bot token

## Extensibility

### Adding New Commands

1. **Add to `handleCommand` function**: Update switch statement
2. **Implement handler**: Create new function
3. **Test**: Verify functionality

### Adding Features

1. **Modular Design**: Functions are independent and testable
2. **Configuration-Driven**: New features use existing config system
3. **Relay-Aware**: New features automatically use relay fallback

### Custom Relay Servers

1. **Update Configuration**: Modify `RELAY_URL` in `.env`
2. **Test**: Verify connectivity
3. **Configure**: Set up authentication if needed

## Monitoring and Maintenance

### Health Checks

- **Status Command**: `/status` provides real-time health
- **Relay Testing**: `/relay-test` validates relay functionality
- **Error Logging**: All errors logged to console

### Maintenance Tasks

1. **Token Rotation**: Update bot token periodically
2. **Configuration Review**: Check environment variables
3. **Relay Monitoring**: Verify relay server availability
4. **Log Analysis**: Monitor for errors and issues

## Conclusion

The serverless Telegram bot provides a robust solution for:

- **Connection Testing**: Built-in connectivity testing
- **Relay Support**: Automatic failover for unreliable connections
- **Reliable Operation**: Retry logic and multiple fallback mechanisms
- **Easy Deployment**: Configuration-driven, environment-based setup

The architecture is designed for production use in challenging network environments while maintaining simplicity and ease of use.

## References

- [Telegram Bot API Documentation](https://www.telegram.org/docs)
- [node-telegram-bot-api](https://github.com/fadinn/node-telegram-bot-api)
- [Node Fetch Documentation](https://www.npmjs.com/package/node-fetch)

## Files Summary

### Core Files
- `index.js`: Main bot application
- `package.json`: Project configuration
- `.env.example`: Environment variables template

### Support Files
- `README.md`: User documentation
- `agents.md`: This backend documentation
- `docs/`: Detailed documentation directory

### Original Sources
- `.agents/skills/`: Existing bot skills and references
- `guide/`: Serverless Telegram bot guide
- `.env`: Original configuration file