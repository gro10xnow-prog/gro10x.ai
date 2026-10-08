/**
 * src/routes/chat.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Web Chat Widget & Autonomous AI Client Sprint Co-Pilot v4.0
 * Context-aware AI Co-Pilot with Gemini integration, project state RAG,
 * and deterministic fallbacks for Team and Client modes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { broadcast, broadcastToClient } = require('../services/sse');
const { ok, fail, asyncHandler } = require('../utils/response');
const { verifyToken } = require('../services/jwt');
const { readDB } = require('../services/db');
const { findProject, calculateWarrantyStatus, memoryProjects } = require('../services/post-delivery');
const chatTakeover = require('../services/chat-takeover');

router.post('/send', asyncHandler(async (req, res) => {
  const { command, mode, token, projectId: explicitProjectId, conversationId: explicitConvId, channel = 'web', clientName } = req.body;
  
  if (!command || typeof command !== 'string') {
    return fail(res, 400, 'command is required', 'INVALID_INPUT');
  }

  // 1. Resolve authenticated user context if provided
  let authUser = req.user || null;
  const rawToken = token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (!authUser && rawToken) {
    try {
      authUser = verifyToken(rawToken);
    } catch (_) {}
  }

  // Resolve or initialize conversation thread in chat-takeover service
  const convId = explicitConvId || (authUser?.id ? `conv_user_${authUser.id}` : (explicitProjectId ? `conv_proj_${explicitProjectId}` : 'conv_web_session'));
  const effectiveClientName = clientName || authUser?.name || authUser?.company || (explicitProjectId ? `Project ${explicitProjectId}` : 'Client Visitor');
  
  // Record user message in thread
  const { conv } = chatTakeover.recordUserMessage(convId, command, {
    clientName: effectiveClientName,
    projectId: explicitProjectId || authUser?.projectId || 'proj-general',
    channel: channel || 'web'
  });

  // Check if this thread has been locked into Human Takeover
  if (conv.isHumanTakeover) {
    const takeoverNotice = `💬 [Operator Takeover Active] Your message has been received directly by ${conv.takenOverBy || 'our Pod Lead'}. They will respond shortly.`;
    // Broadcast human triage alert via SSE
    broadcast('chat_message', {
      conversationId: conv.id,
      sender: 'user',
      text: command,
      timestamp: new Date().toISOString(),
      mode: mode || 'client',
      waitingHumanTriage: true
    });

    return res.json({
      ok: true,
      success: true,
      status: 'taken_over',
      reply: takeoverNotice,
      isHumanTakeover: true,
      takenOverBy: conv.takenOverBy,
      data: { status: 'taken_over', reply: takeoverNotice, isHumanTakeover: true }
    });
  }

  const lowerCmd = command.trim().toLowerCase();
  let reply = '';
  let isAiCoPilot = false;

  if (mode === 'team') {
    if (lowerCmd.includes('/help') || lowerCmd === 'help') {
      reply = "🤖 **GRO10X Crew Bot Commands:**\n\n• `/tasks` — View your active sprint tasks\n• `/clockin` — Clock in for your sprint\n• `/clockout` — Clock out at EOD\n• `/eod` — Submit daily EOD report\n• `/expenses` — Log a project expense claim";
    } else if (lowerCmd.includes('/clockin') || lowerCmd.includes('clock in')) {
      reply = "🟢 **Clocked In:** Sprint session active. Let's build 10x faster today!";
    } else if (lowerCmd.includes('/clockout') || lowerCmd.includes('clock out')) {
      reply = "🚪 **Clocked Out:** Sprint completed. Remember to submit your EOD report!";
    } else if (lowerCmd.includes('/tasks') || lowerCmd.includes('task')) {
      reply = "📋 **Sprint Tasks:** Access your full task Kanban board at https://gro10x-ai.vercel.app/team.html";
    } else {
      reply = `Received: "${command}". Type \`/help\` for a list of available crew commands.`;
    }
  } else {
    // 2. Client Mode: Check if user is an authenticated client with active project
    const isClient = authUser && (
      authUser.role === 'Client' ||
      authUser.role === 'client' ||
      authUser.linkedType === 'client' ||
      (authUser.accessLevel && String(authUser.accessLevel).toLowerCase().includes('client'))
    );

    let clientProject = null;
    let clientInvoices = [];
    let warrantyInfo = null;

    if (authUser || explicitProjectId) {
      try {
        const targetProjId = explicitProjectId || authUser?.projectId || authUser?.project_id || authUser?.linkedId;
        if (targetProjId) {
          clientProject = await findProject(targetProjId);
        }
        if (!clientProject) {
          const db = await readDB();
          const allProjects = [...(db.projects || []), ...Array.from(memoryProjects.values())];
          const clientName = (authUser?.company || authUser?.client || authUser?.name || '').toLowerCase();
          const cId = authUser?.linkedId || authUser?.id || authUser?.userId;
          clientProject = allProjects.find(p => 
            (cId && (p.client_id === cId || p.clientId === cId)) ||
            (clientName && p.client && p.client.toLowerCase().includes(clientName)) ||
            (clientName && p.client_name && p.client_name.toLowerCase().includes(clientName))
          );
        }

        if (clientProject) {
          warrantyInfo = calculateWarrantyStatus(clientProject);
          const db = await readDB();
          clientInvoices = (db.invoices || []).filter(inv => 
            inv.project_ref === clientProject.id || 
            inv.projectRef === clientProject.id ||
            inv.client_id === clientProject.client_id
          );
        }
      } catch (_) {}
    }

    // 3. If authenticated client has project context, activate AI Sprint Co-Pilot
    if (clientProject) {
      isAiCoPilot = true;
      const projName = clientProject.name || clientProject.title || 'AI Solution Sprint';
      const podName = clientProject.delivery_pod || clientProject.deliveryPod || 'MVP_BUILD_POD';
      const stage = clientProject.stage || clientProject.delivery_status || 'Discovery';
      const status = clientProject.status || 'Active';
      const daysRemaining = warrantyInfo ? warrantyInfo.daysRemaining : 30;
      const isWarrantyActive = warrantyInfo ? warrantyInfo.isActive : false;
      const pendingInvoices = clientInvoices.filter(i => (i.status || '').toLowerCase() !== 'paid');

      // Check if Gemini AI is available in ai.js
      let aiGeneratedReply = null;
      try {
        const aiRouter = require('./ai');
        if (typeof aiRouter.callGeminiPrompt === 'function' && process.env.GEMINI_API_KEY) {
          const prompt = `You are the GRO10X Autonomous Client Co-Pilot (@gro10xb2bot).
You assist enterprise clients of GRO10X with real-time sprint status, technical deliverables, warranty SLAs, change orders, and invoices.

CLIENT CONTEXT:
- Client Name: ${clientProject.client || clientProject.client_name || authUser?.name || 'Enterprise Partner'}
- Active Project: ${projName} (ID: ${clientProject.id})
- Delivery Pod: ${podName} (Target Velocity: ${clientProject.target_sla_days || 14} Days)
- Sprint Stage: ${stage} (${status})
- Target Completion / Due Date: ${clientProject.due_date || clientProject.targetDeliveryDate || 'Upcoming'}
- 30-Day Bug-Fix Warranty: ${isWarrantyActive ? `ACTIVE (${daysRemaining} days remaining)` : (clientProject.warranty_until ? `Closed on ${clientProject.warranty_until.split('T')[0]}` : 'Activates automatically upon deliverable acceptance')}
- Warranty SLA Terms: Zero-Cost Guarantee (4-Hour P0 Blocker / 24-Hour P1 Standard SLA)
- Pending Invoices: ${pendingInvoices.length ? pendingInvoices.map(i => `#${i.id} (৳${i.amount} BDT, Due: ${i.due_date || 'Immediate'})`).join(', ') : 'None (All invoices fully settled)'}
- Settlement Rail: BRAC Bank PLC (Neoncore Tech Solution, A/C: 2081636480001, Mohakhali Branch, 5% Statutory VAT)

CLIENT QUESTION:
"${command}"

INSTRUCTIONS:
1. Provide a professional, concise, and helpful answer referencing the real project details above.
2. If the user asks about adding features or scope changes, explain they can submit a Scope Change Order via the Client Scope Desk.
3. If they ask about settling invoices, provide the verified BRAC Bank PLC wire instructions.
4. Keep the tone executive, reassuring, and precise. Use Markdown bullet points where appropriate.
5. Do NOT disclose subcontractor pay rates, internal margins, or raw compute costs.`;

          aiGeneratedReply = await aiRouter.callGeminiPrompt(prompt, { maxTokens: 600, temperature: 0.3 });
        }
      } catch (geminiErr) {
        console.warn('[Chat AI Co-Pilot] Gemini fallback notice:', geminiErr.message);
      }

      if (aiGeneratedReply && aiGeneratedReply.trim()) {
        reply = aiGeneratedReply.trim();
      } else {
        // Deterministic Context-Aware Project Fallback
        if (lowerCmd.includes('status') || lowerCmd.includes('sprint') || lowerCmd.includes('progress') || lowerCmd.includes('burndown') || lowerCmd.includes('pod') || lowerCmd.includes('timeline')) {
          reply = `⚡ **Sprint Velocity Status for ${projName}:**\n\n` +
            `• 🏢 **Project ID:** \`${clientProject.id}\`\n` +
            `• 📦 **Assigned Pod:** \`${podName}\` (${clientProject.target_sla_days || 14}-Day Velocity SLA)\n` +
            `• 📊 **Current Stage:** *${stage}* (${status})\n` +
            `• 📅 **Target Due Date:** ${clientProject.due_date || 'In Progress'}\n` +
            `• 🎬 **Deliverable Sign-Off:** Review room accessible at [/client#review](/client#review)\n\n` +
            `Would you like to schedule a mid-sprint engineering demo with the Pod Lead?`;
        } else if (lowerCmd.includes('warranty') || lowerCmd.includes('sla') || lowerCmd.includes('bug') || lowerCmd.includes('defect') || lowerCmd.includes('guarantee')) {
          reply = `🛡️ **30-Day Zero-Cost Warranty Shield (${projName}):**\n\n` +
            `• ⏳ **Status:** ${isWarrantyActive ? `*ACTIVE* — ${daysRemaining} Days Remaining` : (clientProject.warranty_until ? `Closed on ${clientProject.warranty_until.split('T')[0]}` : 'Activates immediately upon deliverable acceptance')}\n` +
            `• 🚨 **Critical P0 SLA:** 4-Hour Response & 24-Hour Remediation\n` +
            `• ⚙️ **Standard P1 SLA:** 24-Hour Response & 72-Hour Remediation\n` +
            `• 💰 **Coverage:** 100% Zero-Cost Guarantee\n\n` +
            `To file a warranty defect, open your [Client Ticket Desk](/client#tickets).`;
        } else if (lowerCmd.includes('invoice') || lowerCmd.includes('bill') || lowerCmd.includes('pay') || lowerCmd.includes('wire') || lowerCmd.includes('settle') || lowerCmd.includes('bank')) {
          const invList = pendingInvoices.length
            ? pendingInvoices.map(i => `• Invoice \`${i.id}\`: ৳${Number(i.amount).toLocaleString()} BDT (Due: ${i.due_date || 'Immediate'})`).join('\n')
            : '✅ All milestone invoices are settled in full!';
          reply = `💳 **Commercial Billing & Settlement:**\n\n${invList}\n\n` +
            `🏦 **Corporate Settlement Rail (BRAC Bank PLC):**\n` +
            `• **Beneficiary Name:** \`Neoncore Tech Solution\`\n` +
            `• **Account Number:** \`2081636480001\`\n` +
            `• **Bank & Branch:** BRAC Bank PLC, Mohakhali Branch, Dhaka\n` +
            `• **Statutory VAT:** 5.00% included with AIT withholding compliance.\n\n` +
            `You can view and download official vector tax invoices at [/client#invoices](/client#invoices).`;
        } else if (lowerCmd.includes('change') || lowerCmd.includes('scope') || lowerCmd.includes('feature') || lowerCmd.includes('add') || lowerCmd.includes('order')) {
          reply = `📝 **Scope Change Order Addendum Protocol:**\n\n` +
            `To request additional features outside the locked SOW for **${projName}**:\n` +
            `1. Open [Client Scope Desk](/client#change-order) or specify requirements here.\n` +
            `2. The assigned Pod Lead evaluates the scope within 4 hours.\n` +
            `3. An official Change Order Addendum (\`CO-2026-XXXX\`) is issued with fixed BDT fee and target days delta (+3d / +5d / +7d).\n` +
            `4. Work commences immediately upon your digital sign-off.`;
        } else {
          reply = `🤖 **GRO10X Client Co-Pilot (@gro10xb2bot):**\n\n` +
            `Hello! I'm your dedicated engineering assistant for **${projName}** (\`${clientProject.id}\`).\n\n` +
            `I can instantly help you with:\n` +
            `• **Sprint Status & Pod Burndown** (\`status\`)\n` +
            `• **30-Day Bug-Fix Warranty & SLAs** (\`warranty\`)\n` +
            `• **Pending Milestone Invoices & BRAC Bank Wire** (\`invoices\`)\n` +
            `• **Scope Change Orders & Addenda** (\`change order\`)\n\n` +
            `How can I assist your sprint right now?`;
        }
      }
    } else {
      // 4. Prospective Client / Public Inquiry Mode
      if (lowerCmd.includes('/help') || lowerCmd === 'help') {
        reply = "⚡ **GRO10X AI Growth Assistant:**\n\n• `pricing` — View our packages ($1,500 Setup, $500/mo Retainer, $49/mo SaaS)\n• `services` — Explore our 24 AI Services across 7 Verticals\n• `audit` — Request a Free 24-Hour AI Strategy Audit\n• `whatsapp` — Chat directly with our Tech Admin (+880 1711-019550)\n• `consultation` — Book an AI implementation sprint";
      } else if (lowerCmd.includes('rate') || lowerCmd.includes('package') || lowerCmd.includes('price') || lowerCmd.includes('pricing') || lowerCmd.includes('cost')) {
        reply = "💵 **GRO10X Transparent Pricing & Plans:**\n\n• 🚀 **AI Sprint Setup ($1,500 / ৳175,000 one-time):** Full custom AI bot, ComfyUI generation pipeline, or API software build delivered in 5–10 days.\n• ⭐ **Growth Retainer ($500/mo / ৳60,000/mo):** Dedicated AI engineering team for weekly creative assets, prompt tuning, and marketing loops.\n• 💻 **Micro-SaaS Access ($49/mo / ৳5,800/mo):** Instant cloud access to our generative visual & prompt tools.\n\nWould you like to book a free AI Strategy Audit for your project?";
      } else if (lowerCmd.includes('service') || lowerCmd.includes('vertical') || lowerCmd.includes('catalog') || lowerCmd.includes('build')) {
        reply = "🛠️ **GRO10X 7 Core AI Verticals (24 Services):**\n\n1. 📱 **AI Mobile & Web Apps** (iOS/Android/Next.js/Chatbots)\n2. 🎨 **AI Artists & ComfyUI** (Automated product photos, Midjourney)\n3. 📊 **Operational Data Intelligence** (ML models, Dashboards)\n4. 🎬 **AI Video & Avatars** (HeyGen Talking Avatars, UGC Clips)\n5. 🎙️ **AI Audio & Voice** (ElevenLabs clones, Narration)\n6. ✍️ **AI Content & Prompts** (Custom GPTs & RAG pipelines)\n7. ⚡ **Enterprise Strategy & Consulting**\n\nExplore details: https://gro10x-ai.vercel.app/#services";
      } else if (lowerCmd.includes('whatsapp') || lowerCmd.includes('call') || lowerCmd.includes('phone') || lowerCmd.includes('contact') || lowerCmd.includes('founder') || lowerCmd.includes('admin')) {
        reply = "💬 **Connect Instantly with Tech Admin:**\n\n• **WhatsApp:** https://wa.me/8801711019550\n• **Direct Email:** gro10xnow@gmail.com\n• **Turnaround:** We typically respond within 15 minutes!";
      } else if (lowerCmd.includes('audit') || lowerCmd.includes('consultation') || lowerCmd.includes('book')) {
        reply = "🎯 **Free AI Strategy Audit:**\n\nFill out our quick strategy form at https://gro10x-ai.vercel.app/#contact or reply here with your **Name**, **Email**, and **What you want to build**, and our team will prepare a custom proposal within 24 hours!";
      } else {
        reply = `Thanks for reaching out to GRO10X! 🚀 Our AI engineering team has received your inquiry: "${command}". To fast-track your project, chat directly with our founder on WhatsApp: https://wa.me/8801711019550`;
      }
    }
  }

  // Record bot reply in thread history
  chatTakeover.recordAiReply(convId, reply);

  // Broadcast the bot's response via SSE
  const ssePayload = {
    conversationId: convId,
    mode: mode || 'client',
    sender: 'bot',
    text: reply,
    isAiCoPilot,
    timestamp: new Date().toISOString()
  };
  broadcast('chat_message', ssePayload);
  if (authUser?.id) {
    broadcastToClient('chat_message', ssePayload, [authUser.id]);
  }

  return res.json({
    ok: true,
    success: true,
    status: 'sent',
    reply,
    isAiCoPilot,
    conversationId: convId,
    data: { status: 'sent', reply, isAiCoPilot, conversationId: convId }
  });
}));

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 1 Desk Operations Endpoints
 * ─────────────────────────────────────────────────────────────────────────────
 */

// 1. Live Telemetry: 5 KPI Cards, Channel Distribution, Spending Burn
router.get('/telemetry', asyncHandler(async (req, res) => {
  const telemetry = chatTakeover.getTelemetry();
  return ok(res, telemetry);
}));

// 2. Conversation Streams: Omnichannel thread query
router.get('/conversations', asyncHandler(async (req, res) => {
  const { channel, status, projectId, isHumanTakeover } = req.query;
  const list = chatTakeover.listConversations({ channel, status, projectId, isHumanTakeover });
  return ok(res, list);
}));

// 3. Conversation Thread Details
router.get('/conversations/:id', asyncHandler(async (req, res) => {
  const conv = chatTakeover.getConversation(req.params.id);
  if (!conv) {
    return fail(res, 404, 'Conversation thread not found', 'NOT_FOUND');
  }
  return ok(res, conv);
}));

// 4. 1-Click Human Takeover Toggle
router.post('/takeover', asyncHandler(async (req, res) => {
  const { conversationId, enabled, operatorName } = req.body;
  if (!conversationId) {
    return fail(res, 400, 'conversationId is required', 'INVALID_INPUT');
  }

  const opName = operatorName || req.user?.name || 'Internal Pod Operator';
  const updated = chatTakeover.setTakeover(conversationId, enabled, opName);
  if (!updated) {
    return fail(res, 404, 'Conversation thread not found', 'NOT_FOUND');
  }

  return ok(res, {
    message: updated.isHumanTakeover ? `Takeover activated by ${opName}` : 'AI Co-Pilot resumed',
    conversation: updated
  });
}));

// 5. Operator Direct Reply (Bypasses AI)
router.post('/operator-reply', asyncHandler(async (req, res) => {
  const { conversationId, text, operatorName } = req.body;
  if (!conversationId || !text) {
    return fail(res, 400, 'conversationId and text are required', 'INVALID_INPUT');
  }

  const opName = operatorName || req.user?.name || 'Internal Pod Operator';
  const result = chatTakeover.recordOperatorReply(conversationId, text, opName);
  if (!result) {
    return fail(res, 404, 'Conversation thread not found', 'NOT_FOUND');
  }

  return ok(res, {
    status: 'delivered',
    message: result.message,
    conversation: result.conv
  });
}));

// 6. Update Internal Spending Limits & Safety Kill Switch
router.post('/spending-limits', asyncHandler(async (req, res) => {
  const { monthlyBudgetUSD, safetyKillSwitchActive } = req.body;
  const updated = chatTakeover.updateSpendingLimits({ monthlyBudgetUSD, safetyKillSwitchActive });
  return ok(res, {
    message: 'Spending limits and safety controls updated',
    spendingLimits: updated
  });
}));

module.exports = router;


