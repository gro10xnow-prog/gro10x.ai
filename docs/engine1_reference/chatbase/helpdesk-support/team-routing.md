> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Team Routing

> Automatically send incoming tickets to the right team using ordered, first-match rules.

<Warning>
  **Team Routing has been replaced by [Triggers](/docs/user-guides/chatbot/help-desk/triggers)**, which do everything routing did and much more. The rest of this page is kept for reference only.
</Warning>

Team Routing is an ordered list of rules that decide which [team](/docs/user-guides/chatbot/help-desk/teams) a new ticket is assigned to. When a ticket is created, the rules are checked from top to bottom and the ticket is routed to the team of the **first rule that matches**. If no rule matches, the ticket goes to your **default team**.

Once a ticket reaches a team, that team's [assignment strategy](/docs/user-guides/chatbot/help-desk/assignment-algorithm) decides which agent picks it up.

## How routing works

1. A new ticket is created from any channel.
2. The system evaluates your rules in order, from top to bottom.
3. The ticket is routed to the team of the **first** rule whose conditions all pass.
4. If no rule matches, the ticket falls through to the **default team**.

When you have no rules yet, every ticket goes straight to the default team.

<Info>If a rule points to a team that has since been deleted, that rule is skipped and the ticket falls through to the next matching rule or the default team.</Info>

***

## Rule structure

Each rule combines a set of conditions with a target team. A condition is made of a **field**, an **operator**, and one or more **values**.

Conditions are organized into two groups:

* **Match all of these** - every condition in this group must be true (AND logic).
* **Match at least one of these** - at least one condition in this group must be true (OR logic). This group is optional.

When both groups are used, a ticket matches only if it satisfies **all** conditions in the first group **and at least one** condition in the second. The rule editor shows a live plain-English summary as you build the rule, for example: "Route to Billing Support when a ticket matches **all** of the first group **and at least one** of the second."

***

## Fields and operators

| Field | Operator | Value format |
| :- | :- | :- |
| **Subject** | contains any of | Free-text keywords. Matches if any keyword appears anywhere in the subject. |
| **Body** | contains any of | Free-text keywords. Matches if any keyword appears anywhere in the message body. |
| **Sender email** | is any of | Full email addresses, for example `name@company.com`. |
| **Sender email** | domain is any of | Bare domains, for example `company.com` (no `@`). |
| **Inbox email** | is any of | One of your verified inbound email addresses. |
| **Inbox email** | domain is any of | A domain from your verified inbound addresses. |
| **Inbox email** | contains any of | Free-text substring matched against the recipient address. |
| **WhatsApp number** | is any of | The number the message was sent to, matched after phone-number normalization. |
| **Channel** | is any of | One or more of: Email, WhatsApp, Instagram, Messenger, Chat bubble, Center stage, API. |

<Note>All text matching (Subject, Body, Sender email, Inbox email) is **case-insensitive**.</Note>

***

## Managing rules

<Steps>
  <Step title="Open the Team Routing page">
    Navigate to your AI agent's **Settings → Helpdesk → Team routing**.
  </Step>

  <Step title="Add a rule">
    Click **Add rule** to open the rule editor. Build your conditions in the two groups, then choose a target team from the **Route to team** dropdown (the default team is marked).
  </Step>

  <Step title="Save the rule">
    Click **Add rule** in the editor. The rule appears in the list.
  </Step>
</Steps>

**Edit a rule** with the edit action on its row. The editor opens pre-filled with the rule's conditions and team. Click **Save rule** to apply your changes.

**Delete a rule** with the delete action on its row, then confirm. Tickets that the rule used to match will fall through to the next matching rule or the default team.

**Reorder rules** by dragging them up or down. Order is saved immediately and determines priority: because the first match wins, place more specific rules above broader ones.

### The Else row

Below all of your rules, a fixed **Else** row shows the default team. This row always receives tickets that none of your rules matched. It cannot be removed, which guarantees that every ticket is routed somewhere.

***

## Limits

| Limit | Value |
| :- | :- |
| Rules per AI agent | 50 |
| Conditions per group | 10 |
| Values per condition | 10 |
| Characters per value | 1 to 500 |

When you reach the rule limit, the **Add rule** button is disabled until you delete a rule.

<Note>Routing rules use version tracking to protect against conflicting edits. If you and a teammate edit the rules at the same time, the second save is rejected with a version conflict so no changes are silently overwritten. Refresh the page to load the latest rules, then reapply your change.</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.