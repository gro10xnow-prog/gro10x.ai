> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Channels

> Make your AI agent available across web, messaging, phone, and productivity channels, each configured independently

## Overview

The **Channels** tab lets you make your AI agent available to users across multiple channels, including your website, a standalone help page, and third-party platforms like Slack, Email, Meta apps (WhatsApp, Messenger, Instagram), and Phone.

You can enable one or many channels depending on how you want users to interact with your AI agent. Each channel is enabled, configured, and managed independently, so the same AI agent can look and behave differently in each place.

<Card title="What you can do:" icon="signal-stream">
  Put one AI agent everywhere your customers are, and tune its appearance, capabilities, and instructions per channel without touching the others.
</Card>

Use the **Manage** button on each channel card to configure it. Cards for channels you haven't set up yet show **Setup** instead.

## Available channels

| Channel | What it is |
| - | - |
| [Chat bubble](#chat-bubble) | A floating chat bubble embedded on your website |
| [Help page](#help-page) | A standalone help page hosted by Chatbase |
| [Center Stage](#center-stage) | A full-focus chat experience that opens centered over your website |
| [iOS SDK](/docs/ios-sdk/overview) | Build your AI agent into native iOS and macOS apps with the Swift SDK |
| [Android SDK](/docs/android-sdk/overview) | Build your AI agent into native Android apps with the Kotlin SDK |
| [Email](/docs/user-guides/integrations/email) | Let your AI agent respond to emails |
| [Phone](#phone) | Let your AI agent handle inbound phone calls, via Twilio or your own SIP trunk |
| [Slack](/docs/user-guides/integrations/slack) | Use your AI agent inside Slack |
| [Zapier](/docs/user-guides/integrations/zapier) | Connect your AI agent to thousands of apps |
| [WordPress](/docs/user-guides/integrations/wordpress) | Official WordPress plugin |
| [WhatsApp](/docs/user-guides/integrations/whatsapp) | Respond to WhatsApp messages |
| [Messenger](/docs/user-guides/integrations/messenger) | Connect your AI agent to Facebook Messenger |
| [Instagram](/docs/user-guides/integrations/instagram) | Let your AI agent respond to Instagram messages |
| [Zendesk](/docs/user-guides/integrations/zendesk) | Respond to Zendesk support tickets |
| [Salesforce](/docs/user-guides/integrations/salesforce) | Connect your AI agent to Salesforce to assist with CRM workflows |
| [Shopify](/docs/user-guides/integrations/shopify) | Connect your AI agent to your Shopify store |

***

## Chat bubble

The **Chat bubble** embeds a floating chat window on your website so visitors can interact with your AI agent directly.

### Enable the chat bubble

<Steps>
  <Step title="Open the chat bubble channel">
    Go to **Channels** and click **Manage** on the **Chat bubble** card.
  </Step>

  <Step title="Choose the embed type">
    Click **Deploy** and choose **Website widget**.
  </Step>

  <Step title="Enable it">
    Click **Enable chat bubble**.
  </Step>
</Steps>

### The chat bubble menu

Visitors open the menu from the three dots in the top-right corner of the chat header. It holds the following items:

| Menu item | What it does |
| - | - |
| **Start a new chat** | Opens a fresh conversation, leaving the current one in the visitor's recent chats |
| **End chat** | Closes the conversation the visitor is in. An ended conversation can't be picked back up, so continuing means starting a new chat. Greyed out until there's an active conversation to end |
| **View recent chats** | Lists the visitor's earlier conversations on this site. They can reopen one and carry on, as long as it wasn't ended |

#### Why ending a chat matters

A conversation that is never ended stays open indefinitely, and anything measured per conversation is distorted by it. **End chat** draws a boundary around the conversation, which is what the rest depends on:

* **Analytics stay accurate.** Figures derived from a finished conversation, such as how long it ran, how many messages it took, and how it concluded, are only meaningful once the conversation is closed. A store full of conversations that never end pulls those numbers off.
* **Resolution rate becomes measurable.** A conversation has to be closed before it can be counted as resolved or unresolved, so the rate is calculated across ended conversations.
* **Conversation end becomes a trigger.** A closed conversation is a clean point to hand the outcome to your own systems. Webhooks that fire when a conversation ends are coming soon.

<Note>
  These menu items are translated automatically for every language you add under [Localization](#localization).
</Note>

<Tip>
  To let visitors delete their own conversations from the recent chats screen, turn on **Delete conversations** under [Capabilities](#capabilities).
</Tip>

### Chat bubble settings

The chat bubble settings are split into four tabs:

| Tab | What it controls |
| - | - |
| **Overview** | The model, data sources, actions, instructions, and visibility for this channel |
| **Display** | What users see when the chat starts: content, capabilities, colors, typography, floating bubble, and localization |
| **Voice** | Voice calling for this channel |
| **Actions** | The actions your AI agent can perform in this channel |

### Overview tab

The **Overview** tab shows your AI agent's **Model** and **Data sources**, which apply to the whole AI agent, alongside the **Actions**, **Instructions**, and **Visibility** for this channel.

**Model:** The AI model your AI agent uses globally across all channels.

**Data sources:** A read-only summary of what the AI agent is trained on: its training status, total size, and counts of Links, Texts, and Q\&A's.

**Actions:** View the actions enabled for this channel.

**Instructions:** Customize the instructions used by this channel.

**Sync with global instructions:** By default, your AI agent uses **global instructions**, which define its core behavior across all channels. When this is enabled, the chat bubble uses the same global instructions as the rest of your AI agent. When disabled, you can define **channel-specific instructions** that apply only to the chat bubble and override the global ones.

**Visibility:** Control whether this channel is active. When disabled, the channel is hidden and messages from it won't be routed to your AI agent.

### Chat bubble display

Under the **Display** tab, you can control what users see when the chat starts.

<Frame>
  <img src="https://mintcdn.com/chatbase/oo5K4dYtkd14fuCw/user-guides/chatbot/images/deploy/deploy-2.png?fit=max&auto=format&n=oo5K4dYtkd14fuCw&q=85&s=464b625a82c2194285fd10af9224e7bb" alt="The Display tab content settings for the chat bubble" width="700" data-path="user-guides/chatbot/images/deploy/deploy-2.png" />
</Frame>

#### Content

* **Agent picture:** Picture of the AI agent when providing answers.
* **Border around profile picture:** Show a border around the agent picture.
* **Display name:** The name shown at the top of the chat bubble.
* **Initial message:** The message shown before the user opens the chat bubble, designed to grab attention and encourage interaction, also shown once the user opens the bubble. Enter each message on a new line to send several. You can customize the initial message per user by following [this guide](/docs/developer-guides/custom-initial-messages).
* **Use different message for mobile:** Toggle this on to show a different initial message when users open your website on a mobile device, usually a shorter one.
* **Auto show initial messages pop-ups after set duration:** Set a timer to control when the initial messages pop up.
* **Show auto pop-up on mobile:** Toggle this off to disable the pop-up when users open your website on a mobile device.
* **Use different duration for mobile:** Toggle this on to set a different timer for the pop-up on mobile.
* **Message placeholder:** The text shown in the field where users write their questions.
* **Dismissable notice:** A message shown above the text input area that disappears after the user sends a message. Supports rich text, up to 200 characters.
* **Footer:** A message shown below the text input area, for a disclaimer or a link to your privacy policy. Supports rich text, up to 200 characters.
* **Suggested messages:** Predefined prompts shown when users open the chat, to help them start quickly. These should reflect your most common questions or actions. Click **+ Add message** to add one, and use the type dropdown beside it (default **Basic**) to group related prompts under a main message, so users pick a category first and then a more specific follow-up. Enable **Keep showing suggested messages** to keep them visible after the first reply.

<Note>
  Suggested messages set here are fixed wordings. To have the AI agent adapt its suggestions as the conversation develops, use the [Suggested Messages action](/docs/user-guides/chatbot/actions/suggested-messages) instead.
</Note>

<Info>
  If you include links in the footer or a dismissable notice, they must be full URLs starting with `http://` or `https://`, for example `https://www.example.com`, not `www.example.com` or `example.com`.
</Info>

#### Capabilities

* **Agent chat bubble:** Wrap AI agent messages in a rounded bubble. When off, AI agent messages appear as plain text.
* **Attachments:** Enable or disable sending attachments, allowing your AI agent to process them and respond based on their content.
* **Voice to text (Dictation):** When enabled, a dictation button (microphone) appears in the text input area. Users can speak their message, which is converted to text for them to review and edit before sending.
* **Copy message:** When enabled, a copy button on AI agent messages lets users copy the response.
* **Collect user feedback:** When enabled, thumbs up and thumbs down buttons appear on AI agent messages.
* **Delete conversations:** Allow users to delete their own conversations from the [recent chats screen](#the-chat-bubble-menu).

#### Style

* **Theme:** Choose between **Light** or **Dark** mode.
* **Tinted grayscale:** Add a subtle hue to neutral elements such as the chat background, borders, and AI agent message bubbles. Leave this disabled to use the default grayscale colors.
  * **Hue:** Set the base hue of the tint from `0` to `360` on the color wheel. For example, `0` is red, `120` is green, and `220` is blue.
  * **Tint:** Control the intensity of the tint from `0` to `9`. Higher values make the selected hue more noticeable.
  * **Shade:** Adjust the lightness or darkness of tinted surfaces from `-4` to `4`. Negative values make them lighter, positive values darker, and `0` keeps the default shade.
* **Accent color:** Apply a custom color to highlighted elements, such as user message bubbles. When disabled, the default accent color is used.
  * **Color:** Enter the hex value of your accent color, or use the reset button to restore the default.
  * **Use accent color for header:** Apply the accent color to the chat header.
  * **Use accent color for send icon:** Apply the accent color to the send button in the text input area.
* **Radius:** Set the corner radius of the chat widget to control how rounded its edges appear.

<Tip>
  Tinted grayscale and the accent color are independent. The accent color controls the highlighted elements, while tinted grayscale controls the surfaces around them. Set both to hues that work together for a consistent look.
</Tip>

#### Typography

* **Font family:** Choose the font used throughout the chat bubble.
* **Font size:** Set the base font size for text displayed in the bubble.

#### Floating bubble

* **Position:** Align the bubble to the **Left** or **Right**.
* **Chat bubble icon style:** Select from the built-in icon styles, or upload your own custom icon to match your brand.
* **Chat bubble button color:** Set the color of the floating chat button displayed on your website.
* **Show text in the chat bubble:** Display a short label next to the chat bubble icon, to make it more noticeable and encourage visitors to start a conversation. Your website can change this label per page or per visitor by following [this guide](/docs/developer-guides/chat-bubble-control).

#### Localization

The chat bubble supports localization, so you can translate action buttons and interface text into multiple languages.

**Language source**: choose how the chat bubble detects which language to display:

* **Visitor's browser:** Uses the language configured in the visitor's browser. This is the default.
* **Website language:** Uses the language specified in the page's `html lang` attribute. Recommended for multilingual websites with their own language switcher, so the chat bubble matches the language of the page the visitor is viewing.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/deploy/localization-1.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=8f6b6ef0ea55a7bc190fcf37c4269248" alt="Choosing the language source for the chat bubble" width="700" data-path="user-guides/chatbot/images/deploy/localization-1.png" />
</Frame>

You can add multiple languages by clicking **Add language** and selecting from the available list, including right-to-left (RTL) languages. One language must be set as the **default**.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/deploy/localization-2.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=4e2d101c7915d76770e6c4b6863b0ef7" alt="Adding languages to the chat bubble localization settings" width="700" data-path="user-guides/chatbot/images/deploy/localization-2.png" />
</Frame>

Once a language is enabled, action buttons and the [chat bubble menu](#the-chat-bubble-menu) items are automatically translated: starting a new conversation, ending a conversation, and viewing previous conversations.

<Frame>
  <img src="https://mintcdn.com/chatbase/2vdqUsUk7GpRQQ0p/user-guides/chatbot/images/deploy/localization-4.png?fit=max&auto=format&n=2vdqUsUk7GpRQQ0p&q=85&s=7fd2eb1b2c40c13c5ac8988bab1f95ee" alt="Translated action buttons in the chat bubble" width="700" data-path="user-guides/chatbot/images/deploy/localization-4.png" />
</Frame>

<Info>
  The chat bubble only displays languages you've added under **Localization**. If the detected language hasn't been added, the chat bubble falls back to your default language.
</Info>

<Info>
  **Localize dynamic chat bubble content:** You can also use `setOptions` to localize the display name, initial message, message placeholder, footer, dismissable notice, and suggested messages. See [Runtime options](/docs/developer-guides/chat-bubble-control#runtime-options).
</Info>

#### A/B testing

You can run **A/B tests** by choosing the percentage of visitors who will see your AI agent. For example, setting the percentage to **10%** shows it to 10% of your visitors, while the remaining 90% won't see it.

This is especially useful for **gradual rollouts**, letting you introduce your AI agent to a smaller group before making it available to everyone.

A/B testing is available on both the **Chat bubble** and **Center Stage** channels.

<Steps>
  <Step title="Enable A/B testing">
    Go to **Display → A/B testing** and enable **Show to a percentage of visitors**.
  </Step>

  <Step title="Choose the percentage">
    Enter the percentage of visitors you want to see your AI agent.
  </Step>

  <Step title="Save your changes">
    Click **Save changes** to apply the A/B test.
  </Step>
</Steps>

### Attachments

Chatbase lets your end users upload attachments during conversations. The AI agent can analyze supported files and generate responses based on their content.

**Supported formats**

* Images: `.png`, `.jpg`, `.jpeg`
* Documents: `.pdf`
* On Instagram, Messenger, and WhatsApp, also: `.docx`, `.xlsx`, `.txt`

<Info>
  For Word, Excel, and text files, the AI agent reads the text only; images and charts inside them are not processed. Other file types (for example GIF) are discarded and not processed.
</Info>

**Limits**

To maintain performance and reliability, the following limits apply:

| Limit | Value |
| - | - |
| Maximum attachments per message | 5 files |
| Maximum file size | 5 MB per file |
| Maximum PDF length | 5 pages per file |
| Maximum characters per PDF page | 2,000 tokens (\~8,000 characters) |

Any attachments that exceed these limits are **ignored and not processed**.

**Billing**

When a message contains attachments, the credits consumed include **both the text response and the attachments processed**. Each AI model has separate pricing for text requests, image analysis, and PDF file analysis (per page).

So for every reply the AI agent generates, credits are consumed for the **text response**, plus additional credits for **each attachment**: images charged per image, PDFs charged per page.

Example, with a model cost of 1 credit:

| Message | Credit calculation | Total |
| - | - | - |
| `Hi` | 1 (text) | **1** |
| `Hi + 1 image` | 1 (text) + 1 × 1 (image) | **2** |
| `Hi + 2 images` | 1 (text) + 2 × 1 (image) | **3** |
| `Hi + 1 PDF (3 pages)` | 1 (text) + 3 × 1 (PDF pages) | **4** |
| `Hi + 2 images + 1 PDF (3 pages)` | 1 (text) + 2 × 1 (images) + 3 × 1 (PDF pages) | **6** |

**Actions and attachments**

If the message triggers an [action](/docs/user-guides/chatbot/actions/actions-overview), for example booking a meeting, the attachments are processed more than once: charged once when the action is executed, and again when the AI agent generates a response.

| Message | Credit calculation | Total |
| - | - | - |
| `Hi + 1 image` (action triggered) | 1 (text) + 1 × 1 (image) (processing action) | **2** |
| `Agent response` (after action) | 1 (text) + 1 × 1 (image) (generating reply) | **2** |
| `Total for this message` | 2 + 2 | **4** |

In this case the image is billed twice: once when processing the action, and again when generating the AI agent's response.

**Other channels that support attachments**

Help page, Center Stage, Email, Instagram, Messenger, and WhatsApp.

### Voice

Configure channel-specific voice settings that override your AI agent's default voice configuration. See [Settings → Voice](/docs/user-guides/chatbot/settings#voice).

### Deploy button

The **Deploy** button provides the code needed to add the chat bubble to your website. It opens a dropdown with **Website widget**, **Website iframe**, **Shopify**, and **WordPress**.

**Allowed domains:** Restrict where your AI agent is allowed to load by specifying approved domains. When enabled, the AI agent only works on the domains listed.

| Embed type | Notes |
| - | - |
| **Website widget** (recommended) | A floating chat bubble on your website. Supports all advanced features, fully customizable from the **Display** and **Overview** tabs, and the best option for most use cases. |
| **Website iframe** | The chat interface embedded directly via an iframe. Simple to integrate, but **advanced features are not supported**. Recommended only if iframe embedding is required by your setup. |

Copy the embed script and paste it into your site's HTML, typically before the closing `</body>` tag.

<Check>
  Load your site and confirm the chat bubble appears, opens, and answers a test question with the styling you configured.
</Check>

***

## Help page

The **Help page** is a standalone page hosted by Chatbase. It's ideal for help centers, documentation portals, or internal tools.

### Enable the help page

<Steps>
  <Step title="Open the help page channel">
    Go to **Channels → Help page**.
  </Step>

  <Step title="Enable it">
    Click **Deploy**, then **Enable help page**.
  </Step>
</Steps>

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/deploy/deploy-4.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=5706098f8c823598e7747052f69622bf" alt="The Chatbase-hosted help page" width="2532" height="1492" data-path="user-guides/chatbot/images/deploy/deploy-4.png" />
</Frame>

### Help page display

**General**

* **Page title:** The title shown in the browser tab.
* **Favicon:** Upload a custom favicon for the help page. Supports JPG, PNG, and SVG files up to 1MB.

**Content**

* **Welcome message:** The text shown at the center of the help page, greeting your users.
* **Message placeholder:** The text shown in the field where users write their questions.
* **Suggested messages**

**Assets**

* **Scheme:** Upload different assets for dark and light modes.
* **Logos:** Upload a logo for light mode.
* **Heros:** Upload a hero for light mode.

**Capabilities**

* **Enable voice to text:** When enabled, a microphone button in the text input area converts speech into text for users to review before sending.
* **Enable attachments:** Enable or disable sending attachments, allowing your AI agent to process them and respond based on their content.

**Colors**

* **Theme settings:** Enable or disable theme switching, set a default theme for all users, and customize light and dark primary colors.

**Buttons**

* Add Primary and Secondary buttons to the left sidebar, for links you'd like to refer your users to.
* Add link buttons at the bottom of the help page.

### Deploy button

The **Deploy** button shows the default URL Chatbase generated for your help page, and lets you host it on your own domain.

| Option | What it does |
| - | - |
| **Chatbase domain** | Your help page is served at `www.chatbase.co/{id}/help`, where `{id}` is a unique identifier generated automatically |
| **Your own domain** | Serve it from your own site, for example `yourcompany.com/help`. See the [Help Page Proxy](/docs/developer-guides/help-page-proxy) for the steps |

***

## Center Stage

Center Stage opens your AI agent in a focused chat interface centered over your website. It's ideal for giving visitors more space to interact with your AI agent while keeping them on the page they're viewing.

### Enable Center Stage

<Steps>
  <Step title="Open the Center Stage channel">
    Go to **Channels → Center Stage**.
  </Step>

  <Step title="Enable it">
    Click **Deploy**, then **Enable center stage**.
  </Step>
</Steps>

<Info>
  Center Stage offers the same settings and configuration options as the [Chat bubble](#chat-bubble).
</Info>

***

## Third-party channels

Each of these connects your AI agent to an outside platform. The channel card handles enabling it; the linked guide covers the connection itself.

| Channel | What it does | Setup guide |
| - | - | - |
| **Email** | Respond automatically to incoming email. Use it for customer support or inbound inquiries. | [Email guide](/docs/user-guides/integrations/email) |
| **Slack** | Respond to messages when mentioned or messaged directly. Ideal for internal knowledge bases and team support. | [Slack guide](/docs/user-guides/integrations/slack) |
| **Zapier** | Connect your AI agent with thousands of apps and automate workflows. | [Zapier guide](/docs/user-guides/integrations/zapier) |
| **WordPress** | Add the chat bubble to your WordPress site without writing code. | [WordPress guide](/docs/user-guides/integrations/wordpress) |
| **WhatsApp** | Respond to WhatsApp messages on a connected number. | [WhatsApp guide](/docs/user-guides/integrations/whatsapp) |
| **Messenger** | Respond to Messenger conversations on a connected Facebook Page. | [Messenger guide](/docs/user-guides/integrations/messenger) |
| **Instagram** | Respond to messages from your Instagram account. | [Instagram guide](/docs/user-guides/integrations/instagram) |
| **Zendesk** | Create and respond to Zendesk support tickets. | [Zendesk guide](/docs/user-guides/integrations/zendesk) |
| **Zendesk Messaging** | Respond to customers in your Zendesk Messaging channels, like the Web Widget or WhatsApp. | [Zendesk Messaging guide](/docs/user-guides/integrations/zendesk-messaging) |
| **Salesforce** | Assist with CRM workflows, such as answering questions about records or automating responses inside Salesforce. | [Salesforce guide](/docs/user-guides/integrations/salesforce) |
| **Shopify** | Add the chat bubble to your Shopify store without writing code. | [Shopify guide](/docs/user-guides/integrations/shopify) |

<Tip>
  **Comment monitoring.** On Messenger and Instagram, comments on your posts can be turned into Chatbase Helpdesk tickets and replied to from the Helpdesk. Set it up from the **Comments** tab on the channel. See [Messenger](/docs/user-guides/integrations/messenger#comment-monitoring) or [Instagram](/docs/user-guides/integrations/instagram#comment-monitoring).
</Tip>

### Phone

Let your AI agent handle inbound phone calls. Callers are connected directly to your AI agent, which responds using its configured voice settings and knowledge base. There are two ways to connect a number:

| Method | When to use it | Setup guide |
| - | - | - |
| **Twilio** | Import a number from your connected Twilio account | [Twilio guide](/docs/user-guides/integrations/twilio) |
| **SIP trunk** | Bring an existing number from your own PBX, SIP provider, or GSM gateway | [SIP trunk guide](/docs/user-guides/integrations/sip-trunk) |

***

## Best Practices

<CardGroup cols={2}>
  <Card title="Start With One Channel" icon="signal-stream">
    Launch on a single channel, learn from real conversations, then expand.
  </Card>

  <Card title="Tailor Each Channel" icon="sliders">
    Customize prompts and suggested messages per channel rather than reusing one set everywhere.
  </Card>

  <Card title="Test Before Sharing" icon="flask">
    Test each deployment in the [Playground](/docs/user-guides/chatbot/playground) before pointing users at it.
  </Card>

  <Card title="Match Channel to Purpose" icon="route">
    Use the Help page for structured support and the chat bubble for quick assistance.
  </Card>
</CardGroup>

## Next steps

<CardGroup cols={2}>
  <Card title="Playground" icon="play" href="/docs/user-guides/chatbot/playground">
    Preview and tune each channel before you deploy it.
  </Card>

  <Card title="Integrations" icon="puzzle-piece" href="/docs/user-guides/integrations/integrations-overview">
    Connect the third-party platforms behind these channels.
  </Card>

  <Card title="Actions" icon="bolt" href="/docs/user-guides/chatbot/actions/actions-overview">
    Control what your AI agent can do on each channel.
  </Card>

  <Card title="Build" icon="wrench" href="/docs/user-guides/chatbot/build">
    Edit the instructions and model behind every channel.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.