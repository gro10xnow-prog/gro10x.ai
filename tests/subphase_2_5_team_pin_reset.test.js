/**
 * tests/subphase_2_5_team_pin_reset.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.5: Fix `is_permanent` vs `is_temp` in Team PIN Reset
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. Resetting PIN with customPin sets `is_temp: false` (and `isTemp: false`)
 * 2. Resetting PIN without customPin generates a temp PIN with `is_temp: true`
 * 3. Member creation with provided PIN persists `is_temp: false`
 * 4. Verifying reset PINs via /api/auth/pin/verify reflects the exact `isTemp` flag
 * 5. PIN resets trigger real-time `auth_event` SSE broadcasts
 * 6. Code audit: Zero occurrences of `is_permanent` exist in src/
 */

const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const teamRoutes = require('../src/routes/team');
const authRoutes = require('../src/routes/auth');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');
const sse = require('../src/services/sse');
const { readDB, writeDB } = require('../src/services/db');
const { supabase, isSupabaseConfigured } = require('../src/services/supabase');

const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use('/api/team', teamRoutes);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Sub-Phase 2.5: Team PIN Reset & is_temp Consistency', () => {
  let broadcastSpy;

  const testSuffix = Date.now();
  const testEmpId = crypto.randomUUID();
  const testEmpCode = `GRO-PIN-${testSuffix}`;
  const testPhone = `01777${String(testSuffix).slice(-6)}`;

  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'HR Director',
    role: 'HR Director',
    accessLevel: 'Owner / Admin',
    department: 'HR',
    linkedType: 'team'
  });

  beforeAll(async () => {
    // Seed test profile
    const testMember = {
      id: testEmpId,
      emp_code: testEmpCode,
      name: 'Rifat Pin Specialist',
      phone: testPhone,
      role: 'DevOps Specialist',
      access_level: 'Specialist / Crew',
      department: 'Technology',
      created_at: new Date().toISOString()
    };

    try {
      const db = await readDB();
      db.team = db.team || [];
      db.team.push(testMember);
      await writeDB(db);
    } catch (_) {}

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').insert([testMember]);
      } catch (_) {}
    }
  });

  afterAll(async () => {
    // Cleanup
    try {
      const db = await readDB();
      if (db.team) db.team = db.team.filter(m => m.emp_code !== testEmpCode);
      await writeDB(db);
    } catch (_) {}

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').delete().eq('emp_code', testEmpCode);
        await supabase.from('auth_pins').delete().or(`phone.eq.${testPhone},norm_phone.eq.${testPhone.slice(-10)}`);
      } catch (_) {}
    }
  });

  beforeEach(() => {
    broadcastSpy = jest.spyOn(sse, 'broadcast').mockImplementation(() => {});
  });

  afterEach(() => {
    broadcastSpy.mockRestore();
  });

  test('1. Resetting PIN with customPin sets is_temp: false and returns isTemp: false', async () => {
    const res = await request(app)
      .post(`/api/team/${testEmpCode}/reset-pin`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ customPin: '8899' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tempPin).toBe('8899');
    expect(res.body.isTemp).toBe(false);

    // Verify auth_event broadcast
    expect(broadcastSpy).toHaveBeenCalledWith('auth_event', expect.objectContaining({
      type: 'pin_set',
      action: 'pin_set',
      isTemp: false
    }));

    // Verify authentication with the new PIN returns isTemp: false
    const authRes = await request(app)
      .post('/api/auth/pin/verify')
      .send({ phone: testPhone, pin: '8899', portal: 'crew' });

    expect(authRes.statusCode).toBe(200);
    expect(authRes.body.success).toBe(true);
    expect(authRes.body.isTemp).toBe(false);
  });

  test('2. Resetting PIN without customPin generates temp PIN with is_temp: true and returns isTemp: true', async () => {
    const res = await request(app)
      .post(`/api/team/${testEmpCode}/reset-pin`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tempPin).toBeDefined();
    expect(res.body.tempPin.length).toBe(4);
    expect(res.body.isTemp).toBe(true);

    // Verify auth_event broadcast
    expect(broadcastSpy).toHaveBeenCalledWith('auth_event', expect.objectContaining({
      type: 'pin_generated',
      action: 'pin_generated',
      isTemp: true
    }));

    // Verify authentication with the temp PIN returns isTemp: true
    const authRes = await request(app)
      .post('/api/auth/pin/verify')
      .send({ phone: testPhone, pin: res.body.tempPin, portal: 'crew' });

    expect(authRes.statusCode).toBe(200);
    expect(authRes.body.success).toBe(true);
    expect(authRes.body.isTemp).toBe(true);
  });

  test('3. Creating member with provided PIN sets is_temp: false and credentials', async () => {
    const newMemberSuffix = Date.now();
    const newPhone = `01888${String(newMemberSuffix).slice(-6)}`;
    const newEmpCode = `GRO-NEW-${newMemberSuffix}`;

    const res = await request(app)
      .post('/api/team')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Sara UI Designer',
        phone: newPhone,
        role: 'UI/UX Designer',
        department: 'Design',
        accessLevel: 'Specialist / Crew',
        pin: '4321'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.credentials).toBeDefined();
    expect(res.body.credentials.pin).toBe('4321');

    // Verify authentication with provided PIN returns isTemp: false
    const authRes = await request(app)
      .post('/api/auth/pin/verify')
      .send({ phone: newPhone, pin: '4321', portal: 'crew' });

    expect(authRes.statusCode).toBe(200);
    expect(authRes.body.success).toBe(true);
    expect(authRes.body.isTemp).toBe(false);

    // Cleanup
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').delete().eq('phone', newPhone);
        await supabase.from('auth_pins').delete().or(`phone.eq.${newPhone},norm_phone.eq.${newPhone.slice(-10)}`);
      } catch (_) {}
    }
  });

  test('4. Code integrity check: zero occurrences of is_permanent exist in src/ directory', () => {
    function scanDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (file.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content).not.toContain('is_permanent');
        }
      }
    }

    scanDir(path.resolve(__dirname, '../src'));
  });
});
