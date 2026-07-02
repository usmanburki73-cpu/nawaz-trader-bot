require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const helmet = require('helmet');
const cors = require('cors');

const productSync = require('./services/product-sync');
const logger = require('./utils/logger');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'BOT_HEALTHY', timestamp: new Date() });
});

app.get('/api/bot/status', (req, res) => {
  res.json({
    status: 'RUNNING',
    uptime: process.uptime(),
    timestamp: new Date(),
    syncSchedule: process.env.SYNC_INTERVAL_MINUTES || 60,
    lastSync: global.lastSyncTime || null
  });
});

app.post('/api/bot/sync/trigger', async (req, res) => {
  try {
    logger.info('Manual sync triggered');
    const result = await productSync.syncProducts();
    res.json({ message: 'Sync triggered successfully', result });
  } catch (error) {
    logger.error('Manual sync failed:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

app.get('/api/bot/stats', (req, res) => {
  res.json({
    totalProductsSynced: global.syncStats?.totalProducts || 0,
    totalSuccessful: global.syncStats?.successful || 0,
    totalFailed: global.syncStats?.failed || 0,
    lastSyncTime: global.lastSyncTime || null,
    nextScheduledSync: global.nextScheduledSync || null
  });
});

const syncInterval = process.env.SYNC_INTERVAL_MINUTES || 60;
cron.schedule(`*/${syncInterval} * * * *`, async () => {
  try {
    logger.info(`Starting scheduled sync (every ${syncInterval} minutes)`);
    global.lastSyncTime = new Date();
    global.nextScheduledSync = new Date(Date.now() + syncInterval * 60000);
    const result = await productSync.syncProducts();
    logger.info('Scheduled sync completed successfully', result);
  } catch (error) {
    logger.error('Scheduled sync failed:', error);
  }
});

cron.schedule('0 */2 * * *', async () => {
  try {
    logger.info('Starting price update job');
    const result = await productSync.updatePrices();
    logger.info('Price update completed', result);
  } catch (error) {
    logger.error('Price update failed:', error);
  }
});

cron.schedule('*/30 * * * *', async () => {
  try {
    logger.info('Starting inventory sync');
    const result = await productSync.syncInventory();
    logger.info('Inventory sync completed', result);
  } catch (error) {
    logger.error('Inventory sync failed:', error);
  }
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  logger.info(`\n🚀 NAWAZ TRADER BOT - RUNNING ON PORT ${PORT}\n📊 Sync every ${syncInterval} minutes\n🔗 http://localhost:${PORT}\n`);
  logger.info('Available endpoints:');
  logger.info('GET    /health                 - Health check');
  logger.info('GET    /api/bot/status         - Bot status');
  logger.info('POST   /api/bot/sync/trigger   - Trigger manual sync');
  logger.info('GET    /api/bot/stats          - Sync statistics');
});

module.exports = app;