/**
 * src/utils/logger.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Structured Logger for GRO10X Multi-Engine Platform.
 * Supports leveled logging (debug, info, warn, error) with structured JSON
 * formatting in production for Datadog / Loki / CloudWatch ingestion, and
 * human-readable formatted output in development.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')).toLowerCase();
const currentLevelWeight = LOG_LEVELS[currentLevel] !== undefined ? LOG_LEVELS[currentLevel] : LOG_LEVELS.info;

function formatLog(level, message, meta = {}, context = {}) {
  const timestamp = new Date().toISOString();
  const isProd = process.env.NODE_ENV === 'production';

  const entry = {
    timestamp,
    level: level.toUpperCase(),
    message: typeof message === 'string' ? message : JSON.stringify(message),
    ...context,
    ...meta
  };

  if (isProd) {
    return JSON.stringify(entry);
  }

  // Development formatting with icons and colors
  const prefixMap = {
    debug: '\x1b[36m🔍 [DEBUG]\x1b[0m',
    info: '\x1b[32mℹ️  [INFO]\x1b[0m',
    warn: '\x1b[33m⚠️  [WARN]\x1b[0m',
    error: '\x1b[31m❌ [ERROR]\x1b[0m'
  };

  const prefix = prefixMap[level] || `[${level.toUpperCase()}]`;
  const metaStr = Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
  const contextStr = context.requestId ? ` \x1b[90m(${context.requestId})\x1b[0m` : '';

  return `${prefix} ${timestamp}${contextStr}: ${entry.message}${metaStr}`;
}

class Logger {
  constructor(context = {}) {
    this.context = context;
  }

  child(extraContext = {}) {
    return new Logger({ ...this.context, ...extraContext });
  }

  debug(message, meta = {}) {
    if (LOG_LEVELS.debug >= currentLevelWeight) {
      console.debug(formatLog('debug', message, meta, this.context));
    }
  }

  info(message, meta = {}) {
    if (LOG_LEVELS.info >= currentLevelWeight) {
      console.info(formatLog('info', message, meta, this.context));
    }
  }

  warn(message, meta = {}) {
    if (LOG_LEVELS.warn >= currentLevelWeight) {
      console.warn(formatLog('warn', message, meta, this.context));
    }
  }

  error(message, errorOrMeta = {}) {
    if (LOG_LEVELS.error >= currentLevelWeight) {
      const meta = (errorOrMeta instanceof Error)
        ? { error: errorOrMeta.message, stack: errorOrMeta.stack }
        : errorOrMeta;
      console.error(formatLog('error', message, meta, this.context));
    }
  }
}

const defaultLogger = new Logger();

module.exports = defaultLogger;
module.exports.Logger = Logger;
