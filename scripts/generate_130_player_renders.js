const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const { SUPERLEAGUE_PLAYERS } = require('../public/superleague/data/players.js');

const manifestPath = 'C:/Users/Hp/.gemini/antigravity/brain/01068434-323e-444d-bd9c-bd96a352a94b/superleague_130_render_manifest.md';
const content = fs.readFileSync(manifestPath, 'utf8');

const lines = content.split('\n');
const PLAYER_RENDERS = {};

for (const line of lines) {
  if (line.includes('|') && line.includes('.png')) {
    const parts = line.split('|').map(s => s.trim());
    if (parts.length >= 6) {
      const slug = parts[2].replace(/`/g, '').trim();
      const name = parts[3].trim();
      PLAYER_RENDERS[name] = slug;
    }
  }
}

console.log('Total players in manifest:', Object.keys(PLAYER_RENDERS).length);

const outputDir = path.join(__dirname, '../public/superleague/images/player-renders');
fs.mkdirSync(outputDir, { recursive: true });

// Map player metadata from SUPERLEAGUE_PLAYERS
const playerMap = new Map();
SUPERLEAGUE_PLAYERS.forEach(p => playerMap.set(p.name, p));

const posThemes = {
  GK: { color1: '#00DCFF', color2: '#2563EB', tag: 'GK', bgGrad: 'rgba(37, 99, 235, 0.25)' },
  DEF: { color1: '#10B981', color2: '#059669', tag: 'DEF', bgGrad: 'rgba(16, 185, 129, 0.25)' },
  MID: { color1: '#F59E0B', color2: '#D97706', tag: 'MID', bgGrad: 'rgba(245, 158, 11, 0.25)' },
  FWD: { color1: '#FF00C8', color2: '#EF4444', tag: 'FWD', bgGrad: 'rgba(239, 68, 68, 0.25)' }
};

let generatedCount = 0;

for (const [name, filename] of Object.entries(PLAYER_RENDERS)) {
  const p = playerMap.get(name) || {
    name,
    pos: 'FWD',
    ovr: 90,
    country: 'Global',
    prime: 'Super League'
  };

  const theme = posThemes[p.pos] || posThemes.FWD;
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 400, 400);

  // Outer Glow Circle
  const cx = 200;
  const cy = 200;
  const r = 175;

  // Background Disc
  const bgGrad = ctx.createRadialGradient(cx, cy - 30, 20, cx, cy, r);
  bgGrad.addColorStop(0, '#1E1E28');
  bgGrad.addColorStop(0.7, '#0D0D12');
  bgGrad.addColorStop(1, '#050508');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Position Color Ambient Wash
  const glow = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, r);
  glow.addColorStop(0, theme.bgGrad);
  glow.addColorStop(0.8, 'transparent');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Futuristic Ring Border
  const ringGrad = ctx.createLinearGradient(50, 50, 350, 350);
  ringGrad.addColorStop(0, theme.color1);
  ringGrad.addColorStop(0.5, '#9646FF');
  ringGrad.addColorStop(1, theme.color2);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Inner subtle border
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Stylized Athlete Silhouette
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
  ctx.clip();

  // Torso / Jersey
  ctx.fillStyle = '#16161F';
  ctx.beginPath();
  ctx.ellipse(cx, 320, 110, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jersey Accent Stripe
  const stripeGrad = ctx.createLinearGradient(cx - 50, 250, cx + 50, 350);
  stripeGrad.addColorStop(0, theme.color1);
  stripeGrad.addColorStop(1, theme.color2);
  ctx.fillStyle = stripeGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 24, 250);
  ctx.lineTo(cx + 24, 250);
  ctx.lineTo(cx + 36, 380);
  ctx.lineTo(cx - 36, 380);
  ctx.closePath();
  ctx.fill();

  // Head Silhouette
  ctx.fillStyle = '#E8C5A8'; // stylized warm skin tone
  ctx.beginPath();
  ctx.arc(cx, 160, 48, 0, Math.PI * 2);
  ctx.fill();

  // Stylized Hair / Cap (customized for specific icons like Yashin cap, Ronaldo/Messi hair, Buffon, etc.)
  ctx.fillStyle = '#1A1820';
  if (name.includes('Yashin')) {
    // Iconic flat cap
    ctx.beginPath();
    ctx.ellipse(cx, 140, 56, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, 135, 46, Math.PI, 0);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, 145, 50, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
  }

  // Neck
  ctx.fillStyle = '#D6B093';
  ctx.fillRect(cx - 16, 195, 32, 35);

  ctx.restore();

  // Top Position & OVR Shield Badge
  ctx.fillStyle = 'rgba(13, 13, 18, 0.92)';
  ctx.strokeStyle = theme.color1;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - 55, 38, 110, 36, 18);
  ctx.fill();
  ctx.stroke();

  // OVR + Pos Text
  ctx.font = '800 18px "Space Grotesk", sans-serif';
  ctx.fillStyle = theme.color1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${p.pos} · ${p.ovr}`, cx, 56);

  // Bottom Name Plate Pill
  ctx.fillStyle = 'rgba(10, 10, 15, 0.94)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 120, 320, 240, 44, 12);
  ctx.fill();
  ctx.stroke();

  // Name Typography
  const displayName = name.length > 15 ? name.split(' ').pop().toUpperCase() : name.toUpperCase();
  ctx.font = 'bold 18px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayName, cx, 342);

  // Save PNG
  const outPath = path.join(outputDir, filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
  generatedCount++;
}

console.log(`✅ Successfully generated ${generatedCount} / 130 player renders in public/superleague/images/player-renders/`);

// Output the full JavaScript PLAYER_RENDERS dictionary string for app.js
fs.writeFileSync(
  path.join(__dirname, '../scratch/player_renders_130.json'),
  JSON.stringify(PLAYER_RENDERS, null, 2)
);
console.log('Saved scratch/player_renders_130.json');
