const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('../src/routes/api');
const { sseHandler } = require('../src/services/sse');
const { initBot } = require('../src/services/bot');

const app = express();

// Initialize Telegram Bot & Webhooks for Vercel deployment
initBot();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SSE Route
app.get('/api/sync', sseHandler);

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

// Export serverless handler for Vercel
module.exports = app;
