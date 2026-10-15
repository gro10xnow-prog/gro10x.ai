/**
 * scripts/generate-denmark-proposal-pdf.js
 * Generates an executive A4 PDF from public/denmark-foodtech-proposal.html
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePdf() {
  console.log('🚀 Starting Executive PDF Compilation for Denmark Food-Tech Proposal...');
  
  const htmlPath = path.resolve(__dirname, '..', 'public', 'denmark-foodtech-proposal.html');
  const pdfOutputPath = path.resolve(__dirname, '..', 'public', 'denmark-foodtech-proposal.pdf');
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

    // Hide print buttons
    await page.evaluate(() => {
      document.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');
    });

    await page.pdf({
      path: pdfOutputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });

    console.log(`✅ PDF successfully generated at: ${pdfOutputPath}`);
    const stats = fs.statSync(pdfOutputPath);
    console.log(`📦 PDF File Size: ${(stats.size / 1024).toFixed(1)} KB`);
  } catch (err) {
    console.error('❌ PDF Generation failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generatePdf();
