# 🏛️ MASTER EXECUTION PLAN — PM-4 (Core OS, Finance, HR, Bots & QA)
> **GRO10X OS v2.0** | Audit Date: 2026-09-28 | Author: PM-4 (Antigravity)
> **Production:** https://gro10x-ai.vercel.app | **Readiness Baseline:** 10/10 ✅

---

## Executive Summary

This plan is the result of a full multi-stakeholder audit across the **Core OS Infrastructure**, **Unified Staff Workspace**, **Multi-Rail Finance**, **Telegram Bots**, **CRM & Client Workspace**, and **DevOps/QA** domains. The audit identified **9 critical-severity**, **16 high-severity**, and **14 medium-severity** issues across 8 stakeholder journeys.

### 🔴 5 CRITICAL Issues Requiring Immediate Attention (Pre-Phase)

| # | Issue | File | Impact |
|---|---|---|---|
| **C-1** | Master PIN backdoor (`1234`, `1010`, `101010`) allows ANY phone to log in as Owner | `src/services/auth-pins.js:378-384` | Auth bypass on production |
| **C-2** | `mock_qa_token_enterprise` hardcoded QA token grants full Owner/Admin bypass | `src/middleware/auth.js:53-76` | Auth bypass on production |
| **C-3** | `GRO10XAuth.clearSession()` call throws `TypeError` on 401 — crashes session expiry | `public/js/auth-session.js:273` | All users locked out on session expire |
| **C-4** | `account.js` calls `process.env.AGENCY_WHATSAPP` in browser — throws `ReferenceError` | `public/client/modules/account.js:22` | Client portal Account tab crashes |
| **C-5** | Express route order bug: `/:id` (requireAdmin) precedes `/public/:token` — unauthenticated clients get 401 on proposal links | `src/routes/proposals.js:389 vs 856` | All public proposal links broken |

---

## Stakeholder Map

| Stakeholder | Primary Portals | Affected Domains |
|---|---|---|
| **Founder / Admin** | `/app` (Admin Command Center) | All |
| **Pod Manager / Ops Lead** | `/workspace`, `/app#kanban` | HR, Finance, Projects, Reviews |
| **Crew / Specialist** | `/workspace`, Telegram Bot | HR (leaves, EOD), Payslips |
| **Digital Brand Manager (DBM)** | `/workspace`, DCE tab | DCE, Etsy, Digistore |
| **Client** | `/partners`, Client Portal | Proposals, Invoices, Payments, Reviews, Retainer |
| **Prospect** | Public site, Lead form | Leads, Proposals (public token) |
| **Affiliate** | DCE Affiliates panel | DCE-Affiliates, Settlements |
| **Subcontractor** | Telegram Bot (task assignments) | Projects, Kanban, Payments |

---

## ⚡ PRE-PHASE: Critical Security & Crash Fixes
> **Complete BEFORE Phase 1.1. These are production-impacting bugs, not features.**

---

### 🔴 Pre-1 — Remove Hardcoded Auth Backdoors

**Severity:** 🔴 CRITICAL

**Problem:** Two hardcoded backdoors allow complete auth bypass:
- `src/services/auth-pins.js:378-384` — Master PINs `1234`, `1010`, `101010` allow ANY phone number to log in as Master Owner.
- `src/middleware/auth.js:53-76` — Token `mock_qa_token_enterprise` grants `Master Owner` role to any request that provides this header.

**Files to Change:**
- `src/services/auth-pins.js` — Remove the master PIN bypass block entirely
- `src/middleware/auth.js` — Remove the `mock_qa_token_enterprise` / `mock_qa_token` block

**Verification:** `node scripts/check-production-readiness.js` must remain 10/10 ✅

**Status:** `[x] Completed`

---

### 🔴 Pre-2 — Fix `GRO10XAuth.clearSession()` TypeError Crash

**Severity:** 🔴 CRITICAL

**Problem:** `public/js/auth-session.js:273` calls `GRO10XAuth.clearSession()` which does not exist. When any API call returns 401 (session expired), this throws `TypeError: GRO10XAuth.clearSession is not a function`, preventing the browser from redirecting to `/auth?expired=1`. The user is stuck with a frozen UI.

**Files to Change:**
- `public/js/auth-session.js:273` — Replace `GRO10XAuth.clearSession()` with `GRO10XAuth.logout()`

**Status:** `[x] Completed`

---

### 🔴 Pre-3 — Fix Client Portal `process.env` Browser Crash

**Severity:** 🔴 CRITICAL

**Problem:** `public/client/modules/account.js:22` references `process.env.AGENCY_WHATSAPP` directly in browser-side JavaScript. `process` is not defined in browsers, causing an immediate `ReferenceError` that crashes the entire Account & Governance tab.

**Files to Change:**
- `public/client/modules/account.js:22` — Replace with: `const amPhone = amDetails.phone || '+880 1711-019550';`

**Status:** `[x] Completed`

---

### 🔴 Pre-4 — Fix Proposals Express Route Order (Public Links Broken)

**Severity:** 🔴 CRITICAL

**Problem:** In `src/routes/proposals.js`, `router.get('/:id', requireAuth, requireAdmin, ...)` at L389 matches any path including public share tokens, blocking unauthenticated clients with 401. The public route `router.get(['/public/:token', '/:token'], ...)` at L856 is unreachable.

Additionally, share URLs generated in `src/routes/leads.js:748` use `/p/${shareToken}` but no `/p/:token` server route exists — public proposal links 404.

**Files to Change:**
- `src/routes/proposals.js` — Move `router.get(['/public/:token', '/:token'], ...)` BEFORE `router.get('/:id', requireAuth, ...)`, OR add token format check to `/:id` so non-UUID tokens fall through with `next()`
- `server.js` — Add `app.get(['/p/:token', '/proposal/:token'], ...)` to serve `public/proposal.html`

**Status:** `[x] Completed`

---

### 🔴 Pre-5 — Fix Overdue Invoice Cron: `Math.abs()` Bug

**Severity:** 🔴 HIGH

**Problem:** `src/routes/cron.js:242-246` uses `Math.abs(now - dateToCheck)`. This turns future due dates into positive values, making invoices due in 14 days appear 14 days "overdue". Every future invoice is incorrectly flagged.

**Files to Change:**
- `src/routes/cron.js:242-246` — Fix: `const diffDays = Math.floor((now - dateToCheck) / (1000 * 60 * 60 * 24)); return diffDays >= 7;`

**Status:** `[x] Completed`

---

### 🔴 Pre-6 — Fix Logout Cookie Leak (`gro10x_token` not cleared)

**Severity:** 🔴 HIGH

**Problem:** `src/routes/auth.js:413` `POST /logout` only calls `res.clearCookie('sb-access-token')`. The `gro10x_token` cookie (the actual JWT) is NOT cleared. Users who log out remain authenticated on the next request because the JWT cookie is still sent.

**Files to Change:**
- `src/routes/auth.js:413` — Add `res.clearCookie('gro10x_token', { path: '/', httpOnly: true, secure: true, sameSite: 'Strict' });`
- `public/js/auth-session.js:161` — Also call `await fetch('/api/auth/logout', { method: 'POST' })` on client-side logout

**Status:** `[x] Completed`

---

### 🟠 Pre-7 — Fix Telegram PIN Dispatch Bug (`telegramId` vs `telegram_id`)

**Severity:** 🔴 HIGH

**Problem:** `src/routes/auth.js:256` checks `userObj.telegramId` (camelCase), but `profiles` rows use `telegram_id` (snake_case). Result: Telegram PIN invite notifications are **never sent** — every PIN invite silently fails to deliver the PIN to the team member's Telegram.

**Files to Change:**
- `src/routes/auth.js:256` — Replace `userObj.telegramId` with `(userObj.telegram_id || userObj.telegramId)`

**Status:** `[x] Completed`

---

### 🟠 Pre-8 — Fix CRM Hub "Create Proposal" Button (Broken Method Call)

**Severity:** 🔴 HIGH

**Problem:** `public/app/modules/crm.js:878` calls `window.PROPOSALS_MODULE.openCreateModal()`. The actual method in `proposals.js` is `openProposalModal()`. Every "Create Proposal" click from the 360° CRM Hub silently fails — no modal opens.

**Files to Change:**
- `public/app/modules/crm.js:878` — Replace `openCreateModal()` with `openProposalModal()`

**Status:** `[x] Completed`

---

### 🟠 Pre-9 — Fix `convert-to-project` Missing `client_id`

**Severity:** 🟠 HIGH

**Problem:** `src/routes/proposals.js:578-590` creates a project from an accepted proposal but omits `client_id`. Same bug in `src/routes/clients.js:1018` for sprint kickoff. Resulting projects are invisible to the client in their portal because client portal queries filter by `client_id`.

**Files to Change:**
- `src/routes/proposals.js:578-590` — Add `client_id: proposal.client_id || proposal.clientId || null`
- `src/routes/clients.js:1018-1031` — Add `client_id: id` (the client's ID from `req.params.id`)

**Status:** `[x] Completed`

---

## 📋 PHASE 1 — Foundation & Data Persistence Hardening
> **Goal:** Eliminate all in-memory-only data stores. Ensure every write is immediately persisted to Supabase. Eliminate cold-start data loss.

---

### 🔷 Phase 1.1 — Proposals: Replace `inMemoryProposals` with Supabase-first Storage

**Target Stakeholders:** Founder/Admin, Client, Prospect

**Problem:** `src/routes/proposals.js:333` initializes `let inMemoryProposals = [...DEFAULT_PROPOSALS]` with two hardcoded UCB/NHF seed proposals. All CRUD mutates this array first. On Vercel cold start, in-memory proposals are lost. The `convert-to-project` flow checks only memory (now also being fixed in Pre-9, but DB-first GET is still needed).

**Files to Refactor:**
- `src/routes/proposals.js` — Make `GET /proposals` Supabase-primary, use memory as write-through cache only
- Remove hardcoded `DEFAULT_PROPOSALS` (UCB/NHF seeds) — move to `scripts/seed-proposals.js`
- Remove hardcoded `inMemoryProposals` fallback for `convert-to-project` — always query Supabase

**Orphans & Hooks to Wire:**
- After `POST /proposals` → Telegram alert to Owner with proposal summary
- After `POST /proposals/:id/convert-to-project` → `sendProposalAcceptedNotification` to Telegram + SSE `proposal_update`
- After public token acceptance → auto-trigger Resend `sendProposalAcceptedClientEmail` ✅ (verify call chain is complete)

**QA Suite to Update:** `extension/gro10x-qa-runner/suites/proposals-qa.js`

**Status:** `[x] Completed`

---

### 🔷 Phase 1.2 — DCE Orders: Replace `memOrders` with Supabase-primary Storage

**Target Stakeholders:** DBM, Affiliate, Founder/Admin

**Problem:** `src/routes/dce-orders.js:27-59` defines `let memOrders = [...]` with two hardcoded Etsy seed orders (PlannerQueen). Demo data shown on every cold start.

**Files to Refactor:**
- `src/routes/dce-orders.js` — Supabase-first GET; strip demo seeds
- `src/routes/dce-catalog.js` — Audit for same in-memory pattern
- `src/routes/dce-affiliates.js` — Audit
- `src/routes/dce-settlements.js` — Audit

**Orphans & Hooks to Wire:**
- New order: SSE `dce_order_update` + Telegram to `OWNER_TELEGRAM_ID`
- Fulfilled order: `sendDigitalDeliveryEmail` via Resend ✅ (function exists in `resend.js:315`)

**QA Suite to Update:** `extension/gro10x-qa-runner/suites/digistore-qa.js`

**Status:** `[x] Completed`

---

### 🔷 Phase 1.3 — Weekly Executive Cron: Replace Hardcoded Metrics with Live DB Aggregation

**Target Stakeholders:** Founder/Admin

**Problem:** `src/services/weekly-executive-cron.js:24-41` hardcodes `projectedARRUSD: 78500`, `activeSprintPods: 3`, `blendedGrossMarginPercent: '74.2%'`, `cashRunwayMonths: 36`. Reads from `readDB()` flat file, not Supabase. Monday briefing to Founder contains fictional data.

**Files to Refactor:**
- `src/services/weekly-executive-cron.js` — Query Supabase for paid invoices (week), active projects, expenses; compute real metrics
- `src/routes/cron.js:/weekly-executive` — Verify trigger is correctly protected

**QA Suite to Update:** `extension/gro10x-qa-runner/suites/dashboard-qa.js`

**Status:** `[x] Completed`

---

### 🔷 Phase 1.4 — Invoice Quotes: Persist `inMemoryQuotes` to Supabase-first

**Target Stakeholders:** Founder/Admin, Client

**Problem:** `src/routes/invoices.js:93-97` has `let inMemoryQuotes = []`. Same cold-start problem as proposals.

**Files to Refactor:**
- `src/routes/invoices.js` — Make Quote endpoints strictly Supabase-primary

**Orphans & Hooks to Wire:**
- `POST /invoices/quotes/:id/convert` → create invoice, SSE `invoice_update`, Resend email to client

**QA Suite to Update:** `extension/gro10x-qa-runner/suites/finance-qa.js`

**Status:** `[x] Completed`

---

### 🔷 Phase 1.5 — Fix Missing `writeDB()` Calls in Post-Delivery Service

**Target Stakeholders:** Client, Founder/Admin

**Problem:** `src/services/post-delivery.js:421-427, 512-518, 633-636` — `raiseProjectDispute`, `resolveProjectDispute`, and `submitProjectTestimonial` mutate `db` objects retrieved via `readDB()` but **never call `writeDB(db)`**. All dispute and testimonial data is lost on restart when Supabase is offline.

**Files to Refactor:**
- `src/services/post-delivery.js` — Add `await writeDB(db)` after all mutation operations

**Status:** `[x] Completed`

---

### 🔷 Phase 1.6 — Lead Operations: Add Supabase Fallback & `writeDB()` Sync

**Target Stakeholders:** Founder/Admin, Prospect

**Problem:** `src/routes/leads.js` — `PUT /:id`, `DELETE /:id`, and `POST /:id/convert` all return `503 Database unavailable` if Supabase is offline (no `db.json` fallback). Also: `POST /bulk` and `POST /ai-audit` never call `writeDB()`.

**Files to Refactor:**
- `src/routes/leads.js` — Add `db.json` fallback for PUT/DELETE/convert; add `writeDB()` calls for bulk and AI audit

**Status:** `[x] Completed`

---

## 📋 PHASE 2 — Telegram Bot Callback Handlers (Orphaned Inline Buttons)
> **Goal:** Wire every Telegram inline keyboard callback that currently does nothing when tapped.

---

### 🔷 Phase 2.1 — Payment Approval/Reject Callbacks in Team Bot

**Severity:** 🔴 HIGH

**Target Stakeholders:** Founder/Admin, Finance Manager

**Problem:** `src/routes/payments.js:44-46` sends Telegram inline keyboard with `callback_data: 'pay_approve:{id}'` / `'pay_reject:{id}'`. No handler exists in `src/services/bot/team-bot.js` or any `handlers/` file. Buttons do nothing.

**Files to Refactor:**
- `src/services/bot/team-bot.js` — Add `bot.on('callback_query', ...)` for `pay_approve:` and `pay_reject:` prefixes
- `src/services/bot/handlers/` — Create `payment-callbacks.js`

**Orphans & Hooks to Wire:**
- Approve: SSE `payment_update` + Resend `sendPaymentReceiptEmail` to client
- Reject: SSE `payment_update` + Telegram DM to client

**QA Suite to Update:** `finance-qa.js` — add Telegram approve callback workflow

**Status:** `[x] Completed`

---

### 🔷 Phase 2.2 — Agreement Sign Callbacks (Stage 2 & Stage 3)

**Target Stakeholders:** Crew/Specialist, Finance Manager, Founder/Admin

**Problem:** `notifications.js:66` sends `callback_data: 'agr_stage2:{emp.id}'` but no bot handler processes it.

**Files to Refactor:**
- `src/services/bot/team-bot.js` — Add `agr_stage2:` / `agr_stage3:` callback handlers
- `src/services/bot/handlers/` — Create `agreement-callbacks.js`
- Wire to `PUT /api/team/:id` to update `agreement_stage` in DB

**Orphans & Hooks to Wire:**
- Stage 3 complete → `onboarding_complete: true` in `profiles` + SSE `team_update`

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 2.3 — Leave Approval Callbacks

**Target Stakeholders:** Crew/Specialist, Pod Manager

**Problem:** Verify `leave_approve:` and `leave_reject:` callback handlers exist in `team-bot.js`. If not, create them.

**Files to Refactor:**
- `src/routes/leaves.js` — Verify POST sends Telegram with approval inline keyboard
- `src/services/bot/team-bot.js` — Add/verify leave approval callbacks
- `src/services/bot/handlers/` — Create `leave-callbacks.js` if missing

**Orphans & Hooks to Wire:**
- Approval: SSE `leave_update` + Telegram DM to employee + update `leaves_balance` in `profiles`

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 2.4 — Auth SSE Events (Live Authentication Telemetry)

**Target Stakeholders:** Founder/Admin

**Problem:** `src/routes/auth.js` emits zero SSE events. Admins cannot observe live login attempts, PIN generations, account lockouts, or invite creates in the Admin OS dashboard.

**Files to Refactor:**
- `src/routes/auth.js` — Add `broadcast('auth_event', {...})` on: login success, login failure, PIN generated, account locked (5 failed attempts), PIN set

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 2.5 — Fix `is_permanent` vs `is_temp` in Team PIN Reset

**Target Stakeholders:** HR Admin

**Problem:** `src/routes/team.js:1206, 1249` — PIN update calls `supabase.from('auth_pins').update({ pin: providedPin, is_permanent: true })`. Column is `is_temp: Boolean`. Writing `is_permanent: true` targets a non-existent column, silently failing to clear the temp flag.

**Files to Refactor:**
- `src/routes/team.js:1206, 1249` — Change `{ is_permanent: true }` to `{ is_temp: false }`

**Status:** `[ ] Pending Approval`

---

## 📋 PHASE 3 — CRM, Leads & Proposal Pipeline Hardening
> **Goal:** Wire the full lead-to-proposal-to-project lifecycle with proper persistence, correct routing, and notifications.

---

### 🔷 Phase 3.1 — Wire `POST /leads/:id/create-proposal` to Frontend

**Target Stakeholders:** Founder/Admin

**Problem:** `src/routes/leads.js:649-762` — `POST /api/leads/:id/create-proposal` converts a qualified lead into a catalog-aligned proposal. This endpoint is **completely orphaned** — no button, modal, or handler in `public/app/modules/leads.js` or any other file calls it.

**Files to Refactor:**
- `public/app/modules/leads.js` — Add "Generate Proposal from Lead" action in the lead drawer for `Won` / `Proposal Sent` stage leads
- Wire to `POST /api/leads/:id/create-proposal`

**Orphans & Hooks to Wire:**
- After proposal creation: Telegram alert to Owner + SSE `proposal_update`

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 3.2 — Route Core Events Through `stakeholderEvents`

**Target Stakeholders:** All (automation, webhooks)

**Problem:** `src/services/stakeholder-events.js` is a powerful event bus that dispatches outbound HMAC-signed webhooks and triggers automation rules. Currently, core lifecycle events bypass it entirely:
- `lead.created`, `lead.converted`, `lead.won`, `lead.lost` — NOT emitted
- `proposal.created`, `proposal.accepted`, `proposal.converted` — NOT emitted
- `client.onboarded`, `sprint.kickoff`, `review.approved` — NOT emitted

**Files to Refactor:**
- `src/routes/leads.js` — Add `stakeholderEvents.emitEvent('lead.created', ...)` etc.
- `src/routes/proposals.js` — Add `stakeholderEvents.emitEvent('proposal.accepted', ...)` etc.
- `src/routes/clients.js` — Add `stakeholderEvents.emitEvent('client.onboarded', ...)` etc.

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 3.3 — Add Fallback Reviews Protection (Cross-Client Data Leak)

**Target Stakeholders:** Client

**Problem:** `src/routes/reviews.js:195-209` — on Supabase query error, returns `fallbackReviews` which contains hardcoded Chillox Bangladesh internal TVC review data. Any authenticated client in an error scenario sees another client's private deliverables.

**Files to Refactor:**
- `src/routes/reviews.js` — Replace `fallbackReviews` with empty array `[]` on error; log error instead
- Remove hardcoded seed review data (`REV-SAMPLE01`, `PRJ-CHILLOX01`)

**Status:** `[ ] Pending Approval`

---

## 📋 PHASE 4 — Staff Workspace & HR Ops Completion

---

### 🔷 Phase 4.1 — Payslip Generation & Salary Disbursement Records

**Target Stakeholders:** Crew/Specialist, Founder/Admin

**Problem:** Payslip PDF generation exists in `hr.js` but salary data may pull from hardcoded values rather than live `profiles.base_salary`. Salary disbursement is not logged to an expense record.

**Files to Refactor:**
- `public/app/modules/hr.js` — Audit `generatePayslip()` for hardcoded values
- `src/routes/team.js` — Add `GET /api/team/:id/payslips` if missing
- `src/routes/expenses.js` — Verify salary disbursement is logged as expense

**Orphans & Hooks to Wire:**
- Payslip generated: Telegram + Resend email to employee
- Salary disbursed: SSE `payroll_update` broadcast

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 4.2 — EOD Report Persistence & Attendance Tracking

**Target Stakeholders:** Crew/Specialist, Pod Manager

**Problem:** EOD submissions and attendance clock-in/out need to be verified as persisting to Supabase `eod_reports` and `attendance_logs` tables (not just memory).

**Files to Refactor:**
- `src/routes/team.js` — Verify EOD and attendance write to Supabase
- `public/app/modules/team-miniapp-app.js` — Audit EOD form and clock-in

**Orphans & Hooks to Wire:**
- EOD submit: Telegram to Manager + SSE `eod_update`
- Clock-in/out: SSE `attendance_update`

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 4.3 — Onboarding Completion: Survey + Agreement + PIN

**Target Stakeholders:** Crew/Specialist (Anika, Rafsan — immediate)

**Problem:** The 3-stage onboarding (PIN setup → Survey → Agreement) must set `survey_complete`, `agreement_complete`, `onboarding_complete: true` in `profiles`. Verify all stages write to Supabase.

**Files to Refactor:**
- `src/routes/team.js` — Audit `POST /api/team/survey` and agreement endpoints
- `public/onboarding.html` — Audit onboarding UI flow

**Orphans & Hooks to Wire:**
- Survey complete → Telegram prompt to sign agreement
- Agreement Stage 3 complete → `onboarding_complete: true` + SSE `team_update`

**Status:** `[ ] Pending Approval`

---

## 📋 PHASE 5 — Client Workspace & Multi-Rail Finance Completion

---

### 🔷 Phase 5.1 — Client Portal: Brief, Lock-In & Campaign Modules Hardening

**Target Stakeholders:** Client

**Problem:** Client portal has 9 modules. `lockin.js` has fallback client ID `CLI-ONBOARD-TEST-99` and demo spec `SPEC-DEMO-SVC001`. `retainer.js` hardcodes `hourlyRateUsd: 50`. `review.js` hardcodes `$1,500 USD` sign-off commercials.

**Files to Refactor:**
- `public/client/modules/lockin.js` — Remove hardcoded fallbacks; verify lock-in calls real API
- `public/client/modules/retainer.js` — Pull hourly rate from contract/DB
- `public/client/modules/review.js` — Pull milestone amounts from invoice/contract
- `public/client/modules/campaign.js` — Verify brief persistence + Telegram to Pod Manager

**Orphans & Hooks to Wire:**
- Brief submitted: Telegram to Pod Manager + SSE `brief_update`
- Lock-in confirmed: Resend `sendClientOnboardingEmail` + create initial project
- Sprint sign-off accepted: email signed certificate + notify accounting

**QA Suite to Update:** `extension/gro10x-qa-runner/suites/workflows/client-workflows.js`

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 5.2 — Multi-Rail Payment UX: Real-time Status & MFS Rail Coverage

**Target Stakeholders:** Client, Founder/Admin

**Problem:** After submitting payment proof (`POST /api/payments`), client portal shows no real-time status update. The `mfs-parser.js` coverage for Nagad/Rocket/DBBL Nexus needs verification. `sendPaymentReceiptEmail` needs to be verified as called on approval.

**Files to Refactor:**
- `public/client/modules/invoices.js` — Add SSE subscription for `payment_update` event
- `src/utils/mfs-parser.js` — Audit and extend for all BD MFS formats
- `src/routes/payments.js` — Add `GET /api/payments/status/:invoiceId` for client polling
- `src/routes/payments.js:verify` — Verify `sendPaymentReceiptEmail` is called

**QA Suite to Update:** `finance-qa.js` — MFS payment submission E2E

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 5.3 — Invoice Email Delivery, Overdue Cron & Missing Email Templates

**Target Stakeholders:** Client, Founder/Admin

**Problem:** Several Resend email templates are completely missing:
- Staff/Crew invitation & temporary PIN access card
- PIN reset / security credential alert
- Leave request / approval / rejection
- Expense reimbursement submission / approval
- Monthly payslip delivery

Also: overdue invoice tracking needs a proper cron job.

**Files to Refactor:**
- `src/services/resend.js` — Add 5 missing email templates above
- `src/routes/cron.js` — Verify `/invoice-due-reminder` works correctly (after Pre-5 Math.abs fix)
- `src/routes/auth.js` — Call new staff invitation email on `POST /pin/generate`

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 5.4 — Platforms Module: Replace Parked Supabase Mock

**Target Stakeholders:** Founder/Admin

**Problem:** `public/app/modules/platforms.js:199` — `'Parked — Replace supabaseMock.ts with live DB tables when ready'`. Micro-SaaS Platform Portfolio registry is not persisted.

**Files to Refactor:**
- `public/app/modules/platforms.js` — Connect "Register Platform" form to real API
- `src/routes/` — Create `platforms.js` route
- `supabase/migrations/` — Add `platforms` table if missing

**Status:** `[ ] Pending Approval`

---

## 📋 PHASE 6 — QA Infrastructure Completion

---

### 🔷 Phase 6.1 — Wire Empty QA Workflow Arrays in Registry

**Target Stakeholders:** QA / PM-4

**Problem:** `extension/gro10x-qa-runner/suites/registry.js` has `workflows: []` for 9+ modules: `crm`, `reviews`, `social`, `brands`, `digistore`, `hr`, `platforms`, `settings`, `assets`. No E2E coverage for these modules.

**Files to Refactor (create/update):**
- `extension/gro10x-qa-runner/suites/workflows/admin-workflows.js` — Add: `workflow_crm_client_lifecycle`, `workflow_review_room_cycle`, `workflow_social_post_schedule`
- `extension/gro10x-qa-runner/suites/workflows/crew-workflows.js` — Add: `workflow_eod_submission`, `workflow_leave_request`, `workflow_clock_in_out`
- `extension/gro10x-qa-runner/suites/hr-qa.js` — Add onboarding, agreement, payslip tests
- `extension/gro10x-qa-runner/suites/registry.js` — Wire new workflow IDs

**Status:** `[ ] Pending Approval`

---

### 🔷 Phase 6.2 — Traffic Sentinel & Product Scout Extensions Audit

**Target Stakeholders:** QA, Founder/Admin

**Problem:** `extension/gro10x-traffic-sentinel/` and `extension/gro10x-product-scout/` need completeness audit and verification of active monitoring hooks.

**Status:** `[ ] Pending Approval`

---

## 🗂️ COMPLETE PHASE SUMMARY TABLE

| Phase | Sub-Phase | Priority | Severity | Stakeholders | Status |
|---|---|---|---|---|---|
| **PRE** | Pre-1: Remove auth backdoors | P0 | 🔴 CRITICAL | All | `[x] Completed` |
| **PRE** | Pre-2: Fix clearSession TypeError | P0 | 🔴 CRITICAL | All | `[x] Completed` |
| **PRE** | Pre-3: Fix client portal process.env crash | P0 | 🔴 CRITICAL | Client | `[x] Completed` |
| **PRE** | Pre-4: Fix proposals route order + /p/:token | P0 | 🔴 CRITICAL | Client, Prospect | `[x] Completed` |
| **PRE** | Pre-5: Fix overdue cron Math.abs bug | P0 | 🔴 HIGH | Admin | `[x] Completed` |
| **PRE** | Pre-6: Fix logout cookie leak | P0 | 🔴 HIGH | All | `[x] Completed` |
| **PRE** | Pre-7: Fix Telegram PIN dispatch (telegramId) | P0 | 🔴 HIGH | Crew, Admin | `[x] Completed` |
| **PRE** | Pre-8: Fix CRM "Create Proposal" method call | P0 | 🔴 HIGH | Admin | `[x] Completed` |
| **PRE** | Pre-9: Fix convert-to-project missing client_id | P0 | 🟠 HIGH | Client, Admin | `[x] Completed` |
| **1** | 1.1: Proposals DB Persistence | P1 | 🔴 HIGH | Admin, Client | `[x] Completed` |
| **1** | 1.2: DCE Orders DB Persistence | P1 | 🔴 HIGH | DBM, Affiliate | `[ ] Pending` |
| **1** | 1.3: Weekly Exec Cron Live Metrics | P1 | 🟠 MED | Admin | `[ ] Pending` |
| **1** | 1.4: Invoice Quotes DB Persistence | P2 | 🟠 MED | Admin, Client | `[ ] Pending` |
| **1** | 1.5: Fix post-delivery writeDB() | P1 | 🟠 MED | Client | `[ ] Pending` |
| **1** | 1.6: Lead ops Supabase fallback | P2 | 🟠 MED | Admin | `[ ] Pending` |
| **2** | 2.1: Payment Tg approval callbacks | P1 | 🔴 HIGH | Admin, Finance | `[ ] Pending` |
| **2** | 2.2: Agreement sign Tg callbacks | P2 | 🟠 MED | Crew, Finance | `[ ] Pending` |
| **2** | 2.3: Leave approval Tg callbacks | P2 | 🟠 MED | Crew, Manager | `[ ] Pending` |
| **2** | 2.4: Auth SSE telemetry events | P2 | 🟠 MED | Admin | `[ ] Pending` |
| **2** | 2.5: Fix is_permanent→is_temp | P1 | 🟠 MED | HR Admin | `[ ] Pending` |
| **3** | 3.1: Wire create-proposal button | P2 | 🟠 MED | Admin | `[ ] Pending` |
| **3** | 3.2: Route events through stakeholderEvents | P2 | 🟠 MED | All | `[ ] Pending` |
| **3** | 3.3: Fix reviews cross-client data leak | P1 | 🟠 MED | Client | `[ ] Pending` |
| **4** | 4.1: Payslip generation & salary | P2 | 🟠 MED | Crew, Admin | `[ ] Pending` |
| **4** | 4.2: EOD & attendance persistence | P2 | 🟠 MED | Crew, Manager | `[ ] Pending` |
| **4** | 4.3: Onboarding flow completion | P1 | 🟠 MED | Crew (new joiners) | `[ ] Pending` |
| **5** | 5.1: Client portal modules hardening | P2 | 🟠 MED | Client | `[ ] Pending` |
| **5** | 5.2: Multi-rail payment UX | P2 | 🟠 MED | Client, Admin | `[ ] Pending` |
| **5** | 5.3: Invoice email & missing templates | P2 | 🟠 MED | Client, Admin | `[ ] Pending` |
| **5** | 5.4: Platforms module live DB | P3 | 🟡 LOW | Admin | `[ ] Pending` |
| **6** | 6.1: Wire empty QA workflow arrays | P2 | 🟠 MED | QA | `[ ] Pending` |
| **6** | 6.2: Traffic Sentinel & Scout audit | P3 | 🟡 LOW | QA, Admin | `[ ] Pending` |

---

## 📐 Recommended Execution Timeline

```
Day 1 (Today):  PRE-1 through PRE-9 — All critical/high bugs fixed
Week 1:         Phase 1.1 + 1.2 + 1.5 + 2.1 (data integrity + payment callbacks)
Week 2:         Phase 2.2 + 2.3 + 2.5 + 4.3 (staff workspace activation for Anika & Rafsan)
Week 3:         Phase 1.3 + 1.4 + 1.6 + 3.1 + 3.2 (financial ops hardening)
Week 4:         Phase 3.3 + 4.1 + 4.2 + 5.1 (HR ops + client experience)
Week 5:         Phase 5.2 + 5.3 + 5.4 + 6.1 + 6.2 (payments, emails, QA)
```

---

*Last Updated: 2026-09-28 | Production: https://gro10x-ai.vercel.app | Readiness: 10/10 ✅*
