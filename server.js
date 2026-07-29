require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');
const subdomainRouter = require('./src/middleware/subdomain');
const { sseHandler } = require('./src/services/sse');
const { initBot } = require('./src/services/bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Subdomain & Auth Portal Routing
app.use(subdomainRouter);

// SSE Endpoint for real-time synchronization
app.get('/api/sync', sseHandler);

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

    // Initialize Telegram Bot (if Bot Token is present)
    initBot();
  });
}

module.exports = app;
