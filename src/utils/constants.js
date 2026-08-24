/**
 * src/utils/constants.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Application URLs and Environment Constants.
 * Prevents hardcoding domain URLs throughout Bot handlers and services.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = process.env.APP_BASE_URL || 'https://gro10x-ai.vercel.app';

const PORTAL_URLS = {
  BASE: BASE_URL,
  APP: `${BASE_URL}/app`,
  ADMIN: `${BASE_URL}/admin`,
  MANAGER: `${BASE_URL}/manager`,
  CREW: `${BASE_URL}/crew`,
  MINIAPP: `${BASE_URL}/team-miniapp`,
  CLIENT_MINIAPP: `${BASE_URL}/client-miniapp`,
  REVIEW_ROOM: `${BASE_URL}/reviewroom`,
  PARTNERS: `${BASE_URL}/partners`,
  AUTH: `${BASE_URL}/auth`
};

module.exports = {
  BASE_URL,
  PORTAL_URLS
};
