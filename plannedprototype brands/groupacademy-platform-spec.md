# Group Academy — Platform Master Spec (Launch Edition)

**Version:** Launch Candidate · Phase Z0 (Code Freeze)
**Domains:** https://groupacademy.online · https://www.groupacademy.online · https://groupacademy.lovable.app
**Brand colors:** Tech Blue `#2A7DDE` · Vibrant Cyan `#33E1E4` · Success Green `#10D576`
**Document purpose:** Single source of truth for launch ops — feed into marketing tools (GPT/Gemini/Claude), PR briefings, investor decks, sales enablement, support training, and SEO/content pipelines.

---

## 1. Executive Summary

Group Academy is a **global, agentic career & talent operating system** that unifies four traditionally separate markets into one credit-powered network:

1. **Career Services for Talent** — learn, get assessed, build a verifiable profile, and get matched to jobs/gigs.
2. **Hiring & Talent Sourcing for Companies** (Gro10x) — post jobs, source verified talent, run gigs, manage projects with escrow.
3. **Creator Economy for Instructors** — build courses, run cohorts, earn revenue splits with native payouts.
4. **Admin Command Center** — a fully agentic operations cockpit where a solo founder can run the platform via AI chat.

The defining innovation is **mastery-driven matching**: every quiz, scenario, and gig submission feeds a per-topic skill profile, which is then used to (a) issue verifiable credentials, (b) boost job-match scores, (c) personalize AI tutoring, and (d) drive the recruiter side of the marketplace. Layered on top is a **fractional-credit economy** (1 credit ≈ 2 BDT, `numeric(12,1)` precision) and an **AI swarm** of role-specific agents armed with real RPC tools — every agent can actually take operational action, not just chat.

The platform ships with the codebase frozen, RLS hardened across all tables, Zod-validated tool dispatchers, native transactional email, and a dual-shell architecture (Talent shell at `/app/*`, B2B shell at `/gro10x/*`).

---

## 2. Audiences & Value Propositions

| Audience | Core Pain | Group Academy Answer | Primary Surface |
|---|---|---|---|
| **Talent (job seekers)** | Generic CVs, no proof of skill, no feedback loop | Verified skill credentials, mastery-driven job match %, AI tutor that adapts to weak topics | `/app` shell |
| **Employers / Recruiters** | Fake CVs, slow hiring, expensive sourcing | Pre-verified talent, signal-driven CRM, kanban pipeline, escrow-protected gigs | `/gro10x` shell |
| **Instructors / Creators** | No reach, low retention, opaque payouts | Branded catalog, cohort tools, automatic 60/40 revenue splits, native credit→cash payouts | `/app/instructor` |
| **B2B Learning Buyers** | Can't measure team upskilling | Sponsored assignments, learning tracks, org health dashboard | `/gro10x/learn/ops` |
| **Career Abroad Aspirants** | Fragmented info, untrusted agents | IELTS coach, study-abroad roadmap, vetted destination agents | `/app/abroad` |
| **Admins / Operators** | Manual ops, brittle dashboards | Agentic Command Center — AI agents with `approve_payout`, `force_run_matchmaker`, `award_credits` tools | `/dashboard` |

---

## 3. Architecture at a Glance

### 3.1 Shells (Frontend Routing)

```
groupacademy.online
├── /                     → Public marketing & SEO (jobs, projects, leaderboards, talent /t/:handle, /verify/*)
├── /app/*                → Talent shell (PWA, mobile-first vertical)
├── /gro10x/*             → B2B shell (Companies, Recruiters, Instructors-as-vendors)
├── /dashboard/*          → Admin Command Center (16 stakeholder groups + AI chat)
└── /c/:slug/*            → Branded company catalogs (public-facing)
```

Host routing is centralized in `src/lib/host.ts` (`IS_GRO10X`). All cross-shell links must respect the active host or use route helpers.

### 3.2 Backend (Lovable Cloud)

- **Database:** Postgres with Row-Level Security on every public table.
- **Auth:** Email + password, Google OAuth, mandatory global phone capture at signup. Roles live in `user_roles` (never on `talents`).
- **Edge Functions:** ~120+ deployed (AI agents, cron sweepers, tool dispatchers, payment, email).
- **Storage:** `talent-cvs` (signed URLs only), `discovery-og` (public OG images), `course-resources`.
- **Realtime:** Enabled on `feed_posts`, `post_comments`, `application_messages`, `agent_messages`, `notifications`.
- **Cron:** ~15 scheduled jobs (matchmaker every 15min, leaderboard rebuild, learning track sweeps, escrow reconciliation, sitemap rebuild, weekly digests).

### 3.3 The AI Swarm

Three audiences × multiple personas, all routed through `ai-agent-chat` and the unified `agent-tool-execute` dispatcher:

| Audience | Personas | Tool Dispatcher Edge |
|---|---|---|
| Talent (B2C) | `concierge` (Atlas), `talent-aisha` (career success), tutor agents | `talent-agent-tools` |
| Companies (B2B) | `company_recruiter` Riya, `company_talent_scout` Maya, `company_billing` Bilal, `company_ops` Omar, `company_growth` Aiden | `company-agent-tools` |
| Admin | `fin-controller`, `talent-aisha` (admin scope), `gig-ops`, `instructor_manager`, plus group-specific agents | `admin-agent-tools` |

Every tool is registered in `agent_tools` with strict Zod schemas, and every successful tool call returns an `invalidate` array of React Query keys, which the chat hooks (`useAgentChat`, `useAdminChatThread`) feed to `queryClient.invalidateQueries` so dashboards refresh automatically.

### 3.4 The Credit Economy

- **Unit:** 1 credit = 2 BDT. Stored as `numeric(12,1)` for fractional support.
- **Wallets:** Separated by source — Earned, Free/Promo, Purchased — each with its own ledger.
- **Deduction:** Per AI response (no session timers), per gig contact unlock, per course enrollment, per hype reaction (1 credit, 80/20 creator/platform split).
- **Payouts:** Instructor minimum 500 credits; admin-approved via `approve_payout` tool; multi-currency aware via `usePaymentConfig` and FX rates.
- **B2B credits:** `company_credits` ledger fuels sponsored learning, talent contact unlocks, and escrow funding.

---

## 4. Talent Portal (`/app`) — Feature Map

### 4.1 Discovery & Onboarding
- LinkedIn import (PDF/JSON parser at `src/lib/linkedinJsonParser.ts`) seeds talent profile.
- Conversational AI auth agent (Aisha) with resilience: falls back to manual form if AI fails.
- CV fingerprinting prevents duplicate accounts.

### 4.2 Jobs Hub (`/app/jobs`)
- **Single-RPC dashboard:** `get_jobs_hub_dashboard` returns recommendations, applications, saved, signals in one trip.
- **Ranked matching:** `get_ranked_jobs_for_talent` blends profile fit, mastery (verified credentials), recency, freshness; daily `cron-rebuild-job-recs` snapshot.
- **Tabs:** For You · All · Companies · Locations · Tools · Saved · Applications.
- **Tools subtab:** 7 AI tools (CV maker, application helper, salary analysis, interview prep, etc.) with `tool_runs` ledger and `get_next_best_tool` recommender.
- **Application methods:** Internal apply, external link, email, “Apply with AI” (drafts cover letter, fills external forms via prompt).
- **Cards:** Unified `JobCard` component, free per-card match %, multi-currency salary display.

### 4.3 Gigs (`/app/gigs`)
- **For-You matchmaker:** `cron-gig-matchmaker` every 15min populates `gig_matches`.
- **AI Bid Coach** drafts personalized bids; **AI Match Explainer** shows why.
- **Trust score** decays over 90 days; auto-tiers reviewers (apprentice → master).
- **Verification automation:** `ai-gig-verifier` reviews submissions; revisions, appeals (7-day window), community reviewer panels of 3.
- **Disputes** open by either party; ai-dispute-summarizer briefs admins.

### 4.4 Learning (`/app/learning`)
- **Courses** with cohorts, live sessions (UTC + BDT timezone), attendance tracking.
- **Mastery rollup:** `learner-talent-mirror` aggregates per-topic mastery across all courses.
- **Next-best-action** recommender ranks review/practice/finish/scenario actions.
- **AI Tutor** receives weak/strong topic context via `get_tutor_mastery_context`.
- **Learning Tracks:** branded multi-course paths with progress RPC.
- **Verifiable Skill Credentials** auto-issued at mastery thresholds; public `/verify/skill/:code`.

### 4.5 Career Abroad (`/app/abroad`)
- IELTS Coach, Mock Runner, Results, Prep modules.
- Study Abroad Roadmap, School Detail, Destination Agents.
- Lead capture monetized; admin-side programs & leads management.

### 4.6 Public Profile (`/t/:handle`)
- Opt-in via `get_public_talent_profile` RPC.
- Surfaces verified skills, mastery, completed tracks, public projects, JSON-LD for SEO.

### 4.7 Other Talent Surfaces
- Feed (UGC, hype reactions, comments, polls), Messages (direct + agent threads), Notifications, Saved Items (unified schema), Connections, Wallet/Transactions (bKash-style UI), Reviewer Cockpit, Disputes/Appeals.

---

## 5. Gro10x B2B Portal (`/gro10x`) — Feature Map

### 5.1 Recruiter Workspace (`/gro10x/c/recruiter`)
- Job post wizard, applicant kanban (`get_employer_pipeline`), shortlist, offer composer.
- `application_messages` realtime chat per candidate.
- Audit trigger logs every stage move; `notify-application-status` edge sends transactional emails.

### 5.2 Talent Sourcing
- `search_public_talents` RPC with filters (skills, location, level, verified credentials).
- `talent_lists` for shortlists; `talent_relationships` for pipeline tracking.
- "Sourced" badge auto-applied when sourced talent later applies.
- Verified Match Badge + Why-You-Match Panel for each candidate.

### 5.3 Gig Buyer Side
- Open gigs feed, recommended bidders, AI gig pricer.
- Managed Projects with milestone-based escrow:
  - `fund_gig_project` debits `company_credits`.
  - `publish_milestone` holds funds; `release_milestone_funds` splits per assignment.
  - Refund schedule 100/50/0 by lifecycle stage.
- Project rooms with status summaries and acceptance coach.

### 5.4 Learning Ops B2B (`/gro10x/learn/ops`)
- Sponsored assignments deduct `company_credits`.
- 5-tab admin: Assignments · Tracks · Health · Seats · Reports.
- `org_assign_talents`, `org_assign_track`, `org_learning_health` RPCs.
- Hourly cron: overdue + seat-low alerts.

### 5.5 Branded Catalog (`/c/:slug/learn`)
- Public, indexable storefront for company-specific tracks.
- White-labeled colors, OG images via `og-image-render`.

### 5.6 Public Discovery
- `/projects`, `/projects/:slug`, `/leaderboards/:kind`, `/c/:slug/projects`.
- `cron-leaderboard-rebuild`, `cron-sitemap-rebuild`, `cron-discovery-signal-decay`.
- Auto-drafted public case studies via `ai-project-case-study`.

### 5.7 Other B2B Surfaces
- Billing & top-ups (managed payment infra), Inbox (5k-credit gate to message any talent), Agent Marketplace, Offerings, Me/Profile, ⌘K Command Palette (`gro10x_global_search` RPC).

---

## 6. Instructor / Creator Portal (`/app/instructor`)

### 6.1 Content Factory
- Course Briefs auto-create instructor jobs; accepted offer trigger seeds engagement, instructor role, and 50 free AI credits.
- Module Manager with AI item rewrite suggestions, audit log, multilingual translations (10 languages via `module_item_translations`).
- Authoring Feedback Loop: `get_authoring_review_digest` RPC + amber nudges for items needing review.
- Cohorts, live sessions, attendance, reminders.

### 6.2 Earnings Engine
- `instructor_earnings_ledger` auto-fed by `course_revenue_splits` trigger (60/40 default).
- `get_instructor_dashboard_v2` single-trip RPC: earnings, active students, pending reviews.
- React Query keyed `["instructor-dashboard"]` for AI cache invalidation.
- Payout request UI: minimum 500 credits, admin approval via `approve_payout` tool, monthly statement cron.
- ActiveInstructorChip surfaces on TalentSignalPanel in CRM.

### 6.3 Instructor Insights (`/app/instructor/insights`)
- Authoring trends, item analytics (p-values, rubric averages, topic mastery, needs_review flags).

### 6.4 Instructor Manager Agent
- Tools: `draft_module_outline`, `submit_course_for_review`, etc.
- GlobalAIBubble auto-routes to `instructor_manager` when on `/app/instructor/*` routes.

---

## 7. Admin Command Center (`/dashboard`)

### 7.1 Stakeholder Group Hierarchy (16 groups)

| # | Group | Scope |
|---|---|---|
| 1 | Talent | 6-tab management, segmentation, lifecycle |
| 2 | Companies | 8-tab CRM, billing, sponsored learning |
| 3 | AI Agents | 13-tab Agent OS (Channels, Tools, Studio, Marketplace, Payouts, Sessions, Insights, etc.) |
| 4 | Investors | FP&A + Relationship Exec agents |
| 5 | Institutions | Universities, partners, clubs, reps, events |
| 6–10 | Workforce, GTM, UGC & Content, Jobs | + 10 chat agents |
| 11–16 | Learn, Gig Economy, Career Abroad, Marketing, Finance, Platform Config | + 9 chat agents |

### 7.2 Agentic Dashboard Chat (`/dashboard/chat`)
- WhatsApp-style messenger unifying all 10 admin AI agents with persistent threads (`agent_threads`, `agent_messages`).
- Cache invalidation bridge: AI tool calls invalidate `["admin-payout-requests"]`, `["admin-gigs"]`, `["talent-credits"]`, etc., and dashboard tables refresh instantly.

### 7.3 Admin Tool Arsenal
Registered in `agent_tools` (`audience='admin'`):
- `approve_payout` / `reject_payout` → `process_instructor_payout` RPC
- `award_credits` → `award_credits` RPC (Earned/Free/Promo aware)
- `force_run_matchmaker` → triggers `cron-gig-matchmaker` for one or all gigs
- (Extensible) `verify_gig_submission`, etc.

All tool inputs are validated by Zod schemas; bad args return `{ ok:false, error:"BAD_ARGS", issues }` so the LLM can self-correct on the next hop.

### 7.4 Lazy Loading & RBAC
- Dashboard tabs are lazy-loaded.
- `useAdminScope` resolves role from `user_roles` (admin / super_admin / talent-success-exec).
- `talent-success-exec` is a restricted role with read-mostly access to the Talent group.

---

## 8. Database & Security Posture

### 8.1 Core Tables (selected)
`talents`, `user_roles`, `companies`, `jobs`, `applications`, `gigs`, `gig_bids`, `gig_projects`, `gig_milestones`, `gig_escrow_accounts`, `gig_escrow_ledger`, `courses`, `cohorts`, `course_sessions`, `session_attendance`, `learning_tracks`, `track_assignments`, `certificates`, `skill_credentials`, `talent_skill_profile`, `talent_trust_score`, `talent_trust_events`, `instructor_earnings_ledger`, `instructor_payout_requests`, `course_revenue_splits`, `feed_posts`, `post_comments`, `post_reactions`, `application_messages`, `agent_threads`, `agent_messages`, `agent_tools`, `tool_runs`, `discovery_signals`, `leaderboard_snapshots`, `project_public_settings`, `talent_lists`, `talent_relationships`, `notifications`, `credit_ledger`, `company_credits`, `reviewer_credit_ledger`, `gig_review_assignments`, `gig_disputes`, `gig_verifications`, `revision_requests`.

### 8.2 Security Rules (Always Apply)
- **RLS:** Every public table has `rowsecurity = true`. Verified clean as of Phase Z0.
- **Roles:** Stored in `user_roles`, never on `talents`. `has_role()` is `SECURITY DEFINER` to avoid RLS recursion.
- **DB functions:** All set `search_path = public`.
- **Edge functions:** Must verify `auth.getUser(token)` before privileged work; service-role only used after explicit role check.
- **Storage:** `talent-cvs` requires signed URLs; `discovery-og` is public-read only.
- **Tool dispatchers:** Zod-validated; `admin-agent-tools` enforces admin/super_admin role before any RPC.
- **Email:** Transactional only via `notify.groupacademy.online` native queue; B2B outreach uses `mailto:` to protect domain reputation.

---

## 9. Monetization Model

| Stream | Mechanism | Split |
|---|---|---|
| **Course revenue** | Talent buys course in credits → `course_revenue_splits` trigger | 60% instructor / 40% platform |
| **Hype reactions** | 1 credit per hype on creator content | 80% creator / 20% platform |
| **Talent connection fee** | Dynamic 1% of talent's lifetime credit volume; min 5,000-credit gate to message cold | 100% platform |
| **Gig escrow** | Company funds project; release per milestone | Platform fee per release |
| **B2B Learning Ops** | Companies buy credits, sponsor assignments | 100% platform on credit margin |
| **Career Abroad services** | Tiered service packages, lead capture | Per-service fee |
| **Jobs Board freemium** | 5 free job posts / month, then 50 credits each | 100% platform |
| **AI tools** | Per-response credit deduction (fractional) | 100% platform |
| **Payment infrastructure** | Stripe/Paddle/bKash via managed payment infra | Standard PSP fees |

**FX:** 1 credit = 2 BDT; multi-currency display via `useCurrencyRates`. Payouts to instructors go through `usePaymentConfig` with admin-set FX overrides at approval time.

---

## 10. Public, SEO & PWA Surfaces

- **Public routes:** `/`, `/jobs`, `/jobs/:id`, `/projects`, `/projects/:slug`, `/leaderboards/:kind`, `/c/:slug`, `/c/:slug/learn`, `/c/:slug/projects`, `/t/:handle`, `/verify/cert/:code`, `/verify/skill/:code`, `/webinar/:slug`.
- **SEO:** Single H1, JSON-LD on talent/project/job pages, dynamic OG images via `og-image-render`, sitemap rebuilt daily.
- **PWA:** Two manifests (`/manifest.json` for talent, `/gro10x/manifest.webmanifest` for B2B), offline page (`/offline.html`), install button, asset-links for Android TWA.

---

## 11. Cron & Scheduled Jobs

| Cron | Cadence | Purpose |
|---|---|---|
| `cron-gig-matchmaker` | 15 min | Populate `gig_matches` for For-You |
| `cron-gig-digest` | Daily | Daily bidder digest |
| `cron-verification-sweeper` | 5 min | Auto-resolve gig verifications |
| `cron-revision-expiry` | Daily | Close stale revision requests |
| `cron-trust-decay` | Daily | Decay trust events older than 90 days |
| `cron-rebuild-job-recs` | Daily | Rebuild ranked job recs per talent |
| `cron-track-sweeps` | Daily | Learning track overdue & nudges |
| `cron-leaderboard-rebuild` | Daily | Discovery leaderboards |
| `cron-sitemap-rebuild` | Daily | Public sitemap.xml |
| `cron-discovery-signal-decay` | Daily | Age-out discovery signals |
| `cron-project-status-sweep` | 15 min | Stale project statuses |
| `cron-due-date-sweep` | Daily | Project due-date reminders |
| `cron-escrow-reconciliation` | Daily | Escrow balance audit |
| `cron-project-weekly-digest` | Weekly | Project weekly summary email |
| `cron-instructor-statements` | Monthly | Instructor monthly earnings statement |

---

## 12. Brand & Design System

- **Colors:** Tech Blue `#2A7DDE` (primary), Vibrant Cyan `#33E1E4` (accent), Success Green `#10D576` (success). All other colors are HSL semantic tokens in `index.css` and `tailwind.config.ts` — never hardcoded.
- **Typography:** System UI stack tuned for global legibility (Bengali, Arabic, CJK fallbacks).
- **Mobile:** Vertical-only (no horizontal scroll), 3:1 banner ratio, compact spacing (`py-2`, `space-y-2`), notched safe-bottom required.
- **Components:** shadcn/ui with custom variants; never inline custom colors. Animations via Tailwind utilities.
- **Tone:** Confident, action-oriented, globally relevant. Never region-locked unless contextually required.

---

## 13. Phase Ledger (Build History)

| Phase | Name | Outcome |
|---|---|---|
| T2 | Talent Concierge & Cache Bridge | Global AI Bubble + tool invalidation map |
| 3.2 | Jobs Companies & Locations v2 | Signal-driven tabs, follow employers |
| 3.3 | Consolidated AI Tools Hub | All 7 tools under `/app/jobs?tab=tools` |
| 3.5 | Hiring Loop Pipeline & Messaging | Kanban, realtime app messages, mobile job page |
| 3.6 | Employer CRM & Sourcing | Talent search, lists, relationships, Sourced badge |
| 4.1 | Instructor Workspace Closed Loop | Course briefs → instructor offers → 60/40 splits |
| 4.2 | Cohorts & Live Sessions | Cohorts, attendance, reminders |
| 4.4 | Gro10x Learning Ops B2B | Sponsored assignments, org health |
| 4.5 | Learning Tracks & Branded Catalog | Multi-course paths, public `/c/:slug/learn` |
| 4.5b/4.6 | Desktop Polish & Outcome Signals | ⌘K palette, talent signal in CRM |
| 4.7 | Instructor Monetization & Payouts | Native payout flow, monthly statements |
| 5.2 | Gig Matchmaker & Bid Coach | For-You default, AI bid/match/pricer |
| 5.3 | Gig Verification Automation | AI verifier, revisions, appeals |
| 5.4 | Community Reviewer & Disputes | 4-tier reviewer program, panel reviews |
| 5.5 | Managed Projects & Escrow | Milestones, escrow ledger, AI scoper |
| 5.6 | Public Discovery | Public projects, leaderboards, OG images |
| C2 | Creator Engine | `get_instructor_dashboard_v2`, instructor swarm |
| D1 | Admin Command Center | Armed admin AI (approve_payout, etc.), cache bridge |
| Z0 | Cleanup & Code Freeze | Orphan removal, route leak fix, Zod hardening |

---

## 14. Launch Readiness Checklist

- [x] RLS coverage 100% on public tables
- [x] Zod validation on all AI tool dispatchers
- [x] Single-trip RPCs replace N+1 dashboards (Jobs Hub, Instructor Dashboard, Employer Pipeline)
- [x] Cache invalidation bridge live across Talent / Employer / Creator / Admin chats
- [x] Native transactional email on `notify.groupacademy.online`
- [x] PWA installable for both shells
- [x] Public discovery (sitemap, OG images, JSON-LD) shipping
- [x] Cron sweepers scheduled and observable in admin Sessions tab
- [x] Code freeze: orphan stubs deleted, route leaks patched
- [ ] Manual QA pass across all four portals (in progress)
- [ ] Investor & PR briefing assets generated from this document
- [ ] Customer support runbook seeded from agent transcripts

---

## 15. Glossary

- **Mastery** — per-topic skill score (0–100) derived from quiz, scenario, and gig outcomes.
- **Verified Credential** — auto-issued, publicly verifiable proof of mastery on a specific topic.
- **Gro10x** — the B2B brand and shell (`/gro10x/*`) for companies and recruiters.
- **Atlas** — the talent-side concierge agent.
- **Riya / Maya / Bilal / Omar / Aiden** — the five armed B2B personas.
- **Aisha** — the conversational auth & talent-success agent (also has admin scope).
- **Instructor Manager** — the creator-side agent bound to `/app/instructor/*`.
- **Hype** — paid 1-credit reaction on creator content (80/20 split).
- **For-You** — algorithmically ranked tab default for jobs and gigs.
- **Trust Score** — per-talent reputation that decays over 90 days; auto-tiers reviewers.
- **Earned vs Free credits** — wallet segmentation; free credits cannot be cashed out.
- **Code Freeze** — Phase Z0; codebase locked for manual QA.

---

*Generated for launch operations. Feed this document directly into your marketing LLM, PR brief generator, sales onboarding system, or investor deck builder.*
