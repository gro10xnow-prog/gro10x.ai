/**
 * src/utils/phone.js
 * ─────────────────────────────────────────────────────────────
 * PurpleOS Canonical Phone Number Utilities
 * Single source of truth for phone normalisation across the platform.
 * ─────────────────────────────────────────────────────────────
 */

/**
 * normalizePhone — strips all non-digit characters and returns the last
 * 10 digits. This matches Bangladesh mobile numbers whether given as:
 *   +8801708459008  →  1708459008
 *    8801708459008  →  1708459008
 *      01708459008  →  1708459008
 *       1708459008  →  1708459008
 *
 * @param {string|number} p  Raw phone number (any format)
 * @returns {string}          10-digit normalised string, or raw digits if < 10
 */
function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

module.exports = { normalizePhone };
