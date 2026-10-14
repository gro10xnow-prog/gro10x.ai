> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI WhatsApp

> List approved WhatsApp templates and send template messages to phone numbers from the terminal.

Use WhatsApp commands to list approved templates and send outbound template messages. For REST details, see [WhatsApp](/docs/api-v2/whatsapp). Authenticate first — see [CLI Auth](/docs/cli/auth). Most commands require an agent ID (`-a agt_123`) or a [default agent](/docs/cli/config).

Connect a WhatsApp number to your AI agent before using these commands — see [WhatsApp integration](/docs/user-guides/integrations/whatsapp) and [WhatsApp templates](/docs/user-guides/integrations/whatsapp-templates) in the user guide.

## List templates

List every approved template across the AI agent's connected WhatsApp Business Accounts:

```bash theme={null}
chatbase whatsapp templates -a agt_123
```

Output includes template names, languages, variable placeholders grouped by component, and the connected numbers you can send from. A template can only be sent from a number on its own Business Account — match the template's WABA to a sender before sending.

Fetch raw JSON for scripting:

```bash theme={null}
chatbase whatsapp templates -a agt_123 --json
```

## Send a template

Send a template with no variables:

```bash theme={null}
chatbase whatsapp send-template order_update --to 14155552671 -a agt_123
```

The recipient number uses international format (digits with country code, no `+` required). When the AI agent has exactly one connected number, `--from` is optional.

## Send with variables

Pass template variable values as JSON grouped by component:

```bash theme={null}
chatbase whatsapp send-template order_update --to 14155552671 --language en_US --variables '{"body":{"1":"Jane"}}' -a agt_123
```

Use `--language` when the template name has multiple approved language variants. Header and body placeholders are numbered independently — supply every key the template listing reported. See [Template variables](/docs/api-v2/whatsapp#template-variables) for format rules.

Send from a specific connected number when the AI agent has more than one:

```bash theme={null}
chatbase whatsapp send-template order_update --to 14155552671 --from 14155552671 -a agt_123
```

A `201` means WhatsApp accepted the message. Delivery to the recipient is not guaranteed — see [Delivery and conversations](/docs/api-v2/whatsapp#delivery-and-conversations).

## Commands

| Command | Purpose |
| - | - |
| `chatbase whatsapp send-template` | Send an approved WhatsApp template message |
| `chatbase whatsapp templates` | List approved WhatsApp templates for an AI agent |

<Note>
  For every flag, run `chatbase whatsapp <command> --help`.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.