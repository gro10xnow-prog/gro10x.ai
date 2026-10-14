> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Voice Sessions

> Embed real-time voice conversations with your AI agent in your own app using the Voice Sessions API and the Chatbase Voice SDK.

The Voice Sessions API lets you run your AI agent's voice mode inside your own web interface instead of the Chatbase widget. Your backend creates a session, your client joins it with the Chatbase Voice SDK, and the full voice pipeline runs on Chatbase: speech to text, the AI agent response with your training data and actions, text to speech, and natural interruption handling. Your client only publishes microphone audio and renders state.

Transport is WebRTC rather than a plain WebSocket. This is what makes low latency and barge-in possible: the user can talk over the AI agent and it stops speaking immediately, with no extra code on your side.

## Try it first

<CardGroup cols={2}>
  <Card title="Live demo" icon="microphone" href="https://chatbase-voice-sdk-demo.chatbase.fyi/">
    Paste your Agent ID and API key, start a session, and talk to your AI agent. No setup, nothing to install.
  </Card>
</CardGroup>

The demo takes an API key in its UI so you can try it in a few seconds; the key is sent only to the demo's own backend, which proxies Chatbase. Your own app should keep it in server-side env vars instead, as shown below. Demo sessions are real: they use message credits and appear in your chat logs.

## Create a session

Create sessions from your backend. Your API key must never reach a browser or mobile app, and the endpoint does not send CORS headers, so cross-origin browser calls are rejected by design.

```bash theme={null}
curl -X POST 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/voice/sessions' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user_abc123",
    "timezone": "Europe/Paris"
  }'
```

## Request Body

The body is required. Send `{}` when you have no options to set.

<ParamField body="conversationId" type="string">
  Optional conversation UUID. Reuse a value to group multiple voice sessions into one conversation in chat logs; the AI agent continues with the earlier transcript as history. Omit to create a new conversation. A conversation belongs to the end-user who started it: when reusing, send that same `userId`, or omit `userId` to inherit it — a different `userId` is rejected with `CONVERSATION_USER_MISMATCH`.
</ParamField>

<ParamField body="userId" type="string">
  Your end-user ID. Max 128 chars, `[a-zA-Z0-9._-]` only. Send a stable ID so per-user voice limits apply; if omitted a random one is generated per session (or inherited from the conversation when reusing a `conversationId`). A `userId` alone never resumes an earlier conversation — each session without a `conversationId` is a new conversation owned by that user.
</ParamField>

<ParamField body="timezone" type="string" default="UTC">
  IANA timezone of the end user, for example `Europe/Paris`. The AI agent uses it for time-aware answers.
</ParamField>

## Response

```json theme={null}
{
  "data": {
    "participantToken": "eyJhbGciOiJIUzI1NiJ9...",
    "sessionId": "81f59ffe-b937-4b00-816a-b50cf416cc7e",
    "roomName": "chatbot-AGENT_ID-CONVERSATION_ID-SESSION_ID",
    "maxDurationSeconds": 600,
    "conversationId": "b363c804-efb5-47f4-9e28-5417e978eb0b",
    "userId": "user_abc123"
  }
}
```

Hand the `data` object to your client. The `participantToken` is scoped to this single session and expires with it, so it is safe to ship to the browser.

<Warning>
  Never cache this response. Each `participantToken` belongs to one session and expires with it, so a cached response makes every later visitor connect with a dead token. In Next.js App Router that means `cache: "no-store"` on the fetch and `export const dynamic = "force-dynamic"` in the route.
</Warning>

## Errors

Failures use the standard API v2 error shape:

```json theme={null}
{
  "error": {
    "code": "VOICE_NOT_AVAILABLE",
    "message": "Voice mode is not available on your current plan."
  }
}
```

| Status | Code | Meaning |
| - | - | - |
| 401 | `AUTH_MISSING_API_KEY` | No `Authorization` header was sent. |
| 401 | `AUTH_INVALID_API_KEY` | The API key is not valid for this workspace. |
| 403 | `API_RESTRICTED_PLAN` | The plan does not include API access. |
| 403 | `VOICE_NOT_AVAILABLE` | The plan does not include voice mode. |
| 403 | `INSUFFICIENT_CREDITS` | Not enough message credits to start a session. |
| 403 | `AGENT_CREDITS_LIMIT_REACHED` | The AI agent hit its own credit limit; raise it in the AI agent settings. |
| 403 | `CONVERSATION_USER_MISMATCH` | The reused `conversationId` was created with a different `userId`. Send that same `userId`, or omit it to inherit the conversation's end-user. |
| 404 | `AGENT_NOT_FOUND` | No such AI agent, or it belongs to another workspace. |
| 404 | `CONVERSATION_NOT_FOUND` | The reused `conversationId` belongs to another AI agent or was deleted. |
| 429 | `VOICE_LIMIT_EXCEEDED` | A voice session limit was hit. `details.reason` names which one: concurrency, per user, hourly, or daily. |
| 429 | `RATE_LIMIT_TOO_MANY_REQUESTS` | Too many API requests; retry after a short delay. |
| 500 | `SESSION_CREATION_FAILED` | The session could not be created. Retry the request. |
| 503 | `SERVICE_UNDER_MAINTENANCE` | Chatbase is in maintenance; retry shortly. |

A 429 from `VOICE_LIMIT_EXCEEDED` is worth surfacing to your user, since it clears on its own:

```json theme={null}
{
  "error": {
    "code": "VOICE_LIMIT_EXCEEDED",
    "message": "Voice session limit exceeded. Please try again later or adjust the voice limits in settings.",
    "details": { "reason": "concurrent_exceeded" }
  }
}
```

### Example backend route

A minimal Next.js App Router handler that your client calls instead of talking to Chatbase directly:

```ts app/api/voice-session/route.ts theme={null}
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

const CHATBASE_API_URL = 'https://www.chatbase.co/api/v2/agents'

export async function POST(request: Request) {
    const { agentId, userId, timezone } = await request.json()

    const response = await fetch(`${CHATBASE_API_URL}/${agentId}/voice/sessions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.CHATBASE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, timezone }),
        cache: 'no-store'
    })

    const data = await response.json()

    // Pass Chatbase's status through so the client can tell a plan or limit
    // problem from a network failure.
    return NextResponse.json(data, { status: response.status })
}
```

## Join from your client

Install the Chatbase Voice SDK:

```bash theme={null}
npm install @chatbase-co/voice-sdk
```

The AI agent joins the session automatically and speaks the configured greeting; its audio plays without any setup.

```js theme={null}
import { ChatbaseVoice } from '@chatbase-co/voice-sdk'

// Your backend proxies the create call and returns the session `data`
const { data } = await fetch('/your-backend/voice-session').then((r) => r.json())

const voice = new ChatbaseVoice()

// Agent state: initializing, listening, thinking, speaking
voice.on('agentState', (state) => console.log('agent is', state))

// Live transcripts for both sides. Segments grow while spoken, so key your
// UI on segmentId and replace that segment's text on every event.
voice.on('transcript', ({ segmentId, speaker, text }) => {
  // your own UI update, e.g. setMessages((prev) => ({ ...prev, [segmentId]: { speaker, text } }))
  console.log(`[${speaker}] ${text}`)
})

voice.on('sessionEnd', (reason) => console.log('session ended:', reason))

await voice.connect(data) // microphone goes live; the agent greets and listens

// Optional: send text into the live session. The agent replies with speech.
await voice.sendText('What are your opening hours?')

// Microphone control; the session stays alive while muted
await voice.mute()
await voice.unmute()

// End the session
await voice.disconnect()
```

If the user declines microphone permission, the session continues in text mode: the SDK emits an `error` event, and `sendText` still gets spoken replies.

## SDK reference

### Methods and properties

| Member | Description |
| - | - |
| `new ChatbaseVoice()` | Creates an instance. One instance handles one session at a time. |
| `connect(session)` | Joins the session. Pass the `data` object from the endpoint, or just the `participantToken` string. Resolves once connected; the microphone goes live and the AI agent greets. |
| `disconnect()` | Ends the session. The AI agent hangs up and `sessionEnd` fires. |
| `sendText(message)` | Sends text into the live session. The AI agent answers with speech, so this works as a typed alternative to speaking. |
| `mute()` | Stops sending microphone audio. The session stays connected and the AI agent keeps talking. |
| `unmute()` | Resumes sending microphone audio. |
| `isMuted` | `boolean` — whether the microphone is currently muted. |
| `localAudioStream` | The local microphone `MediaStream`, or `null` before connecting. Use it to draw a level meter or waveform. |
| `on(event, cb)` | Subscribes to an event. Returns an unsubscribe function. |
| `off(event, cb)` | Removes a previously registered listener. |

Every method returns a promise except `on` and `off`; `isMuted` and `localAudioStream` are plain properties.

### Events

| Event | Payload | Carries |
| - | - | - |
| `connectionState` | `'connecting' \| 'connected' \| 'reconnecting' \| 'disconnected' \| 'error'` | Connection lifecycle of the session. |
| `agentState` | `'initializing' \| 'listening' \| 'thinking' \| 'speaking'` | What the AI agent is doing right now. Drive your UI from this. |
| `transcript` | `{ text, speaker, segmentId }` | Live transcripts of both sides. Segments grow while being spoken, so replace by `segmentId` rather than appending. |
| `sessionEnd` | `reason?: string` | The session ended, with the reason when one is known. |
| `error` | `Error` | Non-fatal problems such as an unavailable microphone, and connect failures. |

## Interruption

Barge-in needs no client code. The AI agent detects the caller speaking over it and stops mid-sentence, when the "Allow interruptions" setting is enabled in the AI agent's voice settings.

## Lifecycle and billing

A session ends when the client disconnects, when `maxDurationSeconds` elapses, after the configured silence timeout, or when credits run out. Enforcement happens server-side, so clients cannot extend a session past its limits.

Voice minutes consume message credits exactly like widget voice sessions. Conversations, transcripts, and recordings appear in the dashboard chat logs with source API.

<Note>
  Voice sessions require a plan with voice mode enabled. Session concurrency, per-user, hourly, and daily limits come from the AI agent's voice settings; exceeding one returns `VOICE_LIMIT_EXCEEDED` with the specific reason in `details.reason`.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.