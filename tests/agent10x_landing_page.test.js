/**
 * tests/agent10x_landing_page.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification suite for Agent 10X Landing Page V1 & Lead Intake API.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');

const PUBLIC_HTML = path.resolve(__dirname, '../public/agent10x/index.html');
const HANDOFF_HTML = path.resolve(__dirname, '../Agent10X_Sprint_Handoff/Landing_Page/index.html');
const HANDOFF_README = path.resolve(__dirname, '../Agent10X_Sprint_Handoff/Landing_Page/README_LANDING_PAGE.md');

describe('Agent 10X Landing Page V1 Architecture & Integrity', () => {

  test('Primary deployment HTML file exists and is populated', () => {
    expect(fs.existsSync(PUBLIC_HTML)).toBe(true);
    const content = fs.readFileSync(PUBLIC_HTML, 'utf8');
    expect(content.length).toBeGreaterThan(20000);
  });

  test('Handoff mirror HTML file matches primary deployment file', () => {
    expect(fs.existsSync(HANDOFF_HTML)).toBe(true);
    const primaryContent = fs.readFileSync(PUBLIC_HTML, 'utf8');
    const handoffContent = fs.readFileSync(HANDOFF_HTML, 'utf8');
    expect(handoffContent).toBe(primaryContent);
  });

  test('Handoff README documentation exists and details architecture & schema', () => {
    expect(fs.existsSync(HANDOFF_README)).toBe(true);
    const readme = fs.readFileSync(HANDOFF_README, 'utf8');
    expect(readme).toContain('PRJ-AGENT10X-LANDING-PAGE-V1');
    expect(readme).toContain('agent10x_landing_page');
    expect(readme).toContain('1 Credit = ৳2.00 Taka');
  });

  test('Strict Invariants & Brand Attributes are present in HTML', () => {
    const html = fs.readFileSync(PUBLIC_HTML, 'utf8');

    // Brand and Parent Attribution
    expect(html).toContain('Agent 10X');
    expect(html).toContain('Agent 10X, by GRO10X');

    // Status Pill
    expect(html).toContain('V1 PILOT ENROLLMENT ACTIVE');

    // Hero Proof Anchors (Verified Claims & Zero-Hallucination - Fix Pass 2)
    expect(html).toContain('Hazard');
    expect(html).toContain('Shariful Islam');
    expect(html).toContain('scored across structure, grammar, and alignment checkpoints before human review');
    expect(html).not.toContain('140+ CVs in 3.8 minutes');

    expect(html).toContain('Sivan');
    expect(html).toContain('27-slide picture-only AML/CFT regulatory deck summarized and reviewed into a structured, editable document without retyping');
    expect(html).not.toContain('42-slide deck');
    expect(html).not.toContain('lossless OCR');
    expect(html).not.toContain('financial model sync');

    expect(html).toContain('BAGH AI');
    expect(html).toContain('Pilot Triage');
    expect(html).toContain('Inbound customer inquiry triage and message classification queued for real-world pilot verification on WhatsApp');
    expect(html).not.toContain('First Win Guaranteed');
    expect(html).not.toContain('3,400+ conversations');

    expect(html).toContain('Maya');
    expect(html).toContain('Serviq talent sourcing via LinkedIn and Apify: 7 Tier 2 candidate profiles mapped across specialized roles');
    expect(html).not.toContain('10x faster');
    expect(html).not.toContain('GitHub sourcing');

    // 6 Functional Cards
    expect(html).toContain('Executive WhatsApp Reminders');
    expect(html).toContain('Pitch Deck & Document Extraction');
    expect(html).toContain('Deep Research & Market Intelligence');
    expect(html).toContain('Autonomous IT & Talent Sourcing');
    expect(html).toContain('Content Drafting & Multi-Ratio Snippets');
    expect(html).toContain('Recurring Admin & Voice Note Offloading');

    // Two Teammate Types & Recruiter Naming Invariant
    expect(html).toContain('Personal Digital Teammate');
    expect(html).toContain('Enterprise Recruiter (Maya)');
    expect(html).toContain('B2C PREPAID');
    expect(html).toContain('B2B POSTPAID');

    // Transparent Credit Economy V1
    expect(html).toContain('1 Credit = ৳2.00 Taka');
    expect(html).toContain('Chat is Completely Free');
    expect(html).toContain('Reminders Setup Free');
    expect(html).toContain('Pay Only for Delivered Work');

    // Conversational Widget & Steps
    expect(html).toContain('setup-widget');
    expect(html).toContain('progress-bar-fill');
    expect(html).toContain('handleNext');
    expect(html).toContain('jumpToReview');
    expect(html).toContain('agent10x_pending_leads');
    expect(html).toContain('input-consent');
    expect(html).toContain('I consent to receiving WhatsApp updates regarding my teammate onboarding.');

    // Concierge Line & BD Verification
    expect(html).toContain('+880 1798-558479');
    expect(html).toContain('Rafsan Ameen, Head of BD');
    expect(html).toContain('Dedicated Agent 10X SIM line to be allocated prior to public ad spend');
    expect(html).not.toContain('+880 1708-459008');

    // 6 FAQ Questions
    expect(html).toContain('How is my personal data and document content secured?');
    expect(html).toContain('What does "backed by a dedicated human specialist" mean?');
    expect(html).toContain('Do my purchased credits expire at the end of the month?');
    expect(html).toContain('Do I need to install any new apps, or does it work directly on WhatsApp?');
    expect(html).toContain('Can I change my teammate\'s persona, name, or workflows later?');
    expect(html).toContain('How does B2B postpaid reconciliation work for teams and recruiters?');

    // Human-in-the-loop guarantee
    expect(html).toContain('Human-in-the-loop guarantee');
  });

  test('Canonical Production Domain compliance (zero raw apex host references)', () => {
    const html = fs.readFileSync(PUBLIC_HTML, 'utf8');
    // Ensure all references use canonical gro10x-ai.vercel.app
    expect(html).toContain('https://gro10x-ai.vercel.app');
    expect(html).not.toMatch(/href=["']https?:\/\/gro10x\.ai["']/);
  });
});

describe('Agent 10X Server Routes & API Ingress', () => {
  let app;

  beforeAll(() => {
    // Suppress console warnings during test
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    app = require('../server');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('GET /agent10x serves the HTML landing page with 200 OK', async () => {
    const res = await request(app).get('/agent10x');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Agent 10X');
    expect(res.text).toContain('V1 PILOT ENROLLMENT ACTIVE');
  });

  test('GET /api/agent10x/health returns service status', async () => {
    const res = await request(app).get('/api/agent10x/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('Agent10X Intake API');
  });

  test('POST /api/agent10x/leads validates required fields', async () => {
    const res = await request(app)
      .post('/api/agent10x/leads')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/agent10x/leads successfully ingests a valid lead', async () => {
    const payload = {
      source: 'agent10x_landing_page',
      type: 'Personal',
      name: 'Smoke Test Candidate',
      whatsapp: '+8801700000000',
      language: 'English',
      reply_mode: 'Both',
      purpose: 'Meeting voice note summaries',
      first_thing: 'Morning briefing on WhatsApp',
      notes: 'Automated test suite execution',
      consent_whatsapp: true
    };

    const res = await request(app)
      .post('/api/agent10x/leads')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.leadId).toBeDefined();
    expect(res.body.data.lead.name).toBe('Smoke Test Candidate');
    expect(res.body.data.lead.engine_tag).toBe('engine1');
  });
});
