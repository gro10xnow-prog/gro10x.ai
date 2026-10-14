> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Gorgias

> Connect Gorgias so your AI agent can escalate a conversation by opening a ticket for your support team

## Overview

Integrating Gorgias with Chatbase lets your AI agent escalate complex customer issues to your human support team by creating a ticket directly in Gorgias. The ticket includes a clear summary of the customer's issue along with the relevant conversation context.

Your support team receives everything it needs upfront, so customers never have to repeat themselves. The AI handles routine inquiries instantly, and when escalation is needed, Gorgias becomes the system where your human agents step in.

<Card title="What you can do:" icon="ticket">
  Let the AI resolve routine questions on its own, and hand off to Gorgias the moment a case needs a person, with the full context already attached.
</Card>

## Before you start

* A Chatbase account with an AI agent
* Your Gorgias **subdomain**, **account email**, and **API key** (see [Find your Gorgias API key](#find-your-gorgias-api-key))

## How to connect Gorgias

<Steps>
  <Step title="Open your Chatbase AI agent">
    Log in to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select the AI agent you want to connect.
  </Step>

  <Step title="Connect Gorgias">
    Choose **Integrations**, then click **Connect** under Gorgias.
  </Step>

  <Step title="Enter your subdomain, email, and API key">
    To authorize the integration, you'll need your Gorgias subdomain, account email, and API key. See [Find your Gorgias API key](#find-your-gorgias-api-key) below.
  </Step>

  <Step title="Create the Escalations action">
    Configure your Escalations action to route tickets to Gorgias. Follow the [Escalations action guide](/docs/user-guides/chatbot/actions/escalate-to-human) to set it up.
  </Step>
</Steps>

### Find your Gorgias API key

1. Log in to your Gorgias account.
2. Go to **Settings → REST API**.
3. Create a new API key, or copy an existing one.
4. Paste the API key into the Chatbase integration form, along with your account email and subdomain.

<Frame>
  <img src="https://mintcdn.com/chatbase/ZbJpvvUbZdcNnBDk/user-guides/integrations/images/gorgias/gorgias.png?fit=max&auto=format&n=ZbJpvvUbZdcNnBDk&q=85&s=452de6a0b11487c04cb231a68318f18b" alt="Creating a REST API key in Gorgias settings" width="1022" height="1434" data-path="user-guides/integrations/images/gorgias/gorgias.png" />
</Frame>

<Check>
  Test the integration by asking your AI agent to speak to a human, and confirm a ticket appears in Gorgias with the conversation summary attached.
</Check>

## Next steps

<Card icon="users" href="/docs/user-guides/chatbot/actions/escalate-to-human" title="Escalations action">
  Configure when your AI agent escalates, which details it collects first, and which channels it can escalate from.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.