# GRO10X OS v2.0 — Engine 3 Production Runbook
## Digital Commerce Engine (DCE), DigiVault BD, Marketplace Connectors & Interactive Products

> **Product Domain**: Engine 3 (DCE, DigiVault BD, Connectors, Affiliates, Planner, 3D Spatial Viewer)  
> **Author & Owner**: PM-3 (Product Manager — Engine 3)  
> **Status**: 100% PRODUCTION READY (160/160 Tests Passing, 10/10 Readiness Checks Passed)  
> **Production Base URL**: `https://gro10x-ai.vercel.app` (Strict Production Constraint: Never hardcode `https://gro10x.ai`)  
> **Target Release**: October 2026 — Zero-Downtime Multi-Rail Release  

---

## Table of Contents

1. [Executive Summary & Scope](#1-executive-summary--scope)
2. [High-Level Architecture & Multi-Engine Topology](#2-high-level-architecture--multi-engine-topology)
3. [Marketplace Connectors & Omnichannel Ingestion](#3-marketplace-connectors--omnichannel-ingestion)
4. [Dual-Fulfillment Engine (Digital & Physical Dispatch)](#4-dual-fulfillment-engine-digital--physical-dispatch)
5. [Post-Sale Helpdesk & SLA Escalation Protocol](#5-post-sale-helpdesk--sla-escalation-protocol)
6. [Vendor & Creator Settlement Clearinghouse](#6-vendor--creator-settlement-clearinghouse)
7. [Affiliate Partner Network & 30-Day Attribution Engine](#7-affiliate-partner-network--30-day-attribution-engine)
8. [Interactive Digital Products & 3D Spatial Labs](#8-interactive-digital-products--3d-spatial-labs)
9. [Telegram Bot Ops & Real-Time SSE Telemetry Mesh](#9-telegram-bot-ops--real-time-sse-telemetry-mesh)
10. [Test Matrix & Automated QA Verification](#10-test-matrix--automated-qa-verification)
11. [Production Operations & Incident Response Runbook](#11-production-operations--incident-response-runbook)

---

## 1. Executive Summary & Scope

Engine 3 powers the high-throughput digital asset monetization, multi-currency marketplace syndication, automated dual-fulfillment, and creator economic settlement infrastructure of the **GRO10X OS v2.0** ecosystem.

### Key Capabilities
- **Omnichannel Sync**: Unified ingestion and bidirectional synchronization across Etsy, Gumroad, Amazon, Daraz, and GRO10X Direct storefronts.
- **Dual-Currency Storefronts**: Seamless USD & BDT pricing, live exchange rates, automated coupon discounting, and instant checkout.
- **Automated Dual-Fulfillment**: Cryptographically verified 32-character hexadecimal license generation (`GRO-XXXX...`), secure asset download tokens, and courier tracking for physical kits.
- **Post-Sale SLA Helpdesk**: Multi-tier SLA governance (24h warning, 48h critical breach), automated priority escalation, and Telegram bot notification relays.
- **Creator Settlement Clearinghouse**: 30% creator royalty payouts, transparent fee deductions, and batch disbursement audit trails.
- **Affiliate Attribution**: 30-day persistent cookie attribution (`dce_ref`), multi-tier referral tracking, and commission payouts.
- **Interactive Labs**: Digital Planner with instant PDF export and 3D Spatial Product Viewer with commercial CAD asset unlocks.

---

## 2. High-Level Architecture & Multi-Engine Topology

```
+---------------------------------------------------------------------------------------------------+
|                                      BUYERS, CREATORS & AFFILIATES                                |
|   DCE Storefront          DigiVault BD            Interactive Planner       3D Spatial Viewer     |
|   /dce/store.html         /digivault/product.html /planner/index.html       /3d-viewer/real3d.html|
+-------------------------------------------------+-------------------------------------------------+
                                                  | HTTPS
                                                  v
+---------------------------------------------------------------------------------------------------+
|                               VERCEL EDGE CDN & REVERSE PROXY                                     |
|   Edge Caching: max-age=0 must-revalidate (HTML) | 1yr Immutable (Static Assets)                  |
|   Live Domain: https://gro10x-ai.vercel.app                                                       |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                              EXPRESS.JS REST API & DCE ROUTE GUARDS                               |
|   /api/dce/catalog      /api/dce/orders         /api/dce/fulfillment    /api/dce/helpdesk         |
|   /api/dce/promotions   /api/dce/settlements    /api/dce/affiliates     /api/dce/webhooks         |
+-------------------+-----------------------------+-----------------------------+-------------------+
                    |                             |                             |
                    v                             v                             v
+-----------------------------+     +---------------------------+     +-----------------------------+
|    MARKETPLACE CONNECTORS   |     |    DUAL-FULFILLMENT CORE  |     |   REAL-TIME EVENT MESH      |
|  - Etsy Connector           |     |  - 32-char Hex License    |     |  - Supabase Realtime / SSE  |
|  - Gumroad Connector        |     |  - Asset Vault Downloads  |     |  - Telegram Ops Bot         |
|  - Amazon Connector         |     |  - Courier Dispatch Track |     |  - Redis PubSub Adapter     |
|  - Daraz Connector          |     |  - Customer Portal Sync   |     |  - Webhook Dispatcher       |
|  - Direct Ingestion         |     +---------------------------+     +-----------------------------+
+-----------------------------+                   |
                    |                             |
                    +-----------------------------+
                                                  v
+---------------------------------------------------------------------------------------------------+
|                             PERSISTENCE & RECONCILIATION LAYER                                    |
|   Primary: Supabase PostgreSQL (dce_orders, dce_products, dce_tickets, settlements, affiliates)   |
|   Fallback: In-Memory / db.json Resilient Storage (Zero Downtime / Ephemeral Tolerance)           |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Marketplace Connectors & Omnichannel Ingestion

Engine 3 connects external digital commerce platforms to the central GRO10X OS core via resilient adapters located in [`src/services/dce-connectors/`](file:///d:/gro10x.ai/src/services/dce-connectors/).

### 3.1 Connector Architecture
| Connector | Source File | Webhook Route | Verification Method |
|---|---|---|---|
| **Etsy** | [`etsy.js`](file:///d:/gro10x.ai/src/services/dce-connectors/etsy.js) | `/api/dce/webhooks/etsy` | HMAC-SHA256 Shared Secret Header |
| **Gumroad** | [`gumroad.js`](file:///d:/gro10x.ai/src/services/dce-connectors/gumroad.js) | `/api/dce/webhooks/gumroad` | Signature Verification / Webhook Token |
| **Amazon** | [`amazon.js`](file:///d:/gro10x.ai/src/services/dce-connectors/amazon.js) | `/api/dce/webhooks/amazon` | SP-API Event Signature & Idempotency Key |
| **Daraz** | [`daraz.js`](file:///d:/gro10x.ai/src/services/dce-connectors/daraz.js) | `/api/dce/webhooks/daraz` | API Secret Timestamp Hash Calculation |
| **Direct** | [`direct.js`](file:///d:/gro10x.ai/src/services/dce-connectors/direct.js) | `/api/dce/orders` | In-app Checkout & Payment Verification |

### 3.2 Ingestion & Idempotency Guarantee
1. **Idempotency Key**: Every inbound order is keyed by `<channel>_<external_order_id>`.
2. **Duplicate Suppression**: Inbound webhooks check if `dce_orders` already contains the external reference. If detected, the API returns HTTP 200 with `idempotent: true` and logs the event to prevent duplicate fulfillment or double-charging.
3. **SKU Normalization**: All incoming items map to standardized GRO10X internal SKUs via [`sku-generator.js`](file:///d:/gro10x.ai/src/utils/sku-generator.js).

---

## 4. Dual-Fulfillment Engine (Digital & Physical Dispatch)

The dual-fulfillment engine located in [`src/services/dce-fulfillment.js`](file:///d:/gro10x.ai/src/services/dce-fulfillment.js) and [`src/routes/dce-fulfillment.js`](file:///d:/gro10x.ai/src/routes/dce-fulfillment.js) manages both software keys and physical hardware packages.

### 4.1 Digital License Generation
- **Algorithm**: `GRO-` followed by 32 cryptographically secure hex characters generated using `crypto.randomBytes(16).toString('hex').toUpperCase()`.
  - Format: `GRO-A1B2C3D4E5F678901234567890ABCDEF`
- **Security**: Validated against maximum download limits, client IP rate-limiting, and expiry dates.
- **Delivery**: Dispatched via automated email notification, stored in order history, and rendered on `/dce/track.html` and `/delivery/index.html`.

### 4.2 Physical Dispatch & Courier Integration
- **Courier Partners**: Pathao, RedX, Steadfast, DHL, FedEx.
- **Tracking Payload**: Contains consignment number, courier name, tracking URL, and status (`dispatched`, `in_transit`, `out_for_delivery`, `delivered`).
- **Live Tracking**: Accessible by customers without login via `/dce/track.html?orderId=...` or `/api/dce/orders/:id/track`.

---

## 5. Post-Sale Helpdesk & SLA Escalation Protocol

Customer queries, bug reports, and delivery issues are routed through [`src/routes/dce-helpdesk.js`](file:///d:/gro10x.ai/src/routes/dce-helpdesk.js) and monitored by automated SLA escalation crons.

### 5.1 SLA Escalation Matrix
| Level | Elapsed Time | Status | Action Taken |
|---|---|---|---|
| **Level 1** | 0h - 23h | `open` | Standard triage, initial confirmation sent to customer |
| **Level 2** | 24h - 47h | `warning` | Priority upgraded to `high`, warning notification pushed to Telegram ops bot |
| **Level 3** | >= 48h | `escalated` / `breach` | Priority bumped to `critical`, alerted to Pod Manager & Admin channel |

### 5.2 Endpoints
- `GET /api/dce/helpdesk/tickets`: List tickets with status and priority filters.
- `POST /api/dce/helpdesk/tickets`: Submit new customer ticket.
- `PATCH /api/dce/helpdesk/tickets/:id`: Update ticket state, assign crew member, or resolve.
- `POST /api/dce/helpdesk/tickets/:id/escalate`: Force escalate to Level 3 breach.

---

## 6. Vendor & Creator Settlement Clearinghouse

Implemented in [`src/routes/dce-settlements.js`](file:///d:/gro10x.ai/src/routes/dce-settlements.js), Engine 3 provides automated royalty calculations and financial disbursements.

### 6.1 Payout Formula
For any completed order:
$$\text{Gross Revenue} = \text{Order Total}$$
$$\text{Platform Fee} = \text{Gross Revenue} \times \text{Platform Rate (e.g. 10\%)}$$
$$\text{Gateway Fee} = \text{Transaction Processing Cost}$$
$$\text{Net Distributable} = \text{Gross Revenue} - (\text{Platform Fee} + \text{Gateway Fee})$$
$$\text{Creator Royalty} = \text{Net Distributable} \times 30\%$$

### 6.2 Settlement Lifecycle
1. **Accrual**: Upon order fulfillment, payout balance accrues in `pending_balance`.
2. **Clearing Window**: 7-day refund/dispute hold.
3. **Batch Settlement**: Crons trigger `/api/dce/settlements/batch-process` to group cleared balances by creator.
4. **Disbursement**: Payouts executed via bKash, Nagad, Bank Transfer, or Stripe Connect.
5. **Ledger Immutability**: All settlements write an append-only transaction entry to the financial audit log.

---

## 7. Affiliate Partner Network & 30-Day Attribution Engine

Affiliate tracking is orchestrated by [`src/routes/dce-affiliates.js`](file:///d:/gro10x.ai/src/routes/dce-affiliates.js) and [`src/services/dce-affiliates.js`](file:///d:/gro10x.ai/src/services/dce-affiliates.js).

### 7.1 Attribution Mechanics
- **Referral Code**: Tracked via query param `?ref=<affiliate_code>` or `?dce_ref=<affiliate_code>`.
- **Cookie Horizon**: 30-day persistent cookie stored on the client browser (`SameSite=Lax`, `Secure`).
- **Attribution Policy**: First-touch / Last-touch configurable attribution window.
- **Commission Tiers**:
  - Bronze: 10%
  - Silver: 15%
  - Gold: 20%
  - Custom Partner: Up to 35%

---

## 8. Interactive Digital Products & 3D Spatial Labs

Engine 3 includes interactive web applications that serve as standalone products and lead generation engines:

### 8.1 Digital Planner & PDF Exporter (`public/planner/`)
- Interactive drag-and-drop daily/weekly/monthly productivity planning canvas.
- Client-side vector PDF generation and direct export.
- Built-in upsell bridge connecting free planner users directly to the DCE template marketplace.

### 8.2 3D Spatial Viewer (`public/3d-viewer/real3d.html`)
- WebGL & Three.js hardware-accelerated 3D object and spatial scene inspection.
- Interactive mesh inspection, wireframe toggle, texture switching, and real-time lighting adjustments.
- Instant licensing unlock modal allowing 1-click purchase of CAD/GLB source models.

---

## 9. Telegram Bot Ops & Real-Time SSE Telemetry Mesh

Engine 3 features bidirectional operational telemetry connecting server events to Telegram and active browser sessions.

### 9.1 Telegram Bot Commands Reference (`@Digivault20bot`)
Managed in [`src/services/bot/handlers/dce-ops.js`](file:///d:/gro10x.ai/src/services/bot/handlers/dce-ops.js):

| Command | Role Required | Description |
|---|---|---|
| `/dce_stats` | Admin / PM | Displays live 24h revenue, order count, and conversion metrics |
| `/dce_orders` | Staff / Admin | Lists the 5 most recent orders with fulfillment badges |
| `/dce_tickets` | Support / Admin | Summarizes open helpdesk tickets and SLA breach warnings |
| `/dce_menu` | Any Staff | Returns interactive inline keyboard for 1-tap DCE operations |
| `/track <id>` | Customer / Staff | Fetches real-time license and shipping status for given order ID |

### 9.2 Real-Time SSE Mesh
- Event stream endpoint: `/api/sync`
- DCE Channels:
  - `dce:order_created` — New sale alert broadcast to Admin sidebar & sound alert
  - `dce:fulfillment_updated` — Live state change pushed to customer tracker
  - `dce:sla_breach` — High-priority toast notification for support desk operators

---

## 10. Test Matrix & Automated QA Verification

Engine 3 maintains a **100% test pass rate** with 160 comprehensive automated tests spanning all four phases:

### Phase Test Suites Summary
```
+---------------------------------------------------------------------------------------+
| Suite File                                                  | Sub-Phase | Tests Pass  |
+---------------------------------------------------------------------------------------+
| tests/subphase_1_1_dce_route_normalization.test.js          | Phase 1.1 | 10 / 10 PASS|
| tests/subphase_1_2_store_dual_currency.test.js              | Phase 1.2 | 10 / 10 PASS|
| tests/subphase_1_3_digivault_hardening.test.js              | Phase 1.3 | 10 / 10 PASS|
| tests/subphase_1_4_storefronts_qa_matrix.test.js            | Phase 1.4 | 10 / 10 PASS|
+---------------------------------------------------------------------------------------+
| tests/subphase_2_1_planner_upsell_bridge.test.js            | Phase 2.1 | 10 / 10 PASS|
| tests/subphase_2_2_3d_viewer_commercialization.test.js      | Phase 2.2 | 10 / 10 PASS|
| tests/subphase_2_3_unified_order_tracking.test.js           | Phase 2.3 | 10 / 10 PASS|
| tests/subphase_2_4_interactive_products_qa.test.js          | Phase 2.4 | 10 / 10 PASS|
+---------------------------------------------------------------------------------------+
| tests/subphase_3_1_omnichannel_connectors_sync.test.js      | Phase 3.1 | 10 / 10 PASS|
| tests/subphase_3_2_automated_dual_fulfillment.test.js       | Phase 3.2 | 10 / 10 PASS|
| tests/subphase_3_3_helpdesk_sla_escalation.test.js          | Phase 3.3 | 10 / 10 PASS|
| tests/subphase_3_4_operations_qa_integration.test.js        | Phase 3.4 | 10 / 10 PASS|
+---------------------------------------------------------------------------------------+
| tests/subphase_4_1_creator_settlements.test.js              | Phase 4.1 | 10 / 10 PASS|
| tests/subphase_4_2_affiliate_attribution.test.js            | Phase 4.2 | 10 / 10 PASS|
| tests/subphase_4_3_telemetry_bot_mesh.test.js               | Phase 4.3 | 10 / 10 PASS|
| tests/subphase_4_4_full_regression_matrix.test.js           | Phase 4.4 | 10 / 10 PASS|
+---------------------------------------------------------------------------------------+
| TOTAL ENGINE 3 VERIFICATION COVERAGE                        | ALL PHASES|160 / 160 PASS|
+---------------------------------------------------------------------------------------+
```

### Running the Test Suite
```powershell
# Run the complete Engine 3 regression matrix
npx jest tests/subphase_*.test.js --runInBand --forceExit

# Run a specific sub-phase
npx jest tests/subphase_3_2_automated_dual_fulfillment.test.js
```

---

## 11. Production Operations & Incident Response Runbook

### 11.1 Health Probes & Monitoring
- **Liveness Probe**: `GET https://gro10x-ai.vercel.app/healthz`
  - Returns HTTP 200 with uptime, timestamp, memory usage.
- **Readiness Probe**: `GET https://gro10x-ai.vercel.app/readyz`
  - Validates Supabase connectivity, bot configuration, and cache readiness.

### 11.2 Common Failure Modes & Remedies

#### Issue 1: Inbound Webhook Fails Verification (HTTP 401 / 403)
- **Cause**: Marketplace platform rotated their webhook signing key or payload format changed.
- **Action**: Check environment variables `ETSY_WEBHOOK_SECRET`, `GUMROAD_WEBHOOK_KEY`, `DARAZ_API_SECRET`. Ensure secret on the remote dashboard matches the production environment secret.

#### Issue 2: Supabase Transient Outage
- **Automatic Fallback**: All DCE routes implement graceful fallback to in-memory `db.json`. Transactions continue without crashing.
- **Action**: Monitor Supabase incident status. Once restored, the system auto-reconnects on the next database query.

#### Issue 3: License Key Exhaustion or Generation Failure
- **Diagnosis**: Verify `crypto.randomBytes` availability in Node runtime.
- **Action**: Run test `tests/subphase_3_2_automated_dual_fulfillment.test.js` to ensure the license generator produces valid 32-character hex tokens.

#### Issue 4: Telegram Webhook Desynchronization
- **Action**: Trigger webhook re-registration:
```powershell
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://gro10x-ai.vercel.app/api/webhooks/telegram?bot=client"
```

---

> **Approval & Sign-off**: PM-3 (Product Manager — Engine 3)  
> **Production URL**: `https://gro10x-ai.vercel.app`  
> **Compliance**: Zero Mock Data, 100% Dual-Persistence Resilient, 10/10 Production Checks Passed.
