/**
 * tests/subphase_4_1_payslip_disbursement.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.1: Payslip Generation & Salary Disbursement Records
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. POST /api/team/:id/disburse-salary calculates salary, persists payslip, logs expense
 * 2. Expense is created with category 'Payroll & Compensation' and status 'Disbursed'
 * 3. Dual-persistence: db.payslips and db.expenses in data/db.json
 * 4. SSE 'payroll_update' telemetry is emitted
 * 5. GET /api/team/:id/payslips returns history for employee / admin
 * 6. RBAC: other employees cannot access peer payslips (403 Forbidden)
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { readDB, writeDB } = require('../src/services/db');
const sse = require('../src/services/sse');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

describe('Sub-Phase 4.1: Payslip Generation & Salary Disbursement Records', () => {
  const adminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Mehedi Bin Jayed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const employeeToken = signToken({
    userId: 'EMP-PROD-002',
    emp_code: 'EMP-PROD-002',
    name: 'Anika Tabassum',
    role: 'AI Video Editor',
    accessLevel: 'Crew / Specialist',
    department: 'Production',
    linkedType: 'team'
  });

  const peerToken = signToken({
    userId: 'EMP-PROD-003',
    emp_code: 'EMP-PROD-003',
    name: 'Rafsan Ahmed',
    role: 'Copywriter',
    accessLevel: 'Crew / Specialist',
    department: 'Creative',
    linkedType: 'team'
  });

  let originalDbBackup = null;
  const targetEmpId = 'EMP-PROD-002';
  let generatedPayslipId = null;
  let generatedExpenseId = null;

  beforeAll(async () => {
    if (fs.existsSync(DB_JSON_PATH)) {
      originalDbBackup = fs.readFileSync(DB_JSON_PATH, 'utf8');
    }

    // Ensure target employee exists in local DB
    const db = await readDB();
    db.team = db.team || [];
    const exists = db.team.find(t => t.id === targetEmpId || t.emp_code === targetEmpId);
    if (!exists) {
      db.team.push({
        id: targetEmpId,
        emp_code: targetEmpId,
        name: 'Anika Tabassum',
        role: 'AI Video Editor',
        department: 'Production',
        base_salary: 40000,
        earned_commissions: 5000
      });
      await writeDB(db);
    }
  });

  afterAll(async () => {
    try {
      if (originalDbBackup) {
        fs.writeFileSync(DB_JSON_PATH, originalDbBackup, 'utf8');
      }

      // Cleanup Supabase if configured
      const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
      if (isSupabaseConfigured()) {
        if (generatedPayslipId) await supabase.from('payslips').delete().eq('id', generatedPayslipId);
        if (generatedExpenseId) await supabase.from('expenses').delete().eq('id', generatedExpenseId);
      }
    } catch (_) {}
  });

  test('1. POST /api/team/:id/disburse-salary disburses salary, creates payslip, and logs expense', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    const res = await request(app)
      .post(`/api/team/${targetEmpId}/disburse-salary`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        month: 'October 2026',
        bonus: 2000,
        deductions: 1000
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.payslip).toBeDefined();
    expect(res.body.expense).toBeDefined();

    const { payslip, expense } = res.body;
    generatedPayslipId = payslip.id;
    generatedExpenseId = expense.id;

    // Verify calculation: base(40000) + bonus(2000) + comm(5000) - ded(1000) = 46000
    expect(payslip.base_salary).toBe(40000);
    expect(payslip.bonus).toBe(2000);
    expect(payslip.net_salary).toBe(46000);
    expect(payslip.status).toBe('Disbursed');

    // Verify linked expense record
    expect(expense.category).toBe('Payroll & Compensation');
    expect(expense.amount).toBe(46000);
    expect(expense.status).toBe('Disbursed');
    expect(expense.disbursed).toBe(true);

    // Verify dual-persistence in db.json
    const db = await readDB();
    const persistedPayslip = (db.payslips || []).find(p => p.id === generatedPayslipId);
    expect(persistedPayslip).toBeDefined();
    expect(persistedPayslip.net_salary).toBe(46000);

    const persistedExpense = (db.expenses || []).find(e => e.id === generatedExpenseId);
    expect(persistedExpense).toBeDefined();
    expect(persistedExpense.amount).toBe(46000);

    // Verify SSE payroll_update broadcast
    const payrollCall = sseSpy.mock.calls.find(c => c[0] === 'payroll_update');
    expect(payrollCall).toBeDefined();
    expect(payrollCall[1].employeeId).toBe(targetEmpId);

    sseSpy.mockRestore();
  });

  test('2. GET /api/team/:id/payslips returns payslips for Admin', async () => {
    const res = await request(app)
      .get(`/api/team/${targetEmpId}/payslips`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.payslips)).toBe(true);
    const found = res.body.payslips.find(p => p.id === generatedPayslipId);
    expect(found).toBeDefined();
  });

  test('3. Employee can retrieve their own payslips via GET /api/team/:id/payslips', async () => {
    const res = await request(app)
      .get(`/api/team/${targetEmpId}/payslips`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const found = res.body.payslips.find(p => p.id === generatedPayslipId);
    expect(found).toBeDefined();
  });

  test('4. Peer employee attempting to access colleague payslips receives 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/team/${targetEmpId}/payslips`)
      .set('Authorization', `Bearer ${peerToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });
});
