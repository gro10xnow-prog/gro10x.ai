> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Calendly

> Let customers check your availability and book meetings on your Calendly calendar without leaving the chat

## Overview

The Calendly action lets your AI agent read live availability from one of your Calendly events and book meetings during the conversation. The AI agent shows the open slots, the customer picks one, and the booking lands on your Calendly calendar.

<Card title="Best for:" icon="calendar-check">
  Booking demos, consultations, and support calls without sending the customer off to a separate scheduling page.
</Card>

**Common Use Cases:**

* "I'd like to book a call"
* "What times are you free this week?"
* "Can I schedule a demo for Thursday?"

<Info>
  **Prerequisite:** Before using the Calendly action, connect your Calendly account from the **Integrations** tab. If you'd rather not set up an integration, [Cal.com](/docs/user-guides/chatbot/actions/cal) works from an event URL alone.
</Info>

## How to create the action

<Steps>
  <Step title="Connect Calendly">
    Go to the **Integrations** tab and connect your Calendly account.
  </Step>

  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, then select **Calendly Get Slots**.
  </Step>

  <Step title="Configure General Settings">
    **Action Name:** Give the action a descriptive name. The AI agent uses this name to help decide when the action applies, so make it specific.

    **When to use:** Describe when the action should be triggered and the kind of customer queries that should trigger it. You can also add instructions the AI agent should follow once the action runs. See [Examples](#examples) below.

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.
  </Step>

  <Step title="Select your event">
    Choose the event you want the AI agent to book into from the **Event** dropdown.

    <Frame>
      <img src="https://mintcdn.com/chatbase/057npaMH_NcfL8s_/user-guides/chatbot/images/actions/actions-42.png?fit=max&auto=format&n=057npaMH_NcfL8s_&q=85&s=0f9cc352729eeb5bd71e2314c546e310" alt="Selecting a Calendly event in the action configuration" width="2346" height="1478" data-path="user-guides/chatbot/images/actions/actions-42.png" />
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

**Time format:** You can display Calendly meeting times in a **12-hour format (AM/PM)** instead of the default 24-hour format.

<Check>
  Test the action by asking your AI agent to book an appointment, and confirm the booking appears on your Calendly calendar.
</Check>

## Examples

A detailed **When to use** description that controls the search window, the wording of the reply, and how the AI agent reports the outcome:

```text theme={null}
Use when the user mentions booking an appointment for Essay Feedback.

If no date is specified, automatically set the window from today to 1 week from
today and display these dates to the user without asking for confirmation.

If a date window is specified, set the search window to that specific date window
and display it to the user.

After performing the search, respond with either "I have found available slots"
or "I have not found available slots".

Display the search window but do not provide a list of slots or links.

After using the tool, check whether the user attempted to book an appointment.
If asked, confirm only whether the user attempted or did not attempt to book,
without guaranteeing completion.
```

## Best Practices

<CardGroup cols={2}>
  <Card title="Clear Action Triggers" icon="bullseye">
    Write a specific **When to use** description so the AI agent knows exactly which requests should open the booking flow. Name the event type if you run more than one.
  </Card>

  <Card title="Set the Search Window" icon="calendar-days">
    Tell the AI agent what to do when the customer gives no date, so it doesn't ask a clarifying question it could have answered with a sensible default.
  </Card>

  <Card title="Confirm the Outcome" icon="circle-check">
    Instruct the AI agent to check the tool result and report only what it can verify, rather than guaranteeing a booking completed.
  </Card>

  <Card title="Test Thoroughly" icon="flask">
    Test the action with several phrasings before going live, and verify each booking lands on the right Calendly event.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.