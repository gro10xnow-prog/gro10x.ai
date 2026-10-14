> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Zendesk

> Let your AI agent reply to Zendesk tickets directly, or escalate conversations by opening a Zendesk ticket

## Overview

Chatbase makes it quick and easy to add an AI agent to your Zendesk environment. In just a few minutes, you can deploy an AI agent that either responds directly to customer tickets inside Zendesk, or escalates conversations to your human support team by creating a Zendesk ticket with a detailed summary of the interaction.

This flexibility lets you automate routine inquiries while making sure complex cases are handed off cleanly, improving response times, reducing manual workload, and delivering round-the-clock support.

<Card title="What you can do:" icon="ticket">
  Have the AI agent answer Zendesk tickets on its own, draft replies for a human to review, or open a ticket the moment a chat conversation needs a person.
</Card>

## Available capabilities

| Capability | What it does |
| - | - |
| [AI ticket responses in Zendesk](#ai-ticket-responses-in-zendesk) | The AI agent replies to incoming Zendesk tickets, or drafts a reply for a human to review |
| [Human escalation via ticket creation](#human-escalation-via-ticket-creation) | The AI agent opens a Zendesk ticket when a chat conversation needs a person |

## Before you start

* A Chatbase account with an AI agent. If you haven't built one yet, [create a Chatbase account](https://www.chatbase.co/auth/signup) and follow [Your first AI agent](/docs/user-guides/quick-start/your-first-agent).
* A Zendesk account, and your Zendesk subdomain.

## AI ticket responses in Zendesk

### How to connect Zendesk

<Steps>
  <Step title="Open your Chatbase AI agent">
    Head to your [dashboard](https://www.chatbase.co/dashboard/) and click the AI agent you wish to integrate with Zendesk.
  </Step>

  <Step title="Find the Zendesk integration">
    Click the **Channels** tab, find the **Zendesk** integration, and click **Setup**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/tFta2uWaJCqIJoQ6/user-guides/integrations/images/zendesk/zendesk-2.png?fit=max&auto=format&n=tFta2uWaJCqIJoQ6&q=85&s=a03bf73eefde3987c33e1d7ebf213a5f" alt="The Zendesk card on the Channels tab" width="2462" height="1034" data-path="user-guides/integrations/images/zendesk/zendesk-2.png" />
    </Frame>
  </Step>

  <Step title="Authorize the integration">
    A new tab will open. Enter your Zendesk subdomain and click **Submit**. You'll be asked to log in to your Zendesk account to authorize the integration.

    <Frame>
      <img src="https://mintcdn.com/chatbase/JnjROJ-aB2q57UGe/user-guides/integrations/images/zendesk/zendesk-4.png?fit=max&auto=format&n=JnjROJ-aB2q57UGe&q=85&s=849c6bbe2c94a6932919681a241b17d8" alt="Entering your Zendesk subdomain to authorize" width="2940" height="1434" data-path="user-guides/integrations/images/zendesk/zendesk-4.png" />
    </Frame>
  </Step>

  <Step title="Configure the integration">
    Once authorized, click **Manage** to configure the integration.

    <Frame>
      <img src="https://mintcdn.com/chatbase/cxa5wAgB2G5Q-lMr/user-guides/integrations/images/zendesk/zendesk-6.png?fit=max&auto=format&n=cxa5wAgB2G5Q-lMr&q=85&s=e9facc7a95ae9a56c8d935fdd7307dbe" alt="The Zendesk integration configuration screen" width="2328" height="1334" data-path="user-guides/integrations/images/zendesk/zendesk-6.png" />
    </Frame>

    Select the following options:

    * The Zendesk agent that the bot will reply as.
    * Whether tickets should be automatically assigned to the AI agent.
    * The AI agent's instructions specifically on Zendesk. This is useful if you want to instruct the AI agent to escalate the ticket to a human in certain cases, for example if the customer asks for a refund.

    Then click **Save**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/8OVB0cNPFgIgFsxo/user-guides/integrations/images/zendesk/zendesk-7.png?fit=max&auto=format&n=8OVB0cNPFgIgFsxo&q=85&s=5c43ba9f1a8d78db0dfe5c51e0c33a89" alt="Saving the Zendesk integration configuration" width="1582" height="1364" data-path="user-guides/integrations/images/zendesk/zendesk-7.png" />
    </Frame>
  </Step>
</Steps>

### Generate Draft Response

Don't want the AI agent to respond directly? Enable **Generate Draft Response** to review and edit the AI-generated response before it's sent.

<Steps>
  <Step title="Enable the feature">
    Once you've configured the integration, you can enable **Generate Draft Response** with a single click.

    <Frame>
      <img src="https://mintcdn.com/chatbase/tFta2uWaJCqIJoQ6/user-guides/integrations/images/zendesk/enable-zendesk-generate-draft-response.png?fit=max&auto=format&n=tFta2uWaJCqIJoQ6&q=85&s=c874ca6d89531fdecb3bed91b330bebd" alt="Enabling Generate Draft Response" width="2262" height="864" data-path="user-guides/integrations/images/zendesk/enable-zendesk-generate-draft-response.png" />
    </Frame>
  </Step>

  <Step title="Generate a draft in a ticket">
    Navigate to the **composer toolbar** at the bottom of the ticket editor, click the Chatbase icon, then click **Generate Draft Response**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/06fxyzzd9XhLSQS1/user-guides/integrations/images/zendesk/editor-generate-draft-response.png?fit=max&auto=format&n=06fxyzzd9XhLSQS1&q=85&s=f52e819ee6e5470b7da1390969810798" alt="Generating a draft response from the Zendesk composer toolbar" width="1083" height="250" data-path="user-guides/integrations/images/zendesk/editor-generate-draft-response.png" />
    </Frame>
  </Step>
</Steps>

### Remove the draft response from Zendesk

The **Generate Draft Response** button comes from the **Chatbase** app installed in Zendesk Support. Disconnecting Zendesk in Chatbase doesn't remove it. The button stays visible, but it won't work. To remove it, uninstall the app in Zendesk:

1. In Zendesk, open **Admin Center**.
2. Go to **Apps and integrations > Apps > Zendesk Support apps**.
3. Find the app named **Chatbase**.
4. Open its menu, choose **Uninstall**, then confirm.
5. Ask your agents to refresh Zendesk. Anyone with it already open keeps seeing the app until they do.

<Warning>
  Don't remove the **Chatbase** bot under **Apps and integrations > Integrations > Conversations integrations** by mistake. It connects your AI agent to [Zendesk Messaging](/docs/user-guides/integrations/zendesk-messaging) channels like WhatsApp and web messaging, and removing it stops the AI agent answering there. It doesn't remove the draft response button.
</Warning>

If you no longer use any Zendesk features, you can also disconnect the Zendesk integration in your Chatbase dashboard.

### Tag management system

You can use the tags the AI agent assigns to tickets to track its performance.

| Tag | When it's applied |
| - | - |
| `chatbase-involved` | Applied to all tickets Chatbase replied to |
| `chatbase-routed-to-workspace` | Applied to tickets the AI agent couldn't resolve, or was instructed to route to the workspace |
| `chatbase-soft-resolved` | Applied to tickets the AI agent thinks are resolved, but the customer hasn't confirmed |
| `chatbase-hard-resolved` | Applied to tickets where the customer confirmed the problem is resolved |
| `chatbase-no-ai` | Applied to tickets to stop the bot from auto-assigning itself or replying |

***

## Human escalation via ticket creation

<Steps>
  <Step title="Connect Zendesk">
    Choose **Integrations**, then connect your Zendesk account to authorize access.

    <Frame>
      <img src="https://mintcdn.com/chatbase/tFta2uWaJCqIJoQ6/user-guides/integrations/images/zendesk/zendesk-8.png?fit=max&auto=format&n=tFta2uWaJCqIJoQ6&q=85&s=44d9039baecbd9a55194cf5f0ab8e4b2" alt="Connecting Zendesk from the Integrations page" width="2458" height="942" data-path="user-guides/integrations/images/zendesk/zendesk-8.png" />
    </Frame>

    <Frame>
      <img src="https://mintcdn.com/chatbase/8OVB0cNPFgIgFsxo/user-guides/integrations/images/zendesk/zendesk-9.png?fit=max&auto=format&n=8OVB0cNPFgIgFsxo&q=85&s=57a56a82cdbea291ee63844f3e7d4de4" alt="Authorizing the Zendesk connection" width="1082" height="1456" data-path="user-guides/integrations/images/zendesk/zendesk-9.png" />
    </Frame>
  </Step>

  <Step title="Create the Escalations action">
    Configure your Escalations action to route tickets to Zendesk. Follow the [Escalations action guide](/docs/user-guides/chatbot/actions/escalate-to-human) to set it up.
  </Step>
</Steps>

<Check>
  Test the integration by asking your AI agent to speak to a human, and confirm a ticket appears in Zendesk with the conversation attached.
</Check>

<Note>
  **Escalations from the Email channel pause the AI agent.** Once the ticket exists, the AI agent stops replying to the customer's email thread and your team answers from Zendesk instead. Marking the ticket **Solved** or **Closed** returns the thread to the AI agent. See [Email handover with Zendesk](/docs/user-guides/chatbot/actions/escalate-to-human#email-handover-with-zendesk).
</Note>

<Tip>
  Zendesk is the only escalation platform that can receive the **full conversation transcript**, with the customer's files attached. Every other platform receives an AI-written summary. See [Details collection by platform](/docs/user-guides/chatbot/actions/escalate-to-human#zendesk).
</Tip>

## Next steps

<Card icon="users" href="/docs/user-guides/chatbot/actions/escalate-to-human" title="Escalations action">
  Configure when your AI agent escalates, what goes on the ticket, the internal note, and which Zendesk custom fields it fills in.
</Card>

<iframe width="100%" height="400" src="https://www.youtube.com/embed/TxXAZlvwF68" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen />


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.