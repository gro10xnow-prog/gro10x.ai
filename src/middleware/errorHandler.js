/**
 * src/middleware/errorHandler.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Global Express Error Handler Middleware for PurpleOS.
 * Captures all uncaught route rejections and returns standardized error payloads.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { fail } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.originalUrl} Error:`, err.stack || err.message || err);

  // If response headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;
  const message = (isProd && statusCode >= 500)
    ? 'An unexpected internal server error occurred.'
    : (err.message || 'An unexpected internal server error occurred.');
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  return fail(res, statusCode, message, code);
}

module.exports = errorHandler;
