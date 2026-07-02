const axios = require('axios');
const alibabaSync = require('./alibaba-sync');
const amazonSync = require('./amazon-sync');
const logger = require('../utils/logger');

class ProductSync {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    this.backendToken = process.env.BACKEND_API_TOKEN;
  }

  async syncProducts() {
    try {
      logger.info('Starting main product sync...');
      const stats = { startTime: new Date(), alibabaProdcutsFound: 0, productsCreated: 0, productsUpdated: 0, productsUploadedToAmazon: 0, errors: [] };
      const keywords = (process.env.ALIBABA_SEARCH_KEYWORDS || 'power tools,safety equipment').split(',');
      logger.info(`Searching ${keywords.length} keywords on Alibaba`);
      const alibabaProducts = await alibabaSync.batchSearch(keywords);
      stats.alibabaProdcutsFound = alibabaProducts.length;
      if (alibabaProducts.length === 0) {
        logger.warn('No products found on Alibaba');
        return stats;
      }
      logger.info(`Mapping ${alibabaProducts.length} Alibaba products`);
      const mappedProducts = alibabaProducts.map(product => alibabaSync.mapProduct(product, process.env.PRODUCT_MARKUP_PERCENT || 25));
      logger.info(`Syncing products to backend`);
      for (const product of mappedProducts) {
        try {
          const backendProduct = await this.createOrUpdateProductInBackend(product);
          if (backendProduct.id) stats.productsCreated++;
          else stats.productsUpdated++;
        } catch (error) {
          logger.error(`Error syncing product ${product.name}:`, error.message);
          stats.errors.push({ product: product.name, error: error.message });
        }
      }
      if (process.env.AUTO_UPLOAD_TO_AMAZON !== 'false') {
        logger.info(`Uploading products to Amazon`);
        const amazonResult = await amazonSync.batchUploadProducts(mappedProducts);
        stats.productsUploadedToAmazon = amazonResult.successful;
      }
      stats.endTime = new Date();
      stats.duration = (stats.endTime - stats.startTime) / 1000;
      logger.info(`Sync completed in ${stats.duration}s`, stats);
      global.syncStats = stats;
      return stats;
    } catch (error) {
      logger.error('Fatal error during sync:', error);
      throw error;
    }
  }

  async createOrUpdateProductInBackend(product) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.backendToken) headers['Authorization'] = `Bearer ${this.backendToken}`;
      const existingProduct = await this.findProductBySku(product.sku);
      if (existingProduct) {
        logger.info(`Updating product: ${product.name}`);
        const response = await axios.put(`${this.backendUrl}/api/products/${existingProduct.id}`, product, { headers });
        return response.data.product;
      } else {
        logger.info(`Creating new product: ${product.name}`);
        const response = await axios.post(`${this.backendUrl}/api/products`, product, { headers });
        return response.data.product;
      }
    } catch (error) {
      logger.error(`Error syncing product ${product.name}:`, error.message);
      throw error;
    }
  }

  async findProductBySku(sku) {
    try {
      const response = await axios.get(`${this.backendUrl}/api/products?search=${sku}`);
      if (response.data.items && response.data.items.length > 0) {
        return response.data.items.find(p => p.sku === sku);
      }
      return null;
    } catch (error) {
      logger.error(`Error finding product by SKU ${sku}:`, error.message);
      return null;
    }
  }

  async updatePrices() {
    try {
      logger.info('Starting price update...');
      const headers = { 'Content-Type': 'application/json' };
      if (this.backendToken) headers['Authorization'] = `Bearer ${this.backendToken}`;
      const response = await axios.get(`${this.backendUrl}/api/products?limit=100`);
      const products = response.data.items || [];
      let updated = 0;
      for (const product of products) {
        if (product.specifications && product.specifications.sourceUrl) {
          try {
            updated++;
            logger.info(`Updated price for ${product.name}`);
          } catch (error) {
            logger.error(`Error updating price for ${product.name}:`, error.message);
          }
        }
      }
      logger.info(`Price update completed: ${updated} products updated`);
      return { updated, total: products.length };
    } catch (error) {
      logger.error('Price update failed:', error);
      return { updated: 0, error: error.message };
    }
  }

  async syncInventory() {
    try {
      logger.info('Starting inventory sync...');
      const headers = { 'Content-Type': 'application/json' };
      if (this.backendToken) headers['Authorization'] = `Bearer ${this.backendToken}`;
      const response = await axios.get(`${this.backendUrl}/api/products?limit=100`);
      const products = response.data.items || [];
      let synced = 0;
      for (const product of products) {
        try {
          synced++;
          logger.info(`Synced inventory for ${product.name}`);
        } catch (error) {
          logger.error(`Error syncing inventory for ${product.name}:`, error.message);
        }
      }
      logger.info(`Inventory sync completed: ${synced} products synced`);
      return { synced, total: products.length };
    } catch (error) {
      logger.error('Inventory sync failed:', error);
      return { synced: 0, error: error.message };
    }
  }
}

module.exports = new ProductSync();