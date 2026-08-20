require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');
const subdomainRouter = require('./src/middleware/subdomain');
const { sseHandler } = require('./src/services/sse');
const { initBot, getTeamBot, getClientBot } = require('./src/services/bot');
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

// Validate Environment Variables on Startup
const { validateEnvironment } = require('./src/utils/env');
try { validateEnvironment(); } catch (e) { console.warn('[ENV] Boot Note:', e.message); }

// Enable Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self' https://web.telegram.org https://*.telegram.org;");
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  next();
});

// Enable GZIP / Brotli compression for static responses & JSON APIs
app.use(compression());

// Sentry Error Tracking Initialization (if DSN provided)
let Sentry = null;
if (process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'production' });
    console.log('✅ Sentry Error Monitoring initialized');
  } catch (e) {
    console.warn('Sentry init warning:', e.message);
  }
}

// Initialize Telegram Bot & Webhooks
try { initBot(); } catch (e) { console.warn('Bot init note:', e.message); }

// 🔒 SAFETY NET: On every Vercel cold start, force-register the webhook.
// This ensures the bot is never deaf after a deployment or cold start,
// even if a previous local script accidentally cleared it.
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  const https = require('https');
  const teamToken = process.env.TEAM_BOT_TOKEN;
  const baseUrl = process.env.BASE_URL || 'https://purpleos-iota.vercel.app';
  if (teamToken) {
    const webhookUrl = `${baseUrl}/api/webhooks/telegram?bot=team`;
    const payload = JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query', 'inline_query'] });
    const req = https.request(`https://api.telegram.org/bot${teamToken}/setWebhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d || '{}');
          console.log('🔒 Webhook safety-net registration:', parsed.description || 'done');
        } catch (e) {
          console.warn('Webhook safety-net parse warning:', e.message);
        }
      });
    });
    req.on('error', e => console.warn('Webhook safety-net warning:', e.message));
    req.write(payload); req.end();
  }
}

// Sentry Request Handler
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
}

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

// System Health Dashboard API & Deep Telemetry
app.get(['/api/system-health', '/api/system-health/detailed'], async (req, res) => {
  const { supabase, isSupabaseConfigured } = require('./src/services/supabase');
  const { getActiveClientsCount } = require('./src/services/sse');
  const cache = require('./src/services/cache');
  
  let dbStatus = 'Offline';
  let dbLatencyMs = null;
  let agencyStats = {
    totalStaff: 0,
    openTasks: 0,
    urgentTasks: 0,
    overdueTasks: 0
  };

  if (isSupabaseConfigured()) {
    const dbStart = Date.now();
    try {
      const [profRes, taskRes] = await Promise.all([
        supabase.from('profiles').select('id, emp_code, status').limit(100),
        supabase.from('tasks').select('id, priority, due_date, stage').limit(200)
      ]);
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = (profRes.error || taskRes.error) ? 'Degraded' : 'Connected';

      if (profRes.data) {
        agencyStats.totalStaff = profRes.data.length;
      }
      if (taskRes.data) {
        const todayStr = new Date().toISOString().split('T')[0];
        agencyStats.openTasks = taskRes.data.filter(t => !['Approved', 'Published', 'Completed'].includes(t.stage)).length;
        agencyStats.urgentTasks = taskRes.data.filter(t => t.priority === 'Urgent').length;
        agencyStats.overdueTasks = taskRes.data.filter(t => t.due_date && t.due_date < todayStr && !['Approved', 'Published', 'Completed'].includes(t.stage)).length;
      }
    } catch (e) {
      dbStatus = 'Error';
      dbLatencyMs = Date.now() - dbStart;
    }
  }

  const team = getTeamBot();
  const client = getClientBot();

  const isHealthy = dbStatus === 'Connected' && (team !== null || !process.env.TELEGRAM_BOT_TOKEN_TEAM);

  res.json({
    status: isHealthy ? 'healthy' : 'degraded',
    version: '0.9.0.0',
    environment: process.env.NODE_ENV || 'production',
    dbConnection: dbStatus,
    dbLatencyMs: dbLatencyMs !== null ? dbLatencyMs : 0,
    sseClients: getActiveClientsCount ? getActiveClientsCount() : 0,
    botStatus: {
      teamBot: team ? 'active' : 'null',
      teamBotMode: process.env.RENDER || process.env.NODE_ENV === 'production' ? 'webhook' : 'polling',
      clientBot: client ? 'active' : 'null',
      clientBotMode: process.env.RENDER || process.env.NODE_ENV === 'production' ? 'webhook' : 'polling'
    },
    uptimeSeconds: Math.round(process.uptime()),
    memoryMB: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
    cacheStats: cache.stats ? cache.stats() : { activeKeys: cache.size() },
    agencyTelemetry: agencyStats,
    timestamp: new Date().toISOString()
  });
});

// Telegram Webhook Endpoint for Production Updates
app.post(['/api/webhooks/telegram', '/webhooks/telegram'], async (req, res) => {
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  const expectedSecret = process.env.WEBHOOK_SECRET_TOKEN || process.env.WEBHOOK_SECRET;
  
  if (expectedSecret) {
    if (!secretHeader || secretHeader !== expectedSecret) {
      console.warn('⚠️ Webhook request rejected: Invalid or missing secret token');
      return res.status(403).json({ error: 'Forbidden: Invalid secret token' });
    }
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
      console.log(`Webhook received payload (server.js):`, JSON.stringify(req.body));
      await targetBot.processUpdate(req.body);
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

// Serve SPA app modules and public static assets
app.use('/app/modules', express.static(path.join(__dirname, 'public/app/modules'), {
  maxAge: '5m',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  }
}));
app.use('/app', express.static(path.join(__dirname, 'public/app'), {
  maxAge: '5m',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  }
}));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

// Explicit Multi-Portal Routes (Phase C Architecture)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get(['/app', '/admin', '/dashboard', '/os'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/app/index.html'));
});

app.get(['/manager', '/manager-portal'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/manager/index.html'));
});

app.get(['/team', '/crew', '/staff'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/crew/index.html'));
});

app.get(['/partners', '/client', '/portal'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/index.html'));
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

app.get(['/onboarding', '/team-onboarding'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/onboarding.html'));
});

app.get(['/docs', '/overview', '/PBD_Transformation_Tool_Overview.html', '/PBD_Transformation_Tool_Overview'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/PBD_Transformation_Tool_Overview.html'));
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

// Sentry & Global Error Handler
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// Start Express Server (only when run directly, not when imported by Vercel serverless handler)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 PurpleOS Platform running at: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
  });
}

module.exports = app;
