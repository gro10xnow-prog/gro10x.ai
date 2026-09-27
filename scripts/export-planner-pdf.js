/**
 * scripts/export-planner-pdf.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Automated Headless PDF Compiler for PlannerQueenGro (SKU: PLA-14)
 * 
 * Replaces the multi-hour PowerPoint compilation workflow.
 * Renders all 16 spreads in headless Chromium at 300 DPI vector clarity
 * and outputs a print-ready, high-resolution PDF bundle for Etsy delivery.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function exportPlannerPdf() {
  console.log('\n🚀 Starting Automated Headless PDF Compilation for PLA-14...');
  const startTime = Date.now();

  // Ensure dist output directory exists
  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const pdfOutputPath = path.join(distDir, 'PLA-14_PlannerQueenGro_Complete_16_Spreads.pdf');
  const mockupOutputPath = path.join(distDir, 'PLA-14_Cover_Mockup_Hero.png');

  const htmlPath = path.resolve(__dirname, '..', 'public', 'planner', 'index.html');
  const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;

  console.log(`📄 Loading HTML file directly: ${fileUrl}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Navigate to local planner file
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for dynamic builders to finish rendering
    await page.waitForSelector('#habitTableBody');
    await page.waitForSelector('#monthlyGrid');
    await page.waitForSelector('#dailyTimeline');

    // Force all 8 tab sections to display simultaneously for the PDF compiler
    await page.evaluate(() => {
      document.querySelectorAll('.tab-content').forEach(sec => {
        sec.style.display = 'block';
      });
      // Hide non-printable app bars
      document.querySelectorAll('.no-print').forEach(el => {
        el.style.display = 'none';
      });
    });

    // Capture Cover Hero Mockup Screenshot
    const coverElement = await page.$('#spread-1');
    if (coverElement) {
      await coverElement.screenshot({ path: mockupOutputPath, type: 'png' });
      console.log(`📸 Saved Cover Mockup -> ${mockupOutputPath}`);
    }

    // Capture Daily Spread Mockup Screenshot
    const dailyElement = await page.$('#spread-8');
    if (dailyElement) {
      const dailyPath = path.join(distDir, 'PLA-14_Daily_Execution_Spread.png');
      await dailyElement.screenshot({ path: dailyPath, type: 'png' });
      console.log(`📸 Saved Daily Spread Mockup -> ${dailyPath}`);
    }

    // Capture Habit Matrix Spread Mockup Screenshot
    const habitElement = await page.$('#spread-10');
    if (habitElement) {
      const habitPath = path.join(distDir, 'PLA-14_Habit_Matrix_Spread.png');
      await habitElement.screenshot({ path: habitPath, type: 'png' });
      console.log(`📸 Saved Habit Matrix Mockup -> ${habitPath}`);
    }

    // Emulate Print Media & Compile 16-Spread PDF
    console.log('🖨️ Compiling 16 vector print spreads to PDF (US Letter portrait)...');
    await page.emulateMediaType('print');

    await page.pdf({
      path: pdfOutputPath,
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.4in',
        bottom: '0.4in',
        left: '0.4in',
        right: '0.4in'
      }
    });

    const stats = fs.statSync(pdfOutputPath);
    const sizeKb = Math.round(stats.size / 1024);
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n==================================================`);
    console.log(`✅ SUCCESS: Complete 16-Spread PDF Compiled!`);
    console.log(`📁 File: ${pdfOutputPath}`);
    console.log(`📊 Size: ${sizeKb} KB`);
    console.log(`⚡ Duration: ${durationSec} seconds`);
    console.log(`💡 Zero PowerPoint required.`);
    console.log(`==================================================\n`);

  } catch (err) {
    console.error('❌ PDF Compilation Error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  exportPlannerPdf();
}

module.exports = { exportPlannerPdf };
