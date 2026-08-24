/**
 * src/routes/chat.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Web Chat Widget & Bot Assistant Router v3.0
 * Intelligent command dispatching for Team and Prospective Client modes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { broadcast } = require('../services/sse');
const { ok, fail, asyncHandler } = require('../utils/response');

router.post('/send', asyncHandler(async (req, res) => {
  const { command, mode } = req.body;
  
  if (!command || typeof command !== 'string') {
    return fail(res, 400, 'command is required', 'INVALID_INPUT');
  }

  const lowerCmd = command.trim().toLowerCase();
  let reply = '';

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
    // Prospective Client / Public Mode
    if (lowerCmd.includes('/help') || lowerCmd === 'help') {
      reply = "⚡ **GRO10X AI Growth Assistant:**\n\n• `pricing` — View our packages ($1,500 Setup, $500/mo Retainer, $49/mo SaaS)\n• `services` — Explore our 24 AI Services across 7 Verticals\n• `audit` — Request a Free 24-Hour AI Strategy Audit\n• `whatsapp` — Chat directly with our Tech Admin (+8801708459008)\n• `consultation` — Book an AI implementation sprint";
    } else if (lowerCmd.includes('rate') || lowerCmd.includes('package') || lowerCmd.includes('price') || lowerCmd.includes('pricing') || lowerCmd.includes('cost')) {
      reply = "💵 **GRO10X Transparent Pricing & Plans:**\n\n• 🚀 **AI Sprint Setup ($1,500 / ৳175,000 one-time):** Full custom AI bot, ComfyUI generation pipeline, or API software build delivered in 5–10 days.\n• ⭐ **Growth Retainer ($500/mo / ৳60,000/mo):** Dedicated AI engineering team for weekly creative assets, prompt tuning, and marketing loops.\n• 💻 **Micro-SaaS Access ($49/mo / ৳5,800/mo):** Instant cloud access to our generative visual & prompt tools.\n\nWould you like to book a free AI Strategy Audit for your project?";
    } else if (lowerCmd.includes('service') || lowerCmd.includes('vertical') || lowerCmd.includes('catalog') || lowerCmd.includes('build')) {
      reply = "🛠️ **GRO10X 7 Core AI Verticals (24 Services):**\n\n1. 📱 **AI Mobile & Web Apps** (iOS/Android/Next.js/Chatbots)\n2. 🎨 **AI Artists & ComfyUI** (Automated product photos, Midjourney)\n3. 📊 **Operational Data Intelligence** (ML models, Dashboards)\n4. 🎬 **AI Video & Avatars** (HeyGen Talking Avatars, UGC Clips)\n5. 🎙️ **AI Audio & Voice** (ElevenLabs clones, Narration)\n6. ✍️ **AI Content & Prompts** (Custom GPTs & RAG pipelines)\n7. ⚡ **Enterprise Strategy & Consulting**\n\nExplore details: https://gro10x-ai.vercel.app/#services";
    } else if (lowerCmd.includes('whatsapp') || lowerCmd.includes('call') || lowerCmd.includes('phone') || lowerCmd.includes('contact') || lowerCmd.includes('founder') || lowerCmd.includes('admin')) {
      reply = "💬 **Connect Instantly with Tech Admin:**\n\n• **WhatsApp:** https://wa.me/8801708459008\n• **Direct Email:** gro10xnow@gmail.com\n• **Turnaround:** We typically respond within 15 minutes!";
    } else if (lowerCmd.includes('audit') || lowerCmd.includes('consultation') || lowerCmd.includes('book')) {
      reply = "🎯 **Free AI Strategy Audit:**\n\nFill out our quick strategy form at https://gro10x-ai.vercel.app/#contact or reply here with your **Name**, **Email**, and **What you want to build**, and our team will prepare a custom proposal within 24 hours!";
    } else {
      reply = `Thanks for reaching out to GRO10X! 🚀 Our AI engineering team has received your inquiry: "${command}". To fast-track your project, chat directly with our founder on WhatsApp: https://wa.me/8801708459008`;
    }
  }

  // Broadcast the bot's response via SSE
  broadcast('chat_message', {
    mode: mode || 'client',
    sender: 'bot',
    text: reply,
    timestamp: new Date().toISOString()
  });

  return ok(res, { status: 'sent', reply });
}));

module.exports = router;
