> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Helpdesk

> Programmatically create, triage, and reply to support tickets for your Chatbase AI agents.

The Helpdesk API is the same ticketing that powers the Helpdesk tab in the dashboard. You can create tickets on behalf of customers, list and search them, and change a ticket's status, assignee, or team. Each ticket carries a message thread you can read and reply to.

Tickets are numbered per AI agent. The `ticketNumber` path parameter is that per-agent number, not a global id. A ticket's `channel` records where it originated, such as email, the chat widget, or WhatsApp. Tickets created through this API always have `channel: "api"`.

## Statuses

Each ticket has a status, and each status belongs to one of six fixed categories: `new`, `on_you`, `on_customer`, `on_hold`, `closed`, `cancelled`. The statuses themselves are configured per agent in the dashboard; every category has exactly one default status.

Write endpoints accept a status in one of two forms, at most one per request:

| Field | Meaning |
| - | - |
| `statusId` | A specific configured status. Must belong to the AI agent and be active; archived statuses are rejected. |
| `statusCategory` | Resolves to that category's default status. |

[List ticket statuses](/docs/api-v2/helpdesk/list-ticket-statuses) returns the AI agent's active statuses with their ids, categories, and labels. Each status has two labels: `externalLabel` is what the customer sees, `internalLabel` is what the dashboard shows.

## Assignment and routing

When you create a ticket, the assignee fields decide whether auto-assignment runs. `assigneeId` and `assigneeEmail` are a mutually exclusive pair; sending both is a 400.

| Assignee | `teamId` | Result |
| - | - | - |
| Provided | Any | Written as given. No auto-assignment. |
| `assigneeId: null` | Any | Ticket is created unassigned. The team is still written if given. |
| Omitted | Provided | An agent is picked within that team by its assignment strategy. Routing rules are skipped. |
| Omitted | Omitted | Routing rules pick both the team and the assignee. |

[Update a ticket](/docs/api-v2/helpdesk/update-a-ticket) never auto-assigns. Omitted fields keep their current value, `assigneeId: null` unassigns the ticket, and `teamId: null` clears the team.

[List teams](/docs/api-v2/helpdesk/list-teams) returns the AI agent's teams; exactly one is the default.

## Messages

A ticket's thread contains three message types:

| Type | Meaning |
| - | - |
| `reply` | Customer-visible. Delivered over the ticket's origin channel. |
| `note` | Internal. Never delivered to the customer. |
| `event` | System record of a change, such as a status transition or assignment. Excluded from list results unless requested via `types`. |

[Add a message to a ticket](/docs/api-v2/helpdesk/add-a-message-to-a-ticket) currently accepts only `type: "reply"`, attributed to a team member via `authorId` or `authorEmail`. The body is GitHub-flavored Markdown; raw HTML is stripped. Delivery to the customer is asynchronous, so a 201 means the reply was recorded, not that it reached the customer.

## Endpoints

<CardGroup cols={2}>
  <Card title="List tickets" icon="list" href="/docs/api-v2/helpdesk/list-tickets">
    Filterable, sortable, paginated list
  </Card>

  <Card title="Search tickets" icon="magnifying-glass" href="/docs/api-v2/helpdesk/search-tickets">
    Free-text search over ticket messages
  </Card>

  <Card title="Create a ticket" icon="plus" href="/docs/api-v2/helpdesk/create-a-ticket">
    Open a ticket on behalf of a customer
  </Card>

  <Card title="Get a ticket" icon="ticket" href="/docs/api-v2/helpdesk/get-a-ticket">
    Retrieve a single ticket by number
  </Card>

  <Card title="Update a ticket" icon="pen" href="/docs/api-v2/helpdesk/update-a-ticket">
    Change status, assignee, or team
  </Card>

  <Card title="List ticket messages" icon="messages" href="/docs/api-v2/helpdesk/list-ticket-messages">
    Read a ticket's thread
  </Card>

  <Card title="Add a message to a ticket" icon="reply" href="/docs/api-v2/helpdesk/add-a-message-to-a-ticket">
    Post an agent reply
  </Card>

  <Card title="List teams" icon="users" href="/docs/api-v2/helpdesk/list-teams">
    The AI agent's teams and the default
  </Card>

  <Card title="List ticket statuses" icon="tags" href="/docs/api-v2/helpdesk/list-ticket-statuses">
    Configured statuses with ids and labels
  </Card>
</CardGroup>

## Error codes

Helpdesk-specific error codes beyond the standard [authentication and rate-limiting errors](/docs/api-v2/error-handling):

<table>
  <thead>
    <tr>
      <th style={{ whiteSpace: 'nowrap' }}>Code</th>
      <th>HTTP</th>
      <th>Description</th>
    </tr>
  </thead>

  <tbody>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TICKET\_NOT\_FOUND</code></td><td>404</td><td>No ticket matches this number for the AI agent.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>CONVERSATION\_NOT\_TAKEN\_OVER</code></td><td>409</td><td>The ticket is linked to a live conversation that has not been taken over from the AI agent, so a human reply cannot be posted. Take over the conversation from the dashboard first.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>MESSAGE\_CONTENT\_NOT\_RENDERABLE</code></td><td>422</td><td>The message body rendered to empty HTML. This happens when it consists only of raw HTML, which is stripped. Send Markdown or plain text.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TICKET\_INVALID\_STATUS</code></td><td>422</td><td><code>statusId</code> does not belong to a status for this AI agent.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TICKET\_ARCHIVED\_STATUS</code></td><td>422</td><td><code>statusId</code> refers to an archived status, which cannot be applied.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TICKET\_TEAM\_MEMBER\_NOT\_FOUND</code></td><td>422</td><td>Neither <code>assigneeId</code> nor <code>assigneeEmail</code> resolved to a team member on this account.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TICKET\_TEAM\_NOT\_FOUND</code></td><td>422</td><td><code>teamId</code> does not belong to a team for this AI agent.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TEAM\_MEMBER\_NOT\_FOUND</code></td><td>422</td><td>On message creation, neither <code>authorId</code> nor <code>authorEmail</code> resolved to a team member on this account.</td></tr>
  </tbody>
</table>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.