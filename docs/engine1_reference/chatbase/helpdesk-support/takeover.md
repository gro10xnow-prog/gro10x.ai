> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Takeover

> Take over AI conversations and escalate them to help desk tickets for human support.

## Introduction

Takeover lets a support associate step into an ongoing AI conversation and convert it into a help desk ticket. Once taken over, the AI stops responding and the support associate handles the rest of the conversation directly. This is useful when a customer's issue is too complex for the AI, requires a personal touch, or needs escalation.

Takeover is available on the Chat bubble, Email, WhatsApp, Messenger, and Instagram channels.

## How It Works

When a support associate takes over a conversation, the system:

1. Stops the AI from responding to the customer
2. Generates an AI-powered summary of the conversation
3. Creates a help desk ticket linked to the conversation
4. Assigns the ticket to the support associate who initiated the takeover

## Taking Over a Conversation

<Steps>
  <Step title="Open the conversation">
    Open the **Conversations** tab in the help desk sidebar and select an ongoing conversation.
  </Step>

  <Step title="Click Takeover">
    Click the **Takeover** button in the conversation header. The button is only available for conversations that are currently ongoing.

    <Frame>
      <img src="https://mintcdn.com/chatbase/IdwsKzBZnpFWWv1e/user-guides/images/help-desk/take-over/take-over-button.png?fit=max&auto=format&n=IdwsKzBZnpFWWv1e&q=85&s=d24f449c26b31235023de4ef6230a44c" alt="Takeover button in the conversation header" width="2938" height="1592" data-path="user-guides/images/help-desk/take-over/take-over-button.png" />
    </Frame>
  </Step>

  <Step title="View the ticket">
    After takeover, the newly created help desk ticket opens in a new browser tab. The ticket includes:

    * An AI-generated subject line and summary based on the conversation
    * Customer details (name, email, or other identifiers)

    <Frame>
      <img src="https://mintcdn.com/chatbase/IdwsKzBZnpFWWv1e/user-guides/images/help-desk/take-over/taken-over-conversation.png?fit=max&auto=format&n=IdwsKzBZnpFWWv1e&q=85&s=de37a58b981455733ca55f6d77edc3f4" alt="Helpdesk ticket created from a taken-over conversation" width="2936" height="1592" data-path="user-guides/images/help-desk/take-over/taken-over-conversation.png" />
    </Frame>
  </Step>
</Steps>

## Conversation States

Every conversation has an activity state that determines whether takeover is available:

<AccordionGroup>
  <Accordion title="Ongoing">
    The conversation is active and the AI is responding. Takeover **is available**.
  </Accordion>

  <Accordion title="Taken Over">
    A support associate has already taken over the conversation. The **Takeover** button is replaced with a **View Ticket** button that links to the associated help desk ticket.
  </Accordion>

  <Accordion title="Ended">
    The conversation has ended. Takeover **is not available**.
  </Accordion>
</AccordionGroup>

## AI-Generated Summary

When a conversation is taken over, the system uses AI to generate a summary so the support associate can quickly understand the context without reading the entire conversation. The summary includes:

* A **subject line** for the ticket
* A **brief summary** of the customer's issue

The summary is generated in the same language the customer used in the conversation.

## What the Customer Sees

On chat channels (such as the widget), the customer receives real-time feedback when a takeover happens:

1. The AI stops responding immediately
2. A loading spinner appears with the message **"Waiting for support agent to join"**
3. Once the support associate sends their first message, the spinner disappears and the conversation continues as a live chat

<Frame>
  <img src="https://mintcdn.com/chatbase/IdwsKzBZnpFWWv1e/user-guides/images/help-desk/take-over/waiting-support-agent.png?fit=max&auto=format&n=IdwsKzBZnpFWWv1e&q=85&s=bf62c4f07fd7e7c57e5cc89d02ce6b5d" alt="Waiting for support agent to join spinner shown to the customer" width="2938" height="1594" data-path="user-guides/images/help-desk/take-over/waiting-support-agent.png" />
</Frame>

<Info>
  The waiting message is automatically displayed in the customer's language. See [Localization](/docs/user-guides/chatbot/channels#localization) for more details.
</Info>

## Handing the Conversation Back to the AI

To let the AI reply again, close the ticket. Moving the ticket to a closed or cancelled status ends the takeover, and the AI picks up the next customer message.

<Steps>
  <Step title="Open the ticket">
    Open the taken-over ticket from the help desk.
  </Step>

  <Step title="Change the status">
    Click **Update status** in the ticket header and pick a closed or cancelled status, such as **Closed** or **Cancelled**.
  </Step>
</Steps>

You can also close several tickets at once from the inbox. Select them and use **Status** in the bulk action bar.

<Note>
  If the conversation has another ticket that is still open, closing one ticket does not hand it back. The AI resumes only when the last open ticket on the conversation is closed or cancelled.
</Note>

## Multiple Takeovers

A single conversation can go through multiple takeover and AI resume cycles. Each time, the conversation is clearly divided into sections so both the support associate and the customer can follow the flow:

* A **"Live chat"** separator marks where a support associate took over
* An **"AI Resumed"** separator marks where the AI took the conversation back

For example, a conversation might flow like this:

1. Customer chats with the AI
2. Support associate takes over → **Live chat** separator appears
3. Support associate resolves part of the issue and closes the ticket → **AI Resumed** separator appears
4. Customer continues chatting with the AI
5. A new issue arises and another support associate takes over → another **Live chat** separator appears

Each cycle creates a new ticket, and the conversation timeline preserves the full history across all transitions.

<Frame>
  <img src="https://mintcdn.com/chatbase/IdwsKzBZnpFWWv1e/user-guides/images/help-desk/take-over/multiple-takeovers.png?fit=max&auto=format&n=IdwsKzBZnpFWWv1e&q=85&s=4733a22eab0d87d4ab9f93c9c7c93fdf" alt="Conversation timeline showing Live chat and AI Resumed separators across multiple takeover cycles" width="1626" height="1596" data-path="user-guides/images/help-desk/take-over/multiple-takeovers.png" />
</Frame>

## Concurrency

Only one support associate can take over a conversation. If two support associates click **Takeover** at the same time, the first one to complete the action wins and gets the ticket. The second support associate sees a generic error message. They can refresh the conversation to see that it has already been taken over and use the **View Ticket** button to open it.

<Tip>
  **Best practices:**

  * Review the conversation history before taking over so you have full context.
  * After taking over, set the ticket status to **On You** and begin responding to the customer promptly.
  * Use internal **Notes** to document any steps you've taken so other support associates can pick up if needed.
</Tip>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.