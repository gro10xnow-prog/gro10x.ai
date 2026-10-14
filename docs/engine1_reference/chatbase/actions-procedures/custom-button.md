> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom Button

> Send customers a clickable button that links to any page you choose, right inside the conversation

## Overview

The Custom Button action lets your AI agent send a clickable button to the customer when they ask about a specific topic. You choose the button text and the URL it opens, and the AI agent decides when the button is worth showing.

<Card title="Best for:" icon="link">
  Pointing customers to a pricing page, a booking form, a downloadable guide, or any destination that answers a question better than text does.
</Card>

**Common Use Cases:**

* "What are your pricing plans?"
* "Where can I download the app?"
* "How do I contact sales?"

## How to create the action

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.

    <Frame>
      <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-7.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=489fa0822ca69163d6b9cea2287a83a6" alt="The Actions page in the Chatbase dashboard" width="896" height="538" data-path="user-guides/chatbot/images/actions/actions-7.png" />
    </Frame>
  </Step>

  <Step title="Create the Action">
    Click **Create action**, scroll down, and select **Custom Button**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-7.1.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=0d26a2ff472ba1b40612ff05e7d0d8b9" alt="Selecting Custom Button from the action list" width="1724" height="380" data-path="user-guides/chatbot/images/actions/actions-7.1.png" />
    </Frame>
  </Step>

  <Step title="Configure General Settings">
    **Action Name:** A descriptive name for the action. This name is only shown in the dashboard.

    <Frame>
      <img src="https://mintcdn.com/chatbase/fuaTVXjARv0sH-Me/user-guides/chatbot/images/actions/actions-8.png?fit=max&auto=format&n=fuaTVXjARv0sH-Me&q=85&s=92ab5704ec5d070e32be0c3e8c59baf1" alt="The Action Name field for the Custom Button action" width="1634" height="1532" data-path="user-guides/chatbot/images/actions/actions-8.png" />
    </Frame>

    **When to use:** A detailed description explaining when the AI agent should send the button. Include examples of the customer queries it should answer.

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.

    <Frame>
      <img src="https://mintcdn.com/chatbase/fuaTVXjARv0sH-Me/user-guides/chatbot/images/actions/actions-8.1.png?fit=max&auto=format&n=fuaTVXjARv0sH-Me&q=85&s=004df74f0b01070efbf6bce25e9f63d6" alt="The When to use field for the Custom Button action" width="1634" height="1532" data-path="user-guides/chatbot/images/actions/actions-8.1.png" />
    </Frame>
  </Step>

  <Step title="Configure the button">
    **Button text:** The text shown on the button the customer sees.

    <Frame>
      <img src="https://mintcdn.com/chatbase/fuaTVXjARv0sH-Me/user-guides/chatbot/images/actions/actions-9.png?fit=max&auto=format&n=fuaTVXjARv0sH-Me&q=85&s=0e114d1870fb1d5d3d6672e9aed185bc" alt="The Button text field" width="1634" height="1532" data-path="user-guides/chatbot/images/actions/actions-9.png" />
    </Frame>

    **URL:** The destination the button opens.

    <Frame>
      <img src="https://mintcdn.com/chatbase/fuaTVXjARv0sH-Me/user-guides/chatbot/images/actions/actions-9.2.png?fit=max&auto=format&n=fuaTVXjARv0sH-Me&q=85&s=9c9be8d5602c3bcf050aac37f189867e" alt="The URL field for the Custom Button action" width="1634" height="1532" data-path="user-guides/chatbot/images/actions/actions-9.2.png" />
    </Frame>
  </Step>

  <Step title="Choose Channels">
    This action is compatible with the **Chat bubble**, **Help page**, and **Center Stage** channels only. Every other channel is incompatible and can't be selected. Toggle it on or off for each configured channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Click **Save**, then enable the action from the toggle in the top-right corner of the page.
  </Step>
</Steps>

<Check>
  Test the action in the Playground before enabling it, to confirm the AI agent sends the button with the right URL when your instructions are met.
</Check>

## Examples

A **When to use** description that tells the AI agent both what to say and when to attach the button:

```text theme={null}
Provide the user a button when they ask about the pricing plans, the difference
between any of Chatbase plans or the features available in each one. For example,
when the user asks about the number of AI agents in the standard plan, you should
let him know that the plan offers 5 AI agents and provide the button of the
pricing page.
```

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-12.gif?s=8ed9cb55d268221d24a39be0d18813ce" alt="The AI agent sending a custom button in chat" width="455" height="566" data-path="user-guides/chatbot/images/actions/actions-12.gif" />
</Frame>

## Best Practices

<CardGroup cols={2}>
  <Card title="One Button, One Destination" icon="link">
    Each action carries a single URL. If you need to link to several pages, create a separate Custom Button action for each.
  </Card>

  <Card title="Answer First, Then Link" icon="comment">
    Tell the AI agent to answer the question in text and attach the button as a next step, so the customer isn't sent away for information the AI agent already has.
  </Card>

  <Card title="Keep Button Text Short" icon="text-width">
    Use a few words that name the destination, such as **See pricing** or **Book a demo**.
  </Card>

  <Card title="Test Before Enabling" icon="flask">
    Try the action in the Playground and confirm the button appears for the queries you expect, and not for the ones you don't.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.