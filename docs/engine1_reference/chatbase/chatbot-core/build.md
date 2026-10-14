> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Build

> Write your AI agent's instructions, pick its model and temperature, and compare settings side by side before saving

## Overview

**Build** is where you configure everything your AI agent needs to operate. This page covers the **Instructions** section: the instructions themselves, the model, the temperature, and the **Compare** view for testing changes. The other Build sections have their own pages:

| Build section | What it covers |
| - | - |
| **Instructions** | This page |
| [Data sources](/docs/user-guides/chatbot/data-sources) | The content your AI agent is trained on |
| [Actions](/docs/user-guides/chatbot/actions/actions-overview) | What your AI agent can do beyond answering |
| [Procedures](/docs/user-guides/chatbot/procedures/procedures-overview) | Multi-step flows the AI agent follows |
| [Guardrails](/docs/user-guides/chatbot/guardrails) | Rate limits, spam detection, and country blocking |

<Note>
  **Two different things are called guardrails.** The [Guardrails instructions](#guardrails-instructions) field on this page holds behavioral rules you write for the AI agent. The separate [Guardrails](/docs/user-guides/chatbot/guardrails) page covers abuse protection: rate limits, spam detection, and country blocking.
</Note>

## Instructions

Instructions define your AI agent's behavior, role, and response guidelines. Use them to provide context, set expectations, and control how your AI agent responds to users.

Go to **Build > Instructions**. The instructions editor fills the left of the page, and the **Model configuration** panel on the right holds the **Model** dropdown and the **Temperature** slider. Use **Compare** in the header to test changes side by side, and **Save changes** to apply them.

### General instructions

The **General** section contains your AI agent's primary instructions.

Use this section to define:

* Your business or product context
* The AI agent's role and responsibilities
* Response style and tone
* Goals and expected behavior
* Any additional guidance the AI agent should follow

These instructions serve as the foundation for your AI agent's responses.

Want links your AI agent shares to keep a visitor's campaign UTM parameters, like `utm_source`? See [UTM Tracking](/docs/developer-guides/utm-tracking) for the instructions to add.

### Guardrails instructions

Use **Guardrails** to define rules your AI agent should always follow.

Examples include:

* Restricting topics the AI agent can discuss
* Preventing the disclosure of sensitive information
* Defining safety or compliance requirements
* Controlling fallback behavior
* Limiting the AI agent's role or capabilities

Guardrails are intended for non-negotiable rules that should apply to every conversation.

<Tip>
  Start with a simple, clear description of your AI agent's purpose, then gradually add specific instructions based on user feedback and common queries. For a full worked example you can copy, see [Best Practices](/docs/user-guides/quick-start/best-practices#refine-the-ai-agents-instructions).
</Tip>

### AI Model

The AI model is the specific machine learning model used to generate responses for your AI agent. Each model has different capabilities, performance characteristics, and message credit cost, so you can choose the one that best fits your needs.

<AccordionGroup>
  <Accordion title="Auto (Chatbase)" defaultOpen={false}>
    Auto adapts to every conversation, giving instant answers for everyday questions and frontier-grade intelligence for demanding ones. Multilingual and image understanding are built in, and it handles tools end to end.

    * **Auto**: 1 message credit
  </Accordion>

  <Accordion title="GPT" defaultOpen={false}>
    * **GPT-6.1 Sol**: 2 message credits
    * **GPT-6 Luna**: 1 message credit
    * **GPT-5.6 Terra**: 2 message credits
    * **GPT-5.5**: 4 message credits
    * **GPT-5.2**: 2 message credits
    * **GPT-OSS-120B**: 1 message credit
    * **GPT-OSS-20B**: 1 message credit
    * **GPT-4o Mini**: 1 message credit
  </Accordion>

  <Accordion title="Claude" defaultOpen={false}>
    * **Claude 5.5 Opus**: 5 message credits
    * **Claude 5.5 Sonnet**: 2 message credits
    * **Claude 5.5 Haiku**: 1 message credit
  </Accordion>

  <Accordion title="Gemini" defaultOpen={false}>
    * **Gemini 3.8 Flash**: 2 message credits
    * **Gemini 3.6 Flash**: 2 message credits
    * **Gemini 3.5 Flash Lite**: 1 message credit
    * **Gemini 3.1 Pro**: 2 message credits
    * **Gemini 3.1 Flash Lite**: 1 message credit
    * **Gemini 3 Flash**: 1 message credit
    * **Gemini 2.5 Pro**: 2 message credits
  </Accordion>

  <Accordion title="DeepSeek" defaultOpen={false}>
    * **DeepSeek-V4.1-Flash**: 1 message credit
    * **DeepSeek-V4-Flash**: 1 message credit
    * **DeepSeek-V3.1**: 1 message credit
    * **DeepSeek-R1**: 1 message credit
  </Accordion>

  <Accordion title="Grok" defaultOpen={false}>
    * **Grok 4.7**: 2 message credits
  </Accordion>

  <Accordion title="Mistral" defaultOpen={false}>
    * **Mistral Medium 3.5**: 2 message credits
    * **Mistral Small 4**: 1 message credit
  </Accordion>

  <Accordion title="Kimi" defaultOpen={false}>
    * **Kimi K2.6**: 1 message credit
  </Accordion>

  <Accordion title="GLM" defaultOpen={false}>
    * **GLM 5.3 Flash**: 1 message credit
    * **GLM 5.2**: 2 message credits
  </Accordion>
</AccordionGroup>

<Tip>
  For help choosing between them, see the [models comparison](/docs/user-guides/chatbot/models-comparison) page.
</Tip>

### Temperature

Temperature controls how creative and varied your AI agent's responses are. The setting ranges from 0 to 1 and directly affects response predictability:

* **Lower temperature (close to 0)**: Produces focused, consistent responses by selecting the most probable outputs
* **Higher temperature (closer to 1)**: Generates more creative and varied responses with less predictability

Drag the slider between **Reserved** and **Creative** to set the value.

<Note>
  The default temperature is 0. Adjust it to experiment with different response styles and find what works best for your use case.
</Note>

## Compare area

Click **Compare** in the **Build > Instructions** header to open the compare view.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/playground/playground-compare.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=75bdf280c56afe4369248cb68611e157" alt="Instructions Compare view" width="2532" height="1500" data-path="user-guides/chatbot/images/playground/playground-compare.png" />
</Frame>

The Compare area lets you put several versions of your AI agent side by side and give each its own settings, which makes it much easier to work out which settings suit you. The same message is sent to every chat, so you can test the AI agent's response to identical input under different settings.

### Per-agent controls

Each chat box in the compare view has its own controls, from left to right:

| Control | What it does |
| - | - |
| **Sync** | Untick it if you don't want the message sent to this AI agent to be mirrored to the other chats |
| **Settings** | Adjust the AI model, temperature, and prompt for this AI agent only |
| **Save** | Save the settings you've assigned here to the main AI agent's settings |
| **Three dots** | Move the AI agent left or right, reset the chat, or delete the chat box |

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/playground/playground-compare-actions.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=85eab01a5f91d26e5d60bea0cb7ecf69" alt="Instructions Compare view actions" width="2530" height="1496" data-path="user-guides/chatbot/images/playground/playground-compare-actions.png" />
</Frame>

### View controls

You can also:

* Clear all chats
* Reset the AI agent's settings to the main settings
* Add a new AI agent to test with
* Click the filter icon to change which AI models you're testing, and select a new model from the dropdown

<Check>
  Send the same question to two or three models at once and compare the answers before you commit to one in **Model configuration**.
</Check>

## Troubleshooting

<AccordionGroup>
  <Accordion title="This agent is currently unavailable. If you are the owner please check your account">
    **Possible cause:** you've run out of message credits.

    **Solution:** purchase add-on message credits. See [Add-ons](/docs/user-guides/workspace/settings#add-ons) for details.
  </Accordion>
</AccordionGroup>

## Next steps

<CardGroup cols={2}>
  <Card title="Data sources" icon="database" href="/docs/user-guides/chatbot/data-sources">
    Add and manage the content your AI agent is trained on.
  </Card>

  <Card title="Models comparison" icon="scale-balanced" href="/docs/user-guides/chatbot/models-comparison">
    See how the available models differ before you commit to one.
  </Card>

  <Card title="Best Practices" icon="star" href="/docs/user-guides/quick-start/best-practices">
    Proven ways to improve your AI agent's answers.
  </Card>

  <Card title="Playground" icon="play" href="/docs/user-guides/chatbot/playground">
    Preview the effect of your changes the way a visitor will see them.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.