> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# How Procedures Run

> How the AI agent decides which procedure to run, why a procedure may be skipped, and how procedure-only actions keep certain tools on rails.

When a message comes in, the AI agent looks at your **active** procedures, decides
whether one applies, and if so, follows its steps. This page explains the rules
that govern that decision so your procedures behave predictably.

## Only one procedure runs per turn

Within a single turn, the AI agent runs **at most one procedure**: the one whose
**trigger** best matches what the customer is asking for *right now*. It never
executes two procedures in the same reply.

This is a per-turn limit, not a lock. The active procedure can change from one
message to the next: if the customer is partway through procedure A and then sends
a message that matches procedure B's trigger, the AI agent can switch to procedure B
on that turn.

<Info>
  A procedure stays in flight across turns while the customer is mid-flow (for
  example, replying "yes" or providing a value the AI agent asked for). It ends when
  the situation is handled, or when the customer clearly switches topics, at which
  point a different procedure can engage on the next turn.
</Info>

## Procedures are dropped when an action isn't available

A procedure can reference actions (with `@action_name`) in its steps. Before a
procedure is even considered for a conversation, the AI agent checks that **every**
action it references is available on the **current channel**.

If even one referenced action is unavailable, the **whole procedure is skipped** for
that conversation. An action counts as unavailable when it is:

* Disabled or removed,
* Disabled on the current channel, or
* Not supported on the current channel/medium (for example, a widget-based action
  on a channel that can't render widgets).

<Warning>
  The check is all-or-nothing and covers steps **inside conditional branches too**,
  even branches that might never run on a given conversation. If a deep branch
  references an action that's off on, say, WhatsApp, the entire procedure is dropped
  on WhatsApp. This is intentional: a half-runnable procedure is worse than none.
</Warning>

**What this means for you:** if a procedure works in one channel but seems to be
ignored in another, check that *all* of its referenced actions are enabled on that
channel.

## Procedure-only actions

By default, the AI agent can call any enabled action on its own whenever the action's
**When to use** matches. Sometimes you want the opposite: an action the AI agent
should **never** reach for by itself, and only ever run as a deliberate step inside
a procedure — for example, a "process refund" action you only want fired after the
refund procedure's checks have passed.

Turn on **Only use in procedures** in the action's settings to enforce that. The
action stays enabled and fully functional, but:

* The AI agent won't select it on its own judgment, so its **When to use** field is
  hidden (it no longer needs one).
* It runs **only** when a procedure step references it with `@action_name`.

This keeps sensitive tools on rails — they can't fire outside the flow you
designed. See [Actions](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures)
for where to find the setting.

## Waiting on the customer

If a step calls an action that needs user input (an account picker, a form, a
confirmation), the AI agent treats it as a **pause**, not a failure. It tells the
customer it's waiting, then stops. It resumes the same step once the customer
responds. It won't retry or jump to another action.

## Troubleshooting

<AccordionGroup>
  <Accordion title="My procedure never triggers">
    Confirm it's **Active**, and that its trigger describes the customer's intent
    clearly and distinctly from other procedures. Overlapping triggers can cause a
    different procedure to win.
  </Accordion>

  <Accordion title="It works on the website but not on WhatsApp/another channel">
    A referenced action is likely unavailable on that channel, which drops the whole
    procedure there. Enable every referenced action on that channel.
  </Accordion>

  <Accordion title="Two things should happen at once">
    Only one procedure runs per turn. Combine the flow into a single procedure (using
    branches) rather than expecting two procedures to run together.
  </Accordion>
</AccordionGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.