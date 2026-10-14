> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Teams

> Group your agents into teams so tickets can be routed and assigned to the right people.

A team is a named group of support agents within an AI agent. Tickets are first routed to a team and then assigned to an individual agent inside that team. Teams let you split your support organization by function, product, or language, so the right group always handles the right tickets.

Every AI agent has exactly one **default team**. When you first enable the Helpdesk, a team called **General** is created as the default and every account member is added to it. The default team catches all tickets that no [routing rule](/docs/user-guides/chatbot/help-desk/team-routing) matches.

Teams and their assignment settings live on a single page: **Settings → Helpdesk → Teams & assignment**.

## Team properties

| Property | Description |
| :- | :- |
| **Name** | A display name for the team, 1 to 100 characters (for example, "Billing Support"). |
| **Assignment strategy** | How tickets are distributed to agents within the team: **Manual**, **Balanced**, or **Round Robin**. See [Ticket Assignment](/docs/user-guides/chatbot/help-desk/assignment-algorithm) for how each method works. |
| **Max tickets per agent** | An optional cap on open tickets per agent. Only applies when the strategy is **Balanced** or **Round Robin**. Leave empty for no limit. |
| **Assign to next available shift** | A toggle that routes tickets to the next agent coming on shift when no one is currently available. Only shown for **Balanced** and **Round Robin**. |
| **Unassign on reply** | When a customer replies to a ticket whose assigned agent is currently unavailable, that agent is unassigned and the team's auto-assignment runs again. Off by default. |
| **Default team** | Exactly one team per AI agent is the default. It receives every ticket that no routing rule matched. |

<Note>The assignment strategy controls how tickets are shared **between agents inside a team**. Routing decides **which team** a ticket goes to. The two settings work together: routing picks the team, then the team's strategy picks the agent.</Note>

***

## The Teams & assignment page

**Settings → Helpdesk → Teams & assignment** shows every team and the selected team's configuration on one screen.

* **Team chips.** Each team appears as a chip at the top of the page with its **member count**, its number of **open tickets**, and a **Default** badge on the default team.
* **Search.** Filter the chips by team name with the search box.
* **Create team.** The **Create team** button sits next to the search box. A newly created team is selected automatically.
* **Selected team.** Clicking a chip loads that team's **Team settings** and **Members** cards below the chips, with no page change. The default team is selected when you open the page, so auto-assignment settings are visible right away.
* **Deep links.** The selected team is reflected in the URL as `?team=<team-id>`, so you can bookmark or share a specific team.

***

## Creating a team

<Steps>
  <Step title="Open the Teams & assignment page">
    Navigate to your AI agent's **Settings → Helpdesk → Teams & assignment**.
  </Step>

  <Step title="Start a new team">
    Click **Create team**. A slide-over panel opens.
  </Step>

  <Step title="Name the team">
    Enter a name, such as "Billing Support" or "Tier 2".
  </Step>

  <Step title="Add members (optional)">
    Select agents from the member picker. You can search by name or email and use **Select all**. Members can also be added later.
  </Step>

  <Step title="Choose an assignment strategy">
    Pick **Manual**, **Balanced**, or **Round Robin**. If you choose Balanced or Round Robin, you can optionally set **Max tickets per agent** and enable **Assign to next available shift**.
  </Step>

  <Step title="Save">
    Click **Create team**. The team appears as a new chip and is selected immediately so you can keep configuring it.
  </Step>
</Steps>

***

## Editing a team

Select a team's chip to load its configuration below the chips. It has two main cards.

### Team settings

Edit **the team’s name**, **assignment strategy**, **max tickets per agent**, **Assign to next available shift**, and **Unassign on reply** settings. A Save button appears once you make a change.

This card also shows the team's default status:

* If the team **is** the default, an info box explains that it receives all unmatched tickets.
* If the team **is not** the default, a **Make default** button lets you promote it.

### Members

The Members card lists the team's current agents in a searchable table showing each agent's availability status, current shift, and number of open tickets.

* **Add a member** with the **Add member** control, which lists any account agent not already on the team.
* **Remove a member** with the per-row **Remove** action. A confirmation dialog appears before the member is removed.

***

## The default team

There is always exactly one default team per AI agent.

* It is created automatically (named **General**) when the Helpdesk is first enabled, with all account members added.
* Any team can become the default using **Make default** in its **Team settings** card.
* The default team **cannot be deleted**.

<Tip>Keep your default team staffed with agents who can handle general or uncategorized tickets, since it is the fallback for anything your routing rules do not match.</Tip>

***

## Deleting a team

Only non-default teams can be deleted. Select the team, click **Delete team** at the bottom of its **Team settings** card, then confirm in the dialog.

<Warning>If the team has open tickets, those tickets are **detached from the team** (they keep their assigned agent, if any, but are no longer tied to a team). The default team can never be deleted, so reassign the default first if you need to remove that team.</Warning>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.