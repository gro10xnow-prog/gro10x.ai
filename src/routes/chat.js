/**
 * src/routes/chat.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PurpleOS Web Chat Widget & Bot Assistant Router v2.0.
 * Dynamic command dispatching for Team and Client modes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { broadcast } = require('../services/sse');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
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
      reply = "🤖 **PurpleOS Team Bot Commands:**\n\n• `/clockin` — Clock in for your shift\n• `/clockout` — Clock out at EOD\n• `/myearnings` — Check your pending earnings & commission\n• `/tasks` — View your active assigned tasks\n• `/leaves` — Check your leave balance & status";
    } else if (lowerCmd.includes('/clockin') || lowerCmd.includes('clock in')) {
      reply = "🟢 **Clocked In:** You have successfully registered your shift start. Have a productive day!";
    } else if (lowerCmd.includes('/clockout') || lowerCmd.includes('clock out')) {
      reply = "🚪 **Clocked Out:** Shift completed. Don't forget to submit your EOD report!";
    } else if (lowerCmd.includes('/myearnings') || lowerCmd.includes('earnings')) {
      reply = "💰 **Earnings Summary:** Log in to your Crew Portal to view detailed base salary + commission breakdown.";
    } else {
      reply = `Received: "${command}". Type \`/help\` for a list of available team commands.`;
    }
  } else {
    // Client / Public Mode
    if (lowerCmd.includes('/help') || lowerCmd === 'help') {
      reply = "🤖 **PurpleOS Assistant Commands:**\n\n• `pricing` or `rates` — View our service packages & pricing\n• `portfolio` — Explore our recent agency work\n• `invoice` — Check invoice & payment details\n• `contact` — Talk to our account team";
    } else if (lowerCmd.includes('rate') || lowerCmd.includes('package') || lowerCmd.includes('price') || lowerCmd.includes('pricing')) {
      reply = "💰 **Purplebot Digital Service Catalog:**\n\n• **Digital Marketing Retainer:** BDT ৳75,000 / month\n• **Short-Form Reels Production (10 Reels):** BDT ৳45,000\n• **TVC & Commercial Production:** BDT ৳180,000 / project\n• **360° Branding Identity:** BDT ৳65,000 / project\n\nReply with your brand name to request a custom proposal!";
    } else if (lowerCmd.includes('portfolio') || lowerCmd.includes('work') || lowerCmd.includes('reel')) {
      reply = "📁 **Agency Portfolio:** Explore our recent campaign work and case studies at: https://purplebot.digital";
    } else if (lowerCmd.includes('invoice') || lowerCmd.includes('billing') || lowerCmd.includes('payment')) {
      reply = "💳 **Billing & Invoices:** Access active invoices and submit bKash/Card payments directly in your Client Partner Portal.";
    } else {
      reply = `Thank you for reaching out! Our team has received your message: "${command}". An account manager will respond shortly. Type \`help\` for quick options.`;
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
