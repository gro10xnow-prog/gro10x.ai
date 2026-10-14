> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Twilio (Phone)

> Connect your Twilio account and assign phone numbers so your AI agent can answer inbound calls

## Overview

Integrating Twilio with Chatbase lets your AI agent handle inbound phone calls, answering with its configured voice, personality, and data sources. In a few minutes you can connect your Twilio account, import your phone numbers, and assign them to your AI agent.

<Card title="What you can do:" icon="phone-volume">
  Have your AI agent pick up the phone with the same knowledge, same actions, same instructions as your chat AI agent, in a voice you choose.
</Card>

<Info>
  Don't use Twilio? You can also connect an existing number from your own PBX, SIP provider, or GSM gateway using the [SIP trunk method](/docs/user-guides/integrations/sip-trunk).
</Info>

## Before you start

* A Twilio account. If you don't have one, [sign up for Twilio](https://www.twilio.com/try-twilio).
* At least one phone number purchased in your Twilio account.
* Your Twilio **Account SID** and **Auth Token**, available on your [Twilio Console dashboard](https://console.twilio.com/).
* A Chatbase AI agent set up with the voice settings you want callers to hear. Configure voice, language, and greeting under your AI agent's **Settings > Voice** tab.
* The phone channel supported on your plan. Check the [pricing page](https://www.chatbase.co/pricing) for details.

## How to connect Twilio

<Steps>
  <Step title="Connect your Twilio account">
    1. Navigate to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select the AI agent you want to enable phone calls for.
    2. Go to the **Integrations** tab in the left sidebar.
    3. Find the **Twilio** card and click **Connect**.
    4. Enter your **Account SID** and **Auth Token** from the [Twilio Console](https://console.twilio.com/).
       * **Account SID** starts with `AC` followed by 32 characters (for example, `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
       * **Auth Token** is a 32-character string.
    5. Click **Connect Twilio**.

    Chatbase validates your credentials against the Twilio API. Once connected, your Account SID is displayed in a read-only field.

    <Info>
      Your Twilio credentials are encrypted before being stored. Chatbase never displays your Auth Token after the initial connection. Each AI agent has its own Twilio connection, so you can use the same or different Twilio accounts for different AI agents.
    </Info>
  </Step>

  <Step title="Import phone numbers">
    1. On the same Twilio integration page, click **Import from Twilio**.
    2. A dialog shows all available phone numbers from your Twilio account.
    3. Select the numbers you want to import. For each, you can optionally set a **friendly name** to help identify it later, such as "Sales line" or "Support US".
    4. Click **Import selected**.

    Chatbase automatically configures a SIP trunk on your Twilio account and registers each number for call routing. Imported numbers appear in the phone numbers table with their status shown as **Inactive** until you enable them from the Channels page.

    <Info>
      Each phone number can only be imported to one AI agent at a time. Numbers that are already imported appear grayed out in the import dialog.
    </Info>
  </Step>

  <Step title="Enable a phone number">
    1. Navigate to your AI agent's **Channels** page.
    2. Find the **Phone** channel card and click **Setup**, or **Manage** if you've already enabled numbers.
    3. Click **Assign number**.
    4. Select one or more numbers from the list of imported numbers.
    5. Click **Assign selected**.

    The enabled numbers appear as cards showing the phone number, a green **Active** badge, and the friendly name if one was set.
  </Step>
</Steps>

<Check>
  Call one of your enabled numbers and confirm your AI agent answers with the greeting from its voice settings.
</Check>

## How calls work

Once a phone number is enabled for an AI agent:

* **Inbound calls** to that number are automatically routed to the assigned AI agent.
* The AI agent uses its configured **voice settings** (voice provider, model, and language) to speak with the caller.
* The AI agent greets the caller with the **first message** defined in its voice settings.
* The conversation follows the AI agent's instructions, knowledge base, and actions, just like a chat conversation.
* Each call creates a conversation entry in **Activity > Conversations** with the source marked as **Phone**.

## Managing phone numbers

### Disable a number

1. Go to your AI agent's **Channels** page and click **Manage** on the Phone channel card.
2. Click the menu icon on the number card and select **Unassign**.

The number stops receiving calls but remains imported to this AI agent. You can re-enable it at any time from the same page.

### Remove a number from the AI agent

1. Go to your AI agent's **Integrations** tab and click **Manage** on the Twilio card.
2. In the phone numbers table, click the menu icon next to the number and select **Remove**.

The number is removed from this AI agent but remains in your Twilio account. You can import it again at any time.

### Disconnect Twilio

1. Go to your AI agent's **Integrations** tab and click **Manage** on the Twilio card.
2. Click **Disconnect** in the danger zone at the bottom.

<Warning>
  Disconnecting Twilio from an AI agent removes all imported phone numbers and deletes the SIP trunk from your Twilio account. This action cannot be undone. Your phone numbers remain in your Twilio account, but you'll need to reconnect and re-import them to use them again with this AI agent.
</Warning>

## Limitations

* **One AI agent per number.** A phone number can only be imported to one AI agent at a time.
* **The phone channel is plan-gated.** Check the [pricing page](https://www.chatbase.co/pricing) for availability.
* **Disconnecting is destructive.** It removes every imported number and deletes the SIP trunk from your Twilio account.

## Next steps

<CardGroup cols={2}>
  <Card icon="phone-volume" href="/docs/user-guides/integrations/sip-trunk" title="SIP trunk">
    Connect a number you already own from a PBX, SIP provider, or GSM gateway.
  </Card>

  <Card icon="phone" href="/docs/user-guides/chatbot/actions/transfer-to-phone" title="Transfer to phone number">
    Let the AI agent hand a live call to a human.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.