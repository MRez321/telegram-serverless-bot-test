# Serverless Telegram Bot - Deployment and Operations Guide

This guide provides comprehensive instructions for deploying, operating, and maintaining the serverless Telegram bot in various environments.

## Deployment Environments

### 1. Local Development Environment

**Purpose**: Development and testing of the bot

**Setup**:
```bash
# Navigate to project directory
cd /path/to/serverless-telegram-bot

# Install dependencies
npm install

# Run in development mode
npm run dev
```

**Features**:
- Real-time logging
- Debug mode enabled
- Automatic restart on file changes (if using nodemon)
- Detailed error output

### 2. Production Environment

**Purpose**: Production deployment with optimal performance

**Setup**:
```bash
# Build for production
npm install --production

# Run in production mode
npm start
```

**Configuration**:
- Debug mode disabled
- Optimized for performance
- Production environment variables
- Proper logging configuration

## Environment Configuration

### Local Development (.env)

```bash
# Bot Configuration
TELEGRAM_BOT_TOKEN=9012178502:AAEoWfRcY-0RQgQjBGCE9neqBxNHkGW45BE
TELEGRAM_CHAT_ID=196677256
RELAY_URL=https://relay.mrez321.ir

# Retry Configuration
RETRY_ATTEMPTS=3
RETRY_DELAY=1000
TIMEOUT=5000

# Logging
DEBUG_MODE=true
```

### Production (.env.production)

```bash
# Bot Configuration
TELEGRAM_BOT_TOKEN=your_production_bot_token_here
TELEGRAM_CHAT_ID=your_production_chat_id
RELAY_URL=https://relay.mrez321.ir

# Production Settings
RETRY_ATTEMPTS=5
RETRY_DELAY=2000
TIMEOUT=10000
DEBUG_MODE=false
```

## Deployment Methods

### 1. Local/Server Deployment

**Steps**:
1. Copy `.env.example` to `.env`
2. Update environment variables
3. Install dependencies: `npm install`
4. Start the bot: `npm start`

**File Locations**:
- Bot code: `index.js`
- Configuration: `.env` file
- Logs: Console output (can be redirected)

### 2. Docker Deployment

**Dockerfile**:
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["node", "index.js"]
```

**Usage**:
```bash
docker build -t serverless-telegram-bot .
docker run -e TELEGRAM_BOT_TOKEN=... -e TELEGRAM_CHAT_ID=... serverless-telegram-bot
```

### 3. Cloud Platform Deployment

#### AWS Lambda

**Requirements**:
- Lambda function with Node.js runtime
- Environment variables configured
- API Gateway for HTTP access

**deployment.toml**:
```toml
toolchain.target = "x86_64-unknown-linux-gnu"

[environment]
TELEGRAM_BOT_TOKEN = "${TELEGRAM_BOT_TOKEN}"
TELEGRAM_CHAT_ID = "${TELEGRAM_CHAT_ID}"
RELAY_URL = "${RELAY_URL}"
```

## Monitoring and Observability

### 1. Log Monitoring

**Log Sources**:
- Console output (bot logs)
- Error logs
- Performance logs

**Log Format**:
```
[2026-11-07T12:00:00.000Z] INFO: Bot started successfully
[2026-11-07T12:00:01.000Z] INFO: Attempting to send via Main Telegram API...
[2026-11-07T12:00:02.000Z] INFO: Message sent successfully via Main Telegram API
[2026-11-07T12:00:03.000Z] ERROR: Failed to send via Relay Server: Connection timeout
[2026-11-07T12:00:04.000Z] INFO: Attempting to send via Fallback Relay...
```

### 2. Health Checks

**Health Check Endpoint**:
```javascript
// Health check function for external monitoring
async function healthCheck() {
  const status = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    apiAccessible: await checkUrlAccessibility('https://api.telegram.org'),
    relayAccessible: await checkUrlAccessibility(config.relayUrl),
    lastMessage: lastMessageTime
  };
  
  return status;
}
```

### 3. Performance Metrics

**Key Metrics**:
- **Message Processing Rate**: Messages per minute
- **Success Rate**: Percentage of successful API calls
- **Response Time**: Average time for API calls
- **Relay Usage**: Frequency of relay fallback usage

**Example Metrics Collection**:
```javascript
const metrics = {
  messagesProcessed: 0,
  apiCalls: 0,
  successfulCalls: 0,
  relayUsage: 0,
  errorCount: 0,
  startTime: Date.now(),
  
  recordEvent(type, success = false, usedRelay = false) {
    this[type]++;
    if (success) {
      this.successfulCalls++;
    }
    if (usedRelay) {
      this.relayUsage++;
    }
  },
  
  getStats() {
    const uptime = Date.now() - this.startTime;
    return {
      uptime: `${Math.floor(uptime / 1000)}s`,
      successRate: this.apiCalls > 0 ? (this.successfulCalls / this.apiCalls * 100).toFixed(2) : 0,
      relayUsageRate: this.apiCalls > 0 ? (this.relayUsage / this.apiCalls * 100).toFixed(2) : 0
    };
  }
};
```

## Maintenance Operations

### 1. Daily Maintenance

**Tasks**:
1. **Check Logs**: Review recent logs for errors
2. **Monitor Health**: Check bot status and connectivity
3. **Test Relay**: Verify relay server accessibility
4. **Update Dependencies**: Check for updates to dependencies

**Commands**:
```bash
# Check recent logs
tail -f bot.log

# Monitor bot status
curl http://localhost:health

# Test relay connectivity
curl ${RELAY_URL}/health
```

### 2. Weekly Maintenance

**Tasks**:
1. **Review Performance**: Analyze metrics and trends
2. **Update Configuration**: Review and update configuration if needed
3. **Backup**: Backup configuration and logs
4. **Security Review**: Review access and permissions

### 3. Monthly Maintenance

**Tasks**:
1. **Rotates Tokens**: Update bot token if needed
2. **Review Logs**: Analyze logs for patterns and issues
3. **Update Documentation**: Update documentation as needed
4. **Performance Tuning**: Optimize configuration for performance

## Security Operations

### 1. Token Security

**Best Practices**:
- **Environment Variables**: Store tokens in environment variables
- **Access Control**: Restrict access to configuration files
- **Regular Rotation**: Change bot tokens periodically
- **Audit Logs**: Monitor token usage and access

**Commands**:
```bash
# Set secure permissions on .env
chmod 600 .env

# Add to .gitignore
. env
.env.local
```

### 2. Access Control

**Recommendations**:
- **File Permissions**: Restrict access to sensitive files
- **Network Security**: Use firewalls and VPNs
- **Monitoring**: Monitor access logs and unusual activity
- **Backup Security**: Encrypt backup files

## Backup and Recovery

### 1. Backup Strategy

**Backup Files**:
- `.env` file (configuration)
- `package.json` (dependencies)
- Logs and metrics

**Backup Commands**:
```bash
# Create backup directory
mkdir -p backups

# Backup configuration
cp .env backups/env_$(date +%Y%m%d_%H%M%S)

# Backup dependencies
cp package.json backups/

# Backup logs
cp bot.log backups/bot_log_$(date +%Y%m%d)
```

### 2. Recovery Procedure

**Steps**:
1. **Restore Configuration**: Restore `.env` file from backup
2. **Verify Environment**: Ensure all environment variables are set
3. **Test Bot**: Start bot and test functionality
4. **Monitor**: Monitor bot for any issues

## Troubleshooting Guide

### 1. Common Issues and Solutions

**Issue**: Bot not responding
**Solution**:
1. Check if bot is running: `ps aux | grep index.js`
2. Check logs: `tail -f bot.log`
3. Verify environment variables: `cat .env`
4. Test connectivity: `curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`

**Issue**: Relay server not accessible
**Solution**:
1. Check relay URL in `.env` file
2. Test relay directly: `curl ${RELAY_URL}/health`
3. Try alternative relay URL
4. Check relay server status

**Issue**: Too many errors
**Solution**:
1. Check bot logs for error patterns
2. Verify retry configuration
3. Test API connectivity
4. Consider increasing retry attempts

### 2. Debugging Commands

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

## Deployment Checklist

### Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Configuration files validated
- [ ] Testing completed
- [ ] Logs reviewed
- [ ] Security settings verified

### Post-Deployment Checklist

- [ ] Bot started successfully
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Documentation updated
- [ ] Backup procedures tested

## Conclusion

This deployment and operations guide provides comprehensive instructions for:

1. **Deploying** the bot in various environments
2. **Monitoring** bot performance and health
3. **Maintaining** the bot in production
4. **Troubleshooting** common issues
5. **Backing up** and recovering from failures

Follow these guidelines to ensure reliable, secure, and efficient operation of your serverless Telegram bot.

**Important Note**: Always test your deployment thoroughly before moving to production. Use different environments for development, testing, and production to ensure smooth operation.

*Last updated: November 7, 2026
*Version: 1.0
*Dependencies: node-telegram-bot-api, dotenv, node-fetch*