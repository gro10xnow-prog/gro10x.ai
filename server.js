require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');
const subdomainRouter = require('./src/middleware/subdomain');
const { sseHandler, broadcast, initRealtimePubSub } = require('./src/services/sse');
const { initBot, getTeamBot, getClientBot } = require('./src/services/bot');
const { readDB, writeDB } = require('./src/services/db');

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
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Validate Environment Variables on Startup
const { validateEnvironment } = require('./src/utils/env');
try { validateEnvironment(); } catch (e) { console.warn('[ENV] Boot Note:', e.message); }

// Request ID & Tracing Middleware
const requestIdMiddleware = require('./src/middleware/requestId');
app.use(requestIdMiddleware);

// Enable Production-Grade Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // HSTS: Enforce HTTPS in production or behind secure reverse proxy
  if (process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  // - 'unsafe-eval' REMOVED: no eval() or new Function() calls exist in public/js/*.js (verified by audit).
  // - 'unsafe-inline' retained: Tier-3 item — requires nonce/hash refactor across 34 HTML files.
  // - Explicit script-src / style-src override the broad default-src 'self' https: for tighter control.
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: blob: 'unsafe-inline'; " +
    "script-src 'self' https: 'unsafe-inline'; " +
    "style-src 'self' https: 'unsafe-inline'; " +
    "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org; " +
    "connect-src 'self' https: wss: ws:;"
  );
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=(), payment=(self)');
  next();
});

// Response Time Header & Performance Metric Telemetry
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    try {
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration}ms`);
      }
    } catch (_) {}
  });
  next();
});

// Enable GZIP / Brotli compression for static responses & JSON APIs (>= 1KB)
app.use(compression({ threshold: 1024 }));

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

// Initialize DigiVault Customer Commerce Bot (@Digivault20bot)
try {
  const { initDigiVaultBot } = require('./src/services/digivault-bot');
  initDigiVaultBot();
} catch (e) { console.warn('[DigiVault Bot] Init note:', e.message); }

// Initialize Background Interval Cron Workers (only when running as a persistent server, not serverless/imported)
if (require.main === module && !process.env.VERCEL) {
  try {
    const { initDigiVaultCron } = require('./src/services/digivault-cron');
    initDigiVaultCron();
  } catch (e) { console.warn('[DigiVault Cron] Init note:', e.message); }

  try {
    const { initDCERenewalCron } = require('./src/services/dce-renewal-cron');
    initDCERenewalCron();
  } catch (e) { console.warn('[DCE Renewal Cron] Init note:', e.message); }

  try {
    const { initWarrantyCron } = require('./src/services/warranty-cron');
    initWarrantyCron();
  } catch (e) { console.warn('[Warranty Cron] Init note:', e.message); }

  try {
    const { initDefectEscalationCron } = require('./src/services/defect-escalation-cron');
    initDefectEscalationCron();
  } catch (e) { console.warn('[Defect SLA Cron] Init note:', e.message); }

  try {
    const { initWeeklyExecutiveCron } = require('./src/services/weekly-executive-cron');
    initWeeklyExecutiveCron();
  } catch (e) { console.warn('[Weekly Executive Cron] Init note:', e.message); }
}

// Eagerly initialize Supabase Realtime pub/sub on boot (cross-pod synchronization)
try {
  if (typeof initRealtimePubSub === 'function') {
    initRealtimePubSub();
  }
} catch (e) { console.warn('[Realtime PubSub] Init note:', e.message); }

// Auto-provision required Supabase storage buckets if missing
try {
  const { ensureStorageBuckets } = require('./src/services/supabase');
  if (typeof ensureStorageBuckets === 'function') {
    ensureStorageBuckets().catch(e => console.warn('[Storage] Bucket provisioning note:', e.message));
  }
} catch (e) { console.warn('[Storage] Init note:', e.message); }

// Sentry Request Handler
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Telegram Mini App, mobile apps, curl)
    if (!origin) return callback(null, true);

    // Scoped Vercel domain check: only permit GRO10X-owned deployments
    const isAllowedVercel = /^https:\/\/(gro10x|gro10xnow|purpleos)(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
    const isAllowedCustomDomain = origin.endsWith('.gro10x.ai') || origin === 'https://gro10x.ai';

    if (
      ALLOWED_ORIGINS.includes(origin) ||
      isAllowedVercel ||
      isAllowedCustomDomain ||
      origin.startsWith('chrome-extension://') ||
      (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Subdomain & Auth Portal Routing
app.use(subdomainRouter);

// SSE Endpoint for real-time synchronization
app.get(['/api/sync', '/sync', '/api/events', '/api/sse'], requireAuth, sseHandler);
app.post(['/api/sync/broadcast', '/sync/broadcast'], requireAuth, (req, res) => {
  const { eventType, data, role, clientId, empCode } = req.body || {};
  const sse = require('./src/services/sse');
  if (clientId) {
    sse.broadcastToClient(eventType || 'test', data || {}, Array.isArray(clientId) ? clientId : [clientId]);
  } else if (role) {
    sse.broadcastToRole(eventType || 'test', data || {}, role);
  } else if (empCode) {
    sse.broadcastToEmployee(eventType || 'test', data || {}, Array.isArray(empCode) ? empCode : [empCode]);
  } else {
    sse.broadcast(eventType || 'test', data || {});
  }
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Bot Status Health Check
app.get(['/api/bot-status', '/bot-status'], requireAuth, async (req, res) => {
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

// Cloud & Container Liveness Probe (Kubernetes / Render / AWS ECS / Docker)
app.get(['/healthz', '/livez', '/health'], (req, res) => {
  const { isShuttingDown } = require('./src/utils/shutdown');
  if (isShuttingDown && isShuttingDown()) {
    return res.status(503).json({ status: 'shutting_down', timestamp: new Date().toISOString() });
  }
  return res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Deep Cloud Readiness Probe (Validates Supabase database connection and service latency)
app.get(['/readyz', '/ready'], async (req, res) => {
  const { isShuttingDown } = require('./src/utils/shutdown');
  if (isShuttingDown && isShuttingDown()) {
    return res.status(503).json({ status: 'not_ready', reason: 'shutting_down' });
  }

  const { supabase, isSupabaseConfigured } = require('./src/services/supabase');
  let dbStatus = 'Offline';
  let dbLatencyMs = null;

  if (isSupabaseConfigured()) {
    const t0 = Date.now();
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      dbLatencyMs = Date.now() - t0;
      dbStatus = error ? 'Degraded' : 'Connected';
    } catch (_) {
      dbStatus = 'Error';
      dbLatencyMs = Date.now() - t0;
    }
  }

  const isReady = dbStatus === 'Connected';
  return res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'degraded',
    dbConnection: dbStatus,
    dbLatencyMs: dbLatencyMs !== null ? dbLatencyMs : 0,
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
  
  if (process.env.NODE_ENV === 'production' || expectedSecret) {
    if (!expectedSecret) {
      console.error(`[Webhook] WEBHOOK_SECRET not configured for ${botType} bot in production — rejecting payload`);
      return res.status(403).json({ error: 'Forbidden: Webhook secret not configured' });
    }
    if (secretHeader !== expectedSecret) {
      console.warn(`⚠️ Webhook request rejected (${botType}): Invalid secret token`);
      return res.status(403).json({ error: 'Forbidden: Invalid secret token' });
    }
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


// Unified Multi-Engine Web Workspace (Phase 2)
app.get(['/workspace', '/workspace/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/workspace/index.html'));
});
app.use('/workspace', express.static(path.join(__dirname, 'public/workspace'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// Interactive Digital Planner & Micro-Product Route (Phase 1)
app.get(['/planner', '/planner/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/planner/index.html'));
});
app.use('/planner', express.static(path.join(__dirname, 'public/planner')));

// Universal Customer Portal & Credit Wallet (Phase 2)
app.get(['/my-portal', '/my-portal/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/my-portal/index.html'));
});
app.use('/my-portal', express.static(path.join(__dirname, 'public/my-portal')));

// Etsy Buyer Delivery Certificate Sheet (Phase 2)
app.get(['/delivery', '/delivery/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/delivery/index.html'));
});
app.use('/delivery', express.static(path.join(__dirname, 'public/delivery')));

// Interactive 3D Multi-Angle Spatial Engine & Product Lab
app.get(['/3d-viewer', '/3d-viewer/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/3d-viewer/index.html'));
});
app.use('/3d-viewer', express.static(path.join(__dirname, 'public/3d-viewer')));
app.get(['/real3d', '/real3d/', '/kids-3d', '/kids-3d/', '/3d-viewer/kids'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/3d-viewer/real3d.html'));
});

// DigiVault BD Storefront — Premium Digital Subscriptions (Bangla market)
app.get(['/digivault', '/digivault/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/digivault/index.html'));
});
app.use('/digivault', express.static(path.join(__dirname, 'public/digivault')));

// PlannerQueen product vault — redirect to interactive planner
app.get(['/vault/plannerqueen', '/vault/:slug'], (req, res) => {
  res.redirect('/planner');
});

// Client Portal Modules - strict no-cache to ensure immediate updates in browser sessions
app.use('/client/modules', express.static(path.join(__dirname, 'public/client/modules'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// Manager and Crew Portal Modules - static assets served before workstation redirects
app.use('/manager/modules', express.static(path.join(__dirname, 'public/manager/modules')));
app.use('/crew/modules', express.static(path.join(__dirname, 'public/crew/modules')));

// Phase 5: Consolidated Workstation Redirects (Decommissioned Standalone Internal Portals)
// Placed before express.static so Express doesn't issue a 301 trailing slash redirect
app.get(['/crew', '/crew/', '/team', '/staff'], (req, res) => {
  res.redirect(302, '/workspace#tasks');
});

app.get(['/manager', '/manager/', '/manager-portal'], (req, res) => {
  res.redirect(302, '/workspace#overview');
});

app.get(['/dbm', '/dbm/', '/dbm-portal'], (req, res) => {
  res.redirect(302, '/workspace?engineId=engine3#deliverables');
});

// Canonical Public Commerce & Customer Endpoints
app.get(['/dce/track', '/track', '/dce-track'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dce/track.html'));
});

app.get(['/dce/store', '/store', '/dce-store'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dce/store.html'));
});

app.get(['/affiliate/portal', '/dce/affiliate', '/affiliate'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dce/affiliate.html'));
});

// Canonical DCE Portal Suite Endpoints
app.get(['/dce', '/dce/', '/dce-portal'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dce/index.html'));
});

app.get(['/dce/orders', '/dce-orders'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dce/orders.html'));
});

app.get(['/dce/operations', '/dce-operations'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dce/operations.html'));
});

app.get(['/dce/growth', '/dce-growth'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dce/growth.html'));
});

app.get(['/dce/digivault', '/dce-digivault'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dce/digivault.html'));
});

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (/\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Explicit Multi-Portal Routes (Phase C Architecture)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get(['/auth', '/login'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/auth.html'));
});

app.get(['/app', '/admin', '/dashboard', '/os'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/app/index.html'));
});



// Standalone Affiliate Short Link Redirect Handler
app.get('/r/:shortCode', async (req, res) => {
  try {
    const { recordClickAndResolve } = require('./src/services/dce-affiliates');
    const result = await recordClickAndResolve(req.params.shortCode);
    if (result && result.destinationUrl) {
      // Set attribution cookie for 30 days
      res.cookie('dce_ref', result.shortCode, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
      return res.redirect(result.destinationUrl);
    }
  } catch (e) {}
  return res.redirect('/workspace?engineId=engine3#pnl');
});



app.get(['/partners', '/partners.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/partners.html'));
});

// Co-Branded Partner Referral Portal Redirect & 30-Day Attribution Cookie Stamping
app.get(['/portal/:partnerCode', '/partners/:partnerCode'], async (req, res, next) => {
  const { partnerCode } = req.params;
  if (!partnerCode || partnerCode === 'index.html' || partnerCode.includes('.')) {
    return next();
  }
  const cleanRef = partnerCode.trim().toUpperCase();

  // Set 30-day attribution cookie
  res.cookie('gro10x_aff_ref', cleanRef, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax',
    path: '/'
  });

  // Track click telemetry asynchronously
  try {
    const { getAffiliateRecord, memoryAffiliates } = require('./src/routes/affiliates');
    if (getAffiliateRecord) {
      const aff = await getAffiliateRecord(cleanRef);
      if (aff) {
        aff.clicks = (aff.clicks || 0) + 1;
        if (memoryAffiliates) {
          memoryAffiliates.set(aff.id || cleanRef, aff);
        }
        const { supabase, isSupabaseConfigured } = require('./src/services/supabase');
        if (isSupabaseConfigured() && aff.id) {
          supabase.from('affiliates').update({ clicks: aff.clicks }).eq('id', aff.id).then?.(() => {}).catch?.(() => {});
        }
        const { broadcast } = require('./src/services/sse');
        broadcast('affiliate_click', { refCode: cleanRef, totalClicks: aff.clicks });
      }
    }
  } catch (_) {}

  return res.redirect(302, `/?ref=${encodeURIComponent(cleanRef)}#consultation`);
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

// Public Proposal Share Link — /p/:token redirects to /proposal?t=TOKEN
app.get('/p/:token', (req, res) => {
  res.redirect(302, `/proposal?t=${encodeURIComponent(req.params.token)}`);
});

// Engine 1 Outbound Campaign & Vanity Service Routes
app.get(['/services/:code', '/service-detail/:code'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/service-detail.html'));
});

app.get(['/services', '/services/'], (req, res) => {
  res.redirect(302, '/#capabilities');
});

app.get(['/leads/claim', '/claim'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get(['/book-consultation', '/book', '/consultation'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Engine 2 Document & Stakeholder View Routes
app.get(['/msa-view', '/msa-view.html', '/msa'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/msa-view.html'));
});

app.get(['/handover-view', '/handover-view.html', '/handover'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/handover-view.html'));
});

app.get(['/invoice-view', '/invoice-view.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/invoice-view.html'));
});

app.get(['/transit', '/transit/', '/team-miniapp', '/crew-app'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/team-miniapp.html'));
});

app.get(['/client-miniapp', '/review-app'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/client-miniapp.html'));
});

app.get(['/onboarding', '/team-onboarding'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/onboarding.html'));
});

app.get(['/sprint', '/sprint.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/sprint.html'));
});

// National Housing Finance Interactive Prototype
app.get(['/nhf', '/nhf/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/nhf/index.html'));
});

// Engine 2 Inbound AI Readiness Diagnostic Scorecard
app.get(['/ai-audit', '/ai-audit.html', '/audit'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/ai-audit.html'));
});

// Engine 2 Subcontractor Scoped Gateway & Masked Mini Portal
app.get(['/contractor-view', '/contractor-view.html', '/contractor'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/contractor-view.html'));
});

app.get(['/docs', '/overview'], (req, res) => {
  res.redirect('/');
});

app.get(['/flow-simulator', '/flow-simulator.html', '/simulator'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/flow-simulator.html'));
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
  const server = app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`⚡ GRO10X OS Platform running at: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
  });

  const { setupGracefulShutdown } = require('./src/utils/shutdown');
  setupGracefulShutdown(server);
}

module.exports = app;
