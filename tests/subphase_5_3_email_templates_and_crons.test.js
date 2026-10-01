const request = require('supertest');
const app = require('../server');
const resend = require('../src/services/resend');
const { signToken } = require('../src/services/jwt');
const { readDB, writeDB } = require('../src/services/db');

function createToken(payload) {
  return signToken(payload);
}

describe('Sub-Phase 5.3: Invoice Email Delivery, Overdue Cron & Missing Email Templates', () => {
  const managerToken = createToken({
    id: 'USR-MGR-503',
    userId: 'USR-MGR-503',
    role: 'Admin',
    accessLevel: 'Finance Manager',
    name: 'Tariq HR Finance Lead'
  });

  let sendEmailSpy;

  beforeEach(() => {
    sendEmailSpy = jest.spyOn(resend, 'sendEmail').mockResolvedValue({ success: true, simulated: true });
  });

  afterEach(() => {
    sendEmailSpy.mockRestore();
  });

  test('1. Direct invocation of the 5 new email template functions generates valid emails', async () => {
    // 1.1 Staff Invitation
    const resInv = await resend.sendStaffInvitationEmail({
      name: 'Rahim Specialist',
      email: 'rahim@gro10x.ai',
      phone: '+8801711223344',
      pin: '7788',
      portalUrl: 'https://gro10x-ai.vercel.app/crew'
    });
    expect(resInv.success).toBe(true);
    expect(sendEmailSpy).toHaveBeenCalledWith(expect.objectContaining({
      to: 'rahim@gro10x.ai',
      subject: expect.stringContaining('Welcome to GRO10X')
    }));

    // 1.2 PIN Reset Alert
    const resReset = await resend.sendPinResetAlertEmail({
      name: 'Rahim Specialist',
      email: 'rahim@gro10x.ai',
      phone: '+8801711223344',
      pin: '9900'
    });
    expect(resReset.success).toBe(true);
    expect(sendEmailSpy).toHaveBeenCalledWith(expect.objectContaining({
      to: 'rahim@gro10x.ai',
      subject: expect.stringContaining('Security Alert: Your GRO10X Login PIN Was Reset')
    }));

    // 1.3 Leave Decision
    const resLeave = await resend.sendLeaveDecisionEmail({
      name: 'Anika Designer',
      email: 'anika@gro10x.ai',
      leaveType: 'Annual Vacation',
      startDate: '2026-10-10',
      endDate: '2026-10-15',
      status: 'Approved',
      reviewerName: 'Operations Lead'
    });
    expect(resLeave.success).toBe(true);
    expect(sendEmailSpy).toHaveBeenCalledWith(expect.objectContaining({
      to: 'anika@gro10x.ai',
      subject: expect.stringContaining('Leave Request Approved')
    }));

    // 1.4 Expense Decision
    const resExp = await resend.sendExpenseDecisionEmail({
      name: 'Rafsan Video Lead',
      email: 'rafsan@gro10x.ai',
      title: 'Studio Lighting Bulb replacement',
      amount: 4500,
      status: 'Approved',
      reviewerName: 'Finance Controller',
      category: 'Studio Equipment'
    });
    expect(resExp.success).toBe(true);
    expect(sendEmailSpy).toHaveBeenCalledWith(expect.objectContaining({
      to: 'rafsan@gro10x.ai',
      subject: expect.stringContaining('Expense Claim Approved')
    }));

    // 1.5 Monthly Payslip Delivery
    const resPay = await resend.sendPayslipDeliveryEmail({
      name: 'Sultana Lead',
      email: 'sultana@gro10x.ai',
      month: 'October 2026',
      netSalary: 55000,
      payslipId: 'PAY-503-OCT',
      baseSalary: 45000,
      bonus: 10000
    });
    expect(resPay.success).toBe(true);
    expect(sendEmailSpy).toHaveBeenCalledWith(expect.objectContaining({
      to: 'sultana@gro10x.ai',
      subject: expect.stringContaining('Official Monthly Earnings Statement')
    }));
  });

  test('2. POST /api/auth/pin/generate triggers staff invitation email when email provided', async () => {
    const res = await request(app)
      .post('/api/auth/pin/generate')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        phone: '+8801999887766',
        contactName: 'Tanvir QA Specialist',
        email: 'tanvir@gro10x.ai',
        linkedType: 'team'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pin).toBeDefined();

    expect(sendEmailSpy).toHaveBeenCalledWith(expect.objectContaining({
      to: 'tanvir@gro10x.ai',
      subject: expect.stringContaining('Welcome to GRO10X')
    }));
  });

  test('3. POST /api/team/:id/disburse-salary triggers payslip delivery email to employee', async () => {
    // Seed employee with email
    const db = await readDB();
    if (!db.team) db.team = [];
    const empId = 'GRO-TEST-503';
    db.team = db.team.filter(t => t.id !== empId && t.emp_code !== empId);
    db.team.push({
      id: empId,
      emp_code: empId,
      name: 'Farhan Media Buyer',
      email: 'farhan@gro10x.ai',
      base_salary: 40000
    });
    await writeDB(db);

    const res = await request(app)
      .post(`/api/team/${empId}/disburse-salary`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        month: 'October 2026',
        baseSalary: 40000,
        bonus: 5000
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    expect(sendEmailSpy).toHaveBeenCalledWith(expect.objectContaining({
      to: 'farhan@gro10x.ai',
      subject: expect.stringContaining('Official Monthly Earnings Statement')
    }));
  });

  test('4. GET /api/cron/invoice-due-reminder evaluates upcoming invoices due in next 3 days', async () => {
    // Seed an upcoming invoice due in 2 days
    const db = await readDB();
    if (!db.invoices) db.invoices = [];
    const dueInTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    db.invoices.push({
      id: 'INV-CRON-503',
      client_name: 'Starlight Retail',
      amount: 60000,
      due_date: dueInTwoDays,
      status: 'Pending'
    });
    await writeDB(db);

    const cronSecret = process.env.CRON_SECRET || 'gro10x_cron_secret_key_2026';
    const res = await request(app)
      .get('/api/cron/invoice-due-reminder')
      .set('Authorization', `Bearer ${cronSecret}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
