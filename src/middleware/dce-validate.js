/**
 * src/middleware/dce-validate.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine — Input Validation & Rate Limiting Middleware
 * 
 * Capabilities:
 * 1. validateSchema: Declarative body validation (types, enums, regex, ranges)
 * 2. whitelist: Strips unexpected fields to prevent mass assignment
 * 3. isValidUUID: RFC-4122 compliant UUID checker
 * 4. Rate Limiters: Throttling for public customer and webhook endpoints
 * ─────────────────────────────────────────────────────────────────────────────
 */

const rateLimit = require('express-rate-limit');
const { fail } = require('../utils/response');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a string matches RFC-4122 UUID structure
 * @param {string} id 
 * @returns {boolean}
 */
function isValidUUID(id) {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Middleware factory for declarative schema validation
 * @param {Object} schema 
 * Example:
 * {
 *   product_type: { type: 'string', enum: ['DIGITAL', 'PHYSICAL', 'BUNDLE'], required: false },
 *   email: { type: 'string', pattern: EMAIL_REGEX, required: true },
 *   quantity: { type: 'number', min: 1, required: true }
 * }
 */
function validateSchema(schema) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return fail(res, 'Request body must be a valid JSON object', 400, 'VALIDATION_ERROR');
    }

    for (const [field, rules] of Object.entries(schema)) {
      const val = req.body[field];

      // Check required
      if (rules.required && (val === undefined || val === null || val === '')) {
        return fail(res, `Field '${field}' is required`, 400, 'VALIDATION_ERROR', { field });
      }

      if (val !== undefined && val !== null && val !== '') {
        // Check type
        if (rules.type) {
          if (rules.type === 'number') {
            const num = Number(val);
            if (isNaN(num)) {
              return fail(res, `Field '${field}' must be a valid number`, 400, 'VALIDATION_ERROR', { field });
            }
          } else if (rules.type === 'array') {
            if (!Array.isArray(val)) {
              return fail(res, `Field '${field}' must be an array`, 400, 'VALIDATION_ERROR', { field });
            }
          } else if (typeof val !== rules.type) {
            return fail(res, `Field '${field}' must be of type ${rules.type}`, 400, 'VALIDATION_ERROR', { field });
          }
        }

        // Check enum
        if (rules.enum && Array.isArray(rules.enum)) {
          const strVal = String(val).toUpperCase();
          const match = rules.enum.some(e => String(e).toUpperCase() === strVal);
          if (!match) {
            return fail(
              res,
              `Field '${field}' must be one of: ${rules.enum.join(', ')}`,
              400,
              'VALIDATION_ERROR',
              { field, allowedValues: rules.enum }
            );
          }
        }

        // Check min / max for numbers
        if (rules.type === 'number') {
          const num = Number(val);
          if (rules.min !== undefined && num < rules.min) {
            return fail(res, `Field '${field}' must be at least ${rules.min}`, 400, 'VALIDATION_ERROR', { field });
          }
          if (rules.max !== undefined && num > rules.max) {
            return fail(res, `Field '${field}' must be at most ${rules.max}`, 400, 'VALIDATION_ERROR', { field });
          }
        }

        // Check min / max for strings
        if (typeof val === 'string') {
          if (rules.minLength !== undefined && val.trim().length < rules.minLength) {
            return fail(res, `Field '${field}' must have at least ${rules.minLength} characters`, 400, 'VALIDATION_ERROR', { field });
          }
          if (rules.maxLength !== undefined && val.trim().length > rules.maxLength) {
            return fail(res, `Field '${field}' must have at most ${rules.maxLength} characters`, 400, 'VALIDATION_ERROR', { field });
          }
        }

        // Check regex pattern
        if (rules.pattern && rules.pattern instanceof RegExp) {
          if (!rules.pattern.test(String(val).trim())) {
            return fail(res, `Field '${field}' is not in a valid format`, 400, 'VALIDATION_ERROR', { field });
          }
        }
      }
    }

    next();
  };
}

/**
 * Middleware to sanitize req.body against mass assignment by stripping unwhitelisted properties
 * @param {string[]} allowedFields 
 */
function whitelist(allowedFields) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const sanitized = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          sanitized[field] = req.body[field];
        }
      }
      req.body = sanitized;
    }
    next();
  };
}

/**
 * Rate Limiter Factory
 */
function createRateLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return fail(res, message || 'Too many requests, please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    },
    skip: (req) => {
      // In test mode, allow tests to opt out unless explicitly testing rate limits
      if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
        return true;
      }
      return false;
    }
  });
}

// 1. Order Tracking Rate Limiter: 20 req per 15 min per IP
const trackLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many order tracking attempts. Please wait 15 minutes.'
});

// 2. Coupon Validation Rate Limiter: 30 req per 15 min per IP
const promoLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many coupon evaluation attempts. Please wait a few minutes.'
});

// 3. Affiliate Portal Login Rate Limiter: 10 req per 15 min per IP
const affiliateLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many affiliate login attempts. Please wait 15 minutes.'
});

// 4. Webhook Inbound Rate Limiter: 120 req per minute per IP
const webhookLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Webhook rate limit exceeded.'
});

module.exports = {
  EMAIL_REGEX,
  UUID_REGEX,
  isValidUUID,
  validateSchema,
  whitelist,
  createRateLimiter,
  trackLimiter,
  promoLimiter,
  affiliateLoginLimiter,
  webhookLimiter
};
