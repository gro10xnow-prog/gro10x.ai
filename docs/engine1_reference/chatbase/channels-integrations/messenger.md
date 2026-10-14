> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Messenger

> Connect your Facebook pages so your AI agent can handle Messenger conversations, with human takeover

## Overview

Integrating Messenger with Chatbase lets your AI agent communicate directly with customers through your Facebook pages. You can also take over any conversation yourself and reply through Messenger, so routine inquiries are automated but you keep the freedom to step in whenever you want.

<Card title="What you can do:" icon="comments">
  Answer Messenger inquiries automatically, take over a conversation the moment you want to handle it yourself, and run different AI agents on different pages.
</Card>

<Info>
  Attachments are supported, so your AI agent can process them and respond based on their content. See [Attachments](/docs/user-guides/chatbot/channels#attachments).
</Info>

<Note>
  You can connect more than one Facebook page: select multiple pages during setup, or add more later using **Connect a new Facebook page** in the Messenger dashboard.
</Note>

## Before you start

* A Chatbase account with an AI agent
* A Facebook page you administer

## How to connect Messenger

<Steps>
  <Step title="Open the Messenger channel">
    Navigate to your dashboard, pick an AI agent, and go to **Channels**. Click **Setup** if this is your first time using the integration, or **Manage** if you've connected pages before.
  </Step>

  <Step title="Grant permission">
    If this is the first time, you'll be asked for permission to allow Chatbase to use your information.

    <Note>
      If you've already integrated some pages and want to modify your selection, pick the **Edit Previous Settings** option.
    </Note>

    <Frame>
      <img src="https://mintcdn.com/chatbase/yfTgmAASFJyGs3D_/user-guides/integrations/images/messenger/messenger-4.png?fit=max&auto=format&n=yfTgmAASFJyGs3D_&q=85&s=72f1e06df0e5131b97e50da4c01abe31" alt="Granting Chatbase permission to access your Facebook information" width="891" height="868" data-path="user-guides/integrations/images/messenger/messenger-4.png" />
    </Frame>
  </Step>

  <Step title="Choose your pages">
    Select **Opt into current pages only** to choose specific pages, or **Opt all current pages** to integrate every page on your account.

    <Frame>
      <img src="https://mintcdn.com/chatbase/yfTgmAASFJyGs3D_/user-guides/integrations/images/messenger/messenger-5.png?fit=max&auto=format&n=yfTgmAASFJyGs3D_&q=85&s=481c447b59d2c8a6e5fb0a58fbeb1ac3" alt="Choosing which Facebook pages to integrate" width="891" height="878" data-path="user-guides/integrations/images/messenger/messenger-5.png" />
    </Frame>
  </Step>

  <Step title="Review and save">
    Review the permissions and click **Save**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/yfTgmAASFJyGs3D_/user-guides/integrations/images/messenger/messenger-6.png?fit=max&auto=format&n=yfTgmAASFJyGs3D_&q=85&s=ab2e531a5dfe29c28476b27d83c3dbb1" alt="Reviewing Messenger permissions" width="891" height="849" data-path="user-guides/integrations/images/messenger/messenger-6.png" />
    </Frame>

    Click **Done** and wait a few seconds for the integration to connect.

    <Frame>
      <img src="https://mintcdn.com/chatbase/yfTgmAASFJyGs3D_/user-guides/integrations/images/messenger/messenger-7.jpg?fit=max&auto=format&n=yfTgmAASFJyGs3D_&q=85&s=8f5c381b88ba04f40de02b97b61fcf0d" alt="The Messenger integration connecting" width="640" height="510" data-path="user-guides/integrations/images/messenger/messenger-7.jpg" />
    </Frame>
  </Step>
</Steps>

<Check>
  Send a message to your connected Facebook page and confirm your AI agent replies.
</Check>

Once connected, you can manage your pages through the Messenger dashboard: add new pages with **Connect a new Facebook page**, or delete existing ones using the three dots next to the page.

## Human takeover

The human takeover feature lets you take over a chat whenever you want and reply to customers yourself. It works at the conversation level, so you can pick a specific conversation from the dashboard and stop the AI agent answering it.

### Enable human takeover for a conversation

1. Navigate to **Activity > Conversations** in the left sidebar.
2. In the **Conversations** section, filter to show only Messenger chats.
3. Click the human **takeover icon** to the right of the source.
4. Click the icon to enable human takeover.

<Frame>
  <img src="https://mintcdn.com/chatbase/bO49Edenw4JMFhBZ/user-guides/integrations/images/messenger/messenger-11.png?fit=max&auto=format&n=bO49Edenw4JMFhBZ&q=85&s=83224225c821426ac58e29912641fb08" alt="The human takeover icon in the Conversations list" width="1848" height="776" data-path="user-guides/integrations/images/messenger/messenger-11.png" />
</Frame>

Click the icon again to restore access to the AI agent.

<Warning>
  Some conversations won't have the human takeover icon. This happens when you delete a page from the integrations dashboard. You keep access to the conversations in your chat logs, but not the takeover feature, because that page's integration was deleted. The same applies if you delete a page and add it back, so be careful when deleting pages from the Messenger dashboard.
</Warning>

***

## Comment monitoring

Turn comments on your **Facebook posts into Chatbase Helpdesk tickets**, so your team can monitor and respond to customers directly from Chatbase. Comment monitoring is available from the channel settings for your Facebook accounts.

<Steps>
  <Step title="Open your channel settings">
    Go to **Channels** and select your connected **Facebook** channel.
  </Step>

  <Step title="Open Comments">
    Select the **Comments** tab.
  </Step>

  <Step title="Enable comment monitoring">
    Turn on **Comment monitoring** and select the connected accounts you want to monitor.
  </Step>

  <Step title="Receive comments as tickets">
    When someone comments on a monitored Facebook post, Chatbase automatically creates a ticket in the **Chatbase Helpdesk**.

    The ticket includes information about the original post and the comment, giving your team the context needed to respond.
  </Step>

  <Step title="Reply from the Chatbase Helpdesk">
    Open the ticket in the **Chatbase Helpdesk** and reply directly to the comment.

    Replies sent from Chatbase are posted as replies to the original Facebook comment.
  </Step>
</Steps>

## Connecting different AI agents to different pages

You can connect different AI agents to different Facebook pages, so each page gets specialized interactions.

<Steps>
  <Step title="Open the AI agent you want to connect">
    After connecting your first pages, you have access to the **manage Facebook pages** integrations page. Navigate to the AI agent you want to connect, then **Channels > Manage**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/BmrOmHxfb5Jvt0l2/user-guides/integrations/images/messenger/messenger-12.png?fit=max&auto=format&n=BmrOmHxfb5Jvt0l2&q=85&s=bfa913093824f808a1c2ac439de1cb6e" alt="Opening Channels > Manage for an AI agent" data-og-width="798" width="798" data-og-height="386" height="386" data-path="user-guides/integrations/images/messenger/messenger-12.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/chatbase/BmrOmHxfb5Jvt0l2/user-guides/integrations/images/messenger/messenger-12.png?w=280&fit=max&auto=format&n=BmrOmHxfb5Jvt0l2&q=85&s=13e620647d5f42c57bef940d7912c819 280w, https://mintcdn.com/chatbase/BmrOmHxfb5Jvt0l2/user-guides/integrations/images/messenger/messenger-12.png?w=560&fit=max&auto=format&n=BmrOmHxfb5Jvt0l2&q=85&s=7ae0319bfa0884b5a345b42916018da7 560w, https://mintcdn.com/chatbase/BmrOmHxfb5Jvt0l2/user-guides/integrations/images/messenger/messenger-12.png?w=840&fit=max&auto=format&n=BmrOmHxfb5Jvt0l2&q=85&s=8c53d7b2f8c791080919704340aa7213 840w, https://mintcdn.com/chatbase/BmrOmHxfb5Jvt0l2/user-guides/integrations/images/messenger/messenger-12.png?w=1100&fit=max&auto=format&n=BmrOmHxfb5Jvt0l2&q=85&s=8c4f4111bf85c5e258dc4a11d1565752 1100w, https://mintcdn.com/chatbase/BmrOmHxfb5Jvt0l2/user-guides/integrations/images/messenger/messenger-12.png?w=1650&fit=max&auto=format&n=BmrOmHxfb5Jvt0l2&q=85&s=5047e628424e10f9ec2d432ce7baaaa8 1650w, https://mintcdn.com/chatbase/BmrOmHxfb5Jvt0l2/user-guides/integrations/images/messenger/messenger-12.png?w=2500&fit=max&auto=format&n=BmrOmHxfb5Jvt0l2&q=85&s=2b152bdcac9f9551fc5cac49f5ca937f 2500w" />
    </Frame>
  </Step>

  <Step title="Connect a new page">
    You'll see all the pages connected to this AI agent. Click **Connect a new Facebook Page**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/bO49Edenw4JMFhBZ/user-guides/integrations/images/messenger/messenger-13.png?fit=max&auto=format&n=bO49Edenw4JMFhBZ&q=85&s=3a8b9be5e4f1efc9aea200fd18032597" alt="The Connect a new Facebook Page button" width="934" height="1072" data-path="user-guides/integrations/images/messenger/messenger-13.png" />
    </Frame>

    Then click **Edit previous settings**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/yfTgmAASFJyGs3D_/user-guides/integrations/images/messenger/messenger-14.png?fit=max&auto=format&n=yfTgmAASFJyGs3D_&q=85&s=6312e112d2900c3de88516fd0e7d9dd0" alt="The Edit previous settings option" width="891" height="786" data-path="user-guides/integrations/images/messenger/messenger-14.png" />
    </Frame>
  </Step>

  <Step title="Keep your existing pages selected">
    A list of connected pages is displayed.

    <Warning>
      Don't deselect any page you want to stay connected to Chatbase, because deselecting disables that page for Chatbase.
    </Warning>

    <Frame>
      <img src="https://mintcdn.com/chatbase/yfTgmAASFJyGs3D_/user-guides/integrations/images/messenger/messenger-15.png?fit=max&auto=format&n=yfTgmAASFJyGs3D_&q=85&s=81a48cc2ce50dc9bbf2a01ea0f1ce782" alt="The list of connected Facebook pages" width="891" height="1210" data-path="user-guides/integrations/images/messenger/messenger-15.png" />
    </Frame>
  </Step>

  <Step title="Select the new page and save">
    Select the page you want to add the new AI agent to and click **Next**. If the page was already selected, just click **Next**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/yfTgmAASFJyGs3D_/user-guides/integrations/images/messenger/messenger-16.png?fit=max&auto=format&n=yfTgmAASFJyGs3D_&q=85&s=f4394135798929978604065e39d0a394" alt="Selecting the page to add to the new AI agent" width="891" height="1177" data-path="user-guides/integrations/images/messenger/messenger-16.png" />
    </Frame>

    Click **Save**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/yfTgmAASFJyGs3D_/user-guides/integrations/images/messenger/messenger-17.png?fit=max&auto=format&n=yfTgmAASFJyGs3D_&q=85&s=efcecaac7c9220ee0314de2db9c2b6d8" alt="Saving the page selection" width="891" height="730" data-path="user-guides/integrations/images/messenger/messenger-17.png" />
    </Frame>
  </Step>
</Steps>

The new page is added to the dashboard and is now integrated with the new AI agent.

<Info>
  You can enable or disable the Messenger integration without disconnecting it. Disabling pauses messages while keeping your setup intact, and you can re-enable at any time. New chats still appear in your Chatbase dashboard chat logs.
</Info>

## Limitations

* **Deleting a page removes takeover for its conversations.** The chat logs remain, but the takeover icon disappears, and re-adding the page doesn't restore it for old conversations.
* **Deselecting a page during setup disables it** for Chatbase, even if you only meant to change something else.

## Next steps

<Card icon="instagram" href="/docs/user-guides/integrations/instagram" title="Instagram">
  Connect the Instagram accounts linked to your Facebook pages for the same treatment.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.