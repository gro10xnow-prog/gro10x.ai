> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Saved Views

> Save reusable inbox configurations so each agent sees the tickets that matter to them.

A **view** is a saved inbox configuration that controls which tickets show up and how the list looks. Each view bundles together:

* A set of **conditions** built from the [available filters](/docs/user-guides/chatbot/help-desk/filters) (field + operator + value), combined with AND. Up to 20 per view.
* A **sort order** that determines how matching tickets are ordered.
* A list of visible **columns** and their order.
* A **visibility** setting (Personal or Shared) that decides who can see the view.

Five system views are built in for everyone. On top of those, each agent can save up to 10 personal views, and the workspace can hold up to 30 shared views.

***

## System views

Five views are built in. They cannot be edited or deleted.

| View | Shows |
| - | - |
| **My inbox** | Tickets assigned to you that are not Closed or Cancelled |
| **Mentions** | Tickets where you are mentioned |
| **All** | All tickets that are not Closed or Cancelled |
| **Unassigned** | Open tickets with no assignee |
| **Solved** | Closed and Cancelled tickets |

If you need a variant of a system view, build a new view with the same conditions and tweak from there.

***

## Create a view

<Steps>
  <Step title="Open the New view dialog">
    In the help desk sidebar, click **New view**.
  </Step>

  <Step title="Name the view">
    Enter a short, descriptive name (up to 100 characters). Examples: *High priority*, *VIP customers*, *Email backlog*.
  </Step>

  <Step title="Choose visibility">
    Pick **Personal** to keep the view to yourself, or **Shared** to make it available to every agent in the workspace. The visibility selector only appears if you have permission to create both kinds; otherwise the view defaults to whichever kind you can create.
  </Step>

  <Step title="Add filters">
    On the **Filters** tab, click **Add filter** to add a rule. Each condition is a field, an operator, and a value (for example, *Channel is any of WhatsApp*). See [Filters](/docs/user-guides/chatbot/help-desk/filters) for the full list of fields, operators, and values. You can stack up to 20 conditions per view; tickets must match every condition to appear.
  </Step>

  <Step title="Pick a sort order">
    Use the **Sort by** dropdown to choose how matching tickets are ordered. Defaults to *Last activity (newest)*.
  </Step>

  <Step title="Choose columns">
    Switch to the **Columns** tab. Toggle the checkbox next to a column to show or hide it, and drag the handle to reorder. At least one column must stay visible.
  </Step>

  <Step title="Save">
    Click **Create view**. The view appears in the sidebar under **My views** (Personal) or **Shared views** (Shared).
  </Step>
</Steps>

***

## Available columns

A view can show any of these columns, in any order:

* **Status**
* **Ticket ID**
* **Requester**
* **Assignee**
* **Team**
* **Ticket details**
* **Created at**
* **Last updated**

Hide columns you do not need to keep the inbox compact. Column visibility and order are saved with the view, so different agents can see the same inbox differently without affecting each other.

***

## Sort options

The **Sort by** dropdown offers:

* Last activity (newest)
* Last activity (oldest)
* Ticket # (high to low)
* Ticket # (low to high)
* Status (A to Z)
* Status (Z to A)
* Created (newest)
* Created (oldest)
* Priority (high → low)
* Priority (low → high)

***

## Edit, favorite, or delete a view

* **Edit**: hover the view in the sidebar and pick **Edit** from the menu. You can change the name, visibility, conditions, sort order, and columns at any time.
* **Favorite**: click the bookmark icon next to a view to favorite it. Favorited views pin to the top of the sidebar.
* **Delete**: open the same menu and pick **Delete**. Confirm in the dialog.

<Note>
  You can edit or delete personal views you created yourself. Shared views can be edited or deleted by anyone with the *Manage shared views* permission. If you don't see the edit or delete options on a view, you don't have permission to change it.
</Note>

<Warning>
  Deleting a view is permanent. Shared views are removed for everyone, not just you.
</Warning>

### Sidebar layout

Each section (Shared views, My views) shows the first 5 views by default; click **Show more** to expand. Within each section, views are ordered by:

1. Favorited views first
2. Then most recently used
3. Then alphabetical

Use the search box at the top of the sidebar to filter views by name when the list grows long.

***

## Personal vs Shared

<Note>
  **Personal** views appear only in your sidebar under **My views**. **Shared** views appear in every agent's sidebar under **Shared views**. Switch a view's visibility at any time by editing it.
</Note>

Use Personal views for your own triage workflow. Use Shared views to standardize how the team works through the queue (for example, a shared *Unanswered for 24h* view that everyone reviews each morning).

***

## Tips

<CardGroup cols={2}>
  <Card title="Build narrow views for triage" icon="filter">
    Stack conditions to surface the exact slice of work you care about.

    *Example:* `Channel is WhatsApp` + `Assignee is Unassigned` + `Created in the last 1 day`.
  </Card>

  <Card title="Pair conditions with a sort" icon="arrow-down-wide-short">
    Sort matching tickets so the most urgent ones come first.

    *Example:* `Status is any of New, On You` sorted by `Created (oldest)` puts the oldest open tickets at the top.
  </Card>

  <Card title="Keep shared views generic" icon="users">
    Shared views are seen by every agent. Use them for workflows that apply to the whole team.
  </Card>

  <Card title="Use personal views for yourself" icon="user">
    Personal views are perfect for your own triage workflow or experiments that don't belong in everyone's sidebar.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.