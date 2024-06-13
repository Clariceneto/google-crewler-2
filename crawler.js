require('dotenv').config();
const fs = require('fs');
const cheerio = require('cheerio');
const { Command } = require('commander');
const { saveToJson, saveToCsv, saveToExcel, saveToPdf, postToWebhook } = require('./modules/saveData');
const generateReport = require('./modules/generateReport');
const fetchPage = require('./modules/fetchPage');
const extractData = require('./modules/extractData');
const logger = require('./modules/logger');
const { delay } = require('./modules/utils');

// Load configuration
function loadConfig(file) {
  if (file && fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  }
  return JSON.parse(fs.readFileSync('config.json', 'utf-8'));
}

// Handle pagination
async function fetchAllPages(query, config, amount, citationFilter) {
  let pageNumber = 0;
  let articles = [];
  let url = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;

  while (pageNumber < config.maxPages && articles.length < amount) {
    try {
      const html = await fetchPage(url, config);
      const newArticles = await extractData(html);
      articles = articles.concat(newArticles.filter(article => article.citationCount >= citationFilter));
      
      if (articles.length >= amount) {
        articles = articles.slice(0, amount);
        break;
      }

      const $ = cheerio.load(html);
      const nextPageLink = $('td a.gs_nma').last().attr('href');
      if (!nextPageLink) break;

      url = `https://scholar.google.com${nextPageLink}`;
      pageNumber++;

      await delay(config.delayBetweenRequests);
    } catch (error) {
      logger.error(`Error processing page ${pageNumber}: ${error.message}`);
      break;
    }
  }

  return articles;
}

// Main function
async function main(options) {
  const config = loadConfig(options.config_file);
  const queries = options.search.split(',').map(query => query.trim());
  const amount = options.amount;
  const citationFilter = options.citation_filter || 0;
  const webhookUrl = options.webhook_url || 'http://localhost:5678/webhook-test/ssm-twitter-in';
  let allArticles = [];
  let articlesByQuery = [];

  for (const query of queries) {
    logger.info(`Searching articles for query: ${query}`);
    const articles = await fetchAllPages(query, config, amount, citationFilter);
    allArticles = allArticles.concat(articles);
    articlesByQuery.push(articles);
  }

  if (options.output.endsWith('.json')) {
    saveToJson(allArticles, options.output);
  } else if (options.output.endsWith('.csv')) {
    await saveToCsv(articlesByQuery, options.output);
  } else if (options.output.endsWith('.xlsx')) {
    await saveToExcel(articlesByQuery, options.output);
  } else if (options.output.endsWith('.pdf')) {
    await saveToPdf(articlesByQuery, options.output);
  }

  if (webhookUrl) {
    try {
      await postToWebhook(webhookUrl, allArticles);
    } catch (error) {
      logger.error(`Error posting to webhook: ${error.message}`);
      logger.debug(error.response ? error.response.data : 'No response data');
    }
  }

  generateReport(articlesByQuery);
}

const program = new Command();

program
  .version('1.0.0')
  .description('Google Scholar Crawler')
  .requiredOption('-n, --amount <number>', 'Number of results to fetch', parseInt)
  .requiredOption('-t, --time-period <hours>', 'Number of hours back to search', parseInt)
  .requiredOption('-s, --search <query>', 'Search query')
  .option('-w, --webhook_url <url>', 'Webhook URL to post results', 'http://localhost:5678/webhook-test/ssm-twitter-in')
  .requiredOption('-o, --output <file>', 'Output file for the resulting data')
  .option('-v, --verbose', 'Enable verbose mode')
  .option('-c, --config_file <file>', 'Configuration file')
  .option('-i, --citation_filter <number>', 'Filter articles with less than specified citations', parseInt)
  .parse(process.argv);

const options = program.opts();

if (options.verbose) {
  logger.transports[0].level = 'debug';
}

main(options);
