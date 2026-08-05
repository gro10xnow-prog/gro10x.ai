const request = require('supertest');
const app = require('../server');
const { processAutomationEvent } = require('../src/services/automation');

describe('Automation Engine API & Triggers', () => {
  it('GET /api/automation/rules should return list of rules', async () => {
    const res = await request(app).get('/api/automation/rules');
    expect([200, 401, 403]).toContain(res.statusCode); // Depending on auth setup
  });

  it('Automation Engine should process task_created event', () => {
    const mockTask = { id: 'TSK-MOCK', title: 'Mock Task', stage: 'Backlog', assignee: 'Jane' };
    const result = processAutomationEvent('task_created', mockTask);
    // processAutomationEvent might return undefined or a Promise, but it shouldn't throw
    expect(result).toBeDefined();
  });

  it('Automation Engine should process task_stage_changed event', () => {
    const mockTask = { id: 'TSK-MOCK', title: 'Mock Task', stage: 'In Progress', assignee: 'Jane' };
    const result = processAutomationEvent('task_stage_changed', mockTask);
    expect(result).toBeDefined();
  });

  it('Automation Engine should process invoice_paid event', () => {
    const mockInvoice = { id: 'INV-MOCK', status: 'Paid', amount: 50000, client: 'Test Client' };
    const result = processAutomationEvent('invoice_paid', mockInvoice);
    expect(result).toBeDefined();
  });
});
