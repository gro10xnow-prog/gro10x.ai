> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Sources

> Programmatically manage the knowledge sources that power your Chatbase AI agent — web pages, documents, Q&A pairs, and text.

The Sources API lets you manage the content your AI agent is trained on. You can list, inspect, create, update, and delete sources without touching the dashboard.

Sources train on write. Creating, updating, or deleting a source takes effect on its own within seconds. There is no separate train call.

## Hostname routing

<Warning>
  **File upload operations use a different base URL from all other endpoints.**

  | Operation | Base URL |
  | - | - |
  | All read operations and JSON-body writes | `https://www.chatbase.co/api/v2` |
  | Create or update **file** sources | `https://files.chatbase.co/api/v2` |

  Using the wrong host for file uploads will return a 404.
</Warning>

## Source types

| Type | List | Get | Create | Update | Delete | |
| - | - | - | - | - | - | - |
| `text` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `qna` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `link` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `file` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `notionPage` | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |

Notion pages appear in list and get results, but cannot be created or updated via the API. Manage Notion sources through the Notion integration in the dashboard.

## Source status

Every source has a `status` field. It is the completion signal: poll `GET /agents/{agentId}/sources/{sourceId}` until it reads `trained` or `failed`.

| Status | Meaning |
| - | - |
| `untrained` | Just created. Training has started and usually finishes within seconds. |
| `trained` | Live. The AI agent answers from this content. |
| `updated` | Content changed. The new version is training; the old version stays live until it lands. |
| `toBeDeleted` | Delete in progress. The row disappears once the purge finishes, normally before the DELETE response returns. |
| `failed` | The last training run did not land. An earlier trained version, if any, stays live. Fix the source (or re-save it) to retry; the dashboard shows the reason. |
| `deleted` | Removed. Returned only by the DELETE response; never appears in list or get results. |

`shouldRetrain: true` from [Get sources summary](/docs/api-v2/sources/get-sources-summary) means at least one source is still `untrained`, `updated`, or `toBeDeleted`. Nothing to do; wait for them to settle.

## Editing a source that is training

A source can be edited by one writer at a time. `PUT` while it is still training returns `409 SOURCE_IS_TRAINING`. Wait for `trained`, then retry. Delete is always accepted.

## Deletes are permanent

`DELETE` removes the source and its knowledge immediately. There is no pending state and no undo. The restore endpoint is deprecated and returns a no-op success.

## File upload rate limit

File uploads are limited to 10 per minute per account. Space uploads at least 6 seconds apart. A `429` counts toward the window, so retrying into it keeps it closed; wait, do not retry in a tight loop.

## Endpoints

<CardGroup cols={2}>
  <Card title="List sources" icon="list" href="/docs/api-v2/sources/list-sources">
    Paginated list with optional type and name filters
  </Card>

  <Card title="Sources summary" icon="chart-bar" href="/docs/api-v2/sources/get-sources-summary">
    Aggregate counts and sizes per source type
  </Card>

  <Card title="Get source" icon="magnifying-glass" href="/docs/api-v2/sources/get-source">
    Retrieve a single source by ID
  </Card>

  <Card title="Create source" icon="plus" href="/docs/api-v2/sources/create-source">
    Create text, Q\&A, and link sources
  </Card>

  <Card title="Create file source" icon="file-arrow-up" href="/docs/api-v2/sources/create-file-source">
    Upload PDF, DOCX, or TXT files
  </Card>

  <Card title="Update source" icon="pen" href="/docs/api-v2/sources/update-source">
    Update text, Q\&A, and link sources
  </Card>

  <Card title="Update file source" icon="file-pen" href="/docs/api-v2/sources/update-file-source">
    Replace file content or rename a file source
  </Card>

  <Card title="Delete source" icon="trash" href="/docs/api-v2/sources/delete-source">
    Permanently remove a source and its knowledge
  </Card>
</CardGroup>

## Error codes

Sources-specific error codes beyond the standard [authentication and rate-limiting errors](/docs/api-v2/error-handling):

<table>
  <thead>
    <tr>
      <th style={{ whiteSpace: 'nowrap' }}>Code</th>
      <th>HTTP</th>
      <th>Description</th>
    </tr>
  </thead>

  <tbody>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>SOURCE\_NOT\_FOUND</code></td><td>404</td><td>Source doesn't exist, belongs to a different AI agent, or has been permanently deleted.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>SOURCE\_TYPE\_NOT\_SUPPORTED</code></td><td>400</td><td>Attempting to update a <code>notionPage</code> via PUT. Manage Notion sources through the dashboard.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>SOURCE\_IS\_TRAINING</code></td><td>409</td><td>The source is still training. Wait for <code>trained</code>, then retry the edit.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>SOURCE\_PENDING\_DELETION</code></td><td>409</td><td>The source is being deleted. It cannot be edited.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>SOURCE\_ALREADY\_PENDING\_DELETION</code></td><td>409</td><td>DELETE was called on a source that is already being deleted.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>SOURCE\_LINK\_LIMIT\_EXCEEDED</code></td><td>422</td><td>The 15 crawl/sitemap-parent limit per AI agent has been reached. Delete an existing crawl or sitemap source before adding another.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>SOURCE\_SIZE\_LIMIT\_EXCEEDED</code></td><td>422</td><td>Creating or updating this source would exceed the plan's storage limit. Remove existing sources or upgrade your plan.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>SOURCE\_DUPLICATE</code></td><td>409</td><td>A link source with this URL and <code>linkType</code> already exists for this AI agent.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>SOURCE\_URL\_IMMUTABLE</code></td><td>400</td><td>A link's URL cannot be changed via PUT. Delete and recreate the source to use a different URL.</td></tr>
  </tbody>
</table>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.