> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Freshchat Live Chat

> Hand over from your AI agent to live chat with a human agent in Freshchat

## Overview

The **Freshchat live chat** action hands a conversation over from your AI agent to a human agent in Freshchat. The customer keeps chatting in the same window, and your team replies from Freshchat in real time.

<Card title="Best for:" icon="headset">
  Urgent or sensitive issues that need a person right away, such as billing disputes, account problems, or frustrated customers.
</Card>

<Info>
  **Prerequisite:** Before using this action, [connect Freshchat](/docs/user-guides/integrations/freshchat) under **Integrations**.
</Info>

## How to create the action

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the action">
    Click **Create action**, then select **Freshchat live chat**. It's listed under the **Live chat** type.
  </Step>

  <Step title="Configure general settings">
    **Action name:** A unique, descriptive name for the action.

    **When to use:** Instructions for when the AI agent should hand the conversation over. For example: "Use when the customer asks to speak to a human, or when you can't resolve a billing or account issue."

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.
  </Step>

  <Step title="Choose channels">
    Use **Channels** to control where the action is available, then click **Save**. Freshchat live chat works on **Chat bubble**, **Help page**, and **Center Stage** only. Any other channel is incompatible and can't be selected. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for details.
  </Step>

  <Step title="Enable and test">
    Make sure the action is toggled to **Enabled**. Then ask your AI agent to speak to a human, and confirm the conversation reaches a live agent in Freshchat.
  </Step>
</Steps>

## Next steps

<CardGroup cols={2}>
  <Card title="Freshchat integration" icon="plug" href="/docs/user-guides/integrations/freshchat">
    Connect or manage your Freshchat account.
  </Card>

  <Card title="Escalations" icon="users" href="/docs/user-guides/chatbot/actions/escalate-to-human">
    Open a ticket instead when the issue doesn't need a live agent.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.