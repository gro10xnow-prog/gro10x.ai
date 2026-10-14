> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Pagination

> How cursor-based pagination works in the Chatbase API v2.

## How It Works

The API v2 uses **cursor-based pagination** for all list endpoints. Cursors are opaque, base64-encoded strings — treat them as opaque tokens and do not attempt to decode or construct them.

### Query Parameters

| Parameter | Type | Default | Description |
| - | - | - | - |
| `cursor` | `string` | — | Opaque cursor from a previous response. Omit to start from the beginning. |
| `limit` | `integer` | `20` | Number of items per page. Range: 1–100. |

### Response Shape

All paginated responses follow this structure:

```json theme={null}
{
  "data": [...],
  "pagination": {
    "cursor": "eyJ0IjoiMjAyNC0wMS0xNVQxMDozMDowMC4wMDBaIiwiaWQiOiJhYmMxMjMifQ==",
    "hasMore": true,
    "total": 142
  }
}
```

| Field | Type | Description |
| - | - | - |
| `data` | `array` | The page of results. |
| `pagination.cursor` | `string \| null` | Cursor to pass for the next page. `null` when there are no more results. |
| `pagination.hasMore` | `boolean` | `true` if more results are available beyond this page. |
| `pagination.total` | `integer` | Total number of items matching the query. |

## Paginating Through All Results

Pass the `cursor` from each response into the next request to iterate through all pages:

<CodeGroup>
  ```javascript Node.js theme={null}
  async function fetchAllConversations(agentId, apiKey) {
    const conversations = [];
    let cursor = undefined;

    do {
      const params = new URLSearchParams({ limit: "100" });
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(
        `https://www.chatbase.co/api/v2/agents/${agentId}/conversations?${params}`,
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

  def fetch_all_conversations(agent_id: str, api_key: str):
      conversations = []
      cursor = None

      while True:
          params = {"limit": 100}
          if cursor:
              params["cursor"] = cursor

          response = requests.get(
              f"https://www.chatbase.co/api/v2/agents/{agent_id}/conversations",
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

## Export Pagination

The export endpoint (`GET /api/v2/agents/{agentId}/conversations/export`) paginates through **all conversations** (from every source) with full message history included. Each page returns up to `limit` conversations with their complete messages already embedded — no separate call to a messages endpoint is needed.

<Tip>
  Because each exported conversation includes all of its messages, pages can be significantly larger than other paginated responses. Use a smaller `limit` if you want to keep response sizes manageable.
</Tip>

## Message Pagination

The messages endpoint (`GET /api/v2/agents/{agentId}/conversations/{conversationId}/messages`) paginates **backward from the newest messages**. Within each page, messages are returned in chronological order.

This means:

* The first page contains the most recent messages
* Passing the `cursor` fetches the next older page
* Each page's messages are ordered oldest → newest

<Tip>
  The cursor returned by the [Get a conversation](/docs/api-v2/conversations/get-a-conversation) endpoint is compatible with the messages endpoint, so you can use it to fetch older messages beyond what the conversation response includes.
</Tip>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.