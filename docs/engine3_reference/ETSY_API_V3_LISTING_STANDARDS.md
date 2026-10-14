# 🛍️ Commerce 10X — Etsy Open API v3 & Automated Listing Standards

> **Ecosystem**: GRO10X Holdings · Engine 3 Standalone Venture (`D:\commerce10x.ai`)  
> **Source Service**: `src/services/etsy.js` & `src/routes/etsy.js`  
> **Target Standard**: Official Etsy Open API v3 (RESTful) + PKCE OAuth2  
> **Status**: Canonical Operational Guide

---

## 1. Etsy Open API v3 Architecture Overview

Etsy Open API v3 uses RESTful JSON payloads authenticated via **OAuth2 with PKCE** (Proof Key for Code Exchange). 

### Essential Endpoints Utilized:
* **OAuth2 Authorize**: `https://www.etsy.com/oauth/connect` (Scopes: `listings_r`, `listings_w`, `shops_r`, `transactions_r`)
* **Token Exchange / Refresh**: `https://api.etsy.com/v3/public/oauth/token`
* **Create Draft Listing**: `POST /v3/application/shops/{shop_id}/listings`
* **Upload Listing File (Digital Download)**: `POST /v3/application/shops/{shop_id}/listings/{listing_id}/files`
* **Upload Listing Images**: `POST /v3/application/shops/{shop_id}/listings/{listing_id}/images`
* **Get Shop Receipts (Orders)**: `GET /v3/application/shops/{shop_id}/receipts`

---

## 2. Canonical Payload Specification for `createDraftListing`

When the Commerce 10X **Etsy OS Engine** automatically drafts or publishes a product listing, it complies with the following strict contract:

```json
{
  "quantity": 999,
  "title": "GoodNotes 2026 Daily Planner Digital iPad Template Minimalist Boho Life Organizer",
  "description": "Transform your productivity with the 2026 Ultimate Life & Daily Planner. Crafted for GoodNotes, Notability, and tablet note-taking...\n\nINCLUDED IN YOUR DOWNLOAD:\n- 1x 2026 Full Digital Planner PDF (Hyperlinked)\n- 500+ Digital PNG Stickers\n- Step-by-Step Setup Video Guide",
  "price": 14.99,
  "who_made": "i_did",
  "when_made": "2020_2026",
  "taxonomy_id": 1429,
  "is_digital": true,
  "type": "download",
  "tags": [
    "goodnotes planner",
    "digital planner 2026",
    "daily life organizer",
    "ipad template",
    "hyperlinked pdf",
    "minimalist planner",
    "boho journal",
    "adhd daily routine",
    "project tracker",
    "tablet notes",
    "printable schedule",
    "undated organizer",
    "goodnotes stickers"
  ],
  "materials": ["digital download", "hyperlinked pdf", "goodnotes file"]
}
```

---

## 3. The 10-Rule AI Pre-Listing Compliance Engine

Before any SKU is pushed to Etsy's production API, it runs through the **AI Pre-Listing Health Check** ([`src/services/etsy.js:runProductHealthCheck`](file:///d:/gro10x.ai/src/services/etsy.js)):

| Rule # | Validation Check | Canonical Threshold / Requirement | Error / Warning Trigger |
| :---: | :--- | :--- | :--- |
| **1** | **Title Length** | 70 to 140 characters | Fails if < 70 chars (wasted search real estate) or > 140 chars (Etsy API truncation) |
| **2** | **13 Tags Utilization** | Exactly 13 tags | Fails if < 13 tags (wasting available organic search keyword slots) |
| **3** | **Tag Character Limit** | $\le$ 20 characters per tag | Fails if any individual tag exceeds 20 characters |
| **4** | **No Duplicate Tags** | Unique case-insensitive strings | Flags duplicate or near-duplicate tags |
| **5** | **Description Depth** | $\ge$ 300 words with structured headers | Fails if description is short or lacks "What's Included" breakdown |
| **6** | **High-Res Primary Mockup**| Minimum 2000 $\times$ 2000 px | Flags low-resolution thumbnails that hurt mobile conversion |
| **7** | **Digital File Attached** | Valid PDF or ZIP asset verified | Prevents drafting listings without associated Vault deliverable files |
| **8** | **Price & Margin Sanity** | Minimum \$2.99; Max \$99.00 | Protects against misconfigured pricing or zero-dollar releases |
| **9** | **Trademark / Banned Words** | Zero infringing brand names | Scans against trademark blacklist (e.g. "Velcro", "Disney", "Apple Watch") |
| **10** | **Valid Taxonomy Node** | Verified `taxonomy_id` integer | Validates taxonomy against Etsy official category tree |

---

## 4. Multi-Brand SKU Prefix Mapping

Commerce 10X automatically prefixes all Etsy product SKUs by brand to ensure clean multi-shop accounting:

```javascript
const BRAND_SKU_PREFIXES = {
  1: 'PLN',   // PlannerQueenGro
  2: 'WLD',   // WildMutt Co.
  3: 'TNY',   // TinyDesks Studio
  4: 'STR',   // LittleStarsLearning
  5: 'INK',   // InkWrapped
  6: 'COZ',   // CozyThreadsT
  7: 'PRD',   // ProudProfessional
  8: 'FST',   // FiestaFoundry
  9: 'ZEN',   // ZenWallCo
  10: 'SPK',  // SparkSVG
  11: 'PGF',  // PageForge Publishing
  12: 'LTR',  // LetterLab Fonts
  13: 'PRM'   // PromptVault
};
```
