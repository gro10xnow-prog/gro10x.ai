const puppeteer = require('puppeteer');
const path = require('path');

async function compileAuditPdf() {
  console.log('🚀 Compiling Day-End Audit PDF via Chrome...');
  const htmlPath = path.resolve(__dirname, '..', 'public', 'reports', 'day-end-oct15-16.html');
  const pdfOutputPath = path.resolve(__dirname, '..', 'public', 'reports', 'day-end-oct15-16.pdf');
  const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.evaluate(() => {
      document.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');
    });

    await page.pdf({
      path: pdfOutputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        bottom: '12mm',
        left: '12mm',
        right: '12mm'
      }
    });

    console.log('✅ PDF Successfully Generated at:', pdfOutputPath);
  } finally {
    await browser.close();
  }
}

compileAuditPdf().catch(err => {
  console.error('❌ PDF compilation failed:', err);
  process.exit(1);
});
