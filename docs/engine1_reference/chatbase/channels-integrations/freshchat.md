> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Freshchat

> Connect Freshchat so your AI agent can hand live conversations over to human agents

## Overview

Freshchat is Freshworks' live chat platform. Connecting it to Chatbase lets your AI agent hand a conversation over to a human agent in Freshchat when the customer needs a person, so your team can pick it up in real time.

<Card title="What you can do:" icon="headset">
  Let the AI handle routine questions, and hand the customer to a live Freshchat agent when the issue needs a person.
</Card>

## Before you start

* A Chatbase account with an AI agent
* A Freshchat account with admin access

## How to connect Freshchat

<Steps>
  <Step title="Get your chat URL and API key from Freshchat">
    In Freshchat, go to **Admin > Configure > API Tokens**, then copy the **chat URL** and **API key** shown there.

    If your chat is part of Freshsales Suite, go to **Settings > Admin Settings > Website Tracking and APIs > API Settings** instead.
  </Step>

  <Step title="Connect Freshchat in Chatbase">
    1. Navigate to your Chatbase [dashboard](https://www.chatbase.co/dashboard/).
    2. Click the AI agent you want to enable live chat for.
    3. Navigate to **Integrations**.
    4. On the **Freshchat** card, click **Connect**.
    5. Enter your **Chat URL**, for example `https://yourcompany.freshchat.com`, and your **API Key**.
    6. Click **Submit**.

    Once connected, the card shows **Connected**.
  </Step>

  <Step title="Create the Freshchat live chat action">
    Navigate to **Build > Actions**, click **Create action**, then select **Freshchat live chat**. See [Freshchat live chat](/docs/user-guides/chatbot/actions/freshchat-live-chat) for how to configure it.
  </Step>
</Steps>

<Check>
  Test the integration by asking your AI agent to speak to a human, and confirm the conversation reaches a live agent in Freshchat.
</Check>

## Limitations

* **The live chat action runs on three channels only:** **Chat bubble**, **Help page**, and **Center Stage**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.

## Next steps

<CardGroup cols={2}>
  <Card title="Freshchat live chat" icon="headset" href="/docs/user-guides/chatbot/actions/freshchat-live-chat">
    Configure when your AI agent hands customers over to Freshchat.
  </Card>

  <Card title="Escalations action" icon="users" href="/docs/user-guides/chatbot/actions/escalate-to-human">
    Prefer an asynchronous handoff? Open a ticket instead of routing the customer to a live agent.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.