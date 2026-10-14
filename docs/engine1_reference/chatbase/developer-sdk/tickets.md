> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI Tickets

> Create, triage, search, and reply to helpdesk tickets and look up teams and statuses from the terminal.

Use ticket and helpdesk commands to manage support tickets and their message threads. For REST details, see [Helpdesk](/docs/api-v2/helpdesk). Authenticate first — see [CLI Auth](/docs/cli/auth). Most commands require an agent ID (`-a agt_123`) or a [default agent](/docs/cli/config).

## Create a ticket

Open a ticket on behalf of a customer with a subject, description, and email:

```bash theme={null}
chatbase tickets create --subject "Export failing" -f description="Customer cannot export." --customer-email jane@example.com -a agt_123
```

Pass the full body as JSON instead of individual flags:

```bash theme={null}
chatbase tickets create --subject "Export failing" --data '{"description":"Customer cannot export.","customer":{"email":"jane@example.com"}}' -a agt_123
```

Use `--customer-name` when the email creates a new customer record. Set status, assignee, or team at creation time with `-f` or `--data` — see [Create a ticket](/docs/api-v2/helpdesk/create-a-ticket) for assignment rules.

## List and search tickets

List tickets for an AI agent, newest first:

```bash theme={null}
chatbase tickets list -a agt_123
```

Filter by status category, assignee, team, channel, or date range:

```bash theme={null}
chatbase tickets list -a agt_123 --status new,on_you --assignee-id none
```

Search ticket message content:

```bash theme={null}
chatbase tickets search "refund not received" -a agt_123
```

Fetch every page as JSON:

```bash theme={null}
chatbase tickets list -a agt_123 --all --json
```

## Get a ticket and read messages

Show one ticket by its per-agent number:

```bash theme={null}
chatbase tickets get 42 -a agt_123
```

List the ticket's message thread:

```bash theme={null}
chatbase tickets messages 42 -a agt_123
```

Include internal notes or system events with `--types`:

```bash theme={null}
chatbase tickets messages 42 -a agt_123 --types reply,note,event
```

## Reply to a ticket

Post a customer-visible reply attributed to a team member:

```bash theme={null}
chatbase tickets reply 42 -m "On it" --author-email sam@example.com -a agt_123
```

The message body is GitHub-flavored Markdown. A 201 means the reply was recorded, not that it reached the customer — delivery is asynchronous.

## Update status, assignee, or team

Look up valid status IDs and team IDs before you update:

```bash theme={null}
chatbase helpdesk statuses -a agt_123
chatbase helpdesk teams -a agt_123
```

Close a ticket by status category:

```bash theme={null}
chatbase tickets update 42 --data '{"statusCategory":"closed"}' -a agt_123
```

Assign to a team member or set a specific status ID:

```bash theme={null}
chatbase tickets update 42 -f assigneeEmail=sam@example.com -f statusId=sts_abc -a agt_123
```

Use `statusCategory` to resolve to that category's default status, or `statusId` for a specific configured status. See [Statuses](/docs/api-v2/helpdesk#statuses) and [Update a ticket](/docs/api-v2/helpdesk/update-a-ticket).

## Look up teams and statuses

List helpdesk teams (including the default):

```bash theme={null}
chatbase helpdesk teams -a agt_123
```

List configured ticket statuses with IDs and labels:

```bash theme={null}
chatbase helpdesk statuses -a agt_123
```

Use `--json` to pipe IDs into scripts.

## Commands

| Command | Purpose |
| - | - |
| `chatbase helpdesk statuses` | List ticket statuses for an AI agent |
| `chatbase helpdesk teams` | List helpdesk teams for an AI agent |
| `chatbase tickets create` | Create a helpdesk ticket |
| `chatbase tickets get` | Show one helpdesk ticket |
| `chatbase tickets list` | List helpdesk tickets for an AI agent |
| `chatbase tickets messages` | List a ticket's message thread |
| `chatbase tickets reply` | Post an agent reply to a ticket's message thread |
| `chatbase tickets search` | Search tickets by message content |
| `chatbase tickets update` | Update a ticket's status, assignee, and/or team |

<Note>
  For every flag, run `chatbase tickets <command> --help` or `chatbase helpdesk <command> --help`.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.