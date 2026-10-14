> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Conversation Search

> Find an AI agent's conversations by what was said, what happened, or both, across every source.

[Search conversations](/docs/api-v2/conversations/search-conversations) finds conversations by text, by filters, or by both. It covers every source, including the chat widget, WhatsApp and the API.

## Quick start

```bash theme={null}
curl 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/conversations/search?query=refund' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

```json theme={null}
{
  "data": [
    {
      "id": "1785371a-63bb-4625-b20d-bcf91276567a",
      "title": "Request for Cancellation and Refund Policy Details",
      "createdAt": 1788256800,
      "updatedAt": 1788343200,
      "userId": null,
      "source": "WhatsApp",
      "status": "ended",
      "parentConversationId": null,
      "parentSummary": null,
      "embedOrigin": null,
      "snippet": {
        "speaker": "user",
        "highlights": [
          { "value": "what is your cancellation and ", "isHit": false },
          { "value": "refund", "isHit": true },
          { "value": " policy?", "isHit": false }
        ]
      }
    }
  ],
  "pagination": { "cursor": "eyJtIjoicmFuayIs...", "hasMore": true }
}
```

With `query`, the best matches come first, and results carry a `snippet` unless the match was only in the title. Without `query`, the most recently active conversations come first and `snippet` is `null`.

## Examples

| To find | Request |
| - | - |
| Conversations that mention refunds | `?query=refund` |
| Conversations handed to a human | `?escalated=true` |
| Escalations that also collected a lead | `?escalated=true&actionType=collect-leads` |
| Conversations where a tool call failed | `?tool=lookup-order&toolOutcome=error` |
| Thumbs-down feedback on WhatsApp or the API | `?feedback=negative&source=WhatsApp,API` |
| Billing conversations a human took over | `?topic=billing&activityState=taken_over` |
| Negative conversations that mention cancelling | `?query=cancel&sentiment=negative` |

Different filters must all match. Comma-separated values inside one filter match any of them. Every word in `query` must match, so `refund chargeback` only finds conversations that contain both words. To find either word, run two searches.

## Filters

| Parameter | Matches |
| - | - |
| `query` | Words in the messages or the title |
| `source` | Where the conversation happened, e.g. `API`, `WhatsApp`, `Widget or Iframe` |
| `sentiment` | `positive`, `neutral`, `negative`, or `unspecified` for none |
| `topic` | Topic names. A topic also matches its subtopics. `unspecified` matches conversations with no topic. |
| `userId` | User IDs of authenticated conversations |
| `activityState` | `ongoing`, `ended`, `taken_over`, `paused` |
| `feedback` | `positive` or `negative` ratings on messages |
| `escalated` | `true` for conversations handed to a human through a ticket or live chat |
| `actionType` | Action types that ran, e.g. `collect-leads` |
| `tool`, `toolOutcome` | Tools that were called and their result status, e.g. `error`. `toolOutcome` applies to the tools in `tool`, or to any tool when `tool` is omitted. |
| `procedure`, `procedureOutcome` | Procedures that ran and their status |
| `hasVoice` | `true` or `false` for whether a voice session took place |
| `startDate`, `endDate` | When the conversation was created |
| `updatedAfter`, `updatedBefore` | When the conversation was last active |
| `limit` | Results per page, 1 to 25. Defaults to 25. |
| `cursor` | The `pagination.cursor` from the previous page |

Dates accept `YYYY-MM-DD` (a whole UTC day) or a full ISO 8601 timestamp.

## Snippets

A snippet is one excerpt, about 180 characters, from the best-matching message. `speaker` says whether the user or the AI agent wrote it. Join the `value` fields to get the plain text, and highlight the parts where `isHit` is `true`.

## Reading a conversation

Search returns conversation details without messages. To read a result's messages, pass its `id` to [Export conversations](/docs/api-v2/conversations/export-conversations):

```bash theme={null}
curl 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/conversations/export?conversationId=1785371a-63bb-4625-b20d-bcf91276567a' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

## Paging

Keep every parameter the same, add the `cursor`, and stop when `hasMore` is `false`. A page can hold fewer results than `limit`, sometimes none, while `hasMore` is still `true`. That happens when conversations were deleted after they were indexed, so keep following the cursor.

<CodeGroup>
  ```javascript Node.js theme={null}
  const params = new URLSearchParams({ query: "refund" });
  const conversations = [];
  let cursor = null;

  do {
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(
      `https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/conversations/search?${params}`,
      { headers: { Authorization: "Bearer YOUR_API_KEY" } }
    );
    const { data, pagination } = await response.json();
    conversations.push(...data);
    cursor = pagination.hasMore ? pagination.cursor : null;
  } while (cursor);
  ```

  ```python Python theme={null}
  import requests

  params = {"query": "refund"}
  conversations = []

  while True:
      response = requests.get(
          "https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/conversations/search",
          headers={"Authorization": "Bearer YOUR_API_KEY"},
          params=params,
      )
      body = response.json()
      conversations.extend(body["data"])
      if not body["pagination"]["hasMore"]:
          break
      params["cursor"] = body["pagination"]["cursor"]
  ```
</CodeGroup>

A cursor only works with the search that produced it. Changing any parameter other than `limit` while paging returns `VALIDATION_CURSOR_QUERY_MISMATCH`.

## Limits

* **12 months.** Search covers conversations created since the first day of the month 12 months ago (UTC). For older conversations, use [Export conversations](/docs/api-v2/conversations/export-conversations).
* **10 searches per second** per account. Above that you get a `429` with a `Retry-After` header.
* **A few seconds behind.** New messages take a few seconds to become searchable.
* **HIPAA and redacted AI agents** can't use `query`. Filters still work.
* **Permissions.** If your API key is scoped, it needs `chatlogs:export`.

## MCP

The [Chatbase MCP server](/docs/developer-guides/mcp) exposes search as `chatbase_search_conversations`. It accepts up to 5 searches in one call through a `searches` array and returns the results in the same order.

## Error codes

Search-specific error codes beyond the standard [authentication and rate-limiting errors](/docs/api-v2/error-handling):

<table>
  <thead>
    <tr>
      <th style={{ whiteSpace: 'nowrap' }}>Code</th>
      <th>HTTP</th>
      <th>Description</th>
    </tr>
  </thead>

  <tbody>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>VALIDATION\_SEARCH\_WINDOW\_EXCEEDED</code></td><td>400</td><td>A date is before the 12-month search window. The message gives the window's start.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>VALIDATION\_CURSOR\_QUERY\_MISMATCH</code></td><td>400</td><td>The cursor came from a search with different parameters. Restart without a cursor.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>VALIDATION\_INVALID\_CURSOR</code></td><td>400</td><td>The cursor is malformed. Pass <code>pagination.cursor</code> exactly as returned.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>VALIDATION\_INVALID\_DATE\_RANGE</code></td><td>400</td><td>A start date is after its end date.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>CONVERSATION\_SEARCH\_UNAVAILABLE</code></td><td>403</td><td>The account is HIPAA-enabled or the AI agent redacts conversation data, so <code>query</code> isn't allowed. Search with filters only.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>CONVERSATION\_SEARCH\_BUSY</code></td><td>503</td><td>Search timed out or is overloaded. Retry after a short delay.</td></tr>
  </tbody>
</table>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.