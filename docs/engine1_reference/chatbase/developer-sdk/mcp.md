> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# MCP Server

> Connect Claude, ChatGPT, Codex, Cursor and other MCP clients to your Chatbase workspace over OAuth.

The Chatbase MCP server lets an AI assistant work directly with your Chatbase workspace. It can list AI agents, manage the sources an AI agent is trained on, read conversations, and handle help desk tickets, without you copying data between tools.

It is a remote [Model Context Protocol](https://modelcontextprotocol.io) server. There is nothing to install or self-host.

<CardGroup cols={2}>
  <Card title="Endpoint" icon="link">
    `https://mcp.chatbase.co/api/mcp`
  </Card>

  <Card title="Authentication" icon="shield-check">
    OAuth 2.1, with no API key to create or paste
  </Card>
</CardGroup>

<Note>
  The endpoint is not a page to open in your browser. Add it to an MCP client, and the client opens the sign-in page for you.
</Note>

## Claude and ChatGPT

Chatbase is available as a connector. Install it in one click, then approve access when prompted.

<CardGroup cols={2}>
  <Card title="Add to Claude" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" /></svg>} href="https://claude.ai/directory/connectors/chatbase">
    Works in Claude.ai and the Claude desktop app.
  </Card>

  <Card title="Add to ChatGPT" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" /></svg>} href="https://chatgpt.com/plugins?q=chatbase">
    Works in ChatGPT on web and desktop.
  </Card>
</CardGroup>

If the connector is not available in your workspace, add it manually under **Settings → Connectors → Add custom connector** using the endpoint above.

<Warning>
  On ChatGPT's default **Allow low-risk actions** setting, the tools marked destructive are hidden rather than offered with a confirmation prompt. That covers deleting an AI agent or a source, and editing a source. If ChatGPT says it cannot delete or edit something, raise the permission setting for the connector.
</Warning>

## Claude Code, Codex, Cursor and other clients

Point the client at the endpoint. Do not add an `Authorization` header. The client negotiates OAuth on its own and opens the sign-in page for you.

<Tabs>
  <Tab title="Claude Code">
    ```bash theme={null}
    claude mcp add --transport http chatbase https://mcp.chatbase.co/api/mcp
    ```

    Then run `/mcp` and choose **Authenticate**.

    Or install the plugin, which bundles the server configuration and usage guidance:

    ```bash theme={null}
    claude plugin marketplace add Chatbase-co/chatbase-plugin
    claude plugin install chatbase@chatbase
    ```
  </Tab>

  <Tab title="Codex">
    ```bash theme={null}
    codex mcp add chatbase --url https://mcp.chatbase.co/api/mcp
    codex mcp login chatbase
    ```

    Or install the plugin:

    ```bash theme={null}
    codex plugin marketplace add Chatbase-co/chatbase-plugin
    codex plugin add chatbase@chatbase
    ```
  </Tab>

  <Tab title="Cursor">
    Add the server under **Settings → MCP → Add new MCP server**, or edit `~/.cursor/mcp.json`:

    ```json theme={null}
    {
      "mcpServers": {
        "chatbase": {
          "type": "http",
          "url": "https://mcp.chatbase.co/api/mcp"
        }
      }
    }
    ```
  </Tab>

  <Tab title="Other JSON clients">
    Most MCP clients, including VS Code, Windsurf, Zed and OpenCode, take the same shape:

    ```json theme={null}
    {
      "mcpServers": {
        "chatbase": {
          "type": "http",
          "url": "https://mcp.chatbase.co/api/mcp"
        }
      }
    }
    ```
  </Tab>
</Tabs>

<Warning>
  If you already added `chatbase` manually, remove that entry before installing the plugin. A client will not show two servers with the same URL, so the plugin's server appears to be missing when it is really a duplicate.
</Warning>

## How sign-in works

<Steps>
  <Step title="Your client registers itself">
    The first time a client connects, it registers with Chatbase automatically using Dynamic Client Registration. You do not create anything in advance.
  </Step>

  <Step title="You approve access in the browser">
    Chatbase shows a consent screen listing the workspace and exactly which permissions the app is asking for. You choose the workspace and approve or deny.
  </Step>

  <Step title="The client receives a token">
    Access is granted to that one client, for that one workspace, limited to the permissions you approved.
  </Step>
</Steps>

<Info>
  Chatbase never shows an app more than your own role allows. If you cannot delete sources, no app you approve can delete them either, even if it asks.
</Info>

### Token lifetime

| | |
| - | - |
| Access token | Expires after 1 hour; the client refreshes it silently |
| Approval | Expires automatically after 90 days |
| Revocation | Takes effect immediately |

## Permissions

Chatbase groups permissions by resource and verb. An app requests a set, and you approve or deny the whole request.

| Resource | Read | Write | Delete | Export |
| - | - | - | - | - |
| AI agents | `agents:read` | `agents:write` | `agents:delete` | — |
| Sources | `sources:read` | `sources:write` | `sources:delete` | — |
| Conversations | `chatlogs:read` | `chatlogs:write` | `chatlogs:delete` | `chatlogs:export` |
| Help desk | `helpdesk_tickets:read` | `helpdesk_tickets:write` | `helpdesk_tickets:delete` | — |

Delete permissions are shown on the consent screen but are **not** selected by default. Approve them only if the app genuinely needs to remove data.

A client only sees the tools its permissions cover. A short tool list usually means a narrow approval rather than a missing feature. Ask the assistant to call `chatbase_whoami`, which reports the workspace and the exact permissions in use.

## What the assistant can do

The server exposes 27 tools: `chatbase_whoami`, which every connected app can call to report its own access, plus 26 grouped by area.

<AccordionGroup>
  <Accordion title="AI agents" icon="robot">
    List and inspect AI agents, create and clone them, update configuration, toggle auto-retrain, and send a chat message to an AI agent.

    `chatbase_list_agents` · `chatbase_get_agent` · `chatbase_create_agent` · `chatbase_clone_agent` · `chatbase_update_agent` · `chatbase_update_agent_auto_retrain` · `chatbase_delete_agent` · `chatbase_chat`
  </Accordion>

  <Accordion title="Sources" icon="database">
    Add, edit and remove the knowledge an AI agent is trained on. Every change takes effect immediately, with no separate training step.

    `chatbase_list_sources` · `chatbase_get_source` · `chatbase_get_sources_summary` · `chatbase_create_source` · `chatbase_update_source` · `chatbase_delete_source`
  </Accordion>

  <Accordion title="Conversations" icon="messages">
    Search conversations by text and filters, export them for analysis, and update conversation metadata. Search takes up to 5 searches in one call.

    `chatbase_search_conversations` · `chatbase_export_conversations` · `chatbase_update_conversation`
  </Accordion>

  <Accordion title="Help desk" icon="ticket">
    Search, read and update tickets, post replies, and inspect teams and statuses.

    `chatbase_list_tickets` · `chatbase_search_tickets` · `chatbase_get_ticket` · `chatbase_create_ticket` · `chatbase_update_ticket` · `chatbase_list_ticket_messages` · `chatbase_create_ticket_message` · `chatbase_list_ticket_statuses` · `chatbase_list_helpdesk_teams`
  </Accordion>
</AccordionGroup>

<Warning>
  Two source operations cannot be undone. **Deleting a source** purges its knowledge straight away and nothing restores it. Re-creating the source afterwards starts from scratch. **Editing a source** overwrites its content and retrains it on the spot, so the previous text is gone. Both are marked destructive, so a well-behaved client will ask before running them.
</Warning>

## Manage connected apps

Every app you approve appears in your workspace under **Settings → General → Connected apps**, showing what it can access and when it last obtained a token.

Select **Revoke** to cut off access. It takes effect on the app's very next request, even if its current token has not expired. The app must ask for your approval again before it can reconnect.

<Info>
  An app's name is chosen by the app itself when it registers, and Chatbase cannot verify it. Treat the name as a label, not as proof of identity, and revoke anything you do not recognise.
</Info>

## Troubleshooting

<AccordionGroup>
  <Accordion title="The client says the server needs authentication">
    Expected before you sign in. Trigger your client's authentication step (`/mcp` in Claude Code, `codex mcp login chatbase` in Codex) and approve the consent screen.
  </Accordion>

  <Accordion title="The server does not appear after installing the plugin">
    You almost certainly have the same URL configured manually already. Clients de-duplicate by URL and show only one entry. Remove the manual entry and reconnect.
  </Accordion>

  <Accordion title="A tool the assistant needs is missing">
    The approval was narrower than the task requires. Ask the assistant to call `chatbase_whoami` to see the permissions in use, then revoke the app under **Connected apps** and reconnect, approving the permissions it needs.

    If a permission is missing from the consent screen entirely, your own role does not include it. An administrator has to grant it to you first.
  </Accordion>

  <Accordion title="A source is not live yet">
    Sources train as soon as they are written, but the work runs in the background. A new source reports `untrained` until it is live, then `trained`, or `failed` if it did not land. An edited one reports `updated` while it re-trains. Ask the assistant to re-read the source rather than assuming the write finished the job.
  </Accordion>

  <Accordion title="Responses do not stream">
    Streaming is not available over MCP. `chatbase_chat` always returns the complete response in one message.
  </Accordion>
</AccordionGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.