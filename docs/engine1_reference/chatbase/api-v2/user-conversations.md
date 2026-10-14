> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# User Conversations

> Associate users with conversations, manage per-user history, and export full conversation data across all sources.

## Overview

Tag conversations with a `userId` to track per-user chat history. Once a conversation is associated with a user, you can list all of that user's conversations and continue any of them by passing the `conversationId`.

## Setting a User ID

Pass `userId` when creating a new conversation. The ID must follow these constraints:

| Constraint | Value |
| - | - |
| Max length | 128 characters |
| Allowed characters | `a-z`, `A-Z`, `0-9`, `.`, `_`, `-` |
| When applied | Only on conversation creation (no `conversationId` in request) |
| Mutability | Immutable — cannot be changed or removed after creation |

<Warning>
  A conversation's `userId` is set once at creation and cannot be changed. If you send `userId` with a `conversationId`, the `userId` field is ignored.
</Warning>

<CodeGroup>
  ```javascript Node.js theme={null}
  const response = await fetch(
    "https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer YOUR_API_KEY",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Hello!",
        stream: true,
        userId: "user_abc123",
      }),
    }
  );
  ```

  ```python Python theme={null}
  import requests

  response = requests.post(
      "https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat",
      headers={
          "Authorization": "Bearer YOUR_API_KEY",
          "Content-Type": "application/json",
      },
      json={
          "message": "Hello!",
          "stream": True,
          "userId": "user_abc123",
      },
      stream=True,
  )
  ```
</CodeGroup>

The response metadata includes the `userId`:

```json theme={null}
{
  "type": "finish",
  "finishReason": "stop",
  "messageMetadata": {
    "messageId": "msg_abc123",
    "userMessageId": "msg_xyz789",
    "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "userId": "user_abc123",
    "usage": { "credits": 2 }
  }
}
```

## Continuing a Conversation

To send follow-up messages in the same conversation, pass the `conversationId` from a previous response:

<CodeGroup>
  ```javascript Node.js theme={null}
  const response = await fetch(
    "https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer YOUR_API_KEY",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Tell me more about that.",
        stream: true,
        conversationId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      }),
    }
  );
  ```

  ```python Python theme={null}
  response = requests.post(
      "https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat",
      headers={
          "Authorization": "Bearer YOUR_API_KEY",
          "Content-Type": "application/json",
      },
      json={
          "message": "Tell me more about that.",
          "stream": True,
          "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      },
      stream=True,
  )
  ```
</CodeGroup>

<Tip>
  The `conversationId` is returned in the streaming `finish` event's `metadata` or in the non-streaming response's `metadata` object. See [Streaming](/docs/api-v2/streaming) for details.
</Tip>

<Note>
  If the conversation has ended (e.g. after a human takeover), the API returns a `CHAT_CONVERSATION_NOT_ONGOING` error. Start a new conversation instead.
</Note>

## Listing a User's Conversations

Retrieve all conversations for a specific user with `GET /api/v2/agents/{agentId}/users/{userId}/conversations`.

### Path Parameters

| Parameter | Type | Description |
| - | - | - |
| `agentId` | `string` | The agent ID. |
| `userId` | `string` | The user ID to list conversations for. |

### Query Parameters

| Parameter | Type | Default | Description |
| - | - | - | - |
| `cursor` | `string` | — | Opaque cursor from a previous response. Omit to start from the beginning. |
| `limit` | `integer` | `20` | Number of items per page. Range: 1–100. |

### Response

```json theme={null}
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "title": "Quantum computing basics",
      "createdAt": 1770681600,
      "updatedAt": 1770681900,
      "userId": "user_abc123",
      "status": "ongoing"
    },
    {
      "id": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      "title": "Pricing questions",
      "createdAt": 1770595200,
      "updatedAt": 1770595500,
      "userId": "user_abc123",
      "status": "ended"
    }
  ],
  "pagination": {
    "cursor": "eyJ0IjoiMjAyNC0wMS0xNVQxMDozMDowMC4wMDBaIiwiaWQiOiJhYmMxMjMifQ==",
    "hasMore": true,
    "total": 42
  }
}
```

### Response Fields

| Field | Type | Description |
| - | - | - |
| `id` | `string` | Conversation ID. |
| `title` | `string \| null` | Conversation title. |
| `createdAt` | `number` | Unix epoch timestamp (seconds). |
| `updatedAt` | `number` | Unix epoch timestamp (seconds) of last activity. |
| `userId` | `string \| null` | The user ID associated with this conversation. |
| `status` | `string` | Conversation status: `ongoing`, `ended`, or `taken_over`. |

### Pagination Examples

<CodeGroup>
  ```javascript Node.js theme={null}
  async function fetchUserConversations(agentId, userId, apiKey) {
    const conversations = [];
    let cursor = undefined;

    do {
      const params = new URLSearchParams({ limit: "100" });
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(
        `https://www.chatbase.co/api/v2/agents/${agentId}/users/${userId}/conversations?${params}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      const { data, pagination } = await response.json();
      conversations.push(...data);
      cursor = pagination.cursor;
    } while (cursor);

    return conversations;
  }
  ```

  ```python Python theme={null}
  import requests

  def fetch_user_conversations(agent_id: str, user_id: str, api_key: str):
      conversations = []
      cursor = None

      while True:
          params = {"limit": 100}
          if cursor:
              params["cursor"] = cursor

          response = requests.get(
              f"https://www.chatbase.co/api/v2/agents/{agent_id}/users/{user_id}/conversations",
              headers={"Authorization": f"Bearer {api_key}"},
              params=params,
          )
          body = response.json()
          conversations.extend(body["data"])

          cursor = body["pagination"]["cursor"]
          if not cursor:
              break

      return conversations
  ```
</CodeGroup>

## Full Example

<Steps>
  <Step title="Start a conversation with a user ID">
    Send the first message with a `userId` to associate the conversation:

    ```bash theme={null}
    curl -N -X POST 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat' \
      -H 'Authorization: Bearer YOUR_API_KEY' \
      -H 'Content-Type: application/json' \
      -d '{
        "message": "What is quantum computing?",
        "stream": true,
        "userId": "user_abc123"
      }'
    ```

    Save the `conversationId` from the `finish` event.
  </Step>

  <Step title="Send a follow-up message">
    Continue the conversation by passing the `conversationId`:

    ```bash theme={null}
    curl -N -X POST 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat' \
      -H 'Authorization: Bearer YOUR_API_KEY' \
      -H 'Content-Type: application/json' \
      -d '{
        "message": "How does it differ from classical computing?",
        "stream": true,
        "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
      }'
    ```
  </Step>

  <Step title="List the user's conversations">
    Retrieve all conversations for the user:

    ```bash theme={null}
    curl 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/users/user_abc123/conversations?limit=20' \
      -H 'Authorization: Bearer YOUR_API_KEY'
    ```
  </Step>
</Steps>

## Exporting All Conversations

The [Export conversations](/docs/api-v2/conversations/export-conversations) endpoint returns **all conversations with full message history**, regardless of source. This is different from the list endpoints above, which only return API-created conversations.

<Note>
  [Get a conversation](/docs/api-v2/conversations/get-a-conversation) also only returns conversations created through the API. If you request a conversation that exists but came from another source, its 404 response names the source and points you to the export endpoint below instead.
</Note>

### Key differences from list endpoints

| | List conversations | Export conversations |
| - | - | - |
| **Sources** | API-only | All (Widget, WhatsApp, Messenger, API, etc.) |
| **Messages** | Not included (metadata only) | Full message history included |
| **Tool results** | Not included (metadata only) | Sanitized — internal data stripped |
| **Tool call input** | Not included (metadata only) | Omitted (not useful for export consumers) |

### Fetching a single conversation

Pass `conversationId` as a query parameter to fetch one conversation instead of paging through the full export. This works for a conversation from any source, including ones created through the widget, WhatsApp, or other integrations, not just the API.

```bash theme={null}
curl 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/conversations/export?conversationId=a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

The response keeps the normal paginated shape, with a single item in `data`:

```json theme={null}
{
  "data": [
    { "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", "...": "..." }
  ],
  "pagination": {
    "cursor": null,
    "hasMore": false,
    "total": 1
  }
}
```

If no conversation matches the ID, the response is a normal empty page (`data: []`, `total: 0`), not a 404.

### Conversation sources

Exported conversations include a `source` field indicating where the conversation originated:

`API`, `WhatsApp`, `Messenger`, `Instagram`, `Slack`, `Salesforce`, `Zendesk`, `Zendesk Messaging`, `Widget or Iframe`, `Iframe`, `Email`, `Agent page`, `Phone`, `Android SDK`, `iOS SDK`, `Chatbase site`, `Playground`, and others.

### Embed origin

Conversations started on your website, such as from the chat bubble, iframe, or Center Stage, include `embedOrigin`, the URL of the page the AI agent was embedded on when the conversation started, without its query string, for example `https://www.example.com/pricing`. It contains only the origin, for example `https://www.example.com`, when the browser didn't report the page path. It is `null` for other sources, for conversations started before this field existed, and when the browser didn't report the site.

### Message format

Each conversation includes a `messages` array. Messages contain `parts`, which can be:

| Part type | Fields | Description |
| - | - | - |
| `text` | `type`, `text` | Text content from the user or assistant |
| `tool-call` | `type`, `toolCallId`, `toolName` | A tool invocation by the AI agent (`input` is omitted in exports) |
| `tool-result` | `type`, `toolCallId`, `toolName`, `output` | The sanitized result of a tool invocation |

### Tool result output shape

All tool results in the export follow a unified shape, so you can handle them with a single `switch` on `status`:

| Status | Shape | Description |
| - | - | - |
| `success` | `{ status: "success", data?: <T> }` | Tool completed successfully. `data` is present when there is a meaningful payload. |
| `error` | `{ status: "error", error?: string }` | Tool encountered an error. |
| `pending` | `{ status: "pending" }` | Tool execution is still in progress. |
| `ignored` | `{ status: "ignored" }` | Tool was skipped by the user. |

### Example response

```json theme={null}
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "title": "Order status inquiry",
      "createdAt": 1770681600,
      "updatedAt": 1770681900,
      "userId": "user_abc123",
      "source": "WhatsApp",
      "embedOrigin": null,
      "status": "ended",
      "messages": [
        {
          "id": "msg_001",
          "role": "user",
          "parts": [
            { "type": "text", "text": "What's the status of my order?" }
          ],
          "createdAt": 1770681600
        },
        {
          "id": "msg_002",
          "role": "assistant",
          "parts": [
            { "type": "text", "text": "Let me look that up for you." },
            {
              "type": "tool-call",
              "toolCallId": "call_abc123",
              "toolName": "lookupOrder"
            },
            {
              "type": "tool-result",
              "toolCallId": "call_abc123",
              "toolName": "lookupOrder",
              "output": { 
                "status": "success", 
                "data": { "orderId": "ORD-123", "shipped": true }
              }
            },
            { "type": "text", "text": "Your order ORD-123 has been shipped!" }
          ],
          "createdAt": 1770681605,
          "feedback": "positive",
          "metadata": { "score": 0.95 }
        }
      ]
    }
  ],
  "pagination": {
    "cursor": "eyJ0IjoiMjAyNC0wMS0xNVQxMDozMDowMC4wMDBaIiwiaWQiOiJhYmMxMjMifQ==",
    "hasMore": true,
    "total": 1250
  }
}
```

### Paginating through all exports

<CodeGroup>
  ```javascript Node.js theme={null}
  async function exportAllConversations(agentId, apiKey) {
    const conversations = [];
    let cursor = undefined;

    do {
      const params = new URLSearchParams({ limit: "100" });
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(
        `https://www.chatbase.co/api/v2/agents/${agentId}/conversations/export?${params}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      const { data, pagination } = await response.json();
      conversations.push(...data);
      cursor = pagination.cursor;
    } while (cursor);

    return conversations;
  }
  ```

  ```python Python theme={null}
  import requests

  def export_all_conversations(agent_id: str, api_key: str):
      conversations = []
      cursor = None

      while True:
          params = {"limit": 100}
          if cursor:
              params["cursor"] = cursor

          response = requests.get(
              f"https://www.chatbase.co/api/v2/agents/{agent_id}/conversations/export",
              headers={"Authorization": f"Bearer {api_key}"},
              params=params,
          )
          body = response.json()
          conversations.extend(body["data"])

          cursor = body["pagination"]["cursor"]
          if not cursor:
              break

      return conversations
  ```
</CodeGroup>

<Tip>
  The export endpoint can return large amounts of data. Use a smaller `limit` (e.g., 20) if you're processing messages as they arrive rather than collecting everything in memory.
</Tip>

## Related

<CardGroup cols={2}>
  <Card title="Streaming" icon="bolt" href="/docs/api-v2/streaming">
    Learn about streaming responses and event types.
  </Card>

  <Card title="Pagination" icon="arrow-right" href="/docs/api-v2/pagination">
    How cursor-based pagination works across all list endpoints.
  </Card>

  <Card title="Export Conversations" icon="download" href="/docs/api-v2/conversations/export-conversations">
    Full API reference for the export endpoint.
  </Card>

  <Card title="Client Actions" icon="bolt" href="/docs/api-v2/client-actions">
    How tool calls and tool results work in conversations.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.