> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# viaSocket

> Connect your AI agent to viaSocket with webhooks to automate tasks across your apps, with no code

## Overview

Integrating Chatbase with viaSocket connects your AI agent to your favorite apps and tools with no code. Drag and drop to automate tasks across them. This guide walks through one complete example: receiving leads from your AI agent and automatically adding them to a Google Docs document.

<Card title="What you can do:" icon="bolt">
  Send what your AI agent captures into any app viaSocket supports, triggered by a Chatbase webhook the moment it happens.
</Card>

## Before you start

* A Chatbase account with an AI agent. If you haven't built one yet, follow [Your first AI agent](/docs/user-guides/quick-start/your-first-agent).
* A viaSocket account.

## What you can automate

| Automation | How it works |
| - | - |
| **Lead generation** | Capture leads through form submissions and add them to your CRM, such as HubSpot or Salesforce, for follow-up |
| **Customer support** | Trigger support tickets in systems like Zendesk or Freshdesk when your AI agent receives a customer inquiry |
| **Email campaigns** | Add contacts from your AI agent to Mailchimp or ActiveCampaign, then send personalized follow-up emails |
| **Multi-platform support** | Deploy AI agents across websites, mobile apps, and messaging services to reach users wherever they are |
| **Social media management** | Trigger social media updates or create posts based on customer interactions with your AI agent |
| **E-commerce notifications** | Automate stock updates, order confirmations, or promotional notifications based on customer interactions |

## How to connect viaSocket

<Steps>
  <Step title="Set up a trigger in viaSocket">
    1. Sign in to your viaSocket account.
    2. Click **Create New Flow** in the top-left corner of the viaSocket homepage.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/viaSocket/viasocket-1.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=0808d82cc7ab08df8c67117a662d4763" alt="Creating a new flow in viaSocket" width="1999" height="1107" data-path="user-guides/integrations/images/viaSocket/viasocket-1.png" />
    </Frame>

    3. In the Flow editor, click **Select Trigger**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/viaSocket/viasocket-2.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=f62c7c462be045c3d862e94ddc6ab626" alt="Selecting a trigger in the viaSocket flow editor" width="1794" height="1028" data-path="user-guides/integrations/images/viaSocket/viasocket-2.png" />
    </Frame>

    4. Select **Webhook** as the trigger, then copy the generated Webhook URL.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/viaSocket/viasocket-3.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=dedb24e2026ae2ead159dda3c0dba222" alt="Copying the generated webhook URL in viaSocket" width="1999" height="1119" data-path="user-guides/integrations/images/viaSocket/viasocket-3.png" />
    </Frame>
  </Step>

  <Step title="Configure the trigger in Chatbase">
    1. Navigate to your Chatbase [dashboard](https://www.chatbase.co/dashboard/).
    2. Click the AI agent you wish to integrate with viaSocket.
    3. Click **Settings** and select **Webhooks**.
    4. Select the events you want to trigger, paste the copied Webhook URL into the **Endpoint** field, then click **Create Webhook**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/bO49Edenw4JMFhBZ/user-guides/integrations/images/viaSocket/viasocket-6.png?fit=max&auto=format&n=bO49Edenw4JMFhBZ&q=85&s=b8791970ccd27e5cc0471104408f32c2" alt="Creating a webhook in Chatbase settings" width="2292" height="1082" data-path="user-guides/integrations/images/viaSocket/viasocket-6.png" />
    </Frame>
  </Step>

  <Step title="Set up an action to automate tasks">
    1. Go back to the viaSocket Flow Builder and click **Select Action**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/viaSocket/viasocket-8.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=a3211e1300fe76a6e0dccee8a14ae781" alt="Selecting an action in the viaSocket flow builder" width="1999" height="1142" data-path="user-guides/integrations/images/viaSocket/viasocket-8.png" />
    </Frame>

    2. Choose the **Google Docs** action: *Append Text to Document*.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/viaSocket/viasocket-9.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=19c7c3818a1d287db7f506c1179bf9ab" alt="Choosing the Append Text to Document action" width="1999" height="1123" data-path="user-guides/integrations/images/viaSocket/viasocket-9.png" />
    </Frame>

    3. Establish a connection and configure your action with the required details.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/viaSocket/viasocket-10.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=3aec77e621515ce7fd653d41d133fa34" alt="Configuring the Google Docs action in viaSocket" width="1999" height="1102" data-path="user-guides/integrations/images/viaSocket/viasocket-10.png" />
    </Frame>
  </Step>

  <Step title="Test and publish the flow">
    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/viaSocket/viasocket-11.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=c77deb2d651c9ac6c4779f909e424fa3" alt="Testing and publishing the viaSocket flow" width="1999" height="1074" data-path="user-guides/integrations/images/viaSocket/viasocket-11.png" />
    </Frame>
  </Step>
</Steps>

<Check>
  Trigger a lead capture on your site and confirm it's added to your designated Google Docs file.
</Check>

## Next steps

<CardGroup cols={2}>
  <Card icon="webhook" href="/docs/developer-guides/webhooks" title="Webhooks">
    See every event Chatbase can send, and what each payload contains.
  </Card>

  <Card icon="bolt" href="/docs/user-guides/integrations/zapier" title="Zapier">
    An alternative no-code automation platform, with a native Chatbase app.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.