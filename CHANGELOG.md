# PurpleOS Changelog

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
