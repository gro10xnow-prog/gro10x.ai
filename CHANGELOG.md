# PurpleOS Changelog

## [0.8.9.9] - 2026-08-06
### Added
- **Unified Design System**: Single source of truth in `tokens.css` v3.0 with backward-compatibility aliases for legacy design tokens.
- **Master RLS Security**: Strict PostgreSQL Row-Level Security policies across all 18 production tables (`20260806_v0.8.4_rls_security_hardening.sql`).
- **Master Database Architecture Migration**: Created `20260806_v0.8.0_database_fixes.sql` adding missing columns (`pocs`, `budget`, `paid_at`), PostgREST foreign key relationships (`task_labels` → `labels`), cascade delete rules, and high-cardinality B-Tree indexes.
- **Unified API Response Formatter**: Standardized all Express responses to `{ success, data, pagination }` or `{ success: false, error }` via `src/utils/response.js`.
- **Global Error Handling Middleware**: `src/middleware/errorHandler.js` mounted on Express app for uncaught async rejections.
- **In-Memory Server-Side Response Cache**: TTL caching manager in `src/utils/cache.js` for analytics overview and time-series endpoints.
- **Frontend Utility Suite**: Added `public/js/components.js` (toasts, modals, state generators) and `public/js/formatters.js` (dates, currencies, relative time).
- **Master Integration Test Suite**: Created `tests/api-integration.test.js` covering core endpoints and security checks.

### Changed
- **Performance Optimization**: Removed artificial 2.5s lambda sleep delay in Telegram webhook handler (`api/index.js`).
- **Responsive Layout**: Unified responsive media query breakpoints to 768px, eliminating the 769px–900px navigation orphan zone.
- **Security Hardening**: Replaced JWT dev secret fallbacks with dynamic getter validation (`src/utils/env.js`). Added HTTP security headers (`nosniff`, `strict-origin-when-cross-origin`). Added rate limiting to PIN generation.

### Fixed
- **Migration Type Conflict**: Resolved PostgreSQL type mismatch (`UUID` vs `VARCHAR(20)`) in `task_comments` and `time_logs`.
- **Table Name Mismatch**: Aligned social planner migration to `public.social_posts`.
- **Z-Index Escalation War**: Implemented canonical Z-index layering scale (`--z-mobile-nav: 800`, `--z-modal-overlay: 2000`, `--z-toast-notification: 3000`).

## [0.8.0-rc] - 2026-08-05
### Added
- **Analytics & Observability**: Real-time performance scorecards, Sentry integration, and custom CSV data exports.
- **SSE Web Chat**: Real-time server-sent events web chat widget integrated with the Purplebot engine.
- **Loading States**: Shimmer skeleton animations on the public landing page to prevent content flash.
- **Service Detail 404**: Clean fallback page when a non-existent service ID is requested.
- **Security Middleware**: Global input validation for POST/PUT requests to sanitize inputs and prevent payload abuse.
- **SEO Optimization**: Comprehensive Open Graph and Twitter Card tags added to all public pages.
- **Caching**: `vercel.json` configured with aggressive cache-control for static assets and immediate revalidation for HTML.

### Changed
- **Bot Architecture**: `src/services/bot.js` refactored into a thin router with handlers moved to `src/services/bot/handlers/`.
- **Frontend Assets**: Replaced legacy monolithic `app.js` with modular ES modules.
- **Service Worker**: Updated caching strategy to support modular JS files.

### Fixed
- **Testing**: Added test coverage for Task API filters, bulk operations, and Automation engine triggers.
