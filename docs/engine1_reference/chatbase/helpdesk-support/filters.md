> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Filters

> The full set of fields, operators, and values you can use to filter the help desk inbox.

Filters narrow the help desk inbox to a specific slice of tickets. They are used in two places:

* The **Filter** button above the ticket list, for quick ad-hoc filtering of the current view.
* The **Filters** tab when creating or editing a [saved view](/docs/user-guides/chatbot/help-desk/saved-views), where the same filters are persisted alongside a sort order and column layout.

A filter is made of three parts: a **field**, an **operator**, and a **value**. Tickets must match every active condition to appear. You can stack up to 20 conditions at once.

***

## Available fields

| Field | What it filters on |
| - | - |
| **Status category** | The ticket's current lifecycle state |
| **Status** | A specific configured status, including any custom statuses your workspace added |
| **Channel** | Where the ticket originated |
| **Assignee** | The agent the ticket is assigned to |
| **Team** | The team the ticket is assigned to |
| **Priority** | The [priority](/docs/user-guides/chatbot/help-desk/priority) the ticket is ranked at |
| **Tags** | The [tags](/docs/user-guides/chatbot/help-desk/tags) applied to the ticket |
| **Mentions me** | Tickets where you are @mentioned in an internal note |
| **Created** | When the ticket was first created |
| **Last message** | When the most recent message was sent |
| **Last message by** | Who sent the most recent message |
| **Type** | Whether the ticket is a regular ticket or a live chat |
| **Custom fields** | The value of any [custom field](/docs/user-guides/chatbot/help-desk/custom-fields) defined on the AI agent, whichever action collected it |

***

## Operators by field

The available operators depend on the field.

| Field | Operators |
| - | - |
| Status category | `is any of`, `is none of` |
| Status | `is any of`, `is none of` |
| Channel | `is any of`, `is none of` |
| Assignee | `is any of`, `is none of` |
| Team | `is any of`, `is none of` |
| Priority | `is any of`, `is none of` |
| Tags | `is any of`, `is none of` |
| Mentions me | (none) |
| Created | `in the last`, `before`, `after`, `between` |
| Last message | `in the last`, `before`, `after`, `between` |
| Last message by | `is` |
| Type | `is` |
| Custom field | Depends on the field's type, see [Custom fields](#custom-fields) below |

What each operator means:

* **is any of** / **is none of**: pick one or more values; the ticket must match (or not match) any of them.
* **is**: single fixed value (boolean, single-select, text, number, or date).
* **contains**: the text value includes the typed text anywhere, ignoring case.
* **is greater than** / **is less than**: numeric threshold.
* **in the last**: relative window such as *the last 7 days*, *the last 2 weeks*, or *the last 3 months*. Maximum 365 days.
* **before** / **after**: absolute date threshold.
* **between**: a range with a start and end, for dates or numbers. The order of the two bounds doesn't matter.
* **is set** / **is not set**: whether the ticket has a value for the field at all.

***

## Values by field

### Status category

One or more of the six built-in status categories:

* **New**: freshly created, not yet picked up
* **On You**: assigned, awaiting agent action
* **On Customer**: agent replied, awaiting customer response
* **On Hold**: paused on an external dependency
* **Closed**: resolved
* **Cancelled**: spam, duplicate, or opened in error

Any custom status your workspace adds falls under one of these categories. See [ticket statuses](/docs/user-guides/chatbot/help-desk/help-desk-overview#ticket-statuses) for how the categories work.

### Status

One or more of the statuses configured in your workspace, including any custom statuses you've added under **Settings → Helpdesk → Ticket statuses**. Unlike Status category, this matches one specific configured status rather than its lifecycle group.

### Channel

One or more of:

* **Chat bubble**: embedded AI agent on your website
* **Email**: email forwarding
* **WhatsApp**
* **API**: created programmatically
* **Messenger**
* **Instagram**
* **Center stage**: full-focus chat experience centered over your website
* **Phone**: inbound phone call handled by your AI agent

### Assignee

One or more of:

* **Me**: the currently signed-in agent
* **Unassigned**: no agent assigned
* Any specific agent in the workspace

### Team

One or more of:

* **My teams**: teams you belong to
* **No team**: tickets with no team assigned
* Any specific team in the workspace

### Priority

One or more of:

* **No priority**: tickets nobody has triaged yet
* **Low**, **Normal**, **High**, **Urgent**

No priority behaves like any other value, so `is none of Low` returns untriaged tickets as well. See [Priority](/docs/user-guides/chatbot/help-desk/priority).

### Tags

One or more of:

* **Untagged**: tickets with no tags at all
* Any active tag on the AI agent
* Any archived tag, listed under an **Archived** heading and labelled `(archived)`

A ticket matches `is any of` when it carries at least one of the selected tags. To require two tags at once, add a separate condition for each. See [Tags](/docs/user-guides/chatbot/help-desk/tags).

### Mentions me

This filter has no operator or value to configure. It is either present in your filter list or it isn't. When present, the inbox is restricted to tickets where you are @mentioned in an internal note. To turn it off, remove the filter row.

### Created / Last message

Date values, used with one of the date operators above. Relative windows accept a positive integer up to 365 paired with a unit (`days`, `weeks`, or `months`).

### Last message by

One of:

* **Customer**: most recent message came from the customer
* **Agent**: most recent message came from a teammate

### Type

One of:

* **Ticket**: standard support ticket
* **Live chat**: active live chat session

### Custom fields

<Frame>
  <img src="https://mintcdn.com/chatbase/qVqNJVvzKisrfEJI/user-guides/images/help-desk/filters/custom-fields.png?fit=max&auto=format&n=qVqNJVvzKisrfEJI&q=85&s=82b459998551eccab9d705d8a32b7ab7" alt="Saved view filters on five custom fields: a Dropdown, a date, a number range, an image and a text field" width="1276" height="1212" data-path="user-guides/images/help-desk/filters/custom-fields.png" />
</Frame>

Every active [custom field](/docs/user-guides/chatbot/help-desk/custom-fields) on the AI agent can be filtered on. The operators follow the field's type:

| Field type | Operators |
| - | - |
| Dropdown | `is any of`, `is none of`, `is set`, `is not set` |
| Text, Email | `is`, `contains`, `is set`, `is not set` |
| Number | `is`, `is greater than`, `is less than`, `between`, `is set`, `is not set` |
| Date | `is`, `before`, `after`, `between`, `is set`, `is not set` |
| Boolean | `is`, `is set`, `is not set` |
| Image | `is set`, `is not set` |

A Dropdown value is one or more of the field's options. Archived options are listed under an **Archived** heading and labelled `(archived)`, so a view built on an option keeps working after you retire it. A Dropdown with no active options offers only `is set` and `is not set`.

A ticket matches `is set` when it holds any value for the field. A field the customer never answered, or one your team cleared, is not set.

A filter addresses the field, not the action that collected it. Two create-ticket actions that both collect *Order number* are matched by the same condition.

Archiving a field doesn't break the filters that use it. An archived field stays on existing conditions and saved views and keeps matching, but is no longer offered when you add a new condition.

***

## Combining filters

Conditions are combined with **AND**: every condition must match. Stack different fields to slice the inbox precisely. For example:

* *Channel is any of WhatsApp* + *Status category is any of New, On You* + *Created in the last 1 day* → fresh, unresolved WhatsApp tickets from the past day.
* *Assignee is any of Unassigned* + *Last message by is Customer* → tickets waiting for someone to pick them up where the customer spoke last.
* *Order value is greater than 500* + *Status category is any of New* → high-value orders nobody has picked up yet, using a custom field alongside a built-in one.

To save a combination for reuse, build it as a [saved view](/docs/user-guides/chatbot/help-desk/saved-views) instead of re-applying it each time.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.