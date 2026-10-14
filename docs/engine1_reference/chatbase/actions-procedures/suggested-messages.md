> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Suggested Messages

> Display clickable reply suggestions to help customers navigate conversations more efficiently

## Overview

The Suggested Messages action displays clickable reply options to customers during a conversation. Suggestions can be generated automatically by AI or configured manually to guide customers toward specific actions and workflows. They reduce the effort of typing, improve engagement, and create a more structured conversational experience.

<Card title="Best for:" icon="hand-pointer">
  Guiding customers through a defined journey, offering obvious next steps, and cutting down on typing in channels where it's awkward.
</Card>

**Common Use Cases:**

* Offering the likely follow-up questions after an answer
* Presenting a short menu of paths at the start of a conversation
* Walking a customer through a guided workflow one choice at a time

<Note>
  This action changes the suggestions dynamically as the conversation develops. For fixed wordings that do not change, use the **Suggested messages** control under **Playground → Display → Content**. See [Chat bubble display settings](/docs/user-guides/chatbot/channels#chat-bubble-display).
</Note>

## How to create the action

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, then select **Suggested Messages**.
  </Step>

  <Step title="Configure General Settings">
    **Action Name:** A descriptive name for the action. It's used internally to identify the action and is not visible to customers.

    **When to use:** Define when the action should be triggered and what type of suggestions should be shown. These instructions help the AI agent determine when the action should appear, what suggestions should be displayed, and how they should relate to the current conversation. The more specific your instructions, the more relevant the generated suggestions will be.

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.
  </Step>

  <Step title="Configure the suggestions">
    Choose how suggestions are produced and how they behave. See [Settings](#settings) below.
  </Step>

  <Step title="Choose Channels">
    This action is compatible with the **Chat bubble**, **Help page**, and **Center Stage** channels only. Every other channel is incompatible and can't be selected. Toggle it on or off for each configured channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Ensure the action is toggled to **Enabled**, then test it.
  </Step>
</Steps>

## Settings

**Auto generate suggested messages:** When enabled, Chatbase generates suggestions automatically from the conversation context, the customer's latest message, and the instructions in your **When to use** field. Use this when you want suggestions to adapt to each conversation.

**Manual suggested messages:** When **Auto generate suggested messages** is disabled, you can configure up to **4 suggested messages** by hand. Each one can contain up to 40 characters, appears as a clickable option, and can be edited or removed at any time. Manual suggestions give you complete control over the options presented.

**Disable input field:** When enabled, customers cannot type a custom response while suggested messages are displayed, and must select one of the available options before continuing. Useful for guided workflows where customers should follow a predefined path.

**Generate after every message:** When enabled, Chatbase checks for suggested messages after every reply instead of letting the AI agent decide when to run the action. This is more reliable, particularly on smaller models, which are less consistent at triggering the action on their own.

<Warning>
  **Generate after every message** runs after every reply even when no suggestions fit, so each reply consumes your base model's credits. Only one action per agent can use this setting.
</Warning>

## Channels

This action currently supports:

* Chat bubble
* Help page

Disable a channel to prevent the action from appearing there.

<Check>
  Test the action by having a conversation that should produce suggestions, and confirm the right options appear and are clickable.
</Check>

## Limitations

* **Manual suggestions are capped.** You can configure at most 4, each up to 40 characters.
* **Only one action per AI agent can use Generate after every message.**
* **Not available on every channel.** Suggested messages currently work on the Chat bubble and Help page only.

## Best Practices

<CardGroup cols={2}>
  <Card title="Keep Suggestions Concise" icon="text-width">
    Use short, action-oriented messages that are easy to scan and select.
  </Card>

  <Card title="Be Specific in Your Instructions" icon="bullseye">
    Clearly describe when the action should appear and the type of suggestions that should be generated.
  </Card>

  <Card title="Use Manual Suggestions for Guided Flows" icon="route">
    Hand-written suggestions are ideal when customers should follow a specific journey or workflow.
  </Card>

  <Card title="Restrict Input Only When Necessary" icon="keyboard">
    Enable **Disable input field** only when customers genuinely must choose from the options, since it blocks them from asking anything else.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.