/**
 * src/services/bot/keyboards.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Role-Based Telegram Custom Keyboards.
 * Generates progressive disclosure menus for employees and clients.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { normalizePhone } = require('../../utils/phone');

function getRoleKeyboard(accessLevel, isVerified = false, emp = null) {
  if (!isVerified || !emp) {
    return {
      keyboard: [
        [{ text: '📱 Verify My Phone Number', request_contact: true }]
      ],
      resize_keyboard: true
    };
  }

  const isTechAdmin = (emp.id === 'PBD-000' || emp.role === 'Technology Admin' || normalizePhone(emp.phone) === '1708459008');

  // Progressive Disclosure: Guided Journey Mode during onboarding
  if (!emp.onboardingComplete) {
    return {
      keyboard: [
        [{ text: '🎓 Complete My Profile Survey', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp' } }],
        [{ text: '🔑 View My Web Login PIN' }]
      ],
      resize_keyboard: true
    };
  }

  // All onboarding tasks complete -> Unlock Full Operational Menu!
  if (accessLevel === 'Owner / Admin') {
    if (isTechAdmin) {
      return {
        keyboard: [
          [{ text: '🌅 Morning Briefing' }, { text: '📊 Business Snapshot' }],
          [{ text: '👥 Full Team Status' }, { text: '💰 Finance Summary' }],
          [{ text: '✍️ Pending Approvals' }, { text: '💸 Expense Queue' }],
          [{ text: '📋 My Tasks' }, { text: '💰 My Earnings' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '🛠️ Tech Diagnostics' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }
    // Owner / MD — all employee features + executive command layer
    return {
      keyboard: [
        [{ text: '🌅 Morning Briefing' }, { text: '📊 Business Snapshot' }],
        [{ text: '👥 Full Team Status' }, { text: '💰 Finance Summary' }],
        [{ text: '✍️ Pending Approvals' }, { text: '💸 Expense Queue' }],
        [{ text: '📋 My Tasks' }, { text: '💰 My Earnings' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
        [{ text: '👤 My Profile' }, { text: '🎬 Client Status' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (accessLevel === 'Director / Manager') {
    const role = (emp?.role || '').toLowerCase();
    const isClientGrowth = role.includes('client') || role.includes('growth');
    const isBizOps = role.includes('business operation') || role.includes('head of business');
    const isInternalOps = role.includes('internal operation') || role.includes('internal ops');

    if (isClientGrowth) {
      return {
        keyboard: [
          [{ text: '🎯 My Clients' }, { text: '📈 Lead Pipeline' }],
          [{ text: '🔔 Client Updates' }, { text: '💰 My Commission' }],
          [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    if (isBizOps) {
      return {
        keyboard: [
          [{ text: '🏢 Ops Dashboard' }, { text: '👥 HR & Attendance' }],
          [{ text: '📡 Media Buying' }, { text: '🚀 Client Activation' }],
          [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    if (isInternalOps) {
      return {
        keyboard: [
          [{ text: '⚡ Studio Workload' }, { text: '🚧 Bottleneck Radar' }],
          [{ text: '📸 Studio & Gear Slots' }, { text: '📊 Turnaround Metrics' }],
          [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    const isArtDirector = role.includes('art director') || (role.includes('art') && role.includes('direct'));
    if (isArtDirector) {
      return {
        keyboard: [
          [{ text: '🎨 Design Queue' }, { text: '👁️ Review Room' }],
          [{ text: '👥 Design Team' }, { text: '✅ Leave Approvals' }],
          [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    const isHeadOfProduction = role.includes('head of production') || role.includes('production head') || role.includes('production');
    if (isHeadOfProduction) {
      return {
        keyboard: [
          [{ text: '🎬 Production Queue' }, { text: '📜 Script & Copy QC' }],
          [{ text: '🎥 Shoot Call-Sheets' }, { text: '👥 Content Team' }],
          [{ text: '🌅 Morning Briefing' }, { text: '✅ Leave Approvals' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    const isStrategyLead = role.includes('strategy & planning') || role.includes('strategy');
    if (isStrategyLead) {
      return {
        keyboard: [
          [{ text: '📈 Campaign Strategy' }, { text: '🗓️ Content Calendars' }],
          [{ text: '👥 Strategy Team' }, { text: '✅ Leave Approvals' }],
          [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    const isClientServices = role.includes('client services') || role.includes('account manager') || role.includes('client service');
    if (isClientServices && !role.includes('head of client')) {
      return {
        keyboard: [
          [{ text: '🎯 My Client Roster' }, { text: '🎬 Client Approvals' }],
          [{ text: '📢 Send Client Link' }, { text: '💬 Client Feedback' }],
          [{ text: '🌅 Morning Briefing' }, { text: '👥 Account Team' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '📍 Clock-In GPS', request_location: true }],
          [{ text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    // Default Director
    return {
      keyboard: [
        [{ text: '👥 My Team' }, { text: '📊 Department Report' }],
        [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
        [{ text: '👤 My Profile' }, { text: '📍 Clock-In GPS', request_location: true }],
        [{ text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (accessLevel === 'Finance Manager' || (emp?.role || '').toLowerCase().includes('finance manager')) {
    return {
      keyboard: [
        [{ text: '💸 Expense Queue' }, { text: '🧾 Invoice Status' }],
        [{ text: '📊 Payroll Summary' }, { text: '🏦 Bank & bKash Hub' }],
        [{ text: '🌅 Morning Briefing' }, { text: '✅ Leave Approvals' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '📝 EOD Report' }, { text: '👥 Admin Team' }],
        [{ text: '👤 My Profile' }, { text: '📍 Clock-In GPS', request_location: true }],
        [{ text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (accessLevel === 'Office Staff') {
    return {
      keyboard: [
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }],
        [{ text: '👤 My Profile' }, { text: '🌴 Leave Request' }]
      ],
      resize_keyboard: true
    };
  }

  const userRole = (emp?.role || '').toLowerCase();

  if (emp?.id === 'PBD-028') {
    return {
      keyboard: [
        [{ text: '🎯 My Client Roster' }, { text: '🎬 Client Approvals' }],
        [{ text: '📢 Send Client Link' }, { text: '💬 Client Feedback' }],
        [{ text: '📝 EOD Report' }, { text: '🧾 Submit Expense' }],
        [{ text: '🌴 Leave Request' }, { text: '👤 My Profile' }],
        [{ text: '💳 Bank & bKash' }, { text: '📍 Clock-In GPS', request_location: true }],
        [{ text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (emp?.id === 'PBD-030' || (userRole.includes('finance') && userRole.includes('executive'))) {
    return {
      keyboard: [
        [{ text: '🧾 Log Expense Entry' }, { text: '📋 Invoice Tracker' }],
        [{ text: '💰 Payment Follow-Up' }, { text: '📝 EOD Report' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (userRole.includes('strategy') || userRole.includes('digital marketing') || userRole.includes('associate')) {
    return {
      keyboard: [
        [{ text: '📅 My Content Plans' }, { text: '🚀 Dispatch Hub' }],
        [{ text: '📝 Draft New Plan' }, { text: '📝 EOD Report' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (userRole.includes('copywriter') || userRole.includes('prompt') || userRole.includes('content')) {
    return {
      keyboard: [
        [{ text: '📜 My Scripts & Copy' }, { text: '🤖 AI Prompt Studio' }],
        [{ text: '📤 Submit Script QC' }, { text: '📝 EOD Report' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (userRole.includes('visualizer')) {
    return {
      keyboard: [
        [{ text: '🖌️ My Creative Tasks' }, { text: '📤 Submit for QC' }],
        [{ text: '✏️ View Revisions' }, { text: '📝 EOD Report' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  // Video Editor / Post-Production / Motion Graphics / Animator
  if (
    userRole.includes('video editor') ||
    userRole.includes('video production') ||
    userRole.includes('post production') ||
    userRole.includes('motion graphic') ||
    userRole.includes('animator') ||
    userRole.includes('vfx')
  ) {
    return {
      keyboard: [
        [{ text: '✂️ My Edit Queue' }, { text: '📤 Submit for Review' }],
        [{ text: '📸 Book Gear / Studio' }, { text: '📝 EOD Report' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📊 My Status' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  // 3D Artist / Renderer / CGI
  if (
    userRole.includes('3d artist') ||
    userRole.includes('3d') ||
    userRole.includes('3d modell') ||
    userRole.includes('renderer') ||
    userRole.includes('cgi')
  ) {
    return {
      keyboard: [
        [{ text: '🎨 My 3D Task Queue' }, { text: '📤 Submit Render' }],
        [{ text: '📝 EOD Report' }, { text: '🧾 Submit Expense' }],
        [{ text: '🌴 Leave Request' }, { text: '📊 My Status' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  // Full-Stack Developer / Software Engineer / Tech
  if (
    userRole.includes('developer') ||
    userRole.includes('full-stack') ||
    userRole.includes('fullstack') ||
    userRole.includes('backend') ||
    userRole.includes('frontend') ||
    userRole.includes('web dev') ||
    userRole.includes('software engineer')
  ) {
    return {
      keyboard: [
        [{ text: '🎟️ My Tickets' }, { text: '🚀 Log Deployment' }],
        [{ text: '📝 EOD Report' }, { text: '🧾 Submit Expense' }],
        [{ text: '🌴 Leave Request' }, { text: '📊 My Status' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  // Default: Specialist / Crew
  return {
    keyboard: [
      [{ text: '📋 My Tasks' }, { text: '💰 My Earnings' }],
      [{ text: '📝 EOD Report' }, { text: '🧾 Submit Expense' }],
      [{ text: '🌴 Leave Request' }, { text: '📊 My Status' }],
      [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
      [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
    ],
    resize_keyboard: true
  };
}

function getClientKeyboard(client) {
  return {
    keyboard: [
      [{ text: '🎬 Review Room' }, { text: '📋 Campaign Status' }],
      [{ text: '📊 Monthly Digest' }, { text: '📝 Submit Brief' }],
      [{ text: '💳 My Invoices' }, { text: '📞 Contact AM' }],
      [{ text: '📱 Open Client Portal', web_app: { url: 'https://gro10x-ai.vercel.app/client' } }]
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
