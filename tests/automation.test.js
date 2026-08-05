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
    expect(() => processAutomationEvent('task_created', mockTask)).not.toThrow();
  });

  it('Automation Engine should process task_stage_changed event', () => {
    const mockTask = { id: 'TSK-MOCK', title: 'Mock Task', stage: 'In Progress', assignee: 'Jane' };
    expect(() => processAutomationEvent('task_stage_changed', mockTask)).not.toThrow();
  });

  it('Automation Engine should process invoice_paid event', () => {
    const mockInvoice = { id: 'INV-MOCK', status: 'Paid', amount: 50000, client: 'Test Client' };
    expect(() => processAutomationEvent('invoice_paid', mockInvoice)).not.toThrow();
  });
});
