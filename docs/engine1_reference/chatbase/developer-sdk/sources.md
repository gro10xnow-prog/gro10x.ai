> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI Sources

> Add, list, update, and delete knowledge sources for a Chatbase AI agent from the terminal.

Use source commands to manage an AI agent's knowledge base — text, Q\&A pairs, links, and file uploads. For REST details, see [Sources API](/docs/api-v2/sources). Most commands require an agent ID (`-a agt_123`) or a [default agent](/docs/cli/config).

## Add sources

Text snippet:

```bash theme={null}
chatbase sources create --type text --name Guide --content "hello" -a agt_123
```

Website link (crawl mode):

```bash theme={null}
chatbase sources create --type link --url https://example.com --link-type crawl -a agt_123
```

Q\&A pair:

```bash theme={null}
chatbase sources create --type qna --data '{"questions":["Q1"],"answer":"A1"}' -a agt_123
```

File upload:

```bash theme={null}
chatbase sources create --file ./guide.pdf -a agt_123
```

Link types also include `individual` (single page) and `sitemap`.

## List and inspect

List sources for an AI agent:

```bash theme={null}
chatbase sources list -a agt_123
```

Show one source:

```bash theme={null}
chatbase sources get src_123 -a agt_123
```

View aggregated counts and sizes:

```bash theme={null}
chatbase sources summary -a agt_123
```

## Update and delete

Update a text, Q\&A, or link source:

```bash theme={null}
chatbase sources update src_123 --data '{"type":"text","content":"updated"}' -a agt_123
```

Replace a file source:

```bash theme={null}
chatbase sources update src_123 --file ./updated.pdf -a agt_123
```

Delete a source (restorable):

```bash theme={null}
chatbase sources delete src_123 -a agt_123
```

Deletes are permanent. `chatbase sources restore` is deprecated and does nothing.

## Changes take effect on their own

Every create, update, or delete trains the source right away. There is no train step. Check progress with:

```bash theme={null}
chatbase sources get src_123 -a agt_123
```

The `status` field reads `untrained` while the source trains, `trained` once it is live (usually within seconds), or `failed` if the run did not land.

See [CLI Agents](/docs/cli/agents) for the auto-resync schedule.

## Commands

| Command | Purpose |
| - | - |
| `chatbase sources create` | Create a source: text/qna/link (JSON) or a file upload |
| `chatbase sources delete` | Permanently delete a source and its knowledge |
| `chatbase sources get` | Show one source |
| `chatbase sources list` | List sources for an AI agent |
| `chatbase sources restore` | Deprecated. Deletes are final; this command does nothing |
| `chatbase sources summary` | Show aggregated source counts and sizes for an AI agent |
| `chatbase sources update` | Update an existing source (text, qna, link, or file) |

<Note>
  For every flag, run `chatbase sources <command> --help`.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.