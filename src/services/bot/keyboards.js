/**
 * src/services/bot/keyboards.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Role-Based Telegram Custom Keyboards.
 * Generates progressive disclosure menus for employees and clients.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { normalizePhone } = require('../../utils/phone');
const { getSeniorityTier } = require('../../middleware/rbac');

function getRoleKeyboard(accessLevel, isVerified = false, emp = null) {
  if (!isVerified || !emp) {
    return {
      keyboard: [
        [{ text: '📱 Verify My Phone Number', request_contact: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
      is_persistent: true
    };
  }

  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';

  // Progressive Disclosure: Guided Journey Mode during onboarding
  if (!emp.onboardingComplete) {
    return {
      keyboard: [
        [{ text: '🎓 Complete My Profile Survey', web_app: { url: `${baseUrl}/team-miniapp` } }],
        [{ text: '🔑 View My Web Login PIN' }]
      ],
      resize_keyboard: true
    };
  }

  // Authoritative Seniority Tier: 1 (Specialist/Execution), 2 (Manager/Supervisor), 3 (Command/CXO/Lead)
  const tier = getSeniorityTier(emp || { accessLevel });

  // Standard Transit Header Row (All Verified Users)
  const transitRow = [
    { text: '📱 Open Transit Hub', web_app: { url: `${baseUrl}/team-miniapp` } },
    { text: '🚀 Web Workspace' }
  ];

  // Standard GPS Attendance Footer Row (All Verified Users)
  const attendanceRow = [
    { text: '📍 Clock-In GPS', request_location: true },
    { text: '🚪 Clock Out' }
  ];

  // ── Tier 3: Command & Governance (Admin, CXO, Engine Leads) ──
  if (tier >= 3) {
    return {
      keyboard: [
        transitRow,
        [{ text: '⚡ Executive Flash' }, { text: '✍️ Pending Approvals' }],
        attendanceRow
      ],
      resize_keyboard: true
    };
  }

  // ── Tier 2: Operational Review (Managers, Supervisors, Ops) ──
  if (tier === 2) {
    return {
      keyboard: [
        transitRow,
        [{ text: '👥 Team Attendance' }, { text: '✅ Leave Approvals' }],
        attendanceRow
      ],
      resize_keyboard: true
    };
  }

  // ── Tier 1: Specialist & Execution (Delivery, BD, Creative, Tech, Support) ──
  return {
    keyboard: [
      transitRow,
      [{ text: '🌴 Leave Request' }, { text: '📝 EOD Report' }],
      attendanceRow
    ],
    resize_keyboard: true
  };
}

function getClientKeyboard(client) {
  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
  return {
    keyboard: [
      [{ text: '🎬 Review Room' }, { text: '📋 Campaign Status' }],
      [{ text: '🛡️ Warranty & Sprint SLA' }, { text: '📊 Monthly Digest' }],
      [{ text: '💳 My Invoices' }, { text: '📞 Contact AM' }],
      [{ text: '📱 Open Client Portal', web_app: { url: `${baseUrl}/client-miniapp.html` } }]
    ],
    resize_keyboard: true
  };
}

/**
 * Keyboard for prospective clients / new unregistered visitors.
 * Surfaces discovery & lead capture actions — no client-only features.
 */
function getProspectKeyboard() {
  return {
    keyboard: [
      [{ text: '💬 Get a Custom Quote' }, { text: '📅 Book a Strategy Call' }],
      [{ text: '💰 Service Pricing & Plans' }, { text: '🎨 Our Services' }],
      [{ text: '📁 See Portfolio' }, { text: '📞 Talk to an Expert' }],
      [{ text: '🔐 I\'m an Existing Client →' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

module.exports = {
  getRoleKeyboard,
  getClientKeyboard,
  getProspectKeyboard,
  normalizePhone
};
