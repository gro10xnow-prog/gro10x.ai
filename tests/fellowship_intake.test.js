/**
 * tests/fellowship_intake.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification Test Suite for the GRO10X AI Fellowship Intake Portal & Ingress API
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

const APPLICATIONS_FILE = path.resolve(__dirname, '../data/fellowship_applications.json');

describe('AI Fellowship Intake Portal & Screener Verification Suite', () => {
  let initialApplications = [];

  beforeAll(() => {
    if (fs.existsSync(APPLICATIONS_FILE)) {
      try {
        const raw = fs.readFileSync(APPLICATIONS_FILE, 'utf8');
        initialApplications = JSON.parse(raw);
      } catch (_) {
        initialApplications = [];
      }
    }
  });

  afterAll(() => {
    // Restore or leave clean JSON array
    if (initialApplications && initialApplications.length > 0) {
      try {
        fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(initialApplications, null, 2), 'utf8');
      } catch (_) {}
    }
  });

  describe('1. Public Fellowship Intake Portal Accessibility', () => {
    test('GET /fellowship delivers public intake portal with 200 OK', async () => {
      const res = await request(app).get('/fellowship');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('AI Media & Research Fellowship');
      expect(res.text).toContain('RTX 4090');
      expect(res.text).toContain('Google Veo');
      expect(res.text).toContain('Zayan · Virtual CTO');
      expect(res.text).toContain('October 31, 2026');
    });

    test('GET /fellowship.html delivers public intake portal with 200 OK', async () => {
      const res = await request(app).get('/fellowship.html');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('FELLOW-2026');
      expect(res.text).toContain('screener');
    });

    test('GET /api/fellowship/health returns ingress readiness probe', async () => {
      const res = await request(app).get('/api/fellowship/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('online');
      expect(res.body.deadline).toContain('2026-10-31');
    });
  });

  describe('2. Ingress Validation & Error Handling (POST /api/fellowship/apply)', () => {
    test('Rejects submission with missing candidate name', async () => {
      const res = await request(app)
        .post('/api/fellowship/apply')
        .send({
          phone: '+8801712345678',
          university: 'University of Dhaka',
          department: 'CSE',
          graduationYear: '2027',
          experienceSummary: 'Midjourney, Claude, Premiere',
          portfolioUrl: 'https://drive.google.com/sample',
          creativeExperimentPrompt: 'A 10-episode cyberpunk series in Old Dhaka.'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/name is required/i);
    });

    test('Rejects submission with missing contact phone number', async () => {
      const res = await request(app)
        .post('/api/fellowship/apply')
        .send({
          name: 'Rahim Ahmed',
          university: 'North South University',
          department: 'EEE',
          graduationYear: '2026',
          experienceSummary: 'Runway Gen-3, CapCut',
          portfolioUrl: 'https://youtube.com/@sample',
          creativeExperimentPrompt: 'A synthetic media commercial series.'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/phone number is required/i);
    });

    test('Rejects submission with missing portfolio URL', async () => {
      const res = await request(app)
        .post('/api/fellowship/apply')
        .send({
          name: 'Rahim Ahmed',
          phone: '+8801712345678',
          university: 'BRAC University',
          department: 'CSE',
          graduationYear: '2027',
          experienceSummary: 'ComfyUI, Stable Diffusion, DaVinci',
          creativeExperimentPrompt: 'Neural film restoration experiment.'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/portfolio.*is required/i);
    });

    test('Rejects submission with missing creative experiment prompt', async () => {
      const res = await request(app)
        .post('/api/fellowship/apply')
        .send({
          name: 'Rahim Ahmed',
          phone: '+8801712345678',
          university: 'IUT',
          department: 'CSE',
          graduationYear: '2027',
          experienceSummary: 'Claude, Premiere, Midjourney',
          portfolioUrl: 'https://behance.net/sample'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/creative direction.*is required/i);
    });
  });

  describe('3. Successful Application Submission & Zero Data-Loss Atomic Storage', () => {
    let candidateToken1 = null;
    let candidateToken2 = null;

    test('Accepts valid candidate 1 and generates FELLOW-2026-[HEX4] token', async () => {
      const payload1 = {
        name: 'Sadman Sakib',
        phone: '+8801711223344',
        university: 'University of Dhaka',
        department: 'Computer Science & Engineering',
        graduationYear: '2027',
        experienceSummary: 'Google Veo 2, Midjourney v6, Premiere Pro, Claude 3.7. Directed 5 micro-commercials.',
        portfolioUrl: 'https://drive.google.com/drive/folders/sample-sakib',
        creativeExperimentPrompt: 'A 10-episode cyberpunk micro-series set in Old Dhaka 2050 using Google Veo for temporal character persistence.'
      };

      const res = await request(app)
        .post('/api/fellowship/apply')
        .send(payload1);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const candidate = res.body.data.candidate;
      expect(candidate).toBeDefined();
      expect(candidate.token).toMatch(/^FELLOW-2026-[A-F0-9]{4}$/);
      expect(candidate.id).toMatch(/^FELLOW-2026-\d+-[A-F0-9]{4}$/);
      expect(candidate.name).toBe('Sadman Sakib');
      expect(candidate.aiAptitudeScore).toBeGreaterThanOrEqual(8.8);
      expect(candidate.aiAptitudeScore).toBeLessThanOrEqual(10.0);
      expect(candidate.whatsappUrl).toContain('wa.me/8801708459008');
      expect(candidate.whatsappUrl).toContain(encodeURIComponent(candidate.token));

      candidateToken1 = candidate.token;
    });

    test('Accepts valid candidate 2 and appends atomically without data loss', async () => {
      const payload2 = {
        name: 'Ayesha Siddiqua',
        phone: '+8801822334455',
        university: 'North South University',
        department: 'Media & Journalism',
        graduationYear: '2026',
        experienceSummary: 'CapCut Desktop, Runway Gen-3, ElevenLabs, After Effects. Directed documentary shorts.',
        portfolioUrl: 'https://youtube.com/@ayesha-ai-media',
        creativeExperimentPrompt: 'A photorealistic commercial campaign transforming local Bangladeshi sustainable fashion brands using multimodal video generation.'
      };

      const res = await request(app)
        .post('/api/fellowship/apply')
        .send(payload2);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      candidateToken2 = res.body.data.candidate.token;
      expect(candidateToken2).toMatch(/^FELLOW-2026-[A-F0-9]{4}$/);
    });

    test('Verifies data/fellowship_applications.json holds both applications with zero data-loss', () => {
      expect(fs.existsSync(APPLICATIONS_FILE)).toBe(true);
      const raw = fs.readFileSync(APPLICATIONS_FILE, 'utf8');
      const apps = JSON.parse(raw);
      expect(Array.isArray(apps)).toBe(true);
      expect(apps.length).toBeGreaterThanOrEqual(2);

      const app1 = apps.find(a => a.token === candidateToken1);
      const app2 = apps.find(a => a.token === candidateToken2);

      expect(app1).toBeDefined();
      expect(app1.name).toBe('Sadman Sakib');
      expect(app1.status).toBe('APPLIED');
      expect(app1.whatsappUrl).toContain('8801708459008');

      expect(app2).toBeDefined();
      expect(app2.name).toBe('Ayesha Siddiqua');
      expect(app2.status).toBe('APPLIED');
    });

    test('GET /api/fellowship/status/:token retrieves candidate record', async () => {
      const res = await request(app).get(`/api/fellowship/status/${candidateToken1}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sadman Sakib');
      expect(res.body.data.token).toBe(candidateToken1);
    });

    test('GET /api/fellowship/status/:token returns 404 for non-existent token', async () => {
      const res = await request(app).get('/api/fellowship/status/FELLOW-2026-NONEXISTENT');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
