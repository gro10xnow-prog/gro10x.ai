# PurpleOS — System Architecture, Runbooks & API Reference

> **Version**: `0.9.0.0` (Pre-Release Candidate)
> **Go-Live Date**: September 1, 2026
> **Primary Stakeholder / Tech Admin**: Md. Zahin Khandaker (`PBD-004`)
> **Production URL**: https://purpleos-iota.vercel.app

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Database Schema Overview](#4-database-schema-overview)
5. [API Routes Reference](#5-api-routes-reference)
6. [Cron Job Schedule](#6-cron-job-schedule)
7. [Runbook — Deployment](#7-runbook--deployment)
8. [Runbook — Incident Response](#8-runbook--incident-response)
9. [Runbook — Onboarding a New Staff Member](#9-runbook--onboarding-a-new-staff-member)
10. [Runbook — Onboarding a New Client](#10-runbook--onboarding-a-new-client)
11. [Runbook — Database Maintenance](#11-runbook--database-maintenance)
12. [Admin Panel User Guide](#12-admin-panel-user-guide)
13. [Testing Reference](#13-testing-reference)

---

## 1. System Architecture Overview

```
+---------------------------------------------------------------+
|                       CLIENT BROWSERS                         |
|  Admin Panel      Crew Mini App         Client Portal         |
|  /app/index.html  (Telegram Mini App)   /client-portal/       |
+---------------------------+-----------------------------------+
                            | HTTPS
                            v
+---------------------------------------------------------------+
|                     VERCEL EDGE NETWORK                       |
|  Static assets: CDN (max-age 1yr immutable)                   |
|  HTML: max-age=0 must-revalidate                              |
|  Serverless Functions: Node.js 20.x                           |
+---------------------------+-----------------------------------+
                            |
                            v
+---------------------------------------------------------------+
|                  EXPRESS.JS APP SERVER (server.js)            |
|                                                               |
|  Middleware Stack (in order):                                 |
|  1. Security Headers (nosniff, XSS, CSP, Referrer-Policy)    |
|  2. GZIP/Brotli Compression                                   |
|  3. CORS Whitelist                                            |
|  4. JSON + URL-encoded Body Parser                            |
|  5. Subdomain Router (manager.purplebot.digital)              |
|  6. JWT Auth Guard (HMAC-SHA256 custom token)                 |
|  7. API Route Handler (src/routes/api.js)                     |
|  8. Static File Serving (/public)                             |
|  9. Global Error Handler                                      |
+--------+---------------------------+---------------------------+
         |                           |
         v                           v
+------------------+    +-----------------------------------+
|  SUPABASE        |    |       TELEGRAM BOT ENGINE         |
|  (PostgreSQL 15) |    |  Team Bot + Client Bot            |
|                  |    |  Mode: Webhook (production)       |
|  18 Tables       |    |  /api/webhooks/telegram?bot=team  |
|  RLS Enabled     |    |  /api/webhooks/telegram?bot=client|
|  Service Key API |    +-----------------------------------+
+------------------+
         |
         v
+---------------------------------------------------------------+
|           IN-MEMORY TTL CACHE (src/utils/cache.js)            |
|  Analytics overview: 5-min TTL                                |
|  System health: 30-sec TTL                                    |
|  Staff profiles: 2-min TTL                                    |
+---------------------------------------------------------------+
         |
         v
+---------------------------------------------------------------+
|            SSE ENGINE (src/services/sse.js)                   |
|  Real-time badge sync (sidebar counters)                      |
|  GET /api/sync -- browsers subscribe here                     |
|  broadcast(event, data) -- pushed from route handlers         |
+---------------------------------------------------------------+
```

### Data Flow: Admin Panel SPA

```
Browser --> GET /app/index.html
        --> Loads /app/api.js (fetch wrapper, auth headers)
        --> Loads /app/app.js (SPA router, auth validation)
        --> validateServerSession() --> GET /api/auth/me
        --> If 401 --> redirect /auth
        --> If 200 --> initRouter() --> lazy-load module JS
        --> Module --> GET /api/[resource] --> Express --> Supabase
```

---

## 2. Tech Stack & Dependencies

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20.x |
| Framework | Express.js | 4.x |
| Database | Supabase (PostgreSQL 15) | Latest |
| Deployment | Vercel (Serverless) | v2 |
| Bot Engine | node-telegram-bot-api | Latest |
| Authentication | Custom HMAC-SHA256 JWT | -- |
| Compression | compression | Latest |
| Frontend SPA | Vanilla JS (ESM modules) | -- |
| CSS | Custom Design System (tokens.css v3.0) | -- |
| Testing (Unit) | Jest + Supertest | Latest |
| Testing (E2E Browser) | Puppeteer | 22.x |
| Error Tracking | Sentry (optional) | Latest |

---

## 3. Environment Variables Reference

Copy `.env.example` to `.env` and fill in all values before running locally.

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | YES | Your Supabase project URL (https://xxxx.supabase.co) |
| `SUPABASE_SERVICE_KEY` | YES | Service-role key (bypasses RLS). Keep secret. |
| `JWT_SECRET` | YES | Secret for signing HMAC-SHA256 JWTs |
| `TELEGRAM_BOT_TOKEN_TEAM` | YES | Team management bot token |
| `TELEGRAM_BOT_TOKEN_CLIENT` | YES | Client-facing bot token |
| `BASE_URL` | YES | Production base URL (https://purpleos-iota.vercel.app) |
| `GEMINI_API_KEY` | YES | Google Gemini API key for AI features |
| `SENTRY_DSN` | Optional | Sentry DSN for error tracking |
| `NODE_ENV` | Optional | production or development |
| `PORT` | Optional | Local dev port (default: 3000) |

WARNING: Never commit .env to Git. SUPABASE_SERVICE_KEY and JWT_SECRET must be
rotated immediately if compromised.

---

## 4. Database Schema Overview

All tables live in the public schema on Supabase (PostgreSQL 15). Row-Level Security
(RLS) is enabled on all 18 tables. The API server uses the Service Role Key to bypass RLS.

| Table | Purpose |
|---|---|
| `profiles` | Staff roster (33 members), linked to Telegram User IDs |
| `clients` | Client CRM: company info, POCs, retainer status |
| `tasks` | Kanban tasks: linked to projects, assignees, workflow stages |
| `projects` | Client and internal agency projects |
| `spaces` | Kanban workspace spaces (Internal, Client Retainer, etc.) |
| `invoices` | Client invoices with payment status tracking |
| `expenses` | Staff expense claims with 2-tier approval flow |
| `payments` | Payment verification records |
| `quotes` | Price quotes with convert-to-invoice capability |
| `leaves` | Staff leave requests with approve/reject workflow |
| `leads` | Sales leads pipeline with stage tracking |
| `tickets` | Internal/client support desk tickets |
| `social_posts` | Social media content calendar entries |
| `cms_services` | Agency service catalog items |
| `assets` | Hardware/equipment asset registry |
| `reviews` | Client review packages for proofing |
| `automation_logs` | Bot and cron job event audit trail |
| `labels` | Custom task labels |

Key Relationships:
  tasks --> projects --> clients
  tasks --> profiles (assignee)
  expenses --> profiles (submitter)
  invoices --> clients
  leaves --> profiles

---

## 5. API Routes Reference

All routes prefixed with /api/. Mutating endpoints (POST, PATCH, DELETE) require:
  Authorization: Bearer <jwt>

### Auth
| Method | Path | Description |
|---|---|---|
| GET | /api/auth/me | Validate session, return user profile |
| POST | /api/auth/pin-login | Staff PIN login, returns JWT |
| POST | /api/auth/telegram | Telegram hash-based auth |

### Team / Staff
| Method | Path | Description |
|---|---|---|
| GET | /api/team | List all staff profiles |
| GET | /api/team/:empCode | Get staff member profile |
| PUT | /api/team/:empCode | Update staff profile |
| POST | /api/team/:empCode/reset-pin | Generate new 6-digit PIN |

### Tasks / Kanban
| Method | Path | Description |
|---|---|---|
| GET | /api/tasks | List tasks (?space=, ?stage=, ?priority=) |
| POST | /api/tasks | Create a new task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete a task |
| POST | /api/tasks/bulk | Bulk import tasks from CSV payload |
| POST | /api/tasks/:id/log-time | Log hours against a task |

### Clients / CRM
| Method | Path | Description |
|---|---|---|
| GET | /api/clients | List all clients |
| POST | /api/clients | Create new client (with POC wizard) |
| PUT | /api/clients/:id | Update client |
| DELETE | /api/clients/:id | Delete client |

### Finance
| Method | Path | Description |
|---|---|---|
| GET | /api/invoices | List all invoices |
| POST | /api/invoices | Create invoice |
| PATCH | /api/invoices/:id | Update payment status |
| GET | /api/expenses | List expense claims |
| POST | /api/expenses | Submit expense claim |
| PATCH | /api/expenses/:id | Approve or reject expense (Tier-2) |
| GET | /api/payments | List payment verifications |
| POST | /api/payments/:id/verify | Approve a payment |
| POST | /api/payments/:id/reject | Reject a payment |
| GET | /api/quotes | List price quotes |
| POST | /api/quotes | Create price quote |
| POST | /api/quotes/:id/convert | Convert quote to invoice |

### HR & Leaves
| Method | Path | Description |
|---|---|---|
| GET | /api/leaves | List leave requests |
| POST | /api/leaves | Submit a leave request |
| POST | /api/leaves/:id/approve | Approve leave request |
| POST | /api/leaves/:id/reject | Reject leave request |

### Leads
| Method | Path | Description |
|---|---|---|
| GET | /api/leads | List all leads |
| POST | /api/leads | Create lead |
| PATCH | /api/leads/:id | Update lead stage/status |

### Support Tickets
| Method | Path | Description |
|---|---|---|
| GET | /api/tickets | List tickets |
| POST | /api/tickets | Create ticket |
| PATCH | /api/tickets/:id | Update ticket (status, priority, reply) |

### System
| Method | Path | Description |
|---|---|---|
| GET | /api/system-health | Live telemetry: DB latency, SSE clients, bot status |
| GET | /api/sync | SSE stream for real-time badge sync |
| GET | /api/bot-status | Bot engine health check |

---

## 6. Cron Job Schedule

All cron jobs are registered in vercel.json. Times below are UTC (BST = UTC+6):

| Job | UTC Schedule | BST Time | Purpose |
|---|---|---|---|
| morning-briefing | 15 3 * * Sun-Fri | 9:15 AM | Daily task briefing via Telegram to all staff |
| daily-briefing | 0 3 * * Sun-Fri | 9:00 AM | Morning brief format |
| late-clockin-alert | 0 4 * * Sun-Fri | 10:00 AM | Alert staff who have not checked in by 10 AM |
| eod-reminder | 30 12 * * Sun-Fri | 6:30 PM | End-of-day timesheet reminder |
| eod-summary | 0 14 * * Sun-Fri | 8:00 PM | EOD summary pushed to Tech Admin |
| lead-followups | 30 3 * * Sun-Fri | 9:30 AM | Flags leads needing follow-up |
| task-overdue | 0 5 * * * | 11:00 AM | Marks overdue tasks, notifies assignees |
| approval-expiry | 30 5 * * * | 11:30 AM | Escalates stale approval requests |
| invoice-due-reminder | 0 3 * * * | 9:00 AM | Payment due reminders to clients |
| payment-reminders | 0 4 * * * | 10:00 AM | Overdue invoice reminders |
| payroll-reminder | 0 3 25 * * | 9:00 AM 25th | Payroll preparation reminder (25th each month) |
| weekly-digest | 0 3 * * Mon | 9:00 AM Mon | Weekly performance digest to management |

---

## 7. Runbook -- Deployment

PurpleOS uses Vercel for zero-downtime continuous deployment. Every push to main
deploys automatically.

```bash
# 1. Run all tests first -- must pass 100%
npm test

# 2. Run browser E2E tests (recommended before release)
npm run test:e2e

# 3. Push to main -- Vercel auto-deploys
git add -A
git commit -m "your commit message"
git push origin main
```

Post-Deployment Verification (within 5 minutes):
  [ ] GET https://purpleos-iota.vercel.app/api/system-health --> status: "healthy"
  [ ] GET https://purpleos-iota.vercel.app/api/bot-status --> both bots "active"
  [ ] Admin panel loads at https://purpleos-iota.vercel.app/app/index.html
  [ ] Telegram Team Bot responds to /status command

To update environment variables:
  1. Vercel Dashboard --> Project Settings --> Environment Variables
  2. Update the value
  3. Redeploy (Vercel requires a redeploy to pick up env changes)

---

## 8. Runbook -- Incident Response

### Admin Panel shows blank / 401 Unauthorized
Cause: JWT secret mismatch or expired token
Fix:
  1. Open DevTools Console --> localStorage.clear() --> refresh
  2. Re-login via /auth
  3. If still failing: verify JWT_SECRET in Vercel env vars

### System Health shows DB as "Offline" or "Degraded"
Cause: Supabase project paused (free tier pauses after 7 days inactivity)
Fix:
  1. Go to supabase.com --> check if project paused --> click Resume
  2. Verify SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel env vars
  3. Redeploy on Vercel after restoring Supabase

### Telegram Bot not responding
Cause: Webhook cleared (can happen after running local scripts)
Fix:
  node register-webhook.js
Or call directly:
  https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://purpleos-iota.vercel.app/api/webhooks/telegram?bot=team

### Cron jobs not firing
Fix:
  1. Check Vercel Cron Logs in dashboard under the project
  2. Test manually: GET /api/cron/morning-briefing
  3. Check src/routes/cron.js for unhandled exceptions

---

## 9. Runbook -- Onboarding a New Staff Member

Step 1: Add record
  Admin Panel --> HR & Roster Ops --> + Add Staff Member
  Fill: Employee Code (PBD-XXX), Name, Phone, Role, Department, System Role

Step 2: Assign 6-digit PIN
  Staff Profile Drawer --> Reset 6-Digit PIN
  Share PIN securely in person or by SMS -- never by email or public channels

Step 3: Link Telegram
  Staff member opens the Team Bot on Telegram
  Sends: /start then /link <phone_number>
  Bot matches phone --> links Telegram User ID --> confirms with checkmark

Step 4: Verify access
  Staff member opens the Crew Mini App via Telegram
  Logs in with their 6-digit PIN
  Confirms they can see tasks, clock in, etc.

---

## 10. Runbook -- Onboarding a New Client

Step 1: Create client record
  Admin Panel --> Client CRM --> + Add New Client
  Step 1 (Company): Brand name, industry, email, phone, retainer status, spend
  Step 2 (POCs): Add all authorized contacts (name, phone, role, email)
  First POC is automatically set as Primary for portal login routing

Step 2: Generate portal access
  Client CRM Hub --> select client --> POC section --> Generate Portal Login
  Share Client Portal URL + token securely

Step 3: Create first project and invoices
  Kanban --> + New Space --> create a client-specific space
  Finance --> + Create Invoice for the retainer

---

## 11. Runbook -- Database Maintenance

Supabase automatically backs up the database daily on paid plans.

Manual export:
  supabase db dump -f backup-$(date +%Y%m%d).sql --db-url <YOUR_POSTGRES_URL>

Running migrations:
  Migrations are in supabase/migrations/
  Recommended: paste SQL into Supabase Dashboard SQL Editor and run
  CLI option: supabase db push

Seeding test data (development only -- NEVER run against production):
  node scripts/seed-supabase.js

RLS Policy Note:
  All 18 tables have RLS enabled. The API uses Service Role Key to bypass RLS.
  Queries from Supabase Dashboard as anon user will be blocked -- this is correct.

---

## 12. Admin Panel User Guide

URL: https://purpleos-iota.vercel.app/app/index.html
Access: Use your 6-digit Admin PIN at /auth
Access Level: Tech Admin (PBD-004)

### Sidebar Navigation

Command Center:
  Executive Overview  -- Real-time dashboard, 1-tap approvals, cash flow, attendance
  Agency Analytics    -- Performance scorecards, KPI trends

Client Intelligence:
  Leads Pipeline      -- Sales lead tracking and stage management
  Client CRM          -- Full client directory, POC management, 360 client hub

Production Hub:
  Project Pipeline    -- Kanban board, task management (Board/List/Calendar/Dashboard)
  Review Room         -- Client deliverable proofing and approval
  Social Planner      -- Social media content calendar
  Services & CMS      -- Agency service catalog editor

Finance & HR:
  Financials & Expenses -- Invoices, expense claims, payment verifications, quotes
  HR & Roster Ops       -- 33-member staff roster, leave management, PIN reset
  Hardware Assets       -- Equipment and device registry

System & Support:
  Support Desk          -- Internal and client support ticket triage
  Bot & Automation Logs -- Telegram bot event audit trail
  Settings              -- Live telemetry, master PIN update, system config

### Global Features

  Ctrl+K              -- Command Palette: search clients, tasks, staff
  Live BST Clock      -- Current Dhaka time always visible in header
  Ops Health Pill     -- Click for live server telemetry
  Theme Toggle        -- Dark and light mode
  Sidebar Badges      -- Auto-updating counters for pending items

---

## 13. Testing Reference

### Backend Unit & Integration Tests

```bash
npm test
```

Status: 29 Suites, 132 Tests, 100% Passing

### Browser E2E Automation Suite

```bash
# Full 9-phase suite (all tabs, all interactions)
npm run test:e2e

# Run a single phase (1-9)
node scripts/e2e/runner.js --phase 4
```

Status: 38/38 Assertions, 100% Passing
Report: scripts/e2e/reports/latest-report.html

### Phase Map

| Phase | Coverage |
|---|---|
| 1 | Auth guard, sidebar nav, clock, Ops Health, Command Palette, theme |
| 2 | Executive Dashboard, 1-tap Action Center, Finance gauges, Attendance |
| 3 | Leads Pipeline, Client CRM grid and search |
| 4 | Kanban (4 views), Bulk Import CSV + AI Clean, Review Room, Social, CMS |
| 5 | Finance KPIs, 4 sub-tabs, filter chips, Invoice/Expense/Quote modals |
| 6 | HR Roster, Staff Profile Drawer, PIN reset, Hardware Assets |
| 7 | Support Desk, Automation logs, Settings telemetry |
| 8 | Cross-module integration, sidebar badge sync |
| 9 | Console error audit, network health check |
