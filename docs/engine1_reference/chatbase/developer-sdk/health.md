> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI Health

> Verify that the Chatbase API is reachable from your terminal or CI pipeline.

Use `chatbase health` to confirm the Chatbase API is reachable before running other commands — for example in CI preflight checks, after network or proxy changes, or when debugging authentication issues. No API key is required.

## Check reachability

```bash theme={null}
chatbase health
```

Exits successfully when the API responds.

## Scripting output

Output raw JSON for automated checks:

```bash theme={null}
chatbase health --json
```

Combine with `--quiet` in CI pipelines. See [Chatbase CLI](/docs/cli/overview) for other global output flags.

## Commands

| Command | Purpose |
| - | - |
| `chatbase health` | Check that the Chatbase API is reachable |

<Note>
  For every flag, run `chatbase health --help`.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.