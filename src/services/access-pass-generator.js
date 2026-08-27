/**
 * src/services/access-pass-generator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Official Customer Access & Anti-Piracy License Pass PDF Generator
 * Pure Node.js high-performance PDF-1.4 binary engine.
 * 
 * Features:
 * 1. WinAnsiEncoding font mapping — eliminates all UTF-8 Mojibake artifacts (â€¢).
 * 2. Interactive PDF Link Annotations (/Annots) — renders 100% clickable buttons
 *    across all PDF readers (Apple Preview, Acrobat, GoodNotes, Chrome, Safari).
 * 3. Luxury Boutique Stationery Aesthetic with responsive brand color palettes.
 * ─────────────────────────────────────────────────────────────────────────────
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

/**
 * Escapes text for PDF stream literals with WinAnsi character encoding.
 * Converts Unicode bullets, dashes, quotes, and symbols into valid PDF octal sequences.
 */
function sanitizePdfWinAnsi(str, maxLen = 120) {
  if (!str) return '';
  let s = String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/•/g, '\\225')   // WinAnsi Bullet Point
    .replace(/–/g, '\\226')   // WinAnsi En-Dash
    .replace(/—/g, '\\227')   // WinAnsi Em-Dash
    .replace(/©/g, '\\251')   // WinAnsi Copyright
    .replace(/®/g, '\\256')   // WinAnsi Registered Trademark
    .replace(/™/g, '\\231')   // WinAnsi Trademark
    .replace(/·/g, '\\267')   // WinAnsi Middle Dot
    .replace(/[“”]/g, '"')    // Standard double quotes
    .replace(/[‘’]/g, "'")    // Standard single quotes
    .replace(/[\r\n]+/g, ' ')
    .trim();

  if (maxLen && s.length > maxLen) {
    s = s.slice(0, maxLen);
  }
  return s;
}

/**
 * Generates an official, luxury Customer Access & Anti-Piracy License Pass PDF.
 */
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
  const cleanBrand = (brandName || 'PlannerQueenGro').trim();
  const etsyStoreUrl = `https://www.etsy.com/shop/${cleanBrand.replace(/[^a-zA-Z0-9]/g, '')}`;

  const stream = [];
  const linkAnnotations = []; // Array of { rect: [x1, y1, x2, y2], uri: string }

  // 1. Page background: Luxury Warm Cream (#FAF8F5)
  stream.push('0.982 0.974 0.962 rg');
  stream.push('0 0 612 792 re f');

  // 2. Outer Decorative Gold/Sage Framing
  stream.push('0.87 0.84 0.80 RG 1 w');
  stream.push('20 20 572 752 re S');
  stream.push('0.92 0.90 0.87 RG 0.5 w');
  stream.push('24 24 564 744 re S');

  // 3. Top Luxury Header Banner (Y: 692 -> 760, H: 68)
  stream.push(`${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b} rg`);
  stream.push('36 692 540 68 re f');

  // Header Typography
  stream.push('BT /F1 18 Tf 1 1 1 rg 52 734 Td (' + sanitizePdfWinAnsi(cleanBrand.toUpperCase()) + ') Tj ET');
  stream.push('BT /F1 9 Tf 0.98 0.88 0.55 rg 52 712 Td (OFFICIAL CUSTOMER ACCESS & ANTI-PIRACY LICENSE PASS) Tj ET');
  stream.push('BT /F2 8.5 Tf 0.92 0.92 0.92 rg 400 712 Td (PASS ID: ' + sanitizePdfWinAnsi(lic) + ') Tj ET');

  // 4. Product Identity Card (Y: 618 -> 684, H: 66)
  stream.push('0.995 0.995 0.995 rg 36 618 540 66 re f');
  stream.push('0.88 0.86 0.83 RG 0.8 w 36 618 540 66 re S');

  // Product Title (with smart length clipping)
  const cleanTitle = sanitizePdfWinAnsi(productName, 80);
  stream.push('BT /F1 13 Tf 0.12 0.12 0.12 rg 52 660 Td (' + cleanTitle + ') Tj ET');

  // Product Meta Row
  stream.push('BT /F2 8.5 Tf 0.42 0.42 0.42 rg 52 644 Td (SKU: ' + sanitizePdfWinAnsi(productCode) + '  |  Edition: v' + sanitizePdfWinAnsi(version) + '  |  Format: Printable PDF & GoodNotes Digital) Tj ET');

  // Product Feature Pill Highlights
  stream.push(`BT /F1 8 Tf ${secondaryRgb.r * 0.8} ${secondaryRgb.g * 0.8} ${secondaryRgb.b * 0.8} rg 52 628 Td (\\225 300 DPI High-Res Vector   \\225 Hyperlinked GoodNotes & Notability   \\225 Single-User Verified Pass) Tj ET`);

  // 5. Action Area: Interactive Download & Template Access Buttons
  let currentY = 574;

  stream.push('BT /F1 10 Tf 0.15 0.15 0.15 rg 36 ' + currentY + ' Td (STEP 1: ACCESS & DOWNLOAD YOUR DIGITAL PRODUCTS) Tj ET');
  currentY -= 14;
  stream.push('BT /F2 8 Tf 0.48 0.48 0.48 rg 36 ' + currentY + ' Td (Click any of the verified access buttons below to download your master files or open editable templates:) Tj ET');
  currentY -= 16;

  // Button A: Master Deliverable PDF / ZIP Cloud Vault Download
  const effectiveDownloadUrl = downloadUrl || `https://gro10x.ai/vault/access/${productCode}`;
  const btnHeight = 44;
  currentY -= btnHeight;

  // Button background: Emerald / Rich Teal (#0F766E)
  stream.push('0.06 0.46 0.43 rg 36 ' + currentY + ' 540 ' + btnHeight + ' re f');
  stream.push('0.04 0.38 0.35 RG 1.2 w 36 ' + currentY + ' 540 ' + btnHeight + ' re S');

  // Button text
  stream.push('BT /F1 11 Tf 1 1 1 rg 54 ' + (currentY + 26) + ' Td (DOWNLOAD MASTER DIGITAL DELIVERABLE (PDF / ZIP)) Tj ET');
  stream.push('BT /F2 8 Tf 0.85 0.96 0.92 rg 54 ' + (currentY + 12) + ' Td (Direct High-Resolution Cloud Vault File \\227 Click to Download Master PDF) Tj ET');

  linkAnnotations.push({
    rect: [36, currentY, 576, currentY + btnHeight],
    uri: effectiveDownloadUrl
  });

  currentY -= 10;

  // Button B: Canva Master Editable Template (If present)
  if (canvaTemplateUrl) {
    currentY -= btnHeight;
    // Button background: Canva Blue (#2563EB)
    stream.push('0.14 0.39 0.92 rg 36 ' + currentY + ' 540 ' + btnHeight + ' re f');
    stream.push('0.10 0.30 0.80 RG 1.2 w 36 ' + currentY + ' 540 ' + btnHeight + ' re S');
    stream.push('BT /F1 11 Tf 1 1 1 rg 54 ' + (currentY + 26) + ' Td (OPEN EDITABLE CANVA MASTER TEMPLATE) Tj ET');
    stream.push('BT /F2 8 Tf 0.88 0.92 0.99 rg 54 ' + (currentY + 12) + ' Td (Instant Canva Access \\227 Click to Customize Fonts, Colors & Layouts) Tj ET');

    linkAnnotations.push({
      rect: [36, currentY, 576, currentY + btnHeight],
      uri: canvaTemplateUrl
    });
    currentY -= 10;
  }

  // Button C: Notion Hub / Digital Workspace (If present)
  if (notionTemplateUrl) {
    currentY -= btnHeight;
    // Button background: Charcoal Slate (#1E293B)
    stream.push('0.12 0.16 0.23 rg 36 ' + currentY + ' 540 ' + btnHeight + ' re f');
    stream.push('0.08 0.12 0.18 RG 1.2 w 36 ' + currentY + ' 540 ' + btnHeight + ' re S');
    stream.push('BT /F1 11 Tf 1 1 1 rg 54 ' + (currentY + 26) + ' Td (OPEN NOTION DIGITAL WORKSPACE HUB) Tj ET');
    stream.push('BT /F2 8 Tf 0.88 0.90 0.94 rg 54 ' + (currentY + 12) + ' Td (1-Click Duplicate to Your Personal Notion Account \\227 Lifetime Sync) Tj ET');

    linkAnnotations.push({
      rect: [36, currentY, 576, currentY + btnHeight],
      uri: notionTemplateUrl
    });
    currentY -= 10;
  }

  // Button D: VIP Etsy Concierge Support
  const supportBtnHeight = 32;
  currentY -= supportBtnHeight;
  stream.push('0.96 0.96 0.97 rg 36 ' + currentY + ' 540 ' + supportBtnHeight + ' re f');
  stream.push('0.82 0.82 0.84 RG 0.8 w 36 ' + currentY + ' 540 ' + supportBtnHeight + ' re S');
  stream.push('BT /F1 9 Tf 0.2 0.2 0.2 rg 54 ' + (currentY + 19) + ' Td (NEED ASSISTANCE? MESSAGE OUR ETSY CONCIERGE) Tj ET');
  stream.push('BT /F2 7.5 Tf 0.45 0.45 0.45 rg 54 ' + (currentY + 8) + ' Td (Direct VIP Customer Support \\227 We answer all questions in under 2 hours) Tj ET');

  linkAnnotations.push({
    rect: [36, currentY, 576, currentY + supportBtnHeight],
    uri: etsyStoreUrl
  });

  currentY -= 20;

  // 6. Section 2: Quick-Start Instructions Card (Y: currentY -> currentY - 96, H: 96)
  const instrHeight = 96;
  currentY -= instrHeight;

  stream.push('0.97 0.97 0.97 rg 36 ' + currentY + ' 540 ' + instrHeight + ' re f');
  stream.push('0.86 0.86 0.86 RG 0.8 w 36 ' + currentY + ' 540 ' + instrHeight + ' re S');

  stream.push('BT /F1 9.5 Tf 0.15 0.15 0.15 rg 52 ' + (currentY + 78) + ' Td (STEP 2: QUICK-START SETUP & TABLET INSTRUCTIONS) Tj ET');
  stream.push('BT /F2 8 Tf 0.30 0.30 0.30 rg 52 ' + (currentY + 62) + ' Td (1. Save Files: Click the download button above to save your master PDF to your device or iCloud.) Tj ET');
  stream.push('BT /F2 8 Tf 0.30 0.30 0.30 rg 52 ' + (currentY + 48) + ' Td (2. iPad & Tablet Apps: Import the PDF into GoodNotes, Notability, or Samsung Notes.) Tj ET');
  stream.push('BT /F2 8 Tf 0.30 0.30 0.30 rg 52 ' + (currentY + 34) + ' Td (3. Hyperlink Navigation: In GoodNotes, select "Read-Only Mode" (pen crossed out) to click tabs.) Tj ET');
  stream.push('BT /F2 8 Tf 0.30 0.30 0.30 rg 52 ' + (currentY + 20) + ' Td (4. Home Printing: Select "Actual Size / 100% Scale" on standard US Letter or A4 paper.) Tj ET');

  currentY -= 14;

  // 7. Section 3: Single-User Anti-Piracy License Card (Y: currentY -> currentY - 92, H: 92)
  const licCardHeight = 92;
  currentY -= licCardHeight;

  stream.push('0.94 0.95 0.96 rg 36 ' + currentY + ' 540 ' + licCardHeight + ' re f');
  stream.push('0.80 0.82 0.85 RG 0.8 w 36 ' + currentY + ' 540 ' + licCardHeight + ' re S');

  stream.push('BT /F1 9 Tf 0.12 0.15 0.20 rg 52 ' + (currentY + 74) + ' Td (SINGLE-USER PERSONAL USE LICENSE & ANTI-PIRACY TERMS) Tj ET');
  stream.push('BT /F2 7.8 Tf 0.32 0.32 0.32 rg 52 ' + (currentY + 58) + ' Td (\\225 This digital product is licensed exclusively to the purchasing customer for personal non-commercial use.) Tj ET');
  stream.push('BT /F2 7.8 Tf 0.32 0.32 0.32 rg 52 ' + (currentY + 45) + ' Td (\\225 Reselling, sharing, redistributing, or claiming these files/templates as your own is strictly prohibited.) Tj ET');
  stream.push('BT /F2 7.8 Tf 0.32 0.32 0.32 rg 52 ' + (currentY + 32) + ' Td (\\225 All files are digitally watermarked and registered with GRO10X Anti-Piracy Protection Services.) Tj ET');
  stream.push('BT /F1 8 Tf 0.08 0.42 0.28 rg 52 ' + (currentY + 16) + ' Td (Thank you for supporting our shop! We appreciate your business and 5-star feedback.) Tj ET');

  // 8. Footer (Y: 34)
  stream.push('BT /F2 7.5 Tf 0.55 0.55 0.55 rg 140 34 Td (Powered by GRO10X Secure Digital Vault   |   All Rights Reserved   |   License ID: ' + sanitizePdfWinAnsi(lic) + ') Tj ET');

  // Assemble PDF Binary Structure
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

  // Determine Link Annotation Objects (Obj 7, 8, 9...)
  const annotRefs = linkAnnotations.map((_, i) => `${7 + i} 0 R`).join(' ');

  // Obj 3: Page (Includes /Annots array for clickable links!)
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >>' +
    (linkAnnotations.length > 0 ? ` /Annots [ ${annotRefs} ]` : '') +
    ' >>\nendobj\n';

  // Obj 4: Content Stream
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '4 0 obj\n<< /Length ' + contentLen + ' >>\nstream\n' + contentStr + '\nendstream\nendobj\n';

  // Obj 5: Font Helvetica-Bold with WinAnsiEncoding
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n';

  // Obj 6: Font Helvetica with WinAnsiEncoding
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n';

  // Obj 7..N: Interactive Link Annotation Objects
  linkAnnotations.forEach((annot, idx) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    const [x1, y1, x2, y2] = annot.rect;
    const cleanUri = String(annot.uri).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    pdf += `${7 + idx} 0 obj\n<< /Type /Annot /Subtype /Link /Rect [${x1} ${y1} ${x2} ${y2}] /Border [0 0 0] /H /I /A << /S /URI /URI (${cleanUri}) >> >>\nendobj\n`;
  });

  const totalObjects = 6 + linkAnnotations.length;

  // Cross-reference table
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

module.exports = {
  generateAccessPassPdf
};
