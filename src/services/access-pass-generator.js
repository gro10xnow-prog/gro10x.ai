/**
 * src/services/access-pass-generator.js
 * Generates branded 1-page Customer Access & Anti-Piracy License Pass PDF.
 * Pure Node.js implementation without external binary dependencies.
 */

function hexToRgbRatio(hex, fallback = { r: 0.545, g: 0.353, b: 0.478 }) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    return fallback;
  }
  try {
    let clean = hex.slice(1);
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return {
      r: Number.isNaN(r) ? fallback.r : Number(r.toFixed(3)),
      g: Number.isNaN(g) ? fallback.g : Number(g.toFixed(3)),
      b: Number.isNaN(b) ? fallback.b : Number(b.toFixed(3))
    };
  } catch (e) {
    return fallback;
  }
}

function escapePdfText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 100);
}

function generateAccessPassPdf({
  brandName = 'PlannerQueenGro',
  productName = 'Digital Planner & Life Tracker',
  productCode = 'PLA-01',
  licenseId = '',
  canvaTemplateUrl = '',
  notionTemplateUrl = '',
  downloadUrl = '',
  palette = ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'],
  version = '1.0'
}) {
  const primaryRgb = hexToRgbRatio(palette[0], { r: 0.545, g: 0.353, b: 0.478 });
  const secondaryRgb = hexToRgbRatio(palette[2] || '#7D9B76', { r: 0.49, g: 0.608, b: 0.463 });
  const lic = licenseId || `GRO-LIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const stream = [];

  // Page background: Soft Warm Cream
  stream.push('0.985 0.975 0.965 rg');
  stream.push('0 0 612 792 re f');

  // Outer decorative border
  stream.push('0.88 0.85 0.82 RG 1 w');
  stream.push('24 24 564 744 re S');

  // Top Header Banner
  stream.push(`${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b} rg`);
  stream.push('36 676 540 80 re f');

  // Header Title & Subtitle
  stream.push('BT /F1 20 Tf 1 1 1 rg 54 722 Td (' + escapePdfText(brandName.toUpperCase()) + ') Tj ET');
  stream.push('BT /F1 10.5 Tf 0.94 0.94 0.94 rg 54 698 Td (OFFICIAL CUSTOMER ACCESS & ANTI-PIRACY LICENSE PASS) Tj ET');

  // Product Name & SKU Card
  stream.push('BT /F1 15 Tf 0.12 0.12 0.12 rg 54 640 Td (' + escapePdfText(productName) + ') Tj ET');
  stream.push('BT /F2 9.5 Tf 0.4 0.4 0.4 rg 54 622 Td (SKU: ' + escapePdfText(productCode) + '  |  Version: v' + escapePdfText(version) + '  |  License ID: ' + escapePdfText(lic) + ') Tj ET');

  // Divider line
  stream.push('0.85 0.85 0.85 RG 1 w 54 606 m 558 606 l S');

  // Section 1: Access Instructions
  stream.push('BT /F1 11.5 Tf 0.15 0.15 0.15 rg 54 582 Td (HOW TO ACCESS & USE YOUR DIGITAL PRODUCT) Tj ET');
  stream.push('BT /F2 9.5 Tf 0.28 0.28 0.28 rg 54 562 Td (1. Use the secure access buttons and links below to download your master PDF files or open Canva templates.) Tj ET');
  stream.push('BT /F2 9.5 Tf 0.28 0.28 0.28 rg 54 546 Td (2. Import into GoodNotes, Notability, Samsung Notes, or print at home on standard US Letter / A4 paper.) Tj ET');
  stream.push('BT /F2 9.5 Tf 0.28 0.28 0.28 rg 54 530 Td (3. For digital tablet use: select read-only mode to activate hyperlinked tabs and navigation.) Tj ET');

  // Section 2: Interactive Links
  let yPos = 480;

  if (canvaTemplateUrl) {
    stream.push('0.92 0.95 0.99 rg 54 ' + (yPos - 48) + ' 504 50 re f');
    stream.push('0.15 0.45 0.85 RG 1.2 w 54 ' + (yPos - 48) + ' 504 50 re S');
    stream.push('BT /F1 11 Tf 0.1 0.35 0.75 rg 70 ' + (yPos - 22) + ' Td (CANVA MASTER EDITABLE TEMPLATE ACCESS) Tj ET');
    stream.push('BT /F2 8.5 Tf 0.3 0.3 0.3 rg 70 ' + (yPos - 38) + ' Td (Link: ' + escapePdfText(canvaTemplateUrl).slice(0, 80) + ') Tj ET');
    yPos -= 64;
  }

  if (notionTemplateUrl) {
    stream.push('0.96 0.95 0.98 rg 54 ' + (yPos - 48) + ' 504 50 re f');
    stream.push('0.5 0.3 0.75 RG 1.2 w 54 ' + (yPos - 48) + ' 504 50 re S');
    stream.push('BT /F1 11 Tf 0.4 0.2 0.65 rg 70 ' + (yPos - 22) + ' Td (NOTION / DIGITAL HUB TEMPLATE ACCESS) Tj ET');
    stream.push('BT /F2 8.5 Tf 0.3 0.3 0.3 rg 70 ' + (yPos - 38) + ' Td (Link: ' + escapePdfText(notionTemplateUrl).slice(0, 80) + ') Tj ET');
    yPos -= 64;
  }

  if (downloadUrl) {
    stream.push('0.92 0.98 0.94 rg 54 ' + (yPos - 48) + ' 504 50 re f');
    stream.push(`${secondaryRgb.r} ${secondaryRgb.g} ${secondaryRgb.b} RG 1.2 w 54 ${yPos - 48} 504 50 re S`);
    stream.push(`BT /F1 11 Tf ${secondaryRgb.r * 0.7} ${secondaryRgb.g * 0.7} ${secondaryRgb.b * 0.7} rg 70 ${yPos - 22} Td (GRO10X SECURE CLOUD VAULT DOWNLOAD) Tj ET`);
    stream.push('BT /F2 8.5 Tf 0.3 0.3 0.3 rg 70 ' + (yPos - 38) + ' Td (Direct High-Resolution Deliverable PDF / ZIP Archive) Tj ET');
    yPos -= 64;
  }

  // Section 3: Single-User License & Anti-Piracy Protection Box
  stream.push('0.95 0.95 0.95 rg 54 110 504 125 re f');
  stream.push('0.8 0.8 0.8 RG 1 w 54 110 504 125 re S');
  stream.push('BT /F1 10.5 Tf 0.15 0.15 0.15 rg 68 214 Td (SINGLE-USER PERSONAL USE LICENSE TERMS) Tj ET');
  stream.push('BT /F2 8.5 Tf 0.32 0.32 0.32 rg 68 196 Td (• This digital product is licensed exclusively to the purchasing customer for personal non-commercial use.) Tj ET');
  stream.push('BT /F2 8.5 Tf 0.32 0.32 0.32 rg 68 181 Td (• Reselling, sharing, redistributing, or claiming these files/templates as your own is strictly prohibited by law.) Tj ET');
  stream.push('BT /F2 8.5 Tf 0.32 0.32 0.32 rg 68 166 Td (• All files are digitally watermarked and registered with GRO10X Anti-Piracy Protection Services.) Tj ET');
  stream.push('BT /F2 8.5 Tf 0.32 0.32 0.32 rg 68 151 Td (• Need assistance or have questions? Contact our customer concierge via your Etsy order message.) Tj ET');
  stream.push('BT /F1 8.5 Tf 0.1 0.45 0.3 rg 68 126 Td (Thank you for supporting our shop! We appreciate your business and 5-star feedback.) Tj ET');

  // Bottom Footer
  stream.push('BT /F2 8 Tf 0.55 0.55 0.55 rg 180 50 Td (Powered by GRO10X Secure Digital Vault  |  All Rights Reserved) Tj ET');

  const contentStr = stream.join('\n');
  const contentLen = Buffer.byteLength(contentStr, 'utf8');

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  // Obj 1: Catalog
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  // Obj 2: Pages
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  // Obj 3: Page
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';

  // Obj 4: Contents
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '4 0 obj\n<< /Length ' + contentLen + ' >>\nstream\n' + contentStr + '\nendstream\nendobj\n';

  // Obj 5: Font Helvetica-Bold
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';

  // Obj 6: Font Helvetica
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  // xref
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += 'xref\n0 7\n0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';

  return Buffer.from(pdf, 'utf8');
}

module.exports = {
  generateAccessPassPdf
};
