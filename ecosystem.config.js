/**
 * ecosystem.config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PM2 Enterprise Process Manager Configuration for GRO10X OS Platform.
 * Supports auto-restart, cluster mode, memory thresholds, and log management.
 * ─────────────────────────────────────────────────────────────────────────────
 */

module.exports = {
  apps: [
    {
      name: 'gro10x-os',
      script: 'server.js',
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: 'fork', // Set to 'cluster' when scaling across multiple CPU cores
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      autorestart: true,
      restart_delay: 2000,
      exp_backoff_restart_delay: 100,
      kill_timeout: 10000,
      listen_timeout: 8000
    }
  ]
};
