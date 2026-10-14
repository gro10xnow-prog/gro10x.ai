> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI Config

> Set and inspect Chatbase CLI defaults such as the active AI agent and request timeout.

CLI config stores defaults so you do not need to pass `-a` on every command.

## Set a default agent

```bash theme={null}
chatbase config set agent agt_123
```

Omit the value to pick an AI agent interactively:

```bash theme={null}
chatbase config set agent
```

## Set timeout

Timeout is in milliseconds:

```bash theme={null}
chatbase config set timeout 60000
```

## Inspect config

```bash theme={null}
chatbase config get agent
chatbase config list
```

`get` and `list` show the resolved value and where it comes from (config file, environment, flag).

## Commands

| Command | Purpose |
| - | - |
| `chatbase config set KEY [VALUE]` | Set `agent` or `timeout` |
| `chatbase config get KEY` | Print one resolved value and its source |
| `chatbase config list` | List every resolved value and source |

Supported keys: `agent`, `timeout`.

You can also set `CHATBASE_AGENT_ID` in the environment. See [Chatbase CLI](/docs/cli/overview) for CI patterns.

<Note>
  For every flag, run `chatbase config <command> --help`.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.