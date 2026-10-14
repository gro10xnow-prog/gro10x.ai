> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

> Connect Chatbase to the platforms you already use: your website, your messaging channels, and your business tools

## Overview

Integrations connect your AI agent to the systems you already run on. Some put your AI agent in front of customers on a new surface, such as your website, WhatsApp, or a phone line. Others give it somewhere to hand work off to, like a helpdesk, or something to act on, like your Shopify store.

<Note>
  Integrations connect the platform. [Actions](/docs/user-guides/chatbot/actions/actions-overview) decide what your AI agent does with it. Several integrations on this page only become useful once you enable the matching action. The **Next steps** card on each page points you to the right one.
</Note>

## Website platforms

Put your AI agent on your website. Most of these work by copying an embed code from your Chatbase dashboard and pasting it into your site builder.

| Platform | How it connects |
| - | - |
| [Webflow](/docs/user-guides/integrations/webflow) | iFrame embed code, inside a container you build in the Designer |
| [WordPress](/docs/user-guides/integrations/wordpress) | The official Chatbase plugin plus your Agent ID, no embed code |
| [Wix](/docs/user-guides/integrations/wix) | Website widget embed code, via the Custom Code element |
| [Weebly](/docs/user-guides/integrations/weebly) | iFrame embed code, via the Embed Code widget |
| [Framer](/docs/user-guides/integrations/framer) | Website widget embed code, in the page's Custom Code section |
| [Bubble](/docs/user-guides/integrations/bubble) | Website widget embed code, in an HTML component |
| [Vercel](/docs/user-guides/integrations/vercel) | One-click install from the Vercel Marketplace |

<Tip>
  Using Shopify? You don't need any embed code. The [Shopify integration](/docs/user-guides/integrations/shopify) adds the chat bubble to your store automatically.
</Tip>

## Messaging platforms

Let customers reach your AI agent on the channels they already use.

| Platform | What it does |
| - | - |
| [WhatsApp](/docs/user-guides/integrations/whatsapp) | Connect a WhatsApp number so your AI agent handles conversations there |
| [WhatsApp Templates](/docs/user-guides/integrations/whatsapp-templates) | Send Meta-approved templates to reach customers after the 24-hour window closes |
| [Messenger](/docs/user-guides/integrations/messenger) | Connect your Facebook pages, with human takeover per conversation |
| [Instagram](/docs/user-guides/integrations/instagram) | Connect your Instagram professional account for direct messages |
| [Twilio](/docs/user-guides/integrations/twilio) | Connect a Twilio account and assign numbers so your AI agent answers calls |
| [SIP Trunk](/docs/user-guides/integrations/sip-trunk) | Route calls from a number you already own on a PBX, SIP provider, or GSM gateway |
| [Slack](/docs/user-guides/integrations/slack) | Add your AI agent to a Slack workspace so your team can ask it questions |

## Commerce

| Platform | What it does |
| - | - |
| [Shopify](/docs/user-guides/integrations/shopify) | Let your AI agent help customers browse, buy, track orders, and manage their account |
| [Stripe](/docs/user-guides/integrations/stripe) | Let your AI agent show customers their subscriptions, invoices, and billing details |

## Helpdesk and escalation

Give your AI agent somewhere to hand a conversation off to. All of these pair with the [Escalations action](/docs/user-guides/chatbot/actions/escalate-to-human).

| Platform | What it does |
| - | - |
| [Zendesk](/docs/user-guides/integrations/zendesk) | Reply to Zendesk tickets directly, or escalate by opening one |
| [Zendesk Messaging](/docs/user-guides/integrations/zendesk-messaging) | Answer customers in your Zendesk Messaging channels and hand chats to your team in Zendesk |
| [Salesforce](/docs/user-guides/integrations/salesforce) | Respond to Salesforce cases, or escalate by creating one |
| [Freshdesk](/docs/user-guides/integrations/freshdesk) | Escalate by opening a Freshdesk ticket |
| [Gorgias](/docs/user-guides/integrations/gorgias) | Escalate by opening a Gorgias ticket |
| [Zoho Desk](/docs/user-guides/integrations/zohodesk) | Escalate by opening a Zoho Desk ticket |
| [Intercom](/docs/user-guides/integrations/intercom) | Escalate by opening an Intercom ticket |
| [HubSpot](/docs/user-guides/integrations/hubspot) | Escalate by opening a HubSpot ticket |
| [Help Scout](/docs/user-guides/integrations/helpscout) | Escalate by opening a Help Scout ticket |
| [Odoo](/docs/user-guides/integrations/odoo) | Escalate by opening a ticket in Odoo Helpdesk |
| [Sunshine](/docs/user-guides/integrations/sunshine) | Hand the customer to a live Zendesk agent in real time |
| [Freshchat](/docs/user-guides/integrations/freshchat) | Hand the customer to a live Freshchat agent in real time |

<Note>
  Chatbase also has its own built-in [Helpdesk](/docs/user-guides/chatbot/help-desk/help-desk-overview), so you can escalate without connecting a third-party platform at all.
</Note>

## Email and automation

| Platform | What it does |
| - | - |
| [Email](/docs/user-guides/integrations/email) | Let your AI agent read and reply to customer emails through your own domain |
| [Zapier](/docs/user-guides/integrations/zapier) | Send leads and conversation data into thousands of other apps |
| [viaSocket](/docs/user-guides/integrations/viasocket) | Automate tasks across your apps, triggered by Chatbase webhooks |

## Next steps

<CardGroup cols={2}>
  <Card icon="bolt" href="/docs/user-guides/chatbot/actions/actions-overview" title="Actions">
    Connecting a platform is half the job. Actions decide what your AI agent actually does with it.
  </Card>

  <Card icon="webhook" href="/docs/developer-guides/webhooks" title="Webhooks">
    Send Chatbase events to your own endpoints when no integration fits.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.