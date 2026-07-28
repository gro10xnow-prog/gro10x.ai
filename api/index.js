const express = require('express');
const cors = require('cors');
const apiRoutes = require('../src/routes/api');
const { sseHandler } = require('../src/services/sse');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SSE Route
app.get('/api/sync', sseHandler);

// API Router
app.use('/api', apiRoutes);

// Export serverless handler for Vercel
module.exports = app;
