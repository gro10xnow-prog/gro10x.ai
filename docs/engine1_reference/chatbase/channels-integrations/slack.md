> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Slack

> Add your AI agent to a Slack workspace so your team can ask it questions in any channel

## Overview

Chatbase provides a quick way to add an AI agent to your Slack workspace. In a few minutes, you can make an AI agent available across your company's Slack channels, where it understands natural language, answers common queries, resolves issues, and looks up information, giving you round-the-clock automated support inside Slack.

<Card title="What you can do:" icon="comments">
  Give your whole workspace an AI teammate: mention it in any channel and it answers right there, in the thread, without anyone leaving Slack.
</Card>

<Info>
  Attachments are supported, so your AI agent can process them and respond based on their content. See [Attachments](/docs/user-guides/chatbot/channels#attachments).
</Info>

<Note>
  This page covers deploying your AI agent *into* Slack so people can talk to it. To have your AI agent *notify* a Slack channel when a customer mentions a topic, use the [Slack notification action](/docs/user-guides/chatbot/actions/slack) instead.
</Note>

## Before you start

* A Chatbase account with an AI agent, on a paid plan. If you haven't built one yet, [create a Chatbase account](https://www.chatbase.co/auth/signup), subscribe to a plan, and follow [Your first AI agent](/docs/user-guides/quick-start/your-first-agent).
* A Slack workspace you can install apps into.

## How to connect Slack

<Steps>
  <Step title="Open your Chatbase AI agent">
    Head to your [dashboard](https://www.chatbase.co/dashboard/) and click the AI agent you wish to integrate with Slack.
  </Step>

  <Step title="Connect Slack">
    Click **Integrations** in the left sidebar, then click **Connect** under the Slack card. You'll be asked to authorize Chatbase to access your Slack account and workspace.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/slack/slack-3.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=0a396b4d64bc81048fcd2e85b884512f" alt="Authorizing Chatbase to access your Slack workspace" width="1861" height="851" data-path="user-guides/integrations/images/slack/slack-3.png" />
    </Frame>

    Scroll down and click **Allow**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/slack/slack-4.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=29e799398fea822abd9b0cd2cc096cb5" alt="Clicking Allow to grant Slack permissions" width="802" height="332" data-path="user-guides/integrations/images/slack/slack-4.png" />
    </Frame>
  </Step>

  <Step title="Open your Slack workspace">
    If all goes well, you'll see a message saying **Chatbase has been successfully added to your workspace**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/slack/slack-5.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=1a55879ef57eb235363af92c00269179" alt="Confirmation that Chatbase was added to the workspace" width="881" height="574" data-path="user-guides/integrations/images/slack/slack-5.png" />
    </Frame>

    Click **Open Slack** to launch your workspace. You'll be prompted to sign in, or to select from the workspaces you're already signed into. Click **Open** beside the target workspace.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/slack/slack-6.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=6aa67f3d2e9b53af4241f63757463f93" alt="Selecting the target Slack workspace" width="851" height="361" data-path="user-guides/integrations/images/slack/slack-6.png" />
    </Frame>
  </Step>

  <Step title="Invite the AI agent to a channel">
    Open any channel in your workspace and type **@chatbase** followed by a question related to your AI agent's purpose. Slack will prompt you to invite the AI agent to the channel.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/slack/slack-7.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=9b8a4733a1f6be2f0a1fd388256f23d1" alt="Slack prompting you to invite the Chatbase AI agent to a channel" width="1918" height="890" data-path="user-guides/integrations/images/slack/slack-7.png" />
    </Frame>

    Click **Invite Them**. The AI agent is then available in that channel.
  </Step>
</Steps>

<Check>
  Type **@chatbase** followed by a question in the channel and confirm your AI agent responds.
</Check>

<Frame>
  <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/slack/slack-8.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=84a06ec905e5e7e350bca3af0ba8d936" alt="The Chatbase AI agent answering a question in a Slack channel" width="1562" height="825" data-path="user-guides/integrations/images/slack/slack-8.png" />
</Frame>

## Settings

### Message appearance

Replies sent by your AI agent in Slack use the AI agent name and avatar configured in your Chat bubble settings. If a custom name and avatar are set there, those are reflected in Slack. If not, the defaults are used:

* **Name:** Chatbase
* **Avatar:** Chatbase logo

To change how your AI agent appears in Slack, update the profile picture and display name inside the widget's settings in your Chatbase dashboard.

<Frame>
  <img src="https://mintcdn.com/chatbase/MVZzd9e05cJ7lFRq/user-guides/integrations/images/slack/slack-11.png?fit=max&auto=format&n=MVZzd9e05cJ7lFRq&q=85&s=373b74aecb8cfaf10f9948709372a064" alt="Updating the AI agent's display name and avatar in widget settings" width="2148" height="386" data-path="user-guides/integrations/images/slack/slack-11.png" />
</Frame>

<Info>
  If the AI agent is mentioned inside a thread, it replies within that same thread rather than the main channel. Each Slack thread is treated as a separate conversation, so the AI agent maintains accurate context within each discussion.
</Info>

### Ignore bot messages

Under **Channels → Slack → Manage → Extra Settings**, tick **Ignore bots** and click **Save**.

When enabled, your AI agent ignores messages sent by other Slack bots and only responds to human users. This is useful if your workspace contains automation bots or AI agents that post messages, since it prevents bot-to-bot loops and infinite conversations.

## Backstage

Slack is one of the ways you can interact with Backstage, Chatbase's AI assistant for managing your AI agent. See the [Backstage documentation](/docs/user-guides/chatbot/backstage) to learn more.

## Next steps

<CardGroup cols={2}>
  <Card icon="bell" href="/docs/user-guides/chatbot/actions/slack" title="Slack notification action">
    Have your AI agent post to a Slack channel when a customer mentions a topic you care about.
  </Card>

  <Card icon="robot" href="/docs/user-guides/chatbot/backstage" title="Backstage">
    Manage your AI agent conversationally, from Slack.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.