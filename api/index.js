const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('../src/routes/api');
const { sseHandler } = require('../src/services/sse');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(path.join(__dirname, '../public')));

// SSE Route
app.get('/api/sync', sseHandler);

// API Router
app.use('/api', apiRoutes);

// Portal Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

app.get(['/admin', '/dashboard', '/os'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get(['/team', '/crew', '/staff'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/team.html'));
});

app.get(['/partners', '/client', '/portal'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/partners.html'));
});

// Export serverless handler for Vercel
module.exports = app;
