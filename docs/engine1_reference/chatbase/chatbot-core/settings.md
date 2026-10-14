> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Settings

Open an AI agent and click **Settings** in the sidebar. The page has seven tabs: **General**, **Voice**, **Email**, **Helpdesk**, **Custom domains**, **Webhooks**, and **Notifications**.

## General

The **General** tab has three cards: **Agent details** (Agent ID, Size, Name), **Credits limit**, and **Danger zone** (Delete all conversations, Delete AI agent).

<Frame>
  <img src="https://mintcdn.com/chatbase/P4P4lN52AUAJVwNj/user-guides/chatbot/images/settings/agent-details.png?fit=max&auto=format&n=P4P4lN52AUAJVwNj&q=85&s=0ea8178fa2db3d3f1fbfc765bf9a6ca3" alt="Agent Details" width="1097" height="555" data-path="user-guides/chatbot/images/settings/agent-details.png" />
</Frame>

In the **Credits limit** card, enable **Set credits limit on AI agent** to cap how many of the workspace’s credits this AI agent can consume.

<Frame>
  <img src="https://mintcdn.com/chatbase/P4P4lN52AUAJVwNj/user-guides/chatbot/images/settings/credits-limit.png?fit=max&auto=format&n=P4P4lN52AUAJVwNj&q=85&s=e77eacd12e8ce51e7039d5d59b1bc828" alt="Credits limit" width="1075" height="432" data-path="user-guides/chatbot/images/settings/credits-limit.png" />
</Frame>

***DANGER ZONE***

The actions done in the section aren’t reversible. If you deleted the AI agent or the conversations, you can’t retrieve them moving forward.

<Frame>
  <img src="https://mintcdn.com/chatbase/P4P4lN52AUAJVwNj/user-guides/chatbot/images/settings/danger-zone.png?fit=max&auto=format&n=P4P4lN52AUAJVwNj&q=85&s=d728d708e44a678d30beb4b129ce3b22" alt="DANGER ZONE" width="600" data-path="user-guides/chatbot/images/settings/danger-zone.png" />
</Frame>

## Voice

This section allows you to configure how your AI agent sounds and behaves during voice conversations.

### Credit Usage

Voice sessions consume credits based on two components:

* **AI agent voice**: Every voice session consumes **6 message credits per minute**. This is a per-minute cost regardless of the actual messages exchanged.
* **AI model**: Each response from the AI agent during a voice session consumes message credits based on the model used, just like in text conversations. See the [full list of models and their message credit costs](./build#ai-model).

The total credit cost of a voice session is the sum of both components.

<Frame>
  <img src="https://mintcdn.com/chatbase/P4P4lN52AUAJVwNj/user-guides/chatbot/images/settings/voice-credit-usage.png?fit=max&auto=format&n=P4P4lN52AUAJVwNj&q=85&s=bd77feeaafd85f398c75b9400ea72e08" alt="Voice model settings" width="1055" height="363" data-path="user-guides/chatbot/images/settings/voice-credit-usage.png" />
</Frame>

<Accordion title="Pricing Example">
  Suppose your voice AI agent uses **GPT-6 Luna** (1 message credit per request).

  If a user has a **10-minute voice call** with **15 AI requests**:

  | Component | Calculation | Message Credits |
  | - | - | - |
  | AI agent voice | 10 min x 6 credits/min | 60 |
  | AI model (GPT-6 Luna) | 15 requests x 1 credit/request | 15 |
  | **Total** | | **75** |
</Accordion>

### Voice Model

Select the AI model used specifically for voice sessions. This model is separate from the one used for text-based conversations and only applies when users interact with your AI agent through voice.

You can also adjust the **Temperature** to control how creative or reserved the AI agent's responses are during voice conversations.

<Frame>
  <img src="https://mintcdn.com/chatbase/P4P4lN52AUAJVwNj/user-guides/chatbot/images/settings/voice-model-and-temperature.png?fit=max&auto=format&n=P4P4lN52AUAJVwNj&q=85&s=31210835051fdd5ddf5146132084643b" alt="Voice model settings" width="1080" height="502" data-path="user-guides/chatbot/images/settings/voice-model-and-temperature.png" />
</Frame>

### Transcriber

Choose the model used to transcribe user speech during voice conversations.

<Frame>
  <img src="https://mintcdn.com/chatbase/3sPesZY8zXVkuyp6/user-guides/chatbot/images/settings/voice-transcriber.png?fit=max&auto=format&n=3sPesZY8zXVkuyp6&q=85&s=3d985a9ecad66f89b6276ddc5882e020" alt="Voice transcriber settings" width="1720" height="1136" data-path="user-guides/chatbot/images/settings/voice-transcriber.png" />
</Frame>

* **Language**: The language used to transcribe user speech. Select **Multilingual (auto-detect)** to let the transcriber detect the language automatically, or pick a specific language to improve accuracy.
* **Model**: The speech-to-text model that converts user audio into text. Each model supports a different range of languages.
* **Silence Threshold**: Seconds of silence before the AI agent considers the user has finished speaking. Lower values switch turns faster but may cut off pauses mid-thought.
* **Noise Sensitivity**: Controls how loud audio must be to count as speech. Lower values pick up quieter speech but are more sensitive to background noise. Higher values filter out noise but may miss soft-spoken users.

<Info>
  **Multiple transcription languages:** When using the default **Soniox v5** model, you can select up to **8 languages**. Limiting the set of possible languages helps the transcriber focus on the selected languages, improving transcription accuracy.
</Info>

### AI Agent Voice

Choose a voice for your AI agent and fine-tune how it sounds during voice conversations.

<Frame>
  <img src="https://mintcdn.com/chatbase/3sPesZY8zXVkuyp6/user-guides/chatbot/images/settings/voice-agent-voice.png?fit=max&auto=format&n=3sPesZY8zXVkuyp6&q=85&s=4906225649f908afe1cb89db82c7e362" alt="Voice AI agent voice settings" width="1718" height="1156" data-path="user-guides/chatbot/images/settings/voice-agent-voice.png" />
</Frame>

Click on the voice selector to open the voice picker, then fine-tune how the selected voice sounds. The available controls depend on the voice you picked, some voices expose sliders such as speed, stability, and similarity, while others let you describe the desired delivery. A few examples:

* **Speed**: Controls how fast or slow the AI agent speaks. Adjust the slider between slower and faster to match your preferred pace.
* **Stability**: Determines how stable the voice is. Lower values introduce a broader emotional range, while higher values produce a more consistent, monotone delivery with limited emotion.
* **Similarity**: Determines how closely the AI adheres to the original voice when replicating it. Higher values result in a closer match to the selected voice.
* **Voice instructions**: For voices that support it, enter a short prompt describing the tone, style, or dialect you want the AI agent to use when speaking.

Make sure to click **Save** on the voice card to apply your changes.

#### Selecting a voice

The voice picker has two tabs: **All voices** for browsing pre-recorded voices, and **Custom voice** for bringing a custom voice from a supported provider.

<Frame>
  <img src="https://mintcdn.com/chatbase/3sPesZY8zXVkuyp6/user-guides/chatbot/images/settings/voice-select-voice.png?fit=max&auto=format&n=3sPesZY8zXVkuyp6&q=85&s=81a4f846549c9e448efa3636fed24ac2" alt="Voice selection modal" width="1534" height="1598" data-path="user-guides/chatbot/images/settings/voice-select-voice.png" />
</Frame>

Under **All voices**, you can search by name and filter voices by language, accent, age, and gender. Each row shows the voice's supported languages and a **Preview language** dropdown, pick a language and click the play button to hear a sample of the voice speaking it. Select a voice and click **Confirm voice** to apply it to your AI agent.

<Frame>
  <img src="https://mintcdn.com/chatbase/3sPesZY8zXVkuyp6/user-guides/chatbot/images/settings/voice-select-custom-voice.png?fit=max&auto=format&n=3sPesZY8zXVkuyp6&q=85&s=d317fbc2ec67fddb3887f5df55dabe36" alt="Custom voice selection modal" width="1532" height="1600" data-path="user-guides/chatbot/images/settings/voice-select-custom-voice.png" />
</Frame>

Under **Custom voice**, you can add a custom public voice that isn't in the pre-recorded list by referencing it directly from your provider:

* **Provider**: The voice provider that hosts the custom voice (for example, ElevenLabs).
* **Voice ID**: The identifier of the voice in the provider's account. Paste it in and click **Add voice** to make it available for selection, then click **Confirm voice** to apply it to your AI agent.

<Note>
  Custom voices only work with **publicly available shared voices** from your provider. Private voices in your provider account are not supported.
</Note>

#### Using Dialects and Regional Accents

Some voices support custom dialects and accents through Voice Instructions.

Look for voices marked with the ✨ sparkle icon. These voices can adapt their accent, dialect, pacing, and speaking style based on the instructions you provide.

<Frame>
  <img src="https://mintcdn.com/chatbase/MvdL8yfRNwg3Cfdq/user-guides/chatbot/images/settings/voices-sparkle.png?fit=max&auto=format&n=MvdL8yfRNwg3Cfdq&q=85&s=e4470bb0546d6292a491fd63da24e1af" alt="Voices Sparkle" width="2940" height="1378" data-path="user-guides/chatbot/images/settings/voices-sparkle.png" />
</Frame>

After selecting the desired voice, in the Instructions field, describe how you want the voice to sound.

**Recommended Settings**

* Transcriber: Soniox
* Voice LLM: GPT-6 Luna or Gemini 3.8 Flash

#### Pronunciations

<Warning>
  **Pronunciations only work with ElevenLabs voices.** If your agent uses a voice from any other provider, you will not see this option.
</Warning>

Use this to fix words your agent says wrong, like brand names, product names, or acronyms.

<Frame>
  <img src="https://mintcdn.com/chatbase/YpBnIFka5pG6EFjc/user-guides/chatbot/images/settings/voice-pronunciations.png?fit=max&auto=format&n=YpBnIFka5pG6EFjc&q=85&s=d0613fb2c38a8d4ef5d8361b9eb70bc3" alt="Voice pronunciations settings" width="2322" height="1144" data-path="user-guides/chatbot/images/settings/voice-pronunciations.png" />
</Frame>

Each row has two fields:

* **Word or phrase**: The word as it is written, for example `SQL`.
* **Spoken as**: How the agent should say it, spelled the way it sounds, for example `sequel`.

Click **Add pronunciation** to add a row, or the trash icon to remove one. Click **Save** when you are done.

Every time the word comes up in a voice conversation, the agent says it the way you spelled it.

You can add up to 200 words, and each word can only have one pronunciation.

### Messages

Configure the initial greeting and error messages for your voice AI agent.

<Frame>
  <img src="https://mintcdn.com/chatbase/P4P4lN52AUAJVwNj/user-guides/chatbot/images/settings/voice-messages-section.png?fit=max&auto=format&n=P4P4lN52AUAJVwNj&q=85&s=c4462dfedbe7df278224fe83caf4f58f" alt="Voice messages settings" width="1077" height="560" data-path="user-guides/chatbot/images/settings/voice-messages-section.png" />
</Frame>

* **Initial message**: The first message the AI agent speaks when a voice session begins. If left empty, the voice AI agent will wait for the user to speak first.
* **Error message**: The message played if the voice session encounters an error. If left empty, the default error message "The voice session encountered an error. Please try again." will be used.

### Session Configurations

Control how the AI agent handles interruptions, silence, and text input during active voice calls.

<Frame>
  <img src="https://mintcdn.com/chatbase/Y3la_0-l9aJURKJI/user-guides/chatbot/images/settings/voice-session-configs.png?fit=max&auto=format&n=Y3la_0-l9aJURKJI&q=85&s=2f95b152d10272e75ac5809abea38050" alt="Voice session configurations settings" width="1714" height="800" data-path="user-guides/chatbot/images/settings/voice-session-configs.png" />
</Frame>

* **Allow interruptions**: When enabled, users can speak over the AI agent to interject mid-response. Disable this if you'd prefer the AI agent to always finish speaking before listening for the user's next turn. Defaults to **enabled**.
* **End conversation after silence**: The number of seconds of inactivity after which the call is automatically ended. Useful for closing out abandoned sessions and avoiding unnecessary credit usage. Defaults to **300 seconds**.
* **Allow text input during voice calls**: When enabled, users can type messages mid-call alongside speaking. Helpful for entering details that are easier to type than to say, such as names, emails, or URLs. Defaults to **disabled**.

### Recordings

Enable recording of voice sessions for quality review and training purposes. You can also toggle **Retain voice recordings forever** to keep recordings indefinitely, or set a custom retention period.

<Frame>
  <img src="https://mintcdn.com/chatbase/P4P4lN52AUAJVwNj/user-guides/chatbot/images/settings/voice-recordings-section.png?fit=max&auto=format&n=P4P4lN52AUAJVwNj&q=85&s=9581650f1d156a10a0a21d1e414bc6f3" alt="Voice recordings settings" width="1076" height="412" data-path="user-guides/chatbot/images/settings/voice-recordings-section.png" />
</Frame>

### Limits

Control session volume and duration to manage costs and performance.

<Frame>
  <img src="https://mintcdn.com/chatbase/P4P4lN52AUAJVwNj/user-guides/chatbot/images/settings/voice-limits-section.png?fit=max&auto=format&n=P4P4lN52AUAJVwNj&q=85&s=21cba74d863f24a92ebcd72bfc6b6727" alt="Voice limits settings" width="1075" height="517" data-path="user-guides/chatbot/images/settings/voice-limits-section.png" />
</Frame>

* **Max no. of concurrent voice sessions**: The maximum number of voice sessions that can run at the same time. If left empty, your plan's default limit will apply.
* **Max call duration**: The maximum length of a single voice call in minutes. The default is 15 minutes.
* **Allowed no. of daily calls**: The total number of voice calls allowed each day. If left empty, your plan's default limit will apply.

<Note>
  Your subscription plan enforces account-level limits for daily sessions and concurrent sessions across all your AI agents. You can set agent-specific limits here to further restrict usage for individual AI agents.
</Note>

## Email

The **Email** tab has two cards:

* **Agent email address** - your AI agent's dedicated `agent@….chatbase-mail.com` address for receiving and replying to customer emails, with a copy button next to it.
* **Email configuration** - the addresses on your own domains that send and receive email. Click **New email address** to add one. Existing addresses are listed under their domain, with the domain's authentication status, each address's **Automatic forwarding** status, and edit and delete icons per row.

See [Email settings](/docs/user-guides/chatbot/email-settings) for the full setup walkthrough.

## Helpdesk

The **Helpdesk** tab has its own sub-navigation. Each entry opens the settings for one part of your helpdesk:

* **Email** - the address that receives tickets and sends replies, and who is alerted about delivery failures. See [Email sub-tab](#email-sub-tab) below.
* **Members** - every AI agent with their teams and availability status. See [Assignment algorithm](/docs/user-guides/chatbot/help-desk/assignment-algorithm#agent-availability).
* **Teams & assignment** - create teams and set each team's auto-assignment rules. See [Teams](/docs/user-guides/chatbot/help-desk/teams).
* **Scheduling** - shifts, AI agent schedules, and time off. See [Scheduling](/docs/user-guides/chatbot/help-desk/scheduling).
* **Triggers** - automation rules that run when tickets are created or updated. See [Triggers](/docs/user-guides/chatbot/help-desk/triggers).
* **Ticket statuses** - add your own statuses alongside the built-in ones. See [Helpdesk overview](/docs/user-guides/chatbot/help-desk/help-desk-overview).
* **Tags** - define the labels your team applies to tickets. See [Tags](/docs/user-guides/chatbot/help-desk/tags).
* **Translation** - detect and translate customer messages automatically. See [Translation](/docs/user-guides/chatbot/help-desk/translation).
* **AI draft replies** - generate suggested responses that AI agents review before sending. See [AI draft replies](/docs/user-guides/chatbot/help-desk/ai-draft-replies).

### Email sub-tab

The **Email** sub-tab opens on the **Configuration** card, which controls which addresses receive and create support tickets:

* **Helpdesk email address** - the address tickets arrive at and replies are sent from. Until you add your own domain, this is the auto-generated Chatbase address (`agent@….chatbase-mail.com`), shown with a copy button next to it. Click **Configure email settings** to add and verify your own domain so replies come from your email instead. Once you have verified addresses, this card lets you pick one or more of them as helpdesk inboxes. See [Email settings](/docs/user-guides/chatbot/help-desk/email-settings).
* **Deliverability alert contact** - the team member who is notified when outgoing helpdesk emails bounce or fail to deliver. Defaults to **None**, in which case nobody is alerted.

Click **Save** to apply your changes. Below the Configuration card are three more cards, each with its own **Save** button:

* **Display name** - the name recipients see in the "From" field: the responding support associate's name, or a custom name. See [Display name](/docs/user-guides/chatbot/help-desk/email-settings#display-name).
* **Signature** - a rich-text signature appended to every email your helpdesk sends. See [Email signature](/docs/user-guides/chatbot/help-desk/email-settings#email-signature).
* **Preview** - a sample email showing how the sender name, address, and footer will look to recipients. See [Preview](/docs/user-guides/chatbot/help-desk/email-settings#preview).

## Custom domains

White label the embed script so it loads from a domain you own instead of a Chatbase URL. See [Custom domains](/docs/developer-guides/custom-domains).

## Webhooks

The **Webhooks** tab POSTs AI agent events and helpdesk trigger notifications to your own endpoints. It has two cards:

### Event webhooks

Fires a POST when a subscribed event occurs. Today the available events are [custom form](/docs/developer-guides/client-side-custom-forms) submissions, so the **Events** list is empty until you create and enable at least one custom form action.

1. Under **Events**, tick the form submissions you want to listen for.
2. Enter the URL that receives them in **Endpoint**.
3. Click **Create webhook**.

Each webhook you create is listed below the form with its endpoint and subscribed events. Use the **⋯** menu on a row to edit or delete it.

When a user submits a subscribed form, Chatbase sends a POST request containing the form data to your endpoint. Use it to integrate with third-party services, store submissions in your own systems, or trigger custom business logic. See [Webhooks integration](/docs/developer-guides/client-side-custom-forms#webhooks-integration) for the payload.

<Note>
  Webhooks for collected leads and collected data are not configured here. Open the action itself and use its **Destinations** section. See [Collect Leads](/docs/user-guides/chatbot/actions/collect-leads#webhooks).
</Note>

### Helpdesk webhooks

Reusable connections that helpdesk [Triggers](/docs/user-guides/chatbot/help-desk/triggers#send-webhook) POST to when their conditions match. Click **Create webhook** on the card and set the endpoint URL, optional custom headers, and a request body template (insert ticket fields with `{{ticket.*}}` placeholders). When you create one, Chatbase shows a signing **secret** once - every delivery carries an `X-Chatbase-Signature` header your endpoint can verify with it.

Existing connections are listed on the card, where you can edit or delete them. To actually send a webhook, pick the connection in a trigger's **Send webhook** action.

<Frame>
  <img src="https://mintcdn.com/chatbase/ySX-DcFanyEg0V4A/user-guides/chatbot/images/settings/webhooks-configure.png?fit=max&auto=format&n=ySX-DcFanyEg0V4A&q=85&s=27f84541890be70f647f331662e01b8c" alt="Webhooks configuration" width="2166" height="748" data-path="user-guides/chatbot/images/settings/webhooks-configure.png" />
</Frame>

## Notifications

From this page, you can configure the notifications you get from the AI agent. You can either opt for getting one email per day that contains all the leads submitted for that day. You can also opt for another email that sends you a daily email with the conversations done on that day. 

You can add multiple email addresses to receive these emails if needed.

<Frame>
  <img src="https://mintcdn.com/chatbase/P4P4lN52AUAJVwNj/user-guides/chatbot/images/settings/notifications-preferences.png?fit=max&auto=format&n=P4P4lN52AUAJVwNj&q=85&s=51ac706410d7c8ed66b2155955cc65fb" alt="Notifications - Receive emails with your daily leads and conversations" width="1086" height="397" data-path="user-guides/chatbot/images/settings/notifications-preferences.png" />
</Frame>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.