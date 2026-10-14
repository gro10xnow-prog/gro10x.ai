> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Chatbase Experts Program

The Chatbase Experts Program is built for agencies, consultants and freelancers who create AI agents for clients. It enables you to design, test, and configure AI agents in one place, then seamlessly copy them to your clients' own Chatbase workspaces when they're ready to go live.

## Overview

Here's what you'll learn in this guide:

<Steps>
  <Step title="Apply to Chatbase Experts Program">
    Apply to join the Experts Program and get approved
  </Step>

  <Step title="Build AI agents">
    Access Pro features to build AI agents for clients
  </Step>

  <Step title="Copy AI Agents to Clients">
    Use Remix Links to hand off AI agents to your clients' workspaces
  </Step>

  <Step title="Earn Commissions">
    Get rewarded for bringing new customers to Chatbase
  </Step>
</Steps>

## Apply to Chatbase Experts Program

Joining the Experts Program requires approval.

### How to Apply

<Steps>
  <Step title="Visit the Application Page">
    Go to the [Apply for the experts program](https://www.chatbase.co/experts-program/apply) page.
  </Step>

  <Step title="Submit the Application Form">
    Complete the form with details about your business and how you plan to use Chatbase.
  </Step>
</Steps>

### What Happens Next

<Info>
  Your application will be reviewed by the Chatbase team. You'll receive an email notification once your application is approved or declined.
</Info>

## Your Agency Workspace

Once approved, a dedicated workspace on "Agency" plan is added to your Chatbase account.

### What You Get

<CardGroup cols={3}>
  <Card title="Pro Features" icon="star">
    Full access to all Chatbase Pro features
  </Card>

  <Card title="More AI agents" icon="arrow-up">
    Effectively manage more AI agents for different clients
  </Card>

  <Card title="Multi-Client Support" icon="users">
    Ability to copy AI agents to clients when they are production-ready
  </Card>
</CardGroup>

### Agency Workspace Limits

Your Agency workspace includes:

| Resource | Limit |
| - | - |
| **Credits** | 1,000 per month |
| **AI agents** | Up to 20 |
| **Team members** | Up to 10 |
| **Source size** | Up to 60 MB |
| **Actions** | Up to 15 |

<Warning>
  **Not for production use.** AI agents created in an Agency workspace should be copied to a client's workspace before being used in production. The credits provided are intended for development and testing only.
</Warning>

## Copying AI Agents to Clients

Chatbase uses **Remix Links** to copy AI agents from your Agency workspace to a client.

<Info>
  A Remix Link creates an exact copy of your AI agent at the time the copy process began and allows your client to import it into their own workspace.
</Info>

### Create a Remix Link

<Steps>
  <Step title="Go to Your Agents Page">
    Navigate to your Agents page in the Agency workspace.
  </Step>

  <Step title="Locate the AI Agent">
    Find the AI agent you want to copy to your client.
  </Step>

  <Step title="Open the Menu">
    Click the three dots (**...**) button on the AI agent card.
  </Step>

  <Step title="Copy the Remix Link">
    Select **Copy remix link** from the menu.
  </Step>

  <Step title="Share with Your Client">
    Send the link to your client via email, messaging, or your preferred communication channel.
  </Step>
</Steps>

### When a Client Uses a Remix Link

When your client confirms the Remix:

* A copy of the AI agent is added to the client's workspace
* The new AI agent becomes fully owned and managed by the client
* The agency and client AI agents operate independently

## Additional Setup After Copying

Some extra setup may be **needed by the client** after importing the AI agent:

<AccordionGroup>
  <Accordion title="Webhook Secret Keys">
    We create new secrets for your webhooks. If you use the webhook secrets to verify the sender identity, you need to update them with the new secrets.

    Learn more about [webhook configuration](/docs/developer-guides/webhooks).
  </Accordion>

  <Accordion title="Deployments">
    Deployment integrations such as WhatsApp, Slack, Instagram, or other channels are not copied and must be manually connected by the client.
  </Accordion>

  <Accordion title="Add-ons">
    Add-ons (e.g., remove branding, auto-recharge credits) must be purchased separately as needed.

    Learn more about [workspace usage and add-ons](/docs/user-guides/workspace/usage).
  </Accordion>

  <Accordion title="Training">
    The AI agent's sources will be copied but the AI agent won't be trained on them yet. The client needs to trigger the AI agent's training after import.
  </Accordion>
</AccordionGroup>

### What's Not Copied

While most AI agent settings are copied, the following are **not** included:

* **Deployment integrations** such as WhatsApp, Zendesk, Instagram, Email channel, etc.
* **Slack Notify action** as Slack workspaces can't be connected to multiple AI agents at the same time
* **Shopify actions** as Shopify stores can't be connected to multiple AI agents at the same time
* **Notion sources** as Notion workspaces can't be connected to multiple accounts

## Important Things to Know

<Warning>
  **Remix links expire after 7 days.** Generate a new link if your client needs more time.
</Warning>

Keep these key points in mind:

* Clients must be on a subscription plan that supports the AI agent's features (e.g., number of actions, source size limits, ...)
* Changes made to the original AI agent **do not** affect the client's copy
* Deleting the original AI agent **does not** impact copied AI agents
* Each copy creates a completely independent AI agent

### Working Together After Remix

If you need to continue collaborating with a client after the remix, you can:

* Create and share a new Remix Link with an updated version of the AI agent. The client can import it alongside the existing AI agent.
* Have the client invite you as a collaborator to their workspace. This gives you direct access to manage and update the AI agent together.

## Experts Commissions

Chatbase Experts can earn commissions for bringing new customers to Chatbase.

### How Commissions Work

<Info>
  You earn a commission when a **first-time paying Chatbase customer** imports your Remix Link. No commission is earned if the client already has a paid Chatbase account.
</Info>

### Commission Details

| Detail | Value |
| - | - |
| **Commission rate** | 30% of the client's subscription |
| **Duration** | Paid for the first 12 months |
| **Eligibility** | First-time paying customers only |

### Tracking & Payouts

All commissions are tracked and paid through [Dub.co](https://dub.co).

You can view your earnings and payout status:

* In your Dub.co dashboard
* Via your [rewards dashboard](https://www.chatbase.co/affiliate)

<Info>
  **Need more help?** Contact our support team at [support@chatbase.co](mailto:support@chatbase.co) for assistance with the Experts Program.
</Info>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.