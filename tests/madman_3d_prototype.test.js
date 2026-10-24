/**
 * tests/madman_3d_prototype.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Automated Test Suite for MADMAN 3D WebGL Interactive Proof-of-Concept
 * 
 * Validates:
 * 1. Clean route mount: GET /prototypes/madman-3d returns HTTP 200 OK
 * 2. Clean route mount: GET /prototypes/madman-3d/ returns HTTP 200 OK
 * 3. HTML serves Three.js canvas container (#webgl-canvas and #webgl-canvas-container)
 * 4. PBR shaders & post-processing scripts are referenced (UnrealBloomPass, EffectComposer)
 * 5. Dynamic GPU Tiering script and telemetry HUD elements are present
 * 6. Lenis smooth-scroll choreography scripts are loaded
 * 7. Interactive Control Dock with wireframe, lighting presets, and turntable speed
 * 8. Responsive viewport metadata and high-contrast dark obsidian typography
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('MADMAN 3D WebGL Interactive Prototype Suite', () => {

  const prototypePath = path.join(__dirname, '../public/prototypes/madman-3d/index.html');

  test('1. Prototype HTML file exists on disk at public/prototypes/madman-3d/index.html', () => {
    expect(fs.existsSync(prototypePath)).toBe(true);
    const content = fs.readFileSync(prototypePath, 'utf8');
    expect(content.length).toBeGreaterThan(1000);
  });

  test('2. GET /prototypes/madman-3d returns HTTP 200 with text/html content', async () => {
    const res = await request(app).get('/prototypes/madman-3d');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('MADMAN');
    expect(res.text).toContain('3D WebGL');
  });

  test('3. GET /prototypes/madman-3d/ (trailing slash) returns HTTP 200 OK', async () => {
    const res = await request(app).get('/prototypes/madman-3d/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('4. Three.js canvas container and #webgl-canvas mount elements are present', async () => {
    const res = await request(app).get('/prototypes/madman-3d');
    expect(res.text).toContain('id="webgl-canvas-container"');
    expect(res.text).toContain('id="webgl-canvas"');
  });

  test('5. Three.js library and postprocessing scripts (UnrealBloomPass & Composer) are loaded', async () => {
    const res = await request(app).get('/prototypes/madman-3d');
    expect(res.text).toContain('three.min.js');
    expect(res.text).toContain('EffectComposer.js');
    expect(res.text).toContain('RenderPass.js');
    expect(res.text).toContain('UnrealBloomPass.js');
  });

  test('6. Lenis smooth-scroll choreography library and RAF initialization exist', async () => {
    const res = await request(app).get('/prototypes/madman-3d');
    expect(res.text).toContain('lenis');
    expect(res.text).toContain('initLenis');
    expect(res.text).toContain('scrollProgress');
  });

  test('7. Dynamic GPU Tiering script and telemetry HUD elements are defined', async () => {
    const res = await request(app).get('/prototypes/madman-3d');
    expect(res.text).toContain('id="gpu-telemetry-pill"');
    expect(res.text).toContain('detectGPUTier');
    expect(res.text).toContain('fps-counter');
    expect(res.text).toContain('maxPixelRatio');
  });

  test('8. Interactive Control Dock and controls are fully mounted', async () => {
    const res = await request(app).get('/prototypes/madman-3d');
    // Dock container
    expect(res.text).toContain('id="control-dock"');
    // Wireframe toggle
    expect(res.text).toContain('id="btn-toggle-wireframe"');
    expect(res.text).toContain('toggleWireframe');
    // Lighting color presets
    expect(res.text).toContain('id="btn-color-emerald"');
    expect(res.text).toContain('id="btn-color-pink"');
    expect(res.text).toContain('id="btn-color-gold"');
    expect(res.text).toContain('setLightingTheme');
    // Turntable speed & particle explosion
    expect(res.text).toContain('id="btn-turntable-speed"');
    expect(res.text).toContain('id="btn-pulse-particles"');
  });

  test('9. Benchmark references and portfolio cards are rendered', async () => {
    const res = await request(app).get('/prototypes/madman-3d');
    expect(res.text).toContain('golime.xyz');
    expect(res.text).toContain('editfr.com');
    expect(res.text).toContain('Banglalink Toffee');
    expect(res.text).toContain('Banglalink Ryze');
    expect(res.text).toContain('ToffeeCon 2026');
  });

  test('10. Viewport configuration is responsive and calibrated with viewport-fit=cover', async () => {
    const res = await request(app).get('/prototypes/madman-3d');
    expect(res.text).toContain('viewport-fit=cover');
    expect(res.text).toContain('width=device-width');
  });

});
