# HRX — AI HR Solution Platform
### Platform Overview for Clients & Investors

**Powered by Gro10x.ai**
Document Version: 1.0 — May 2026

---

## 1. Executive Summary

HRX is an **AI-first, multi-tenant SaaS platform** purpose-built for **employment agencies, IT staffing firms, and modern enterprises** that want to digitize their entire human-resources lifecycle — from recruiting talent to managing payroll — through one unified, intelligent system.

The platform is positioned as a **next-generation alternative** to legacy HRMS products (BambooHR, Zoho People, Keka, Darwinbox), with a deliberate emphasis on:

- **AI-driven recruitment** as the entry product
- **Modular HR suite** unlocked as customers grow
- **Mobile-first employee experience** via a Progressive Web App
- **White-label, tenant-isolated architecture** for agencies serving multiple clients

Launch client: **Dexian** (IT Staffing & Consulting, Dhaka, Bangladesh).
Target markets: South Asia, Middle East, and SaaS export to global staffing firms.

---

## 2. Product Vision

> "Replace fragmented HR tools with one intelligent platform that hires faster, pays accurately, and keeps employees engaged — without the enterprise price tag."

**Three strategic pillars:**

1. **AI as the differentiator** — every module embeds AI assistance (screening, generation, insights, chat).
2. **Land-and-expand** — customers can start with Recruitment-only, then unlock the full HRMS suite.
3. **Built for agencies** — multi-tenant data isolation, per-tenant branding, per-tenant pricing.

---

## 3. Product Modules (26 Total)

The platform delivers **end-to-end HR coverage** across the full employee lifecycle.

### Talent Acquisition
- **AI-Powered Recruitment** — job postings, applicant tracking, AI resume screening, AI job description generator, AI interview question generator
- **Public Careers Portal** — branded, embeddable career pages per tenant
- **Application Management** — full ATS workflow with scoring and shortlisting

### Core HR
- **Employee Management** — profiles, documents, organizational hierarchy
- **Department, Location & Cost Center management**
- **Onboarding Workflows** — guided tenant and employee onboarding
- **Role-Based Access Control** — 8 distinct roles with granular permissions

### Time & Attendance
- **Attendance Tracking** — manual, biometric, and geo-based check-in
- **Shift Management** — flexible shift rosters
- **Leave Management** — multi-policy, balance tracking, approvals
- **Holiday Calendars** — multi-region, multi-religion holiday support

### Payroll & Finance
- **Payroll Processing** — salary structures, bonuses, deductions
- **Tax Configuration** — country-aware tax slabs (currently India, Bangladesh)
- **Expense Management** — claims, approvals, payment proofs
- **Loan Management** — employee loans with EMI tracking
- **Invoicing & Billing** — for agencies billing client companies

### Performance & Growth
- **Performance Management** — goals, reviews, 360° feedback
- **Training & Development** — course assignment and tracking
- **Task Management** — assign and track team tasks

### Operations
- **Asset Management** — laptops, devices, lifecycle tracking
- **Device Management** — MDM-style inventory
- **Approval Workflows** — configurable multi-level approvals
- **Support Tickets** — internal HR helpdesk
- **Announcements** — company-wide communication
- **Reporting Dashboards** — operational and financial reports
- **AI Reports** — natural-language report generation

---

## 4. AI Capabilities (The Differentiator)

HRX uses the **Lovable AI Gateway** to embed leading models (Google Gemini 2.5 Pro/Flash, OpenAI GPT-5) across the product — with **no per-customer API key required**.

| AI Feature | What It Does | Business Value |
|------------|--------------|----------------|
| **AI Resume Screening** | Scores every CV against job requirements, extracts skills, flags gaps | Cuts shortlisting time by ~70% |
| **AI Job Description Generator** | Drafts complete JDs from a few prompts | Recruiters publish jobs 5× faster |
| **AI Interview Question Generator** | Produces role- and candidate-specific question sets | Better, fairer interviews |
| **HR AI Assistant (Admin)** | 24/7 chatbot for HR managers — policies, queries, report generation | Reduces ticket load on HR team |
| **Employee AI Assistant (Mobile)** | Personalized chatbot — leave balance, payslips, attendance | Self-service deflects support |
| **Natural-Language Reports** | "Show me attendance for Q1 by department" → instant report | Insights without SQL |
| **AI Insights Cards** | Proactive nudges on the employee dashboard | Higher engagement |

---

## 5. Architecture & Technology

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui** + **Radix UI** — modern, accessible UI
- **TanStack React Query** — robust data fetching & caching
- **Progressive Web App (PWA)** — installable mobile experience with offline support

### Backend (Lovable Cloud, powered by Supabase)
- **PostgreSQL** database with **104 tables** across 26 modules
- **Row-Level Security (RLS)** on every table — bank-grade data isolation
- **13 serverless Edge Functions** for business logic (AI, registration, bulk imports, credentials, etc.)
- **Real-time subscriptions** for live attendance, notifications, approvals
- **Object Storage** for CVs, payslips, asset documents, payment proofs

### AI Layer
- **Lovable AI Gateway** routing to Gemini 2.5 (Flash & Pro) and GPT-5
- Centralized **`recruitment-ai`** and **`hrx-ai-assistant`** functions
- Context-aware prompts (admin vs. employee vs. recruiter)

### Multi-Tenancy
- Subdomain-based tenant routing (`company.hrx.ai`)
- Tenant-isolated data via RLS + tenant_id scoping
- **Per-tenant module gating** — Super Admin unlocks modules per subscription tier
- Per-tenant branding (logo, colors, careers portal)

### Security
- 8-role RBAC with **SECURITY DEFINER** helper functions (no recursive RLS issues)
- Field-level access controls on sensitive data (salary, PII)
- Rate limiting on all public endpoints
- Input sanitization & audit logging
- Email verification on signup; no anonymous accounts

---

## 6. User Roles

| Role | Scope |
|------|-------|
| HRX Super Admin | Platform-wide (Serviq Technologies) — manages all tenants |
| Company Admin | Full tenant access |
| HR Manager | HR operations |
| Finance Manager | Payroll, expenses, invoicing |
| Department Manager | Department oversight |
| Line Manager | Team approvals |
| Recruiter | Recruitment-only access |
| Employee | Self-service portal & mobile app |

---

## 7. Mobile Employee App (PWA)

A fully-branded, installable mobile experience for employees:

- Dashboard with personalized greeting & AI insights
- One-tap attendance check-in / check-out
- Leave requests & balance tracking
- Payslip download
- Profile & document access
- AI Assistant for instant queries
- Push-notification ready
- **Per-tenant theming** — every customer's app feels like their own

---

## 8. Public Careers Portal

Each tenant gets a branded, public-facing careers site:
- URL: `https://dexianhrx.lovable.app/careers/{tenant-slug}`
- Job listings, job details, application form
- CV upload (anonymous, secure)
- **Embeddable via iframe** into the customer's existing website (e.g., GroUp Academy integration)
- Applications flow directly into the AI-powered ATS

---

## 9. Business Model

### Subscription Tiers (per tenant, monthly)
1. **Recruitment-Only** — entry tier, AI recruitment suite
2. **HR Essentials** — adds employees, attendance, leave
3. **Full HRMS** — adds payroll, performance, finance, all 26 modules
4. **Enterprise** — custom modules, white-label, dedicated support

### Pricing
- Configured in **BDT** for Bangladesh / South Asia launch
- Multi-currency ready
- Per-employee or flat-tier pricing controlled by Super Admin

### Revenue Streams
- Monthly SaaS subscriptions
- Implementation & onboarding services
- Premium AI add-ons (high-volume screening)
- White-label licensing for staffing groups

---

## 10. Current Status

| Area | Status |
|------|--------|
| 26 HRMS Modules | **100% built — no placeholders** |
| AI Recruitment Suite | **Live (Phases 1–3 complete)** |
| HR & Employee AI Assistants | **Live** |
| Public Careers Portal | **Live, embeddable** |
| Mobile PWA | **Live, tenant-themed** |
| Multi-tenant Architecture | **Production-ready** |
| Super Admin Dashboard | **Operational** |
| Security Hardening | **Complete (RLS, RBAC, audit, rate-limit)** |
| Launch Client (Dexian) | **Ready for go-live** |

---

## 11. Competitive Differentiation

| Feature | HRX | Typical HRMS (Zoho/BambooHR/Keka) |
|---------|-----|-----------------------------------|
| AI Recruitment built-in | ✅ Native | ❌ Add-on or absent |
| AI Assistant for employees | ✅ Yes | ❌ No |
| Multi-tenant for agencies | ✅ First-class | ⚠️ Limited |
| Modular gating per tenant | ✅ Yes | ⚠️ Plan-based only |
| Embeddable careers portal | ✅ Yes | ⚠️ Limited |
| Mobile PWA (no app-store needed) | ✅ Yes | ⚠️ Native app only |
| Pricing for South Asia | ✅ BDT-native | ❌ USD-only |

---

## 12. Roadmap Highlights

- **AI Candidate Matching** — recommend best-fit candidates from existing applicant pool
- **AI Skills Assessment** — automated skills validation
- **AI Outreach Templates** — personalized recruiter messaging
- **Earned Wage Access (EWA)** — on-demand salary advances
- **Native mobile apps** (iOS / Android wrappers)
- **Marketplace integrations** — LinkedIn, Indeed, accounting tools
- **Advanced analytics & predictive attrition modeling**

---

## 13. Team & Ownership

- **Built by:** Serviq Technologies / Gro10x.ai
- **Launch client:** Dexian (Dhaka, Bangladesh)
- **Platform branding:** HRX — Your AI HR Solution Platform

---

## 14. Contact

For demos, pilot programs, or investment discussions, reach out via the Gro10x.ai team.

---

*This document is a high-level platform overview. A full technical specification (database schema, API documentation, deployment guide) is available on request.*
