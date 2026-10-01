/**
 * tests/subphase_1_5_post_delivery_persistence.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.5: Post-Delivery Governance Persistence & writeDB Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. raiseProjectDispute writes disputeRecord to db.disputes and updates project status in data/db.json via writeDB
 * 2. resolveProjectDispute unfreezes warranty, adds extension days, and updates db.disputes to 'RESOLVED' in data/db.json via writeDB
 * 3. submitProjectTestimonial persists review to db.testimonials and data/db.json via writeDB
 * 4. getPublicTestimonials retrieves testimonials from dual-store fallback
 * 5. signHandoverManifest persists manifest to db.handover_manifests and data/db.json via writeDB
 * 6. Clean teardown: leaves data/db.json in pristine state
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { readDB, writeDB } = require('../src/services/db');
const {
  saveMemoryProject,
  findProject,
  raiseProjectDispute,
  resolveProjectDispute,
  submitProjectTestimonial,
  getPublicTestimonials,
  signHandoverManifest,
  getOrCreateHandoverManifest
} = require('../src/services/post-delivery');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

describe('Sub-Phase 1.5: Post-Delivery Governance Dual-Store Persistence & writeDB', () => {
  const adminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Mehedi Bin Jayed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const clientToken = signToken({
    userId: 'CLI-PERSIST-01',
    name: 'Tariq Al-Mansoor',
    role: 'Managing Director',
    accessLevel: 'Client Partner',
    department: 'Client Partner',
    linkedType: 'client',
    linkedId: 'CLI-PERSIST-01',
    company: 'Apex Logistics Global'
  });

  const testProjectId = `PRJ-SP15-${Date.now().toString().slice(-6)}`;
  let originalDbBackup = null;

  beforeAll(async () => {
    // Backup original db.json content to restore after tests
    if (fs.existsSync(DB_JSON_PATH)) {
      originalDbBackup = fs.readFileSync(DB_JSON_PATH, 'utf8');
    }

    // Seed test project in memory & local db
    const initialProject = {
      id: testProjectId,
      name: 'Apex Global Tracking Infrastructure',
      client: 'Apex Logistics Global',
      clientName: 'Apex Logistics Global',
      clientId: 'CLI-PERSIST-01',
      budget: 35000,
      department: 'Production',
      workflowType: 'composite_bundle',
      status: 'Active',
      delivery_status: 'APPROVED',
      warranty_until: new Date(Date.now() + 20 * 24 * 3600000).toISOString()
    };

    saveMemoryProject(initialProject);

    const db = await readDB();
    db.projects = db.projects || [];
    db.projects.push(initialProject);
    await writeDB(db);
  });

  afterAll(async () => {
    // Restore or clean up test entities from data/db.json
    try {
      if (originalDbBackup) {
        fs.writeFileSync(DB_JSON_PATH, originalDbBackup, 'utf8');
      } else {
        const db = await readDB();
        if (db.projects) db.projects = db.projects.filter(p => p.id !== testProjectId);
        if (db.disputes) db.disputes = db.disputes.filter(d => d.projectId !== testProjectId);
        if (db.testimonials) db.testimonials = db.testimonials.filter(t => t.projectId !== testProjectId);
        if (db.handover_manifests) db.handover_manifests = db.handover_manifests.filter(m => m.projectId !== testProjectId);
        await writeDB(db);
      }
    } catch (_) {}
  });

  test('1. raiseProjectDispute pauses warranty and persists disputeRecord to db.disputes in data/db.json', async () => {
    const res = await request(app)
      .post(`/api/projects/${testProjectId}/dispute`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        reason: 'SLA_BREACH',
        description: 'Webhook delivery dropped 12% of transaction callback events.',
        requestedRemedy: 'CORRECTION_SPRINT',
        submittedBy: 'Tariq Al-Mansoor'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.dispute).toBeDefined();
    expect(res.body.dispute.status).toBe('ACTIVE_DISPUTE');
    expect(res.body.dispute.disputePausedAt).toBeDefined();

    // Verify persistence in data/db.json directly from disk
    const diskDb = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    expect(Array.isArray(diskDb.disputes)).toBe(true);
    const persistedDispute = diskDb.disputes.find(d => d.projectId === testProjectId);
    expect(persistedDispute).toBeDefined();
    expect(persistedDispute.reason).toBe('SLA_BREACH');
    expect(persistedDispute.status).toBe('ACTIVE_DISPUTE');

    // Verify project delivery_status in data/db.json is DISPUTED
    const diskProject = (diskDb.projects || []).find(p => p.id === testProjectId);
    expect(diskProject).toBeDefined();
    expect(diskProject.delivery_status).toBe('DISPUTED');
    expect(diskProject.status).toBe('Disputed');
    expect(diskProject.dispute_paused_at).toBeDefined();
  });

  test('2. resolveProjectDispute unfreezes warranty and updates db.disputes status to RESOLVED in data/db.json', async () => {
    const res = await request(app)
      .post(`/api/projects/${testProjectId}/dispute/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resolutionType: 'CORRECTION_SPRINT_GRANTED',
        resolutionNotes: 'Patched webhook retry buffer and added 10 days warranty extension.',
        extensionDays: 10,
        resolvedBy: 'Mehedi Bin Jayed'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.resolutionType).toBe('CORRECTION_SPRINT_GRANTED');
    expect(res.body.extendedWarrantyUntil).toBeDefined();

    // Verify persistence in data/db.json directly from disk
    const diskDb = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const resolvedDispute = diskDb.disputes.find(d => d.projectId === testProjectId);
    expect(resolvedDispute).toBeDefined();
    expect(resolvedDispute.status).toBe('RESOLVED');
    expect(resolvedDispute.resolutionType).toBe('CORRECTION_SPRINT_GRANTED');
    expect(resolvedDispute.extensionDaysAdded).toBe(10);
    expect(resolvedDispute.resolvedBy).toBe('Mehedi Bin Jayed');

    // Verify project warranty extension in data/db.json
    const diskProject = (diskDb.projects || []).find(p => p.id === testProjectId);
    expect(diskProject).toBeDefined();
    expect(diskProject.delivery_status).toBe('REVISION_REQUESTED');
    expect(diskProject.dispute_paused_at).toBeNull();
    expect(new Date(diskProject.warranty_until).getTime()).toBeGreaterThan(Date.now() + 20 * 24 * 3600000);
  });

  test('3. submitProjectTestimonial persists review to db.testimonials and data/db.json', async () => {
    const res = await request(app)
      .post(`/api/projects/${testProjectId}/testimonial`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        csatRating: 5,
        npsScore: 10,
        reviewText: 'Outstanding turnaround speed and seamless enterprise governance integration.',
        videoUrl: 'https://loom.com/apex-logistics-review',
        clientDisplayName: 'Tariq Al-Mansoor',
        clientRole: 'Managing Director',
        clientCompany: 'Apex Logistics Global',
        consentShowcase: true
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.testimonial).toBeDefined();
    expect(res.body.testimonial.csatRating).toBe(5);
    expect(res.body.testimonial.consentShowcase).toBe(true);

    // Verify persistence in data/db.json
    const diskDb = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    expect(Array.isArray(diskDb.testimonials)).toBe(true);
    const persistedTst = diskDb.testimonials.find(t => t.projectId === testProjectId);
    expect(persistedTst).toBeDefined();
    expect(persistedTst.clientDisplayName).toBe('Tariq Al-Mansoor');
    expect(persistedTst.csatRating).toBe(5);
    expect(persistedTst.reviewText).toContain('Outstanding turnaround speed');
  });

  test('4. getPublicTestimonials returns showcase testimonial from local dual-store fallback', async () => {
    const publicTsts = await getPublicTestimonials();
    expect(Array.isArray(publicTsts)).toBe(true);
    const found = publicTsts.find(t => t.projectId === testProjectId);
    expect(found).toBeDefined();
    expect(found.consentShowcase).toBe(true);
    expect(found.clientCompany).toBe('Apex Logistics Global');
    expect(found.csatRating).toBe(5);
  });

  test('5. signHandoverManifest records digital signature and persists manifest in db.handover_manifests in data/db.json', async () => {
    const res = await request(app)
      .post(`/api/projects/${testProjectId}/handover/sign`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        signedBy: 'Tariq Al-Mansoor',
        signatoryRole: 'Chief Executive Officer'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.manifest).toBeDefined();
    expect(res.body.manifest.isSigned).toBe(true);
    expect(res.body.manifest.signedBy).toBe('Tariq Al-Mansoor');
    expect(res.body.manifest.deliveryStatus).toBe('HANDOVER_COMPLETE');

    // Verify persistence in data/db.json
    const diskDb = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    expect(Array.isArray(diskDb.handover_manifests)).toBe(true);
    const persistedManifest = diskDb.handover_manifests.find(m => m.projectId === testProjectId);
    expect(persistedManifest).toBeDefined();
    expect(persistedManifest.isSigned).toBe(true);
    expect(persistedManifest.signedBy).toBe('Tariq Al-Mansoor');

    // Verify project delivery_status updated in diskDb
    const diskProject = (diskDb.projects || []).find(p => p.id === testProjectId);
    expect(diskProject).toBeDefined();
    expect(diskProject.delivery_status).toBe('HANDOVER_COMPLETE');
    expect(diskProject.handover_signed_by).toBe('Tariq Al-Mansoor');
  });
});
