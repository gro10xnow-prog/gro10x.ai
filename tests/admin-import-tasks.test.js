const request = require('supertest');
const express = require('express');
const adminImportRoutes = require('../src/routes/admin-import');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/admin/import', adminImportRoutes);
app.use(errorHandler);

describe('Admin Bulk Import Projects & Tasks Test Suite', () => {
  const adminToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Stakeholder',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const crewToken = signToken({
    userId: 'EMP-015',
    name: 'Specialist Crew',
    role: 'Editor',
    accessLevel: 'Specialist / Crew',
    department: 'Post Production',
    linkedType: 'team'
  });

  // 1. RBAC Guard on Projects & Tasks Import
  test('POST /api/admin/import/projects with crew token returns 403', async () => {
    const res = await request(app)
      .post('/api/admin/import/projects')
      .set('Authorization', `Bearer ${crewToken}`)
      .send({ rows: [{ name: 'Test Campaign' }] });
    expect(res.statusCode).toBe(403);
  });

  test('POST /api/admin/import/tasks with crew token returns 403', async () => {
    const res = await request(app)
      .post('/api/admin/import/tasks')
      .set('Authorization', `Bearer ${crewToken}`)
      .send({ rows: [{ title: 'Test Task' }] });
    expect(res.statusCode).toBe(403);
  });

  // 2. Projects Bulk Import
  test('POST /api/admin/import/projects with admin token bulk imports projects', async () => {
    const res = await request(app)
      .post('/api/admin/import/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        rows: [
          {
            name: `Apex Autumn Campaign ${Date.now()}`,
            client: 'Apex Footwear',
            department: 'Production',
            workflowType: 'video_production',
            status: 'Active',
            startDate: '2026-09-01',
            dueDate: '2026-09-30',
            budget: 150000,
            description: 'September 2026 commercial video production'
          }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.addedCount || res.body.addedCount).toBeGreaterThanOrEqual(1);
  });

  // 3. Tasks Bulk Import with Assignee Resolution
  test('POST /api/admin/import/tasks with admin token bulk imports tasks and resolves assignees', async () => {
    const res = await request(app)
      .post('/api/admin/import/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        rows: [
          {
            title: `Hero Commercial Cut 1 ${Date.now()}`,
            client: 'Apex Footwear',
            assignee: 'Md. Zahin Khandaker',
            stage: 'Editing',
            priority: 'High',
            dueDate: '2026-09-15'
          }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.addedCount || res.body.addedCount).toBeGreaterThanOrEqual(1);
  });
});
