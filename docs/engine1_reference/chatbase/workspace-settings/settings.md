> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Workspace settings

> Manage your workspace: details, members, plan, billing, API keys, and audit logs.

**Workspace settings** has six pages: **General**, **Members**, **Plans**, **Billing**, **API keys**, and **Audit logs**.

## General

The **Workspace details** card holds the **Workspace name** and **Workspace URL**. The name is displayed on the dashboard and in the AI agent path, while the URL appears in the address bar when accessing the workspace or its AI agents.

To modify the name or URL, simply edit the text in the field and click "Save."

To delete the workspace and all of its AI agents, scroll to the **Danger zone** at the bottom of the page and click **Delete workspace**.

<Frame>
  <img src="https://mintcdn.com/chatbase/xPpOvQF2MdeELnmI/user-guides/workspace/images/settings/team-settings-general.png?fit=max&auto=format&n=xPpOvQF2MdeELnmI&q=85&s=a65155df909a877fc8e943dc92692f4d" alt="Workspace Settings General" width="2940" height="1172" data-path="user-guides/workspace/images/settings/team-settings-general.png" />
</Frame>

## Members

This tab displays all the information about your workspace members, as well as those you've invited but haven't responded yet.

<Frame>
  <img src="https://mintcdn.com/chatbase/xPpOvQF2MdeELnmI/user-guides/workspace/images/settings/team-settings-members.png?fit=max&auto=format&n=xPpOvQF2MdeELnmI&q=85&s=2d095130a07592b761069cbe4bb94797" alt="Workspace Settings Members" width="2940" height="1172" data-path="user-guides/workspace/images/settings/team-settings-members.png" />
</Frame>

### Number of members

This shows the number of workspace members and invited members. In this example, the user has 3 members and invitations, with a maximum limit of 5.

<Frame>
  <img src="https://mintcdn.com/chatbase/PP3ngCxUjeoMGtCc/user-guides/workspace/images/settings/team-settings-members-limit.png?fit=max&auto=format&n=PP3ngCxUjeoMGtCc&q=85&s=0996ee1792df1d2192e81da188f4a9dd" alt="Workspace Settings Members Limit" width="1768" height="726" data-path="user-guides/workspace/images/settings/team-settings-members-limit.png" />
</Frame>

### Modify workspace member role

To modify a workspace member's role or remove them, click the three dots next to their name.

* **Owner**: Can change billing information, modify plans, rename or delete the workspace, and manage all AI agents within the workspace.
* **Member**: Have the same permissions as Owners, except they cannot add members or edit billing information.
* **Support Associate**: Can access the helpdesk only and edit anything inside it.
* **Viewer**: Have read-only access to resources and analytics. They cannot modify any settings, but can still test the AI agent through the playground and Compare section.

<Info>
  **Agent-level permissions:** Available on **the Enterprise plan** only. You can invite members or support associates to specific AI agents within the same workspace. This is especially useful for agencies managing multiple AI agents, allowing you to control which AI agents each member can access.
</Info>

#### Custom Roles

On **the Enterprise plan**, custom roles can be created to control what different members of your workspace can access and manage. This allows teams to assign permissions based on responsibilities and maintain better control over sensitive features.

Each custom role includes configurable permissions across different areas of the platform, such as:

* **AI agents** – View, create, edit, or delete AI agents
* **Sources** – Manage knowledge sources used by AI agents
* **Chatlogs** – View, delete, or export conversation history
* **Contacts** – Access and manage stored contacts
* **Integrations** – Configure external integrations
* **Billing** – View or manage billing settings
* **Subscription** – Manage the workspace subscription
* **Members** – View or manage workspace users
* **Webhooks** – Configure webhook integrations
* **Workspace** – Manage workspace-level settings
* **API Keys** – Create and manage API keys
* **Actions** – View automation actions
* **Analytics** – Access analytics dashboards
* **Leads** – View and export collected leads

Custom roles appear alongside the default roles (Owner, Member and Viewer) and can be assigned to workspace members to provide the appropriate level of access.

### Remove workspace member

To remove a member from the workspace

<Frame>
  <img src="https://mintcdn.com/chatbase/PP3ngCxUjeoMGtCc/user-guides/workspace/images/settings/team-settings-members-remove-member.gif?s=c6f4569d601624e563aa264367448e95" alt="Workspace Settings Members Remove Member" width="994" height="508" data-path="user-guides/workspace/images/settings/team-settings-members-remove-member.gif" />
</Frame>

### Modify Invitations

You can resend the invitation if it expired after 24 hours or if the invitee didn't see it in their inbox. You can also revoke the invitation to cancel it and prevent the invitee from joining the workspace.

<Frame>
  <img src="https://mintcdn.com/chatbase/PP3ngCxUjeoMGtCc/user-guides/workspace/images/settings/team-settings-revoke-resend-invite.png?fit=max&auto=format&n=PP3ngCxUjeoMGtCc&q=85&s=9c8d408047f869500a402c75116e544b" alt="Workspace Settings Revoke Resend Invite" width="1600" height="676" data-path="user-guides/workspace/images/settings/team-settings-revoke-resend-invite.png" />
</Frame>

### Invite Members

You can use this button to send new invitations to your workspace from the dashboard. To invite multiple members at once, click "Add Member."

For each invitee, enter their email and pick their role from the dropdown next to it. By default, the invitee gets access to the **Entire workspace**: every AI agent in it, including ones created later.

<Note>
  Limiting access to specific AI agents is available on **the Enterprise plan** only.
</Note>

<Info>
  New members can be added either by manually adding an extra member from the add-on card inside the dashboard or when an invited member accepts their invitation
</Info>

<Info>
  When an owner removes team members, the number of extra member slots does not decrease automatically, so billing remains the same. You’ll need to manually reduce the extra member count from the Plans page.
</Info>

## Plans

This tab provides information about all available plans and lets you modify your current plan or add new add-ons.

### Current Plan

This section is optional and will only appear if you're on a legacy plan. It provides details about the current plan, including your allowed features and limits.

<Frame>
  <img src="https://mintcdn.com/chatbase/eLq0fAAO5-4-VSnx/user-guides/workspace/images/settings/current-plan.png?fit=max&auto=format&n=eLq0fAAO5-4-VSnx&q=85&s=5c51d462b9d5d37555ca99fc74c6d506" alt="Workspace Settings Plans" width="1614" height="780" data-path="user-guides/workspace/images/settings/current-plan.png" />
</Frame>

### Available Plans

This section displays all available plans for subscription. You can switch between monthly and yearly by toggling the option. It's important to note that subscribing annually is cheaper 20% from the monthly subscription.

For more details about the available plans, please check out [our Pricing page](https://www.chatbase.co/pricing).

Please note that if you're on the old pricing packages, you won't be affected unless you want to upgrade your payment to annual or change the plan.

<Frame>
  <img src="https://mintcdn.com/chatbase/eLq0fAAO5-4-VSnx/user-guides/workspace/images/settings/available-plans-yearly.png?fit=max&auto=format&n=eLq0fAAO5-4-VSnx&q=85&s=e5201311c80232be6a7e56dcc1ec7df0" alt="Legacy plan" width="1550" height="1460" data-path="user-guides/workspace/images/settings/available-plans-yearly.png" />
</Frame>

If you choose to downgrade to a lower plan, such as from Standard to Hobby, the downgrade will take effect immediately. You'll receive a prorated credit based on the remaining time on your current plan, which will be applied to your new plan and any future invoices until the credit is used up.

Clicking "Cancel Plan" under your active plan disables auto-renewal. Your current plan will remain active until the next renewal date, after which you'll be downgraded to the free plan to avoid further charges. Your addons will also be active until the end of your billing period then removed when the plan expires.

***Note:*** Legacy plan users can now see the "Cancel Plan" button, as their active plan is listed. To downgrade to the free plan, please click on the cancel plan button, as shown below:

<Frame>
  <img src="https://mintcdn.com/chatbase/4kdBs__Z0wOL088A/user-guides/workspace/images/settings/legacy-settings.png?fit=max&auto=format&n=4kdBs__Z0wOL088A&q=85&s=df00dcf6d99d9862fa8f5c97df4ad149" alt="Legacy plan" width="2202" height="1058" data-path="user-guides/workspace/images/settings/legacy-settings.png" />
</Frame>

### Add Ons

This section is responsible for adding extra features on top of your current plan.

If you are choosing an add-on that can have quantities like extra AI agents, you will see a prompt similar to this:

<Frame>
  <img src="https://mintcdn.com/chatbase/m7ZAGYXjjRE7V_M7/user-guides/workspace/images/settings/extra-agents-addon.png?fit=max&auto=format&n=m7ZAGYXjjRE7V_M7&q=85&s=ae5c425ddb042d791893fc2ee5fb61a1" alt="Extra Agents Addon" width="1702" height="1072" data-path="user-guides/workspace/images/settings/extra-agents-addon.png" />
</Frame>

<Info>
  Free users must subscribe to a base plan before adding any add-ons.
</Info>

#### Auto recharge credits

When your credits fall below the threshold you set, we'll automatically add credits that don't expire to your account, ensuring uninterrupted service.

#### Extra AI agents

You can add extra AI agents to help you scale your service by managing multiple AI agents simultaneously.

#### Custom Domains

Use your own custom domains for the embed script, iframe, and AI agent link, offering a personalized and branded experience for your users.<br />Note that this add-on is available only for the Enterprise plan.

<Info>
  Custom Domains add-on is only available on the Enterprise plan.
</Info>

#### Remove 'Powered By Chatbase'

Remove the Chatbase branding from the iframe and widget for a cleaner, custom experience.

<Info>
  Add-ons can be subscribed to on a monthly or yearly basis.  <br /><br />The billing interval must be consistent: monthly plans can only include monthly add-ons, and yearly plans can only include yearly add-ons.
</Info>

<Warning>
  Cancelling an addon will remove it immediately and credit your account for the remaining days of your billing period.
</Warning>

## Billing

This section displays your billing details, including the email addresses receiving invoice copies, the data on the invoices, the payment methods used, and all past invoices.

### Billing Details

This section displays your billing information, this information will appear on your invoices. You can edit it as needed and click "Save" to update the details.

<Frame>
  <img src="https://mintcdn.com/chatbase/4kdBs__Z0wOL088A/user-guides/workspace/images/settings/team-settings-billing-details.png?fit=max&auto=format&n=4kdBs__Z0wOL088A&q=85&s=547f3c0ce59cc0b87dfa6e8697354154" alt="Workspace Settings Billing Details" width="1582" height="973" data-path="user-guides/workspace/images/settings/team-settings-billing-details.png" />
</Frame>

### Billing Email

This section shows the email address that will receive automated copies of all invoices for this workspace.

<Frame>
  <img src="https://mintcdn.com/chatbase/4kdBs__Z0wOL088A/user-guides/workspace/images/settings/team-settings-billing-email.png?fit=max&auto=format&n=4kdBs__Z0wOL088A&q=85&s=9ff309fd02ce4393b7d347dbff0191ae" alt="Workspace Settings Billing Email" width="1600" height="413" data-path="user-guides/workspace/images/settings/team-settings-billing-email.png" />
</Frame>

### Tax ID

In this section, you can add a tax ID to be displayed on the invoice if needed.

<Frame>
  <img src="https://mintcdn.com/chatbase/4kdBs__Z0wOL088A/user-guides/workspace/images/settings/team-settings-billing-tax.png?fit=max&auto=format&n=4kdBs__Z0wOL088A&q=85&s=c8a6b35032dddddb6f83f3b67ace713d" alt="Workspace Settings Billing Tax" width="1600" height="563" data-path="user-guides/workspace/images/settings/team-settings-billing-tax.png" />
</Frame>

### Billing Method

In this section, you can add payment methods and set one as your default. You can also delete payment methods, provided they are not set as the default.

<Frame>
  <img src="https://mintcdn.com/chatbase/4kdBs__Z0wOL088A/user-guides/workspace/images/settings/team-settings-billing-method.png?fit=max&auto=format&n=4kdBs__Z0wOL088A&q=85&s=ceea78e115b0a6dd846a1ce503b53044" alt="Workspace Settings Billing Method" width="1600" height="557" data-path="user-guides/workspace/images/settings/team-settings-billing-method.png" />
</Frame>

### Billing History

In this section, you can view all your past invoices along with their statuses. Click on an invoice to view it, and you'll also have the option to download it.

<Frame>
  <img src="https://mintcdn.com/chatbase/4kdBs__Z0wOL088A/user-guides/workspace/images/settings/team-settings-billing-history.png?fit=max&auto=format&n=4kdBs__Z0wOL088A&q=85&s=f4988eddbbb253a545d2677f02b602b1" alt="Workspace Settings Billing History" width="1600" height="799" data-path="user-guides/workspace/images/settings/team-settings-billing-history.png" />
</Frame>

<Info>
  Starting the 5th of January 2026, new users (or users with only one existing plan) will receive a single consolidated invoice instead of separate invoices for each subscription.
</Info>

## API keys

On this page, you'll find your Chatbase API keys, which allow you to interact with your AI agent using API calls.

***Note :*** This page is not available on all plans. If your plan doesn't include API access, you won't be able to view this page.

<Frame>
  <img src="https://mintcdn.com/chatbase/4kdBs__Z0wOL088A/user-guides/workspace/images/settings/team-settings-api-keys-3.png?fit=max&auto=format&n=4kdBs__Z0wOL088A&q=85&s=1c8f7243b02a42a3b71a9cc04a5c390b" alt="Workspace Settings API Keys" width="3112" height="2008" data-path="user-guides/workspace/images/settings/team-settings-api-keys-3.png" />
</Frame>

## Audit logs

This section allows you to monitor activity across your workspace, including who made changes and what was modified on the dashboard.

Audit Logs provide a chronological record of configuration updates to help teams maintain visibility, accountability, and operational control.

<Info>
  Audit Logs are only available on the Enterprise plan.
</Info>

### Activity Overview

In this section, you can view all recorded workspace activity, including:

* AI agent updates
* Source creation and deletion
* Action creation and deletion
* Integration creation and deletion

Each log entry displays:

* The event type (Created, Updated, Deleted)
* The object type (Agent, Source, Action, etc.)
* The object name or ID
* The user who performed the action
* The timestamp of the change

<Frame>
  <img src="https://mintcdn.com/chatbase/8Iu4JLY5otCn_GiU/user-guides/workspace/images/settings/audit-logs-1.png?fit=max&auto=format&n=8Iu4JLY5otCn_GiU&q=85&s=7c3b354e297ac87ddd5290ccea93a063" alt="Workspace Settings API Keys" width="1680" height="800" data-path="user-guides/workspace/images/settings/audit-logs-1.png" />
</Frame>

<Frame>
  <img src="https://mintcdn.com/chatbase/8Iu4JLY5otCn_GiU/user-guides/workspace/images/settings/audit-logs-2.png?fit=max&auto=format&n=8Iu4JLY5otCn_GiU&q=85&s=002a4b6be5bff4edea319223a1837940" alt="Workspace Settings API Keys" width="1680" height="939" data-path="user-guides/workspace/images/settings/audit-logs-2.png" />
</Frame>

### Filters & Search

You can filter audit logs to quickly find specific changes using:

* Date range selector
* AI agent filter
* Event type filter
* Search by user name or object ID

This makes it easier to investigate unexpected behavior or review activity within a specific timeframe.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.