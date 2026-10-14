> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Manage

> Create workspaces, duplicate and group AI agents, and control who can change what

## Overview

A **workspace** groups your AI agents, billing, and team members together. Each workspace has its own AI agents, billing information, and plan, none of which are shared with any other workspace.

<Card title="What you can do:" icon="users-gear">
  Separate AI agents by team, client, or environment, and control who can change settings versus who can only work on the AI agents.
</Card>

## Creating a workspace

<Steps>
  <Step title="Open the workspace menu">
    Click your avatar at the bottom-left of the sidebar and select **Create or join workspace**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/xPpOvQF2MdeELnmI/user-guides/workspace/images/manage/team-manage-create-team.png?fit=max&auto=format&n=xPpOvQF2MdeELnmI&q=85&s=a9f440d445fca104c3151b4bc4b9a7d5" alt="The Create or join workspace option in the sidebar menu" width="2934" height="1112" data-path="user-guides/workspace/images/manage/team-manage-create-team.png" />
    </Frame>
  </Step>

  <Step title="Add the workspace details">
    * **Workspace Name:** the AI agent's display name within the dashboard.
    * **Workspace URL:** the workspace slug, visible only in the URL when accessing the workspace on the dashboard.

    <Info>
      You can choose any workspace URL you prefer, as long as it's unique and doesn't match an existing workspace.
    </Info>

    <Frame>
      <img src="https://mintcdn.com/chatbase/4kdBs__Z0wOL088A/user-guides/workspace/images/manage/team-manage-create-team-page.png?fit=max&auto=format&n=4kdBs__Z0wOL088A&q=85&s=99b33f82cef143aab5558907f257548a" alt="Entering the workspace name and URL" width="1104" height="1042" data-path="user-guides/workspace/images/manage/team-manage-create-team-page.png" />
    </Frame>
  </Step>

  <Step title="Create your first AI agent">
    You'll be taken to a new page where you can click **New AI agent** and start adding your sources.

    <Frame>
      <img src="https://mintcdn.com/chatbase/xPpOvQF2MdeELnmI/user-guides/workspace/images/manage/team-manage-create-chatbot.png?fit=max&auto=format&n=xPpOvQF2MdeELnmI&q=85&s=fbece8ababbaada3030abbe2fceaea40" alt="The New AI agent button in a new workspace" width="2332" height="1482" data-path="user-guides/workspace/images/manage/team-manage-create-chatbot.png" />
    </Frame>
  </Step>
</Steps>

## Duplicating an AI agent

You can duplicate any AI agent by clicking the three dots icon and choosing **Duplicate Agent**.

<Frame>
  <img src="https://mintcdn.com/chatbase/xPpOvQF2MdeELnmI/user-guides/workspace/images/manage/team-manage-duplicate-agent.png?fit=max&auto=format&n=xPpOvQF2MdeELnmI&q=85&s=ae0f74b12ad8acaaea5128ba6b6a8a8b" alt="The Duplicate Agent option in the three dots menu" width="2332" height="1482" data-path="user-guides/workspace/images/manage/team-manage-duplicate-agent.png" />
</Frame>

### What's not copied

Most AI agent settings are copied, but the following are **not**:

| Not copied | Why |
| - | - |
| **Deployment integrations** such as WhatsApp, Zendesk, Instagram, and the Email channel | Each connection belongs to a single AI agent |
| **Slack Notify action** | A Slack workspace can't be connected to multiple AI agents at the same time |
| **Notion sources** | A Notion workspace can't be connected to multiple accounts |

## Organizing AI agents in groups

Group related AI agents together on the **Agents** page, for example by client, brand, or use case.

<Steps>
  <Step title="Open the Move to group dialog">
    On the **Agents** page, click the three dots icon on an AI agent and choose **Move to group**.
  </Step>

  <Step title="Pick or create a group">
    Pick an existing group, or type a new name to create one. Then click **Save**.
  </Step>
</Steps>

The **Agents** page then lists each group under its own heading, with the number of AI agents in it. AI agents that aren't in a group appear under **Ungrouped**. Click the arrow next to a group's name to collapse or expand it, or the pencil icon to rename it.

To remove an AI agent from its group, open **Move to group**, clear the name, and click **Save**.

<Note>
  Groups are personal. Any workspace member can create them, whatever their role. They're saved in your browser, so they don't change what other members see, and they don't carry over to another browser or device.
</Note>

## Roles and permissions

| Role | What they can do |
| - | - |
| **Owners** | Change workspace settings (billing, plan, name), delete the workspace, and manage all AI agents within it |
| **Members** | Manage AI agents only: train them, see their data, and delete them. They cannot change workspace settings |

<Note>
  Invite links expire 24 hours after they're sent to an invitee.
</Note>

## Next steps

<CardGroup cols={2}>
  <Card title="Usage" icon="chart-line" href="/docs/user-guides/workspace/usage">
    Track message credits consumed across the AI agents in this workspace.
  </Card>

  <Card title="Workspace settings" icon="gear" href="/docs/user-guides/workspace/settings">
    Manage billing, your plan, and add-ons.
  </Card>

  <Card title="Build Your First AI Agent" icon="rocket" href="/docs/user-guides/quick-start/your-first-agent">
    Create, train, and deploy an AI agent in the new workspace.
  </Card>

  <Card title="Two-factor authentication" icon="shield-halved" href="/docs/user-guides/workspace/two-factor-auth">
    Add a second factor for everyone in the workspace.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.