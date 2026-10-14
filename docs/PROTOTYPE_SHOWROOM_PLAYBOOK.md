# 🧪 GRO10X Foundry Lab: Prototype Showroom & Pre-Sales Playbook

**Owner**: GRO10X Holdings Chief of Staff & Virtual CTO  
**Division**: Engine 4 (Foundry 10X / Venture Incubation)  
**Status**: 🟢 **OPERATIONAL STANDARD**  

---

## 1. Executive Summary & Market Reality

In early client discovery conversations, speed-to-prototype is the single highest-converting sales lever. However, creating a standalone Git repository, allocating a conglomerate port, provisioning a Vercel project, and populating dummy client records in the production database for every unclosed pitch creates:
1. **Repository & Infrastructure Sprawl**: Dozens of dead/abandoned repos and orphaned Vercel links.
2. **Database & Metric Contamination**: Dummy clients skewing ARR, CRM conversion funnels, and retainer ledgers.
3. **Operational Drag**: Founder wasting hours configuring build pipelines instead of closing deals.

### The Standardized Solution
All pre-sales prototypes live inside **Mother OS (`gro10x.ai`)** within the **Central Prototype Showroom** (`public/prototypes/<slug>/`). They are served directly from Mother OS with instant zero-build deployment, zero port collision, and unified domain authority.

---

## 2. The 2-Stage Venture Incubation Lifecycle

```
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: PRE-SALES INCUBATION (Mother OS Showroom)                     │
│ • Client: Prospect / Lead in Mother OS CRM                             │
│ • Location: public/prototypes/<slug>/                                  │
│ • Link: https://gro10x.ai/prototypes/<slug>/                          │
│ • Workforce: Handled by "Foundry Lab & Rapid Prototyper" in 1 Chat     │
│ • Database: Zero dummy database records created                        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                     Client Signs MSA & Retainer
                     (e.g. INV-2026-012 Paid)
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: CHARTERED SATELLITE VENTURE (Foundry 10X Product)             │
│ • Client: Verified Enterprise Client (CLI-XXXX)                        │
│ • Port: Dedicated Conglomerate Port (e.g. 5000, 6000, 7000)            │
│ • Repo: Standalone Repository (e.g. D:\Purple Bot)                     │
│ • Workforce: Dedicated Venture CoS + 4-Squad Digital Employees         │
│ • Telemetry: Connected via Mother OS Satellite Bridge                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dedicated Digital Employee Specification

To manage this pipeline without polluting satellite engineering squads, we establish a single top-level digital employee in Mother OS:

### Digital Employee: **Foundry Lab Director & Rapid Prototyper**
* **Primary Scope**: Mother OS Pre-Sales, Rapid Ideation & Interactive Client Demos.
* **Top-Level Antigravity Conversation Name**: `[GRO10X] Foundry Lab & Rapid Prototyper`
* **Responsibilities**:
  1. Ingest prototype code from Gemini Chat, Claude, Figma, or raw HTML/JS scripts.
  2. Normalize and package prototypes into `public/prototypes/<slug>/index.html`.
  3. Ensure zero-dependency, CDN-backed, highly responsive WebGL/Tailwind/CSS execution.
  4. Generate shareable, client-ready URLs on `gro10x.ai` with QR codes and social share hooks.
  5. Coordinate with B2B Deal Officer to link the prototype to the CRM Opportunity.

---

## 4. Current Showroom Catalog (As of October 2026)

| Prototype Slug | Client / Prospect | Concept / Domain | URL Path | Status |
| :--- | :--- | :--- | :--- | :--- |
| **`jam-space`** | JAM SPACE | 3D WebGL Room Builder & Delusion Receipt | [`/prototypes/jam-space/index.html`](file:///d:/gro10x.ai/public/prototypes/jam-space/index.html) | 🟢 Live in Showroom |
| **`nhf`** | National Housing Finance | Executive Board Proposal & Mortgage Engine | [`/nhf_board_proposal.html`](file:///d:/gro10x.ai/public/nhf_board_proposal.html) | 🟢 Live in Showroom |
| **`serviq`** | Serviq | Commercial Shield & B2B Content Engine | [`/serviq_pilot_content_calendar.html`](file:///d:/gro10x.ai/serviq_pilot_content_calendar.html) | 🟢 Live in Showroom |

---

## 5. Promotion Protocol: From Prototype to Venture

When a prospective client approves a prototype and executes an agreement:
1. **Issue Retainer Invoice**: Mother OS Finance Agent issues `INV-2026-XXX`.
2. **Requisition Approval**: Central CoS approves Venture Charter Requisition (`REQ-VENTURE-XXXX`).
3. **Port Assignment**: Allocate next consecutive conglomerate port (`Port 7000+`).
4. **Repository Scaffold**: Initialize new satellite directory with baseline JDEs.
5. **Promote Prototype Code**: Port showroom prototype assets into the new venture repo's `public/` or SPA build tree.
