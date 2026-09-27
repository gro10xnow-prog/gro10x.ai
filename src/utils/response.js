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
function fail(res, arg2 = 500, arg3 = 'Internal Server Error', code = 'SERVER_ERROR', details = null) {
  const statusCode = typeof arg2 === 'number' ? arg2 : (typeof arg3 === 'number' ? arg3 : 500);
  const message = typeof arg2 === 'string' ? arg2 : (typeof arg3 === 'string' ? arg3 : 'Internal Server Error');
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
 * Normalizes pagination parameters from request query
 * Supports both limit/offset and limit/page paradigms
 */
function getPaginationParams(req, defaultLimit = 25, maxLimit = 100) {
  const query = (req && req.query) || {};
  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  let offset = parseInt(query.offset, 10);
  let page = parseInt(query.page, 10);

  if (isNaN(offset)) {
    if (!isNaN(page) && page >= 1) {
      offset = (page - 1) * limit;
    } else {
      offset = 0;
      page = 1;
    }
  } else {
    offset = Math.max(0, offset);
    page = Math.floor(offset / limit) + 1;
  }

  return { limit, offset, page };
}

/**
 * Send a standardized paginated API response
 */
function paginated(res, data = [], pagination = { limit: 25, offset: 0, total: 0, page: 1 }, statusCode = 200) {
  const limit = Math.max(1, Number(pagination.limit) || 25);
  const offset = Math.max(0, Number(pagination.offset !== undefined ? pagination.offset : ((Number(pagination.page) || 1) - 1) * limit));
  const total = Math.max(0, Number(pagination.total) || 0);
  const page = Number(pagination.page) || Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;
  const hasMore = (offset + (Array.isArray(data) ? data.length : 0)) < total;

  return ok(res, data, statusCode, {
    pagination: {
      limit,
      offset,
      page,
      total,
      totalPages,
      hasMore
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
  getPaginationParams,
  asyncHandler
};
