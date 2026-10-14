> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI Agents

> Create, inspect, update, clone, and delete Chatbase AI agents from the terminal.

Use AI agent commands to manage the AI agents in your workspace. For REST details, see [Agents API](/docs/api-v2/agents). Authenticate first — see [CLI Auth](/docs/cli/auth).

## List and inspect

List every AI agent in the workspace:

```bash theme={null}
chatbase agents list
```

Show one AI agent by ID:

```bash theme={null}
chatbase agents get agt_123
```

Use `--json` or `--plain` for scripting. Set a default agent with [CLI Config](/docs/cli/config) so you can omit the ID on `get` and other commands.

## Create and configure

Create a new AI agent:

```bash theme={null}
chatbase agents create --name "Support Bot" --instructions "Be helpful"
```

Update name, instructions, model, and other fields:

```bash theme={null}
chatbase agents update agt_123 --name "Support Bot v2"
```

Update chat widget appearance (theme, colors, etc.):

```bash theme={null}
chatbase agents styles agt_123 --data '{"chat":{"theme":"dark"}}'
```

Pass a JSON file with `@styles.json` instead of inline JSON when you have many style properties.

## Auto-resync and duplicate

Sources train on their own when you add or change them, so there is no train step. `chatbase agents train` is deprecated and does nothing.

Turn on the weekly auto-resync for websites, Notion pages, and tickets:

```bash theme={null}
chatbase agents auto-retrain agt_123 --enabled
```

Clone an AI agent and its sources (Notion sources are excluded):

```bash theme={null}
chatbase agents clone agt_123
```

## Delete an AI agent

Permanently remove an AI agent:

```bash theme={null}
chatbase agents delete agt_123
```

<Warning>
  Deletion cannot be undone. In scripts and CI, pass `--confirm agt_123` to skip the interactive prompt.
</Warning>

## Commands

| Command | Purpose |
| - | - |
| `chatbase agents auto-retrain` | Enable or disable the weekly auto-resync of websites, Notion pages, and tickets |
| `chatbase agents clone` | Clone an AI agent, including all its sources (excluding Notion) |
| `chatbase agents create` | Create a new AI agent |
| `chatbase agents delete` | Permanently delete an AI agent (cannot be undone) |
| `chatbase agents get` | Show one AI agent |
| `chatbase agents list` | List all AI agents in the workspace |
| `chatbase agents styles` | Update visual styles for an AI agent |
| `chatbase agents train` | Deprecated. Sources train on write; this command does nothing |
| `chatbase agents update` | Update an existing AI agent |

<Note>
  For every flag, run `chatbase agents <command> --help`.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.