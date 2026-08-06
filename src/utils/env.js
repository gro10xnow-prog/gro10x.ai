/**
 * src/utils/env.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Environment Variable Validator for PurpleOS Platform.
 * Validates required configuration keys on server boot and prevents unsafe fallbacks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    console.error('\n❌ FATAL: JWT_SECRET environment variable is missing in production environment.\n');
    throw new Error('JWT_SECRET missing in production');
  }

  // Generate a random session key in dev mode if missing, rather than a hardcoded fixed string
  if (!global._devJwtSecret) {
    global._devJwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️ [ENV] JWT_SECRET not set — generated ephemeral dev secret for this server instance.');
  }
  return global._devJwtSecret;
}

function validateEnvironment() {
  const warnings = [];
  const errors = [];

  if (!process.env.SUPABASE_URL) {
    warnings.push('SUPABASE_URL is not set.');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY) {
    warnings.push('Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set.');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production.');
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️ [ENV Configuration Warnings]:\n  - ' + warnings.join('\n  - '));
  }

  if (errors.length > 0) {
    console.error('❌ [ENV Configuration Errors]:\n  - ' + errors.join('\n  - '));
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid Production Environment Configuration');
    }
  }

  return { ok: errors.length === 0, warnings, errors };
}

module.exports = {
  getJwtSecret,
  validateEnvironment
};
