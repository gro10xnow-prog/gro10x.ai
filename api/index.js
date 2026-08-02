const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('../src/routes/api');
const { sseHandler } = require('../src/services/sse');
const { initBot, getTeamBot, getClientBot } = require('../src/services/bot');
const { startScheduledJobs } = require('../src/services/automation');
const { readDB, writeDB } = require('../src/services/db');
const { broadcast } = require('../src/services/sse');

const app = express();

// Initialize Telegram Bot & Webhooks for Vercel deployment
try { initBot(); } catch (e) {}
try { startScheduledJobs(readDB, writeDB, broadcast); } catch (e) {}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SSE Route
app.get(['/api/sync', '/sync'], sseHandler);

// Bot Status Health Check
app.get(['/api/bot-status', '/bot-status'], (req, res) => {
  let team = getTeamBot();
  let client = getClientBot();
  if (!team || !client) {
    try { initBot(); team = getTeamBot(); client = getClientBot(); } catch (e) {}
  }
  res.json({
    teamBot: team ? 'active' : 'null',
    clientBot: client ? 'active' : 'null',
    timestamp: new Date().toISOString()
  });
});

// Telegram Webhook Endpoint for Production Updates
app.post(['/api/webhooks/telegram', '/webhooks/telegram'], (req, res) => {
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  if (process.env.WEBHOOK_SECRET && secretHeader !== process.env.WEBHOOK_SECRET) {
    console.warn('⚠️ Webhook request rejected: Invalid secret token');
    return res.status(403).json({ error: 'Forbidden' });
  }

  const botType = req.query.bot || 'team';
  let targetBot = botType === 'client' ? getClientBot() : getTeamBot();

  // Cold start fallback: Ensure bot instance is ready
  if (!targetBot) {
    try {
      initBot();
      targetBot = botType === 'client' ? getClientBot() : getTeamBot();
    } catch (e) {
      console.error(`Error initializing bot on cold start (${botType}):`, e.message);
    }
  }

  if (targetBot && req.body) {
    try {
      targetBot.processUpdate(req.body);
    } catch (err) {
      console.error(`Telegram webhook update processing error (${botType}):`, err.message);
    }
  } else if (!targetBot) {
    console.warn(`⚠️ Target bot (${botType}) is null during webhook processing`);
  }
  return res.status(200).json({ ok: true });
});

// API Router (prioritized before static assets)
app.use('/api', apiRoutes);

// Serve static assets
app.use(express.static(path.join(__dirname, '../public')));

// Portal Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get(['/admin', '/dashboard', '/os'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get(['/team', '/crew', '/staff'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/team.html'));
});

app.get(['/partners', '/client', '/portal'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/partners.html'));
});

app.get(['/chat', '/bot-chat'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/chat.html'));
});

app.get(['/team-miniapp', '/crew-app'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/team-miniapp.html'));
});

app.get(['/client-miniapp', '/review-app'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/client-miniapp.html'));
});

app.get(['/onboarding', '/onboard'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/onboarding.html'));
});

// Export serverless handler for Vercel
module.exports = app;
