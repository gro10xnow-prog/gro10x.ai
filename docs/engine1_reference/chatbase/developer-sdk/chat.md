> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI Chat

> Send messages to an AI agent, continue conversations, and retry assistant responses from the terminal.

Use chat commands to send messages to an AI agent and read responses in your terminal. For REST details, see [User Conversations](/docs/api-v2/user-conversations) and [Streaming](/docs/api-v2/streaming). Authenticate first — see [CLI Auth](/docs/cli/auth). Pass an agent ID with `-a agt_123`, look one up with `--agent-name`, set `CHATBASE_AGENT_ID`, or configure a [default agent](/docs/cli/config).

## Send a message

Send a one-shot message:

```bash theme={null}
chatbase chat -a agt_123 -m "How do I reset my password?"
```

Pipe text from stdin instead of `-m`:

```bash theme={null}
echo "summarize our refund policy" | chatbase chat -a agt_123
```

If you omit both `-m` and stdin, the CLI starts an interactive REPL.

By default, responses stream token-by-token to your terminal. See [Streaming](/docs/api-v2/streaming) for event types and how to parse them in scripts.

## Continue a conversation

Pass a `conversationId` from a previous response to send a follow-up message:

```bash theme={null}
chatbase chat -a agt_123 -m "and then?" --conversation conv_123
```

Add `--resume` to replay the last few messages when continuing, so the AI agent has recent context without you re-sending it.

<Tip>
  Save the `conversationId` from a `--json` response or from the streaming `finish` event metadata. See [User Conversations](/docs/api-v2/user-conversations) for per-user history and listing conversations by user.
</Tip>

## Scripting output

Wait for the complete response instead of streaming:

```bash theme={null}
chatbase chat -a agt_123 -m "hi" --no-stream
```

Output raw API JSON for parsing in scripts:

```bash theme={null}
chatbase chat -a agt_123 -m "hi" --json
```

Use `--plain` for tab-separated output. Combine with `--quiet` in CI pipelines.

## Retry a response

Regenerate an assistant message and discard it plus everything after it in the conversation:

```bash theme={null}
chatbase chat retry --conversation c_123 -a agt_123 --message-id msg_456
```

Wait for the full retry response instead of streaming:

```bash theme={null}
chatbase chat retry --conversation c_123 -a agt_123 --message-id msg_456 --no-stream
```

## Commands

| Command | Purpose |
| - | - |
| `chatbase chat` | Send a message to an AI agent and print its response |
| `chatbase chat retry` | Retry generating an assistant response (discards that message and everything after it in the conversation) |

<Note>
  For every flag, run `chatbase chat --help` or `chatbase chat retry --help`.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.