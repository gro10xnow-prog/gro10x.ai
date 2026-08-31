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

const { requireAuth } = require('./src/middleware/auth');

const PORT = process.env.PORT || 3000;

// Allowed origins — dynamic config supporting production, preview, and custom domains
const envOrigins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = Array.from(new Set([
  'https://gro10x-ai.vercel.app',
  'https://gro10x.ai',
  'https://www.gro10x.ai',
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.BASE_URL ? [process.env.BASE_URL] : []),
  ...envOrigins
]));

const app = express();
app.set('trust proxy', 1);

// Validate Environment Variables on Startup
const { validateEnvironment } = require('./src/utils/env');
try { validateEnvironment(); } catch (e) { console.warn('[ENV] Boot Note:', e.message); }

// Enable Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
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

// Global Process Crash Prevention & Telemetry
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err?.stack || err?.message || err);
  if (Sentry) {
    try { Sentry.captureException(err); } catch (_) {}
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ UNHANDLED PROMISE REJECTION:', reason?.stack || reason?.message || reason);
  if (Sentry && reason instanceof Error) {
    try { Sentry.captureException(reason); } catch (_) {}
  }
});

// Initialize Telegram Bot & Webhooks (safe in-memory initialization)
try { initBot(); } catch (e) { console.warn('Bot init note:', e.message); }

// Sentry Request Handler
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Telegram Mini App, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('gro10x.ai') ||
      (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Subdomain & Auth Portal Routing
app.use(subdomainRouter);

// SSE Endpoint for real-time synchronization
app.get(['/api/sync', '/sync', '/api/events'], requireAuth, sseHandler);

// Bot Status Health Check
app.get(['/api/bot-status', '/bot-status'], async (req, res) => {
  let team = getTeamBot();
  let client = getClientBot();
  if (!team || !client) {
    try { initBot(); team = getTeamBot(); client = getClientBot(); } catch (e) {}
  }
  let teamInfo = null;
  let clientInfo = null;
  try { if (team) teamInfo = await team.getMe(); } catch (e) { teamInfo = { error: e.message }; }
  try { if (client) clientInfo = await client.getMe(); } catch (e) { clientInfo = { error: e.message }; }

  res.json({
    teamBot: team ? 'active' : 'null',
    teamBotInfo: teamInfo,
    clientBot: client ? 'active' : 'null',
    clientBotInfo: clientInfo,
    timestamp: new Date().toISOString()
  });
});

// System Health Dashboard API & Deep Telemetry (Public health & liveness probe)
app.get(['/api/system-health', '/api/system-health/detailed'], async (req, res) => {
  try {
    const { supabase, isSupabaseConfigured } = require('./src/services/supabase');
    const { getActiveClientsCount } = require('./src/services/sse');
    const cache = require('./src/services/cache');
    const pkg = require('./package.json');
    
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

    let team = getTeamBot();
    let client = getClientBot();
    if (!team || !client) {
      try { initBot(); team = getTeamBot(); client = getClientBot(); } catch (e) {}
    }

    const isHealthy = dbStatus === 'Connected' && team !== null;

    const hasAuth = !!(req.headers.authorization || (req.headers.cookie && req.headers.cookie.includes('sb-access-token')));

    return res.json({
      status: isHealthy ? 'healthy' : 'degraded',
      version: pkg.version || '0.9.0.0',
      environment: process.env.NODE_ENV || 'production',
      dbConnection: dbStatus,
      dbLatencyMs: dbLatencyMs !== null ? dbLatencyMs : 0,
      sseClients: getActiveClientsCount ? getActiveClientsCount() : 0,
      botStatus: {
        teamBot: team ? 'active' : 'null',
        hasTeamToken: !!(process.env.TEAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_TEAM || process.env.TELEGRAM_BOT_TOKEN),
        teamBotMode: process.env.RENDER || process.env.NODE_ENV === 'production' ? 'webhook' : 'polling',
        clientBot: client ? 'active' : 'null',
        hasClientToken: !!(process.env.CLIENT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN),
        clientBotMode: process.env.RENDER || process.env.NODE_ENV === 'production' ? 'webhook' : 'polling'
      },
      uptimeSeconds: Math.round(process.uptime()),
      memoryMB: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
      cacheStats: cache.stats ? cache.stats() : { activeKeys: cache.size() },
      ...(hasAuth ? { agencyTelemetry: agencyStats } : {}),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('System health check error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Health probe exception' });
  }
});

// Telegram Webhook Endpoint for Production Updates
app.post(['/api/webhooks/telegram', '/webhooks/telegram'], async (req, res) => {
  const botType = req.query.bot || 'team';
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  const expectedSecret = botType === 'client'
    ? (process.env.WEBHOOK_SECRET_CLIENT || process.env.WEBHOOK_SECRET_TOKEN || process.env.WEBHOOK_SECRET)
    : (process.env.WEBHOOK_SECRET_TEAM || process.env.WEBHOOK_SECRET_TOKEN || process.env.WEBHOOK_SECRET);
  
  if (expectedSecret && secretHeader && secretHeader !== expectedSecret) {
    console.warn(`⚠️ Webhook request rejected (${botType}): Invalid secret token`);
    return res.status(403).json({ error: 'Forbidden: Invalid secret token' });
  }

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
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Webhook received payload (${botType}):`, JSON.stringify(req.body));
      } else {
        console.log(`[Webhook] Processing update (${botType}) update_id:`, req.body?.update_id);
      }
      const { processWebhookUpdate } = require('./src/services/bot');
      await processWebhookUpdate(req.body, botType);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(`Telegram webhook update processing error (${botType}):`, err.message);
      return res.status(500).json({ error: 'Processing error' });
    }
  } else if (!targetBot) {
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ ok: true, simulated: true });
    }
    console.warn(`⚠️ Target bot (${botType}) is null during webhook processing. Returning 503 for Telegram retry.`);
    return res.status(503).json({ error: 'Bot service not ready. Telegram will retry.' });
  }
  return res.status(200).json({ ok: true });
});

// Vercel Serverless URL Normalizer
app.use((req, res, next) => {
  if (req.url.startsWith('/server.js')) {
    req.url = req.url.replace(/^\/server\.js/, '') || '/';
  }
  next();
});

// Mount API routes (prioritized before static assets)
app.use('/api', apiRoutes);

// Serve SPA app modules and public static assets (no-cache for modules so code updates apply immediately)
app.use('/app/modules', express.static(path.join(__dirname, 'public/app/modules'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));
app.use('/app', express.static(path.join(__dirname, 'public/app'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));
app.use('/dbm', express.static(path.join(__dirname, 'public/dbm'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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

app.get(['/dbm', '/dbm-portal'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dbm/index.html'));
});

app.get(['/manager', '/manager-portal'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/manager/index.html'));
});

app.get(['/team', '/crew', '/staff'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/crew/index.html'));
});

app.get(['/partners', '/partners.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/partners.html'));
});

app.get(['/client', '/portal'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client/index.html'));
});

app.get(['/chat', '/bot-chat'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/chat.html'));
});

app.get(['/proposal', '/proposal.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/proposal.html'));
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

app.get(['/docs', '/overview'], (req, res) => {
  res.redirect('/');
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
    'Disallow: /manager\n' +
    'Disallow: /manager-portal\n' +
    'Disallow: /team\n' +
    'Disallow: /crew\n' +
    'Disallow: /staff\n' +
    'Disallow: /partners\n' +
    'Disallow: /client\n' +
    'Disallow: /portal\n' +
    'Disallow: /chat\n' +
    'Disallow: /onboarding\n' +
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
    console.log(`⚡ GRO10X OS Platform running at: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
  });
}

module.exports = app;
