# 🔑 Commerce 10X — License Key & Universal Checkout Standards

> **Ecosystem**: GRO10X Holdings · Engine 3 Standalone Venture (`D:\commerce10x.ai`)  
> **Standards**: Compatible with Gumroad License API v2 & Lemon Squeezy License API v1  
> **Status**: Canonical API Specification

---

## 1. Cryptographic License Key Format

All digital software, design assets, and printable kits issued by Commerce 10X will utilize a standardized **32-character hexadecimal license key** partitioned into 4 blocks:

```
XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
Example: 38B1460A-5104-4067-A91D-77B872934D51
```

* Generated via Node `crypto.randomBytes(16).toString('hex').toUpperCase()` or UUIDv4 with SHA-256 entropy.
* Stored in database table `dce_digital_licenses` with SHA-256 hash indexing.

---

## 2. Canonical License Verification API Endpoints

To maintain zero vendor lock-in, Commerce 10X exposes a dual-standard API that client applications, Chrome extensions, or desktop tools can query:

### A. Endpoint 1: Validate / Verify License (Gumroad Compatible)
* **Route**: `POST /api/v1/licenses/verify`
* **Method**: `POST`
* **Authentication**: None (Key itself acts as bearer authentication)
* **Request Body**:
  ```json
  {
    "product_id": "p-planner-01",
    "license_key": "38B1460A-5104-4067-A91D-77B872934D51",
    "increment_uses_count": true
  }
  ```
* **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "uses": 2,
    "purchase": {
      "order_number": "DCE-2026-89102",
      "email": "customer@example.com",
      "product_name": "PlannerQueen GoodNotes 2026 Ultimate Edition",
      "license_key": "38B1460A-5104-4067-A91D-77B872934D51",
      "refunded": false,
      "disputed": false,
      "status": "active"
    }
  }
  ```

---

### B. Endpoint 2: Activate Device / Instance (Lemon Squeezy Compatible)
* **Route**: `POST /api/v1/licenses/activate`
* **Request Body**:
  ```json
  {
    "license_key": "38B1460A-5104-4067-A91D-77B872934D51",
    "instance_name": "Sarah's iPad Pro (GoodNotes)"
  }
  ```
* **Response (`200 OK`)**:
  ```json
  {
    "activated": true,
    "error": null,
    "license_key": {
      "key": "38B1460A-5104-4067-A91D-77B872934D51",
      "status": "active",
      "activation_limit": 3,
      "instances_count": 1
    },
    "instance": {
      "id": "inst_91a0c78b-3312",
      "name": "Sarah's iPad Pro (GoodNotes)",
      "created_at": "2026-10-14T06:00:00Z"
    }
  }
  ```

---

### C. Endpoint 3: Deactivate Instance
* **Route**: `POST /api/v1/licenses/deactivate`
* **Request Body**:
  ```json
  {
    "license_key": "38B1460A-5104-4067-A91D-77B872934D51",
    "instance_id": "inst_91a0c78b-3312"
  }
  ```
* **Response (`200 OK`)**:
  ```json
  {
    "deactivated": true,
    "license_key": {
      "key": "38B1460A-5104-4067-A91D-77B872934D51",
      "status": "active",
      "instances_count": 0
    }
  }
  ```

---

## 3. Universal Webhook Security Standard

All inbound and outbound webhook dispatchers in Commerce 10X enforce cryptographic HMAC SHA-256 signature headers to guarantee authenticity:

```javascript
// Canonical Webhook Signature Verification Middleware
function verifyWebhookSignature(req, secret) {
  const signature = req.headers['x-signature'] || req.headers['x-hub-signature-256'];
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```
