/**
 * SPRINT 28 VERIFICATION SUITE: PRJ-COMMERCE10X-FOOTWEAR-CAPSULE
 * Engine 3: Commerce10x.ai // Phygital Retail Division
 * 
 * Verifies:
 * 1. Sprint Ledger project registration and accounting totals
 * 2. Interactive 10X Capsule Showroom (/prototypes/10x-capsule-drop-01/)
 * 3. Central Showroom card integration in /prototypes/index.html
 * 4. Five (5) Luxury Heavyweight Tee physical assets
 * 5. Five (5) Printify 3D Footwear production packs
 * 6. Identity Moodboard & Exhibition Board assets
 * 7. Comprehensive documentation record
 */

const fs = require('fs');
const path = require('path');

describe('Sprint 28: 10X Footwear & Luxury Apparel Capsule', () => {
  const rootDir = path.resolve(__dirname, '..');

  test('1. Sprint Ledger registers PRJ-COMMERCE10X-FOOTWEAR-CAPSULE as COMPLETED with 35,000 Credits', () => {
    const ledgerPath = path.join(rootDir, 'data', 'sprint_projects_ledger.json');
    expect(fs.existsSync(ledgerPath)).toBe(true);

    const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    const sprint28 = ledger.projects.find(p => p.id === 'PRJ-COMMERCE10X-FOOTWEAR-CAPSULE');

    expect(sprint28).toBeDefined();
    expect(sprint28.status).toBe('COMPLETED');
    expect(sprint28.creditValuation).toBe(35000);
    expect(sprint28.engine).toContain('Commerce10x.ai');
    expect(ledger.totals.totalSprintsChartered).toBe(28);
    expect(ledger.totals.totalCreditsGenerated).toBe(845000);
  });

  test('2. Interactive Showroom exists at public/prototypes/10x-capsule-drop-01/index.html', () => {
    const htmlPath = path.join(rootDir, 'public', 'prototypes', '10x-capsule-drop-01', 'index.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    const html = fs.readFileSync(htmlPath, 'utf8');
    expect(html).toContain('10X Brand Formula');
    expect(html).toContain('Commerce10x.ai');
    expect(html).toContain('Drop 01 // Heavyweight Luxury Tees');
    expect(html).toContain('Drop 02 // 10X Footwear System');
    expect(html).toContain('The Kinetic Multiplier');
  });

  test('3. Central Showroom (public/prototypes/index.html) mounts 10X Capsule Drop 01 card', () => {
    const showroomPath = path.join(rootDir, 'public', 'prototypes', 'index.html');
    expect(fs.existsSync(showroomPath)).toBe(true);

    const showroom = fs.readFileSync(showroomPath, 'utf8');
    expect(showroom).toContain('/prototypes/10x-capsule-drop-01/');
    expect(showroom).toContain('10X Capsule Drop 01 — Footwear & Luxury Apparel');
    expect(showroom).toContain('Engine 3: Phygital Commerce');
  });

  test('4. All five (5) Luxury Heavyweight Tee assets are archived in public/prototypes/10x-capsule-drop-01/apparel/', () => {
    const apparelDir = path.join(rootDir, 'public', 'prototypes', '10x-capsule-drop-01', 'apparel');
    const expectedTees = [
      'tee_01_cyber_stealth_eva.png',
      'tee_02_tokyo_sunset.png',
      'tee_03_bengal_royal_black.png',
      'tee_04_spiderman_hero.jpg',
      'tee_05_heritage_racing_green.png'
    ];

    expectedTees.forEach(tee => {
      const p = path.join(apparelDir, tee);
      expect(fs.existsSync(p)).toBe(true);
      expect(fs.statSync(p).size).toBeGreaterThan(10000);
    });
  });

  test('5. Printify Sneaker live renders are archived in public/prototypes/10x-capsule-drop-01/sneakers/', () => {
    const sneakerDir = path.join(rootDir, 'public', 'prototypes', '10x-capsule-drop-01', 'sneakers');
    const expectedRenders = [
      'sneaker_heritage_racing_heel.png',
      'sneaker_heritage_racing_right.png',
      'sneaker_heritage_racing_left.png',
      'sneaker_heritage_racing_top.png',
      'sneaker_spiderman_heel.png',
      'sneaker_spiderman_right.png',
      'sneaker_spiderman_left.png',
      'sneaker_spiderman_top.png',
      'sneaker_bengal_tiger_heel.png',
      'sneaker_bengal_tiger_right.png'
    ];

    expectedRenders.forEach(render => {
      const p = path.join(sneakerDir, render);
      expect(fs.existsSync(p)).toBe(true);
    });
  });

  test('6. Production Pack for Spider-Man Hero Triad exists with 4 pre-calibrated print files', () => {
    const dir = path.join(rootDir, 'public', 'prototypes', 'sneaker-10x-triad');
    expect(fs.existsSync(path.join(dir, '01_Left_Outside_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '02_Right_Outside_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '03_Tongue_Badge_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '04_Heel_Back_10X.png'))).toBe(true);
  });

  test('7. Production Pack for Heritage Racing Club exists with 4 pre-calibrated print files', () => {
    const dir = path.join(rootDir, 'public', 'prototypes', 'sneaker-10x-heritage');
    expect(fs.existsSync(path.join(dir, '01_Left_Outside_Heritage.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '02_Right_Outside_Heritage.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '03_Tongue_Badge_Heritage.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '04_Heel_Back_Heritage.png'))).toBe(true);
  });

  test('8. Production Pack for Cyber Stealth EVA-01 exists with dark-mode assets', () => {
    const dir = path.join(rootDir, 'public', 'prototypes', 'sneaker-10x-cyber-stealth');
    expect(fs.existsSync(path.join(dir, '01_Left_Outside_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '02_Right_Outside_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '03_Tongue_Badge_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '04_Heel_Back_10X.png'))).toBe(true);
  });

  test('9. Production Pack for Tokyo Sunset exists with vibrant cyan/magenta assets', () => {
    const dir = path.join(rootDir, 'public', 'prototypes', 'sneaker-10x-tokyo-sunset');
    expect(fs.existsSync(path.join(dir, '01_Left_Outside_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '02_Right_Outside_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '03_Tongue_Badge_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '04_Heel_Back_10X.png'))).toBe(true);
  });

  test('10. Production Pack for Bengal Royal exists with sovereign green/amber assets', () => {
    const dir = path.join(rootDir, 'public', 'prototypes', 'sneaker-10x-bengal-royal');
    expect(fs.existsSync(path.join(dir, '01_Left_Outside_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '02_Right_Outside_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '03_Tongue_Badge_10X.png'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '04_Heel_Back_10X.png'))).toBe(true);
  });

  test('11. Master Brand Identity and 3-Prototype Exhibition Boards are committed to public/images/', () => {
    const identityPath = path.join(rootDir, 'public', 'images', 'gro10x_lifestyle_brand_identity_system.jpg');
    const boardPath = path.join(rootDir, 'public', 'images', '10x_sneaker_three_new_prototypes_board.jpg');
    const capsulePath = path.join(rootDir, 'public', 'images', 'gro10x_capsule_drop_01_lifestyle_collection.jpg');

    expect(fs.existsSync(identityPath)).toBe(true);
    expect(fs.existsSync(boardPath)).toBe(true);
    expect(fs.existsSync(capsulePath)).toBe(true);
  });

  test('12. Sprint 28 Comprehensive Documentation exists in docs/', () => {
    const docPath = path.join(rootDir, 'docs', 'SPRINT_28_10X_FOOTWEAR_APPAREL_CAPSULE.md');
    expect(fs.existsSync(docPath)).toBe(true);

    const doc = fs.readFileSync(docPath, 'utf8');
    expect(doc).toContain('PRJ-COMMERCE10X-FOOTWEAR-CAPSULE');
    expect(doc).toContain('Tri-Color Triad Law');
    expect(doc).toContain('35,000 Credits');
  });
});
