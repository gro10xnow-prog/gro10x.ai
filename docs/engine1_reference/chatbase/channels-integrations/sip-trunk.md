> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# SIP Trunk (Phone)

> Connect a number you already own from a PBX, SIP provider, or GSM gateway so your AI agent can answer its calls

## Overview

The **SIP trunk** phone method lets you connect an existing phone number from your own PBX, SIP provider, or GSM gateway to your Chatbase AI agent. You give the number a name, Chatbase generates a SIP URI, and you point your carrier or telephony provider at that URI. Inbound calls are then answered by your AI agent using its configured voice, personality, and data sources.

<Card title="What you can do:" icon="phone-volume">
  Keep the number your customers already call, and route its inbound calls to your AI agent instead of buying a new one.
</Card>

<Info>
  Use this method when you already own numbers with a carrier or run your own telephony. If you'd rather buy and manage numbers through Twilio, see the [Twilio method](/docs/user-guides/integrations/twilio).
</Info>

## Before you start

* An existing phone number on a PBX, SIP provider, or GSM gateway.
* The ability to configure that trunk's inbound call routing (origination) to point at an external SIP URI. Where this setting lives depends on your carrier or telephony provider.
* A Chatbase AI agent set up with the voice settings you want callers to hear. Configure voice, language, and greeting under your AI agent's **Settings > Voice** tab.
* The phone channel supported on your plan. Check the [pricing page](https://www.chatbase.co/pricing) for details.

## How to connect a SIP trunk

<Steps>
  <Step title="Open the Phone channel">
    1. Navigate to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select the AI agent you want to enable phone calls for.
    2. Click **Channels** in the sidebar and open the **Phone** channel.
    3. Go to the **Connections** tab. This is where you assign phone numbers to the AI agent.
  </Step>

  <Step title="Choose the SIP trunk method">
    1. Under **Assign phone numbers**, click **Assign a new number**.
    2. In the dialog, choose **SIP trunk**: *"Connect an existing number from your PBX, SIP provider or GSM gateway."*
    3. Click **Continue**.

    <Info>
      If you don't have a Twilio account connected, **SIP trunk** is already selected for you. The **Twilio number** option only becomes available once a Twilio account is connected to the AI agent.
    </Info>
  </Step>

  <Step title="Enter the number details">
    In the **Connect SIP trunk** dialog:

    1. Enter a **Name**, a friendly label to help you identify this number later, for example "Main office trunk".
    2. Enter the **Phone number** in E.164 format, including the country code, for example `+15550000000`.
    3. Click **Connect SIP trunk**.
  </Step>

  <Step title="Copy the SIP URI">
    The **SIP trunk created** dialog shows the SIP URI Chatbase generated. Click the **copy** icon to copy it. It looks like this:

    ```
    sip:+15550000000@sip.chatbase.co:5061;transport=tls
    ```

    Then click **Done**.

    <Warning>
      Copy the SIP URI **exactly** as shown, including the port and transport (for example, `;transport=tls`). You can copy it again at any time from the number's menu. See [Managing phone numbers](#managing-phone-numbers).
    </Warning>
  </Step>

  <Step title="Point your carrier at the SIP URI">
    In your carrier, PBX, SIP provider, or GSM gateway configuration, route inbound calls for this number to the SIP URI you copied. This is usually configured as the trunk's **origination**, **outbound routing**, or **SIP destination** for the number.

    The exact steps vary by provider, but in general you will:

    1. Open your provider's trunk or number settings.
    2. Set the inbound call destination (origination URI / SIP endpoint) to the copied Chatbase SIP URI.
    3. Save the configuration and place a test call to the number.
  </Step>
</Steps>

<Check>
  Place a test call to the number. In the **Connections** tab, it should appear as a card showing the phone number, a green **Active** badge, its friendly name, and a **SIP trunk** provider badge.
</Check>

## How calls work

Once a SIP trunk number is connected and enabled for an AI agent:

* **Inbound calls** to that number are routed through your carrier to Chatbase and answered by the assigned AI agent.
* The AI agent uses its configured **voice settings** (voice provider, model, and language) to speak with the caller.
* The AI agent greets the caller with the **first message** defined in its voice settings.
* The conversation follows the AI agent's instructions, knowledge base, and actions, just like a chat conversation.
* Each call creates a conversation entry in **Activity > Conversations** with the source marked as **Phone**.

## Managing phone numbers

### Copy the SIP URI again

1. On the **Connections** tab, find the number's card and click the **menu** icon (**⋯**).
2. Select **Copy SIP URI**.

The SIP URI is copied to your clipboard.

### Enable or disable a number

Use the toggle on the number's card. A disabled number stops receiving calls but stays connected to the AI agent, so you can re-enable it at any time without reconfiguring your carrier.

### Delete a number

1. On the number's card, click the **menu** icon (**⋯**) and select **Delete**.
2. Confirm in the dialog.

<Warning>
  Deleting a number permanently removes it from this AI agent and detaches it from your SIP trunk. This can't be undone. The number itself remains with your carrier, and you can connect it again later using the same SIP URI.
</Warning>

## Limitations

* **Routing happens at your carrier.** Chatbase generates the SIP URI, but calls only reach your AI agent once your provider is configured to send them there.
* **The SIP URI must match exactly,** including port and transport, or calls won't connect.
* **The phone channel is plan-gated.** Check the [pricing page](https://www.chatbase.co/pricing) for availability.

## Next steps

<CardGroup cols={2}>
  <Card icon="phone" href="/docs/user-guides/integrations/twilio" title="Twilio">
    Buy and manage numbers through Twilio instead.
  </Card>

  <Card icon="phone" href="/docs/user-guides/chatbot/actions/transfer-to-phone" title="Transfer to phone number">
    Let the AI agent hand a live call to a human.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.