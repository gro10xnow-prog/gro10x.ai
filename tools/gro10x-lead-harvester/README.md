# ⚡ GRO10X WhatsApp LeadHarvester & AI Profiler
**Chrome Extension (Manifest v3)**  
*Engineered by GRO10X Mother OS Squad 5 (Bot & Automation Mesh) × Squad 7 (Client Operations & CRM)*

---

## 🎯 Overview
The **GRO10X WhatsApp LeadHarvester** is a high-leverage Chrome Extension designed to extract WhatsApp Web group members, infer C-suite seniority and enterprise tiers, generate personalized bilingual outreach icebreakers (English + বাংলা), and sync directly into **GRO10X OS CRM** (`/app#leads`).

---

## 🚀 Quick Setup: Load Unpacked in Chrome / Brave / Edge

### Step 1: Open Chrome Extensions
1. In your browser (Google Chrome, Brave, or Microsoft Edge), navigate to:
   ```text
   chrome://extensions/
   ```
2. In the top-right corner, toggle **Developer mode** to **ON**.

### Step 2: Load the Unpacked Extension
1. Click the **"Load unpacked"** button in the top-left toolbar.
2. Select the directory:
   ```text
   D:\gro10x.ai\tools\gro10x-lead-harvester
   ```
3. The **GRO10X LeadHarvester & AI Profiler** icon (`⚡`) will appear in your browser extension toolbar. Pin it for instant access!

---

## 🛠️ How to Harvest & Profile Leads (3-Step Workflow)

### 1. Open WhatsApp Web & Enter Any Group
- Navigate to [https://web.whatsapp.com](https://web.whatsapp.com).
- Click into any active business community, industry group, or client network.
- Click the **Group Header** to reveal the right-hand Group Info panel.

### 2. Launch Harvester & Auto-Scroll
- Click the **GRO10X LeadHarvester** extension icon (`⚡`).
- The extension automatically detects the **Group Title** and **Description**.
- Select your target GRO10X Conglomerate Offer (e.g., *Engine 2: Bespoke Agency Tech* or *Engine 1: Autonomous AI Agents*).
- Click **`[⚡ Scan & Auto-Scroll Members]`**.
- The virtual scroll engine traverses the full 200+ member list smoothly without dropping DOM nodes, capturing:
  - Phone Number
  - Display Name & WhatsApp Pushname (`~Name`)
  - "About" Status string
  - Group Admin tag (`👑 Admin`)

### 3. AI Profile & Dual Export Rails
- Click **`[🤖 AI Lead Profile & Enrich]`**:
  - Automatically classifies **Seniority** (C-Level / Founder, Director / VP, Manager, Professional).
  - Categorizes **Lead Tier** (Tier 1 Enterprise ৳1.5L–৳5L, Tier 2 Growth ৳45K–৳1.2L, Tier 3 Digital SKU).
  - Generates personalized, high-converting WhatsApp Icebreakers in **English** and **বাংলা**.
- **Download Excel CSV**: Pre-formatted with UTF-8 BOM (`\uFEFF`) so Bangla script and emojis open cleanly in Microsoft Excel without character corruption.
- **Download JSON**: Complete structured data payload for downstream automations.
- **1-Click Sync to Mother OS CRM**: Directly inserts all enriched leads into Mother OS (`/api/leads/harvester-sync`), instantly broadcasting live SSE updates to your agency cockpit at `http://localhost:3000/app#leads`!

---

## ⚙️ Configuration & Endpoints

| Parameter | Default Value | Description |
| :--- | :--- | :--- |
| **API Base URL** | `http://localhost:3000` | Target Mother OS host (can toggle to `https://gro10x-ai.vercel.app` in Settings). |
| **Enrich Ingress** | `/api/leads/ai-enrich` | Ingestion endpoint performing AI classification & icebreaker generation. |
| **CRM Sync** | `/api/leads/harvester-sync` | Database upsert rail saving leads into Supabase and `data/db.json`. |
| **Scroll Pacing** | `350ms (Balanced)` | Configurable to 250ms (Fast) or 550ms (Deep Inspection). |

---

## 📁 Extension File Structure
```text
tools/gro10x-lead-harvester/
├── manifest.json         # Manifest v3 configuration
├── background.js         # Service worker & proxy fetch bridge
├── content.js            # DOM virtual auto-scroll & extractor engine
├── popup.html            # Cyberpunk dark mode popup interface
├── popup.css             # Space Grotesk styling & neon cyan/purple design
├── popup.js              # State controller, CSV/JSON exporter, and CRM sync
├── icons/
│   ├── icon16.png        # Toolbar icon (16x16)
│   ├── icon48.png        # Extension manager icon (48x48)
│   ├── icon128.png       # Web store / HiDPI icon (128x128)
│   └── icon.svg          # Scalable vector master
└── README.md             # This operations manual
```

---
*Governed by GRO10X Holdings Chief of Staff × Virtual CTO.*
