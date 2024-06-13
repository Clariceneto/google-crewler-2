const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const logger = require('./logger');

function saveToJson(articles, filename) {
  fs.writeFileSync(filename, JSON.stringify(articles, null, 2));
  logger.info(`Data saved to ${filename}`);
}

async function saveToCsv(articlesByQuery, filename) {
  const csvWriter = createCsvWriter({
    path: filename,
    header: [
      { id: 'title', title: 'Title' },
      { id: 'authors', title: 'Authors' },
      { id: 'abstract', title: 'Abstract' },
      { id: 'link', title: 'Link' },
      { id: 'citationCount', title: 'Citations' },
      { id: 'publication', title: 'Publication' },
      { id: 'publisher', title: 'Publisher' },
      { id: 'date', title: 'Date' },
      { id: 'project', title: 'Project' }
    ]
  });

  let records = [];
  articlesByQuery.forEach((articles, index) => {
    records = records.concat(articles);
    if (index < articlesByQuery.length - 1) {
      records.push({ title: '', authors: '', abstract: '', link: '', citationCount: '', publication: '', publisher: '', date: '', project: '' });
      records.push({ title: '', authors: '', abstract: '', link: '', citationCount: '', publication: '', publisher: '', date: '', project: '' });
    }
  });

  await csvWriter.writeRecords(records);
  logger.info(`Data saved to ${filename}`);
}

async function saveToExcel(articlesByQuery, filename) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Articles');

  worksheet.columns = [
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Authors', key: 'authors', width: 30 },
    { header: 'Abstract', key: 'abstract', width: 50 },
    { header: 'Link', key: 'link', width: 30 },
    { header: 'Citations', key: 'citationCount', width: 10 },
    { header: 'Publication', key: 'publication', width: 20 },
    { header: 'Publisher', key: 'publisher', width: 20 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Project', key: 'project', width: 10 }
  ];

  articlesByQuery.forEach((articles, index) => {
    articles.forEach(article => worksheet.addRow(article));
    if (index < articlesByQuery.length - 1) {
      worksheet.addRow({});
      worksheet.addRow({});
    }
  });

  await workbook.xlsx.writeFile(filename);
  logger.info(`Data saved to ${filename}`);
}

async function saveToPdf(articlesByQuery, filename) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filename));

  articlesByQuery.forEach((articles, index) => {
    articles.forEach(article => {
      doc.fontSize(12).text(`Title: ${article.title}`);
      doc.fontSize(10).text(`Authors: ${article.authors}`);
      doc.fontSize(10).text(`Abstract: ${article.abstract}`);
      doc.fontSize(10).text(`Link: ${article.link}`);
      doc.fontSize(10).text(`Citations: ${article.citationCount}`);
      doc.fontSize(10).text(`Publication: ${article.publication}`);
      doc.fontSize(10).text(`Publisher: ${article.publisher}`);
      doc.fontSize(10).text(`Date: ${article.date}`);
      doc.fontSize(10).text(`Project: ${article.project}`);
      doc.moveDown();
    });
    if (index < articlesByQuery.length - 1) {
      doc.addPage();
    }
  });

  doc.end();
  logger.info(`Data saved to ${filename}`);
}


async function postToWebhook(url, data) {
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`Posted to webhook: ${response.status}`);
  } catch (error) {
    console.error(`Error posting to webhook: ${error.message}`);
  }
}


module.exports = {
  saveToJson,
  saveToCsv,
  saveToExcel,
  saveToPdf,
  postToWebhook
};
