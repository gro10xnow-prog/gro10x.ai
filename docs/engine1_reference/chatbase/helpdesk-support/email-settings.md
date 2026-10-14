> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Email Settings

> Configure email addresses, display names, signatures, and previews for your Helpdesk.

## Email Configuration

The Email Configuration card allows you to choose which email addresses will be used as your helpdesk inboxes and who should be notified about deliverability issues.

### Selecting helpdesk emails

Under **Helpdesk email address**, you can configure one or more email addresses to receive support tickets.

<Steps>
  <Step title="Add an email row">
    Click **Add email** to add a new email row. Each row presents a dropdown of your available email addresses.
  </Step>

  <Step title="Select an email address">
    Choose an email address from the dropdown. Emails from every domain are listed; ones with DNS problems appear disabled with an issue indicator. Once you pick an email in one row, that option becomes disabled in the other rows' dropdowns.
  </Step>

  <Step title="Review email status">
    Each selected email is checked for three things:

    * **Forwarding** - Whether email forwarding is enabled
    * **DKIM** - Whether DKIM authentication is configured on the domain
    * **SPF** - Whether SPF records are configured on the domain

    All three must pass for the email to function correctly. An email that fails any of them shows a warning badge with the number of issues.
  </Step>

  <Step title="Save">
    Click **Save** to apply your email configuration.
  </Step>
</Steps>

<Warning>
  Emails missing any of the three requirements (Forwarding, DKIM, SPF) display a badge showing the number of issues. Hover over it to see which checks are failing. Resolve these in your domain's DNS settings before using the email for helpdesk support.
</Warning>

### Removing an email

Click the **×** next to any email row to remove it, including the last one. If no email is configured, outgoing replies fall back to the auto-generated agent address.

| Condition | Fallback |
| - | - |
| No emails selected | Uses the auto-generated agent email: `agent@{subdomain}.{mail-domain}` |

### Deliverability alert contact

Configure which team member receives notifications when outgoing helpdesk emails fail to deliver.

1. Open the **Deliverability alert contact** dropdown.
2. Select a team member from your account's member list.
3. Click **Save**.

The selected contact will receive alerts when emails bounce or encounter delivery issues.

<Info>
  The deliverability alert contact is optional. If not set, no notifications will be sent for failed deliveries.
</Info>

### Validation rules

| Rule | Description |
| - | - |
| Non-empty email rows | Every added email row must have an email selected |
| No duplicates | The same email address cannot be selected in multiple rows |
| DNS requirements | Warnings are shown for emails missing Forwarding, DKIM, or SPF, but saving is still allowed |

***

## Display Name

The Display Name setting controls what recipients see in the **From** field of emails sent from your helpdesk. This helps establish trust and brand recognition with your customers.

### Auto mode

**Automatically use support associate's name** uses the name of the support associate who responds to the ticket. Each outgoing email will show the actual agent's name, creating a more personal support experience.

For example, if agent "Sarah Johnson" responds to a ticket, the email appears as:

```text theme={null}
From: Sarah Johnson <support@yourdomain.com>
```

<Info>
  Automatic is the default and recommended for teams that want a personal touch in customer communications.
</Info>

### Custom mode

**Use custom name** uses a fixed name you specify for all outgoing emails, regardless of which agent responds. This is useful for maintaining a consistent brand identity across all support communications.

For example, if you set the custom name to "Acme Support":

```text theme={null}
From: Acme Support <support@yourdomain.com>
```

When selecting custom mode, a text input appears where you enter the desired display name. The name cannot be empty.

### Changing the display name

1. Select either **Automatically use support associate's name** or **Use custom name**.
2. If you chose a custom name, enter it in the text field that appears.
3. Click **Save** to apply.

<Note>
  Changes to the display name take effect on all future outgoing emails. Previously sent emails are not affected.
</Note>

***

## Email Signature

The Signature card lets you create a rich-text signature that is automatically appended to the bottom of every outgoing helpdesk email, including those sent by the AI agent.

### Creating a signature

1. Open the **Signature** card on the email settings page.
2. Use the rich-text editor to compose your signature. The toolbar offers text styles, bold, italic, underline, strikethrough, numbered and bulleted lists, links, and emoji.
3. Click **Save** to apply.

### Signature behavior

| Scenario | Signature applied? |
| - | - |
| AI agent auto-replies | Yes |
| Manual agent replies | Yes |
| No signature content saved | No signature section rendered |

### Editing or removing a signature

* **Edit:** Modify the content in the rich-text editor and click **Save**.
* **Remove:** Clear all content from the editor and click **Save**. An empty signature produces no signature block at send time.

<Info>
  Keep signatures concise. Long signatures can push the actual email content out of the visible area on mobile devices.
</Info>

***

## Preview

The last card on the page is a live preview of an outgoing email. It shows the **From** line as recipients will see it (your display name followed by the selected helpdesk address), a placeholder recipient, placeholder body text, your signature if you have saved one, and the **Powered by Chatbase** footer.

<Note>
  The preview uses placeholders when configuration is incomplete: `chatbase@mail.com` for a missing subdomain, and "Support Associate" for the automatic display name. Real emails always use your subdomain and the responding agent's name.
</Note>

<Note>
  The **Powered by Chatbase** footer can be removed with the white-label add-on. See [Pricing](https://www.chatbase.co/pricing).
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.