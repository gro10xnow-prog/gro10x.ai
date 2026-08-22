/**
 * src/utils/xp.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical XP Badge Tiers and Calculation Helpers.
 * Single source of truth across Backend routes, Bot handlers, and State service.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const XP_TIERS = [
  { min: 6000, badge: '👑 Maestro', level: 6 },
  { min: 3500, badge: '🎖️ Veteran', level: 5 },
  { min: 2000, badge: '💜 Champion', level: 4 },
  { min: 1000, badge: '🔥 Performer', level: 3 },
  { min: 500,  badge: '⭐ Rising Star', level: 2 },
  { min: 0,    badge: '🌱 Recruit', level: 1 }
];

/**
 * Returns the badge title string corresponding to an XP value.
 * @param {number} xp
 * @returns {string} e.g. '👑 Maestro', '🎖️ Veteran', etc.
 */
function getBadge(xp) {
  const score = Number(xp) || 0;
  for (const tier of XP_TIERS) {
    if (score >= tier.min) return tier.badge;
  }
  return '🌱 Recruit';
}

/**
 * Alias for getBadge for backwards compatibility with state.js calcBadge.
 */
const calcBadge = getBadge;

module.exports = {
  XP_TIERS,
  getBadge,
  calcBadge
};
