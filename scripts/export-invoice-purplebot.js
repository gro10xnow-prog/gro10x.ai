const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function exportBothInvoiceVariants() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const filePath = path.resolve(__dirname, '..', 'public', 'invoice-purplebot.html');
    await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

    const distDir = path.resolve(__dirname, '..', 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    // Variant 1: 25,000 Base + 5% VAT (1,250) = 26,250 BDT
    await page.evaluate(() => {
      switchCalcMode('add_vat');
    });
    const pdfPath1 = path.join(distDir, 'INV-2026-004_Purplebot_Digital_26250BDT.pdf');
    await page.pdf({
      path: pdfPath1,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    console.log('✅ Generated Variant 1 (26,250 BDT):', pdfPath1);

    // Variant 2: Flat 25,000 BDT Total (VAT Inclusive: 23,810 + 1,190 = 25,000 BDT)
    await page.evaluate(() => {
      switchCalcMode('flat');
    });
    const pdfPath2 = path.join(distDir, 'INV-2026-004_Purplebot_Digital_25000BDT_Flat.pdf');
    await page.pdf({
      path: pdfPath2,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    console.log('✅ Generated Variant 2 (25,000 BDT Flat):', pdfPath2);

    // Also compile public/invoice-view.html to dist/INV-Universal-Viewer.pdf to verify
    const viewPage = await browser.newPage();
    const viewFilePath = path.resolve(__dirname, '..', 'public', 'invoice-view.html');
    await viewPage.goto('file:///' + viewFilePath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    const pdfPathUniversal = path.join(distDir, 'INV-Universal-Viewer.pdf');
    await viewPage.pdf({
      path: pdfPathUniversal,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    console.log('✅ Generated Universal Invoice Viewer PDF:', pdfPathUniversal);

  } catch (err) {
    console.error('Error generating PDFs:', err);
  } finally {
    await browser.close();
  }
}

exportBothInvoiceVariants();
