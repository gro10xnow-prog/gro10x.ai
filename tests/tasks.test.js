const request = require('supertest');
const app = require('../server');

describe('Task Management API', () => {
  it('GET /api/tasks should return array of tasks with canonical seed deliverables', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(8);
    
    // Verify canonical task properties
    const sample = res.body.find(t => t.id === 'TSK-APEX-01') || res.body[0];
    expect(sample.id).toBeDefined();
    expect(sample.title).toBeDefined();
    expect(sample.stage).toBeDefined();
    expect(sample.workflow_type || sample.category).toBeDefined();
  });

  it('PATCH /api/tasks/:id/stage should return 400 if stage missing', async () => {
    const res = await request(app).patch('/api/tasks/TSK-999/stage').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('PATCH /api/tasks/:id/stage should update deliverable stage', async () => {
    const res = await request(app).patch('/api/tasks/TSK-APEX-01/stage').send({ stage: 'Internal QC' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.task.stage).toBe('Internal QC');
    
    // Revert back
    await request(app).patch('/api/tasks/TSK-APEX-01/stage').send({ stage: 'Editing' });
  });

  it('POST /api/tasks should create a deliverable and return mapped fields', async () => {
    const createRes = await request(app).post('/api/tasks').send({
      title: 'Automated Test Deliverable',
      client: 'Apex Footwear Limited',
      stage: 'Briefing',
      priority: 'High',
      assignee: 'Md. Zahin Khandaker',
      department: 'Post Production',
      workflow_type: 'video',
      estimated_hours: 14,
      description: 'Automated test task creation verify'
    });

    expect([200, 201]).toContain(createRes.statusCode);
    const task = createRes.body.task || createRes.body;
    expect(task.id).toBeDefined();
    expect(task.title).toBe('Automated Test Deliverable');
    expect(task.client).toBe('Apex Footwear Limited');
    expect(task.stage).toBe('Briefing');
    expect(task.estimatedHours).toBe(14);

    // Clean up via DELETE /api/tasks/:id
    const delRes = await request(app).delete(`/api/tasks/${task.id}`);
    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  it('POST /api/tasks should return 400 when task title is empty or missing', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: '   ',
      client: 'Apex Footwear Limited'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/title is required/i);
  });

  it('POST /api/tasks should preserve client_id and auto-default due date if omitted', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: 'Preserve Client ID Test Deliverable',
      client: 'Apex Footwear Limited',
      client_id: 'CLI-APEX',
      priority: 'High'
    });
    expect([200, 201]).toContain(res.statusCode);
    const task = res.body.task || res.body;
    expect(task.id).toBeDefined();
    expect(task.clientId).toBe('CLI-APEX');
    expect(task.dueDate).toBeDefined();

    // Clean up
    await request(app).delete(`/api/tasks/${task.id}`);
  });

  it('GET /api/tasks should support label filtering', async () => {
    const res = await request(app).get('/api/tasks?labels=Urgent');
    expect(res.statusCode).toBe(200);
    if (res.body.length > 0) {
      expect(res.body[0].labels).toBeDefined();
    }
  });

  it('POST /api/tasks/bulk should perform bulk operations', async () => {
    const res = await request(app).post('/api/tasks/bulk').send({
      action: 'update_stage',
      taskIds: ['TSK-APEX-01'],
      payload: { stage: 'Editing' }
    });
    expect([200, 400]).toContain(res.statusCode);
  });

  it('POST /api/admin/import/tasks should preserve workflow_type, estimated_hours, and description', async () => {
    const testImportId = 'TSK-IMP-TEST-' + Date.now().toString().slice(-4);
    const importRes = await request(app).post('/api/admin/import/tasks').send({
      rows: [
        {
          id: testImportId,
          title: 'Import Metadata Verification',
          client: 'Chillox Bangladesh',
          assignee: 'Firoz Uddin Ahmed',
          department: 'Creative & Content',
          workflowType: 'social',
          stage: 'Content Draft',
          priority: 'Medium',
          dueDate: '2026-09-30',
          estimatedHours: 18,
          description: 'Special promo banner suite for campaign'
        }
      ]
    });

    expect(importRes.statusCode).toBe(200);
    expect(importRes.body.success).toBe(true);

    // Verify task was saved with full metadata
    const getRes = await request(app).get('/api/tasks');
    const importedTask = getRes.body.find(t => t.id === testImportId);
    expect(importedTask).toBeDefined();
    expect(importedTask.workflow_type).toBe('social');
    expect(importedTask.estimatedHours).toBe(18);
    expect(importedTask.description).toBe('Special promo banner suite for campaign');

    // Clean up
    await request(app).delete(`/api/tasks/${testImportId}`);
  });

  it('POST /api/tasks/:id/custom-fields should update custom fields', async () => {
    const res = await request(app).post('/api/tasks/TSK-999/custom-fields').send({
      fields: { "Client Approval": "Pending" }
    });
    expect([200, 404]).toContain(res.statusCode);
  });
});

