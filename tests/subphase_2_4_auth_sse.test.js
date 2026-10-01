/**
 * tests/subphase_2_4_auth_sse.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.4: Auth SSE Events (Live Authentication Telemetry)
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies that all key authentication lifecycle operations emit real-time
 * `auth_event` SSE broadcasts:
 * 1. POST /api/auth/pin/generate emits pin_generated
 * 2. POST /api/auth/pin/verify emits login_success on correct PIN
 * 3. POST /api/auth/pin/verify emits login_failure on incorrect PIN
 * 4. POST /api/auth/pin/verify emits account_locked on 5 failed attempts (HTTP 429)
 * 5. POST /api/auth/pin/set emits pin_set on successful PIN configuration
 * 6. POST /api/auth/logout emits logout on session invalidation
 * 7. POST /api/auth/telegram emits login_success on Mini App handshake
 */

const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/auth');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');
const sse = require('../src/services/sse');
const { readDB, writeDB } = require('../src/services/db');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Sub-Phase 2.4: Auth SSE Events (Live Authentication Telemetry)', () => {
  let broadcastSpy;
  const testPhone = '01799887766';
  const testPhoneLock = '01711223344';

  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Telemetry Lead',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team',
    phone: '01700000001'
  });

  const memberToken = signToken({
    userId: 'EMP-002',
    name: 'Crew Telemetry Member',
    role: 'Motion Designer',
    accessLevel: 'Specialist / Crew',
    department: 'Production',
    linkedType: 'team',
    phone: testPhone
  });

  beforeAll(async () => {
    // Seed db with test member
    try {
      const db = await readDB();
      db.team = db.team || [];
      const exists = db.team.find(m => m.phone === testPhone);
      if (!exists) {
        db.team.push({
          id: 'EMP-002',
          emp_code: 'EMP-002',
          name: 'Crew Telemetry Member',
          phone: testPhone,
          role: 'Motion Designer',
          accessLevel: 'Specialist / Crew'
        });
      }
      await writeDB(db);
    } catch (_) {}
  });

  beforeEach(() => {
    broadcastSpy = jest.spyOn(sse, 'broadcast').mockImplementation(() => {});
  });

  afterEach(() => {
    broadcastSpy.mockRestore();
  });

  test('1. POST /api/auth/pin/generate emits pin_generated auth_event', async () => {
    const res = await request(app)
      .post('/api/auth/pin/generate')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        phone: testPhone,
        linkedType: 'team',
        contactName: 'Crew Telemetry Member'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pin).toBeDefined();

    expect(broadcastSpy).toHaveBeenCalledWith('auth_event', expect.objectContaining({
      type: 'pin_generated',
      action: 'pin_generated',
      phone: testPhone,
      generatedBy: 'Admin Telemetry Lead'
    }));
  });

  test('2. POST /api/auth/pin/verify emits login_failure auth_event on wrong PIN', async () => {
    const res = await request(app)
      .post('/api/auth/pin/verify')
      .send({
        phone: testPhone,
        pin: '0000',
        portal: 'crew'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);

    expect(broadcastSpy).toHaveBeenCalledWith('auth_event', expect.objectContaining({
      type: 'login_failure',
      action: 'login_failure',
      phone: testPhone,
      portal: 'crew'
    }));
  });

  test('3. POST /api/auth/pin/verify emits login_success auth_event on correct PIN', async () => {
    // Generate known PIN
    const genRes = await request(app)
      .post('/api/auth/pin/generate')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ phone: testPhone, linkedType: 'team' });

    const correctPin = genRes.body.pin;
    broadcastSpy.mockClear();

    const res = await request(app)
      .post('/api/auth/pin/verify')
      .send({
        phone: testPhone,
        pin: correctPin,
        portal: 'crew'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();

    expect(broadcastSpy).toHaveBeenCalledWith('auth_event', expect.objectContaining({
      type: 'login_success',
      action: 'login_success',
      phone: testPhone,
      portal: 'crew'
    }));
  });

  test('4. POST /api/auth/pin/verify emits account_locked auth_event and returns 429 after 5 failed attempts', async () => {
    // Generate PIN for dedicated lockout phone
    await request(app)
      .post('/api/auth/pin/generate')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ phone: testPhoneLock, linkedType: 'team' });

    // Try wrong PIN up to 5 times
    let lastRes;
    for (let i = 1; i <= 5; i++) {
      lastRes = await request(app)
        .post('/api/auth/pin/verify')
        .send({
          phone: testPhoneLock,
          pin: '9999'
        });
    }

    expect(lastRes.statusCode).toBe(429);
    expect(lastRes.body.locked).toBe(true);

    expect(broadcastSpy).toHaveBeenCalledWith('auth_event', expect.objectContaining({
      type: 'account_locked',
      action: 'account_locked',
      phone: testPhoneLock,
      reason: expect.stringMatching(/5 failed PIN attempts/i)
    }));
  });

  test('5. POST /api/auth/pin/set emits pin_set auth_event', async () => {
    const res = await request(app)
      .post('/api/auth/pin/set')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        phone: testPhone,
        newPin: '5678'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    expect(broadcastSpy).toHaveBeenCalledWith('auth_event', expect.objectContaining({
      type: 'pin_set',
      action: 'pin_set',
      phone: testPhone
    }));
  });

  test('6. POST /api/auth/logout emits logout auth_event', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    expect(broadcastSpy).toHaveBeenCalledWith('auth_event', expect.objectContaining({
      type: 'logout',
      action: 'logout',
      userId: 'EMP-002',
      name: 'Crew Telemetry Member'
    }));
  });

  test('7. POST /api/auth/telegram emits login_success auth_event on Mini App login', async () => {
    const res = await request(app)
      .post('/api/auth/telegram')
      .send({
        telegramId: 'debug',
        userType: 'team'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    expect(broadcastSpy).toHaveBeenCalledWith('auth_event', expect.objectContaining({
      type: 'login_success',
      action: 'login_success',
      method: 'telegram_miniapp',
      telegramId: 'debug'
    }));
  });
});
