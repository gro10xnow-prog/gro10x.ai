> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Freshdesk

> Connect Freshdesk so your AI agent can escalate a conversation by opening a ticket for your support team

## Overview

Integrating Freshdesk with Chatbase lets your AI agent escalate complex customer issues to your human support team by creating a ticket directly in Freshdesk. The ticket includes a clear summary of the customer's issue along with the relevant conversation context.

Your support team receives everything it needs upfront, so customers never have to repeat themselves. The AI handles routine inquiries instantly, and when escalation is needed, Freshdesk becomes the system where your human agents step in.

<Card title="What you can do:" icon="ticket">
  Let the AI resolve routine questions on its own, and hand off to Freshdesk the moment a case needs a person, with the full context already attached.
</Card>

## Before you start

* A Chatbase account with an AI agent
* Your Freshdesk **subdomain** and **API key** (see [Find your Freshdesk API key](#find-your-freshdesk-api-key))

## How to connect Freshdesk

<Steps>
  <Step title="Open your Chatbase AI agent">
    Log in to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select the AI agent you want to connect.
  </Step>

  <Step title="Connect Freshdesk">
    Choose **Integrations**, then click **Connect** under Freshdesk.
  </Step>

  <Step title="Enter your subdomain and API key">
    To authorize the integration, you'll need your Freshdesk subdomain and API key. See [Find your Freshdesk API key](#find-your-freshdesk-api-key) below.
  </Step>

  <Step title="Create the Escalations action">
    Configure your Escalations action to route tickets to Freshdesk. Follow the [Escalations action guide](/docs/user-guides/chatbot/actions/escalate-to-human) to set it up.
  </Step>
</Steps>

### Find your Freshdesk API key

1. Log in to your Freshdesk account.
2. Click your profile picture (top-right corner).
3. Select **Profile Settings**.
4. On the right-hand side, locate **Your API Key**.

<Frame>
  <img src="https://mintcdn.com/chatbase/EB093lU6eg6qI3KF/user-guides/integrations/images/freshdesk/freshdesk.png?fit=max&auto=format&n=EB093lU6eg6qI3KF&q=85&s=ca018b0c880e3f51478e7fe7a9f5e49d" alt="Locating your API key in Freshdesk profile settings" width="1038" height="1438" data-path="user-guides/integrations/images/freshdesk/freshdesk.png" />
</Frame>

<Check>
  Test the integration by asking your AI agent to speak to a human, and confirm a ticket appears in Freshdesk with the conversation summary attached.
</Check>

## Next steps

<Card icon="users" href="/docs/user-guides/chatbot/actions/escalate-to-human" title="Escalations action">
  Configure when your AI agent escalates, which details it collects first, and which channels it can escalate from.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.