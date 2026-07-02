const axios = require('axios');
const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

class AlibabaSync {
  constructor() {
    this.baseUrl = 'https://www.alibaba.com/trade/search';
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: process.env.HEADLESS_MODE !== 'false',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async searchProducts(keyword, page = 1) {
    try {
      logger.info(`Searching Alibaba for: ${keyword}`);
      const browser = await this.initBrowser();
      const pageObj = await browser.newPage();
      await pageObj.setViewport({ width: 1280, height: 720 });
      await pageObj.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      const searchUrl = `${this.baseUrl}?SearchText=${encodeURIComponent(keyword)}&page=${page}`;
      await pageObj.goto(searchUrl, { waitUntil: 'networkidle2' });
      await pageObj.waitForSelector('[data-product-id]', { timeout: 10000 }).catch(() => {
        logger.warn('Product selector not found, using fallback');
      });
      const products = await pageObj.evaluate(() => {
        const items = [];
        document.querySelectorAll('[data-product-id], .organic-list-offer').forEach(el => {
          try {
            const productId = el.getAttribute('data-product-id') || el.getAttribute('data-id');
            const name = el.querySelector('h2, [class*="title"]')?.textContent?.trim();
            const priceText = el.querySelector('[class*="price"]')?.textContent?.trim();
            const imageUrl = el.querySelector('img')?.src;
            const supplierUrl = el.querySelector('a')?.href;
            if (name && priceText) {
              items.push({ productId, name, price: parseFloat(priceText.replace(/[^0-9.]/g, '')), imageUrl, supplierUrl });
            }
          } catch (e) {
            console.error('Error parsing product', e);
          }
        });
        return items;
      });
      await pageObj.close();
      logger.info(`Found ${products.length} products for: ${keyword}`);
      return products;
    } catch (error) {
      logger.error(`Error searching Alibaba for ${keyword}:`, error);
      return [];
    }
  }

  async batchSearch(keywords) {
    try {
      logger.info(`Batch searching ${keywords.length} keywords`);
      const allProducts = [];
      for (const keyword of keywords) {
        const products = await this.searchProducts(keyword);
        allProducts.push(...products);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
      }
      logger.info(`Batch search completed. Total products: ${allProducts.length}`);
      return allProducts;
    } catch (error) {
      logger.error('Batch search failed:', error);
      return [];
    }
  }

  mapProduct(alibabaProduct, markup = 25) {
    const alibabaSrcPrice = alibabaProduct.price || 0;
    const markupMultiplier = 1 + (markup / 100);
    const sellPrice = Math.round(alibabaSrcPrice * markupMultiplier * 100) / 100;
    return {
      name: alibabaProduct.name,
      description: `Imported from Alibaba - Original Price: $${alibabaSrcPrice}`,
      price: sellPrice,
      category: this.determineCategoryFromName(alibabaProduct.name),
      brand: 'Imported',
      sku: `ALI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stock: alibabaProduct.minOrder || 1,
      image: alibabaProduct.imageUrl || 'https://via.placeholder.com/500x500?text=Product',
      specifications: { sourceUrl: alibabaProduct.supplierUrl, sourcePrice: alibabaSrcPrice, markupPercent: markup },
      weight: 1.0,
      rating: 0,
      reviews: 0
    };
  }

  determineCategoryFromName(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('drill') || lowerName.includes('saw') || lowerName.includes('tool')) return 'Power Tools';
    if (lowerName.includes('helmet') || lowerName.includes('safety')) return 'Safety';
    if (lowerName.includes('pipe') || lowerName.includes('plumb')) return 'Plumbing';
    if (lowerName.includes('light') || lowerName.includes('led') || lowerName.includes('electric')) return 'Electrical';
    if (lowerName.includes('sink') || lowerName.includes('sanitary')) return 'Sanitary';
    return 'Materials';
  }
}

module.exports = new AlibabaSync();