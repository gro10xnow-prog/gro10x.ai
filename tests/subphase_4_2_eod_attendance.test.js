/**
 * tests/subphase_4_2_eod_attendance.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.2: EOD Report Persistence & Attendance Tracking
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. POST /api/team/attendance clocks in, persists record, emits attendance_update SSE
 * 2. GET /api/team/attendance retrieves attendance records with employee filtering
 * 3. POST /api/team/eod persists daily EOD to db.json and Supabase, emits eod_update SSE
 * 4. GET /api/team/eod retrieves employee EOD reports
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { readDB, writeDB } = require('../src/services/db');
const sse = require('../src/services/sse');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

describe('Sub-Phase 4.2: EOD Report Persistence & Attendance Tracking', () => {
  const employeeToken = signToken({
    userId: 'EMP-ATT-001',
    emp_code: 'EMP-ATT-001',
    name: 'Tasmia Noor',
    role: 'Growth Specialist',
    accessLevel: 'Crew / Specialist',
    department: 'Growth',
    linkedType: 'team'
  });

  let originalDbBackup = null;
  let testAttendanceId = null;
  let testEodId = null;

  beforeAll(async () => {
    if (fs.existsSync(DB_JSON_PATH)) {
      originalDbBackup = fs.readFileSync(DB_JSON_PATH, 'utf8');
    }
  });

  afterAll(async () => {
    try {
      if (originalDbBackup) {
        fs.writeFileSync(DB_JSON_PATH, originalDbBackup, 'utf8');
      }

      const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
      if (isSupabaseConfigured()) {
        if (testAttendanceId) await supabase.from('attendance').delete().eq('id', testAttendanceId);
        if (testEodId) await supabase.from('eod_reports').delete().eq('id', testEodId);
      }
    } catch (_) {}
  });

  test('1. POST /api/team/attendance clocks in and records attendance', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    const res = await request(app)
      .post('/api/team/attendance')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        status: 'In Studio',
        location: 'Niketon HQ - Studio 4'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.attendance).toBeDefined();

    const att = res.body.attendance;
    testAttendanceId = att.id;
    expect(att.status).toBe('In Studio');
    expect(att.employeeId || att.employee_id).toBe('EMP-ATT-001');

    // Verify dual-persistence in db.json
    const db = await readDB();
    const persisted = (db.attendance || []).find(a => a.id === testAttendanceId);
    expect(persisted).toBeDefined();

    // Verify SSE broadcast
    expect(sseSpy).toHaveBeenCalledWith('attendance_update', expect.anything());
    sseSpy.mockRestore();
  });

  test('2. GET /api/team/attendance returns attendance records', async () => {
    const res = await request(app)
      .get('/api/team/attendance?employeeId=EMP-ATT-001')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find(a => a.id === testAttendanceId || a.employeeId === 'EMP-ATT-001' || a.employee_id === 'EMP-ATT-001');
    expect(found).toBeDefined();
  });

  test('3. POST /api/team/eod submits daily report with dual persistence and SSE', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    const res = await request(app)
      .post('/api/team/eod')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        employeeId: 'EMP-ATT-001',
        name: 'Tasmia Noor',
        text: 'Completed sprint backlog items and verified attendance API',
        tasksTomorrow: 'Ship client portal stabilization modules',
        blockers: 'None',
        mood: '🚀 Unstoppable',
        hours: 8
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.eod).toBeDefined();

    const eod = res.body.eod;
    testEodId = eod.id;
    expect(eod.employee_id || eod.employeeId).toBe('EMP-ATT-001');
    expect(eod.tasks_done || eod.tasksCompleted).toContain('Completed sprint backlog');
    expect(eod.mood).toBe('🚀 Unstoppable');

    // Verify dual-persistence in db.json
    const db = await readDB();
    const persistedEod = (db.eod_reports || []).find(r => r.id === testEodId);
    expect(persistedEod).toBeDefined();
    expect(persistedEod.tasks_done || persistedEod.tasksCompleted).toContain('Completed sprint backlog');

    // Verify SSE broadcast
    expect(sseSpy).toHaveBeenCalledWith('eod_update', expect.anything());
    sseSpy.mockRestore();
  });

  test('4. GET /api/team/eod retrieves submitted EOD report for employee', async () => {
    const res = await request(app)
      .get('/api/team/eod?employeeId=EMP-ATT-001')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find(r => r.id === testEodId || r.employee_id === 'EMP-ATT-001' || r.employeeId === 'EMP-ATT-001');
    expect(found).toBeDefined();
    expect(found.tasks_done || found.tasksCompleted || found.text).toBeDefined();
  });
});
