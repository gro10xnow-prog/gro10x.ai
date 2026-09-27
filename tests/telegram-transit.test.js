/**
 * tests/telegram-transit.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 3: Telegram Transit Hub & Lightweight Mobile Mini-App Verification Suite
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const server = require('../server');
const { getRoleKeyboard } = require('../src/services/bot/keyboards');

describe('🏛️ Phase 3: Telegram Transit Hub & Seniority Keyboards', () => {

  describe('1. Streamlined Role Keyboards (Seniority Tiered)', () => {
    
    test('Tier 1 (Specialist / Crew) keyboard is transit-focused and free of workstation bloat', () => {
      const empTier1 = {
        id: 'EMP-010',
        emp_code: 'EMP-010',
        name: 'Rahim Editor',
        role: 'Video Editor',
        department: 'Production',
        accessLevel: 'Specialist / Crew',
        onboardingComplete: true
      };

      const result = getRoleKeyboard('Specialist / Crew', true, empTier1);
      expect(result).toHaveProperty('keyboard');
      expect(result.keyboard).toHaveLength(3);

      // Row 1: Transit Hub & Web Workspace
      expect(result.keyboard[0][0].text).toBe('📱 Open Transit Hub');
      expect(result.keyboard[0][0].web_app.url).toContain('/team-miniapp');
      expect(result.keyboard[0][1].text).toBe('🚀 Web Workspace');

      // Row 2: Quick Transit Actions
      expect(result.keyboard[1][0].text).toBe('🌴 Leave Request');
      expect(result.keyboard[1][1].text).toBe('📝 EOD Report');

      // Row 3: GPS Attendance
      expect(result.keyboard[2][0].text).toBe('📍 Clock-In GPS');
      expect(result.keyboard[2][0].request_location).toBe(true);
      expect(result.keyboard[2][1].text).toBe('🚪 Clock Out');

      // Verify elimination of workstation bloat
      const allButtons = result.keyboard.flat().map(b => b.text);
      expect(allButtons).not.toContain('🤖 AI Prompt Studio');
      expect(allButtons).not.toContain('📜 Script & Copy QC');
      expect(allButtons).not.toContain('📋 Invoice Tracker');
      expect(allButtons).not.toContain('⚡ Studio Workload');
      expect(allButtons).not.toContain('🎨 Design Queue');
      expect(allButtons).not.toContain('🛍️ My Brands & Products');
    });

    test('Tier 2 (Manager / Supervisor) keyboard exposes attendance & leave approvals', () => {
      const empTier2 = {
        id: 'MGR-002',
        emp_code: 'MGR-002',
        name: 'Farhana Manager',
        role: 'Operations Manager',
        department: 'Operations',
        accessLevel: 'Director / Manager',
        onboardingComplete: true
      };

      const result = getRoleKeyboard('Director / Manager', true, empTier2);
      expect(result.keyboard).toHaveLength(3);

      // Row 1: Transit Hub & Web Workspace
      expect(result.keyboard[0][0].text).toBe('📱 Open Transit Hub');
      expect(result.keyboard[0][1].text).toBe('🚀 Web Workspace');

      // Row 2: Operational Review & Approvals
      expect(result.keyboard[1][0].text).toBe('👥 Team Attendance');
      expect(result.keyboard[1][1].text).toBe('✅ Leave Approvals');

      // Row 3: GPS Attendance
      expect(result.keyboard[2][0].text).toBe('📍 Clock-In GPS');
      expect(result.keyboard[2][1].text).toBe('🚪 Clock Out');
    });

    test('Tier 3 (Executive / CXO / Engine Lead) keyboard exposes Executive Flash & Pending Approvals', () => {
      const empTier3 = {
        id: 'PBD-001',
        emp_code: 'PBD-001',
        name: 'Managing Director',
        role: 'Managing Director',
        department: 'Executive',
        accessLevel: 'Owner / Admin',
        onboardingComplete: true
      };

      const result = getRoleKeyboard('Owner / Admin', true, empTier3);
      expect(result.keyboard).toHaveLength(3);

      // Row 1: Transit Hub & Web Workspace
      expect(result.keyboard[0][0].text).toBe('📱 Open Transit Hub');
      expect(result.keyboard[0][1].text).toBe('🚀 Web Workspace');

      // Row 2: Command & Governance
      expect(result.keyboard[1][0].text).toBe('⚡ Executive Flash');
      expect(result.keyboard[1][1].text).toBe('✍️ Pending Approvals');

      // Row 3: GPS Attendance
      expect(result.keyboard[2][0].text).toBe('📍 Clock-In GPS');
      expect(result.keyboard[2][1].text).toBe('🚪 Clock Out');
    });

    test('Unverified users are prompted to verify contact first', () => {
      const result = getRoleKeyboard('Specialist / Crew', false, null);
      expect(result.keyboard[0][0].text).toBe('📱 Verify My Phone Number');
      expect(result.keyboard[0][0].request_contact).toBe(true);
    });

    test('Incomplete onboarding users are directed to survey and web PIN', () => {
      const empIncomplete = {
        id: 'NEW-001',
        name: 'New Specialist',
        onboardingComplete: false
      };
      const result = getRoleKeyboard('Specialist / Crew', true, empIncomplete);
      expect(result.keyboard[0][0].text).toBe('🎓 Complete My Profile Survey');
      expect(result.keyboard[1][0].text).toBe('🔑 View My Web Login PIN');
    });
  });

  describe('2. Defect SLA Escalation & Inline Callbacks', () => {
    test('Defect escalation cron attaches inline action buttons to urgent alerts', async () => {
      const { runDefectEscalationCheck } = require('../src/services/defect-escalation-cron');
      expect(typeof runDefectEscalationCheck).toBe('function');

      const res = await runDefectEscalationCheck();
      expect(res).toBeDefined();
      expect(typeof res.evaluatedCount).toBe('number');
    });

    test('Inline callback query router handles ack_defect_sla', async () => {
      const { registerLegacyTeamMenus } = require('../src/services/bot/handlers/legacy_menus');
      let registeredCallback = null;

      const mockBot = {
        on: jest.fn().mockImplementation((event, handler) => {
          if (event === 'callback_query') registeredCallback = handler;
        }),
        answerCallbackQuery: jest.fn().mockResolvedValue(true),
        sendMessage: jest.fn().mockResolvedValue({ message_id: 1234 })
      };

      registerLegacyTeamMenus(mockBot, () => ({ team: [] }));
      expect(registeredCallback).toBeDefined();

      // Simulate tapping the 🚨 Acknowledge SLA Warning button
      const mockQuery = {
        id: 'qry_sla_1',
        data: 'ack_defect_sla:TCK-DEF-001',
        message: {
          message_id: 888,
          chat: { id: 7754769807 }
        }
      };

      await registeredCallback(mockQuery);
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('qry_sla_1', expect.objectContaining({ text: expect.stringContaining('SLA Acknowledged') }));
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        7754769807,
        expect.stringContaining('SLA Warning Acknowledged'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });
  });

  describe('3. Transit & Workspace HTTP Routes', () => {
    test('GET /transit serves the transit-upgraded mobile web shell (200 OK)', async () => {
      const res = await request(server).get('/transit');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('GRO10X TRANSIT');
      expect(res.text).toContain('dhakaTransitClock');
      expect(res.text).toContain('launchWorkspaceBridgeBtn');
    });

    test('GET /team-miniapp serves the same unified transit web shell (200 OK)', async () => {
      const res = await request(server).get('/team-miniapp');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('GRO10X TRANSIT');
    });

    test('GET /workspace serves the Unified Web Workspace (200 OK)', async () => {
      const res = await request(server).get('/workspace');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('GRO10X');
    });
  });
});
