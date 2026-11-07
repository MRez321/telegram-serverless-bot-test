# Serverless Telegram Bot - Setup Guide

This guide provides step-by-step instructions for setting up and running the serverless Telegram bot.

## Prerequisites

### Required Software

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Internet connection

### Installation Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/serverless-telegram-bot.git
   cd serverless-telegram-bot
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Copy Environment Configuration**

   ```bash
   cp .env.example .env
   ```

4. **Configure Environment Variables**

   Edit the `.env` file to set your bot credentials:

   ```bash
   nano .env
   ```

   **Required Variables:**
   - `TELEGRAM_BOT_TOKEN`: Your bot token from @BotFather
   - `TELEGRAM_CHAT_ID`: Chat ID for messages
   - `RELAY_URL`: Relay server URL (from your original .env)

   **Optional Variables:**
   - `RETRY_ATTEMPTS`: Number of retry attempts (default: 3)
   - `RETRY_DELAY`: Delay between retries in ms (default: 1000)
   - `TIMEOUT`: Request timeout in ms (default: 5000)
   - `DEBUG_MODE`: Enable debug logging (default: true)

## Bot Setup

### Create Your Telegram Bot

1. **Open Telegram**
   - Launch Telegram app
   - Search for `@BotFather`
   - Start a chat with BotFather

2. **Create New Bot**

   ```
   /newbot
   ```

3. **Set Bot Name**
   - Provide a display name (e.g., "Serverless Test Bot")
   - Provide a username ending with "bot" (e.g., "ServerlessTestBot")

4. **Get Bot Token**
   - BotFather will provide: `9012178502:AAEoWfRcY- determinante token aquí`
   - Copy this token for the `TELEGRAM_BOT_TOKEN` environment variable

5. **Set Chat ID**
   - Start a conversation with your bot
   - Use `@getidsbot` or similar tool to get your chat ID
   - Or find it by looking at the JSON response from `getUpdates` API

### Configure Relay (Optional)

If you have a relay server:

1. **Get Relay URL**
   - From your original `.env` file
   - Example: `https://relay.mrez321.ir`

2. **Set Environment Variable**
   ```bash
   export RELAY_URL=https://relay.mrez321.ir
   ```

## Running the Bot

### Development Mode

```bash
npm run dev
```

This will:
1. Start the bot in polling mode
2. Display debug logs
3. Listen for incoming messages
4. Handle commands and relay failures

### Production Mode

```bash
npm start
```

This will:
1. Start the bot normally
2. Use configured retry attempts
3. Handle connection issues via relay
4. Gracefully shutdown on interrupt

## Testing the Bot

### Test Commands

Once the bot is running, send these commands:

1. **`/start`** - Display welcome message
2. **`/help`** - Show all available commands
3. **`/status`** - Check connection status
4. **`/relay-test`** - Test relay functionality
5. **Any other message** - Echo back with timestamp

### Testing via API

Use cURL to test:

```bash
# Test bot status
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage \
  -d chat_id=${TELEGRAM_CHAT_ID} \
  -d text=Hello\ from\ test
```

### Testing Relay

```bash
# Test relay directly
curl -X POST ${RELAY_URL}/bot${TELEGRAM_BOT_TOKEN}/sendMessage \
  -d chat_id=${TELEGRAM_CHAT_ID} \
  -d text=Relay\ test
```

## Monitoring and Logs

### Log Output

The bot logs various events to the console:

1. **Connection Events**
   - Bot startup
   - Message reception
   - Connection status

2. **Relay Events**
   - Relay attempts
   - Fallback server usage
   - Relay success/failure

3. **Error Events**
   - API failures
   - Timeout errors
   - Retry attempts

### Debug Mode

Enable debug mode by setting:
```bash
DEBUG_MODE=true
```

This provides more detailed logging for troubleshooting.

## Troubleshooting

### Common Issues

1. **"Bot not responding"**
   - Check if bot is running: `npm start`
   - Verify Telegram bot token is correct
   - Ensure bot has permission to send messages

2. **"Relay server not accessible"**
   - Check relay URL in .env file
   - Verify relay server is online
   - Test relay connectivity manually

3. **"Too many requests"**
   - Check Telegram API rate limits
   - Consider increasing retry delay
   - Monitor message frequency

4. **"Configuration errors"**
   - Verify all required environment variables are set
   - Check for typos in .env file
   - Ensure .env file is in correct location

### Debug Commands

1. **Check bot status**
   ```bash
   curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe \
     -d chat_id=${TELEGRAM_CHAT_ID}
   ```

2. **Get bot updates**
   ```bash
   curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates
   ```

3. **Test relay connectivity**
   ```bash
   curl -X GET ${RELAY_URL}/health
   ```

## Advanced Configuration

### Custom Retry Settings

Increase retry attempts for unreliable connections:

```bash
RETRY_ATTEMPTS=5
RETRY_DELAY=2000
TIMEOUT=10000
```

### Silent Mode

Reduce bot output:

```bash
DEBUG_MODE=false
```

### Multiple Relays

Set up backup relay:

```bash
RELAY_URL=https://primary-relay.example.com
SECOND_RELAY_URL=https://backup-relay.example.com
```

## Security Best Practices

### Environment Variables

1. **Never hardcode secrets**: Always use `.env` files
2. **File permissions**: Set `.env` to `600` (read-only for owner)
3. **Git ignore**: Add `.env` to `.gitignore`
4.kopi `CODE_OWNER` ownership: Ensure only necessary files are committed

### Bot Token Protection

1. **Limit access**: Only necessary users should have `.env` access
2. **Regular rotation**: Change bot token periodically
3. **Audit logs**: Monitor for unusual bot activity
4. **Webhook security**: Use HTTPS when deployed

### Production Security

1. **Use HTTPS**: Always use secure connections
2. **Rate limiting**: Implement rate limiting
3. **Input validation**: Validate all incoming messages
4. **Error handling**: Secure error messages without sensitive data

## Deployment Options

### Local Development

```bash
cd /path/to/project
npm install
npm run dev
```

### Cloud Deployment

#### AWS Lambda

1. **Create Lambda function**
2. **Set environment variables**
3. **Configure VPC for relay access**
4. **Set timeout to 15 minutes**

#### Docker

```bash
docker build -t serverless-telegram-bot .
docker run -e TELEGRAM_BOT_TOKEN=... -e TELEGRAM_CHAT_ID=... serverless-telegram-bot
```

### Kubernetes

1. **Create ConfigMap** from `.env`
2. **Set environment variables**
3. **Use deployment for scaling**
4. **Configure health checks**

## Backup and Recovery

### Backup Configuration

1. **Backup `.env` file**
2. **Document bot settings**
3. **Save API tokens separately**
4. **Test recovery procedure**

### Backup Commands

```bash
# Backup environment variables
cat .env > backup/$(date +%Y%m%d)_env_backup

# Test restore
export $(cat .env | grep -o '^[A-Z]*=.*' | tr '\n' '\n' | xargs)
```

## Maintenance

### Regular Tasks

1. **Review logs**: Check for errors and unusual activity
2. **Test connectivity**: Send test messages periodically
3. **Update dependencies**: Run `npm update` periodically
4. **Rotate tokens**: Change bot token every 3-6 months

### Monitoring

1. **Set up alerts**: For bot failures and relay issues
2. **Log analysis**: Monitor for patterns and issues
3. **Performance tracking**: Track response times and success rates
4. **Capacity planning**: Monitor message volume

## File Structure

```
serverless-telegram-bot/
├── .env.example              # Environment variables template
├── .env                      # Environment variables (gitignored)
├── .gitignore                # Git ignore patterns
├── docs/                     # Documentation
│   └── setup-guide.md        # This setup guide
├── index.js                  # Main bot application
├── package.json              # Project configuration
├── README.md                 # User documentation
├── agents.md                 # Backend architecture documentation
├── handlers.js               # Command handlers (planned)
└── test/                     # Test files (planned)
```

## Frequently Asked Questions

### Q: What's the difference between `/status` and `/relay-test`?

- `/status`: Shows current connection status and API accessibility
- `/relay-test`: Tests relay server connectivity and response

### Q: Can I use this bot without a relay?

Yes, the bot works without a relay, but it's recommended for regions with connection issues.

### Q: How do I handle large files or media?

The bot includes support for file uploads and downloads through the Telegram API.

### Q: Can I add more commands?

Yes, extend the `handleCommand` function in `index.js` to add new commands.

### Q: What's the purpose of the relay?

The relay is designed to handle connection issues in regions with poor internet connectivity, providing automatic fallback when the main Telegram API is unavailable.

## Support

### Getting Help

1. **Check documentation**: Review this guide and other docs
2. **Bot support**: Contact bot developers through Telegram
3. **Repository issues**: File issues on GitHub repository
4. **Community forums**: Join relevant Telegram groups

### Reporting Issues

1. **Bug reports**: Include bot logs and error messages
2. **Feature requests**: Describe use case and requirements
3. **Relay problems**: Include relay URL and error details

## Conclusion

This setup guide provides comprehensive instructions for:

- Setting up your Telegram bot
- Configuring relay support
- Testing connectivity and functionality
- Troubleshooting common issues
- Maintaining the bot in production

Follow these steps carefully, and you'll have a fully-functional serverless Telegram bot ready for use in any environment, including those with challenging network conditions.

**Happy bot building!** 🤖

*Last updated: November 7, 2026
*Dependencies: node-telegram-bot-api, dotenv, node-fetch
*Version: 1. vétérinaire backup terminé! Team !*