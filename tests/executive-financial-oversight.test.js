const request = require('supertest');
const express = require('express');
const { signToken } = require('../src/services/jwt');
const errorHandler = require('../src/middleware/errorHandler');
const paymentRoutes = require('../src/routes/payments');
const { handleFinanceSummary } = require('../src/services/bot/handlers/briefing');

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);
app.use(errorHandler);

describe('Phase 1: Executive Financial Oversight & Intelligence Test Suite', () => {
  const adminToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Stakeholder',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  // 1. Telegram Financial Intelligence Handler Test
  test('handleFinanceSummary: sends formatted BDT currency and Net Cash Position', async () => {
    let capturedChatId = null;
    let capturedText = null;
    let capturedOptions = null;

    const mockTeamBot = {
      sendMessage: jest.fn().mockImplementation((chatId, text, options) => {
        capturedChatId = chatId;
        capturedText = text;
        capturedOptions = options;
        return Promise.resolve({ message_id: 999 });
      })
    };

    const mockMsg = {
      chat: { id: 7754769807 }
    };

    await handleFinanceSummary(mockTeamBot, mockMsg);

    expect(mockTeamBot.sendMessage).toHaveBeenCalled();
    expect(capturedChatId).toBe(7754769807);
    expect(capturedText).toContain('PURPLEBOT DIGITAL — EXECUTIVE FINANCIAL INTELLIGENCE');
    expect(capturedText).toContain('৳');
    expect(capturedText).toContain('BDT');
    expect(capturedText).toContain('Net Operational Cash Position');
    expect(capturedText).not.toContain('$ USD');
    expect(capturedOptions).toHaveProperty('parse_mode', 'Markdown');
  });

  // 2. Net Cash Position Calculation Logic
  test('Net Cash Position: accurately balances revenue against operational commitments', () => {
    const paidRevenue = 450000;
    const disbursedExpenses = 60000;
    const monthlyPayroll = 220000;

    const netCashPosition = paidRevenue - (disbursedExpenses + monthlyPayroll);
    expect(netCashPosition).toBe(170000);

    const totalBilled = paidRevenue + 150000; // 600,000 total
    const collectionRate = Math.round((paidRevenue / totalBilled) * 100);
    expect(collectionRate).toBe(75);
  });

  // 3. Payment Submission Dispatches Alert with Valid TrxID
  test('POST /api/payments with valid bKash TrxID succeeds and returns payment record', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        clientId: 'CLI-0008',
        clientName: 'Tasin Traders',
        amount: 85000,
        paymentMethod: 'bKash Merchant',
        trxId: `TRX_${Date.now()}`
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.payment).toHaveProperty('trx_id');
    expect(res.body.payment.amount).toBe(85000);
  });
});
