const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const iconDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background Dark Slate
  ctx.fillStyle = '#070b12';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.22);
  ctx.fill();

  // Outer Neon Cyan Glow Border
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = Math.max(1.5, size * 0.05);
  ctx.beginPath();
  ctx.roundRect(size * 0.04, size * 0.04, size * 0.92, size * 0.92, size * 0.18);
  ctx.stroke();

  // Cyberpunk Radial / Diagonal Gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#00f2fe'); // Neon Cyan
  grad.addColorStop(0.5, '#7928ca'); // Electric Purple
  grad.addColorStop(1, '#ff007a'); // Cyberpunk Pink
  ctx.fillStyle = grad;

  // Draw Lightning Bolt / Radar Icon
  ctx.beginPath();
  const scale = size / 100;
  ctx.moveTo(52 * scale, 16 * scale);
  ctx.lineTo(26 * scale, 54 * scale);
  ctx.lineTo(48 * scale, 54 * scale);
  ctx.lineTo(40 * scale, 84 * scale);
  ctx.lineTo(74 * scale, 44 * scale);
  ctx.lineTo(52 * scale, 44 * scale);
  ctx.closePath();
  ctx.fill();

  // Inner Accent Dot (Radar Target)
  ctx.fillStyle = '#00df89'; // Mint Green
  ctx.beginPath();
  ctx.arc(76 * scale, 24 * scale, 6 * scale, 0, Math.PI * 2);
  ctx.fill();

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconDir, `icon${size}.png`), buf);
  console.log(`Generated icon${size}.png`);
}

[16, 48, 128].forEach(drawIcon);

// Also save SVG icon for documentation
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="28" fill="#070b12" stroke="#00f2fe" stroke-width="6"/>
  <defs>
    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="50%" stop-color="#7928ca"/>
      <stop offset="100%" stop-color="#ff007a"/>
    </linearGradient>
  </defs>
  <polygon points="66,20 33,69 61,69 51,107 95,56 66,56" fill="url(#boltGrad)"/>
  <circle cx="97" cy="30" r="8" fill="#00df89"/>
</svg>`;
fs.writeFileSync(path.join(iconDir, 'icon.svg'), svgContent);
console.log('Generated icon.svg');
