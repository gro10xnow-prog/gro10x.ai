> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Usage

> Track message credits and AI agent counts across your workspace, filtered by AI agent and time period

## Overview

The **Usage** tab shows the usage details of all AI agents in the selected workspace, defaulting to the current month. You can narrow it to a single AI agent, or to a specific time period.

<Card title="What you can do:" icon="chart-line">
  See where your message credits are going, which AI agent is consuming them, and how consumption is trending day by day.
</Card>

<Frame>
  <img src="https://mintcdn.com/chatbase/xPpOvQF2MdeELnmI/user-guides/workspace/images/usage/usage-overview.png?fit=max&auto=format&n=xPpOvQF2MdeELnmI&q=85&s=2913666722e4bee8dec60942036a3d3f" alt="The Usage tab showing credits and AI agents for the current month" width="2940" height="1062" data-path="user-guides/workspace/images/usage/usage-overview.png" />
</Frame>

## Configuration

### AI agents

You can view usage for all your AI agents, a specific AI agent, or deleted AI agents, which lets you check the credits used by AI agents you've since removed. Use the **All agents** dropdown at the top of the page to switch between them.

<Frame>
  <img src="https://mintcdn.com/chatbase/PP3ngCxUjeoMGtCc/user-guides/workspace/images/usage/usage-chatbot-configuration.gif?s=fbd9acb710c0ae16a74ac1555446bddc" alt="Switching between AI agents in the Usage tab" width="800" height="505" data-path="user-guides/workspace/images/usage/usage-chatbot-configuration.gif" />
</Frame>

### Time interval

You can configure the time interval to view usage for a specific period, such as last week. The selected interval is highlighted in blue.

<Frame>
  <img src="https://mintcdn.com/chatbase/PP3ngCxUjeoMGtCc/user-guides/workspace/images/usage/usage-date-configuration.gif?s=0cad8ad1b9e37450868bcb9b68cd2f57" alt="Adjusting the time interval in the Usage tab" width="800" height="505" data-path="user-guides/workspace/images/usage/usage-date-configuration.gif" />
</Frame>

## Usage summary

This section summarizes the credits used and the number of AI agents used within the time interval you specified.

### Credits used

The number of message credits consumed over the period.

<Frame>
  <img src="https://mintcdn.com/chatbase/ZcQpyIvpdwiRhf0d/user-guides/workspace/images/usage/usage-credits-used.png?fit=max&auto=format&n=ZcQpyIvpdwiRhf0d&q=85&s=ccac3d1ec125e271717795fecb1b7169" alt="The credits used summary" width="2802" height="1212" data-path="user-guides/workspace/images/usage/usage-credits-used.png" />
</Frame>

### AI agents used

The number of AI agents in use compared to the total allowed. For example, a workspace might have 4 AI agents out of a maximum of 60.

<Frame>
  <img src="https://mintcdn.com/chatbase/PP3ngCxUjeoMGtCc/user-guides/workspace/images/usage/usage-chatbots-used.png?fit=max&auto=format&n=PP3ngCxUjeoMGtCc&q=85&s=68021fa1ac67e56f6f4bef26947d68dd" alt="The AI agents used summary, showing current against maximum" width="1454" height="354" data-path="user-guides/workspace/images/usage/usage-chatbots-used.png" />
</Frame>

### Usage history

The number of message credits used per day for the selected time interval. Hover over a bar to see the exact credits used on that day.

<Frame>
  <img src="https://mintcdn.com/chatbase/PP3ngCxUjeoMGtCc/user-guides/workspace/images/usage/usage-history.png?fit=max&auto=format&n=PP3ngCxUjeoMGtCc&q=85&s=defd03aa17572365a60e9b6e15167bdb" alt="Daily message credit usage across the selected period" width="2154" height="724" data-path="user-guides/workspace/images/usage/usage-history.png" />
</Frame>

### Credits used per AI agent

Compares credit usage across AI agents for the selected time interval. Hover over any segment of the pie chart to see the exact number of credits used by that AI agent.

<Frame>
  <img src="https://mintcdn.com/chatbase/PP3ngCxUjeoMGtCc/user-guides/workspace/images/usage/usage-credits-piechart.png?fit=max&auto=format&n=PP3ngCxUjeoMGtCc&q=85&s=58c6d9d3eb0b8838f5d9d9632ba50673" alt="Credit usage split across AI agents as a pie chart" width="2174" height="1028" data-path="user-guides/workspace/images/usage/usage-credits-piechart.png" />
</Frame>

## Usage alert

Get an email when your workspace has used a set share of its message credits, so you can upgrade or buy more before your AI agents stop responding.

To set it up:

1. Turn on the **Usage alert** toggle.
2. Enter a percentage under **Send an email when message credits used reach**. The number of credits that percentage equals is shown next to it, for example `(25 / 50 credits)`.
3. Under **Recipients**, add the email addresses that should get the alert.
4. Click **Save**.

The email says how many credits the workspace has used this month, when they reset, and links to the Usage page. Below the settings, **Last sent** shows the date the most recent alert went out.

<Note>
  When your message credits run out, your AI agents stop responding until the credits reset.
</Note>

### When the alert is sent

The alert is sent once per billing cycle, when usage first reaches your threshold. It resets at the start of each billing cycle.

If your credit limit goes up during the cycle (for example, after you add credits), the alert can be sent once more when usage reaches the new threshold.

### When usage alerts aren't available

* **Auto recharge is on.** [Auto recharge](/docs/user-guides/workspace/settings#auto-recharge-credits) tops up your credits automatically, so you won't run out and no alert is needed. The **Usage alert** card is hidden while auto recharge is on.
* **Your workspace is billed per conversation.** Usage alerts apply only to credit-based billing.

<Note>
  Turning auto recharge off doesn't remove extra credits you already have. Those credits still appear on the Usage page and still count toward your alert threshold.
</Note>

## Next steps

<CardGroup cols={2}>
  <Card title="Models Comparison" icon="scale-balanced" href="/docs/user-guides/chatbot/models-comparison">
    Credit cost varies by model. See what each tier costs per message.
  </Card>

  <Card title="Workspace settings" icon="gear" href="/docs/user-guides/workspace/settings">
    Manage your plan and buy add-on message credits.
  </Card>

  <Card title="Analytics" icon="chart-scatter" href="/docs/user-guides/chatbot/analytics">
    See conversation volume behind the credits you're spending.
  </Card>

  <Card title="Manage" icon="users-gear" href="/docs/user-guides/workspace/manage">
    Create workspaces and control who can change what.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.