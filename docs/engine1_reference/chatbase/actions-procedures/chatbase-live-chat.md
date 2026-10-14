> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Chatbase Live Chat

> Hand a conversation from your AI agent to a human agent in the Chatbase Helpdesk, in real time

## Overview

The Chatbase Live Chat action lets your AI agent hand a conversation over to a human support agent through the Chatbase Helpdesk. When triggered, the conversation is routed straight to your Helpdesk inbox so your team can continue helping the customer in real time.

<Card title="Best for:" icon="headset">
  Sensitive, urgent, or account-specific issues where the customer needs a person now, rather than a ticket and a follow-up later.
</Card>

**Common Use Cases:**

* "I want to speak to someone right now"
* "This is urgent"
* "The AI isn't helping me"

<Info>
  **Prerequisite:** The Chatbase Helpdesk must be enabled. Click **Helpdesk inbox** in the sidebar and enable it from there. See the [Helpdesk overview](/docs/user-guides/chatbot/help-desk/help-desk-overview) for how conversations are handled once they arrive.
</Info>

<Note>
  Live chat routes the conversation to an available human in real time. If you'd rather open a ticket for asynchronous follow-up (in Chatbase Helpdesk or a third-party platform), use [Escalations](/docs/user-guides/chatbot/actions/escalate-to-human) instead.
</Note>

## How it works

### End-user experience

When the AI agent determines that a customer wants to speak with a human, the conversation is handed over to a live support agent. The customer sees a confirmation message in the chat bubble telling them an agent will join shortly.

During this state:

* The AI agent stops handling the conversation
* The chat is marked as a live chat request
* The customer stays connected in the widget while waiting for an agent to respond

<Frame>
  <img src="https://mintcdn.com/chatbase/_IymDiKC0ShvvrQq/user-guides/chatbot/images/actions/actions-48.png?fit=max&auto=format&n=_IymDiKC0ShvvrQq&q=85&s=eb2e5a5dd87251b2b564376ba5baeb48" alt="The confirmation message a customer sees after being handed to live chat" style={{ width: "300px", height: "auto" }} width="740" height="1412" data-path="user-guides/chatbot/images/actions/actions-48.png" />
</Frame>

### Support agents' experience

Support agents are notified immediately when a conversation is escalated to live chat. Inside their inbox, the conversation is clearly labeled as a **Live chat** session so agents can prioritize and respond accordingly.

<Frame>
  <img src="https://mintcdn.com/chatbase/_IymDiKC0ShvvrQq/user-guides/chatbot/images/actions/actions-49.png?fit=max&auto=format&n=_IymDiKC0ShvvrQq&q=85&s=82191dc4e25775140adbd5e5e5a83bda" alt="A live chat session labeled in the Chatbase Helpdesk inbox" width="1490" height="264" data-path="user-guides/chatbot/images/actions/actions-49.png" />
</Frame>

Agents can then:

* Reply directly to the customer in real time
* Add internal notes
* Continue the conversation from the existing thread
* Take over seamlessly from the AI agent

<Check>
  Test the action by asking your AI agent to speak to a human, and confirm the conversation appears in your Helpdesk inbox labeled as a live chat.
</Check>

## Channels

The Chatbase live chat action is compatible with the **Chat bubble**, **Help page**, **Center Stage**, **Email**, **Instagram**, **Messenger**, and **WhatsApp** channels. Every other channel is incompatible and can't be selected. Use **Channels** in the action's configuration to enable or disable it per channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.

## Best Practices

<CardGroup cols={2}>
  <Card title="Staff It Before You Enable It" icon="users">
    Only enable live chat if you have support agents available to respond. An unstaffed live chat is worse than a ticket.
  </Card>

  <Card title="Keep Triggers Strict" icon="bullseye">
    Write tight **When to use** instructions so the AI agent doesn't escalate conversations it could have resolved.
  </Card>

  <Card title="Let the AI Try First" icon="robot">
    Handle common questions with the AI agent and reserve live chat for what it can't resolve.
  </Card>

  <Card title="Reserve It for Urgency" icon="clock">
    Use live chat for sensitive, urgent, or account-specific issues, and [Escalations](/docs/user-guides/chatbot/actions/escalate-to-human) for everything that can wait.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.