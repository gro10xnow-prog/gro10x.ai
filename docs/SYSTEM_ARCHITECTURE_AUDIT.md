# Ã°Å¸Ââ€ºÃ¯Â¸Â GRO10X OS v2.0 Ã¢â‚¬â€ SYSTEM ARCHITECTURE AUDIT
> **Audit Type:** Comprehensive Platform-Wide Inspection  
> **Auditor:** Principal System Architect & Platform Director (Antigravity)  
> **Audit Date:** October 2, 2026  
> **Codebase Snapshot:** `D:\gro10x.ai` | Supabase Project: `rlgsckzqieikjercfwan`  
> **Production Host:** `https://gro10x-ai.vercel.app`  
> **Runtime:** Node.js v24 LTS Ã‚Â· Express 4.19 Ã‚Â· Supabase PostgreSQL  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Architecture Topology](#2-platform-architecture-topology)
3. [Feature Inventory Matrix](#3-feature-inventory-matrix)
4. [Scalability Risk Register](#4-scalability-risk-register)
5. [Database Schema Health Map](#5-database-schema-health-map)
6. [Security Posture Assessment](#6-security-posture-assessment)
7. [Concurrency & Race Condition Audit](#7-concurrency--race-condition-audit)
8. [Admin Portal Decomposition Blueprint](#8-admin-portal-decomposition-blueprint)
9. [Domain Data Flow Contracts](#9-domain-data-flow-contracts)
10. [Remediation Roadmap & Prioritized Backlog](#10-remediation-roadmap--prioritized-backlog)

---

## 1. Executive Summary

GRO10X OS v2.0 is a **mature, production-deployed multi-engine autonomous operating system** serving 8 distinct stakeholder personas across Agency Sales (Engine 1), AI Sprint Delivery (Engine 2), Digital Commerce (DCE), HR & Finance Operations, and Telegram-powered automation. The platform has completed all 32 sub-phases of PM-4 and Phase 1Ã¢â‚¬â€œ2 of PM-2.

**Audit Verdict: PRODUCTION STABLE Ã¢â‚¬â€ 3 Architectural Risks Require Immediate Remediation Before High-Scale Growth**

| Domain | Health | Verdict |
|---|---|---|
| **API Gateway & Routing** | Ã¢Å“â€¦ Green | 52 mounted route modules, unified gateway |
| **Database Persistence** | Ã¢Å“â€¦ Green | Supabase-primary, JSON fallback confirmed |
| **DB Schema Coverage** | Ã°Å¸Å¸Â¡ Yellow | 65+ tables across 63 migrations, 2 orphaned references |
| **Indexing & Query Perf** | Ã°Å¸Å¸Â¡ Yellow | Core indexes applied, 4 high-cardinality tables unindexed |
| **Concurrency Safety** | Ã°Å¸â€Â´ Red | `readDB()` stampede risk, no advisory locks on state mutations |
| **SSE Real-Time Mesh** | Ã°Å¸Å¸Â¡ Yellow | Single-process `clients[]` array, no multi-pod memory isolation |
| **Security Hardening** | Ã¢Å“â€¦ Green | Pre-Phase backdoors confirmed closed, HSTS+CSP active |
| **Edge Functions** | Ã°Å¸Å¸Â¡ Yellow | 3 deployed, `escrow-sla-governor` status enum mismatch |
| **Cron Workers** | Ã¢Å“â€¦ Green | 5 background crons initialized, Vercel-gated |
| **Public Surface / PII** | Ã¢Å“â€¦ Green | Zero-leakage regex sanitization confirmed |

---

## 2. Platform Architecture Topology

```
                    Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
                    Ã¢â€â€š              GRO10X OS v2.0 Platform                Ã¢â€â€š
                    Ã¢â€â€š       Node.js v24 Ã‚Â· Express 4.19 Ã‚Â· Vercel/PM2       Ã¢â€â€š
                    Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
                                              Ã¢â€â€š
         Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¼Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
         Ã¢â€“Â¼                                    Ã¢â€“Â¼                                    Ã¢â€“Â¼
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â              Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â              Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š  PUBLIC PORTALS  Ã¢â€â€š              Ã¢â€â€š   OPERATIONAL DESK   Ã¢â€â€š              Ã¢â€â€š  ASYNC WORKERS   Ã¢â€â€š
Ã¢â€â€š index.html       Ã¢â€â€š              Ã¢â€â€š /app (Admin Center)  Ã¢â€â€š              Ã¢â€â€š DigiVault Cron   Ã¢â€â€š
Ã¢â€â€š proposal.html    Ã¢â€â€š              Ã¢â€â€š team-miniapp.html    Ã¢â€â€š              Ã¢â€â€š DCE Renewal Cron Ã¢â€â€š
Ã¢â€â€š ai-audit.html    Ã¢â€â€š              Ã¢â€â€š client-miniapp.html  Ã¢â€â€š              Ã¢â€â€š Warranty Cron    Ã¢â€â€š
Ã¢â€â€š sprint.html      Ã¢â€â€š              Ã¢â€â€š manager.html         Ã¢â€â€š              Ã¢â€â€š Defect SLA Cron  Ã¢â€â€š
Ã¢â€â€š partners.html    Ã¢â€â€š              Ã¢â€â€š reviewroom.html      Ã¢â€â€š              Ã¢â€â€š Weekly Exec Cron Ã¢â€â€š
Ã¢â€â€š investors.html   Ã¢â€â€š              Ã¢â€â€š handover-view.html   Ã¢â€â€š              Ã¢â€â€š                  Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ              Ã¢â€â€š contractor-view.html Ã¢â€â€š              Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
         Ã¢â€â€š                        Ã¢â€â€š msa-view.html        Ã¢â€â€š                        Ã¢â€â€š
         Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â´Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â´Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
                                              Ã¢â€â€š
                              Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€“Â¼Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
                              Ã¢â€â€š    Express API Gateway        Ã¢â€â€š
                              Ã¢â€â€š  /api/* Ã¢â‚¬â€ 52 Route Modules    Ã¢â€â€š
                              Ã¢â€â€š  Rate Limit: 300 req/min/IP   Ã¢â€â€š
                              Ã¢â€â€š  JWT Auth Ã‚Â· RBAC Ã‚Â· CSP/HSTS   Ã¢â€â€š
                              Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
                                              Ã¢â€â€š
         Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¼Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
         Ã¢â€“Â¼                    Ã¢â€“Â¼               Ã¢â€“Â¼               Ã¢â€“Â¼                    Ã¢â€“Â¼
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š Supabase     Ã¢â€â€š  Ã¢â€â€š  SSE Engine      Ã¢â€â€š  Ã¢â€â€š Telegram Ã¢â€â€š  Ã¢â€â€š DigiVault    Ã¢â€â€š  Ã¢â€â€š Edge Funcs   Ã¢â€â€š
Ã¢â€â€š PostgreSQL   Ã¢â€â€š  Ã¢â€â€š /api/sync        Ã¢â€â€š  Ã¢â€â€š Bot Mesh Ã¢â€â€š  Ã¢â€â€š Customer Bot Ã¢â€â€š  Ã¢â€â€š escrow-sla   Ã¢â€â€š
Ã¢â€â€š Primary DB   Ã¢â€â€š  Ã¢â€â€š Realtime PubSub  Ã¢â€â€š  Ã¢â€â€š team-bot Ã¢â€â€š  Ã¢â€â€š @digivault   Ã¢â€â€š  Ã¢â€â€š stakeholder  Ã¢â€â€š
Ã¢â€â€š RLS Enforced Ã¢â€â€š  Ã¢â€â€š 25s heartbeat    Ã¢â€â€š  Ã¢â€â€š client   Ã¢â€â€š  Ã¢â€â€š 20bot        Ã¢â€â€š  Ã¢â€â€š -dispatcher  Ã¢â€â€š
Ã¢â€â€š 65+ Tables   Ã¢â€â€š  Ã¢â€â€š Exp. backoff x6  Ã¢â€â€š  Ã¢â€â€š -bot     Ã¢â€â€š  Ã¢â€â€š              Ã¢â€â€š  Ã¢â€â€š stripe-hook  Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
         Ã¢â€â€š
         Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Fallback Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
                  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
                  Ã¢â€â€š  Local JSON Resilience Cache (data/db.json) Ã¢â€â€š
                  Ã¢â€â€š  Read-Only Fallback Ã‚Â· 505 KB Snapshot        Ã¢â€â€š
                  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ
```

---

## 3. Feature Inventory Matrix

> **Legend:** `[LIVE]` = Supabase-backed Ã‚Â· `[DUAL]` = Supabase + JSON fallback Ã‚Â· `[MOCK]` = Static/in-memory Ã‚Â· `[ORPHAN]` = UI with no backend Ã‚Â· `[DEBT]` = Schema exists but route/index missing

### 3.1 Engine 1 Ã¢â‚¬â€ Inbound Sales & Client Portal

| Feature | Route / File | Status |
|---|---|---|
| Landing Page & Catalog | `GET /api/services` | `[LIVE]` |
| Lead Intake Form | `POST /api/leads` | `[LIVE]` Ã¢â‚¬â€ Supabase + Resend + Telegram |
| AI Diagnostic Scorecard | `public/ai-audit.html` | `[LIVE]` Ã¢â‚¬â€ 0-100 algorithmic scoring |
| Sprint Cohort Application | `public/sprint.html` | `[LIVE]` |
| Service Detail Page | `public/service-detail.html` | `[LIVE]` Ã¢â‚¬â€ taxonomy 3-step fallback |
| Proposal Studio (Public Token) | `GET /api/proposals/public/:token` | `[LIVE]` Ã¢â‚¬â€ Supabase-primary since PM-4 Ph1.1 |
| Proposal Accept/Sign | `POST /api/proposals/:id/accept` | `[LIVE]` Ã¢â‚¬â€ SSE + Telegram + Resend |
| Proposal Ã¢â€ â€™ Project Conversion | `POST /api/proposals/:id/convert-to-project` | `[LIVE]` Ã¢â‚¬â€ client_id bug fixed Pre-9 |
| Magic Link Onboarding | `GET /api/auth/magic-link` | `[LIVE]` |
| Client Portal (SPA) | `public/client-miniapp.html` | `[LIVE]` Ã¢â‚¬â€ JWT, retainer, review room |
| Retainer Hours Burndown | `GET /api/projects/:id/retainer` | `[LIVE]` Ã¢â‚¬â€ retainer_banks table |
| 30-Day Warranty Countdown | `warranty-cron.js` | `[LIVE]` Ã¢â‚¬â€ non-Vercel setInterval |
| Deliverable Review Room | `public/reviewroom.html` | `[LIVE]` Ã¢â‚¬â€ reviews + comments |
| Handover Manifest Signing | `POST /api/projects/:id/handover/sign` | `[LIVE]` Ã¢â‚¬â€ dual-signature |
| Affiliate UTM Attribution | `GET /api/affiliates/track` | `[LIVE]` |
| Partners Portal | `public/partners.html` | `[LIVE]` |
| Investor Page | `public/investors.html` | `[ORPHAN]` Ã¢Å¡Â Ã¯Â¸Â Ã¢â‚¬â€ no DB tables, no API route |
| WhatsApp Campaign Builder | `public/whatsapp-campaign.html` | `[ORPHAN]` Ã¢Å¡Â Ã¯Â¸Â Ã¢â‚¬â€ UI only, no endpoint |
| NHF Proposal | `public/nhf.html` | `[LIVE]` |
| MSA View | `public/msa-view.html` | `[LIVE]` Ã¢â‚¬â€ msa-generator.js |

### 3.2 Engine 2 Ã¢â‚¬â€ AI Sprints & Delivery Pods

| Feature | Route / File | Status |
|---|---|---|
| Delivery Pod Allocation | `POST /api/projects/:id/pod` | `[LIVE]` |
| Zero-Miscommunication Lock-In Cockpit | `POST /api/clients/:id/lockin` | `[LIVE]` |
| Prerequisite Credentials Tracker | `PATCH /api/projects/:id/prerequisites` | `[LIVE]` |
| COGS Ledger | `POST /api/projects/:id/cogs` | `[LIVE]` Ã¢â‚¬â€ cogs_claims table |
| Scope Change Order Approval | `POST /api/projects/:id/change-orders` | `[LIVE]` |
| Contractor Gateway | `public/contractor-view.html` | `[LIVE]` Ã¢â‚¬â€ 100% financial masking |
| Deliverable Dispute Protocol | `POST /api/projects/:id/disputes` | `[LIVE]` Ã¢â‚¬â€ warranty freeze |
| SLA Holdback (15% escrow) | `POST /api/tickets/:id/sla-holdback` | `[LIVE]` |
| Escrow SLA Governor | `supabase/functions/escrow-sla-governor` | `[LIVE]` Ã¢â‚¬â€ status enum bug Ã¢Å¡Â Ã¯Â¸Â |
| Sprint Retrospective Archive | `POST /api/projects/:id/retrospective` | `[LIVE]` |
| Pod Capacity Tracking | `GET /api/team/capacity` | `[LIVE]` |
| Weekly Executive Flash Report | `weekly-executive-cron.js` | `[LIVE]` Ã¢â‚¬â€ Sunday 7AM Telegram |
| Defect SLA Escalation | `defect-escalation-cron.js` | `[LIVE]` Ã¢â‚¬â€ every 2h |
| MSA Agreement Generation | `src/services/msa-generator.js` | `[LIVE]` |

### 3.3 DCE Ã¢â‚¬â€ Digital Commerce Empire

| Feature | Route / File | Status |
|---|---|---|
| DCE Catalog | `GET /api/dce/products` | `[LIVE]` |
| DCE Orders | `POST /api/dce/orders` | `[LIVE]` |
| DCE Fulfillment | `PATCH /api/dce/fulfillment/:id` | `[LIVE]` |
| DCE Helpdesk | `POST /api/dce/helpdesk` | `[LIVE]` |
| DCE Settlements | `GET /api/dce/settlements` | `[LIVE]` |
| Etsy OS Integration | `src/services/etsy.js` | `[LIVE]` |
| DigiStore (Multi-channel) | `digistore.js` | `[LIVE]` |
| Flow Simulator | `public/flow-simulator.html` | `[ORPHAN]` Ã¢Å¡Â Ã¯Â¸Â Ã¢â‚¬â€ visual only |

### 3.4 Core OS Ã¢â‚¬â€ HR, Finance & Operations

| Feature | Route / File | Status |
|---|---|---|
| Team Profiles & Roster | `GET /api/team` | `[LIVE]` |
| PIN Authentication | `POST /api/auth/verify-pin` | `[LIVE]` |
| EOD Reports | `POST /api/eod` | `[LIVE]` |
| Leave Management | `POST /api/leaves` | `[LIVE]` Ã¢â‚¬â€ Telegram approval |
| Attendance Clock-In/Out | `POST /api/team/clock-in` | `[LIVE]` |
| Multi-Rail Payments | `POST /api/payments` | `[LIVE]` Ã¢â‚¬â€ bKash/Nagad OCR |
| Invoice Management | `GET /api/invoices` | `[LIVE]` |
| Expense Approval (3-Tier) | `POST /api/expenses` | `[LIVE]` |
| Support Tickets | `POST /api/tickets` | `[LIVE]` |
| Kanban Board | `GET /api/tasks` | `[LIVE]` |
| Social Content OS | `GET /api/posts` | `[LIVE]` |
| Content AI Generator | `POST /api/ai/generate-post` | `[LIVE]` Ã¢â‚¬â€ Gemini 2.0 |
| Brands Empire | `GET /api/brands` | `[DUAL]` Ã¢â‚¬â€ 5.5MB JSON fallback |
| Meet Copilot | `POST /api/meet-copilot` | `[DUAL]` Ã¢â‚¬â€ JSON analytics fallback |
| Platform Registry | `GET /api/platforms` | `[LIVE]` Ã¢â‚¬â€ Oct 2026 migration |
| XP & Gamification | `PATCH /api/team/:id/xp` | `[LIVE]` |
| Webhook Subscriptions | `GET /api/webhooks` | `[DEBT]` Ã¢Å¡Â Ã¯Â¸Â Ã¢â‚¬â€ no admin UI |
| Portal State | `portal.js` | `[DEBT]` Ã¢Å¡Â Ã¯Â¸Â Ã¢â‚¬â€ JSON-only, no Supabase table |

---

## 4. Scalability Risk Register

### Ã°Å¸â€Â´ RISK-1 Ã¢â‚¬â€ `readDB()` Cache Stampede (CRITICAL)

**File:** `src/services/db.js:71Ã¢â‚¬â€œ131`

`readDB()` has a 15-second TTL. On cache expiry, **every concurrent caller** issues a 19-table `Promise.all()` waterfall simultaneously Ã¢â‚¬â€ 19 parallel `SELECT *` queries per request, across all simultaneous callers. This is a textbook **thundering herd / cache stampede**.

```js
// db.js:86 Ã¢â‚¬â€ cache miss triggers 19 parallel queries per concurrent caller
if (!forceFresh && cachedDBState && (now - lastCacheTime < CACHE_TTL_MS)) {
  return cachedDBState; // hit
}
// Miss: 19 SELECT * queries fire simultaneously for each waiting caller
```

**Hard limits that become grenades at scale:**
- `tasks`: `SELECT * LIMIT 5000` Ã¢â‚¬â€ JSONB columns (labels, tags) can be 50KB+ per row
- `eod_reports`, `attendance`, `invoices`: Same 5000-row `SELECT *`
- Total data per cache miss: potentially 50Ã¢â‚¬â€œ200MB pulled into Node.js memory

**Fix:** Single-flight promise coalescing in `readDB()`.

---

### Ã°Å¸â€Â´ RISK-2 Ã¢â‚¬â€ SSE `clients[]` Not Process-Safe (HIGH)

**File:** `src/services/sse.js:8`

```js
let clients = []; // Module-level Ã¢â‚¬â€ dies per process
```

Under PM2 cluster or Vercel multi-instance: each worker has its own isolated `clients[]`. A Telegram callback on Process A cannot SSE-push to a browser on Process B. The Supabase Realtime pub/sub partially bridges this, but the `reconnectAttempts < 6` hard limit means the bridge silently dies after ~63 seconds of Supabase channel instability.

**Fix:** Remove the `< 6` cap (line 77). For PM2 cluster: add Redis pub/sub adapter.

---

### Ã°Å¸Å¸Â  RISK-3 Ã¢â‚¬â€ No Locks on Financial State Mutations (HIGH)

**Files:** `src/services/retainer-bank.js`, `src/routes/affiliates.js`

All retainer burn-down and payout operations are **read-then-write without pessimistic locking**. Two simultaneous crew members logging hours produces a lost update. Two payout requests produce duplicate `affiliate_payouts` rows.

**Fix:** Supabase RPC with `SELECT ... FOR UPDATE`. See Section 7.

---

### Ã°Å¸Å¸Â  RISK-4 Ã¢â‚¬â€ Unindexed High-Query Tables (HIGH)

**Files:** `supabase/migrations/20260926_v7.0_*.sql`

Four tables missing critical indexes:

| Table | Missing Index | Caller |
|---|---|---|
| `projects` | `(warranty_until) WHERE warranty_until IS NOT NULL` | `warranty-cron.js` |
| `tickets` | `(status, created_at)` | `defect-escalation-cron.js` |
| `sla_holdbacks` | `(status)` | `escrow-sla-governor` Edge Fn |
| `affiliate_conversions` | `(affiliate_id, status)` | `GET /api/affiliates/:id` |

---

### Ã°Å¸Å¸Â¡ RISK-5 Ã¢â‚¬â€ Vercel Cron Coverage Gap (MEDIUM)

**File:** `server.js:124`

All 5 `setInterval` workers are **skipped on Vercel** (`!process.env.VERCEL`). The `vercel.json` 26-cron configuration must fully cover: warranty check, defect SLA sweep, DCE renewal, DigiVault sync, and weekly exec report. Not verified by automated test.

---

## 5. Database Schema Health Map

### 5.1 Migration Chain Summary (63 Migrations Applied)

| Version Range | Key Tables Added |
|---|---|
| v0.6Ã¢â‚¬â€œv1.5 | `profiles`, `tasks`, `clients`, `projects`, `invoices`, `expenses`, bot states |
| v2.0Ã¢â‚¬â€œv4.4 | `social_posts`, `social_brands`, `digi_products`, `services`, Chrome ext tables |
| v5.0Ã¢â‚¬â€œv5.6 | `dce_orders`, `dce_catalog_*`, `dce_settlements`, `dce_helpdesk` |
| v6.0 | `change_orders`, `cogs_claims`, `retainer_banks`, `handover_manifests`, `project_disputes`, `sla_holdbacks`, `affiliates`, `sprint_retrospectives` |
| v6.1 | `webhook_subscriptions`, `webhook_deliveries` |
| v7.0 | Composite B-tree indexes on 7 core tables |
| Oct 2026 | `platforms` registry |

### 5.2 Index Coverage Assessment

| Table | Coverage Status |
|---|---|
| `tasks` | Ã¢Å“â€¦ `(client_id, stage)`, `(priority, due_date)`, `(assigned_to)` |
| `invoices` | Ã¢Å“â€¦ `(client_id, status)`, `(due_date)` |
| `leads` | Ã¢Å“â€¦ `(stage, score)` |
| `profiles` | Ã¢Å“â€¦ `(emp_code)`, `(role)`, `(email)` |
| `projects` | Ã¢Å¡Â Ã¯Â¸Â MISSING: `(warranty_until) WHERE NOT NULL` |
| `tickets` | Ã¢Å¡Â Ã¯Â¸Â MISSING: `(status, created_at)` composite |
| `sla_holdbacks` | Ã¢Å¡Â Ã¯Â¸Â MISSING: `(status)` index |
| `affiliate_conversions` | Ã¢Å¡Â Ã¯Â¸Â MISSING: `(affiliate_id, status)` composite |

### 5.3 Schema Integrity Issues

| Issue | Location | Impact |
|---|---|---|
| `escrow-sla-governor` uses `status = "HELD"` | Edge Fn vs. migration default `"HELD_IN_ESCROW"` | Escrow never released automatically |
| `warranty-cron.js` requires `memoryProjects` from `post-delivery.js` | `post-delivery.js` exports no such Map | Silent fallback failure in warranty scan |
| `portal_state` has no Supabase table | `portal.js` reads JSON only | Portal state not persisted to DB |

---

## 6. Security Posture Assessment

### 6.1 Backdoor Status (PM-4 Pre-Phase Ã¢â‚¬â€ All Confirmed Closed)

| Backdoor | Status |
|---|---|
| Master PINs `1234`, `1010`, `101010` in `auth-pins.js` | Ã¢Å“â€¦ REMOVED |
| `mock_qa_token_enterprise` bypass in `auth.js` | Ã¢Å“â€¦ REMOVED |
| `gro10x_token` cookie not cleared on logout | Ã¢Å“â€¦ FIXED |

### 6.2 Security Headers

| Header | Status |
|---|---|
| `X-Content-Type-Options: nosniff` | Ã¢Å“â€¦ Active |
| `X-Frame-Options: SAMEORIGIN` | Ã¢Å“â€¦ Active |
| `Strict-Transport-Security` (HSTS, 1yr) | Ã¢Å“â€¦ Active (HTTPS only) |
| `Content-Security-Policy` | Ã°Å¸Å¸Â¡ `unsafe-inline` + `unsafe-eval` present Ã¢â‚¬â€ XSS risk surface |
| `Referrer-Policy: strict-origin-when-cross-origin` | Ã¢Å“â€¦ Active |

### 6.3 Contractor Financial Masking

- Ã¢Å“â€¦ Client budget, invoice amounts, bill rates stripped at `project-access.js` service layer
- Ã¢Å“â€¦ Escrow milestone amounts visible (not total project value)
- Ã¢Å“â€¦ No internal developer contacts in public Telegram dispatch

---

## 7. Concurrency & Race Condition Audit

### 7.1 Retainer Burn-Down (Unsafe Ã¢â‚¬â€ Fix Required)

**Current (unsafe read-then-write):**
```js
const bank = await supabase.from('retainer_banks').select('*').eq('project_id', id).single();
const newHours = bank.data.hours_used + loggedHours; // Ã¢â€ Â race window
await supabase.from('retainer_banks').update({ hours_used: newHours }).eq('project_id', id);
```

**Required Supabase RPC:**
```sql
CREATE OR REPLACE FUNCTION burn_retainer_hours(
  p_project_id TEXT, p_hours NUMERIC, p_description TEXT, p_logged_by TEXT
) RETURNS JSONB AS $$
DECLARE v_bank retainer_banks%ROWTYPE;
BEGIN
  SELECT * INTO v_bank FROM retainer_banks
    WHERE project_id = p_project_id FOR UPDATE; -- Pessimistic lock
  IF NOT FOUND THEN RAISE EXCEPTION 'Retainer bank not found'; END IF;
  UPDATE retainer_banks
    SET hours_used = hours_used + p_hours,
        status = CASE
          WHEN (hours_used + p_hours) / total_purchased_hours >= 1.0 THEN 'critical_overage'
          WHEN (hours_used + p_hours) / total_purchased_hours >= 0.75 THEN 'nearing_capacity'
          ELSE 'healthy' END,
        updated_at = NOW()
    WHERE project_id = p_project_id;
  INSERT INTO retainer_hours_logs (id, project_id, hours, task_description, logged_by, logged_at)
    VALUES (gen_random_uuid()::TEXT, p_project_id, p_hours, p_description, p_logged_by, NOW());
  RETURN jsonb_build_object('success', true, 'hours_burned', p_hours);
END;
$$ LANGUAGE plpgsql;
```

### 7.2 Affiliate Payout Double-Disbursement

Add `disbursement_ref TEXT UNIQUE` to `affiliate_payouts`. Use `INSERT ... ON CONFLICT DO NOTHING` with a client-generated idempotency key.

### 7.3 SLA Holdback Duplicate Creation

Add `UNIQUE (ticket_id)` constraint to `sla_holdbacks` with `ON CONFLICT DO NOTHING`.

---

## 8. Admin Portal Decomposition Blueprint

### 8.1 Current Surface Assessment

The admin surface is **distributed** (not a monolith in this codebase):

| File | Size | Role |
|---|---|---|
| `public/team-miniapp.html` | 90KB | Crew ops, payslips, tasks, EOD |
| `public/manager.html` | 66KB | Finance overview, DCE, brand Kanban |
| `public/client-miniapp.html` | 66KB | Client partner portal |
| `public/admin.html` | 1.4KB | Redirect stub only |

The implicit admin surface is the SPA at `/app` (unmapped, routed via subdomain middleware).

### 8.2 Target Operational Desk Architecture

```
/app (Admin Command Center Ã¢â‚¬â€ hash-routed SPA)
Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#overview       Ã¢â€ â€™ KPIs, ARR pacing, active clients, open tasks
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#crm            Ã¢â€ â€™ Leads Kanban + 360Ã‚Â° client hub + proposals
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#projects       Ã¢â€ â€™ All-engine project board + pod assignments + COGS
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#finance        Ã¢â€ â€™ Invoices, payments, expenses (3-tier approval)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#hr             Ã¢â€ â€™ Team, leaves, EOD, attendance, assets, payslips
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#warranty       Ã¢â€ â€™ Warranty horizon, disputes, escrow release
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#content        Ã¢â€ â€™ Social posts, brand planner, content scheduler
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#dce            Ã¢â€ â€™ DCE orders, fulfillment, helpdesk, settlements
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#digistore      Ã¢â€ â€™ DigiStore + Etsy OS + multi-channel listings
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#affiliates     Ã¢â€ â€™ B2B partners, conversions, payout approval
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#platforms      Ã¢â€ â€™ Platform registry + health status board
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ /app#webhooks       Ã¢â€ â€™ Webhook subscription CRUD + delivery logs
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ /app#settings       Ã¢â€ â€™ App settings, bot status, cron health, env check
```

### 8.3 Design System Principles

- **Dark cockpit:** `bg-gray-900` base, `emerald-500` accent, `white/90` primary text
- **Progressive disclosure:** Section KPI summary Ã¢â€ â€™ expand for drill-down table
- **Zero hardcoded URLs:** `window.location.origin` + `process.env.BASE_URL`
- **Real-time SSE:** Each desk subscribes to its relevant event types on mount
- **Cmd+K command palette:** Global quick-action launcher across all desks

---

## 9. Domain Data Flow Contracts

### 9.1 Lead Ã¢â€ â€™ Proposal Ã¢â€ â€™ Project

```
POST /api/leads
  Ã¢â€ â€™ INSERT leads (Supabase)
  Ã¢â€ â€™ Resend email + Telegram Owner alert
  Ã¢â€ â€œ
POST /api/proposals
  Ã¢â€ â€™ INSERT proposals (Supabase-primary)
  Ã¢â€ â€™ Telegram preview link to Owner
  Ã¢â€ â€œ
GET /api/proposals/public/:token  [no auth]
POST /api/proposals/:id/accept
  Ã¢â€ â€™ UPDATE proposals.status = 'Accepted'
  Ã¢â€ â€™ SSE broadcast: 'proposal_update'
  Ã¢â€ â€™ Resend client accepted email
  Ã¢â€ â€œ
POST /api/proposals/:id/convert-to-project
  Ã¢â€ â€™ INSERT projects (with client_id Ã¢Å“â€¦)
  Ã¢â€ â€™ Magic Link dispatch via Resend
  Ã¢â€ â€™ SSE broadcast: 'project_created'
```

### 9.2 Project Ã¢â€ â€™ Warranty Ã¢â€ â€™ Escrow

```
delivery_status = 'DELIVERED'
  Ã¢â€ â€™ warranty_until = delivered_at + 30 days
  Ã¢â€ â€œ
warranty-cron.js (every 6h)
  Ã¢â€ â€™ 7-day advance: Telegram alert
  Ã¢â€ â€™ 1-day final: Last-call dispatch
  Ã¢â€ â€™ Expiry: UPDATE delivery_status = 'WARRANTY_CLOSED'
  Ã¢â€ â€™ escrow-sla-governor Edge Fn: RELEASE sla_holdbacks

POST /api/projects/:id/disputes  [dispute raised]
  Ã¢â€ â€™ INSERT project_disputes
  Ã¢â€ â€™ UPDATE projects.dispute_paused_at = NOW()  Ã¢â€ Â WARRANTY FROZEN
  Ã¢â€ â€™ Telegram escalation to Owner
```

### 9.3 Retainer Bank Contract

```
POST /api/projects/:id/retainer/log-hours  Ã¢â€ Â NEEDS RPC LOCK
  Ã¢â€ â€™ RPC burn_retainer_hours() [atomic]
  Ã¢â€ â€™ INSERT retainer_hours_logs
  Ã¢â€ â€™ UPDATE retainer_banks.hours_used + status recalculation
  Ã¢â€ â€™ if nearing_capacity: Telegram alert
  Ã¢â€ â€™ SSE broadcast: 'retainer_update' to client
```

---

## 10. Remediation Roadmap & Prioritized Backlog

### Ã°Å¸â€Â´ TIER 1 Ã¢â‚¬â€ Immediate (Before Scale Event)

| ID | Issue | Files | Effort |
|---|---|---|---|
| **FIX-001** | Single-flight coalescing in `readDB()` Ã¢â‚¬â€ prevent stampede | `src/services/db.js` | 4h |
| **FIX-002** | `burn_retainer_hours` RPC with `FOR UPDATE` | Migration + `retainer-bank.js` | 6h |
| **FIX-003** | Idempotency key on affiliate payout INSERT | `affiliates.js` + migration | 2h |
| **FIX-004** | `UNIQUE(ticket_id)` on `sla_holdbacks` | Migration | 1h |
| **FIX-005** | Fix `sla_holdbacks` status enum: `"HELD"` Ã¢â€ â€™ `"HELD_IN_ESCROW"` in Edge Fn | `escrow-sla-governor/index.ts` | 1h |
| **FIX-006** | Remove dead `memoryProjects` import in `warranty-cron.js` | `warranty-cron.js` | 1h |
| **FIX-007** | Remove SSE `reconnectAttempts < 6` hard limit | `src/services/sse.js:77` | 30min |

### Ã°Å¸Å¸Â  TIER 2 Ã¢â‚¬â€ High Priority (Sprint 2)

| ID | Issue | Files | Effort |
|---|---|---|---|
| **IDX-001** | Partial index on `projects(warranty_until) WHERE NOT NULL` | Migration | 1h |
| **IDX-002** | Composite index on `tickets(status, created_at)` | Migration | 30min |
| **IDX-003** | Index on `sla_holdbacks(status)` | Migration | 30min |
| **IDX-004** | Composite index on `affiliate_conversions(affiliate_id, status)` | Migration | 30min |
| **ARCH-001** | ~~Audit all 26 Vercel cron paths against `cron.js` handlers~~ **âœ… DONE** â€” 26/26 matched. Added `authorizeCron` to 7 unprotected handlers | `vercel.json` + `cron.js` | âœ… Done |
| **ARCH-002** | ~~Replace CSP `unsafe-eval` with nonce-based policy~~ **âœ… DONE** â€” `unsafe-eval` removed. Explicit `script-src`/`style-src` added | `server.js` | âœ… Done |
| **UI-001** | ~~Wire `investors.html` to backend or archive~~ **âœ… RECLASSIFIED** â€” Static pitch deck (`noindex`). No API needed | `public/investors.html` | âœ… Closed |
| **UI-002** | ~~Wire `whatsapp-campaign.html` to campaign dispatch~~ **âœ… RECLASSIFIED** â€” Static copy-paste message composer. Zero API calls confirmed | Static only | âœ… Closed |

### Ã°Å¸Å¸Â¡ TIER 3 Ã¢â‚¬â€ Tech Debt (Sprint 3+)

| ID | Issue | Effort |
|---|---|---|
| **DEBT-001** | ~~Replace `readDB()` in hot routes with direct Supabase targeted queries~~ **✅ DONE** — Projects/Tasks use direct indexed Supabase queries | ✅ Done |
| **DEBT-002** | ~~Replace `SELECT *` with column-projected queries throughout `db.js`~~ **✅ DONE** — Key tables restricted to projected fields & smaller batch limits | ✅ Done |
| **DEBT-003** | ~~Build Webhook Subscription Manager UI (`/app#webhooks`)~~ **✅ DONE** — SPA module created with HMAC specs & subscription CRUD | ✅ Done |
| **DEBT-004** | ~~Modularize `manager.html` Finance Ledger into `/app#finance`~~ **✅ DONE** — Finance Desk isolated in Command Center | ✅ Done |
| **DEBT-005** | ~~Add Redis pub/sub SSE adapter for PM2 cluster multi-process sync~~ **✅ DONE** — `src/services/redis-pubsub.js` adapter hooked into SSE | ✅ Done |
| **DEBT-006** | ~~Archive `flow-simulator.html` or wire to state machine backend~~ **✅ DONE** — Demarcated with internal sandbox gating | ✅ Done |

---

## Appendix A Ã¢â‚¬â€ Supabase Storage Buckets

| Bucket | Access | Purpose |
|---|---|---|
| `review-assets` | Public | Deliverable video/image uploads |
| `social-assets` | Public | Social post media |
| `payment-proofs` | Private | MFS transaction screenshots |
| `expenses` | Private | Expense receipts |
| `avatars` | Public | Profile photos |
| `brand-assets` | Public | Brand logos and visual kit |
| `digi-payments` | Public | DigiVault payment confirmations |
| `deliverables` | Public | Final project deliverable files |
| `product-screenshots` | Public | DCE product imagery |

## Appendix B Ã¢â‚¬â€ Edge Function Deployment Status

| Function | Purpose | Status |
|---|---|---|
| `escrow-sla-governor` | Warranty close + escrow release | Ã¢Å“â€¦ Deployed Ã¢â‚¬â€ status enum bug (FIX-005 required) |
| `stakeholder-event-dispatcher` | DB webhook fanout | Ã¢Å“â€¦ Deployed Ã¢â‚¬â€ HMAC signing active |
| `stripe-payment-webhook` | Stripe payment processing | Ã¢Å“â€¦ Deployed |

---

*Audit compiled by Platform Director (Antigravity) | GRO10X OS v2.0 | October 2, 2026*  
*Next audit checkpoint: After Tier 1 remediations applied and verified via `npm run check:prod`*
