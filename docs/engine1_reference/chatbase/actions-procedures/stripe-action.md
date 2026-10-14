> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Stripe Actions

> Let customers check their subscription, review invoices, change plans, and update billing details from the chat

## Overview

Stripe Actions enable your AI agent to handle customer billing inquiries, subscription management, and account updates directly within the chat interface. These actions provide secure, real-time access to customer payment information, streamlining support operations and improving the customer experience.

<Info>
  **Prerequisites:** Before using Stripe Actions, you must:

  1. [Set up the Stripe integration](/docs/user-guides/integrations/stripe) with your Chatbase account
  2. Configure [identity verification](/docs/developer-guides/identity-verification) for secure customer authentication
  3. Set up [contacts](/docs/user-guides/chatbot/contacts/contacts-overview) with valid `stripe_account` fields for each customer
</Info>

## Available Stripe Actions

| Action | What it does |
| - | - |
| [Get subscription information](#1-get-subscription-information) | Show the customer's current plan, status, billing cycle, and pricing |
| [Get invoice history](#2-get-invoice-history) | Show the customer's invoices, payment details, and billing records |
| [Manage subscriptions](#3-manage-subscriptions) | Change plans, upgrade, downgrade, add payment methods, and cancel |
| [Change billing information](#4-change-billing-information) | Update the customer's billing address and other account details |

## How Stripe Actions work

Stripe Actions use Chatbase's identity verification system to securely access customer-specific data:

1. **User authentication**: Customers are identified using `window.chatbase("identify", {...})` with their unique user ID
2. **Contact matching**: The system matches the authenticated user ID to a contact record containing their Stripe account ID
3. **Secure data access**: Actions retrieve only the data associated with the authenticated customer's Stripe account
4. **Real-time responses**: The AI agent answers immediately using live Stripe data

<Note>
  Stripe Actions need an identified customer, so they don't run in **Action Preview** or **Compare**. To test them in the Playground, start the conversation with [Chat as user](/docs/user-guides/chatbot/playground#chat-as-user) and set the **User ID** to a customer whose contact record has a valid `stripe_account`. To test the real thing end to end, embed the [JavaScript script](/docs/developer-guides/javascript-embed) on your site and run the action there.
</Note>

## How to create a Stripe action

Every Stripe action is created the same way. The [action sections](#1-get-subscription-information) below list only what differs: which action to pick and any extra configuration it needs.

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, then on the **Stripe** card select the action named in its section below.
  </Step>

  <Step title="Configure General Settings">
    **Action Name:** A unique, descriptive name for the action.

    **When to use:** Detailed instructions for when the AI agent should use this action.

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.
  </Step>

  <Step title="Configure the action's own settings">
    [Manage subscriptions](#3-manage-subscriptions) adds a step for defining the available plans and cancellation policy. Every other action skips straight to channels.
  </Step>

  <Step title="Choose Channels">
    Stripe actions are compatible with the **Chat bubble** channel only. Every other channel is incompatible and can't be selected. Use **Channels** to toggle the action on or off for Chat bubble, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Ensure the action is toggled to **Enabled**, then test it in the embedded widget on your site.
  </Step>
</Steps>

## Actions

### 1. Get subscription information

Retrieve and display customer subscription details, including current plan, status, billing cycle, and pricing information.

<Card title="Best for:" icon="credit-card">
  Answering questions about current subscription status, plan details, renewal dates, and subscription history.
</Card>

**Common Use Cases:**

* "What's my current plan?"
* "When does my subscription renew?"
* "How much am I paying monthly?"
* "Is my subscription active?"

#### Settings

**Action:** **Stripe Get Subscription Info**.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/actions/stripe/stripe-action-get-subscription.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=da6f378ff6acea78c566d48744685550" alt="Selecting the get subscription action from the Stripe options" width="1232" height="740" data-path="user-guides/chatbot/images/actions/stripe/stripe-action-get-subscription.png" />
</Frame>

<Check>
  Test the action in the embedded widget to ensure it correctly retrieves subscription data for authenticated customers.
</Check>

<Frame>
  <img width="300" height="500" src="https://mintcdn.com/chatbase/rsUPJArEUUJiVCBF/user-guides/chatbot/images/actions/stripe/get-subscriptions-action-result.png?fit=max&auto=format&n=rsUPJArEUUJiVCBF&q=85&s=272d24f4696d1718c661e01a8d4e8e96" alt="The AI agent returning subscription details in chat" data-path="user-guides/chatbot/images/actions/stripe/get-subscriptions-action-result.png" />
</Frame>

***

### 2. Get invoice history

Retrieve and display customer invoice history, payment details, and billing records.

<Card title="Best for:" icon="receipt">
  Providing access to billing history, payment confirmations, invoice downloads, and payment troubleshooting.
</Card>

**Common Use Cases:**

* "Show me my recent invoices"
* "Was my payment processed?"
* "Can you provide my billing history?"

#### Settings

**Action:** **Stripe Get Invoices**.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/actions/stripe/stripe-action-get-invoices.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=20a8e381bc08106a4c531e279af84c86" alt="Selecting the get invoices action from the Stripe options" width="1224" height="738" data-path="user-guides/chatbot/images/actions/stripe/stripe-action-get-invoices.png" />
</Frame>

<Check>
  Test the action with a sample customer request in the embedded widget.
</Check>

<Frame>
  <img width="300" height="500" src="https://mintcdn.com/chatbase/rsUPJArEUUJiVCBF/user-guides/chatbot/images/actions/stripe/get-invoices-action-result.png?fit=max&auto=format&n=rsUPJArEUUJiVCBF&q=85&s=1d3c131bb3a4284a35a7e762580727b4" alt="The AI agent returning invoice history in chat" data-path="user-guides/chatbot/images/actions/stripe/get-invoices-action-result.png" />
</Frame>

***

### 3. Manage subscriptions

Comprehensive subscription management, including plan changes, upgrades, downgrades, and cancellations.

<Card title="Best for:" icon="arrows-rotate">
  Complete subscription lifecycle management: plan changes, adding payment methods, and cancellation handling.
</Card>

**Common Use Cases:**

* "I want to upgrade my plan"
* "Upgrade my plan to the pro"
* "I need to cancel my subscription"
* "What plans are available?"

#### Settings

**Action:** **Stripe** → **Manage Subscriptions**.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/actions/stripe/stripe-action-manage-subscription.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=efa0063f435e59f1c63bf4ca4e8e0f96" alt="Configuring the subscription management action" width="1224" height="738" data-path="user-guides/chatbot/images/actions/stripe/stripe-action-manage-subscription.png" />
</Frame>

#### Define available plans

Configure which subscription plans and options are available for customers to choose from.

<Tabs>
  <Tab title="Plan Configuration">
    Set up available plans with their behavior.

    <Frame>
      <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/actions/stripe/stripe-action-manage-subscription-plans-config.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=393e4e4778d755e89933f8ea816c6210" alt="Configuring available subscription plans and options" width="2392" height="1440" data-path="user-guides/chatbot/images/actions/stripe/stripe-action-manage-subscription-plans-config.png" />
    </Frame>
  </Tab>

  <Tab title="Cancellation Settings">
    Configure cancellation policies and refund handling.

    <Frame>
      <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/actions/stripe/stripe-action-manage-subscription-cancel-config.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=c0f71fd4321d5acd2f2f49467e2eb1f2" alt="Configuring cancellation policies and refund handling" width="2392" height="1440" data-path="user-guides/chatbot/images/actions/stripe/stripe-action-manage-subscription-cancel-config.png" />
    </Frame>
  </Tab>
</Tabs>

<Check>
  Test every scenario before going live: upgrading from basic to premium with proper proration, downgrading with the right billing adjustments, and the complete cancellation flow. All subscription changes should be immediately reflected in both Stripe and the customer experience.
</Check>

<Frame>
  <img src="https://mintcdn.com/chatbase/rsUPJArEUUJiVCBF/user-guides/chatbot/images/actions/stripe/stripe-manage-subscription-result.gif?s=d516c4f147cee6dd0aecd33d21de1cc2" alt="The AI agent managing a subscription in chat" width="400" height="733" data-path="user-guides/chatbot/images/actions/stripe/stripe-manage-subscription-result.gif" />
</Frame>

<Tip>
  Manage subscriptions changes what a customer pays. Consider turning on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures) and putting your eligibility checks in a [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) ahead of the step that calls it, so plan changes and cancellations happen at a point you control.
</Tip>

***

### 4. Change billing information

Allow customers to update their billing address and other account information.

<Card title="Best for:" icon="address-card">
  Self-service billing updates, address changes, and other account information updates.
</Card>

**Common Use Cases:**

* "I need to update my billing address"
* "Update my billing email address"
* "Update my billing phone number"

#### Settings

**Action:** **Stripe** → **Change customer information**.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/actions/stripe/stripe-action-change-billing.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=3539055bd7c674f7c2c57d16c9c65d02" alt="Selecting the change billing information action" width="2392" height="1440" data-path="user-guides/chatbot/images/actions/stripe/stripe-action-change-billing.png" />
</Frame>

<Check>
  Test the action with various scenarios to ensure only authenticated customers can make changes, and verify that billing updates are reflected in both Stripe and the customer's account.
</Check>

<Frame>
  <img width="300" height="500" src="https://mintcdn.com/chatbase/rsUPJArEUUJiVCBF/user-guides/chatbot/images/actions/stripe/stripe-change-billing-result.png?fit=max&auto=format&n=rsUPJArEUUJiVCBF&q=85&s=0eefe8674b0c838a51aba5b7b461c566" alt="The AI agent updating billing information in chat" data-path="user-guides/chatbot/images/actions/stripe/stripe-change-billing-result.png" />
</Frame>

***

## Limitations

* **Stripe Actions require an authenticated customer.** Every action reads or writes the signed-in customer's own Stripe record, so identity verification must be configured and the customer must be identified.
* **Each customer needs a contact record with a valid `stripe_account`.** Without it, the action has no Stripe customer to act on.
* **In the Playground, they only run through Chat as user.** Start the conversation with [Chat as user](/docs/user-guides/chatbot/playground#chat-as-user) and a **User ID** that matches a contact with a valid `stripe_account`. **Action Preview** and **Compare** can't identify a customer, so the actions don't run there.

## Troubleshooting

<AccordionGroup>
  <Accordion title="The AI agent never uses a Stripe action">
    **Possible causes:**

    * The action is disabled in the dashboard, or turned off for the channel
    * The customer is not properly authenticated
    * The contact record is missing or has an invalid `stripe_account`
    * The **When to use** description is too vague to match what the customer asked

    **Solutions:**

    * Enable the action and check its **Channels** step
    * Check your identity verification implementation
    * Validate that the contact record has the correct `stripe_account` field
    * Rewrite **When to use** with the phrases customers actually type
  </Accordion>

  <Accordion title="No data is returned">
    **Possible causes:**

    * Invalid Stripe customer ID in the contact record
    * The Stripe account has no subscription or invoice data
    * Stripe API permissions are insufficient
    * Network connectivity issues

    **Solutions:**

    * Verify the Stripe customer ID exists and is active
    * Check that the Stripe account has relevant data
    * Review the Stripe integration permissions
    * Test Stripe API connectivity directly
  </Accordion>

  <Accordion title="Authentication errors">
    **Possible causes:**

    * User hash validation is failing
    * `external_id` doesn't match `user_id`
    * The contact record is not found
    * Identity verification was never called

    **Solutions:**

    * Verify hash generation matches the expected format
    * Ensure `external_id` exactly matches the authenticated `user_id`
    * Create a contact record for the customer
    * Implement the identity verification flow properly
  </Accordion>
</AccordionGroup>

## Best Practices

<CardGroup cols={2}>
  <Card title="Security First" icon="shield-check">
    Always validate customer identity before processing any billing-related request. Never allow unauthenticated access to financial data.
  </Card>

  <Card title="Testing Coverage" icon="flask">
    Test all actions with various scenarios, edge cases, and error conditions before going live: in the Playground through **Chat as user**, then from your real site with the embed in place.
  </Card>

  <Card title="Keep High-Stakes Actions on Rails" icon="route">
    Put plan changes and cancellations behind a [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) with eligibility checks, so the AI agent doesn't decide on its own when a customer qualifies.
  </Card>

  <Card title="Clear Action Triggers" icon="bullseye">
    Write specific **When to use** descriptions so the AI agent distinguishes a question about a plan from a request to change it.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.