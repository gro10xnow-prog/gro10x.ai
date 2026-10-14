> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# HIPAA Conversation Webhook

> Receive HIPAA conversations at your own endpoint before Chatbase deletes them under the retention window.

On a HIPAA-compliant workspace, conversations are automatically deleted once they go idle for more than 24 hours or reach 7 days old. The HIPAA conversation webhook lets you keep that data: Chatbase sends each conversation to an endpoint you control, as JSON, just before it is deleted.

You configure one webhook per workspace, covering every AI agent in it.

<Warning>
  The webhook delivery is the only copy of the conversation you will get. After deletion, Chatbase retains only the **redacted** version, so the unredacted content of a conversation that was never delivered cannot be recovered or resent. Verify your endpoint before conversations start flowing, and keep your signing secret in sync.
</Warning>

For the retention rules themselves, see [Conversation auto-end rules](/docs/user-guides/workspace/hipaa-compliance#conversation-auto-end-rules).

## Requirements

* A **HIPAA-compliant workspace** — Enterprise plan with a signed BAA. See [HIPAA compliance](/docs/user-guides/workspace/hipaa-compliance).
* An **HTTPS** endpoint that accepts `POST` requests. Plain `http://` URLs are rejected.
* Permission to edit workspace settings. Workspace **Owners** have this by default; it can be granted to other members through a custom role.

## Configure your endpoint

<Steps>
  <Step title="Open the HIPAA settings">
    Go to **Settings → HIPAA** in your dashboard and find the **Webhook configuration** card.

    The HIPAA settings page only appears on workspaces where HIPAA compliance is enabled.
  </Step>

  <Step title="Save your endpoint URL">
    Enter your endpoint in the **Webhook endpoint** field and click **Save**.

    <Warning>
      **Enter the final URL — redirects are not followed.** PHI must only ever reach the endpoint you verified, and a redirect to `http://` would put it on the wire in cleartext.

      Redirects are almost always accidental. The usual causes:

      * a trailing slash your framework normalises (Next.js, Django's `APPEND_SLASH`, Rails)
      * `example.com` → `www.example.com` canonicalisation
      * a path that moved, leaving a `301` behind
      * platform-level rules — Vercel or Netlify redirects, Cloudflare Page Rules

      Verification fails if either probe is redirected, and a delivery that is redirected is retried and eventually abandoned, the same as any other failure.
    </Warning>
  </Step>

  <Step title="Copy the signing secret">
    Saving a URL for the first time generates a **signing secret** — a 64-character hex string — and shows it in a one-time modal.

    <Warning>
      The secret is shown **once**. Copy it into your secrets manager before closing the modal. Afterwards the dashboard displays only the last four characters, and the only way to get a usable value again is to regenerate it.
    </Warning>
  </Step>

  <Step title="Verify the endpoint">
    Click **Verify endpoint**. Your endpoint must pass this check before any conversation is delivered — see [Endpoint verification](#endpoint-verification) below.
  </Step>
</Steps>

<Note>
  **Verify endpoint** stays disabled until there is a saved URL and a signing secret, and while the URL field has unsaved edits. Save your changes first, then verify.
</Note>

## Endpoint verification

Verification proves your endpoint is safe to receive PHI. Clicking **Verify endpoint** sends **two** `POST` requests in sequence to the same URL:

| Probe | Signed with | Your endpoint must |
| :- | :- | :- |
| **1** | your real signing secret | return **2xx** |
| **2** | a throwaway key | return **non-2xx** |

Both must hold for verification to pass.

The second probe is the point of the design. An endpoint that returns `200` to anything would look perfectly healthy while accepting forged patient data from anyone who guessed its URL. Requiring a rejection proves your receiver actually checks the signature — and it only asks for behaviour you need in production anyway, so there is no verification-only code to write and later remove.

<Note>
  Both probes carry `"test": true`, which real deliveries never do. Acknowledge them and do not store them.

  They also deliberately use **different** `deliveryId` values, so a correctly idempotent receiver does not discard the second one as a duplicate.
</Note>

If probe 1 fails, probe 2 is never sent — so an endpoint that rejects everything shows only a single request in its own logs.

### Verification failure reasons

| Reason | What it means |
| :- | :- |
| `rejected_signed_request` | The correctly signed probe got a non-2xx response. |
| `accepted_invalid_signature` | The forged probe got a 2xx response — your endpoint is not checking signatures. |
| `redirect` | Either probe was redirected. Configure the final URL directly. |
| `timeout` | No response within 10 seconds. |
| `dns` | The hostname could not be resolved. |
| `refused` | The connection was refused. |

Until verification passes, the card shows **Endpoint not verified** and nothing is delivered. Conversations that reach their retention threshold in the meantime are held and retried — but they spend [retry attempts](#retries) while they wait, so verify early.

## The delivery request

Each conversation is sent as its own `POST` request with a JSON body.

### Headers

| Header | Value |
| :- | :- |
| `Content-Type` | `application/json` |
| `X-Chatbase-Signature` | `v1=<hex>` — HMAC-SHA256 of the payload. See [Verify the signature](#verify-the-signature). |
| `X-Chatbase-Timestamp` | Unix timestamp in **seconds**. Part of the signed input. |
| `X-Chatbase-Delivery-Id` | UUID for this delivery attempt. Also present in the body as `deliveryId`. Use it as your idempotency key. |

### Payload

Every key in the payload is **camelCase**.

```json theme={null}
{
  "deliveryId": "b7c1e0a4-3f52-4d81-9a6c-2e4f8d0b1c73",
  "event": "conversation.deleted",
  "deletedAt": "2026-08-17T03:00:00.000Z",
  "deletionReason": "idle_24h",
  "conversation": {
    "id": "d41f8a92-6b3c-4e17-8f5a-9c0d2b7e4a16",
    "createdAt": "2026-08-16T14:02:09.000Z",
    "chatbotId": "c8e2f1b6-5a94-4d03-b7e8-1f6a3c9d0e52",
    "leads": null,
    "source": "Widget or Iframe",
    "minScore": 0,
    "country": "US",
    "messages": [],
    "accountId": "a3d7c5e1-8b62-4f09-9c4d-7e2b1a8f6d30",
    "lastMessageAt": "2026-08-16T14:02:15.000Z",
    "sentiment": "neutral",
    "anonymousId": null,
    "userId": "patient-4821",
    "title": "Rescheduling an appointment"
  }
}
```

### Envelope fields

| Field | Type | Description |
| :- | :- | :- |
| `deliveryId` | string | UUID for this delivery attempt. Matches the `X-Chatbase-Delivery-Id` header. Reused across retries of the same conversation. |
| `event` | string | Always `conversation.deleted` today. Switch on it anyway so future event types do not break your receiver. |
| `deletedAt` | string | ISO 8601 timestamp of the deletion. |
| `deletionReason` | string | `idle_24h` — idle for more than 24 hours, or `max_age_7d` — older than 7 days. |
| `conversation` | object | The conversation itself. See below. |

<Note>
  Field **names** are camelCase, but field **values** are unchanged — `deletionReason` is still `idle_24h` or `max_age_7d`, and `event` is still `conversation.deleted`. Match on the values exactly as shown.
</Note>

### Conversation fields

| Field | Type | Description |
| :- | :- | :- |
| `id` | string | Conversation ID. Appears in at most one delivery. |
| `createdAt` | string | When the conversation started. |
| `chatbotId` | string | ID of the AI agent that handled the conversation. |
| `accountId` | string | ID of your workspace. |
| `title` | string \| null | Generated conversation title. |
| `source` | string | Channel the conversation came from. See [Source values](#source-values). |
| `country` | string \| null | Country code, when available. |
| `minScore` | number | Lowest confidence score across the AI agent's answers in this conversation. |
| `sentiment` | string \| null | `positive`, `negative`, `neutral`, or `unspecified`, when sentiment analysis produced a result. |
| `userId` | string \| null | Your own user identifier, if the end user was identified. |
| `anonymousId` | string \| null | Anonymous visitor identifier, when the end user was not identified. |
| `leads` | object \| null | Lead and form data collected during the conversation, if any. |
| `lastMessageAt` | string | Timestamp of the most recent message. |
| `messages` | array | The full message history. See [Message shape](#message-shape). |

<Tip>
  Route on `conversation.chatbotId` if several of your AI agents share the same webhook — there is no separate AI agent object in the envelope.
</Tip>

### Source values

`source` records the channel the conversation arrived through. On a HIPAA-compliant workspace you can expect:

| Value | Channel |
| :- | :- |
| `Widget or Iframe` | Chat bubble embedded on your site |
| `Iframe` | AI agent embedded directly as an iframe |
| `Agent page` | Hosted help page |
| `API` | Chat API |
| `Phone` | Voice call |
| `Android SDK` / `iOS SDK` | Mobile SDKs |
| `Zendesk` / `Zendesk Messaging` / `Salesforce` / `Slack` | Connected integrations |
| `Email` | Email channel |
| `Unspecified` | Channel could not be determined |

Treat the list as open-ended: new channels add new values, so route with a fallback rather than an exhaustive match.

### Message shape

`messages` holds the conversation history, oldest first.

<Note>
  Message keys are camelCase, like the rest of the payload. The one exception anywhere in a delivery is an assistant message's `revised_answer`, which is `snake_case`.
</Note>

#### Message fields

These can appear on a message of any role. Every field except `role` is optional, so check for presence rather than assuming a fixed shape.

| Field | Type | Description |
| :- | :- | :- |
| `id` | string | Message identifier. |
| `role` | string | `user`, `assistant`, or `tool`. |
| `createdAt` | string | When the message was created. |
| `type` | string | On assistant messages, `text` or `tool-call`. Defaults to `text` and may be absent. |
| `content` | string \| array | Message text, or an array of parts. See [Content parts](#content-parts). |
| `actionType` | string | On `tool` messages, names the action that produced the result. Open-ended — new actions add new values. |
| `feedback` | string | `up` or `down`, when the end user rated the message. |

**Assistant messages** may also carry:

| Field | Type | Description |
| :- | :- | :- |
| `score` | number | Confidence score for the answer. |
| `source` | string | Where the answer came from: `llm`, `qna`, `outbound`, or `story_context`. |
| `matchedSources` | array | Knowledge-base entries used, each `{ type, name }`. |
| `procedureRun` | object | `{ toolCallId, procedure }` when the message was part of a procedure. |
| `revised_answer` | string | Revised answer text, when one was supplied. |
| `thumbsDown` | boolean | Whether the answer was marked unhelpful. |
| `imageUrl` | string | Image returned with the answer. |

**User messages** may also carry:

| Field | Type | Description |
| :- | :- | :- |
| `name` | string | Display name of the end user. |
| `userMessageType` | string | `audio` when the message came from speech. |
| `attachments` | array | Files the end user uploaded. See [Attachments](#attachments). |

<Note>
  `source` means two different things at two different levels. `conversation.source` is the **channel** (`Widget or Iframe`, `API`, …); a message's `source` is where that **answer** came from (`llm`, `qna`, …). They share a name but not a value set.
</Note>

#### Content parts

`content` is a string on plain text messages and an **array** on tool-call and tool-result messages. Calling something like `String(content)` breaks on any conversation where the AI agent used an action.

| Field | Type | Description |
| :- | :- | :- |
| `type` | string | `tool-call` or `tool-result`. |
| `toolName` | string | The action invoked. |
| `toolCallId` | string | Pairs a `tool-call` with its matching `tool-result`. |
| `input` | any | On `tool-call` parts — the arguments the AI agent passed. Shape depends on the action. |
| `output` | any | On `tool-result` parts — what the action returned. Shape depends on the action. |

`input` and `output` are action-specific and, for custom actions and forms, contain whatever your own integration returned. Treat them as opaque JSON unless you know the action.

#### Attachments

Files the end user uploaded during the conversation. Each entry carries the file's metadata and, when a link could be issued, a URL to download the file itself.

| Field | Type | Description |
| :- | :- | :- |
| `originalFileName` | string | Name of the file as the end user uploaded it. |
| `mediaType` | string | MIME type, e.g. `application/pdf`. |
| `fileSize` | number | Size in bytes. |
| `summary` | string | Generated description of the file, when available. |
| `fileName` | string | Unique stored name for the file. |
| `downloadUrl` | string | Signed URL to download the file. |
| `expiresAt` | string | When `downloadUrl` stops working. |

<Warning>
  **Download attachment files before the link expires.** `downloadUrl` is valid for **24 hours** from the moment the delivery is sent, and the file itself is deleted on the same schedule. An expired link cannot be reissued and the file is gone, so fetch and store the bytes as part of processing the delivery rather than later.
</Warning>

* Each delivery attempt carries a **freshly signed** URL, so a delivery that only succeeds on a retry still gets a full 24 hours. `expiresAt` therefore differs between attempts of the same delivery — use the value from the attempt you are processing.
* `downloadUrl` and `expiresAt` appear **together or not at all**. An attachment that arrives without them is metadata-only; the file is not retrievable, and retrying will not produce a link.
* The URL needs no authentication and no Chatbase headers — issue a plain `GET`.
* Treat `downloadUrl` as **opaque**: use it exactly as given. Its host and path are not part of this contract, so do not hardcode, rebuild, or parse them.

#### Parsing notes

* **`createdAt` is historically inconsistent.** Conversations backfilled through the API may use a space instead of `T`, or omit the minutes in the UTC offset. Parse it defensively.
* **Ignore fields you do not recognise** rather than treating them as an error, so a future addition does not break your receiver.

#### Example

```json theme={null}
"messages": [
  {
    "id": "msg_7f2a",
    "role": "user",
    "content": "I need to reschedule my appointment. Here is my referral.",
    "createdAt": "2026-08-16T14:02:11.000Z",
    "attachments": [
      {
        "fileName": "V1StGXR8Z5jdHi6B.pdf",
        "originalFileName": "referral.pdf",
        "mediaType": "application/pdf",
        "fileSize": 20481,
        "summary": "A referral letter",
        "downloadUrl": "https://<storage-host>/object/sign/chat-attachments/...?token=...",
        "expiresAt": "2026-08-18T03:00:12.000Z"
      }
    ]
  },
  {
    "id": "msg_8b3c",
    "role": "assistant",
    "type": "tool-call",
    "createdAt": "2026-08-16T14:02:13.000Z",
    "content": [
      {
        "type": "tool-call",
        "toolName": "lookup_appointment",
        "toolCallId": "tc_4d81",
        "input": { "patientRef": "ref_88231" }
      }
    ]
  },
  {
    "id": "msg_9c4d",
    "role": "tool",
    "actionType": "custom-action",
    "createdAt": "2026-08-16T14:02:14.000Z",
    "content": [
      {
        "type": "tool-result",
        "toolName": "lookup_appointment",
        "toolCallId": "tc_4d81",
        "output": {
          "type": "json",
          "value": {
            "status": "success",
            "data": {
              "appointmentId": "apt_5512",
              "currentDate": "2026-08-18T10:00:00.000Z"
            }
          }
        }
      }
    ]
  },
  {
    "id": "msg_a5e2",
    "role": "assistant",
    "type": "text",
    "content": "I can move you to the 20th at 09:00 or 11:30. Which works?",
    "createdAt": "2026-08-16T14:02:15.000Z",
    "score": 0.94,
    "feedback": "up",
    "source": "llm",
    "matchedSources": [{ "type": "file", "name": "clinic-hours.pdf" }]
  }
]
```

## Verify the signature

Every request carries an HMAC-SHA256 signature. Recompute it and reject anything that does not match — otherwise anyone who learns your endpoint URL can post fabricated patient data to it.

The signature is computed over the timestamp, a literal `.`, and the raw request body:

```
signature = "v1=" + hex(HMAC_SHA256(secret, timestamp + "." + rawBody))
```

The `v1=` prefix identifies the scheme, so it can change in future without breaking existing receivers. Compare the full `v1=…` string, prefix included.

<Warning>
  **Verify against the raw request body.** This is by far the most common integration failure. The signature covers the exact bytes on the wire, so if your framework parses the JSON and you re-serialize it to hash, key order or whitespace shifts and the HMAC never matches.

  * **Express** — `express.raw({ type: 'application/json' })`, not `express.json()`
  * **Next.js (App Router)** — `await request.text()`, not `request.json()`
  * **Next.js (Pages Router)** — `export const config = { api: { bodyParser: false } }` plus `raw-body`
  * **Flask** — `request.get_data()`, not `request.get_json()`
</Warning>

Your receiver should, in this order:

1. **Reject missing headers** with a 4xx, rather than letting them fall through and look like a signature mismatch.
2. **Check the timestamp is recent** — within about 5 minutes. The timestamp is part of the signed input, but only checking it makes replay protection real; without this check, a captured request stays valid forever.
3. **Take the timestamp from the header**, not from your own clock. A locally generated one will never match.
4. **Recompute the HMAC and compare in constant time.**
5. **Only then parse and trust the body.** Never act on payload contents before the signature checks out.

<CodeGroup>
  ```javascript Node.js (Express) theme={null}
  const crypto = require('node:crypto')
  const express = require('express')

  const app = express()
  const SECRET = process.env.CHATBASE_HIPAA_WEBHOOK_SECRET
  const MAX_AGE_SECONDS = 300

  app.post(
      '/webhooks/chatbase-hipaa',
      // Raw body, NOT express.json() — the signature covers the exact bytes sent.
      express.raw({type: 'application/json'}),
      (req, res) => {
          const timestamp = req.get('X-Chatbase-Timestamp')
          const signature = req.get('X-Chatbase-Signature')

          // Reject missing headers explicitly, so they don't look like a bad signature.
          if (!timestamp || !signature) {
              return res.status(400).json({error: 'missing_headers'})
          }

          // Replay protection: the timestamp is signed, but only checking it makes
          // the protection real.
          const age = Math.abs(Date.now() / 1000 - Number(timestamp))
          if (!Number.isFinite(age) || age > MAX_AGE_SECONDS) {
              return res.status(400).json({error: 'stale_timestamp'})
          }

          // Feed the raw Buffer straight in, so the bytes are never transcoded.
          const hmac = crypto.createHmac('sha256', SECRET)
          hmac.update(`${timestamp}.`)
          hmac.update(req.body)
          const expected = `v1=${hmac.digest('hex')}`

          // timingSafeEqual throws when lengths differ, so check length first.
          const received = Buffer.from(signature, 'utf8')
          const computed = Buffer.from(expected, 'utf8')
          if (
              received.length !== computed.length ||
              !crypto.timingSafeEqual(received, computed)
          ) {
              return res.status(401).json({error: 'invalid_signature'})
          }

          // Verified — now it is safe to parse and trust the payload.
          const event = JSON.parse(req.body.toString('utf8'))

          // Verification probes carry test: true. Acknowledge without storing.
          if (event.test) {
              return res.status(200).json({ok: true})
          }

          // Acknowledge first, then process. Chatbase times out after 10 seconds.
          res.status(200).json({ok: true})
          queueForProcessing(event)
      }
  )
  ```

  ```typescript Next.js (App Router) theme={null}
  import crypto from 'node:crypto'

  const SECRET = process.env.CHATBASE_HIPAA_WEBHOOK_SECRET!
  const MAX_AGE_SECONDS = 300

  export async function POST(request: Request) {
      // Read the raw body as text, NOT request.json() — the signature covers the
      // exact bytes sent.
      const rawBody = await request.text()

      const timestamp = request.headers.get('x-chatbase-timestamp')
      const signature = request.headers.get('x-chatbase-signature')

      // Reject missing headers explicitly, so they don't look like a bad signature.
      if (!timestamp || !signature) {
          return Response.json({error: 'missing_headers'}, {status: 400})
      }

      // Replay protection: the timestamp is signed, but only checking it makes
      // the protection real.
      const age = Math.abs(Date.now() / 1000 - Number(timestamp))
      if (!Number.isFinite(age) || age > MAX_AGE_SECONDS) {
          return Response.json({error: 'stale_timestamp'}, {status: 400})
      }

      const expected = `v1=${crypto
          .createHmac('sha256', SECRET)
          .update(`${timestamp}.${rawBody}`)
          .digest('hex')}`

      // timingSafeEqual throws when lengths differ, so check length first.
      const received = Buffer.from(signature, 'utf8')
      const computed = Buffer.from(expected, 'utf8')
      if (
          received.length !== computed.length ||
          !crypto.timingSafeEqual(received, computed)
      ) {
          return Response.json({error: 'invalid_signature'}, {status: 401})
      }

      // Verified — now it is safe to parse and trust the payload.
      const event = JSON.parse(rawBody)

      // Verification probes carry test: true. Acknowledge without storing.
      if (event.test) {
          return Response.json({ok: true})
      }

      // Keep this fast — Chatbase times out after 10 seconds.
      await queueForProcessing(event)
      return Response.json({ok: true})
  }
  ```

  ```python Python (Flask) theme={null}
  import hashlib
  import hmac
  import json
  import os
  import time

  from flask import Flask, jsonify, request

  app = Flask(__name__)
  SECRET = os.environ["CHATBASE_HIPAA_WEBHOOK_SECRET"].encode()
  MAX_AGE_SECONDS = 300


  @app.post("/webhooks/chatbase-hipaa")
  def chatbase_hipaa_webhook():
      # Raw bytes, NOT request.get_json() — the signature covers the exact bytes sent.
      raw_body = request.get_data()

      timestamp = request.headers.get("X-Chatbase-Timestamp")
      signature = request.headers.get("X-Chatbase-Signature")

      # Reject missing headers explicitly, so they don't look like a bad signature.
      if not timestamp or not signature:
          return jsonify(error="missing_headers"), 400

      # Replay protection: the timestamp is signed, but only checking it makes
      # the protection real.
      try:
          age = abs(time.time() - int(timestamp))
      except ValueError:
          return jsonify(error="stale_timestamp"), 400
      if age > MAX_AGE_SECONDS:
          return jsonify(error="stale_timestamp"), 400

      signed_input = f"{timestamp}.".encode() + raw_body
      expected = "v1=" + hmac.new(SECRET, signed_input, hashlib.sha256).hexdigest()

      # compare_digest is the constant-time comparison.
      if not hmac.compare_digest(signature, expected):
          return jsonify(error="invalid_signature"), 401

      # Verified — now it is safe to parse and trust the payload.
      event = json.loads(raw_body)

      # Verification probes carry test: true. Acknowledge without storing.
      if event.get("test"):
          return jsonify(ok=True), 200

      # Keep this fast — Chatbase times out after 10 seconds.
      queue_for_processing(event)
      return jsonify(ok=True), 200
  ```
</CodeGroup>

Each example above accepts a correctly signed request and rejects a forged one, so it passes verification as written.

<Accordion title="Why compare in constant time?">
  A plain `===` (or `==`) on strings stops at the first byte that differs, so how long the comparison takes leaks how many leading bytes matched. In principle an attacker can send many requests, measure the response times, and recover a valid signature one byte at a time — turning an infeasible search into roughly a thousand guesses.

  In practice, network jitter dwarfs the timing difference, so this is hardening rather than a likely attack path. But it costs nothing: use `crypto.timingSafeEqual` in Node, `hmac.compare_digest` in Python, or your language's equivalent.

  If your platform has no constant-time primitive, hash both values again with a random per-request key and compare those results normally. An attacker cannot steer timing against a key they do not know.
</Accordion>

## Responding

* Return any **2xx** status to acknowledge the delivery. Any other status is treated as a failure and retried.
* Chatbase closes the connection after **10 seconds**. Acknowledge first and process asynchronously — slow processing turns into timeouts, which turn into duplicate deliveries.
* Your response body is ignored.

## Retries

If a delivery fails, Chatbase retries it on a widening schedule:

| After failed attempt | Next attempt in |
| :- | :- |
| 1 | 15 minutes |
| 2 | 1 hour |
| 3 | 3 hours |
| 4 | 6 hours |
| 5 | 12 hours |

That is **6 attempts over roughly 22 hours**. Each wait is jittered by ±20%, so a batch of deliveries that fails together — one outage, one bad deploy — does not come back as a synchronised burst.

A failure is any non-2xx response, a timeout, or a connection, DNS, or TLS error.

<Warning>
  After the sixth failed attempt the delivery is abandoned, and because the conversation has already been deleted, its content is gone. There is currently no manual retry.

  An endpoint that is down for an evening will recover on its own. One that is down for a full day will lose data.
</Warning>

Attempts are also consumed while the webhook itself is not ready to receive: a delivery waiting on an **unverified endpoint**, or on a **missing signing secret**, uses up an attempt each time it is tried. Verifying your endpoint before conversations start reaching their retention thresholds is what keeps the ladder available for real failures.

## Idempotency

Delivery is **at-least-once**, so your receiver must tolerate duplicates.

Retries reuse the same `X-Chatbase-Delivery-Id`. A delivery can also arrive twice legitimately — if your endpoint processed a request but the acknowledgement was lost on the way back, Chatbase never recorded the success and will send it again.

Deduplicate on `deliveryId`, or on `conversation.id`, which appears in at most one conversation's worth of deliveries. Record the ID in the same transaction that stores the conversation so a crash between the two cannot lose or double-count it.

## Changing your endpoint or secret

| Action | Verification status | Conversations awaiting delivery |
| :- | :- | :- |
| **Regenerate** the signing secret | Preserved | Signed with the new secret on their next attempt |
| **Save** a different endpoint URL | **Cleared** — re-verify | Held, and spending attempts, until verification passes again |
| **Remove webhook** | Cleared | Not delivered |

Two rules explain the whole table:

* **The current secret is used at the moment of each attempt.** Rotating is a security action — if you rotate because you believe the old secret leaked, the very next delivery must not still be signed with it. So rotation takes effect immediately, including for conversations already waiting.
* **Verification attests to one specific endpoint.** A different URL has not proved anything, so changing it clears verification and you must verify again.

<Tip>
  To rotate without downtime, accept **both** the old and the new secret for a short window: deploy a receiver that tries the current secret and falls back to the previous one, regenerate in the dashboard, then remove the old value once traffic confirms the new one is in use.
</Tip>

<Warning>
  **Remove webhook** deletes the endpoint URL *and* the signing secret. Conversations stop being delivered anywhere, and anything still awaiting delivery will not arrive. You can configure a new webhook later, but it is issued a fresh secret — the old one cannot be recovered.
</Warning>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Verification fails with accepted_invalid_signature">
    Your endpoint returned 2xx to a request with a deliberately invalid signature. Either it is not checking the signature at all, or it returns a response before the check runs — a common shape is an early `return res.status(200)` for health checks or an `OPTIONS`/`POST` handler that acknowledges first and validates later.

    Check that an invalid signature produces a non-2xx status, and that the check happens before anything else responds.
  </Accordion>

  <Accordion title="Verification fails with rejected_signed_request">
    Your endpoint returned a non-2xx to a correctly signed request. The usual cause is raw-body handling — see the warning in [Verify the signature](#verify-the-signature).

    Also confirm the endpoint is publicly reachable over HTTPS and is not behind authentication, an IP allowlist, or a WAF rule that blocks unknown callers.
  </Accordion>

  <Accordion title="Verification fails with redirect">
    Your endpoint answered with a `3xx` instead of handling the request. Redirects are not followed, so the URL you save has to be the one that actually serves the webhook.

    Most often this is a trailing slash or `www` canonicalisation rather than anything you configured deliberately — see the full list of causes under [Configure your endpoint](#configure-your-endpoint). Sending a `POST` to your saved URL with `curl -i` and checking for a `Location` header is the quickest way to confirm it.
  </Accordion>

  <Accordion title="The signature never matches">
    In order of likelihood:

    1. **The body was re-serialized.** A JSON body parser ran before you computed the HMAC. Use the raw bytes.
    2. **The timestamp came from the wrong place.** It must be read from the `X-Chatbase-Timestamp` header, not generated locally.
    3. **The signed input is malformed.** It is `timestamp + "." + rawBody` — a literal period between the two, and nothing else.
    4. **The secret has stray whitespace.** A trailing newline picked up when pasting into an environment file or secrets manager will change every digest.
    5. **The `v1=` prefix was dropped.** Compare the whole header value, including `v1=`.
  </Accordion>

  <Accordion title="Only one request arrived during verification">
    The first probe failed, so the second was never sent. Fix the failure reason shown in the dashboard and verify again.
  </Accordion>

  <Accordion title="A conversation arrived twice">
    Expected behaviour — delivery is at-least-once. Deduplicate on `deliveryId`. See [Idempotency](#idempotency).
  </Accordion>

  <Accordion title="A payload arrived with test: true">
    That is a verification probe, not a real conversation. Acknowledge it with a 2xx and do not store it, or you will save a fake conversation into your records.
  </Accordion>

  <Accordion title="Nothing is arriving">
    Check, in order:

    1. The **Webhook configuration** card shows **Endpoint verified**. If it shows **Endpoint not verified**, nothing is being delivered.
    2. Conversations have actually reached a retention threshold — a conversation is only delivered when it is deleted, so nothing arrives for conversations that are still active or idle for less than 24 hours.
    3. Your endpoint URL is still correct, and saving it did not silently reset verification.
  </Accordion>
</AccordionGroup>

## Notes and limits

* **One webhook per workspace**, covering every AI agent in it. Use `conversation.chatbotId` to tell them apart.
* **One conversation per request.** Deliveries are never batched, so each conversation gets its own status code and can succeed or fail independently.
* **HTTPS only.**
* **Deletion is never delayed.** Conversations are deleted on schedule whether or not delivery succeeds, so your endpoint being down does not extend the retention window.
* **Chatbase does not log the conversation content of a delivery.** Delivery attempts are recorded for support and audit purposes with only the outcome, response status, and error reason. Your endpoint's hostname is recorded in audit events; the full URL and the signing secret never are.

<Card title="HIPAA compliance overview" icon="shield-check" href="/docs/user-guides/workspace/hipaa-compliance">
  Retention rules, redaction, disabled features, and the shared responsibility model for HIPAA-compliant workspaces.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.