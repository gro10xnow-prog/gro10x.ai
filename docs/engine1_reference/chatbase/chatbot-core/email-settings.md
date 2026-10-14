> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Email settings

> Use your AI agent over email with agent emails, forwarding rules, and authenticated domains.

## Overview

The **Email settings** feature lets you use your AI agent as an email support channel.\
You get a unique **agent email** in the format `agent@subdomain.chatbase-mail.com` that you can:

* **Send** emails and automatically **receive** AI-crafted replies.
* **Connect to your own domains and mailboxes**, so customers see messages coming from your email addresses instead of the default `chatbase-mail.com` domain.

<Info>
  You can add up to **3 custom domains**, and up to **20 email addresses per domain**.
</Info>

<Info>
  Attachments are supported, allowing your AI agent to process them and respond based on their content. For more information, please refer to [this section](/docs/user-guides/chatbot/channels#attachments).
</Info>

## How it works

* **Agent email**: When you create an AI agent, we generate an email like `agent@subdomain.chatbase-mail.com`.
* **Inbound messages**: Customers send an email to:
  * Your **agent email**, or
  * One of your own addresses (for example, `support@yourdomain.com`) that automatically forwards to the agent email.
* **AI response**: Your AI agent processes the email and generates a reply.
* **From address**:
  * If you **don’t** connect a domain, replies are sent from your `agent@subdomain.chatbase-mail.com`.
  * If you **do** connect and authenticate a domain, we can send email **on your behalf** (for example, `support@yourdomain.com`), once DNS is correctly configured.
  * With several verified addresses, the AI agent can reply from the same address the customer emailed. See [Reply addresses](/docs/user-guides/integrations/email#reply-addresses).

<Note>
  To send emails from your own domain, you must (1) configure automatic forwarding from at least one mailbox on that domain to your agent email, and (2) add the DNS records we provide to your DNS provider.
</Note>

## Prerequisites

* Access to the **Chatbase dashboard** and the AI agent whose email settings you want to configure.
* Admin access to your **email provider** to set up forwarding rules.
* Admin access to your **DNS provider** (domain registrar or DNS host) to add TXT, MX, and/or CNAME records.

## Accessing Email settings

<Steps>
  <Step title="Open your AI agent settings">
    Open your AI agent and go to **Settings → Email**. If you haven't used email before, you'll need to enable the email channel first.

    <Frame>
      <img src="https://mintcdn.com/chatbase/DnMdgLj-7YGWYAcx/user-guides/images/email-settings/email-channel-enable.png?fit=max&auto=format&n=DnMdgLj-7YGWYAcx&q=85&s=4e4e10f5a05c1d3026e9824550b621e8" alt="Email settings section in the AI agent settings" width="2312" height="1220" data-path="user-guides/images/email-settings/email-channel-enable.png" />
    </Frame>
  </Step>

  <Step title="Locate your agent email">
    You'll see your automatically generated **agent email**, for example:

    `agent@subdomain.chatbase-mail.com`

    <Frame>
      <img src="https://mintcdn.com/chatbase/DnMdgLj-7YGWYAcx/user-guides/images/email-settings/email-channel-agent-email.png?fit=max&auto=format&n=DnMdgLj-7YGWYAcx&q=85&s=7cd2440b47cbb13e0c09009b8dc71a0e" alt="Agent email address displayed in Email settings" width="2358" height="1224" data-path="user-guides/images/email-settings/email-channel-agent-email.png" />
    </Frame>

    You can use this email address to send and receive emails from your AI agent.
  </Step>
</Steps>

## Using the agent email directly

You can start using the feature immediately by sending an email to your **agent email**:

1. Send an email from any mailbox to `agent@subdomain.chatbase-mail.com`.
2. The AI agent processes the email content.
3. You receive a reply from the same `agent@subdomain.chatbase-mail.com` address.

<Note>
  To enable AI agent replies, you must first enable the email channel. Learn more about [enabling the email channel](/docs/user-guides/integrations/email).
</Note>

<Check>
  If you receive a reply from your agent email, your basic email channel is working correctly.
</Check>

To use **your own domain and addresses** (for example, `support@yourdomain.com` or `billing@yourdomain.com`), continue with the next sections.

## Step 1 – Add an email address

To configure a custom email address for your AI agent, start by adding the email address you want to use.

<Steps>
  <Step title="Click New email address">
    In **Email settings**, click the **New email address** button to start the setup process.

    <Frame>
      <img src="https://mintcdn.com/chatbase/N9HY49J9qlTM-suq/user-guides/images/email-settings/add-new-email.png?fit=max&auto=format&n=N9HY49J9qlTM-suq&q=85&s=d0bfd03ba5cafa86b3641038cf8a2e4e" alt="New email address button in Email settings" width="2462" height="1482" data-path="user-guides/images/email-settings/add-new-email.png" />
    </Frame>
  </Step>

  <Step title="Enter your email address">
    Enter the email address you want to use (for example, `support@yourdomain.com`).

    <Note>
      The domain will be automatically extracted from the email address. You can add up to **3 domains** per workspace and up to **20 email addresses per domain**.
    </Note>

    <Frame>
      <img src="https://mintcdn.com/chatbase/N9HY49J9qlTM-suq/user-guides/images/email-settings/add-email-drawer.png?fit=max&auto=format&n=N9HY49J9qlTM-suq&q=85&s=ccf6509214364b37ebaa9c1b15e06579" alt="Enter email address dialog" width="1604" height="1600" data-path="user-guides/images/email-settings/add-email-drawer.png" />
    </Frame>
  </Step>

  <Step title="Continue to forwarding setup">
    Click **Continue** to proceed to the email forwarding configuration step.
  </Step>
</Steps>

## Step 2 – Configure email forwarding

Next, configure automatic forwarding in your email provider so that emails sent to your support addresses are delivered to your agent email.

### Forwarding flow

1. A customer emails `support@yourdomain.com`.
2. Your email provider forwards that message automatically to `agent@subdomain.chatbase-mail.com`.
3. The AI agent processes the email and generates a reply.
4. The response is sent back via email from your authenticated domain.

<Warning>
  You must configure automatic forwarding for at least **one email address on the domain** before you can complete DNS authentication and send from that domain.
</Warning>

### Set up forwarding in your email provider

The exact steps depend on your provider, but the general pattern is:

1. Sign in to your email provider's admin or mailbox settings.
2. Open the **Forwarding**, **Rules**, or **Filters** section.
3. Create a rule that forwards incoming messages from the mailbox (for example, `support@yourdomain.com`) to your **agent email** (`agent@subdomain.chatbase-mail.com`).
4. If your email provider requires verification before allowing the forwarding rule:
   * The provider will send a verification email to your **agent email**.
   * You can find and approve the verification email in your AI agent's chatlogs.
5. Click **Verify automatic forwarding** in the Email settings drawer.
   * If everything is set up correctly, you'll be taken to the **authenticate domain** step (Step 3).

## Provider-specific forwarding guides

For detailed instructions on setting up email forwarding, refer to your email provider's documentation.

Here are links to official guides for popular email providers:

### Google Workspace and Gmail

<Tip>
  **Recommended:** Configure forwarding with **Default routing** in the Google Workspace Admin Console — it **doesn’t have rate limits** and **doesn’t require creating a mailbox** for the address you’re forwarding.
</Tip>

#### Configure email forwarding in Google Workspace (Admin Console) — Recommended

<Info>
  You need **Google Workspace administrator access** to complete these steps.
</Info>

<Steps>
  <Step title="Open the Google Workspace Admin Console">
    Sign in to the [Admin Console](https://admin.google.com/) using an admin account.
  </Step>

  <Step title="Go to Gmail routing settings">
    Navigate to **Apps** → **Google Workspace** → **Gmail**.

    Find **Default routing**, then click **Configure** or **add another rule** to create a new routing rule.
  </Step>

  <Step title="Create a routing rule for your support address">
    When adding the setting:

    * Set **Envelope Recipient** to the email address you want customers to use (for example, `support@yourdomain.com`).

    * Under **Envelope Recipient**, select **Change Envelope Recipient**.

    * In **Replace Recipient**, enter your **Chatbase agent email** (for example, `agent@subdomain.chatbase-mail.com`).

    <Frame>
      <img src="https://mintcdn.com/chatbase/Tr6NbyFbe7fm9_gb/user-guides/images/email-settings/google-workspace-step-2.png?fit=max&auto=format&n=Tr6NbyFbe7fm9_gb&q=85&s=c60659e7b6b28f0bedb0bf2a1f168f06" alt="Google Workspace Email Settings" width="1272" height="1398" data-path="user-guides/images/email-settings/google-workspace-step-2.png" />
    </Frame>
  </Step>

  <Step title="Save the rule and enable it for recognized + unrecognized addresses">
    Before saving, confirm the option is set to:

    **Perform this action on non-recognized and recognized addresses**

    <Frame>
      <img src="https://mintcdn.com/chatbase/Tr6NbyFbe7fm9_gb/user-guides/images/email-settings/google-workspace-step-3.png?fit=max&auto=format&n=Tr6NbyFbe7fm9_gb&q=85&s=c77f7781acefca3b98db55905857bb67" alt="Google Workspace default routing applied to recognized and unrecognized addresses" width="1272" height="1398" data-path="user-guides/images/email-settings/google-workspace-step-3.png" />
    </Frame>

    Then save your changes.
  </Step>

  <Step title="Verify forwarding in Chatbase">
    Return to **Email settings** in Chatbase and click **Verify automatic forwarding**.
  </Step>
</Steps>

<Note>
  Changes can take up to **24 hours** to propagate, although they often take effect sooner.
</Note>

#### Forward from a personal Gmail inbox

* **Gmail (personal inbox forwarding)**: [Set up email forwarding in Gmail](https://support.google.com/mail/answer/10957)

#### Prevent forwarded emails from going to spam

Gmail doesn't forward emails that it marks as spam, so some customer emails may never reach your AI agent. To make sure every email is forwarded, create a filter that stops Gmail from sending incoming emails to spam.

<Steps>
  <Step title="Open Gmail filter settings">
    In Gmail, click the **gear icon** → **See all settings**, then open the **Filters and Blocked Addresses** tab.
  </Step>

  <Step title="Create a filter that matches all emails">
    Click **Create a new filter**. Set **Size** to **less than** `200` **MB**.

    This matches every incoming email. Then click **Create filter**.
  </Step>

  <Step title="Never send matching emails to spam">
    Check **Never send it to Spam**, then click **Create filter**.
  </Step>
</Steps>

### Microsoft

* **Outlook (all versions)**: [Turn on automatic forwarding in Outlook](https://support.microsoft.com/en-us/office/turn-on-automatic-forwarding-in-outlook-7f2670a1-7fff-4475-8a3c-5822d63b0c8e) — follow this guide to set up forwarding to your Chatbase agent email. This works for Outlook.com, New Outlook, Classic Outlook, and Outlook on the web.

#### Allow external forwarding in Microsoft 365 (required for work accounts)

After setting up forwarding in Outlook, Microsoft 365 will **block the forwarded emails from leaving your organization** by default. Your Microsoft 365 administrator must allow external forwarding for the emails to reach Chatbase.

Without this step, forwarding appears configured in Outlook but emails are silently blocked and Chatbase verification will fail. For more details, see [Microsoft's documentation on external email forwarding](https://learn.microsoft.com/en-us/defender-office-365/outbound-spam-policies-external-email-forwarding).

<Info>
  You need **Microsoft 365 administrator access** to complete these steps. If you are not the admin, share these instructions with your IT team.
</Info>

<Steps>
  <Step title="Allow external forwarding in the outbound spam policy">
    Sign in to the [Microsoft Defender portal](https://security.microsoft.com).

    Navigate to **Email & Collaboration** → **Policies & Rules** → **Threat policies** → **Anti-spam** (under Policies).

    Select the **outbound spam filter policy** (the default policy or a custom policy that applies to your users).

    Click **Edit protection settings**.

    Find the **Automatic forwarding rules** setting and change it from **"Automatic - System-controlled"** (or **"Off - Forwarding is disabled"**) to **"On - Forwarding is enabled"**.

    Save your changes.

    <Info>
      If you don't want to enable forwarding for the entire organization, you can create a custom outbound spam policy that only applies to specific users or groups, and enable forwarding only in that policy. Alternatively, you can use **Remote domains** in the Exchange admin center to allow forwarding only to the Chatbase mail domain.
    </Info>
  </Step>

  <Step title="Verify forwarding in Chatbase">
    Return to **Email settings** in Chatbase and click **Verify automatic forwarding**.
  </Step>
</Steps>

### Other email providers

* **Yahoo Mail**: [Automatically forward emails in Yahoo Mail](https://help.yahoo.com/kb/SLN22028.html)
* **ProtonMail**: [Set up email forwarding in ProtonMail](https://proton.me/support/email-forwarding)

## Step 3 – Authenticate your domain with DNS

Once we detect automatic forwarding from at least one email address on the domain, you'll be able to proceed to DNS authentication. This step allows Chatbase to send emails on your behalf from your custom domain.

### View your DNS records

After forwarding is verified, you'll see the DNS records you need to add. In the **Email settings** drawer, you'll see:

* **Record type** (CNAME or TXT)
* **Name** (the DNS record name)
* **Value** (the DNS record value)

Each record will show its authentication status. Copy each record exactly as shown.

<Frame>
  <img src="https://mintcdn.com/chatbase/DX8USXKLL_RMQfwe/user-guides/images/email-settings/dns-records.png?fit=max&auto=format&n=DX8USXKLL_RMQfwe&q=85&s=944bd244b66649294eeb7fddf4408c04" alt="DNS records displayed in Email settings" width="1396" height="1592" data-path="user-guides/images/email-settings/dns-records.png" />
</Frame>

### Add records at your DNS provider

Sign in to the DNS provider that manages your domain (this might be your registrar or a DNS host like Cloudflare), then add the records we provided.

<Note>
  The DNS records you need to add include:

  * **CNAME record** for DKIM authentication (e.g., `chatbase._domainkey`)
  * **CNAME record** for SPF authentication (e.g., `outbound.chatbase`)
  * **TXT record** for DMARC policy (e.g., `_dmarc`)

  Copy each record exactly as shown on the **Email** tab, including the name and value.
</Note>

### Provider-specific DNS guides

For detailed instructions on DNS authentication, here are links to official guides for popular DNS and domain providers:

#### Domain registrars

* **GoDaddy**: [Add a TXT or CNAME record](https://www.godaddy.com/en/help/add-a-cname-record-19236)
* **Namecheap**: [How to manage DNS records](https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-to-create-a-cname-record-for-your-domain/)

#### DNS hosting providers

* **Cloudflare**: [Manage DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
* **Amazon Route 53**: [Working with DNS records](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html)
* **Google Cloud DNS**: [Managing DNS records](https://cloud.google.com/dns/docs/records)
* **Azure DNS**: [Manage DNS records](https://learn.microsoft.com/en-us/azure/dns/dns-operations-recordsets-portal)

### Verify your domain

After you add the DNS records at your DNS provider:

1. Return to the **Email settings** drawer in Chatbase.
2. Click **Validate** to check if the DNS records are correctly configured.

The system will verify each DNS record:

* **DKIM**: Shows as "authenticated" when the CNAME record is found
* **SPF**: Shows as "authenticated" when the CNAME record is found
* **DMARC**: Shows as "authenticated" when the TXT record is found

<Warning>
  DNS changes can take up to **24–48 hours** to fully propagate. If verification fails immediately after adding records, wait a few hours and try again.
</Warning>

<Check>
  Once all DNS records are verified, this email can be configured to be used by the AI agent to respond to emails. Replies will be sent **from your domain addresses** (for example, `support@yourdomain.com`) instead of the default `agent@subdomain.chatbase-mail.com` address. Learn more about [configuring the email channel](/docs/user-guides/integrations/email).
</Check>

## Adding and managing email addresses

After you've added your first email address and completed the setup process, you can add additional email addresses to the same domain or add emails from different domains.

### Adding more email addresses

To add additional email addresses:

1. Click **+ New email address** in the **Email configuration** card on the **Email** tab.
2. Enter the new email address (for example, `sales@yourdomain.com`).
3. Follow the same 3-step process:
   * Enter the email address
   * Configure email forwarding
   * Authenticate the domain (if not already done)

<Info>
  You can add up to **20 email addresses per domain**. If you're adding an email from a domain that's already authenticated, you'll only need to complete steps 1 and 2 (email address and forwarding).
</Info>

### Managing existing email addresses

The **Email configuration** card lists every address you have added, grouped by domain:

* Each domain heading shows its authentication status. **authenticated** means the DKIM, SPF, and DMARC records from Step 3 above have all been verified.
* The **Automatic forwarding** column shows whether forwarding from that address to your agent email has been verified.
* Click the pencil icon on a row to reopen that address's setup steps, for example to re-verify forwarding or check the DNS records.
* Click the trash icon to remove the address. Removing the last address on a domain removes the domain too, so you can reuse the slot.

## Testing your setup

Once forwarding and DNS are configured:

1. Send an email from an external address (for example, your personal Gmail) to one of your connected addresses (for example, `support@yourdomain.com`).
2. Confirm that:
   * The conversation appears under your AI agent’s conversations.
   * The reply is sent back to your external address.
   * The **From** address matches your expectations:
     * If the domain is not verified: it will come from `agent@subdomain.chatbase-mail.com`.
     * If the domain is verified: it will come from your configured address on that domain.

If everything looks correct, your email support channel is fully configured.

## Troubleshooting

### Email forwarding issues

**I don't see emails in my AI agent conversations**

* Confirm that forwarding is enabled and points to the correct **agent email** (`agent@subdomain.chatbase-mail.com`).
* Check for filters or rules that might be archiving or deleting messages before they are forwarded.
* Verify that your email provider has sent and you've approved any required verification emails.
* Check your agent email's conversation history for any verification emails that need approval.
* If you forward from Gmail, check your **Spam** folder. Gmail doesn't forward emails marked as spam. See [Prevent forwarded emails from going to spam](#prevent-forwarded-emails-from-going-to-spam).

### DNS authentication issues

**Domain verification fails**

* Ensure there are no typos in the CNAME or TXT record values—copy them exactly as shown.
* Verify that you added records on the correct DNS zone:
  * For `yourdomain.com`, add records at the root level
  * For `subdomain.yourdomain.com`, add records for the subdomain
* Wait for DNS propagation—some providers can take up to 48 hours to update DNS records globally.

**Some DNS records verify but others don't**

* Each record is verified independently. Check each one:
  * DKIM (CNAME): Verify the name includes `chatbase._domainkey`
  * SPF (CNAME): Verify the name includes `outbound.chatbase`
  * DMARC (TXT): Verify the name includes `_dmarc`
* Ensure the record values match exactly what's shown in Email settings.

### Microsoft 365 forwarding blocked

**Verification keeps failing and no emails reach Chatbase**

* Microsoft 365 blocks automatic external forwarding by default. Your admin must enable it in the outbound spam filter policy. See [Allow external forwarding in Microsoft 365](#allow-external-forwarding-in-microsoft-365-required-for-work-accounts) above.
* Check if the sender is receiving a non-delivery report (NDR) with the error: `5.7.520 Access denied, Your organization does not allow external forwarding`. This confirms external forwarding is blocked.
* If using a custom outbound spam policy, ensure the policy applies to the correct users or groups.

### General issues

**I can't add more domains**

* You can add up to **3 domains** per workspace. Remove an existing domain if you need to add a new one.

**I can't add more email addresses**

* You can add up to **20 email addresses per domain**. Consider using a different domain if you need more addresses.

**Emails are being marked as spam**

* Ensure all DNS records (DKIM, SPF, DMARC) are properly configured and verified.
* Check your domain's reputation using tools like [MXToolbox](https://mxtoolbox.com/).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.