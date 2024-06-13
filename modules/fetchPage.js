const puppeteer = require('puppeteer');
const { delay } = require('./utils');
const logger = require('./logger');

async function fetchPage(url, config) {
  const chromePath = process.env.CHROME_PATH || config.chromePath;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const browser = await puppeteer.launch({
        executablePath: chromePath
      });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });

      const content = await page.content();
      await browser.close();

      return content;
    } catch (error) {
      if (attempt === config.maxRetries) {
        logger.error(`Error fetching the page after ${attempt} attempts: ${error.message}`);
        throw error;
      } else {
        logger.warn(`Attempt ${attempt} failed: ${error.message}. Retrying...`);
        await delay(config.retryDelay);
      }
    }
  }
}

module.exports = fetchPage;
