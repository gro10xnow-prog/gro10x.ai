> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Zendesk Messaging

> Let your AI agent answer customers in your Zendesk Messaging channels and hand chats to your team in Zendesk

## Overview

Connect Zendesk Messaging and your AI agent answers customers in the Zendesk channels you pick, like your Web Widget or mobile apps. When a customer needs a person, the AI agent passes the chat to your team in Zendesk.

<Note>
  This is not the [Zendesk](/docs/user-guides/integrations/zendesk) integration. That one works with tickets. You can use both.
</Note>

## Before you start

* A Chatbase **Standard** plan or above.
* Admin access to a Zendesk account with at least one Messaging channel.
* If this AI agent uses [Sunshine](/docs/user-guides/integrations/sunshine), disconnect Sunshine first. An AI agent can't use both.

## How to connect Zendesk Messaging

<Steps>
  <Step title="Connect Zendesk in Chatbase">
    Open your AI agent in the [dashboard](https://www.chatbase.co/dashboard/) and go to **Integrations**. On the **Zendesk Messaging** card, click **Connect**.

    A Zendesk window opens. Sign in and allow access. The card then shows **Connected**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/2pM_1dDHy3XHQ-WT/user-guides/integrations/images/zendesk-messaging/connect-integration.png?fit=max&auto=format&n=2pM_1dDHy3XHQ-WT&q=85&s=47050e35e51f415571bd0132cd7a7ca9" alt="The Zendesk Messaging card on the Integrations page, showing Connected" width="1415" height="729" data-path="user-guides/integrations/images/zendesk-messaging/connect-integration.png" />
    </Frame>
  </Step>

  <Step title="Open marketplace bots in Zendesk">
    In Zendesk Admin Center, go to **AI > AI agents**. Under **Marketplace bots**, click **Manage marketplace bots**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/2pM_1dDHy3XHQ-WT/user-guides/integrations/images/zendesk-messaging/manage-marketplace-bots.png?fit=max&auto=format&n=2pM_1dDHy3XHQ-WT&q=85&s=f5dab0b2e0ae77fe9b73c45bed06f799" alt="The Manage marketplace bots link in Zendesk Admin Center" width="978" height="729" data-path="user-guides/integrations/images/zendesk-messaging/manage-marketplace-bots.png" />
    </Frame>
  </Step>

  <Step title="Choose channels for Chatbase in Zendesk">
    Click **Chatbase**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/2pM_1dDHy3XHQ-WT/user-guides/integrations/images/zendesk-messaging/select-chatbase-bot.png?fit=max&auto=format&n=2pM_1dDHy3XHQ-WT&q=85&s=ad6903d89c51707174c0582f7345af0e" alt="Chatbase in the list of marketplace bots" width="1411" height="729" data-path="user-guides/integrations/images/zendesk-messaging/select-chatbase-bot.png" />
    </Frame>

    Under **Channels**, select each channel Chatbase should answer, then click **Save**. The **Responder** column changes to **Chatbase**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/2pM_1dDHy3XHQ-WT/user-guides/integrations/images/zendesk-messaging/select-channels.png?fit=max&auto=format&n=2pM_1dDHy3XHQ-WT&q=85&s=5d775cdbf9bb007ad67c45c48cfc1019" alt="Selecting channels for Chatbase and saving" width="1415" height="731" data-path="user-guides/integrations/images/zendesk-messaging/select-channels.png" />
    </Frame>
  </Step>

  <Step title="Turn on channels in Chatbase">
    In Chatbase, go to **Channels**. On the **Zendesk Messaging** card, click **Manage**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/2pM_1dDHy3XHQ-WT/user-guides/integrations/images/zendesk-messaging/channels-card.png?fit=max&auto=format&n=2pM_1dDHy3XHQ-WT&q=85&s=a09cb0ead7cd724487b0d9e1fbabe213" alt="The Zendesk Messaging card on the Channels page" width="1265" height="731" data-path="user-guides/integrations/images/zendesk-messaging/channels-card.png" />
    </Frame>

    Open the **Connections** tab. Turn on each channel this AI agent should answer, then click **Save**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/2pM_1dDHy3XHQ-WT/user-guides/integrations/images/zendesk-messaging/connections-tab.png?fit=max&auto=format&n=2pM_1dDHy3XHQ-WT&q=85&s=5f7fa2ea9e6539b1727ea3ae2221a6a7" alt="Turning on a channel in the Connections tab" width="497" height="566" data-path="user-guides/integrations/images/zendesk-messaging/connections-tab.png" />
    </Frame>

    <Warning>
      Your AI agent doesn't answer any channel until you turn it on here.
    </Warning>

    <Note>
      A channel showing **Not assigned in Zendesk** wasn't selected in the previous step. Each channel can have one AI agent, so a channel another agent already answers shows **Used by agent** with that agent's name.
    </Note>
  </Step>
</Steps>

<Check>
  Send a message in one of the channels you turned on, like your Zendesk Web Widget. Your AI agent replies.
</Check>

## Hand off to a human

Add the **Live chat** action so your AI agent can pass a chat to your team in Zendesk Agent Workspace.

<Steps>
  <Step title="Create the action">
    Go to **Build > Actions** and open **Create action**. On the **Zendesk Messaging** card, click **Live chat**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/2pM_1dDHy3XHQ-WT/user-guides/integrations/images/zendesk-messaging/live-chat-action-card.png?fit=max&auto=format&n=2pM_1dDHy3XHQ-WT&q=85&s=2c84d8de48b228d0ede46735ab7d1618" alt="The Zendesk Messaging card with the Live chat action" width="1332" height="729" data-path="user-guides/integrations/images/zendesk-messaging/live-chat-action-card.png" />
    </Frame>
  </Step>

  <Step title="Choose when to hand off, then turn it on">
    Edit **When to use** to describe when the AI agent should hand off. By default, it hands off when a customer asks for a person or the AI agent can't solve the issue.

    Click **Save and continue**, then turn on the toggle at the top right.

    <Frame>
      <img src="https://mintcdn.com/chatbase/2pM_1dDHy3XHQ-WT/user-guides/integrations/images/zendesk-messaging/live-chat-action-settings.png?fit=max&auto=format&n=2pM_1dDHy3XHQ-WT&q=85&s=8fe3a581c32e32feb93ffd0c8b777497" alt="Editing When to use and turning on the Live chat action" width="1342" height="729" data-path="user-guides/integrations/images/zendesk-messaging/live-chat-action-settings.png" />
    </Frame>
  </Step>
</Steps>

What happens during a handoff:

1. If the customer isn't signed in, the AI agent asks for their email.
2. The chat moves to Zendesk Agent Workspace with a title and short summary for your team.
3. The AI agent stops replying while your team has the chat.
4. When your team ends the messaging session, the customer's next message goes to the AI agent again.

## How it works

* **Greeting.** When a customer opens a new chat in your Web Widget or app, the AI agent sends its initial messages.
* **Suggested messages.** These show as reply buttons the customer can tap.
* **Name and picture.** The AI agent uses its display name and profile picture.
* **Inactive chats.** A conversation ends after 24 hours without a message.
* **Conversations.** Chats appear in **Activity > Conversations** with the source **Zendesk Messaging**.

<Info>
  Attachments are supported, so your AI agent can read files customers send. See [Attachments](/docs/user-guides/chatbot/channels#attachments).
</Info>

## Limitations

* Messages your team sends after a handoff don't appear in Chatbase.
* The AI agent replies with text only. It can't send files or images.

## Disconnect

<Warning>
  Remove Chatbase from your channels in Zendesk first, or customers on those channels won't get a reply. In Zendesk Admin Center, go to **AI > AI agents > Manage marketplace bots**, click **Chatbase**, clear its channels, and click **Save**.
</Warning>

Then in Chatbase, go to **Integrations**, open the menu on the **Zendesk Messaging** card, and click **Disconnect**. This removes the connection and the **Live chat** action from this AI agent.

## Next steps

<Card icon="ticket" href="/docs/user-guides/integrations/zendesk" title="Zendesk">
  Let your AI agent reply to Zendesk tickets, or open a ticket when a chat needs a person.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.