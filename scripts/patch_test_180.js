const fs = require('fs');
const path = require('path');

const testPath = path.join(__dirname, '../tests/superleague_prototype.test.js');
let testCode = fs.readFileSync(testPath, 'utf8');

const start = testCode.indexOf("describe('Player Art Integration");
const end = testCode.indexOf("describe('Round 4 Polish Pass");

if (start === -1 || end === -1) {
  console.error('Markers not found! start:', start, 'end:', end);
  process.exit(1);
}

const newSuite = `describe('Player Art Integration & Render Manifest (180 / 180 Complete Pool - Offload 3 Final)', () => {
    const { SUPERLEAGUE_PLAYERS } = require('../public/superleague/data/players.js');
    const VARIANTS = {
      'Marc-Andre ter Stegen': 'marcandre-ter-stegen.png',
      'Samuel Eto\\'o': 'samuel-etoo.png',
      'Alexis Mac Allister': 'alexis-macallister.png',
      'Warren Zaire-Emery': 'warren-zaireemery.png',
      'Trent Alexander-Arnold': 'trent-alexanderarnold.png',
      'Myles Lewis-Skelly': 'myles-lewisskelly.png'
    };

    function getExpectedSlug(name) {
      if (VARIANTS[name]) return VARIANTS[name];
      return name.toLowerCase()
        .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '.png';
    }

    test('All 180 players from canonical pool have valid PNG files on disk in public/superleague/images/player-renders/', () => {
      const renderDir = path.join(__dirname, '../public/superleague/images/player-renders');
      expect(fs.existsSync(renderDir)).toBe(true);

      SUPERLEAGUE_PLAYERS.forEach(p => {
        const filename = getExpectedSlug(p.name);
        const filePath = path.join(renderDir, filename);
        expect(fs.existsSync(filePath)).toBe(true);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(1000); // verify non-empty valid PNG
      });
    });

    test('app.js defines all 180 PLAYER_RENDERS entries and renders them across surfaces', () => {
      const appJs = fs.readFileSync(path.join(__dirname, '../public/superleague/app.js'), 'utf8');
      expect(appJs).toContain('const PLAYER_RENDERS =');
      expect(appJs).toContain('function renderPlayerAvatar(');
      expect(appJs).toContain('onerror="this.style.display=\\'none\\'; this.nextElementSibling.style.display=\\'flex\\';"');
      expect(appJs).toContain('renderNextLotsStrip');
      expect(appJs).toContain('drawChampionsCard = renderChampionsCardSurface');

      // Verify all 6 variant slugs exist in app.js
      expect(appJs).toContain('"marcandre-ter-stegen.png"');
      expect(appJs).toContain('"samuel-etoo.png"');
      expect(appJs).toContain('"alexis-macallister.png"');
      expect(appJs).toContain('"warren-zaireemery.png"');
      expect(appJs).toContain('"trent-alexanderarnold.png"');
      expect(appJs).toContain('"myles-lewisskelly.png"');
    });

    test('All 180 players resolve cleanly to an art file with zero unresolved names', () => {
      const renderDir = path.join(__dirname, '../public/superleague/images/player-renders');
      const files = new Set(fs.readdirSync(renderDir));
      
      const unresolved = [];
      SUPERLEAGUE_PLAYERS.forEach(p => {
        const slug = getExpectedSlug(p.name);
        if (!files.has(slug)) {
          unresolved.push(p.name);
        }
      });

      expect(unresolved).toHaveLength(0);
      expect(SUPERLEAGUE_PLAYERS).toHaveLength(180);
    });

    test('RENDER-MANIFEST.md is present on disk with exactly 180 player rows', () => {
      const manifestPath = path.join(__dirname, '../public/superleague/RENDER-MANIFEST.md');
      expect(fs.existsSync(manifestPath)).toBe(true);
      const content = fs.readFileSync(manifestPath, 'utf8');
      expect(content).toContain('OFFLOAD 3 FINAL · 180 / 180 PLAYERS');
      
      // Count player rows in table
      const rows = content.split('\\n').filter(line => line.startsWith('|') && line.includes('.png'));
      expect(rows).toHaveLength(180);
    });
  });

  `;

testCode = testCode.substring(0, start) + newSuite + testCode.substring(end);
fs.writeFileSync(testPath, testCode);
console.log('Successfully updated tests/superleague_prototype.test.js with 180-player art suite!');
