> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Salesforce Actions

> Create support cases and connect customers to live agents in Salesforce when your AI agent needs to escalate

## Overview

Salesforce Actions enable your AI agent to create support tickets (cases) and connect customers to live support agents directly within the chat interface. These actions provide an escalation path when the AI agent cannot resolve an issue, so customers receive the right level of support based on urgency and complexity.

<Info>
  **Prerequisite:** Before using Salesforce Actions, you must [set up the Salesforce integration](/docs/user-guides/integrations/salesforce) with your Chatbase account.
</Info>

## Available Salesforce Actions

| Action | What it does |
| - | - |
| [Create ticket](#1-create-ticket) | Open a case in Salesforce for a non-urgent issue that can be followed up asynchronously |
| [Live chat](#2-live-chat) | Connect the customer to a human agent in Salesforce in real time |

<Note>
  **Create ticket** is the Salesforce option of the shared [Escalations](/docs/user-guides/chatbot/actions/escalate-to-human) action. If you're comparing helpdesk platforms, that page lists all of them side by side.
</Note>

## How to create a Salesforce action

Both Salesforce actions are created the same way. The [action sections](#1-create-ticket) below list only what differs: which action to pick and any extra configuration it needs.

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, then select the action named in its section below.
  </Step>

  <Step title="Configure General Settings">
    **Action Name:** A unique, descriptive name for the action.

    **When to use:** Detailed instructions for when the AI agent should use this action. Each action's section below suggests what to include.

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.
  </Step>

  <Step title="Configure the action's own settings">
    [Live chat](#2-live-chat) requires Salesforce org configuration and three connection values. [Create ticket](#1-create-ticket) needs only the ticket platform set to Salesforce.
  </Step>

  <Step title="Choose Channels">
    Use **Channels** to control where the action is available. Toggle the action on or off for each configured channel, then click **Save**. Compatible channels differ per Salesforce action: **Create ticket** works on every channel except **Slack**, **Zendesk Messaging**, **Instagram** and **Messenger** while **Live chat** works on **Chat bubble**, **Help page**, and **Center Stage** only. Any other channel is incompatible and can't be selected. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Ensure the action is toggled to **Enabled**, then test it with the check listed in the action's section below.
  </Step>
</Steps>

## Actions

### 1. Create ticket

Create a support ticket (case) in Salesforce when the AI agent cannot solve the customer's problem and the issue does not require immediate assistance. Customers receive follow-up support without needing a real-time interaction.

<Card title="Best for:" icon="ticket">
  Non-urgent issues that can be resolved through asynchronous support, tracking customer inquiries, and ensuring all support requests are logged in Salesforce for proper follow-up.
</Card>

**Common Use Cases:**

* "The AI agent couldn't answer my question about billing"
* "I want to report a bug I found"
* "Can someone follow up with me about this issue?"

#### Settings

**Action:** **Create ticket**.

**Ticket platform:** Salesforce.

**When to use:** Detailed instructions for when the AI agent should open a case. For example:

```text theme={null}
- Use this action when you cannot answer the user's question or solve their problem
- Use this action when the user explicitly requests to create a ticket or case
- Use this action for non-urgent issues that don't require immediate human assistance
- Do not use this action if the user needs immediate help or expresses urgency
```

<Check>
  Test the action by asking your AI agent a question it can't answer, and confirm a case appears in Salesforce with the conversation details.
</Check>

***

### 2. Live chat

Connect the customer to a human support agent in Salesforce when the AI agent cannot solve the problem and the issue requires immediate resolution.

<Card title="Best for:" icon="headset">
  Urgent issues that require immediate human assistance, complex problems that need real-time troubleshooting, and situations where customers express frustration or need instant resolution.
</Card>

**Common Use Cases:**

* "I need to speak to a human right now"
* "This is urgent and I need immediate help"
* "The AI agent isn't helping me, connect me to support"
* "I have a critical issue that needs to be resolved immediately"

#### Configure your Salesforce org

Before creating the action, set up your Salesforce org to enable messaging and live chat. Complete these steps in order.

<Steps>
  <Step title="Enable Messaging Settings">
    Navigate to **Setup** in Salesforce. In the **Quick Find** box, search for "Messaging" and select **Messaging Settings**. Enable messaging by turning on the toggle.

    <Info>
      Messaging Settings must be enabled before you can create messaging channels or use Enhanced Chat features.
    </Info>
  </Step>

  <Step title="Set Up Omni-Channel">
    Configure Omni-Channel to enable intelligent routing of live chat sessions to available agents:

    1. In **Setup**, search for "Omni-Channel" in the Quick Find box
    2. Follow the Omni-Channel setup wizard to configure:
       * **Service Presence**: Set up agent presence statuses (Available, Busy, Offline)
       * **Routing Configurations**: Define how chats are routed to agents
       * **Service Channels**: Configure the chat channel for Omni-Channel routing
       * **Agent Workload**: Set the maximum number of simultaneous chats per agent

    <Info>
      For detailed Omni-Channel setup instructions, refer to the [Salesforce Omni-Channel preparation guide](https://help.salesforce.com/s/articleView?id=service.miaw_prepare_org_1.htm\&type=5).
    </Info>
  </Step>

  <Step title="Configure Enhanced Chat User Verification">
    Set up JSON Web Token (JWT) verification to securely authenticate customers connecting through Chatbase:

    1. In **Setup**, search for "Enhanced Chat User Verification" in the Quick Find box
    2. Navigate to **JSON Web Keysets**
    3. Click **New** to create a new keyset
    4. Choose **Endpoint** as the type of the keyset
    5. Enter the following URL in the **Endpoint URL** field:
       ```
       https://chatbase.co/api/integrations/salesforce/keys?chatbotId=<YOUR_CHATBOT_ID>
       ```
       Replace `<YOUR_CHATBOT_ID>` with your actual Chatbase AI agent ID
    6. Click **Save** to store the keyset configuration

    <Tip>
      Your AI agent ID can be found in the Chatbase dashboard URL or in the AI agent settings. This keyset allows Salesforce to verify JWT tokens issued by Chatbase for secure user authentication.
    </Tip>
  </Step>

  <Step title="Create a Messaging Channel">
    1. Return to the **Messaging Settings** page from step 1
    2. Click **New Channel** to create a new messaging channel
    3. Select **Enhanced Chat** as the channel type
    4. Choose **Mobile** as the deployment type
    5. Configure the routing settings based on your Omni-Channel setup from step 2
    6. Click **Save** to create the channel
    7. Select the **Add User Verification** checkbox
    8. Click **Save** again
    9. Return to the **Messaging Settings** page and open the newly created channel
    10. Scroll down to find the **User Verification Configuration** section
    11. Click **New**, select the keyset created in step 3, and enter a **Configuration Name**
    12. Ensure **Active** is selected and click **Save**

    <Warning>
      Ensure authentication is enabled on the messaging channel to maintain secure communication between Chatbase and Salesforce. Without authentication, the action will not work.
    </Warning>
  </Step>

  <Step title="Create Embedded Service Deployment">
    Create a deployment for Enhanced Chat with Custom Client configuration:

    1. In **Setup**, search for "Embedded Service Deployments" in the Quick Find box
    2. Click **New Deployment**
    3. Select **Enhanced Chat** as the service type
    4. Choose **Custom Client** as the deployment type
    5. Configure the deployment settings:
       * **Name**: Enter "Chatbase"
       * **API Name**: Enter "Chatbase"
       * **Messaging Channel**: Select the messaging channel created in step 4
    6. Click **Save** to create the deployment
    7. Click **Publish** and ensure the deployment status is set to **Active**
    8. Click **Install Code Snippet** and save the **OrganizationId**, **DeveloperName**, and **Url** fields. You'll need them when you create the action

    <Info>
      For detailed instructions on creating a Custom Client deployment, refer to the [Salesforce Enhanced Chat Custom Client deployment guide](https://help.salesforce.com/s/articleView?id=service.miaw_deployment_custom.htm\&type=5).
    </Info>
  </Step>
</Steps>

<Check>
  After completing all steps, verify that messaging is enabled, the messaging channel is active, Omni-Channel is configured, and the deployment is ready for use. You can test the setup by initiating a test chat session.
</Check>

#### Settings

**Action:** **Salesforce Live Chat**.

**When to use:** Detailed instructions for when the AI agent should connect the customer to a live agent. For example:

```text theme={null}
- Use this action when you cannot solve the user's problem and they need immediate assistance
- Use this action when the user explicitly requests to speak with a human agent
- Use this action for urgent issues that require real-time support
- Use this action when the user expresses frustration or indicates the issue is time-sensitive
- Do not use this action for non-urgent issues that can be handled through a support ticket
```

**Salesforce Live Chat API URL:** The **Url** value saved in [Create Embedded Service Deployment](#configure-your-salesforce-org).

**Developer Name:** The **DeveloperName** value saved in the same step.

**Org ID:** The **OrganizationId** value saved in the same step.

<Check>
  Test the action with a sample customer request in the embedded widget, and verify that live chat connections are established and routed to available support agents in Salesforce.
</Check>

***

## Best Practices

<CardGroup cols={2}>
  <Card title="Clear Escalation Criteria" icon="arrow-up">
    Define clear criteria in the **When to use** field so the AI agent knows when to create a case versus connecting to live chat.
  </Card>

  <Card title="Comprehensive Case Information" icon="file-text">
    Configure case creation to include relevant conversation context, customer information, and issue details, so agents can resolve issues efficiently.
  </Card>

  <Card title="Testing Coverage" icon="flask">
    Test both escalation paths with various scenarios and edge cases before going live, urgent and non-urgent alike.
  </Card>

  <Card title="Match Actions to Channels" icon="signal-stream">
    Turn live chat off on channels where you have no agents covering, so the AI agent doesn't offer something it can't complete.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.