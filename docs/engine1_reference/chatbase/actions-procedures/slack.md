> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Slack

> Notify a Slack channel whenever a conversation touches a topic your team needs to know about

## Overview

The Slack action lets your AI agent post a message to a Slack channel you choose whenever a customer mentions a topic you want to be notified about. The notification includes a direct link to the conversation, so your team can open it straight from Slack.

<Card title="Best for:" icon="bell">
  Alerting your team to issues worth a human's attention (late orders, churn risk, bug reports) without escalating the conversation itself.
</Card>

**Common Use Cases:**

* Flagging a complaint or a late order to the support channel
* Notifying sales when a customer asks about enterprise pricing
* Telling your team about a reported bug as soon as it comes up

<Info>
  **Prerequisite:** Before using the Slack action, [connect Slack to Chatbase](/docs/user-guides/integrations/slack).
</Info>

## How to create the action

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, select **Slack**, then click **Start customizing**.
  </Step>

  <Step title="Choose your workspace">
    Select the Slack workspace you want connected to this action.

    <Frame>
      <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-2.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=f3c0cdfc3186ecb5cc5e1bab5e4e1a27" alt="Selecting the Slack workspace for the action" width="599" height="323" data-path="user-guides/chatbot/images/actions/actions-2.png" />
    </Frame>
  </Step>

  <Step title="Configure General Settings">
    **When to use:** Provide a detailed description explaining when the AI agent should use this action, including the channel to post to and the topics that should trigger it. See [Examples](#examples) below.

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.

    <Frame>
      <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-3.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=3fd9d1001247d0de1b613023b5bc0660" alt="The When to use field for the Slack action" width="1572" height="600" data-path="user-guides/chatbot/images/actions/actions-3.png" />
    </Frame>
  </Step>

  <Step title="Choose Channels">
    This action is compatible with every channel. Toggle it on or off for each configured channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Click **Save**, then ensure the action is toggled to **Enabled** so the AI agent can post to your Slack channel.

    <Frame>
      <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-4.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=99ea878ee3197bfd683ecd99cfc7856d" alt="Enabling the Slack action" width="1600" height="300" data-path="user-guides/chatbot/images/actions/actions-4.png" />
    </Frame>
  </Step>
</Steps>

<Check>
  Test the action in the Action Preview before enabling it, to confirm the AI agent posts to your Slack channel when your instructions are met.
</Check>

## Examples

A **When to use** description that names both the channel and the trigger topics:

```text theme={null}
Call this tool to send a message in slack to the channel named: ai-actions-slack
whenever the user mentions any of the following topics: late order
```

<Frame>
  <img src="https://mintcdn.com/chatbase/fuaTVXjARv0sH-Me/user-guides/chatbot/images/actions/slack-example.gif?s=2d0b04e374ca4ebf19fd0a871961d498" alt="The AI agent triggering a Slack notification in chat" width="442" height="450" data-path="user-guides/chatbot/images/actions/slack-example.gif" />
</Frame>

Once the customer mentions an issue with a late order, a Slack notification is sent to the connected channel, with a direct link to that conversation:

<Frame>
  <img src="https://mintcdn.com/chatbase/dnbnfsfDM4KPXR1z/user-guides/chatbot/images/actions/Slack/slack-channel-notifications.png?fit=max&auto=format&n=dnbnfsfDM4KPXR1z&q=85&s=df4ee124e4cbd7672bc5e736e4ec65a6" alt="A Chatbase notification in a Slack channel, linking back to the conversation" width="345" height="76" data-path="user-guides/chatbot/images/actions/Slack/slack-channel-notifications.png" />
</Frame>

## Best Practices

<CardGroup cols={2}>
  <Card title="Name the Channel Explicitly" icon="hashtag">
    Include the destination channel in your **When to use** description so notifications land where the right people are watching.
  </Card>

  <Card title="List the Trigger Topics" icon="bullseye">
    Spell out the topics that should fire a notification. Vague instructions produce either noise or silence.
  </Card>

  <Card title="Notify, Don't Escalate" icon="users">
    Slack tells your team something happened, but it doesn't hand over the conversation. For that, use [Escalations](/docs/user-guides/chatbot/actions/escalate-to-human) or [Chatbase live chat](/docs/user-guides/chatbot/actions/chatbase-live-chat).
  </Card>

  <Card title="Test Before Enabling" icon="flask">
    Send a test message from the Action Preview and confirm it arrives in the right channel before you turn the action on.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.