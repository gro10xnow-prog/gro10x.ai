> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Agents

> Programmatically create, configure, and manage your Chatbase AI agents.

The Agents API gives you full programmatic control over your AI agents — create them, configure their behavior and widget styles, and clone them for reuse. Training is not a separate step: sources train as soon as you write them (see the [Sources API](/docs/api-v2/sources)). All endpoints are scoped to the account that owns the API key; a request for another account's AI agent returns 404, not 403, to avoid leaking existence.

## AI agent status

The `status` field on an AI agent is derived from its sources:

| Status | Meaning |
| - | - |
| `untrained` | No live sources yet |
| `training` | At least one source is still being processed |
| `failed` | A source failed to train; the others are live |
| `trained` | Every source is live |

To follow one source, poll `GET /agents/{agentId}/sources/{sourceId}`. To follow the whole AI agent, poll `GET /agents/{agentId}`.

## Partial updates

`PUT /agents/{agentId}` uses **partial update semantics** — only the fields you include are changed.

| What you send | Result |
| - | - |
| Omit a field | No change — field keeps its current value |
| Send a value | Field is updated to that value |
| Send `null` (nullable fields only) | Feature is disabled or field resets to default |

Example: `{ "voiceSettings": null }` disables voice mode. An empty body `{}` makes no changes.

The `ipRateLimits` object also supports partial updates within itself — send only the sub-fields you want to change without affecting the others.

## `pendingSteps`

Create and clone both return a 201 even when secondary steps fail. The AI agent always exists — `id` is always in the response. `pendingSteps` tells you what to retry:

| Step | Meaning | Recovery |
| - | - | - |
| `ADD_SOURCE` | The `url` could not be added as a source | Add sources manually via the [Sources API](/docs/api-v2/sources/create-source) |
| `TRAIN_AGENT` | Kept for compatibility. Sources train on write, so no action is needed. | None |

When `pendingSteps` is absent, all steps succeeded.

## Training happens on write

Each source trains on its own as soon as it is created, updated, or deleted. `POST /agents/{agentId}/train` is deprecated: it returns `200` with `deprecated: true` and a `Deprecation` header, and does nothing. Remove it from your integration and poll source `status` instead.

## Endpoints

<CardGroup cols={2}>
  <Card title="List AI agents" icon="list" href="/docs/api-v2/agents/list-agents">
    Paginated list of all AI agents for the account
  </Card>

  <Card title="Create AI agent" icon="plus" href="/docs/api-v2/agents/create-agent">
    Create a new AI agent, optionally seeded with a URL
  </Card>

  <Card title="Get AI agent" icon="magnifying-glass" href="/docs/api-v2/agents/get-agent">
    Retrieve full AI agent details by ID
  </Card>

  <Card title="Update AI agent" icon="pen" href="/docs/api-v2/agents/update-agent">
    Partial update of AI agent configuration
  </Card>

  <Card title="Update AI agent styles" icon="palette" href="/docs/api-v2/agents/update-agent-styles">
    Configure chat widget and center stage appearance
  </Card>

  <Card title="Clone AI agent" icon="copy" href="/docs/api-v2/agents/clone-agent">
    Deep-copy an AI agent including all its sources
  </Card>

  <Card title="Toggle auto-resync" icon="rotate" href="/docs/api-v2/agents/toggle-auto-retrain">
    Re-sync websites, Notion pages, and tickets on a weekly schedule
  </Card>

  <Card title="Delete AI agent" icon="trash" href="/docs/api-v2/agents/delete-agent">
    Permanently delete an AI agent and all its data
  </Card>
</CardGroup>

## Error codes

Agent-specific error codes beyond the standard [authentication and rate-limiting errors](/docs/api-v2/error-handling):

<table>
  <thead>
    <tr>
      <th style={{ whiteSpace: 'nowrap' }}>Code</th>
      <th>HTTP</th>
      <th>Description</th>
    </tr>
  </thead>

  <tbody>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>AGENT\_NOT\_FOUND</code></td><td>404</td><td>AI agent doesn't exist or doesn't belong to the authenticated account.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>AGENT\_NOT\_TRAINED</code></td><td>409</td><td>Auto-resync needs at least one live source. Add a source and wait for it to reach <code>trained</code>.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>AGENT\_LIMIT\_REACHED</code></td><td>403</td><td>The account has reached its plan's maximum number of AI agents. Delete an existing AI agent or upgrade your plan.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>PLAN\_FEATURE\_NOT\_AVAILABLE</code></td><td>403</td><td>The requested feature is not available on the current plan. Upgrade to unlock it.</td></tr>
  </tbody>
</table>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.