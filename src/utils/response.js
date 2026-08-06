/**
 * src/utils/response.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified API Response Formatter for PurpleOS Backend REST Services.
 * Standardizes all success, error, and paginated HTTP responses.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Send a successful API response
 */
function ok(res, data = {}, statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...meta
  });
}

/**
 * Send a standardized API error response
 */
function fail(res, statusCode = 500, message = 'Internal Server Error', code = 'SERVER_ERROR', details = null) {
  const payload = {
    success: false,
    error: {
      message,
      code
    }
  };
  if (details) payload.error.details = details;
  return res.status(statusCode).json(payload);
}

/**
 * Send a paginated API response
 */
function paginated(res, data = [], pagination = { page: 1, limit: 25, total: 0 }, statusCode = 200) {
  const totalPages = Math.ceil((pagination.total || 0) / (pagination.limit || 25)) || 1;
  return ok(res, data, statusCode, {
    pagination: {
      page: Number(pagination.page) || 1,
      limit: Number(pagination.limit) || 25,
      total: Number(pagination.total) || 0,
      totalPages
    }
  });
}

/**
 * Async Handler Wrapper to eliminate repetitive try/catch boilerplate
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ok,
  fail,
  paginated,
  asyncHandler
};
