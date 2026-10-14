> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Collect Leads

> Capture a visitor's contact details as a lead, either through a form in the chat or conversationally

## Overview

The Collect Leads action captures a visitor's contact details as a lead during the conversation. You control when the lead form appears, which details are collected, and where they're sent. The AI agent can either display a form inside the chat bubble or ask for the details naturally in conversation.

<Card title="Best for:" icon="user-plus">
  Turning an interested visitor into a contactable lead before they leave, and routing that lead straight to your CRM or inbox.
</Card>

**Common Use Cases:**

* Capturing details when a visitor asks about pricing or a demo
* Following up with someone whose question needs a human answer
* Qualifying interest with custom fields like company name or budget

## How to create the action

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, then select **Collect Leads**.
  </Step>

  <Step title="Configure General Settings">
    **When to use:** Specify when the form should show during the conversation. You can also add other instructions related to the action, such as *Show only the leads form without listing the form's fields*. Previewing the action will help you spot the edits you may want to make.

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.

    <Frame>
      <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-26.1.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=46be6315b896488cfa1f4c5a07fe1b53" alt="The When to use field for the Collect Leads action" width="1756" height="1026" data-path="user-guides/chatbot/images/actions/actions-26.1.png" />
    </Frame>
  </Step>

  <Step title="Define your fields">
    In the **Fields** section, choose how the AI agent collects details and which fields it asks for. See [Fields](#fields) below.
  </Step>

  <Step title="Set your destinations">
    In **Destinations**, choose where collected leads should be sent. See [Destinations](#destinations) below. This step is optional.
  </Step>

  <Step title="Choose Channels">
    This action is compatible with every channel. Toggle it on or off for each configured channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Preview your settings in the AI agent on the Action page, then click **Save and enable**.
  </Step>
</Steps>

## Fields

In the **Fields** section, you first choose how the AI agent collects the lead's details:

| Mode | What it does |
| - | - |
| **Form** | The AI agent displays a form inside the chat bubble. Up to three fields, no custom fields. |
| **Conversational** | The AI agent asks for the details naturally in chat, one message at a time, and saves the lead once it has everything required. Supports custom fields. |

<Note>
  Whichever mode you pick, either **E-mail** or **Phone Number** must be enabled and set as required. This guarantees every saved lead has a way to be contacted, and the action cannot be saved without it.
</Note>

### Form mode

You can enable or disable any of the three available fields in the form (**Name**, **E-mail**, and **Phone Number**) and set any or all of them as required.

<Note>
  A lead form holds a maximum of three fields, and custom fields are not available in this mode.
</Note>

### Conversational mode

In conversational mode, the AI agent gathers the lead's details in chat on every channel. The fields table has two parts:

* **Identity fields**: Name, E-mail, and Phone Number. Each can be toggled on or off and marked as required. Their types are fixed, and you can add a description to guide the AI agent on how to ask for them.
* **Custom fields**: any extra details you want collected, such as company name or budget. Each custom field has a name, a type (text, number, email, date, or boolean), a description that tells the AI agent what to ask for, and a **Required** checkbox.

The AI agent asks for all required fields before saving the lead; optional fields are saved when the customer provides them but never block the save.

<Frame>
  <img src="https://mintcdn.com/chatbase/vhz2SdUS6J9p-HAw/user-guides/chatbot/images/actions/collect-leads-conversational-fields.png?fit=max&auto=format&n=vhz2SdUS6J9p-HAw&q=85&s=9c15b530c0ba593a36ec672d5eb49e1c" alt="Conversational fields editor with identity and custom fields" width="1103" height="846" data-path="user-guides/chatbot/images/actions/collect-leads-conversational-fields.png" />
</Frame>

The AI agent never invents values: it only saves what the customer has explicitly provided, and if the customer shares more details later in the conversation, the lead is updated without losing what was already collected.

Collected leads appear under **Activity > Leads**, where each custom field gets its own column. Custom fields are also included in CSV and PDF exports and in the [`leads.submit` webhook](/docs/developer-guides/webhooks).

### Messages

**Success Message:** The message displayed once the customer submits the form.

**Dismiss Message:** The message shown once the customer dismisses the form by clicking the **X** button. This only applies to form mode, since conversational mode has no form to dismiss.

<Frame>
  <img src="https://mintcdn.com/chatbase/iF0g48v-mQXcRewd/user-guides/chatbot/images/actions/actions-29.1.png?fit=max&auto=format&n=iF0g48v-mQXcRewd&q=85&s=bfacc33b88097a27aa18d5ce27190b79" alt="The Success and Dismiss message fields" width="2520" height="1494" data-path="user-guides/chatbot/images/actions/actions-29.1.png" />
</Frame>

## Destinations

Use **Destinations** to specify where collected lead information should be sent. You can skip this step if you don't want to send leads anywhere external.

### Webhooks

Add one or more webhook endpoints to receive each collected lead as a `POST` request.

<Steps>
  <Step title="Expand Destinations">
    Open the **Destinations** section of the action.
  </Step>

  <Step title="Enter the endpoint URL">
    Add the URL that should receive the lead.
  </Step>

  <Step title="Create the webhook">
    Click **Create webhook**, then save your changes.
  </Step>
</Steps>

### Email notifications

Enable **Email notification** to receive an email every time a lead is collected through this action. You can add one or more email addresses, and each successful lead submission triggers an email containing the collected lead information.

<Note>
  This is different from the **Daily leads** email notification available under **Settings → Notifications**. Email notifications configured here are sent **immediately for each collected lead**, whereas the daily leads notification sends a summary of leads collected throughout the day.
</Note>

<Check>
  Test the action by having a conversation that should trigger it, and confirm the lead appears under **Activity > Leads** with every field populated.
</Check>

## Channels

The Collect Leads action is compatible with every channel. Use **Channels** in the action's configuration to enable or disable it per channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.

## Best Practices

<CardGroup cols={2}>
  <Card title="Pick the Right Mode" icon="toggle-on">
    Use **Form** for a quick, familiar capture in the chat bubble, and **Conversational** when you need custom fields or a less abrupt ask.
  </Card>

  <Card title="Ask at the Right Moment" icon="clock">
    Trigger the form once the visitor has shown intent, not at the start of every conversation.
  </Card>

  <Card title="Use Natural Language" icon="comment">
    Keep **When to use** instructions short and simple, include examples, start with action verbs, and say what you want the AI agent to do rather than what to avoid.
  </Card>

  <Card title="Keep Required Fields Few" icon="asterisk">
    Every required field is another reason a visitor abandons the form. Require the contact method and little else.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.