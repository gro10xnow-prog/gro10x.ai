const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generate() {
  const targetUrl = 'https://gro10x-ai.vercel.app/nhf';
  const outPng = path.join(__dirname, '../public/nhf_qr.png');
  const outSvg = path.join(__dirname, '../public/nhf_qr.svg');

  // Generate PNG with error correction level H (30% damage tolerance) and crisp 1200px resolution
  await QRCode.toFile(outPng, targetUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    quality: 1,
    margin: 2,
    color: {
      dark: '#0B192C', // Deep executive Navy matching the brand
      light: '#FFFFFF'
    },
    width: 1200
  });

  // Generate SVG for vector scaling
  const svgString = await QRCode.toString(targetUrl, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0B192C',
      light: '#FFFFFF'
    }
  });
  fs.writeFileSync(outSvg, svgString);

  console.log('Generated QR Codes successfully:');
  console.log('PNG:', outPng);
  console.log('SVG:', outSvg);
}

generate().catch(console.error);
