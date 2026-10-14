> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# WhatsApp Campaigns

> Send outbound WhatsApp campaigns to your contacts using pre-approved Meta message templates. Step-by-step guide for creating, sending, and tracking WhatsApp campaigns.

WhatsApp campaigns let you send bulk messages to your contacts using pre-approved message templates from Meta. This is the primary way to proactively reach out to customers on WhatsApp outside the 24-hour conversation window.

<Info>
  WhatsApp requires all outbound messages to use **pre-approved templates**. You cannot send free-form text as a campaign — templates must be created in Meta and approved before use. See the [WhatsApp Templates guide](/docs/user-guides/integrations/whatsapp-templates) for how to create and manage templates.
</Info>

## Prerequisites

* A connected WhatsApp integration ([setup guide](/docs/user-guides/integrations/whatsapp))
* At least one approved message template in Meta ([WhatsApp Templates guide](/docs/user-guides/integrations/whatsapp-templates))
* Contacts with phone numbers in your contact list ([Contacts guide](/docs/user-guides/chatbot/contacts/contacts-overview))
* A payment method configured in your [Meta billing settings](https://business.facebook.com/billing_hub)

<Warning>
  Meta charges fees for each template message sent. Fees vary by country and template category. See [Meta's WhatsApp pricing](https://developers.facebook.com/docs/whatsapp/pricing) for current rates.
</Warning>

## Creating a WhatsApp Campaign

1\. Click **Outbound** in the sidebar and click **+ New campaign**.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/outbound-campaigns/campaigns-list.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=c7b3983df5281acd5252054ae9dabb42" alt="Campaigns list page with New campaign button" width="1950" height="1488" data-path="user-guides/chatbot/images/outbound-campaigns/campaigns-list.png" />
</Frame>

The new campaign page has two tabs: **Configuration** and **Audience**.

### Configuration

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/outbound-campaigns/new-campaign-config.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=310c38b56745d88016b022b3176b40cc" alt="New campaign configuration page showing Delivery, Replies, and Content sections with a message preview" width="1950" height="1488" data-path="user-guides/chatbot/images/outbound-campaigns/new-campaign-config.png" />
</Frame>

**Delivery** — Select **WhatsApp** as your channel and choose the phone number to send from. The selected number displays its verified business name.

**Replies** — Choose how your team handles replies from campaign recipients:

* **AI replies** (default) — Your AI agent responds to replies automatically. The conversation continues like any normal inbound chat.
* **Human takeover** — When a recipient replies, a helpdesk ticket is created automatically. Your team picks up the conversation from there.

**Content** — Enter a campaign name, then click **Select from template** to browse your approved templates from Meta. A preview of the message appears on the right as you configure it.

All template categories are supported: **Marketing**, **Utility**, and **Authentication**. Templates with headers (image, video, or document) display a media preview.

<Frame>
  <img src="https://mintcdn.com/chatbase/rt2QeVIgaPfKUcEa/user-guides/chatbot/images/outbound-campaigns/config-complete.png?fit=max&auto=format&n=rt2QeVIgaPfKUcEa&q=85&s=47efb3878889be4d32dd1ff2abc5ef2d" alt="Completed campaign configuration with template selected and message preview" width="1358" height="1195" data-path="user-guides/chatbot/images/outbound-campaigns/config-complete.png" />
</Frame>

If your template includes variables (e.g., `{{name}}`), map each one to a data source:

* **Contact field** — Pulls from the recipient's contact data (name, email, phone number, or custom attributes). Each recipient gets a personalized value.
* **Static value** — Enter fixed text that will be the same for all recipients.

Click on a variable in the template body to open the mapping dropdown.

<Frame>
  <img src="https://mintcdn.com/chatbase/rt2QeVIgaPfKUcEa/user-guides/chatbot/images/outbound-campaigns/variable-mapping-dropdown.png?fit=max&auto=format&n=rt2QeVIgaPfKUcEa&q=85&s=1ad34525c525917e2edcb8676f5659dd" alt="Variable mapping dropdown showing contact fields (Name, Email, Phone), custom attributes (Tag, City), and free text option" width="1368" height="1216" data-path="user-guides/chatbot/images/outbound-campaigns/variable-mapping-dropdown.png" />
</Frame>

### Audience

Switch to the **Audience** tab to choose recipients.

<Frame>
  <img src="https://mintcdn.com/chatbase/rt2QeVIgaPfKUcEa/user-guides/chatbot/images/outbound-campaigns/audience-contacts.png?fit=max&auto=format&n=rt2QeVIgaPfKUcEa&q=85&s=667b1f4fd099739a4782cde795f8bc45" alt="Audience tab showing the contact list with name, tag, and city columns" width="1369" height="1154" data-path="user-guides/chatbot/images/outbound-campaigns/audience-contacts.png" />
</Frame>

Browse your contact list and select who should receive the campaign. You can:

* **Search** contacts by name or phone number
* **Filter** by custom attributes — click a column header like **Tag** or **City** to filter by specific values

<Frame>
  <img src="https://mintcdn.com/chatbase/rt2QeVIgaPfKUcEa/user-guides/chatbot/images/outbound-campaigns/audience-filter-dropdown.png?fit=max&auto=format&n=rt2QeVIgaPfKUcEa&q=85&s=ce66695128dd04d19d85c9f56ceca818" alt="Tag filter dropdown showing Customer and VIP Customer options" width="1377" height="1169" data-path="user-guides/chatbot/images/outbound-campaigns/audience-filter-dropdown.png" />
</Frame>

<Frame>
  <img src="https://mintcdn.com/chatbase/rt2QeVIgaPfKUcEa/user-guides/chatbot/images/outbound-campaigns/audience-filtered.png?fit=max&auto=format&n=rt2QeVIgaPfKUcEa&q=85&s=57cd4d19af7076276f1f49e7e4afc07b" alt="Contact list filtered by Customer tag showing matching contacts" width="1366" height="1102" data-path="user-guides/chatbot/images/outbound-campaigns/audience-filtered.png" />
</Frame>

You can combine search and filters to narrow down your audience further.

<Frame>
  <img src="https://mintcdn.com/chatbase/rt2QeVIgaPfKUcEa/user-guides/chatbot/images/outbound-campaigns/audience-search.png?fit=max&auto=format&n=rt2QeVIgaPfKUcEa&q=85&s=b3a14ce87437e7f4b69db3c8c0e10731" alt="Audience filtered by city and searched by name, showing one matching contact" width="1371" height="1099" data-path="user-guides/chatbot/images/outbound-campaigns/audience-search.png" />
</Frame>

The selected contact count appears at the top of the tab. At least one contact is required to send.

<Info>
  Only contacts with a valid phone number can receive WhatsApp campaign messages. If a contact doesn't appear in the list, make sure their phone number is set in their [contact profile](/docs/user-guides/chatbot/contacts/contacts-overview).
</Info>

## Sending Your Campaign

Once you've configured delivery, content, and audience, click **Send now** in the top right. You'll be redirected to the campaign detail page where you can monitor delivery in real time.

## Monitoring Delivery

After sending, the campaigns list shows the status and activity for each campaign at a glance. Hover over the activity bar to see a breakdown of delivery stages.

<Frame>
  <img src="https://mintcdn.com/chatbase/rt2QeVIgaPfKUcEa/user-guides/chatbot/images/outbound-campaigns/campaigns-activity-tooltip.png?fit=max&auto=format&n=rt2QeVIgaPfKUcEa&q=85&s=5093efd33f07fa999545bbc06cc576f2" alt="Campaign activity bar with tooltip showing Sent, Delivered, and Replied counts" width="1362" height="957" data-path="user-guides/chatbot/images/outbound-campaigns/campaigns-activity-tooltip.png" />
</Frame>

Click a campaign to open the detail page with full delivery visibility:

* **Status counters** — Queued, Sending, Sent, Delivered, Read, Replied, and Failed counts at the top.
* **Overview** — Campaign name, channel, reply mode, send time, and recipient count.
* **Content** — The template message that was sent.
* **Delivery funnel** — A visual breakdown showing the percentage of recipients at each stage. Helps you see drop-off between Sent → Delivered → Read → Replied.
* **Recipients table** — A searchable, filterable list of every recipient with their delivery status and timestamps.

<Frame>
  <img src="https://mintcdn.com/chatbase/rt2QeVIgaPfKUcEa/user-guides/chatbot/images/outbound-campaigns/campaign-detail.png?fit=max&auto=format&n=rt2QeVIgaPfKUcEa&q=85&s=d63a277d0908ef1701881765073e8e1a" alt="Campaign detail page showing overview, content, delivery funnel, and recipients table" width="1148" height="1588" data-path="user-guides/chatbot/images/outbound-campaigns/campaign-detail.png" />
</Frame>

<Info>
  **Understanding messaging tiers:** Meta assigns a messaging tier to your WhatsApp Business Account based on quality and volume. Your tier determines how many unique contacts you can message per day. The current usage is shown as **Meta limits** in the top right of the campaigns page.
</Info>

## Reply Handling

When contacts reply to your campaign, the behavior depends on the mode you selected during creation:

**AI Replies** — Your AI agent handles the reply automatically. The conversation continues like a normal inbound chat. This works well for product inquiries, support questions, and automated follow-ups.

**Human Takeover** — The reply creates a helpdesk ticket tagged with the campaign name. Your team picks up the conversation and responds manually from the helpdesk inbox.

<Frame>
  <img src="https://mintcdn.com/chatbase/rt2QeVIgaPfKUcEa/user-guides/chatbot/images/outbound-campaigns/helpdesk-ticket.png?fit=max&auto=format&n=rt2QeVIgaPfKUcEa&q=85&s=92cff7765bfb664f99accef8f6cc4b43" alt="Helpdesk ticket created from a campaign reply, showing the campaign name in the subject and the recipient's message" width="1180" height="1346" data-path="user-guides/chatbot/images/outbound-campaigns/helpdesk-ticket.png" />
</Frame>

## Troubleshooting

* **Campaign stuck in "Sending"?** Large campaigns are processed in batches and may take a few minutes. If there's no progress after 10 minutes, check that your [WhatsApp integration](/docs/user-guides/integrations/whatsapp) is still connected.
* **Recipients showing "Failed"?** Common causes include an invalid phone number, Meta rate limits being reached, or a missing payment method in your [Meta billing settings](https://business.facebook.com/billing_hub).
* **Template not appearing?** Make sure the template has been approved in Meta. Only approved templates appear in the campaign template picker.
* **Replies not creating tickets?** Verify that reply behavior is set to **Human Takeover**.
* **Hitting rate limits?** Your Meta messaging tier determines daily send limits. Check your tier on the campaigns page. To increase your tier, maintain high message quality and gradually increase volume.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.