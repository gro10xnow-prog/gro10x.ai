> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# HubSpot

> Connect HubSpot so your AI agent can escalate a conversation by opening a ticket for your support team

## Overview

Integrating HubSpot with Chatbase lets your AI agent escalate customer issues to your human support team by creating a ticket directly in HubSpot. The ticket includes the customer's details and the conversation context, so your team can pick up where the AI agent left off.

<Card title="What you can do:" icon="ticket">
  Let the AI resolve routine questions on its own, and hand off to HubSpot the moment a case needs a person, with the full context already attached.
</Card>

## Before you start

* A Chatbase account with an AI agent
* A HubSpot account with permissions to install apps
* A paid Chatbase plan with Integrations enabled

## How to connect HubSpot

<Steps>
  <Step title="Open your Chatbase AI agent">
    Go to your Chatbase dashboard and select the AI agent you want to connect.
  </Step>

  <Step title="Connect HubSpot">
    Go to the **Integrations** tab, find **HubSpot**, and click **Connect**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/bO49Edenw4JMFhBZ/user-guides/integrations/images/hubspot/connect-hubspot.png?fit=max&auto=format&n=bO49Edenw4JMFhBZ&q=85&s=7d1e9a62b4ad701e90372504aab0cf55" alt="Integrations page with the HubSpot card" width="2462" height="1184" data-path="user-guides/integrations/images/hubspot/connect-hubspot.png" />
    </Frame>
  </Step>

  <Step title="Approve the requested scopes">
    You will be redirected to HubSpot. Review the requested permissions and click **Connect app**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SprxjLUsO_Nw9yoa/user-guides/integrations/images/hubspot/hubspot-3.png?fit=max&auto=format&n=SprxjLUsO_Nw9yoa&q=85&s=6a487a7acc191a2789d51c3ec07e5b20" alt="HubSpot OAuth page" width="2938" height="1566" data-path="user-guides/integrations/images/hubspot/hubspot-3.png" />
    </Frame>
  </Step>

  <Step title="Confirm the connection">
    After approval, you will return to Chatbase and see HubSpot marked as **Connected**.
  </Step>
</Steps>

## Create the Escalations action

Create a ticket action so your AI agent can open tickets in HubSpot.

<Steps>
  <Step title="Create a ticket action">
    Go to **Build → Actions → Create action → Escalations**.
  </Step>

  <Step title="Select HubSpot">
    Choose **HubSpot** as the ticket platform, then fill in the ticket fields.
  </Step>

  <Step title="Save and test">
    Save the action and run a test conversation.
  </Step>
</Steps>

<Check>
  Test the integration by asking your AI agent to speak to a human, and confirm a ticket appears in HubSpot with the conversation details attached.
</Check>

For the full set of options, including when the AI agent escalates, which details it collects first, and which channels it can escalate from, see the [Escalations action guide](/docs/user-guides/chatbot/actions/escalate-to-human).

## Managing the integration

### Disconnect HubSpot

Go to the **Integrations** tab, find HubSpot, and click **Disconnect**.

### Uninstall the app

To uninstall Chatbase from HubSpot, follow HubSpot's [uninstall guide](https://knowledge.hubspot.com/integrations/connect-apps-to-hubspot#uninstall-an-app).

## Next steps

<Card icon="users" href="/docs/user-guides/chatbot/actions/escalate-to-human" title="Escalations action">
  Configure when your AI agent escalates, which details it collects first, and which channels it can escalate from.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.