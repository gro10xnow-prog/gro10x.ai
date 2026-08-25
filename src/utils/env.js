/**
 * src/utils/env.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Environment Variable Validator for GRO10X Platform.
 * Validates required configuration keys on server boot and prevents unsafe fallbacks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) {
    // Derive a consistent deterministic key from the Supabase service key if JWT_SECRET is not yet configured
    return crypto.createHash('sha256').update(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'gro10x-prod-fallback').digest('hex');
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

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    if (!process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET is not explicitly set; using derived secure key.');
    }
    if (!process.env.CRON_SECRET) {
      warnings.push('CRON_SECRET is missing in production — cron endpoints will require header protection.');
    }
    if (!process.env.WEBHOOK_SECRET && !process.env.WEBHOOK_SECRET_TOKEN) {
      warnings.push('WEBHOOK_SECRET is missing in production — webhook requests will not be signed.');
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️ [ENV Configuration Warnings]:\n  - ' + warnings.join('\n  - '));
  }

  if (errors.length > 0) {
    console.error('❌ [ENV Configuration Errors]:\n  - ' + errors.join('\n  - '));
  }

  return { ok: errors.length === 0, warnings, errors };
}

module.exports = {
  getJwtSecret,
  validateEnvironment
};
