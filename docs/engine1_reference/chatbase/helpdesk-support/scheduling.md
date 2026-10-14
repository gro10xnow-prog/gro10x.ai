> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Scheduling

> Define shifts and time off so agent availability and ticket auto-assignment run on their own.

The Scheduling feature lets you define recurring **Shifts**, assign agents to them, and add **Time off** entries. When an agent is on a shift, their availability is computed automatically from the shift's working hours and any time off, and that availability decides who is eligible for ticket auto-assignment.

You manage scheduling from the agent’s **Settings → Helpdesk → Scheduling** page. It has three cards: **Shifts**, **Agent schedules**, and **Time off**.

***

## How availability is determined

Each agent is in one of two modes:

* **Scheduled**: the agent has a shift assigned. Their status (`On shift` / `Off shift`) is computed in real time from the shift's working hours plus any time off. They cannot change it manually.
* **Manual**: the agent has no shift. Their status (`Available`, `Away`, `Busy`, `Paused`) is set by an admin, or by the agent themselves if you allow it on the **Members** page (**Settings → Helpdesk → Members**).

Only agents who are currently `Available` (manual) or `On shift` (scheduled, with no active time off) are eligible for new ticket assignment.

***

## Create a shift

A shift is a named, recurring weekly schedule with a timezone.

<Steps>
  <Step title="Open the Shifts card">
    Go to **Settings → Helpdesk → Scheduling** and click **Add shift** in the **Shifts** card.
  </Step>

  <Step title="Name the shift">
    Enter a name like *Weekday Standard* or *EU Mornings*. Names help you tell shifts apart when you assign them.
  </Step>

  <Step title="Choose a timezone">
    Pick the timezone the working hours should be evaluated in. The selector defaults to your browser's timezone.
  </Step>

  <Step title="Set working days and hours">
    Toggle each day you want the shift to be active. For each enabled day, pick a **Start time** and **End time**. Times are in 15-minute increments and default to **09:00 to 17:00**.

    Use the **12h / 24h** toggle in the Shifts card header to switch the time format.

    If the End time is the same as or earlier than the Start time, the shift is treated as overnight and continues into the next day. The dialog shows a **(next day)** label so you can confirm.
  </Step>

  <Step title="Save">
    Click **Save** to create the shift. It now appears in the Shifts card and becomes available in the Agent schedules dropdown.
  </Step>
</Steps>

You can edit or delete shifts at any time. Deleting a shift moves every agent assigned to it back to manual mode.

***

## Assign agents to shifts

The **Agent schedules** card lists every help desk agent with a per-agent shift dropdown.

* Pick a shift name from the dropdown to put the agent on that schedule.
* Pick **No shift (manual)** to remove the schedule and manage their status manually.

The badge at the top of the card shows how many of your agents currently have a shift, in the form **2/5 scheduled**.

<Warning>
  Removing a shift from an agent who has scheduled time off will make those time off entries inert, since time off only applies to scheduled agents. The dashboard will warn you before this happens.
</Warning>

***

## Add time off

Use **Time off** to block dates for scheduled agents (vacation, holidays, sick leave, or anything else that should make them unavailable during their normal shift hours).

<Steps>
  <Step title="Open the Time off card">
    In **Scheduling**, click **Add time off** in the **Time off** card.
  </Step>

  <Step title="Pick agents">
    Select one or more agents from the **Agents** field. Only agents who currently have a shift assigned can be picked, since time off has no effect on manual agents.
  </Step>

  <Step title="Pick a date range">
    Choose a start and end date in the **Dates** picker. You cannot pick dates in the past.
  </Step>

  <Step title="Add a reason (optional)">
    Optionally enter a short reason like *Annual leave* or *Public holiday*.
  </Step>

  <Step title="Save">
    Click **Save**. During the selected dates, every chosen agent is treated as `Off shift` and is not eligible for new ticket assignment, even if their shift covers those days.
  </Step>
</Steps>

Past time off entries are hidden once their end date passes.

***

## Status indicators

| Indicator | Meaning |
| - | - |
| **On shift** (green) | Scheduled agent, currently inside their shift hours and not on time off. |
| **Off shift** (amber) | Scheduled agent, outside shift hours, or on time off. |
| **Available** (green) | Manual agent, set as available and eligible for assignment. |
| **Away** (amber) | Manual agent, not eligible for assignment. |
| **Busy** (red) | Manual agent, not eligible for assignment. |
| **Paused** (grey) | Manual agent, not eligible for assignment. |

On the **Members** page, scheduled agents show a tooltip *"Status is managed by the schedule"* followed by the shift name. Their status is read-only because the schedule is in charge.

***

## How scheduling affects auto-assignment

Scheduling acts as the eligibility gate for ticket auto-assignment:

* **Manual agents** are eligible when their stored status is `Available`.
* **Scheduled agents** are eligible when the current time is inside their shift (in the shift's timezone) and they have no active time off.

The assignment algorithm (Balanced or Round robin) then picks one agent from that pool. See [Ticket Assignment](/docs/user-guides/chatbot/help-desk/assignment-algorithm) for how each algorithm chooses.

If nobody is eligible, the ticket stays unassigned until an agent is back on shift or set to `Available`. You can change this by enabling **Assign to next available shift**, which routes tickets to the agent whose shift starts soonest. See [Assign to next available shift](/docs/user-guides/chatbot/help-desk/assignment-algorithm#assign-to-next-available-shift) for details.

***

## Tips and edge cases

* **Overnight shifts** wrap past midnight automatically. Pick an end time that is the same as or earlier than the start time, and the shift continues into the following day.
* **Deleting a shift** moves every assigned agent back to manual mode. It does not reset their status. Picking **No shift (manual)** in the per-agent dropdown is what sets an agent to `Away`.
* **New agents** start as `Away` until you assign them a shift or change their status manually.
* **Time off only applies to scheduled agents.** If you want a manual agent to be unavailable, change their status directly.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.