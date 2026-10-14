> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# HIPAA compliance

> How Chatbase supports HIPAA-eligible workloads on Enterprise plans through a Business Associate Agreement and Zero Data Retention.

## Overview

Chatbase is HIPAA-eligible for Enterprise customers. A workspace becomes HIPAA compliant once two things are in place:

* A signed Business Associate Agreement (BAA) between Chatbase and the Covered Entity or Business Associate .
* Zero Data Retention (ZDR), which Chatbase enables automatically on the workspace after the BAA is in effect.

While the workspace is HIPAA compliant, Chatbase applies the safeguards described below and disables features that are not compatible with HIPAA.

## How HIPAA compliance works in Chatbase

1. The customer (the covered entity or business associate) signs a Business Associate Agreement with Chatbase. BAAs are available on the Enterprise plan only.
2. Chatbase marks the workspace as HIPAA compliant and **automatically enables Zero Data Retention** on it. The customer does not toggle ZDR manually.
3. From that point on, the safeguards in the next section take effect automatically across the workspace and its AI agents.

## Shared responsibility model

HIPAA compliance is a shared responsibility between Chatbase and our customers. The sections below outline what we cover and what remains your responsibility.

### Chatbase's responsibilities

* **Direct liability**: As a business associate, Chatbase is directly accountable for complying with the applicable provisions of the HIPAA Rules. This means we implement the safeguards required to protect electronic Protected Health Information (ePHI) and notify customers of any qualifying breach.
* **BAA compliance**: Chatbase upholds the terms of every BAA we sign, including the appropriate administrative, physical, and technical safeguards needed to protect ePHI across our platform.
* **Vendor management**: Any sub-processors or vendors with potential access to ePHI must themselves comply with HIPAA. Chatbase manages this by signing a BAA with such vendors.
* **Enforcing Zero Data Retention**: Once a workspace is marked HIPAA compliant, Chatbase automatically enables and enforces Zero Data Retention on it. ZDR redacts the **entire content of every message** in conversations and leads across the workspace (not just specific PII or PHI fields), so no message text is retained. Customers do not need to configure ZDR themselves.
* **Internal logs**: All conversation messages and user-identifiable data are redacted from Chatbase's internal logs.
* **Internal audit logging**: Chatbase maintains internal audit logs that record HIPAA-relevant events on HIPAA-compliant accounts, supporting investigation and accountability.

### Your responsibilities

<Warning>
  Chatbase secures the platform; you are responsible for what you put into it, how your team accesses it, and which features you choose to use.
</Warning>

* **Sources and training data**: Do not upload PHI or PII into sources. You are responsible for the content you ingest into your AI agent's knowledge base.
* **Contacts and contact attributes**: You are responsible for the data you store on contact records and their custom attributes.
* **Two-factor authentication (2FA)**: All workspace members must enable 2FA on their accounts. See [Two-factor authentication](/docs/user-guides/workspace/two-factor-auth) for setup steps.

#### Features disabled by default

Chatbase disables the following features by default on HIPAA-compliant workspaces. Even with these defaults in place, **you remain responsible for ensuring that your team does not attempt to use any of them with PHI**:

* Voice-recording retention
* Daily chats email digest
* Daily leads email digest
* Knowledge gaps analysis
* Chatbase Helpdesk (currently disabled)

## Conversation lifecycle

### Conversation auto-end rules

On a HIPAA workspace, an ongoing conversation ends automatically when either of the following is true:

* The conversation has been idle for more than **24 hours**, or
* The conversation is more than **7 days** old.

Once a conversation ends, its **unredacted data is removed from Chatbase's systems entirely**. Only the **redacted version** of the conversation is retained going forward, which is what the chat-logs view and the API endpoints will return.

<Note>
  If you need to keep the unredacted conversation, you can configure a webhook that receives each conversation just before it is deleted. See the [HIPAA conversation webhook](/docs/developer-guides/hipaa-webhooks) developer guide.
</Note>

### Viewing ongoing conversations

While a conversation is still ongoing, before it hits the auto-end thresholds above, users with the appropriate permission can view its unredacted content directly from the **Conversations** view.

Use the **HIPAA** button at the top of Conversations to switch between the redacted and unredacted views of active conversations. The button toggles in both directions, so you can switch back to the redacted view at any time.

* By default, this button is available to any workspace member with the **Owner** role.
* It can be made visible to other members by granting the corresponding permission through a **custom role**.

Once a conversation ends and is deleted from Chatbase, the unredacted view is no longer available. All stored chat-log content is redacted as described in [Chatbase's responsibilities](#chatbases-responsibilities).

### Topic and sentiment analysis

Topic and sentiment analysis remain enabled on HIPAA-compliant workspaces. Once a conversation is auto-deleted, however, you will no longer be able to view **which specific conversation** included which topic. That per-conversation mapping is removed along with the conversation data itself.

The **topic labels and their aggregate counts continue to be retained** in your analytics views, so high-level trends remain visible even after the underlying conversations are deleted.

## HIPAA Compliant AI providers

Only the following providers are available on a HIPAA-compliant workspace.

### Large language models (LLM)

Any model offered by:

* OpenAI
* Anthropic

### Speech-to-text (STT)

* Deepgram
* Cartesia

<Note>
  On HIPAA-compliant accounts:

  * Some voices are restricted and will not be available for selection in the voice picker.
  * Configuring a custom voice is curerntly not available.
</Note>

## HIPAA-Compliant Channels

The following deploy channels can be used on a HIPAA-compliant workspace:

* Chat bubble (web embed)
* Help page
* API
* Phone (voice)
* Android SDK
* iOS SDK
* WordPress
* Shopify
* Zendesk
* Zendesk Messaging
* Salesforce
* Zapier

These channels operate under the same redaction and retention rules as the rest of the workspace.

## HIPAA Compliant Integrations

The following integrations are HIPAA compliant on Chatbase:

* Shopify
* Stripe
* Calendly

### Conditionally HIPAA compliant integrations

The following integrations are HIPAA compliant only if the covered entity has their own BAA in place with the connected provider:

* Zendesk
* Zendesk Messaging
* Salesforce
* Intercom
* Freshdesk
* HubSpot
* Zoho Desk
* Help Scout
* Slack

## HIPAA Compliant Actions

The following actions are HIPAA compliant:

* Collect leads
* Custom button
* Custom action
* Custom form
* Customize suggested messages
* Web search
* Slack notify
* Cal.com: Get available slots
* Calendly: Get available slots
* Stripe actions
* Shopify actions

### Conditionally HIPAA compliant actions

The following actions are HIPAA compliant only if the covered entity has their own BAA in place with the connected provider:

* Escalate action
* Zendesk Messaging live chat action

## API behavior

The `/conversations` endpoints in both API v1 and API v2 return **redacted** conversation data on a HIPAA workspace.

The `/chat` endpoint continues to operate on **unredacted** data while a conversation is still ongoing. This is required so the AI agent can respond in context. Once the conversation ends and is deleted, the unredacted content is no longer accessible through any endpoint, and only the redacted version remains.

## Requesting a BAA

HIPAA support is available on the Enterprise plan. To request a BAA, contact your account representative or get in touch with the Chatbase sales team.

<Card title="Contact Enterprise sales" icon="building" href="https://www.chatbase.co/enterprise">
  Submit the Enterprise contact form to start the BAA process and discuss HIPAA-compliant deployment for your workspace.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.