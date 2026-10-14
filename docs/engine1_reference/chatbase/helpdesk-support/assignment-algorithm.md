> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Ticket Assignment

> Automatically assign incoming tickets to the most available teammate, or let your team manually pick up work.

As your support volume grows, you need an efficient way to route tickets to the right people. Chatbase offers three assignment methods so you can match your workflow, whether you prefer full control, even distribution, or simple rotation.

Assignment is configured **per team**. Each [team](/docs/user-guides/chatbot/help-desk/teams) has its own assignment strategy, max tickets per agent, and next-shift behavior, all set on **Settings → Helpdesk → Teams & assignment**: pick the team's chip, then edit its **Team settings** card. Once [routing](/docs/user-guides/chatbot/help-desk/team-routing) sends a ticket to a team, that team's strategy decides which agent receives it. Agent availability is managed separately on the **Members** page.

<Note>There is no separate AI agent-wide ticket assignment page. Every assignment setting belongs to a team, and the default team is selected for you when the page opens.</Note>

## Assignment methods at a glance

<Columns cols={3}>
  <Card title="Manual" icon="hand">
    Tickets remain unassigned until a teammate claims one or a manager assigns it.
  </Card>

  <Card title="Balanced" icon="scale-balanced">
    Each new ticket goes to the available agent with the **fewest open tickets**.
  </Card>

  <Card title="Round Robin" icon="arrows-rotate">
    Each new ticket goes to the available agent who has gone **longest without receiving one**.
  </Card>
</Columns>

***

## Manual assignment

With manual assignment, new tickets land in the shared inbox and wait for a teammate to pick them up or for a manager to assign them directly. This is the default strategy for new teams.

**Best for:**

* Small teams where agents self-select work
* Specialized tickets that require specific expertise
* Low-volume inboxes that don't need automation

***

## Balanced assignment

Balanced assignment automatically routes each incoming ticket to the available agent with the **lowest number of open tickets**. This keeps workloads even across your team, so no single agent gets overwhelmed while others sit idle.

### How it works

1. A new ticket arrives in the helpdesk.
2. The system finds all agents whose status is **Available**.
3. If a max ticket limit is configured, agents who have reached that limit are excluded.
4. The ticket is assigned to the agent with the **fewest open tickets** (non-closed, non-cancelled).
5. If multiple agents are tied, the one who was **least recently assigned** a ticket receives it.

***

## Round robin assignment

Round robin distributes tickets sequentially by assigning each new ticket to the available agent who was **least recently assigned**, regardless of how many tickets they currently have open. It's a good fit for **sales and lead distribution** where equal opportunity matters more than current workload.

### How it works

1. A new ticket arrives in the helpdesk.
2. The system finds all agents whose status is **Available**.
3. If a max ticket limit is configured, agents who have reached that limit are excluded.
4. The ticket is assigned to the agent with the **oldest last-assignment timestamp**, the teammate who has waited longest for a new ticket.

Unlike balanced assignment, round robin does **not** factor in how many tickets an agent currently has open. It purely rotates based on assignment order.

***

## Comparison

| Feature | Manual | Balanced | Round Robin |
| :- | :- | :- | :- |
| Auto-assigns tickets | No | Yes | Yes |
| Selection criteria | - | Fewest open tickets | Least recently assigned |
| Considers current workload | - | Yes | No |
| Respects max ticket limit | - | Yes | Yes |
| Only assigns to available agents (unless next-shift assignment is on) | - | Yes | Yes |
| Tie-breaking rule | - | Least recently assigned | - |
| Supports next-shift fallback | - | Yes | Yes |

***

## Unassigned tickets

When no agents are available or all agents have reached their ticket limit at the moment a ticket is created, the ticket stays in the shared inbox as **unassigned**. Auto-assignment runs at ticket creation, and nothing sweeps the backlog to retry it later on its own. The one exception is a team with **Unassign on reply** turned on, where a customer reply gives the ticket another chance at assignment. Otherwise, the ticket remains unassigned until a teammate picks it up or a manager assigns it.

Unassigned tickets are not automatically backfilled later when an agent comes online. To work through the queue, agents can open the **Unassigned** view and claim tickets, or a manager can assign them directly.

### Unassign on reply

Turn this on in the [team's settings](/docs/user-guides/chatbot/help-desk/teams). A customer reply then gives the ticket another chance at assignment:

* If the ticket is already unassigned, assignment runs again.
* If the ticket is assigned and that agent is still available, nothing changes.
* If the ticket is assigned and that agent is no longer available, the agent is unassigned and assignment runs again.
* On a **Manual** team, the agent is only unassigned. There is no auto-assignment to run, so the ticket goes back into the team's pool for someone to claim.
* The ticket keeps its existing team, so routing rules do not run again.
* The same max tickets per agent limit and **Assign to next available shift** setting apply, just as they do when the ticket is first created.
* **Closed** and **Cancelled** tickets are skipped.

***

## When all agents are unavailable

If every agent is set to **Away**, **Busy**, or **Paused** at the moment a ticket is created, the auto-assignment algorithms (balanced and round robin) cannot find an eligible agent. Here's what happens:

* Incoming tickets stay **unassigned** in the shared inbox with a **New** status.
* Tickets remain in the **Unassigned** view until a teammate manually picks one up or a manager assigns it.
* An agent toggling back to **Available** does not automatically receive queued tickets.

<Tip>To avoid a growing backlog, ensure at least one agent is set to **Available** during business hours, and review the **Unassigned** view regularly.</Tip>

***

## Assign to next available shift

When every agent is unavailable and you use **Balanced** or **Round Robin** assignment, you can enable **Assign to next available shift** so that incoming tickets are automatically routed to an agent whose shift starts soonest, instead of staying unassigned.

### How it works

1. A new ticket arrives and the system finds no available agents (all are `Off shift`, `Away`, `Busy`, or `Paused`).
2. The system looks at all **scheduled** agents and calculates when each agent's next shift begins, skipping any agents who are on time off.
3. The ticket is assigned to the agent (or agents, if tied) whose shift starts the **earliest**.
4. The chosen agent is selected using the same algorithm you configured. **Balanced** picks the one with the fewest open tickets, **Round Robin** picks the one least recently assigned.

<Info>This feature only applies to **scheduled** agents (those assigned to a shift). Manual agents are not considered because their next available time cannot be predicted.</Info>

### Enabling the toggle

<Steps>
  <Step title="Open the team">
    Navigate to **Settings → Helpdesk → Teams & assignment** and select the chip of the team you want to configure.
  </Step>

  <Step title="Choose an auto-assignment method">
    Set the team's **Assignment strategy** to **Balanced** or **Round Robin**. The toggle is not available for **Manual** assignment.
  </Step>

  <Step title="Enable the toggle">
    Turn on **Assign to next available shift** and save. When enabled, tickets that would otherwise stay unassigned are routed to the next agent coming on shift.
  </Step>
</Steps>

### Things to know

* **Max ticket limits still apply.** If you have a max tickets per agent configured, the next-shift agent must also be under that limit to receive the ticket.
* **Time off is respected.** Agents on time off are skipped even if their shift is the soonest.
* **Multiple agents on the same shift.** When several agents share the same next shift start time, the configured assignment algorithm (Balanced or Round Robin) breaks the tie.
* **No scheduled agents?** If your team has no scheduled agents, this toggle has no effect since there are no shift start times to predict.

***

## Max tickets per agent

For both automated methods (balanced and round robin), each team can optionally set a **maximum number of open tickets per agent**. When an agent reaches this limit, they stop receiving new assignments until they close or resolve existing tickets.

* **Default:** No limit
* **Scope:** Set per team, alongside the assignment strategy

<Steps>
  <Step title="Open the team">
    Navigate to **Settings → Helpdesk → Teams & assignment** and select the team's chip. Set its **Assignment strategy** to **Balanced** or **Round Robin** (the limit does not apply to Manual).
  </Step>

  <Step title="Set the cap">
    Enter a value in **Max tickets per agent**. Leave it empty for no limit. A good starting point is **10** for most support teams. Adjust based on your ticket complexity and team size, then save.
  </Step>
</Steps>

<Warning>When all available agents are at capacity at the moment a ticket is created, the ticket remains unassigned in the shared inbox and is **not** automatically picked up later. A teammate must claim it or a manager must assign it. Monitor your team's workload to avoid bottlenecks.</Warning>

***

## Agent availability

Only agents with an **Available** status are eligible for automatic assignment. For agents who aren't on a [shift schedule](/docs/user-guides/chatbot/help-desk/scheduling), you set this status yourself from the **Members** page (**Settings → Helpdesk → Members**), where every agent is listed with their teams and availability. A scheduled agent's status comes from their shift instead, so the Members page shows it as read-only.

| Status | Receives auto-assigned tickets? | When to use |
| :- | :- | :- |
| **Available** | Yes | Agent is online and ready to handle tickets |
| **Away** | No | Agent is temporarily unavailable (lunch, meeting) |
| **Busy** | No | Agent is focused on existing work and should not receive new tickets |
| **Paused** | No | Agent is offline or on extended leave |
| **On shift** | Yes | Set automatically while a scheduled agent is inside their shift hours and not on time off |
| **Off shift** | No | Set automatically outside a scheduled agent's shift hours |

Agents can update their own status from the sidebar when an admin has enabled **Allow teammates to be able to change their availability status** on the Members page.

***

## Setting up assignment

<Steps>
  <Step title="Open the team">
    Navigate to **Settings → Helpdesk → Teams & assignment** and select the chip of the team you want to configure.
  </Step>

  <Step title="Choose an assignment method">
    Set the team's **Assignment strategy** to **Manual**, **Balanced**, or **Round Robin** based on the team's workflow.
  </Step>

  <Step title="Configure ticket limits (optional)">
    If using balanced or round robin, set **Max tickets per agent** to prevent agent overload, then save.
  </Step>

  <Step title="Set agent availability">
    Open **Settings → Helpdesk → Members** and make sure agents who are ready to receive tickets are set to **Available**.
  </Step>
</Steps>

***

## Good to know

* **New agents default to Away.** When an agent is first added to an AI agent, their status is set to **Away**. They will not receive auto-assigned tickets until an admin or the agent themselves switches to **Available**.
* **Ticket limits only apply to auto-assignment.** The max tickets per agent setting does not restrict manual assignment. An admin can still assign tickets to an agent who has exceeded the configured limit.
* **Reassignment does not change ticket status.** When a ticket is reassigned from one agent to another, the ticket's status remains unchanged. It does not reset to **New** or **On You** automatically.
* **The Away toggle only switches between Away and Available.** Paused agents and agents on a shift schedule do not get this toggle in the sidebar. An admin can change a paused agent's status from the **Settings → Helpdesk → Members** page. A scheduled agent's status follows their shift instead.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.