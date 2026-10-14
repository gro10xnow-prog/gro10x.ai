# 🚀 Agent 10X (Engine 1) — Master Product Requirements Document (PRD) & Technical Specification

> **Product Name**: **Agent 10X**  
> **Classification**: Engine 1 — Conversational Digital Employee Platform & Persona Network  
> **Target Version**: `v1.0.0-MVP`  
> **Status**: Ready for Founder Approval & Technical Execution

---

## 1. Executive Summary & Vision

**Agent 10X** transforms AI from an intimidating, DIY software tool into an intuitive **conversational employment experience**. 

Instead of forcing business owners to configure prompts, fine-tune vector embeddings, or manage complex admin settings, Agent 10X delivers a **web-first PWA modeled on the look and feel of WhatsApp Web and Telegram Web**. 

A business owner signs up, has their company profile built conversationally by an AI Business Profiler, chats with an AI Hiring Manager to select a pre-trained **Business Development Executive (BDE)** from the bench, and manages their new digital employee entirely through chat.

Simultaneously, the internal team uses a hybrid **Visual Control Studio + Internal Super-Agent** to birth, train, and manage digital personas, backed by an **Encrypted Credential & Digital Life Vault** that preserves every agent's LinkedIn, Facebook, email, and phone identity from Day 1.

---

## 2. System Architecture & Dual-Plane Layout

```mermaid
flowchart TD
    subgraph ClientPlane [Client Plane: Web-First PWA (WhatsApp / Telegram UX)]
        PWA["Agent 10X PWA (Desktop & Mobile)"]
        Auth["Persistent Auth (Phone/Email + @username, 90-Day Token)"]
        ChatInbox["Unified Chat Inbox & Contact Mesh"]
        AgentProfile["Business Profiler Agent (Catalogs & Services)"]
        AgentHR["Digital Hiring Manager Agent (Bench Match & Hire)"]
        AgentBDE["Deployed Digital Employee (BDE: Tasks & EOD Reports)"]
        CreditWallet["Credit Economy & Top-Up Wallet"]

        PWA --> Auth
        PWA --> ChatInbox
        ChatInbox --> AgentProfile
        ChatInbox --> AgentHR
        ChatInbox --> AgentBDE
        ChatInbox --> CreditWallet
    end

    subgraph InternalPlane [Internal Team Plane: Agent Factory & Operations]
        SuperAgent["Internal Super-Agent (Conversational Provisioning)"]
        VisualStudio["Visual Tuning Studio (Chatbase 60% Baseline)"]
        Bench["Agent Bench & Talent Marketplace"]
        CredentialVault["Encrypted Digital Life & Identity Vault (LinkedIn, FB, Email, SIM)"]
        KnowledgeRAG["Knowledge Mesh (Company Vault + Domain Memory)"]

        SuperAgent <--> VisualStudio
        VisualStudio --> Bench
        Bench --> CredentialVault
        Bench --> KnowledgeRAG
    end

    InternalPlane -- "Deploys Hired Persona" --> ClientPlane
```

---

## 3. Core Feature Specifications

### 3.1. Authentication & Persistent Identity
* **Identifier**: Dual-support for **Email** and **Phone Number** with a unique global **`@username`** (matching Telegram/WhatsApp standards).
* **Frictionless Onboarding**: Magic Link or 6-digit OTP code.
* **Persistent Device Sessions**:
  * Stored in encrypted client storage with **90-day sliding refresh tokens**.
  * The user logs in once on their laptop or mobile browser and stays logged in indefinitely, exactly like WhatsApp Web.
* **Multi-Device Sync**: Simultaneous login across desktop browser and installed mobile PWA.

---

### 3.2. Client Interface: The "Agent 10X" PWA
* **UI Aesthetic**: Modern dark/light theme inspired by Telegram Web K / WhatsApp Web:
  * **Left Column (Contact/Chat List)**:
    * Search bar to search conversations, notes, or digital contacts.
    * Active Chats list:
      1. 🤖 **Business Profiler Agent** (Pinned)
      2. 👔 **Digital Hiring Manager** (Pinned)
      3. 💼 **Hired Digital Employee(s)** (e.g. "Sarah – B2B Tech BDE")
    * Bottom status bar: Credit balance display (`⚡ 2,450 Credits`) + Top-Up button.
  * **Right Column (Chat Thread)**:
    * Real-time streaming conversation (Server-Sent Events / WebSocket).
    * Rich message cards (Inline buttons, service catalogs, EOD reports).
    * Quick Action Pills at composer bottom (e.g., `[Request EOD Report]`, `[Review Pipeline]`, `[Change Weekly Target]`).

---

### 3.3. Conversational System Agents

#### Agent 1: The Business Profiler Agent (`@profiler`)
* **Role**: Onboards the business through natural conversation.
* **Flow**:
  1. Asks for business name, industry, website, and target audience.
  2. Asks the owner to list or paste their core products, pricing, and services.
  3. Formats and saves this data into a structured **Business Catalog** (resembling the WhatsApp Business catalog model).
  4. Automatically packages this catalog into the hiring context.

#### Agent 2: The Digital Hiring Manager (`@hiring_manager`)
* **Role**: Matches business needs with available digital talent on the bench.
* **Flow**:
  1. Asks: *"What is your primary revenue focus right now? (e.g., B2B Outbound Lead Gen, B2C Local Outreach, Event Bookings)?"*
  2. Queries the **Agent Bench** and presents 2–3 rich candidate cards:
     * **Candidate Card**: Photo/Avatar, Name, Title (e.g. *BDE - FinTech & SaaS Specialist*), Verified Skill Badge, Tone Style, and Track Record.
  3. The owner chats with candidate previews or clicks **"Hire to Team"**.
  4. Binds the chosen digital employee to the client's workspace and initializes the direct chat.

#### Agent 3: The Hired BDE (Business Development Executive)
* **Role**: The deployed digital employee.
* **Daily Workflow**:
  * **Morning Kickoff**: Pings the boss with today's action plan based on the company's catalog and target criteria.
  * **Task Execution**: Receives real-time instructions from the boss (*"Reach out to 30 dental clinics in Texas with our new pricing"*).
  * **EOD (End of Day) Report**: Automatically generates an executive summary card every evening:
    * Accounts targeted / Leads warmed
    * Responses received & sentiment
    * Meetings booked or follow-ups required
    * Credits consumed today

---

### 3.4. The Encrypted Digital Life & Credential Vault (Internal Moat)

To solve the risk of losing seasoned accounts or delaying the digital persona moat, the system includes a dedicated **Identity Vault**:

```json
{
  "persona_id": "persona_bde_sarah_101",
  "display_name": "Sarah Jenkins",
  "job_title": "Senior B2B Growth BDE",
  "status": "DEPLOYED",
  "client_id": "client_acme_corp",
  "credentials_vault": {
    "email": {
      "address": "sarah.jenkins@gro10x.ai",
      "imap_host": "imap.zoho.com",
      "smtp_host": "smtp.zoho.com",
      "warmup_status": "WARMED_HEALTH_98"
    },
    "linkedin": {
      "profile_url": "https://linkedin.com/in/sarah-jenkins-gro10x",
      "account_email": "sarah.j.growth@...",
      "encrypted_password": "vault:enc:...",
      "two_factor_secret": "vault:otp:...",
      "connection_count": 1420
    },
    "facebook_meta": {
      "profile_url": "https://facebook.com/sarah.growth.10x",
      "account_id": "fb_9918231",
      "encrypted_password": "vault:enc:..."
    },
    "telecom": {
      "phone_number": "+14159820192",
      "provider": "Twilio / eSim",
      "whatsapp_registered": true
    },
    "proxy_assignment": {
      "ip": "198.54.120.4",
      "country": "US",
      "city": "Austin",
      "type": "RESIDENTIAL"
    }
  },
  "career_ledger": [
    {
      "company": "Acme Corp",
      "start_date": "2026-10-01",
      "role": "B2B Outreach Lead",
      "pipeline_generated_usd": 45000
    }
  ]
}
```

* **Security**: AES-256 encrypted fields for all credentials.
* **Account Seasoning Ledger**: Tracks account age, warm-up status, connection count, and proxy location.
* **Zero Lost Work**: When an internal team member creates an agent, all login credentials, recovery emails, and phone assignments are permanently saved in one unified, secure vault.

---

### 3.5. Internal Admin Studio & Super-Agent

The internal team manages the agent fleet through two synchronized interfaces:
1. **The Visual Control Studio (Chatbase Baseline)**:
   - **Knowledge Ingestion**: Upload PDFs, DOCX, scrape URLs, manage Q&A pairs.
   - **Model & Brain Parameters**: Model picker (GPT-4o, Claude 3.5, Gemini 2.0 Flash), system instructions, temperature slider, guardrails.
   - **Credential Vault Manager**: Form to securely add/edit LinkedIn, email, and phone details.
   - **Bench Manager**: Toggle agents between `INCUBATING`, `AVAILABLE_ON_BENCH`, and `DEPLOYED`.
2. **The Internal Super-Agent ("Agent Architect")**:
   - A conversational copilot for the internal team:
   - *"Create a new female BDE named Maya specializing in healthcare software. Assign her the next available US residential proxy and initialize her credentials checklist."*

---

### 3.6. The Credit Economy & Wallet

* **Unit of Account**: **Agent Credits** (e.g., 1 credit ≈ 100 input tokens / 25 output tokens).
* **Starter Grant**: Every newly registered business receives a **Welcome Bundle** (e.g., 1,000 free credits).
* **Real-Time Burn Rate**: Each message and research task displays credit consumption transparently.
* **Zero Interruption**: Low-credit notifications at 10% and 5% with 1-tap top-up.

---

## 4. Technical Stack Recommendation for New Standalone Project

To ensure high performance, real-time feel, and long-term separation from `gro10x.ai`:

| Layer | Recommended Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | **Vite + React (TypeScript) + Tailwind CSS + PWA Plugin** | Lightning fast, native PWA offline caching, installable on iOS/Android/Mac/Windows. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons + Radix UI** | Replicates WhatsApp/Telegram web sleekness with zero bundle bloat. |
| **Backend API** | **Node.js (Express / Fastify) with TypeScript** | Seamless integration with LLM streaming (SSE) and WebSocket real-time connections. |
| **Database & Auth** | **Supabase (PostgreSQL 15) with RLS** | Built-in Auth (Email/Phone + OTP), real-time subscriptions, and vector extensions (`pgvector`). |
| **Vault Encryption**| **Node `crypto` (AES-256-GCM)** | Hardware-grade encryption for all stored credentials and social passwords. |
| **LLM Gateway** | **Vercel AI SDK / Direct OpenAI & Anthropic Clients** | Unified streaming interface across Gemini, Claude, and GPT-4o. |

---

## 5. Phased Roadmap for the New Project

```
Phase 1: Project Setup & Authentication
  ├── Standalone repository initialization (`agent-10x`)
  ├── Supabase database schema (Users, Personas, Credentials, Chats, Credits)
  └── Phone/Email OTP Auth with persistent 90-day sessions & @username

Phase 2: The Core PWA (WhatsApp/Telegram UI)
  ├── 2-column responsive layout (Desktop web + Mobile PWA)
  ├── Live streaming chat UI with message bubbles & quick action pills
  └── Credit balance counter & top-up trigger modal

Phase 3: Conversational System Agents & Bench
  ├── Business Profiler Agent (Dynamic catalog builder)
  ├── Digital Hiring Manager (Bench card showcase & hire action)
  └── Internal Bench database seeded with initial BDE profiles

Phase 4: The Internal Admin Studio & Credential Vault
  ├── Visual settings editor (Chatbase baseline: files, prompts, models)
  ├── Encrypted Credential Vault (LinkedIn, FB, Email, Phone, Proxy)
  └── Internal Super-Agent for rapid conversational provisioning

Phase 5: First Deployed BDE Operations & EOD Reports
  ├── BDE instruction execution loop
  ├── Scheduled End-of-Day (EOD) reporting cards
  └── Full end-to-end testing & beta deployment
```
