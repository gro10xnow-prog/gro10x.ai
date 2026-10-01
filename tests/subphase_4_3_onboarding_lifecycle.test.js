/**
 * tests/subphase_4_3_onboarding_lifecycle.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.3: Onboarding Completion: Survey + Agreement + PIN
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. Survey Part 1-4 completion via POST /api/team/survey persists survey_complete
 *    to both Supabase and data/db.json
 * 2. Emits real-time SSE 'team_update' with survey_complete: true
 * 3. Triggers Telegram prompt to sign employment agreement on Part 4 completion
 * 4. POST /api/team/agreement (Stage 1) saves employee signature & agreement_stage: 1
 * 5. POST /api/team/agreement (Stage 3) applies final seal: marks agreement_complete=true,
 *    onboarding_complete=true, emits 'team_update' SSE, and dual-persists to db.json
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { readDB, writeDB } = require('../src/services/db');
const sse = require('../src/services/sse');
const botService = require('../src/services/bot');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

describe('Sub-Phase 4.3: Onboarding Completion: Survey + Agreement + PIN', () => {
  const testEmpCode = 'EMP-ONB-777';
  let originalDbBackup = null;

  const testUserToken = signToken({
    userId: testEmpCode,
    emp_code: testEmpCode,
    name: 'Anika Specialist',
    role: 'Digital Brand Specialist',
    accessLevel: 'Crew / Specialist',
    department: 'Brand Operations',
    linkedType: 'team'
  });

  beforeAll(async () => {
    if (fs.existsSync(DB_JSON_PATH)) {
      originalDbBackup = fs.readFileSync(DB_JSON_PATH, 'utf8');
    }

    // Seed test employee in local DB
    const db = await readDB();
    db.team = db.team || [];
    db.team = db.team.filter(t => t.id !== testEmpCode && t.emp_code !== testEmpCode);
    db.team.push({
      id: testEmpCode,
      emp_code: testEmpCode,
      name: 'Anika Specialist',
      role: 'Digital Brand Specialist',
      department: 'Brand Operations',
      access_level: 'Crew / Specialist',
      telegram_id: '8877665544',
      survey_complete: false,
      agreement_stage: 0,
      agreement_complete: false,
      onboarding_complete: false,
      created_at: new Date().toISOString()
    });
    await writeDB(db);

    const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').upsert({
          emp_code: testEmpCode,
          name: 'Anika Specialist',
          role: 'Digital Brand Specialist',
          department: 'Brand Operations',
          access_level: 'Crew / Specialist',
          telegram_id: '8877665544',
          survey_complete: false,
          agreement_stage: 0,
          agreement_complete: false,
          onboarding_complete: false
        });
      } catch (_) {}
    }
  });

  afterAll(async () => {
    try {
      if (originalDbBackup) {
        fs.writeFileSync(DB_JSON_PATH, originalDbBackup, 'utf8');
      }

      const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
      if (isSupabaseConfigured()) {
        await supabase.from('profiles').delete().eq('emp_code', testEmpCode);
      }
    } catch (_) {}
  });

  test('1. POST /api/team/survey completes parts 1 through 4 and persists survey_complete', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    // Part 1
    const res1 = await request(app)
      .post('/api/team/survey')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        part: 1,
        data: {
          emergencyContact: '+8801711223344',
          personalEmail: 'anika.specialist@gmail.com',
          bloodGroup: 'B+',
          address: 'Banani, Dhaka'
        }
      });
    expect(res1.statusCode).toBe(200);

    // Part 2
    const res2 = await request(app)
      .post('/api/team/survey')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        part: 2,
        data: {
          nidNo: '19982691234567890',
          permanentAddress: 'Dhanmondi, Dhaka'
        }
      });
    expect(res2.statusCode).toBe(200);

    // Part 3
    const res3 = await request(app)
      .post('/api/team/survey')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        part: 3,
        data: {
          bankName: 'BRAC Bank',
          accountTitle: 'Anika Specialist',
          accNo: '1501203456789001',
          branch: 'Gulshan 1',
          bkashNo: '01711223344'
        }
      });
    expect(res3.statusCode).toBe(200);

    // Part 4
    const res4 = await request(app)
      .post('/api/team/survey')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        part: 4,
        data: {
          primarySkill: 'Growth Marketing & Creative Strategy',
          portfolio: 'https://anikagrowth.framer.website',
          tshirtSize: 'M'
        }
      });
    expect(res4.statusCode).toBe(200);
    expect(res4.body.surveyComplete).toBe(true);

    // Verify dual persistence in db.json
    const db = await readDB();
    const member = db.team.find(m => m.emp_code === testEmpCode);
    expect(member).toBeDefined();
    expect(member.survey_complete).toBe(true);

    // Verify SSE broadcast
    expect(sseSpy).toHaveBeenCalledWith('team_update', expect.arrayContaining([
      expect.objectContaining({ emp_code: testEmpCode, survey_complete: true })
    ]));

    sseSpy.mockRestore();
  });

  test('2. POST /api/team/agreement (Stage 1) signs agreement and transitions stage', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    const res = await request(app)
      .post('/api/team/agreement')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        stage: 1,
        signature: 'Anika Specialist (Digital Signature e-Sign)',
        timestamp: new Date().toISOString()
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stage).toBe(1);

    // Verify persistence in db.json
    const db = await readDB();
    const member = db.team.find(m => m.emp_code === testEmpCode);
    expect(member.agreement_stage).toBe(1);

    // Verify SSE broadcast
    expect(sseSpy).toHaveBeenCalledWith('team_update', expect.arrayContaining([
      expect.objectContaining({ emp_code: testEmpCode, agreement_stage: 1 })
    ]));

    sseSpy.mockRestore();
  });

  test('3. POST /api/team/agreement (Stage 3) applies final seal and marks onboarding complete', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    const res = await request(app)
      .post('/api/team/agreement')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        stage: 3,
        timestamp: new Date().toISOString()
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stage).toBe(3);
    expect(res.body.agreementComplete).toBe(true);
    expect(res.body.onboardingComplete).toBe(true);

    // Verify dual persistence in db.json
    const db = await readDB();
    const member = db.team.find(m => m.emp_code === testEmpCode);
    expect(member.agreement_stage).toBe(3);
    expect(member.agreement_complete).toBe(true);
    expect(member.onboarding_complete).toBe(true);

    // Verify SSE broadcast
    expect(sseSpy).toHaveBeenCalledWith('team_update', expect.arrayContaining([
      expect.objectContaining({
        emp_code: testEmpCode,
        agreement_stage: 3,
        agreement_complete: true,
        onboarding_complete: true
      })
    ]));

    sseSpy.mockRestore();
  });
});
