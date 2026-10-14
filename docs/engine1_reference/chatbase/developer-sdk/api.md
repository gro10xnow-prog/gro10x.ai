> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI API

> Call any Chatbase API v2 endpoint from the terminal when no dedicated CLI command exists.

Use `chatbase api` as an escape hatch for [API v2](/docs/api-v2/overview) endpoints that do not have a dedicated CLI command. Pass an HTTP method and a path relative to `/api/v2` — for example, `/agents` maps to `https://www.chatbase.co/api/v2/agents`. Authenticate first — see [CLI Auth](/docs/cli/auth).

## List resources

Fetch a collection:

```bash theme={null}
chatbase api GET /agents
```

Limit results with `--field`:

```bash theme={null}
chatbase api GET /agents --field limit=5
```

Add URL query parameters with `--query` (repeatable):

```bash theme={null}
chatbase api GET /agents --query limit=5 --query status=active
```

## Create a resource

Send a JSON body inline:

```bash theme={null}
chatbase api POST /agents --body '{"name":"Support Bot"}'
```

Set individual body fields instead of raw JSON:

```bash theme={null}
chatbase api POST /agents --field name="Support Bot"
```

## Update a resource

Read the body from a file with `@`:

```bash theme={null}
chatbase api PATCH /agents/agt_123 --body @patch.json
```

Pipe JSON from stdin with `@-`:

```bash theme={null}
echo '{"name":"Renamed Bot"}' | chatbase api PATCH /agents/agt_123 --body @-
```

## Request options

| Flag | Purpose |
| - | - |
| `--body` | JSON request body — inline JSON, `@file`, or `@-` for stdin |
| `--field` / `-f` | Set a body field as `key=value` (repeatable) |
| `--query` | Add a URL query parameter as `key=value` (repeatable) |

Supported methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

Use `--json` for raw API JSON in scripts. See [Chatbase CLI](/docs/cli/overview) for other global output flags.

## Commands

| Command | Purpose |
| - | - |
| `chatbase api METHOD PATH` | Call any API v2 endpoint directly |

<Note>
  For every flag, run `chatbase api --help`.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.