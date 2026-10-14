> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Collect Data

> Have your AI agent gather any custom fields you define from the customer, conversationally, mid-chat

## Overview

The Collect Data action lets your AI agent gather any custom information you define from the customer, conversationally, mid-chat. There's no form: the AI agent asks for the missing fields naturally in the conversation and saves the submission once it has everything required.

<Card title="Best for:" icon="clipboard-list">
  Collecting structured details (a shipping address, feedback, an application) without interrupting the conversation with a form.
</Card>

**Common Use Cases:**

* Collecting a shipping address before arranging a delivery
* Gathering feedback details after a support interaction
* Capturing the specifics of a request your team will act on later

<Tip>
  You can create more than one Collect Data action on the same AI agent, each with its own name, fields, and destinations. For example, one action to collect a shipping address and a separate one to collect feedback details.
</Tip>

## How to create the action

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, then select **Collect Data**.
  </Step>

  <Step title="Configure General Settings">
    **Action Name:** A descriptive name for this action. It doubles as the identifier for this action's webhook events, so it must be unique across your AI agent's actions.

    **When to use:** Explain when the AI agent should collect this data from the customer. Include a description of what information is collected and its purpose, and add example queries that should trigger this action.

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.
  </Step>

  <Step title="Define your fields">
    In the **Fields** section, list the data the AI agent should collect. See [Fields](#fields) below.
  </Step>

  <Step title="Set your destinations">
    In **Destinations**, choose where collected data should be sent. See [Destinations](#destinations) below. This step is optional.
  </Step>

  <Step title="Choose Channels">
    This action is compatible with every channel. Toggle it on or off for each configured channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Preview your settings in the AI agent on the Action page, then click **Save and enable**.
  </Step>
</Steps>

## Fields

In the **Fields** section, list the data the AI agent should collect from the customer during the conversation. Each field has a name, a type (text, number, email, date, or boolean), a description that tells the AI agent what to ask for, and a **Required** checkbox. You can add up to 20 fields.

The AI agent asks for all required fields before saving the submission; optional fields are saved when the customer provides them but never block the save. The AI agent never invents values: it only saves what the customer has explicitly provided. Each time the AI agent completes a collection it's saved as its own submission, so if the action runs more than once in a conversation you get one submission per run.

Collected data appears under **Activity > Collected data**, where each field gets its own column. Fields are also included in CSV and PDF exports and in the [`{action name}_collect_data.submit` webhook](/docs/developer-guides/webhooks).

## Destinations

Use **Destinations** to specify where collected data should be sent. You can skip this step if you don't want to send collected data anywhere external.

### Webhooks

Add one or more webhook endpoints to receive each submission as a `POST` request.

<Steps>
  <Step title="Expand Destinations">
    Open the **Destinations** section of the action.
  </Step>

  <Step title="Enter the endpoint URL">
    Add the URL that should receive the submission.
  </Step>

  <Step title="Create the webhook">
    Click **Create webhook**, then save your changes.
  </Step>
</Steps>

### Email notifications

Enable **Email notification** to receive an email every time data is collected through this action. You can add one or more email addresses, and each successful submission triggers an email containing the collected data.

<Note>
  Email notifications are not available for HIPAA accounts. On HIPAA accounts, collected field values are also redacted before they're stored.
</Note>

<Check>
  Test the action by having a conversation that should trigger it, and confirm the submission appears under **Activity > Collected data** with every field populated.
</Check>

## Channels

The Collect Data action is compatible with every channel. Use **Channels** in the action's configuration to enable or disable it per channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.

## Limitations

* **Up to 20 fields per action.** If you need more, split the collection across separate Collect Data actions.
* **Email notifications are unavailable on HIPAA accounts,** where field values are also redacted before storage.

## Best Practices

<CardGroup cols={2}>
  <Card title="Write Clear Field Descriptions" icon="pen-line">
    The description tells the AI agent what to ask for. A vague description produces a vague question and a wrong answer.
  </Card>

  <Card title="Require Only What You Need" icon="asterisk">
    Every required field is another thing the customer must supply before the submission saves. Mark the rest optional.
  </Card>

  <Card title="Use Natural Language" icon="comment">
    Keep **When to use** instructions short and simple, start with action verbs, and say what you want the AI agent to do rather than what to avoid.
  </Card>

  <Card title="Split by Purpose" icon="layer-group">
    Create a separate action per kind of data you collect, so each has its own fields, destinations, and webhook identity.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.