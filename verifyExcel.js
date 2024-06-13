const ExcelJS = require('exceljs');

async function verifyExcel(filename) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filename);

  const worksheet = workbook.getWorksheet('Articles');
  worksheet.eachRow((row, rowNumber) => {
    console.log(`Row ${rowNumber}: ${row.values}`);
  });
}

verifyExcel('articles.xlsx')
  .then(() => {
    console.log('Verificação completa.');
  })
  .catch(error => {
    console.error(`Erro ao verificar o arquivo Excel: ${error.message}`);
  });
