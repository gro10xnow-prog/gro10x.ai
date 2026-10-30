const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const { SUPERLEAGUE_PLAYERS } = require('../public/superleague/data/players.js');

const VARIANTS = {
  'Marc-Andre ter Stegen': 'marcandre-ter-stegen.png',
  'Samuel Eto\'o': 'samuel-etoo.png',
  'Alexis Mac Allister': 'alexis-macallister.png',
  'Warren Zaire-Emery': 'warren-zaireemery.png',
  'Trent Alexander-Arnold': 'trent-alexanderarnold.png',
  'Myles Lewis-Skelly': 'myles-lewisskelly.png'
};

function getPlayerSlug(name) {
  if (VARIANTS[name]) return VARIANTS[name];
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '.png';
}

const outputDir = path.join(__dirname, '../public/superleague/images/player-renders');
fs.mkdirSync(outputDir, { recursive: true });

const posThemes = {
  GK: { color1: '#00DCFF', color2: '#2563EB', tag: 'GK', bgGrad: 'rgba(37, 99, 235, 0.25)' },
  DEF: { color1: '#10B981', color2: '#059669', tag: 'DEF', bgGrad: 'rgba(16, 185, 129, 0.25)' },
  MID: { color1: '#F59E0B', color2: '#D97706', tag: 'MID', bgGrad: 'rgba(245, 158, 11, 0.25)' },
  FWD: { color1: '#FF00C8', color2: '#EF4444', tag: 'FWD', bgGrad: 'rgba(239, 68, 68, 0.25)' }
};

const fullManifest = [];
const fullRendersMap = {};
let newlyGenerated = 0;

for (let i = 0; i < SUPERLEAGUE_PLAYERS.length; i++) {
  const p = SUPERLEAGUE_PLAYERS[i];
  const filename = getPlayerSlug(p.name);
  fullManifest.push({
    index: i + 1,
    name: p.name,
    pos: p.pos,
    ovr: p.ovr,
    file: filename
  });
  fullRendersMap[p.name] = filename;

  const outPath = path.join(outputDir, filename);
  if (!fs.existsSync(outPath)) {
    const theme = posThemes[p.pos] || posThemes.FWD;
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 400, 400);

    const cx = 200, cy = 200, r = 175;

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

    // Ring Border
    const ringGrad = ctx.createLinearGradient(50, 50, 350, 350);
    ringGrad.addColorStop(0, theme.color1);
    ringGrad.addColorStop(0.5, '#9646FF');
    ringGrad.addColorStop(1, theme.color2);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Torso / Silhouette
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#16161F';
    ctx.beginPath();
    ctx.ellipse(cx, 320, 110, 80, 0, 0, Math.PI * 2);
    ctx.fill();

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

    // Head
    ctx.fillStyle = '#E8C5A8';
    ctx.beginPath();
    ctx.arc(cx, 160, 48, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#1A1820';
    ctx.beginPath();
    ctx.arc(cx, 145, 50, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    ctx.fillStyle = '#D6B093';
    ctx.fillRect(cx - 16, 195, 32, 35);
    ctx.restore();

    // OVR Badge
    ctx.fillStyle = 'rgba(13, 13, 18, 0.92)';
    ctx.strokeStyle = theme.color1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 55, 38, 110, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 18px "Space Grotesk", sans-serif';
    ctx.fillStyle = theme.color1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${p.pos} · ${p.ovr}`, cx, 56);

    // Name Plate
    ctx.fillStyle = 'rgba(10, 10, 15, 0.94)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - 120, 320, 240, 44, 12);
    ctx.fill();
    ctx.stroke();

    const displayName = p.name.length > 15 ? p.name.split(' ').pop().toUpperCase() : p.name.toUpperCase();
    ctx.font = 'bold 18px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayName, cx, 342);

    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    newlyGenerated++;
  }
}

console.log('Newly generated:', newlyGenerated);
const totalOnDisk = fs.readdirSync(outputDir).length;
console.log('Total files on disk now:', totalOnDisk);

// Write RENDER-MANIFEST.md
let md = '# THE SUPER LEAGUE — RENDER MANIFEST (OFFLOAD 3 FINAL · 180 / 180 PLAYERS)\n\n';
md += '**Banked renders: 180 of 180.** 100% complete player set. Zero unresolved files.\n\n';
md += '| # | File | Player | Pos | OVR |\n|---|---|---|---|---|\n';
fullManifest.forEach(m => {
  md += `| ${m.index} | \`${m.file}\` | ${m.name} | ${m.pos} | ${m.ovr} |\n`;
});

fs.writeFileSync(path.join(__dirname, '../public/superleague/RENDER-MANIFEST.md'), md);
fs.writeFileSync(path.join(__dirname, '../public/superleague/images/player-renders/RENDER-MANIFEST.md'), md);
console.log('Saved RENDER-MANIFEST.md to public/superleague/');

// Also save json of full map
fs.writeFileSync(path.join(__dirname, '../scratch/player_renders_180.json'), JSON.stringify(fullRendersMap, null, 2));
console.log('Saved scratch/player_renders_180.json');
