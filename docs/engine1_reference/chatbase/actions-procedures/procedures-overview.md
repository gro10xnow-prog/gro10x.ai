> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

> Give your AI agent a multi-step procedure (workflow) end to end to follow whenever a conversation matches a trigger you define.

A **procedure** captures how your AI agent should handle a specific situation as a repeatable, standard operating procedure (SOP). Each one pairs a **trigger** (the situation that engages it) with an ordered list of **steps** the AI agent works through, including the [actions](/docs/user-guides/chatbot/actions/actions-overview) it calls along the way. Reach for procedures on high-stakes flows like refunds, escalations, and onboarding, where you don't want the AI agent improvising.

<Frame>
  <img src="https://mintcdn.com/chatbase/E_y2kiaZWNVgFExv/images/image-2.png?fit=max&auto=format&n=E_y2kiaZWNVgFExv&q=85&s=9ae8ca601eecee5664c65395542f2a1c" alt="Image" title="Image" width="1680" height="1460" data-path="images/image-2.png" />
</Frame>

## Anatomy of a procedure

Every procedure has three parts:

| Field | Purpose |
| - | - |
| **Name** | A human-readable label (e.g. "Refund Request"). Shown on the conversations and used in [analytics](#analytics). |
| **Trigger** | A description of *when* this procedure should engage: the situation or intent that should route the conversation here. Labeled **When to use** in the editor. |
| **Steps** | The ordered list the AI agent follows. Steps can reference actions and branch on conditions. |

<Frame>
  <img src="https://mintcdn.com/chatbase/E_y2kiaZWNVgFExv/images/image-5.png?fit=max&auto=format&n=E_y2kiaZWNVgFExv&q=85&s=0931ac58febc939d5019293fe66e075c" alt="Image" title="Image" width="1428" height="1418" data-path="images/image-5.png" />
</Frame>

## Steps

Steps run **in order**, top to bottom. There are two kinds:

* **Instruction steps**: a plain instruction the AI agent follows ("Ask the customer for their order number").
* **Branch steps**: a decision point with one or more `if` / `else if` conditions and an optional `otherwise`. The AI agent evaluates the conditions top-to-bottom, runs the **first** matching branch, then continues after the branch.

<Info>
  Limits: up to **15** instruction steps per procedure, up to **5** branches per decision point (`if` / `else if` / `else`), and a branch **can't** be nested inside another branch.
</Info>

### Referencing actions with `@`

Inside a step, type `@` to reference an [action](/docs/user-guides/chatbot/actions/actions-overview) the AI agent should run at that point (for example `@lookup_order`). When the AI agent reaches that step, it invokes the tool.

<Frame>
  <img src="https://mintcdn.com/chatbase/NJfShid4JZYXGQTj/user-guides/chatbot/images/procedures/procedure-action-mention.png?fit=max&auto=format&n=NJfShid4JZYXGQTj&q=85&s=a0585aaa13337888024cda5d282a9170" alt="Referencing an action in a step with @" width="1024" height="340" data-path="user-guides/chatbot/images/procedures/procedure-action-mention.png" />
</Frame>

<Warning>
  If a step references an action that isn't available on the current channel, the **entire procedure is skipped** for that conversation. See [How procedures run](/docs/user-guides/chatbot/procedures/how-procedures-run#procedures-are-dropped-when-an-action-isn-t-available).
</Warning>

<Info>
  If a step references an action that doesn't exist or is disabled, the editor flags it and won't let you enable the procedure until you fix or remove the reference.
</Info>

### Using variables with `{{ }}`

You can personalize your steps and branch conditions with `{{token}}` variables that are resolved at runtime. Type `{{` in a step or condition to open the picker, which groups the available variables into:

| Group | Variables | What it resolves to |
| - | - | - |
| **Contact attributes** | `{{contact.name}}`, `{{contact.email}}`, `{{contact.phonenumber}}` | The matched contact's saved details. |
| **Custom attributes** | `{{contact.custom_attributes.*}}` | Any custom contact attributes you've defined for this AI agent. |
| **Session attributes** | `{{user.name}}`, `{{user.email}}` | Identity passed by the embedding site for the current session. |
| **Helpdesk** | `{{agentAvailable}}` | `true` when at least one helpdesk AI agent is available right now (handy in branch conditions). |

<Info>
  A variable resolves only when its value is available for the conversation. For example, `{{user.email}}` is empty unless the embedding site passes it, and `{{contact.*}}` requires a matched contact. Write steps so the AI agent can still proceed (or asks for the value) when a variable is missing.
</Info>

<Frame>
  <img src="https://mintcdn.com/chatbase/IkfpPnVHYRsS79t8/user-guides/chatbot/images/procedures/procedure-variable-mention.png?fit=max&auto=format&n=IkfpPnVHYRsS79t8&q=85&s=bf332c7ea277a29b56a0e0c90e479079" alt="Inserting a variable token in a step" width="484" height="367" data-path="user-guides/chatbot/images/procedures/procedure-variable-mention.png" />
</Frame>

## Start from a template

Don't want to build from scratch? Open the **Templates** tab to browse ready-made procedures for common flows like order returns, subscription cancellations, and billing disputes, all grouped by category. Pick one to create an editable copy, then tailor its trigger and steps to your business.

## Creating a procedure

<Steps>
  <Step title="Open the Procedures tab">
    Go to your AI agent and then click on **Build** from the side bar, then open **Procedures**, then click **Add procedure** (or start from a [template](#start-from-a-template)).
  </Step>

  <Step title="Name it and define the trigger">
    Give it a clear name, then use the **When to use** field to describe the trigger: the situation that should route the conversation to this procedure.
  </Step>

  <Step title="Add steps">
    Add instruction steps, reference actions with `@`, add variables with `{{ }}`, and add conditional branches where the flow forks.
  </Step>

  <Step title="Enable it">
    Save and set the procedure to **Active**. Only active procedures are considered at runtime.
  </Step>
</Steps>

## Analytics

Open a procedure and switch to the **Analytics** tab to see how it's performing over a date range you choose:

| Metric | Meaning |
| - | - |
| **Triggered** | How many times the AI agent engaged this procedure. |
| **Pending** | Runs still in progress — the flow was triggered but hasn't finished yet. |
| **Resolved** | Runs that reached their end. |

A trend chart below the counters breaks the same numbers down by day, so you can spot patterns (for example, a spike in refund requests) at a glance.

<Frame>
  <img src="https://mintcdn.com/chatbase/IkfpPnVHYRsS79t8/user-guides/chatbot/images/procedures/procedure-analytics.png?fit=max&auto=format&n=IkfpPnVHYRsS79t8&q=85&s=bc13baf62876d4b34e7a92ea1f4dbb0f" alt="Procedure analytics tab" width="2120" height="576" data-path="user-guides/chatbot/images/procedures/procedure-analytics.png" />
</Frame>

## Next steps

<Card title="How procedures run" icon="route" href="/docs/user-guides/chatbot/procedures/how-procedures-run">
  Understand triggering, one-procedure-per-turn, and how procedures interact with actions.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.