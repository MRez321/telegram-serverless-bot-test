# Serverless Telegram Bot

A simple serverless Telegram bot designed for testing connections with built-in relay support for regions with poor internet connectivity.

## Overview

This bot provides:
- **Connection Testing**: Simple endpoint to test Telegram API connectivity
- **Built-in Relay**: Automatic fallback to relay server when main API fails
- **Retry Logic**: Configurable retry attempts for failed requests
- **Error Handling**: Graceful error handling with status reporting
- **Health Check**: Simple health check endpoint for monitoring

## Features

### Core Functionality
- `/start` - Display welcome message and available commands
- `/help` - Show detailed command list
- `/status` - Check connection status and API accessibility
- `/relay-test` - Test relay functionality and connectivity
- Regular messages - Echo back with timestamp for testing

### Relay Support
- Automatic failover to relay server
- Multiple relay options (main API, relay, fallback)
- Configurable retry attempts and delays
- Graceful error handling

### Configuration
- Environment variable-based configuration
- Production and development environments
- Comprehensive retry logic
- Timeout controls

## Files

### Core Application
- `index.js` - Main bot application
- `package.json` - Project configuration and dependencies
- `.env.example` - Environment variables template

### Documentation
- `README.md` - This documentation
- `agents.md` - Backend architecture documentation
- `docs/` - Detailed documentation directory:
  - `docs/setup-guide.md` - Setup and configuration guide
  - `docs/api-reference.md` - Telegram Bot API reference
  - `docs/architecture.md` - System architecture documentation
  - `docs/deployment-operations.md` - Deployment and operations guide

### Test Files
- `test-bot.js` - Comprehensive bot test script

## Usage

### Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Copy Environment Configuration**
```bash
cp .env.example .env
```

3. **Configure Environment Variables**
Edit `.env` file:
- `TELEGRAM_BOT_TOKEN`: Your bot token from @BotFather
- `TELEGRAM_CHAT_ID`: Chat ID for messages
- `RELAY_URL`: Relay server URL (from your original .env)

4. **Run the Bot**
```bash
npm start
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
node test-bot.js
```

### Testing via Telegram

Once running, send these commands:
- `/start` - Display welcome message
- `/help` - Show all available commands
- `/status` - Check bot connection status
- `/relay-test` - Test relay functionality

## Testing Commands

Use the bot in Telegram and send these commands:

1. `/start` - Verify welcome message
2. `/help` - Check command list
3. `/status` - Validate status reporting
4. `/relay-test` - Test relay functionality

### API Testing

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

## Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | String | Yes | - | Telegram Bot API token |
| `TELEGRAM_CHAT_ID` | String | Yes | - | Default chat ID for messages |
| `RELAY_URL` | String | Yes | `https://relay.mrez321.ir` | Relay server URL |
| `RETRY_ATTEMPTS` | Number | No | `3` | Number of retry attempts |
| `RETRY_DELAY` | Number | No | `1000` | Delay between retries (ms) |
| `TIMEOUT` | Number | No | `5000` | Request timeout (ms) |
| `DEBUG_MODE` | Boolean | No | `true` | Enable debug logging |

## Docker Deployment

### Build
```bash
docker build -t serverless-telegram-bot .
```

### Run
```bash
docker run -e TELEGRAM_BOT_TOKEN=your_token -e TELEGRAM_CHAT_ID=your_chat_id serverless-telegram-bot
```

## Cloud Platform Support

### AWS Lambda

Create a Lambda function with:
- Node.js runtime
- Environment variables configured
- API Gateway for HTTP access

### Google Cloud Functions

Deploy as a cloud function with:
- Node.js runtime
- Environment variables
- Trigger for bot updates

### Vercel

Deploy to Vercel with:
- Serverless functions
- Environment variables
- Automatic scaling

## Monitoring

### Health Check

The bot provides health check capabilities for monitoring:

1. **Manual Health Check**
```bash
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe \
  -d chat_id=${TELEGRAM_CHAT_ID}
```

2. **Status Command**
In Telegram: `/status`

### Metrics

Monitor these key metrics:
- **Success Rate**: Percentage of successful API calls
- **Response Time**: Average response time for API calls
- **Relay Usage**: Frequency of relay fallback usage
- **Error Rate**: Percentage of failed calls

## Security

### Best Practices

1. **Environment Variables**
   - Store secrets in environment variables
   - Never commit `.env` files to version control
   - Use `.env.example` as template

2. **Access Control**
   - Restrict access to configuration files
   - Use proper file permissions
   - Monitor for unusual activity

3. **Regular Maintenance**
   - Rotate bot tokens periodically
   - Review access logs
   - Update dependencies regularly

## Backup and Recovery

### Backup Strategy

1. **Configuration Backup**
```bash
mkdir -p backups
cp .env backups/env_$(date +%Y%m%d_%H%M%S)
```

2. **Dependency Backup**
```bash
cp package.json backups/
```

### Recovery Procedure

1. **Restore Configuration**
   - Restore `.env` file from backup
   - Verify all environment variables

2. **Test Functionality**
   - Start the bot
   - Send test commands
   - Verify relay functionality

## Troubleshooting

### Common Issues

**Issue**: Bot not responding
**Solution**:
1. Check if bot is running
2. Verify environment variables
3. Test connectivity
4. Check logs for errors

**Issue**: Relay server not accessible
**Solution**:
1. Check relay URL
2. Test relay directly
3. Try alternative relay
4. Check relay server status

**Issue**: Too many errors
**Solution**:
1. Check bot logs for error patterns
2. Verify retry configuration
3. Test API connectivity
4. Consider increasing retry attempts

### Debug Commands

```bash
# Check bot status
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe \
  -d chat_id=${TELEGRAM_CHAT_ID}

# Get bot updates
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates

# Test relay
curl -X POST ${RELAY_URL}/bot${TELEGRAM_BOT_TOKEN}/sendMessage \
  -d chat_id=${TELEGRAM_CHAT_ID} \
  -d text=Test
```

## Project Structure

```
serverless-telegram-bot/
├── .env.example              # Environment variables template
├── .env                      # Environment variables (gitignored)
├── .gitignore                # Git ignore patterns
├── docs/                     # Documentation
│   ├── setup-guide.md        # Setup and configuration guide
│   ├── api-reference.md      # Telegram Bot API reference
│   ├── architecture.md       # System architecture documentation
│   └── deployment-operations.md # Deployment and operations guide
├── index.js                  # Main bot application
├── package.json              # Project configuration
├── README.md                 # This documentation
├── agents.md                 # Backend architecture documentation
├── test-bot.js               # Test script
└── node_modules/             # Dependencies (gitignored)
```

## Testing

### Run Comprehensive Tests

```bash
node test-bot.js
```

### Test Scenarios

1. **Connection Test**: Verify bot API connectivity
2. **Relay Test**: Test relay server accessibility
3. **Retry Logic**: Test retry mechanism
4. **Command Test**: Test bot commands

## Getting Help

### Documentation
- **Setup Guide**: `docs/setup-guide.md`
- **API Reference**: `docs/api-reference.md`
- **Architecture**: `docs/architecture.md`
- **Deployment**: `docs/deployment-operations.md`

### Support
- **Telegram**: Contact bot developers
- **Issues**: Report bugs and issues
- **Community**: Join relevant communities

## Contributing

### Code Standards
- Follow JavaScript best practices
- Use descriptive variable names
- Include proper error handling
- Write clean, maintainable code

### Pull Requests
- Create feature branches
- Write descriptive commit messages
- Include tests for new functionality
- Update documentation as needed

## License

This project is licensed under the MIT License.

## Acknowledgements

Special thanks to:
- Telegram Bot API team
- open-source contributors
- Community support
- All testers and contributors

## Changelog

### Version 1.0.0
- Initial release
- Basic bot functionality
- Relay support
- Command processing
- Environment configuration

### Version 1.1.0
- Enhanced documentation
- Improved error handling
- Better testing
- Docker support

## Conclusion

This serverless Telegram bot provides a robust solution for:

- **Connection Testing**: Built-in connectivity testing
- **Relay Support**: Automatic failover for unreliable connections
- **Reliable Operation**: Retry logic and multiple fallback mechanisms
- **Easy Deployment**: Configuration-driven, environment-based setup

The architecture is designed for production use in challenging network environments while maintaining simplicity and ease of use.

**Happy bot building!** 🤖

*Last updated: November 7, 2026
*Dependencies: node-telegram-bot-api, dotenv, node-fetch
*Version: 1.0.0*