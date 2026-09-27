/**
 * src/utils/shutdown.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Graceful Shutdown Manager for GRO10X Platform.
 * Intercepts SIGTERM and SIGINT to close active connections, SSE streams,
 * bot polling, and background tasks before process termination.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const logger = require('./logger');

let isShuttingDown = false;

function setupGracefulShutdown(server, options = {}) {
  const timeoutMs = options.timeoutMs || 10000;

  const handleShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`🛑 Received ${signal}. Starting graceful shutdown sequence...`);

    // 10-second timeout safeguard to force exit if tasks hang
    const forceExitTimer = setTimeout(() => {
      logger.error('⏰ Shutdown timeout reached! Forcing process termination.');
      process.exit(1);
    }, timeoutMs);
    forceExitTimer.unref();

    try {
      // 1. Close HTTP Server to stop accepting new requests
      if (server && typeof server.close === 'function') {
        await new Promise((resolve) => {
          server.close((err) => {
            if (err) {
              logger.warn('Error closing HTTP server:', { error: err.message });
            } else {
              logger.info('✅ HTTP server closed. No longer accepting connections.');
            }
            resolve();
          });
        });
      }

      // 2. Teardown active SSE client connections
      try {
        const { broadcast } = require('../services/sse');
        if (typeof broadcast === 'function') {
          broadcast('system_shutdown', { message: 'Server is restarting for deployment', timestamp: new Date().toISOString() });
        }
      } catch (_) {}

      // 3. Stop Telegram Bot Polling if active
      try {
        const { getTeamBot, getClientBot } = require('../services/bot');
        const teamBot = getTeamBot();
        const clientBot = getClientBot();
        if (teamBot && typeof teamBot.stopPolling === 'function' && teamBot.isPolling()) {
          await teamBot.stopPolling();
          logger.info('✅ Telegram Team Bot polling stopped.');
        }
        if (clientBot && typeof clientBot.stopPolling === 'function' && clientBot.isPolling()) {
          await clientBot.stopPolling();
          logger.info('✅ Telegram Client Bot polling stopped.');
        }
      } catch (_) {}

      // 4. Stop DigiVault Commerce Bot Polling if active
      try {
        const { getDigiVaultBot } = require('../services/digivault-bot');
        const digiBot = typeof getDigiVaultBot === 'function' ? getDigiVaultBot() : null;
        if (digiBot && typeof digiBot.stopPolling === 'function' && digiBot.isPolling()) {
          await digiBot.stopPolling();
          logger.info('✅ DigiVault Bot polling stopped.');
        }
      } catch (_) {}

      logger.info('🚀 Graceful shutdown complete. Exiting cleanly.');
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

module.exports = {
  setupGracefulShutdown,
  isShuttingDown: () => isShuttingDown
};
