const fs = require('fs');
const logger = require('./logger');

function generateReport(articlesByQuery) {
  let totalArticles = 0;
  let totalCitations = 0;
  let queryStats = [];

  articlesByQuery.forEach((articles, index) => {
    const numArticles = articles.length;
    const numCitations = articles.reduce((sum, article) => sum + article.citationCount, 0);
    totalArticles += numArticles;
    totalCitations += numCitations;
    queryStats.push({ query: index + 1, articles: numArticles, citations: numCitations });
  });

  const report = {
    totalArticles,
    totalCitations,
    queryStats
  };

  fs.writeFileSync('report.json', JSON.stringify(report, null, 2));
  logger.info('Detailed report generated in report.json');
}

module.exports = generateReport;
