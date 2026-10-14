> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Stripe

> Connect Stripe so your AI agent can securely show customers their subscriptions, invoices, and billing details

## Overview

Integrating Stripe with Chatbase lets your AI agent access and display key billing information directly to customers. The AI agent can securely retrieve and show subscriptions and invoice history, which streamlines common billing inquiries and gives customers a clear view of their payment status, all within the chat.

<Card title="What you can do:" icon="credit-card">
  Answer "what am I paying?", "when does it renew?", and "was my payment processed?" instantly, from live Stripe data, without a human touching the ticket.
</Card>

## Before you start

* A Chatbase account with an AI agent. If you haven't built one yet, [create a free Chatbase account](https://www.chatbase.co/auth/signup) and follow [Your first AI agent](/docs/user-guides/quick-start/your-first-agent).
* A Stripe account you can authorize, or a restricted API key from it.

## Connection methods

| Method | When to use it |
| - | - |
| [Install the Stripe app](#method-1-install-the-stripe-app) | The recommended option for most stores |
| [Connect with a restricted API key](#method-2-connect-with-a-restricted-api-key) | When you want granular control over the permissions Chatbase gets |

## Method 1: Install the Stripe app

<Steps>
  <Step title="Open the Stripe integration">
    1. Head to your [dashboard](https://www.chatbase.co/dashboard/) and click the AI agent you wish to integrate with Stripe.
    2. Click **Integrations** in the left sidebar.
    3. Click **Connect** under the Stripe card.

    <Frame>
      <img src="https://mintcdn.com/chatbase/bO49Edenw4JMFhBZ/user-guides/integrations/images/stripe/integrations-stripe.png?fit=max&auto=format&n=bO49Edenw4JMFhBZ&q=85&s=f16c6f36d335e358f53ab4dbf8542e95" alt="The Connect button on the Stripe card in Integrations" width="2458" height="950" data-path="user-guides/integrations/images/stripe/integrations-stripe.png" />
    </Frame>
  </Step>

  <Step title="Authorize Chatbase">
    You'll be asked to authorize Chatbase to access your Stripe account.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/stripe/stripe-install-chatbase.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=f2d7da7d567f0d01762a83180f9aef42" alt="Authorizing Chatbase to access Stripe" width="1086" height="788" data-path="user-guides/integrations/images/stripe/stripe-install-chatbase.png" />
    </Frame>

    After clicking **Continue**, choose the account you want to connect.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/stripe/stripe-select-account.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=9a0d447c186f93ee3506dcc92d123626" alt="Choosing which Stripe account to connect" width="1207" height="812" data-path="user-guides/integrations/images/stripe/stripe-select-account.png" />
    </Frame>
  </Step>

  <Step title="Confirm the connection">
    If all goes well, you're redirected back to Chatbase with a message saying **Stripe integration successful**.
  </Step>

  <Step title="Add Stripe accounts to your contacts">
    Add Stripe account IDs to your customers' contact records. See [Contacts](/docs/user-guides/chatbot/contacts/uploading-contacts) for details.
  </Step>
</Steps>

## Method 2: Connect with a restricted API key

Connecting with a restricted API key gives you more control, letting you choose exactly which Stripe permissions Chatbase can access.

<Steps>
  <Step title="Open the Stripe integration">
    Go to **Integrations** and select **Stripe**.
  </Step>

  <Step title="Choose restricted API key">
    Click **Connect**, then select **Use a restricted API key**.
  </Step>

  <Step title="Configure permissions in Stripe">
    Create a restricted API key in Stripe and grant only the permissions you want Chatbase to use.
  </Step>

  <Step title="Connect the key">
    Copy the restricted API key from Stripe and use it to complete the connection in Chatbase.
  </Step>
</Steps>

<Note>
  Connecting through the Stripe app is still the recommended option. Use a restricted API key when you want more granular control over the permissions granted to Chatbase.
</Note>

<Check>
  Test the integration from your live site, signed in as an identified customer, and confirm the AI agent can retrieve that customer's subscription details.
</Check>

## Limitations

* **Stripe actions need an authenticated customer.** Each customer must be identified, and matched to a contact record holding their `stripe_account`.
* **In the Playground, they only run through Chat as user.** Start the conversation with [Chat as user](/docs/user-guides/chatbot/playground#chat-as-user) and a **User ID** that matches a contact with a valid `stripe_account`. **Action Preview** and **Compare** can't identify a customer, so the actions don't run there.

## Next steps

<Card icon="stripe" href="/docs/user-guides/chatbot/actions/stripe-action" title="Stripe Actions">
  Enable the actions that let customers check their subscription, review invoices, change plans, and update billing details from the chat.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.