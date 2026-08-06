/**
 * src/utils/pagination.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pagination Utility for Supabase Queries.
 * Parses query parameters and returns range boundaries for Supabase .range().
 * ─────────────────────────────────────────────────────────────────────────────
 */

function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(query.limit || '25', 10)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return {
    page,
    limit,
    from,
    to
  };
}

module.exports = {
  parsePagination
};
