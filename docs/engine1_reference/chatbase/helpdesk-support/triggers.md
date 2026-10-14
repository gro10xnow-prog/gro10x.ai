> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Triggers

> Automate your help desk with ordered rules that run when tickets are created or updated, setting statuses, routing work, and adding notes for you.

## Introduction

Triggers are automation rules for your help desk. Each trigger watches for tickets that are **created** or **updated**, checks them against the conditions you define, and runs the actions you choose - like setting a status, assigning a team or agent, or adding an internal note - without anyone lifting a finger.

The mental model is simple: **WHEN** a ticket matches your conditions, **THEN** run these actions.

Triggers run **in order, top to bottom**, and **every matching trigger fires**. This lets you stack rules - one to route billing questions, another to prioritize angry customers - and they all apply to the same ticket in the order you set.

You configure triggers from **Help desk settings → Triggers**.

<Frame>
  <img src="https://mintcdn.com/chatbase/XFP5f4YsqhVtBOe3/user-guides/images/help-desk/triggers/triggers-settings.png?fit=max&auto=format&n=XFP5f4YsqhVtBOe3&q=85&s=fc88b0e0975722b2245cce1e9e555e16" alt="Triggers settings page listing existing triggers" width="2934" height="1580" data-path="user-guides/images/help-desk/triggers/triggers-settings.png" />
</Frame>

<Info>
  Triggers require the Help Desk to be enabled for your AI agent. If you haven't set it up yet, see the [Help Desk overview](/docs/user-guides/chatbot/help-desk/help-desk-overview).
</Info>

## How a Trigger Works

Every trigger is made of four parts:

<Columns cols={2}>
  <Card title="Details" icon="pen">
    A **name** and optional **description** so your team knows what the rule does and why.
  </Card>

  <Card title="Conditions (WHEN)" icon="filter">
    The rules that decide whether a ticket matches - based on its status, channel, assignee, team, subject, and more.
  </Card>

  <Card title="Actions (THEN)" icon="bolt">
    What happens when a ticket matches - set a status, assign work, add a note, send an email or a webhook. Actions run in order.
  </Card>

  <Card title="Status" icon="toggle-on">
    Whether the trigger is **Active** or **Paused**. Only active triggers run.
  </Card>
</Columns>

## How Triggers Run (Cycles)

Triggers don't just run once from top to bottom - they run in **cycles**. This lets one trigger's action feed into another trigger's conditions, so your rules can build on each other.

Here's what happens each time a ticket is created or updated:

<Steps>
  <Step title="Scan from the top">
    Chatbase checks every active trigger in order, top to bottom, against the ticket.
  </Step>

  <Step title="Matching triggers fire">
    Each trigger whose conditions match runs its actions.
  </Step>

  <Step title="A change restarts the scan">
    If any trigger changes the ticket (for example, it sets a new status or assigns a team), the scan **starts over from the top**. Triggers that hadn't matched before now get another chance, because they're re-checked against the ticket's updated state.
  </Step>

  <Step title="Repeat until nothing changes">
    The cycle keeps restarting until a full pass makes no further change. At that point the ticket is done and the final result is saved.
  </Step>
</Steps>

<Tip>
  Ordering still matters. Put the trigger that sets the foundational value (like status or team) **above** the triggers that react to it, so the reaction gets picked up when the scan restarts.
</Tip>

## Creating a Trigger

<Steps>
  <Step title="Open Triggers">
    Go to **Help desk settings → Triggers** and click **New trigger**. A panel opens from the right.
  </Step>

  <Step title="Name your trigger">
    Give it a clear **Name** (for example, "Route billing tickets") and an optional **Description** explaining what it does.

    <Frame>
      <img src="https://mintcdn.com/chatbase/XFP5f4YsqhVtBOe3/user-guides/images/help-desk/triggers/create-triggers-naming.png?fit=max&auto=format&n=XFP5f4YsqhVtBOe3&q=85&s=38b731d73e8efcc7a959e6036eda1cbb" alt="New trigger panel with name, conditions, and actions" width="2936" height="1596" data-path="user-guides/images/help-desk/triggers/create-triggers-naming.png" />
    </Frame>
  </Step>

  <Step title="Set the conditions (WHEN)">
    Add the conditions that decide when the trigger should run. See [Conditions](#conditions) below for every available field and operator.
  </Step>

  <Step title="Add the actions (THEN)">
    Add at least one action to perform when a ticket matches. See [Actions](#actions) below for the full list.
  </Step>

  <Step title="Activate and save">
    Use the **Active / Paused** toggle to decide whether the trigger runs, then click **Create trigger**. New triggers are active by default.
  </Step>
</Steps>

## Conditions

Conditions decide which tickets a trigger applies to. They're organized into two groups:

* **Match ALL of** - every condition in this group must match.
* **Match ANY of** - at least one condition in this group must match. This group is optional and is combined with the ALL group using **AND**.

<Tip>
  Use **Match ALL of** for the rules that must always be true (for example, "Status category is New") and **Match ANY of** for a set of alternatives (for example, subject contains "refund" **or** "chargeback").
</Tip>

### When does a trigger run?

Add a **Ticket is Created** or **Ticket is Updated** condition to control when a trigger fires. If you don't add one, the trigger runs on **both** create and update.

### Ticket condition fields

| Field | What it matches | Operators |
| - | - | - |
| **Ticket** | Whether the ticket was just **Created** or **Updated**. Use this to scope when the trigger runs. | `is` |
| **Status category** | The ticket's category: **New**, **On you**, **On customer**, **On hold**, **Closed**, or **Cancelled**. | `is`, `is not`, `is any of`, `is none of`, `changed`, `not changed`, `changed to`, `not changed to`, `changed from`, `not changed from` |
| **Status** | A specific ticket status you've configured (see [Ticket statuses](/docs/user-guides/chatbot/help-desk/help-desk-overview#ticket-statuses)). | `is`, `is not`, `is any of`, `is none of`, `changed`, `not changed`, `changed to`, `not changed to`, `changed from`, `not changed from` |
| **Channel** | The channel the ticket came in on - **Help desk**, **Chat bubble**, **Email**, **WhatsApp**, **API**, **Messenger**, **Instagram**, **Center stage**, or **Phone**. Select several at once. | `is any of`, `is none of` |
| **Assignee** | Who the ticket is assigned to, including **Unassigned**. | `is`, `is not`, `is any of`, `is none of`, `changed`, `not changed`, `changed to`, `not changed to`, `changed from`, `not changed from` |
| **Team** | Which team the ticket belongs to, including **No team**. | `is`, `is not`, `is any of`, `is none of`, `changed`, `not changed`, `changed to`, `not changed to`, `changed from`, `not changed from` |
| **Subject** | Keywords in the ticket subject. Add one or more keywords; matching is case-insensitive. | `contains any of` |
| **Description** | Keywords in the ticket description. Add one or more keywords; matching is case-insensitive. | `contains any of` |

### Contact condition fields

Match on the ticket **requester's** contact record. These look up the person who opened the ticket, so a ticket from an unidentified visitor (no contact record) matches nothing. Contact fields appear under the **Contact** group in the field picker.

| Field | What it matches | Operators |
| - | - | - |
| **Name / Email / Phone number / External ID** | A built-in field on the requester's contact. | `is`, `is not`, `is any of`, `is none of`, `contains any of`, `is set`, `is not set` (Email adds `domain is any of`) |
| **Custom attributes** | Any [custom contact attribute](/docs/user-guides/chatbot/help-desk/teams) you've defined, matched against the requester's value. | `is`, `is not`, `is any of`, `is none of`, `contains any of`, `is set`, `is not set` |

### Routing condition fields

These describe **how the ticket arrived** (its delivery "envelope") and are only meaningful **on ticket creation** - they're how you replace [Team Routing](/docs/user-guides/chatbot/help-desk/team-routing) with triggers. Pair them with a `Ticket is Created` condition and an **Assign team** action.

| Field | What it matches | Operators |
| - | - | - |
| **Recipient address** | The support email address that received the ticket. | `is any of`, `domain is any of`, `contains any of` |
| **Recipient phone** | The business phone / WhatsApp number that received the ticket. | `is any of` |

### About operators

| Operator | What it does |
| - | - |
| `is` / `is not` | Compares the ticket's **current** value. For example, "Status category **is** New." |
| `is any of` / `is none of` | Matches when the field is (or is not) one of several selected values. |
| `contains any of` | Matches when the text contains any of the keywords you list (used for **Subject**, **Description**, and text contact fields). |
| `domain is any of` | Matches the part **after the `@`** of an address - used for the contact **Email** field and the **Recipient address** field (for example, route everything from `acme.com`). |
| `changed` / `not changed` | Matches when the field did (or did not) change at all during this update, regardless of the new value. Takes no value. |
| `changed to` / `not changed to` | Matches (or excludes) a specific transition target - for example, "Assignee **changed to** Unassigned." |
| `changed from` / `not changed from` | Matches (or excludes) a specific transition source - for example, "Status **changed from** Open." |
| `is set` / `is not set` | Matches when a contact field has (or doesn't have) any value. Takes no value. |

<Note>
  The `changed*` operators only make sense on **updates** - they compare the value before and after the change. On ticket **creation** there's no previous value, so a `changed` condition won't match.
</Note>

## Actions

Actions are what the trigger does when a ticket matches. Add at least one; they run **in order**, top to bottom.

| Action | What it does |
| - | - |
| **Set status** | Move the ticket to a specific ticket status you've configured. |
| **Set status category** | Move the ticket to a category. This applies the category's **default status**. Tickets already in that category are left unchanged. |
| **Assign team** | Assign the ticket to a team, or to **Default team** (which always follows your current default team, even if you change it later). Optionally check **Auto-assign an agent using the team's strategy** to also route it to an agent based on that team's [assignment method](/docs/user-guides/chatbot/help-desk/assignment-algorithm). |
| **Assign agent** | Assign the ticket to a specific agent, or choose **Unassign** to clear the assignee. |
| **Add internal note** | Add an internal note to the ticket. Notes are visible to your team only, never to the customer. |
| **Send webhook** | Send an HTTP request to an external system. See [Send webhook](#send-webhook). |
| **Send email** | Email the requester, the assignee, a team, a specific agent, or any address, with a subject and body built from ticket fields. See [Send email](#send-email). |
| **Send Slack message** | Post a message to a Slack channel, with a body built from ticket fields. See [Send Slack message](#send-slack-message). |

### Send webhook

The **Send webhook** action posts an HTTP request to an external endpoint - to notify another system, kick off an automation, or sync ticket data.

The action itself is just a **selector**: you pick one of the webhooks you've configured under [**Settings → Webhooks**](/docs/user-guides/chatbot/settings#webhooks). The endpoint URL, headers, request body, and signing secret all live on the webhook connection, so several triggers can reuse the same one.

<Frame>
  <img src="https://mintcdn.com/chatbase/oCLpjHP-qNppTc3V/user-guides/images/help-desk/triggers/send-webhook-action.png?fit=max&auto=format&n=oCLpjHP-qNppTc3V&q=85&s=18d42303fac0bb00559a7acf4517406b" alt="Send webhook action selecting a saved webhook connection" width="2428" height="1588" data-path="user-guides/images/help-desk/triggers/send-webhook-action.png" />
</Frame>

* Configure the endpoint, custom headers, and a request body template (with `{{ticket.*}}` placeholders) once under [**Settings → Webhooks**](/docs/user-guides/chatbot/settings#webhooks), then reference it from as many triggers as you like.
* Each delivery is signed with the connection's secret via an `X-Chatbase-Signature` header so your endpoint can verify it came from Chatbase.
* Webhooks are delivered **after** the ticket change is saved and are retried on transient failures, so your endpoint may receive the same event more than once - dedupe on the delivery id.

Set up a connection on the [**Settings → Webhooks**](/docs/user-guides/chatbot/settings#webhooks) page:

<Frame>
  <img src="https://mintcdn.com/chatbase/oCLpjHP-qNppTc3V/user-guides/images/help-desk/triggers/webhooks-configuration.png?fit=max&auto=format&n=oCLpjHP-qNppTc3V&q=85&s=c15eac044fd38343283cf5e641883966" alt="Webhooks configuration page with endpoint, headers, and request body" width="2052" height="1356" data-path="user-guides/images/help-desk/triggers/webhooks-configuration.png" />
</Frame>

### Send email

The **Send email** action sends an email when a ticket matches - to keep the customer posted on a status change, alert a team about a new high-priority ticket, or notify an outside address that doesn't use the help desk.

Everything is configured right on the action: who receives it, the subject, and the body.

<Frame>
  <img src="https://mintcdn.com/chatbase/mokC64GrzmKRexPw/user-guides/images/help-desk/triggers/send-email-action.png?fit=max&auto=format&n=mokC64GrzmKRexPw&q=85&s=f54d850ed581de104c852abf12620965" alt="Send email action with recipient, subject, and body fields" width="870" height="926" data-path="user-guides/images/help-desk/triggers/send-email-action.png" />
</Frame>

#### Recipient

| Recipient | Who gets the email |
| - | - |
| **Requester** | The customer who opened the ticket, at the email on their contact record. |
| **Assignee** | The agent the ticket is currently assigned to. Skipped if the ticket is unassigned. |
| **Assigned team** | Every member of the team the ticket is currently assigned to. Skipped if the ticket has no team. |
| **Specific agent** | One agent you choose. |
| **Specific team** | Every member of one team you choose. |
| **Custom address** | Any address you type. This field accepts placeholders, so `{{ticket.requester_email}}` works too. |

Team recipients send **one email per member**. A recipient that can't be resolved to a valid address - an unassigned ticket with an **Assignee** recipient, for example - is skipped without failing the rest of the trigger.

#### Subject and body

The **Subject** is a single line and the **Body** is a rich-text editor with formatting, lists, and links. Both accept ticket fields as `{{ }}` placeholders - type `{{` to search and insert one. Placeholders are filled in with the ticket's values at send time, **after** every trigger in the run has finished, so the email reflects the ticket's final state (for example, the status your trigger just set).

| Placeholder | Value |
| - | - |
| `{{ticket.number}}` | Ticket number |
| `{{ticket.url}}` | Link to the ticket in your dashboard |
| `{{ticket.subject}}` | Subject |
| `{{ticket.description}}` | Description |
| `{{ticket.status}}` | Status, agent-facing label |
| `{{ticket.status_external}}` | Status, customer-facing label |
| `{{ticket.status_category}}` | Status category |
| `{{ticket.channel}}` | Channel the ticket came in on |
| `{{ticket.message_text}}` | Latest message, as plain text |
| `{{ticket.requester_name}}` | Requester's name |
| `{{ticket.requester_email}}` | Requester's email |
| `{{ticket.created_at}}` / `{{ticket.updated_at}}` | Timestamps (ISO-8601) |
| `{{ticket.id}}` / `{{ticket.status_id}}` / `{{ticket.assignee_id}}` / `{{ticket.team_id}}` | Raw identifiers, useful when the email is read by another system |

A placeholder with no value (for example, `{{ticket.requester_name}}` for a contact without a name) is replaced with an empty string. Ticket values are inserted as plain text, so formatting in a customer's message can't alter your email's layout.

<Tip>
  Use `{{ticket.status_external}}` in emails to customers and `{{ticket.status}}` in emails to your team - they're the customer-facing and agent-facing labels you set under [Ticket statuses](/docs/user-guides/chatbot/help-desk/help-desk-overview#ticket-statuses).
</Tip>

<Warning>
  Agents replying to a ticket from the dashboard already email the requester through the email channel. A **Send email → Requester** action on **Ticket is Updated** with no other conditions would send the customer a second email on every change. Scope it to what you want them to hear about - for example, add a `Status changed to` condition.
</Warning>

### Send Slack message

The **Send Slack message** action posts to a Slack channel when a ticket matches, so your team hears about it where they already work instead of having to watch the inbox.

Everything is configured on the action: the channel it posts to, and the message itself. It needs the [Slack integration](/docs/user-guides/integrations/slack) connected first.

<Info>
  For a **private** channel, the Chatbase Slack app has to be a member before it can post. Run `/invite @Chatbase` in the channel.
</Info>

#### Message

Write the message in the composer. It accepts the same ticket placeholders as [Send email](#send-email): type `{{` to search and insert one, or use the `{ }` button in the toolbar. There is an emoji picker beside it.

Slack messages also take a **fallback**, written with a `|` inside the placeholder. `{{ticket.requester_name | there}}` prints the requester's name, or `there` when the contact has no name, which keeps a greeting from reading as `Hi ,`.

## Managing Triggers

### Ordering

Triggers run in the order they appear in the list. Drag the handle on the left of any trigger to reorder it. Because **every matching trigger fires**, the order matters when two triggers touch the same field - the later one wins.

<Frame>
  <img src="https://mintcdn.com/chatbase/XFP5f4YsqhVtBOe3/user-guides/images/help-desk/triggers/reorder-triggers.png?fit=max&auto=format&n=XFP5f4YsqhVtBOe3&q=85&s=d8fe6f8ff6bc34d2b677aaec9feb2e7d" alt="Dragging to reorder triggers in the list" width="2553" height="1294" data-path="user-guides/images/help-desk/triggers/reorder-triggers.png" />
</Frame>

### Activate or pause

Use the switch on each trigger row to turn it **Active** or **Paused**. Paused triggers stay in your list but don't run, so you can temporarily disable a rule without deleting it.

### Edit or delete

Open a trigger to edit its name, conditions, or actions at any time. To remove a trigger, use the delete control and confirm - deleted triggers stop running on new and updated tickets, and this can't be undone.

### Needs attention

If a trigger references something that no longer exists - a deleted team, an archived status, or a removed agent - it's flagged with a **Needs attention** badge. Open the trigger and update the affected condition or action to fix it.

## Good to Know

* **Every matching trigger fires.** Triggers aren't exclusive - all rules whose conditions match will run, in order. Use ordering to control which action takes precedence.
* **Triggers run after the ticket is saved.** They apply once a create or update is committed, so they never block or fail the underlying ticket change. Webhook and email actions are sent after the save, too.
* **Only active triggers run.** Pause a trigger to disable it without losing its configuration.
* **Triggers replace Team Routing.** Route tickets to teams with a `Ticket is Created` condition, a **Recipient address** / **Channel** condition, and an **Assign team** action. See the [Team Routing](/docs/user-guides/chatbot/help-desk/team-routing) page for the field-by-field mapping.

### Limits

| Limit | Value |
| - | - |
| Triggers per AI agent | 1000 |
| Conditions per group | 50 |
| Actions per trigger | 50 |
| Values per condition | 50 |
| Characters per value | 1000 |
| Email subject | 300 characters |
| Email body | 50,000 characters |
| Custom email recipient | 320 characters |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.