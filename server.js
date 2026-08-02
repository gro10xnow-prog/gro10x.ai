require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');
const subdomainRouter = require('./src/middleware/subdomain');
const { sseHandler } = require('./src/services/sse');
const { initBot, getTeamBot, getClientBot } = require('./src/services/bot');
const { startScheduledJobs } = require('./src/services/automation');
const { readDB, writeDB } = require('./src/services/db');
const { broadcast } = require('./src/services/sse');

const PORT = process.env.PORT || 3000;

// Allowed origins — restrict to known production & preview domains
const ALLOWED_ORIGINS = [
  'https://purpleos-iota.vercel.app',
  'https://purplebot.digital',
  'https://www.purplebot.digital',
  'http://localhost:3000',
  'http://localhost:3001'
];

const app = express();

// Sentry Error Tracking Initialization (if DSN provided)
if (process.env.SENTRY_DSN) {
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'production' });
    console.log('✅ Sentry Error Monitoring initialized');
  } catch (e) {
    console.warn('Sentry init warning:', e.message);
  }
}

// Initialize Telegram Bot & Webhooks
try { initBot(); } catch (e) { console.warn('Bot init note:', e.message); }
// Start scheduled jobs (morning briefing 9:15 AM, EOD summary 8 PM — Bangladesh time)
try { startScheduledJobs(readDB, writeDB, broadcast); } catch (e) { console.warn('Scheduler note:', e.message); }

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Telegram Mini App, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Subdomain & Auth Portal Routing
app.use(subdomainRouter);

// SSE Endpoint for real-time synchronization
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

// Mount API routes (prioritized before static assets)
app.use('/api', apiRoutes);

// Serve static frontend assets from /public
app.use(express.static(path.join(__dirname, 'public')));

// Explicit Multi-Portal Routes (Phase C Architecture)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get(['/admin', '/dashboard', '/os'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.get(['/manager', '/manager-portal'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/manager.html'));
});

app.get(['/team', '/crew', '/staff'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/team.html'));
});

app.get(['/partners', '/client', '/portal'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/partners.html'));
});

app.get(['/chat', '/bot-chat'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/chat.html'));
});

app.get(['/team-miniapp', '/crew-app'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/team-miniapp.html'));
});

app.get(['/client-miniapp', '/review-app'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client-miniapp.html'));
});

// Dedicated Public Service Pages Routes
app.get([
  '/services/digital-marketing',
  '/services/video-editing',
  '/services/branding-graphics',
  '/services/website-development',
  '/services/custom-tech',
  '/service-detail'
], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/service-detail.html'));
});

// Robots.txt to hide internal portals from public search engine crawlers
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(
    'User-agent: *\n' +
    'Disallow: /admin\n' +
    'Disallow: /dashboard\n' +
    'Disallow: /os\n' +
    'Disallow: /team\n' +
    'Disallow: /crew\n' +
    'Disallow: /partners\n' +
    'Disallow: /api/\n' +
    'Allow: /\n'
  );
});

// Catch-all fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start Express Server (only when run directly, not when imported by Vercel serverless handler)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 PurpleOS Platform running at: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
  });
}

module.exports = app;
