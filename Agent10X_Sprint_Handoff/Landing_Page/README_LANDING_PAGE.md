# 🏛️ AGENT 10X LANDING PAGE V1 — SPRINT HANDOFF & ARCHITECTURE

**Project Code:** `PRJ-AGENT10X-LANDING-PAGE-V1`  
**Brand:** **Agent 10X** (Autonomous Digital Teammates & Recruiter Platform)  
**Parent Attribution:** *"Agent 10X, by GRO10X"* (Engine 1)  
**Primary Live Route:** `public/agent10x/index.html` (Accessible at `https://gro10x-ai.vercel.app/agent10x` and `/agent10x`)  
**Handoff Mirror:** `Agent10X_Sprint_Handoff/Landing_Page/index.html`  
**API Ingress Endpoint:** `/api/agent10x/leads` (Implemented in `src/routes/agent10x.js`)  

---

## 1. Overview & Core Invariants

The Agent 10X V1 Landing Page is a single-file, mobile-first, ultra-responsive conversational landing page engineered for high-conversion lead generation.

### Strict Invariants:
1. **Lead Generation V1 Only**: Zero auto-account provisioning, zero fake social reviews, zero payment checkout gates.
2. **Human-in-the-Loop Guarantee**: *"A real human specialist at GRO10X configures your teammate and reviews your execution plan first."*
3. **Transparent Credit Economy**: 
   - Canonical peg: **`1 Credit = ৳2.00 Taka`** (`$1.00 USD ≈ 60 Credits`).
   - Starter package: **`৳1,000 = 500 Credits`**.
   - Casual conversation & clarifications are 100% free.
   - Reminders setup is free (1 credit per fired execution session).
   - Zero LLM token markups.
4. **Security Invariant**: Strictly zero passwords, credit card numbers, bank accounts, or OTPs requested.
5. **Canonical Domain Compliance**: All production URLs point strictly to `https://gro10x-ai.vercel.app`.

---

## 2. Page Section Architecture

| Section # | Component | Functional Description |
| :--- | :--- | :--- |
| **1** | **Top Navigation** | Geometric Prism X SVG badge, brand title, live enrollment status pill (`● V1 PILOT ENROLLMENT ACTIVE`), and smooth-scroll CTA button `[Start 60s Setup]`. |
| **2** | **Hero Section** | High-status value proposition: *"Your Own Digital Teammate. Working for You on WhatsApp."* Dual CTAs (Personal vs Business), human guarantee badge, and 4 real proof anchors (Hazard CV audit, Sivan Deck-to-Doc, BAGH AI response desk, Maya tech recruiter). |
| **3** | **What It Does** | 6 interactive capability cards: Reminders & Follow-ups, Pitch Deck & Document Extraction, Deep Research, IT & Talent Sourcing, Content Drafting, and Voice Note Admin Offloading. |
| **4** | **Two Teammate Types** | Clear bifurcation: **Card A (Personal Digital Teammate)** (B2C Prepaid, 5 daily free credits, ৳1,000 starter pilot) vs **Card B (Enterprise Recruiter - Maya Mesh)** (B2B Postpaid, 0 monthly retainer lock-in, candidate scorecards). |
| **5** | **Credit Economy** | Banner displaying `1 Credit = 2 Taka` and the 5 foundational transparent pricing rules. |
| **6** | **How It Works** | 3-step walkthrough: 60s Bottleneck Assessment ➔ Specialist Configuration ➔ WhatsApp Execution. |
| **7** | **Conversational Lead Widget** | 1-question-at-a-time conversational intake engine with smooth card transitions, step progress bar, skip options, early done capability, and a final review summary screen with inline editing. |
| **8** | **Payload & Fallback Engine** | Dual-dispatch mechanism: transmits JSON payload to API endpoint with automatic local storage fallback (`agent10x_pending_leads`) and celebratory confirmation view. |
| **9** | **FAQ Accordion** | 6 focused questions addressing data privacy, human-in-the-loop oversight, credit expiration, WhatsApp setup, persona customizations, and B2B postpaid reconciliation. |
| **10** | **Footer** | Mother attribution (*"Agent 10X, by GRO10X"*), mock QR code placeholder for WhatsApp concierge line (`+880 1708-459008`), and canonical domain links. |

---

## 3. Lead Payload JSON Schema

When submitted through the conversational widget, the payload follows this exact schema:

```json
{
  "source": "agent10x_landing_page",
  "submitted_at": "2026-10-29T03:00:00.000Z",
  "type": "Personal | Business",
  "name": "Tanvir Ahmed",
  "whatsapp": "+8801712345678",
  "language": "English | Bangla | Mix",
  "reply_mode": "Text | Voice | Both",
  "purpose": "Summarizing daily client meetings and tech CV parsing",
  "first_thing": "Set up morning WhatsApp briefing at 9:00 AM",
  "business_role": "Founder & CEO",
  "company": "Acme Ventures",
  "deadline": "Within 2 weeks",
  "notes": "Uses Notion and Google Drive",
  "consent_whatsapp": true,
  "language_page": "en"
}
```

### Backend Handling (`src/routes/agent10x.js`):
1. **Validation**: Enforces non-empty `name` and `whatsapp`.
2. **Local Persistence**: Writes atomically to `data/agent10x_leads.json` (with in-memory and `/tmp` fallbacks for serverless environments).
3. **CRM Synchronization**: Ingests into Supabase `leads` table with `engine_tag: 'engine1'` and `stage: 'New Inquiry'`.
4. **Instant Notification**: Triggers Telegram alert with direct 1-tap WhatsApp deep link (`wa.me/<number>`) to the assigned specialist.
5. **Client Fallback**: If offline or server returns an error, the browser gracefully caches the lead under `localStorage['agent10x_pending_leads']` and renders the confirmation screen without disruption.

---

## 4. Verification & Testing Instructions

1. **Local Glass Smoke Test**:
   - Start Mother OS server: `npm start` (or `node server.js`).
   - Open browser at `http://localhost:3000/agent10x`.
   - Verify layout responsiveness on both desktop (1280px) and mobile viewport (390px).

2. **Conversational Widget Walkthrough**:
   - Click `[Start 60s Setup]` in the header.
   - Select `Personal Digital Teammate` or `Business / Recruiter`.
   - Complete Step 2 (Name) and Step 3 (WhatsApp number).
   - Notice the `[Done (Review)]` button appears for rapid completion.
   - Advance through all questions or click `[Skip]` on optional notes.
   - On the Final Review screen, test `[✏️ Edit Answers]` and verify state retention.
   - Click `[Submit Onboarding Request 🚀]`.

3. **Receipt Verification**:
   - Verify confirmation view shows `Thanks [Name]!` and Reference ID.
   - Check `data/agent10x_leads.json` to inspect the newly recorded lead.
   - Check browser DevTools ➔ Application ➔ Local Storage ➔ `agent10x_pending_leads`.

---

**Certified by Mother Agency Portal & Frontend Engineer**  
GRO10X OS Core Team · Dhaka, Bangladesh
