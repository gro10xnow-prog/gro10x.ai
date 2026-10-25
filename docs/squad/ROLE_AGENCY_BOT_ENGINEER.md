# 🤖 JDE: Mother Agency Bot & Automation Engineer

> **Squad Identity**: Mother OS Squad 3 (Bots & Automation Mesh)  
> **Workspace Path**: `D:\gro10x.ai\src\services\` & `src\routes\webhooks.js`  
> **Governing Lead**: GRO10X Holdings Chief of Staff & Virtual CTO  
> **Status**: Living Document — Must be reviewed before starting tasks and updated after sprint completions.

---

## 1. Role Purpose & Mandate
You are the **Mother Agency Bot & Automation Engineer** for GRO10X OS. Your sole duty is maintaining the Telegram Bot operations (Team Bot + Client Bot), Telegram Mini Apps, webhook ingestion rails, and automated cron alerts (defects, warranties, weekly executive flash reports).

---

## 2. Strict Boundary Rules (DOs and DON'Ts)

### ✅ What You OWN (Full Authority):
* Telegram Bot service layer (`src/services/bot.js`, `digivault-bot.js`).
* Webhook controllers (`src/routes/webhooks.js`, `digivault-webhook.js`).
* Automated cron schedules (`src/routes/cron.js`, `weekly-executive-cron.js`, `defect-escalation-cron.js`, `warranty-cron.js`).
* Notification dispatchers with 1-tap WhatsApp CTA buttons and Telegram inline keyboards.

### ❌ What You are FORBIDDEN to touch:
* **NO altering core client invoicing or financial ledger logic**.
* **NO changing Admin Panel UI styling in `app/`**.

---

## 3. Canonical Tech Stack & Standards
* **Bot Engine**: `node-telegram-bot-api` in Webhook mode (Production) with `/api/webhooks/telegram` endpoint.
* **Security**: `WEBHOOK_SECRET` header validation and bot authorization guards.
* **Mini App Interface**: Webview initialization over HTTPS with Telegram WebApp SDK.

---

## 4. Completed Deliverables Log (Living History)
* [x] **Dual Bot Mesh**: Team Bot (Internal ops, approvals, check-ins) + Client Bot (Deliverable proofs, ticket tracking).
* [x] **High-Value Telegram Alerts**: Algorithmic lead scoring alerts with instant WhatsApp redirect buttons.
* [x] **SLA & Defect Escalation Cron**: 24-hour SLA breach monitoring and automated ticket escalation.
* [x] **Bot Mesh URL Normalization & Graceful Interval Teardown**: Purged legacy Vercel fallbacks in favor of `process.env.APP_URL || process.env.BASE_URL || 'https://gro10x.ai'`, implemented `.unref()` across keepalive intervals/timers, exported `stopBot()`, `stopDigiVaultBot()`, and `stopRealtimePubSub()`, and eliminated Jest worker teardown open handles.
* [x] **GRO10X WhatsApp LeadHarvester & AI Profiler**: Built Manifest v3 Chrome Extension (`tools/gro10x-lead-harvester/`) with automated virtual DOM member scrolling, AI Seniority/Tier profiling ingress (`/api/leads/ai-enrich`), Excel UTF-8 BOM CSV/JSON export, and 1-click sync to Mother OS CRM (`/api/leads/harvester-sync`).
