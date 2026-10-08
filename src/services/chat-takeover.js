/**
 * src/services/chat-takeover.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Engine 1 (AI Agent Ecosystems & Platforms)
 * Omnichannel Conversation Thread Management, Human Takeover & Telemetry Service.
 * Supports Web Widgets, Telegram bots, and WhatsApp conversations with live takeover.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { broadcast } = require('./sse');
const { supabase, isSupabaseConfigured } = require('./supabase');

// In-memory conversation thread registry (persisted or populated with live seeds)
const conversations = new Map();

// Helper to asynchronously persist conversation updates to Supabase without blocking requests
function syncConversationToSupabase(conv) {
  if (!conv || !isSupabaseConfigured()) return;
  try {
    supabase.from('conversations').upsert({
      id: conv.id,
      client_name: conv.clientName,
      project_id: conv.projectId,
      vertical: conv.vertical,
      channel: conv.channel,
      status: conv.status,
      is_human_takeover: conv.isHumanTakeover,
      taken_over_by: conv.takenOverBy,
      sentiment: conv.sentiment,
      csat: conv.csat,
      resolved_by_ai: conv.resolvedByAi,
      unread_count: conv.unreadCount || 0,
      messages: conv.messages || [],
      last_message_at: conv.lastMessageAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).catch(err => {
      // Graceful fallback to in-memory state on table schema difference
      console.warn('[Engine1 DB Sync note]:', err.message);
    });
  } catch (_) {}
}

// Initialize realistic operational seeds for internal team cockpit
function initSeedConversations() {
  if (conversations.size > 0) return;

  const now = Date.now();
  const seedList = [
    {
      id: 'conv_pb_01',
      clientName: 'PurpleBot Digital',
      projectId: 'proj-purplebot-01',
      vertical: 'SoloOps Hub (#SME)',
      channel: 'web',
      status: 'active',
      isHumanTakeover: false,
      takenOverBy: null,
      sentiment: 'positive',
      csat: 4.9,
      resolvedByAi: true,
      createdAt: new Date(now - 3600000 * 4).toISOString(),
      lastMessageAt: new Date(now - 1000 * 60 * 12).toISOString(),
      unreadCount: 0,
      messages: [
        { id: 'm_pb_1', sender: 'user', text: 'Hey team, how is the Telegram MiniApp sprint burndown looking?', timestamp: new Date(now - 1000 * 60 * 15).toISOString() },
        { id: 'm_pb_2', sender: 'ai', text: '⚡ Sprint Velocity Status for PurpleBot Digital:\n• Delivery Pod: MVP_BUILD_POD\n• Current Stage: Review (On Schedule)\n• Target Completion: 48h remaining.', timestamp: new Date(now - 1000 * 60 * 12).toISOString() }
      ]
    },
    {
      id: 'conv_lm_02',
      clientName: 'Laundry Mama',
      projectId: 'proj-laundry-mama',
      vertical: 'GroCash FinLedger (#Finance)',
      channel: 'whatsapp',
      status: 'triage',
      isHumanTakeover: false,
      takenOverBy: null,
      sentiment: 'frustrated',
      csat: 3.5,
      resolvedByAi: false,
      createdAt: new Date(now - 3600000 * 2).toISOString(),
      lastMessageAt: new Date(now - 1000 * 60 * 3).toISOString(),
      unreadCount: 2,
      messages: [
        { id: 'm_lm_1', sender: 'user', text: 'Our bKash automated token dispatch failed for 3 orders just now. Need human check!', timestamp: new Date(now - 1000 * 60 * 5).toISOString() },
        { id: 'm_lm_2', sender: 'ai', text: 'I have logged this alert. A pod engineer has been notified to inspect the payment gateway webhook.', timestamp: new Date(now - 1000 * 60 * 4).toISOString() },
        { id: 'm_lm_3', sender: 'user', text: 'Please have someone take over the desk directly.', timestamp: new Date(now - 1000 * 60 * 3).toISOString() }
      ]
    },
    {
      id: 'conv_gu_03',
      clientName: 'GroUp Career Mentee #84',
      projectId: 'proj-group-academy',
      vertical: 'GroUp Academy (#Career)',
      channel: 'telegram',
      status: 'active',
      isHumanTakeover: false,
      takenOverBy: null,
      sentiment: 'positive',
      csat: 5.0,
      resolvedByAi: true,
      createdAt: new Date(now - 3600000 * 8).toISOString(),
      lastMessageAt: new Date(now - 1000 * 60 * 25).toISOString(),
      unreadCount: 0,
      messages: [
        { id: 'm_gu_1', sender: 'user', text: 'Can I get feedback on my AI Agent portfolio resume before submission?', timestamp: new Date(now - 1000 * 60 * 30).toISOString() },
        { id: 'm_gu_2', sender: 'ai', text: '🎓 Absolutely! Upload your PDF link or paste your GitHub profile. Our GroUp Academy prompt validator will review your skills section.', timestamp: new Date(now - 1000 * 60 * 25).toISOString() }
      ]
    },
    {
      id: 'conv_ed_04',
      clientName: 'Dhaka EdTech Initiative',
      projectId: 'proj-edagent-labs',
      vertical: 'EdAgent Labs (#Education)',
      channel: 'web',
      status: 'active',
      isHumanTakeover: true,
      takenOverBy: 'Firoz Ahmed (Founder)',
      sentiment: 'positive',
      csat: 4.8,
      resolvedByAi: false,
      createdAt: new Date(now - 3600000 * 24).toISOString(),
      lastMessageAt: new Date(now - 1000 * 60 * 8).toISOString(),
      unreadCount: 0,
      messages: [
        { id: 'm_ed_1', sender: 'user', text: 'We need custom prompt controls for Grade 8 math curriculum.', timestamp: new Date(now - 1000 * 60 * 45).toISOString() },
        { id: 'm_ed_2', sender: 'operator', operatorName: 'Firoz Ahmed', text: 'I am taking over this thread directly. We have custom system prompts pre-configured in EdAgent Labs. Let me share the spec.', timestamp: new Date(now - 1000 * 60 * 8).toISOString() }
      ]
    },
    {
      id: 'conv_ts_05',
      clientName: 'Sprint Lead Internal',
      projectId: 'proj-task-sync',
      vertical: 'TaskSync (#Personal)',
      channel: 'telegram',
      status: 'resolved',
      isHumanTakeover: false,
      takenOverBy: null,
      sentiment: 'neutral',
      csat: 4.7,
      resolvedByAi: true,
      createdAt: new Date(now - 3600000 * 12).toISOString(),
      lastMessageAt: new Date(now - 3600000 * 1).toISOString(),
      unreadCount: 0,
      messages: [
        { id: 'm_ts_1', sender: 'user', text: '/tasks', timestamp: new Date(now - 3600000 * 1 - 60000).toISOString() },
        { id: 'm_ts_2', sender: 'ai', text: '📋 All sprint tasks synced to Kanban board.', timestamp: new Date(now - 3600000 * 1).toISOString() }
      ]
    }
  ];

  seedList.forEach(conv => conversations.set(conv.id, conv));
}

// Run init on module load
initSeedConversations();

/**
 * Get or register a conversation thread
 */
function getOrCreateConversation(id, initialData = {}) {
  initSeedConversations();
  if (!id) {
    id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  let conv = conversations.get(id);
  if (!conv) {
    conv = {
      id,
      clientName: initialData.clientName || 'Website Visitor',
      projectId: initialData.projectId || 'proj-general',
      vertical: initialData.vertical || 'SoloOps Hub (#SME)',
      channel: initialData.channel || 'web',
      status: 'active',
      isHumanTakeover: false,
      takenOverBy: null,
      sentiment: 'neutral',
      csat: 5.0,
      resolvedByAi: true,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      messages: []
    };
    conversations.set(id, conv);
  }
  return conv;
}

/**
 * List all conversations with optional filters
 */
function listConversations(filter = {}) {
  initSeedConversations();
  let list = Array.from(conversations.values());

  if (filter.channel && filter.channel !== 'all') {
    list = list.filter(c => c.channel === filter.channel);
  }
  if (filter.status && filter.status !== 'all') {
    list = list.filter(c => c.status === filter.status);
  }
  if (filter.projectId && filter.projectId !== 'all') {
    list = list.filter(c => c.projectId === filter.projectId);
  }
  if (filter.isHumanTakeover !== undefined) {
    const isTakeover = filter.isHumanTakeover === 'true' || filter.isHumanTakeover === true;
    list = list.filter(c => c.isHumanTakeover === isTakeover);
  }

  // Sort descending by last message timestamp
  return list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

/**
 * Get a single conversation by ID
 */
function getConversation(id) {
  initSeedConversations();
  return conversations.get(id) || null;
}

/**
 * Toggle Human Takeover on a conversation
 */
function setTakeover(id, enabled, operatorName = 'Pod Lead') {
  initSeedConversations();
  const conv = conversations.get(id);
  if (!conv) return null;

  conv.isHumanTakeover = Boolean(enabled);
  conv.takenOverBy = conv.isHumanTakeover ? operatorName : null;
  if (conv.isHumanTakeover) {
    conv.status = 'active';
    conv.resolvedByAi = false;
  }

  const payload = {
    conversationId: conv.id,
    isHumanTakeover: conv.isHumanTakeover,
    takenOverBy: conv.takenOverBy,
    timestamp: new Date().toISOString()
  };

  broadcast('takeover_updated', payload);
  syncConversationToSupabase(conv);
  return conv;
}

/**
 * Record a user message in thread
 */
function recordUserMessage(id, text, metadata = {}) {
  const conv = getOrCreateConversation(id, metadata);
  const msg = {
    id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: 'user',
    text,
    timestamp: new Date().toISOString()
  };
  conv.messages.push(msg);
  conv.lastMessageAt = msg.timestamp;

  // If negative sentiment words detected, flag for triage if not taken over
  const lower = text.toLowerCase();
  if (lower.includes('broken') || lower.includes('failed') || lower.includes('urgent') || lower.includes('human') || lower.includes('error')) {
    conv.sentiment = 'frustrated';
    if (!conv.isHumanTakeover) {
      conv.status = 'triage';
      try {
        const botNotifs = require('./bot/notifications');
        if (typeof botNotifs.sendEngine1TriageAlert === 'function') {
          botNotifs.sendEngine1TriageAlert(conv);
        }
      } catch (_) {}
    }
  }

  syncConversationToSupabase(conv);
  return { conv, message: msg };
}

/**
 * Record an AI reply in thread
 */
function recordAiReply(id, text) {
  const conv = getOrCreateConversation(id);
  const msg = {
    id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: 'ai',
    text,
    timestamp: new Date().toISOString()
  };
  conv.messages.push(msg);
  conv.lastMessageAt = msg.timestamp;
  syncConversationToSupabase(conv);
  return { conv, message: msg };
}

/**
 * Operator Direct Reply (Bypasses AI, delivers human answer to client)
 */
function recordOperatorReply(id, text, operatorName = 'Team Operator') {
  const conv = getConversation(id);
  if (!conv) return null;

  const msg = {
    id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: 'operator',
    operatorName,
    text,
    timestamp: new Date().toISOString()
  };
  conv.messages.push(msg);
  conv.lastMessageAt = msg.timestamp;
  conv.status = 'active';

  // Broadcast operator reply over SSE to connected client widgets & internal desks
  broadcast('chat_message', {
    conversationId: conv.id,
    sender: 'operator',
    operatorName,
    text,
    timestamp: msg.timestamp,
    mode: 'client'
  });

  syncConversationToSupabase(conv);
  return { conv, message: msg };
}

let spendingLimits = {
  monthlyBudgetUSD: 150.00,
  currentSpendUSD: 24.85,
  tokensUsed: 1242500,
  safetyKillSwitchActive: false
};

function updateSpendingLimits(updates = {}) {
  if (typeof updates.monthlyBudgetUSD === 'number') {
    spendingLimits.monthlyBudgetUSD = Math.max(10, updates.monthlyBudgetUSD);
  }
  if (typeof updates.safetyKillSwitchActive === 'boolean') {
    spendingLimits.safetyKillSwitchActive = updates.safetyKillSwitchActive;
  }
  return spendingLimits;
}

function getSpendingLimits() {
  return spendingLimits;
}

/**
 * Telemetry: Top 5 KPIs & Volume Breakdown
 */
function getTelemetry() {
  initSeedConversations();
  const all = Array.from(conversations.values());
  const activeCount = all.filter(c => c.status === 'active' || c.status === 'triage').length;
  const triageCount = all.filter(c => c.status === 'triage').length;
  const totalWithAi = all.length;
  const resolvedByAiCount = all.filter(c => c.resolvedByAi && !c.isHumanTakeover).length;
  const resolvedByAiPercent = totalWithAi > 0 ? Math.round((resolvedByAiCount / totalWithAi) * 100) : 85;
  const handoffsToday = all.filter(c => c.isHumanTakeover || c.status === 'triage').length;

  const validCsat = all.filter(c => typeof c.csat === 'number' && c.csat > 0);
  const avgCsat = validCsat.length > 0
    ? (validCsat.reduce((sum, c) => sum + c.csat, 0) / validCsat.length).toFixed(1)
    : '4.8';

  // Channel breakdown
  const channelBreakdown = {
    web: all.filter(c => c.channel === 'web').length,
    telegram: all.filter(c => c.channel === 'telegram').length,
    whatsapp: all.filter(c => c.channel === 'whatsapp').length
  };

  // Recent client contact activity
  const recentActivity = all.slice(0, 5).map(c => ({
    conversationId: c.id,
    clientName: c.clientName,
    projectId: c.projectId,
    channel: c.channel,
    status: c.status,
    isHumanTakeover: c.isHumanTakeover,
    lastMessageAt: c.lastMessageAt,
    lastMessage: c.messages[c.messages.length - 1]?.text || 'No message'
  }));

  return {
    kpis: {
      activeConversations: activeCount,
      waitingHumanTriage: triageCount,
      resolvedByAiPercent,
      handoffsToday,
      avgCsat: parseFloat(avgCsat)
    },
    channels: channelBreakdown,
    recentActivity,
    spendingLimits,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getOrCreateConversation,
  listConversations,
  getConversation,
  setTakeover,
  recordUserMessage,
  recordAiReply,
  recordOperatorReply,
  getTelemetry,
  updateSpendingLimits,
  getSpendingLimits
};
