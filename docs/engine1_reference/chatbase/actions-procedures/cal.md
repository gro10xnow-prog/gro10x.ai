> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Cal.com

> Let customers check your availability and book meetings on your Cal.com calendar without leaving the chat

## Overview

The Cal.com action lets your AI agent read live availability from one of your Cal.com events and book meetings during the conversation. The AI agent shows the open slots, the customer picks one, and the booking lands on your Cal.com calendar.

<Card title="Best for:" icon="calendar-check">
  Booking demos, consultations, and support calls without sending the customer off to a separate scheduling page.
</Card>

**Common Use Cases:**

* "I'd like to book a call"
* "What times are you free this week?"
* "Can I schedule a demo for Thursday?"

<Info>
  **No integration required.** Cal.com works from your event URL alone, so you don't need to connect anything under **Integrations**. If you use [Calendly](/docs/user-guides/chatbot/actions/calendly) instead, that one does require an integration.
</Info>

## How to create the action

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, then select **Calcom Get Slots**.
  </Step>

  <Step title="Configure General Settings">
    **Action Name:** Give the action a descriptive name. The AI agent uses this name to help decide when the action applies, so make it specific.

    **When to use:** Describe when the action should be triggered and the kind of customer queries that should trigger it. See [Examples](#examples) below.

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.
  </Step>

  <Step title="Add your Cal.com Event URL">
    Enter your event URL in the **Cal.com Event URL** field. This tells the action which event to make bookings into.

    <Frame>
      <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-46.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=9de305d3ae8a35b51e08f69990aa72d2" alt="The Cal.com Event URL field in the action configuration" width="2930" height="1846" data-path="user-guides/chatbot/images/actions/actions-46.png" />
    </Frame>
  </Step>

  <Step title="Choose Channels">
    This action is compatible with the **Chat bubble**, **Help page**, and **Center Stage** channels only. Every other channel is incompatible and can't be selected. Toggle it on or off for each configured channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Ensure the action is toggled to **Enabled**, then test it.
  </Step>
</Steps>

## Settings

**Time format:** You can display Cal.com meeting times in a **12-hour format (AM/PM)** instead of the default 24-hour format.

<Check>
  Test the action by asking your AI agent to book an appointment, and confirm the booking appears on your Cal.com calendar.
</Check>

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-47.gif?s=a20f577135e6ec0f83396f0deab9de9d" alt="The AI agent showing Cal.com slots and booking a meeting in chat" width="800" height="504" data-path="user-guides/chatbot/images/actions/actions-47.gif" />
</Frame>

## Examples

Use these as starting points for the **When to use** field:

```text theme={null}
Call this action when the user mentions that he/she wants to book an appointment.
```

```text theme={null}
Check if the user booked an appointment or not from the tool result.
```

## Best Practices

<CardGroup cols={2}>
  <Card title="Clear Action Triggers" icon="bullseye">
    Write a specific **When to use** description so the AI agent knows exactly which requests should open the booking flow. Include example phrases customers actually type.
  </Card>

  <Card title="Use a Descriptive Name" icon="tag">
    The action name helps the AI agent understand what the action does. Name it for the meeting type, such as `Book_Demo` or `Book_Support_Call`.
  </Card>

  <Card title="Confirm the Outcome" icon="circle-check">
    Instruct the AI agent to check the tool result and tell the customer whether the booking went through, rather than assuming it did.
  </Card>

  <Card title="Test Thoroughly" icon="flask">
    Test the action with several phrasings before going live, and verify each booking lands on the right Cal.com event.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.