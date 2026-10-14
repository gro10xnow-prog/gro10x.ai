> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI Auth

> Authenticate the Chatbase CLI with an API key or browser login, and inspect or remove stored credentials.

Use auth commands to store credentials for interactive use. For CI, prefer the `CHATBASE_API_KEY` environment variable instead of a stored key — see [Chatbase CLI](/docs/cli/overview).

## Log in with the browser

For interactive use, log in through your browser:

```bash theme={null}
chatbase auth login --browser
```

The CLI opens a browser window and prints a short device code. Open [chatbase.co/activate](https://www.chatbase.co/activate), sign in if needed, and approve the code. When approval succeeds, the CLI stores the credential locally so later commands are authenticated.

## Log in with an API key

Paste a key interactively:

```bash theme={null}
chatbase auth login
```

Or pipe a key from a file or secret store:

```bash theme={null}
cat key.txt | chatbase auth login --with-token
```

Create keys in **Workspace settings → API keys** (Standard plan or higher).

## Check status

```bash theme={null}
chatbase auth status
```

Shows the active credential and where it comes from (stored key, environment, etc.).

## Log out

```bash theme={null}
chatbase auth logout
```

Removes the stored API key. CLI-paired keys are revoked server-side when applicable.

## Commands

| Command | Purpose |
| - | - |
| `chatbase auth login` | Authenticate (paste key, `--with-token`, or `--browser`) |
| `chatbase auth status` | Show active credential and source |
| `chatbase auth logout` | Remove stored API key |

<Note>
  For every flag, run `chatbase auth <command> --help`.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.