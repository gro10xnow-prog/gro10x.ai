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

// Serve static frontend assets from /public
app.use(express.static(path.join(__dirname, 'public')));

// SSE Endpoint for real-time synchronization
app.get('/api/sync', sseHandler);

// Mount API routes
app.use('/api', apiRoutes);

// Explicit Multi-Portal Routes (Phase C Architecture)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get(['/admin', '/dashboard', '/os'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.get(['/team', '/crew', '/staff'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/team.html'));
});

app.get(['/partners', '/client', '/portal'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/partners.html'));
});

// Catch-all fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/landing.html'));
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
