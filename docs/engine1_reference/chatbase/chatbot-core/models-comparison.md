> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Models Comparison

> Compare the recommended AI models by message credit cost, and pick the one that fits your workload

## Overview

Every model available to your AI agent consumes a different number of **message credits** per message, and offers different strengths in return. This page covers the recommended models at each credit tier, so you can balance capability against cost.

<Card title="What you can do:" icon="scale-balanced">
  See what you get at each credit tier, and choose the cheapest model that still handles your hardest conversations.
</Card>

<Info>
  This page covers the **recommended** models. For the complete list of every available model and its credit cost, see [Build → AI Model](/docs/user-guides/chatbot/build#ai-model).
</Info>

## At a glance

| Model | Credits / message | Provider | Best for |
| - | - | - | - |
| [Auto](#1-credit-per-message) | 1 | Chatbase | Mixed workloads where you'd rather not pick a model at all |
| [GPT-6 Luna](#1-credit-per-message) | 1 | OpenAI | High-volume, low-latency tasks |
| [Claude 5.5 Haiku](#1-credit-per-message) | 1 | Anthropic | Fast, low-cost classification, extraction, and routing |
| [GPT-6.1 Sol](#2-credits-per-message) | 2 | OpenAI | Complex, multi-step conversations |
| [Claude 5.5 Sonnet](#2-credits-per-message) | 2 | Anthropic | Everyday workflows needing a balance of intelligence and speed |
| [Gemini 3.8 Flash](#2-credits-per-message) | 2 | Google | Long-horizon agentic work and solid reasoning at low latency |
| [GPT-5.5](#4-credits-per-message) | 4 | OpenAI | Highly demanding enterprise workflows |
| [Claude 5.5 Opus](#5-credits-per-message) | 5 | Anthropic | Complex multi-step tasks and agentic workflows |

## Recommended models by credit cost

### 1 credit per message

**Auto**: Engineered by Chatbase for peak performance, speed, and efficiency. It adapts to every conversation, giving instant answers for everyday questions and frontier-grade intelligence for demanding ones, with multilingual and image understanding built in. One choice that handles every turn end to end, tools included.

**GPT-6 Luna**: The fastest and most cost-efficient tier of OpenAI's GPT-6 family, optimized for high-volume, low-latency tasks while retaining the core capabilities of the 6 series.

**Claude 5.5 Haiku**: Anthropic's fastest model, with adaptive thinking and a 1M token context window. It is built for high-volume, latency-sensitive work such as classification, extraction, and routing, at a fraction of the cost of larger models.

### 2 credits per message

**GPT-6.1 Sol**: OpenAI's most capable model for complex, multi-step conversations, with support for reasoning, image understanding, and tool use.

**Claude 5.5 Sonnet**: The latest model in Anthropic's Sonnet series, with strong reasoning, reliable instruction following, and tool use. It offers an excellent balance of intelligence and speed for everyday workflows.

**Gemini 3.8 Flash**: Google's most intelligent Flash model, built for long-horizon agentic work, software engineering, and complex enterprise workflows. It pairs a 1M token context window with tunable thinking, strong tool use, and image understanding, making it a strong fit for AI agents that need frontier-level reasoning at low latency.

### 4 credits per message

**GPT-5.5**: One of OpenAI's most capable models, delivering notably stronger reasoning, improved context retention, and better performance across highly demanding tasks. It delivers high accuracy and efficiency for enterprise workflows.

### 5 credits per message

**Claude 5.5 Opus**: The latest and most capable model in Anthropic's Opus series. It excels at demanding coding challenges, agentic workflows, and sophisticated problem-solving while managing context efficiently.

## How to choose

Rather than starting from the most capable model, start from the cheapest tier that handles your hardest conversations. Weigh these dimensions against your own traffic:

| Dimension | What to ask |
| - | - |
| **Technical capability** | Can it answer your most complex questions correctly? |
| **Empathy and communication** | Does its tone suit your customers and your brand? |
| **Speed** | Is the response time acceptable on your busiest channel? |
| **Taking actions** | Does it reliably trigger your [actions](/docs/user-guides/chatbot/actions/actions-overview): escalating, booking, changing a subscription? |
| **Multi-step tasks** | Does it hold context and follow your [procedures](/docs/user-guides/chatbot/procedures/procedures-overview) through to the end? |

<Tip>
  Don't judge these from the descriptions alone. Open **Build > Instructions** and click **Compare** to run the same message against several models side by side. See [Compare area](/docs/user-guides/chatbot/build#compare-area).
</Tip>

<Check>
  Test your hardest real questions against two or three tiers before committing. If the cheaper model handles them, the extra credits buy you nothing.
</Check>

## Next steps

<CardGroup cols={2}>
  <Card title="Build" icon="wrench" href="/docs/user-guides/chatbot/build#ai-model">
    See every available model and its credit cost, and set the one your AI agent uses.
  </Card>

  <Card title="Compare area" icon="scale-balanced" href="/docs/user-guides/chatbot/build#compare-area">
    Run the same message against several models at once.
  </Card>

  <Card title="Best Practices" icon="star" href="/docs/user-guides/quick-start/best-practices">
    Instructions and data sources affect answer quality more than the model does.
  </Card>

  <Card title="Usage" icon="gauge-high" href="/docs/user-guides/workspace/usage">
    Track how many message credits your AI agents are consuming.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.