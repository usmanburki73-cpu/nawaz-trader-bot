# 🚀 Nawaz Trader Bot Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Bot
```bash
npm start
```

## Configuration

### Alibaba Credentials
1. Go to https://www.alibaba.com
2. Login to seller account
3. Get API keys from settings
4. Add to `.env`:
```env
ALIBABA_API_KEY=xxx
ALIBABA_API_SECRET=xxx
```

### Amazon Credentials
1. Go to https://sellercentral.amazon.com
2. Create SP-API credentials
3. Add to `.env`:
```env
AMAZON_ACCESS_KEY=xxx
AMAZON_SECRET_KEY=xxx
AMAZON_SELLER_ID=xxx
```

### Search Keywords
```env
ALIBABA_SEARCH_KEYWORDS=power drill,safety helmet,copper pipe
```

### Product Markup
```env
PRODUCT_MARKUP_PERCENT=25  # 25% markup
```

## Testing Locally

```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Start bot
npm start

# Terminal 3: Test endpoints
curl http://localhost:5001/health
curl http://localhost:5001/api/bot/status
curl -X POST http://localhost:5001/api/bot/sync/trigger
```

## Docker Deployment

```bash
docker-compose up -d
```

## GitHub Actions Setup

1. Go to Repository → Settings → Secrets
2. Add these secrets:
   - ALIBABA_API_KEY
   - ALIBABA_API_SECRET
   - AMAZON_ACCESS_KEY
   - AMAZON_SECRET_KEY
   - AMAZON_SELLER_ID
   - BACKEND_URL
   - BACKEND_API_TOKEN
   - ALIBABA_SEARCH_KEYWORDS

3. Workflow runs automatically hourly

## Troubleshooting

### Bot not starting?
- Check `.env` file exists
- Verify Node.js version: `node --version`
- Check logs: `tail -f logs/errors.log`

### Sync not working?
- Verify backend is running
- Check API credentials
- Review error logs

### Docker issues?
```bash
docker logs nawaz-trader-bot
docker-compose logs -f
```

## Support

Email: support@nawaztrader.com
Phone: +258 123 456 789

---

**Bot is ready! 🎉**