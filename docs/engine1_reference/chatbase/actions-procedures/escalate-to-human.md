> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Escalations

> Let your AI agent hand a conversation to a human by creating a ticket in Chatbase Helpdesk or your connected helpdesk platform

## Overview

The **Escalations** action lets your AI agent hand a conversation to a human. When triggered, it creates a ticket in the helpdesk platform you choose, including the customer's details and the conversation so your team can pick up where the AI agent left off.

<Card title="Best for:" icon="ticket">
  Issues the AI agent can't resolve and that don't need an answer this second: anything your team can work as a ticket and follow up on.
</Card>

**Common Use Cases:**

* "I want to speak to a human"
* "Connect me to support"
* "This didn't solve my issue"
* "I need help with my billing"

<Frame>
  <img src="https://mintcdn.com/chatbase/wVAg3bVLww8ng0oL/images/image-1.png?fit=max&auto=format&n=wVAg3bVLww8ng0oL&q=85&s=5cc7ebcf008c7b877ca9ca9e86dae143" alt="The Escalations action in the Chatbase dashboard" width="2426" height="1370" data-path="images/image-1.png" />
</Frame>

<Note>
  Escalations open a ticket for asynchronous follow-up. If you'd rather route the customer to a human in real time, use [Chatbase live chat](/docs/user-guides/chatbot/actions/chatbase-live-chat) instead.
</Note>

## Before you start

The action can only create tickets in a platform you have already set up. Only connected platforms appear in the **Ticket Platform** dropdown when you create the action.

* To use **Chatbase Helpdesk**, click **Helpdesk inbox** in the sidebar and enable it from there.
* To use a third-party platform, go to **Integrations** in the sidebar and connect it.

Supported platforms:

* [Chatbase Helpdesk](/docs/user-guides/chatbot/help-desk/help-desk-overview)
* [Zendesk](/docs/user-guides/integrations/zendesk)
* [Salesforce](/docs/user-guides/integrations/salesforce)
* [Intercom](/docs/user-guides/integrations/intercom)
* [Zoho Desk](/docs/user-guides/integrations/zohodesk)
* [Freshdesk](/docs/user-guides/integrations/freshdesk)
* [HubSpot](/docs/user-guides/integrations/hubspot)
* [Help Scout](/docs/user-guides/integrations/helpscout)
* [Gorgias](/docs/user-guides/integrations/gorgias)
* [Odoo](/docs/user-guides/integrations/odoo)

## How to create the action

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, then select **Create ticket** under **Escalations**.
  </Step>

  <Step title="Configure General Settings">
    **Action name:** A descriptive name that helps the AI agent understand when to trigger the action, such as `create_ticket`, `create_ticket_refunds`, or `create_ticket_whatsapp`.

    **Ticket Platform:** The platform where tickets are created. The options in the next section depend on this choice.

    **When to use:** Explain clearly when the AI agent should create a ticket. The field comes prefilled with a default you can edit, and **Reset** restores it:

    ```text theme={null}
    Create a ticket when:
    1. The user explicitly asks to submit a complaint or requests support from a human.
    2. The user asks a question you don't know the answer to, but confirm before creating the ticket.
    ```

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.
  </Step>

  <Step title="Configure details collection">
    This section changes based on the ticket platform you picked. See [Details collection by platform](#details-collection-by-platform) below.
  </Step>

  <Step title="Add Tags">
    With **Chatbase** as the ticket platform, the **Tags** section lets the AI agent tag each ticket it creates. See [Tags](#tags) below, or click **Skip** to leave it empty.
  </Step>

  <Step title="Choose Channels">
    This action is compatible with every channel except **Slack** and **Zendesk Messaging**. Toggle it on or off for each configured channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Click **Save & enable** to make the action available to your AI agent, then test it.
  </Step>
</Steps>

## Details collection by platform

### Chatbase Helpdesk

When the ticket platform is **Chatbase**, you choose how the AI agent collects the customer's details before opening the ticket.

**How should details be collected?** This setting applies to the chat bubble and Help page. Other channels, such as WhatsApp and Instagram, always collect details conversationally.

| Option | What it does |
| - | - |
| **Collect from a form** | The visitor fills out the fields in a widget inside the chat. |
| **Collect conversationally** | The AI agent asks for the details naturally in the conversation. |

**Collect additional details:** The fields collected before the ticket is created, in either mode. **Subject** and **Description** are built in and always collected. In the chat bubble and on the help page the visitor's email is collected too, and a verified address is used without asking. Click **Add field** to add a [custom field](/docs/user-guides/chatbot/help-desk/custom-fields), such as a date, a dropdown, a number, or an image. Each field has a type and an optional collection instruction that tells the AI agent how to ask for it. Use the pencil icon to edit a field or the **X** to remove it from this action.

A required field must be filled before the ticket is created, in either mode. Turn off **Required** to let the ticket go through without it.

With **Collect from a form**, the form opens with the subject and description the AI agent drafted, and with any of your fields the visitor already answered in the conversation. Photos are always uploaded in the form. A boolean field is a yes or no choice and a dropdown lists its options. A ticket carries at most 5 files across image fields and attachments.

<Frame>
  <img src="https://mintcdn.com/chatbase/-5d5IJKB-5pzd0FH/images/escalations-chatbase-helpdesk-details.png?fit=max&auto=format&n=-5d5IJKB-5pzd0FH&q=85&s=ef5172e8ba277c4dc5a41ed57ac14cf2" alt="Chatbase Helpdesk details collection" width="1444" height="1478" data-path="images/escalations-chatbase-helpdesk-details.png" />
</Frame>

<Tip>
  Fields are shared across your helpdesk. Click **Manage fields** to open [Custom fields](/docs/user-guides/chatbot/help-desk/custom-fields), where you can create and edit them for every action.
</Tip>

#### Tags

The **Tags** section lets the AI agent label each ticket it creates with tags from your [tag list](/docs/user-guides/chatbot/help-desk/tags). It sits between **Details collection** and **Channels**.

Click **Add tag** and pick a tag. Then describe when it applies in the **When should the AI use this tag?** box, for example `The customer reports a damaged or missing item`. Every tag needs a description, up to 200 characters.

The AI agent weighs each description on its own and adds every tag that fits, so a ticket can get several tags or none. Tags are added as the ticket is created, before any [triggers](/docs/user-guides/chatbot/help-desk/triggers) run, so a trigger that checks for a tag already sees them.

If the tag you need doesn't exist yet, type its name and click **Create "name"**. Typing the exact name of an archived tag offers **Restore "name"** instead. Both need permission to manage tags. Without it, ask an admin to add the tag in **Settings → Helpdesk → Tags**.

Changes to the tag list carry over to the action:

* **Renaming a tag** updates the action too. You don't need to edit it.
* **Archiving a tag** stops the AI agent from applying it. The tag stays on the action with an **archived** badge until you restore it or remove it from the action.

If your AI agent has no tags yet, the section shows **This chatbot has no tags yet.** Click **Manage tags** to create some.

### Zendesk

When the ticket platform is **Zendesk**, you control what goes on the ticket.

**Brand:** The Zendesk brand the ticket will be created under. Select **Default** to use the brand's default value at the time the ticket is created.

**Conversation context:** What the ticket contains.

| Option | What it does |
| - | - |
| **AI summary** | A concise, AI-written summary of the conversation. |
| **Full conversation** | The literal transcript, with any files the customer sent attached to the ticket. |

**Internal note (optional):** A private note added to the ticket for your team. Use variables in double curly braces to have the AI agent fill in details from the conversation. For example:

```text theme={null}
Reason of contact: {{reason_of_contact}}
Order ID: {{order_id}}
Status: {{status}}
```

**Custom fields (optional):** Chatbase reads the custom fields defined in your Zendesk account and lists them here. Select the ones you want on the ticket, and the AI agent fills them in automatically from the conversation.

<Frame>
  <img src="https://mintcdn.com/chatbase/UdeXfRXeavGlAJA1/images/escalations-zendesk-details.png?fit=max&auto=format&n=UdeXfRXeavGlAJA1&q=85&s=3c544b58c8dbd39b340c7cd5b641bd94" alt="Zendesk details collection" width="1466" height="784" data-path="images/escalations-zendesk-details.png" />
</Frame>

### Other platforms

Salesforce, Intercom, Zoho Desk, Freshdesk, HubSpot, Help Scout, Gorgias, and Odoo have no platform-specific options. Complete the **General** and **Channels** sections and the AI agent creates the ticket with the customer's details and an AI-written summary of the conversation.

## How it works

When the action triggers, the AI agent:

1. Collects any details it still needs from the customer.
2. Creates a ticket in the selected platform.
3. Includes the customer's information and the conversation on the ticket.

Your team continues the conversation from the helpdesk platform.

<Check>
  Test the action by asking your AI agent to speak to a human, and confirm a ticket appears in your chosen platform with the details and conversation attached.
</Check>

### Email handover with Zendesk

On the Email channel with **Zendesk** as the ticket platform, the AI agent handles the email thread on its own until the customer asks to speak to a human. Creating the ticket then hands the conversation over to your team, and the AI agent stops replying to the thread until the ticket is resolved.

| Stage | Who answers the customer in the email thread |
| - | - |
| Until the customer asks to speak to a human | The AI agent |
| While the Zendesk ticket is open | Your team, replying from Zendesk |
| After the ticket is **Solved** or **Closed** | The AI agent again |

What this means in practice:

* **Your team's Zendesk replies reach the customer in the same email thread.** There is no separate thread and no ticket notification for the customer to follow.
* **Customer replies during the handover go to the Zendesk ticket**, not to the AI agent.
* **Resolving the ticket hands the thread back.** Once the ticket is **Solved** or **Closed**, the AI agent answers the customer's next email as usual.

<Note>
  This applies to the Email channel with Zendesk only. With any other ticket platform, and on any other channel, the AI agent keeps replying after it creates the ticket.
</Note>

<Info>
  Email handover is on by default for every AI agent and cannot be turned off.
</Info>

## Limitations

* **The full transcript is only available for Zendesk.** Every other platform receives an AI-written summary of the conversation.
* **The form collection mode applies to the chat bubble and Help page only.** Other channels always collect details conversationally.
* **Tags are available on Chatbase Helpdesk only.** Other ticket platforms don't show the **Tags** section.
* **An action holds up to 5 tags.** **Add tag** greys out at the limit. Remove a tag to make room for another.

## Best Practices

<CardGroup cols={2}>
  <Card title="Clear Escalation Criteria" icon="bullseye">
    Spell out when the AI agent should escalate and when it should keep trying, so customers aren't handed off prematurely or left stuck.
  </Card>

  <Card title="One Action per Context" icon="layer-group">
    Create separate actions for different contexts, such as `create_ticket_refunds` and `create_ticket_whatsapp`, when they need different rules or fields.
  </Card>

  <Card title="Collect What Your Team Needs" icon="clipboard-list">
    Add the fields your team would otherwise have to ask for, so the ticket arrives ready to work.
  </Card>

  <Card title="Require Sparingly" icon="asterisk">
    Every required field is another thing the AI agent must extract before it can open the ticket. Mark the rest optional.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.