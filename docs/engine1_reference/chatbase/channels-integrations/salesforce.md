> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Salesforce

> Let your AI agent respond to Salesforce cases, or escalate conversations by creating a case for your team

## Overview

Chatbase provides a quick and easy way to add an AI agent to your Salesforce organization. In just a few minutes, you can make an AI agent available across your company's Salesforce org, where it responds to users' cases and helps your workspace provide round-the-clock automated support.

<Card title="What you can do:" icon="ticket">
  Have the AI agent answer Salesforce cases on its own, draft replies for a human to review, or open a case the moment a chat conversation needs a person.
</Card>

## Available capabilities

| Capability | What it does |
| - | - |
| [AI case responses in Salesforce](#ai-case-responses-in-salesforce) | The AI agent replies to Salesforce cases, or drafts a reply for a human to review |
| [Human escalation via case creation](#human-escalation-via-case-creation) | The AI agent opens a Salesforce case when a chat conversation needs a person |

<Note>
  For connecting customers to a human agent in Salesforce in real time, see the [Salesforce Live Chat action](/docs/user-guides/chatbot/actions/salesforce-actions#2-live-chat), which needs additional Salesforce org configuration.
</Note>

## Before you start

* A Chatbase account with an AI agent. If you haven't built one yet, [create a Chatbase account](https://www.chatbase.co/auth/signup) and follow [Your first AI agent](/docs/user-guides/quick-start/your-first-agent).
* A Salesforce account you can authorize the integration with.

## AI case responses in Salesforce

### How to connect Salesforce

<Steps>
  <Step title="Open your Chatbase AI agent">
    Head to your [dashboard](https://www.chatbase.co/dashboard/) and click the AI agent you wish to integrate with Salesforce.
  </Step>

  <Step title="Find the Salesforce integration">
    Click the **Channels** tab from the sidebar, find the **Salesforce** integration, and click **Connect**.
  </Step>

  <Step title="Authorize the integration">
    A new tab will open, asking you to log in to your Salesforce account to authorize the integration.
  </Step>

  <Step title="Configure the integration">
    Click **Manage** on the Salesforce integration card. You can then:

    * Select the Salesforce user that the AI agent will reply as.
    * Choose to either sync the AI agent's Salesforce instructions with the global instructions, or write a different instructions prompt. This is useful if you want to instruct the AI agent to escalate the case to a human in certain cases, for example if the customer asks for a refund.

    Then click **Save**.
  </Step>
</Steps>

### Generate Draft Response

Don't want the AI agent to respond directly? Enable **Generate Draft Response** to review and edit the AI-generated response before it's sent.

<Steps>
  <Step title="Open the page editor">
    Navigate to any of your cases, click the gear icon at the top right, then select **Edit Page**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/vmwTr3IRMjk1rVuy/user-guides/integrations/images/salesforce/salesforce-3.png?fit=max&auto=format&n=vmwTr3IRMjk1rVuy&q=85&s=29ce842caa3932a49e526ecba8c5cb92" alt="Opening the Salesforce page editor from a case" width="2754" height="1678" data-path="user-guides/integrations/images/salesforce/salesforce-3.png" />
    </Frame>
  </Step>

  <Step title="Add the action to the layout">
    Select the section where you want the button to appear, for example the Highlights Panel. Click **Add Action**, search for **Chatbase AI Draft Response**, and add it to the layout.

    <Frame>
      <img src="https://mintcdn.com/chatbase/vmwTr3IRMjk1rVuy/user-guides/integrations/images/salesforce/salesforce-4.png?fit=max&auto=format&n=vmwTr3IRMjk1rVuy&q=85&s=75908952063e5346d1f027a4c4b0e107" alt="Adding the Chatbase AI Draft Response action to the layout" width="1647" height="955" data-path="user-guides/integrations/images/salesforce/salesforce-4.png" />
    </Frame>
  </Step>
</Steps>

The **Generate Draft Response** button is then available across all cases, so AI agents can generate responses whenever they need one.

***

## Human escalation via case creation

<Steps>
  <Step title="Connect Salesforce">
    Choose **Integrations**, then connect your Salesforce account to authorize access.
  </Step>

  <Step title="Create the Escalations action">
    Configure your Escalations action to route tickets to Salesforce. Follow the [Escalations action guide](/docs/user-guides/chatbot/actions/escalate-to-human) to set it up.
  </Step>
</Steps>

<Check>
  Test the integration by asking your AI agent to speak to a human, and confirm a case appears in Salesforce with the conversation summary attached.
</Check>

## Next steps

<CardGroup cols={2}>
  <Card icon="users" href="/docs/user-guides/chatbot/actions/escalate-to-human" title="Escalations action">
    Configure when your AI agent escalates and which details it collects first.
  </Card>

  <Card icon="headset" href="/docs/user-guides/chatbot/actions/salesforce-actions" title="Salesforce Actions">
    Create cases and connect customers to live agents in Salesforce from the chat.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.