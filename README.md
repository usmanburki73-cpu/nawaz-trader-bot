# 🤖 Nawaz Trader Bot - Automated E-Commerce Sync

**Automated bot for syncing products between Alibaba and Amazon using Node.js**

## Features

✨ **Automatic Product Discovery** - Search Alibaba, batch import products
🔄 **Intelligent Sync** - Auto-sync to your backend, upload to Amazon
💰 **Price Management** - Automatic markup calculation, dynamic price updates
📦 **Inventory Management** - Real-time stock synchronization
⏰ **Scheduled Execution** - Custom schedules, GitHub Actions automation
📊 **Monitoring** - Detailed statistics, error logging

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/usmanburki73-cpu/nawaz-trader-bot.git
cd nawaz-trader-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
ALIBABA_API_KEY=your_key
AMAZON_ACCESS_KEY=your_key
BACKEND_URL=http://localhost:5000
SYNC_INTERVAL_MINUTES=60
```

### 4. Start the Bot
```bash
npm start
```

## Usage

```bash
# Health check
curl http://localhost:5001/health

# Bot status
curl http://localhost:5001/api/bot/status

# Trigger manual sync
curl -X POST http://localhost:5001/api/bot/sync/trigger

# View statistics
curl http://localhost:5001/api/bot/stats
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/bot/status` - Bot status
- `POST /api/bot/sync/trigger` - Trigger sync
- `GET /api/bot/stats` - View statistics

## Scheduled Tasks

- **Product Sync** - Every 60 minutes (configurable)
- **Price Update** - Every 2 hours
- **Inventory Sync** - Every 30 minutes

## GitHub Actions

1. Go to Repository → Settings → Secrets
2. Add secrets: `ALIBABA_API_KEY`, `AMAZON_ACCESS_KEY`, etc.
3. Workflow runs automatically hourly

## Docker

```bash
docker build -t nawaz-bot .
docker-compose up -d
```

## License

MIT License - See LICENSE file

---

**Made with ❤️ by Nawaz Trader**