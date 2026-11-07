# Serverless Telegram Bot Deployment Guide

This guide explains how to deploy your serverless Telegram bot to production.

## Overview

Your bot is now in **serverless mode** with webhook support for production deployment.

## Quick Start

### 1. Prepare Environment
```bash
# Navigate to project directory
cd /path/to/serverless-telegram-bot

# Install dependencies
npm install

# Set up environment variables
# Edit .env file with production values
```

### 2. Test Locally
```bash
# Test the bot locally
npm start

# Check health status
npm run health
```

### 3. Deploy to Production
```bash
# For local/SSH deployment
./deploy.sh

# For Docker deployment
# See docker-deployment.md for details
```

## Serverless Platforms Support

### 1. Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
# TELEGRAM_BOT_TOKEN
# TELEGRAM_CHAT_ID
# RELAY_URL
# WEBHOOK_URL
```

### 2. Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy to Netlify
netlify deploy --prod

# Configure serverless functions
# webhook-function.js (or similar)
```

### 3. AWS Lambda
```bash
# Use Serverless Framework or AWS Console
# Configure Lambda function with environment variables
# Set up API Gateway for webhook endpoint
```

### 4. Google Cloud Functions
```bash
# Deploy using gcloud
# gcloud functions deploy telegram-bot
```

## Environment Variables

Required environment variables for production:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id
RELAY_URL=https://relay.mrez321.ir
WEBHOOK_URL=https://your-domain.com/webhook
DEBUG_MODE=false
RETRY_ATTEMPTS=5
RETRY_DELAY=2000
TIMEOUT=10000
```

Optional environment variables:

```env
DEBUG_MODE=true  # Enable debug logging
```

## Configuration

### Webhook Configuration
```bash
# Set webhook URL
# This should point to your deployed serverless function
# Example: https://your-domain.com/webhook
```

### Telegram Bot Settings
```bash
# Set allowed updates
# Message: true
# CallbackQuery: true
# EditedMessage: true
```

## Testing

### Local Testing
```bash
# Test bot functionality
node serverless-bot.js

# Check health endpoint
curl https://your-domain.com/health
```

### Production Testing
```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id":123,"message":{"chat":{"id":123456},"text":"/start"}}'
```

## Monitoring

### Health Check
```bash
# Check bot health
curl https://your-domain.com/health
```

### Log Monitoring
```bash
# Check application logs
# Platform-specific (Vercel, AWS, etc.)
```

## Troubleshooting

### Common Issues

**Issue: Webhook not receiving updates**
- Solution: Verify webhook URL is correct
- Check that Telegram bot webhook is set up

**Issue: Bot not responding**
- Solution: Check environment variables
- Verify webhook configuration

**Issue: API timeouts**
- Solution: Increase timeout values
- Check network connectivity

### Debugging
```bash
# Enable debug logging
DEBUG_MODE=true

# Check application logs
# Platform-specific logging commands
```

## Security

### Environment Variables Security
```bash
# Restrict access to .env file
chmod 600 .env

# Add .env to .gitignore
# .env
```

### Webhook Security
```bash
# Use HTTPS for webhook URLs
# Implement authentication if needed
# Rate limiting for webhook endpoint
```

## Deployment Checklist

### Before Deployment:
- [ ] Update `.env` with production values
- [ ] Test locally
- [ ] Set up monitoring
- [ ] Configure security settings
- [ ] Deploy to production

### After Deployment:
- [ ] Verify webhook setup
- [ ] Test all bot commands
- [ ] Check health status
- [ ] Monitor performance
- [ ] Set up alerts

## Updating and Maintenance

### Code Updates
```bash
# Update code
git pull origin main

# Install dependencies
npm install

# Restart bot
npm start
```

### Configuration Updates
```bash
# Update environment variables
# Restart bot
```

### Database Changes
```bash
# Update any database configuration
# Test functionality
# Deploy changes
```

## Support and Resources

### Documentation
- **Bot Documentation**: README.md
- **Architecture**: agents.md
- **Deployment**: DEPLOY.md
- **API Reference**: docs/api-reference.md

### Support
- **Issues**: GitHub issues
- **Community**: Telegram bot community
- **Monitoring**: Platform-specific monitoring tools

## Conclusion

Your serverless Telegram bot is now ready for production deployment! This version:

✅ **Supports webhooks** for serverless deployment  
✅ **Includes relay functionality** for connection issues  
✅ **Provides retry logic** for robust error handling  
✅ **Supports all bot commands** (`/start`, `/help`, `/status`, `/relay-test`)  
✅ **Includes complete documentation** for all deployment scenarios  

**Deploy your bot and start handling connection issues with confidence!**

*Last updated: November 7, 2026*
*Version: 1.0.0*
*Dependencies: dotenv, node-fetch*