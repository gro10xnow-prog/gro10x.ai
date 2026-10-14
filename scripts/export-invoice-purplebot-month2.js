const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function exportPurplebotMonth2PDFs() {
  console.log('📄 Launching Puppeteer to compile Month 2 invoice PDFs...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const filePath = path.resolve(__dirname, '..', 'public', 'invoice-purplebot-month2.html');
    await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

    const distDir = path.resolve(__dirname, '..', 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    // Variant 1: 20,000 Base + 5% VAT (1,000) = 21,000 BDT
    await page.evaluate(() => {
      switchCalcMode('add_vat');
    });
    const pdfPath1 = path.join(distDir, 'INV-2026-012_Purplebot_Digital_Month2_21000BDT.pdf');
    await page.pdf({
      path: pdfPath1,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    console.log('✅ Generated Variant 1 (21,000 BDT Standard):', pdfPath1);

    // Variant 2: Flat 20,000 BDT Total (VAT Inclusive: 19,048 + 952 = 20,000 BDT)
    await page.evaluate(() => {
      switchCalcMode('flat');
    });
    const pdfPath2 = path.join(distDir, 'INV-2026-012_Purplebot_Digital_Month2_20000BDT_Flat.pdf');
    await page.pdf({
      path: pdfPath2,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    console.log('✅ Generated Variant 2 (20,000 BDT Flat):', pdfPath2);

  } catch (err) {
    console.error('Error generating PDFs:', err);
  } finally {
    await browser.close();
  }
}

exportPurplebotMonth2PDFs();
