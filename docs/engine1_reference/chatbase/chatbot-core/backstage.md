> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Backstage

> Backstage is an AI-powered operations center that lets users manage their AI agent through natural language conversation, instead of navigating multiple settings pages manually. Think of it as a copilot for AI agent management — users describe what they want in plain English, and Backstage handles the rest.

## What Can Users Do With It?

### Analytics & Insights

* Ask questions like "What are my top customer topics this month?" or "Show me conversation trends for the last 3 months"
* View interactive charts (bar, line, area, pie) generated in real time
* Check credit usage breakdowns
* Identify knowledge gaps — questions the AI agent couldn't answer

### Training & Knowledge Base

* Add, update, or delete knowledge base sources (text, Q\&A pairs, URLs)
* Upload files (PDFs, Word docs, spreadsheets, archives) to extract training data from
* Add, edit, or delete sources; each change trains on its own
* Toggle auto-resync on or off

### AI Agent Configuration

* Update the AI agent's system instructions or channel-specific instructions
* Change the AI model or temperature
* Modify the chat bubble appearance (colors, header, button styles, themes)

### Helpdesk (Read-Only)

* Query tickets by status, assignee, channel, or date
* Search tickets using text or semantic search
* View AI agent performance metrics, resolution analytics, and workload distribution
* Review helpdesk settings and saved views

### Actions & Integrations

* Create, update, enable/disable, or delete actions (Slack notifications, webhooks, ticket creation, etc.)
* Check integration status and trigger OAuth connections for new integrations

### Deployment

* Check which channels are active (chat bubble, WhatsApp, Slack, etc.)
* Enable or disable channels

### Built-in Skills (Multi-Step Workflows)

Users don't need to invoke these explicitly — the AI uses them automatically when relevant:

* Weekly insights report
* Tone/instruction updates with safe diff preview
* Drafting Q\&A from knowledge gaps
* New AI agent onboarding walkthrough
* File/archive processing into training data
* Helpdesk triage, issue review, performance review, and settings audit

***

## How Does Approval Work?

Backstage **never makes changes silently**. Any mutative action (updating instructions, adding sources, deleting an action, etc.) triggers a confirmation UI where the user can review each change and approve or reject it individually before anything is applied. Text changes show a side-by-side diff; settings changes show a before/after table.

***

## Plan Access & Daily Message Limits

Backstage is accessible to all plans — there is no plan-level gate blocking access. The only throttle is the daily message limit, which varies by plan:

| Plan | Daily Messages |
| - | - |
| Free (or no plan) | 2 |
| Hobby | 5 |
| Standard | 10 |
| Pro | 100 |
| Enterprise | 100 |
| Agency | 100 |

There is also a **rate limit of 10 requests per 60 seconds** per user to prevent abuse.

***

## Backstage on Slack & iMessage

You can now talk to your AI agent's Backstage directly from Slack or iMessage, no need to open the dashboard. Ask questions, review analytics, manage your AI agent, and approve changes from the apps you already use.

### What you can do from a DM or a text

<CardGroup cols={2}>
  <Card title="Analyze your AI agent" icon="chart-column">
    Ask questions like **"How did my AI agent do this week?"** or **"What did users ask about most?"** Charts and reports are delivered directly in the conversation.
  </Card>

  <Card title="Update your AI agent" icon="sliders">
    Change models, instructions, chat interface, branding, and other settings using natural language. Every change requires your approval before it's applied.
  </Card>

  <Card title="Manage sources & actions" icon="database">
    Inspect, update, and retrain knowledge sources, and manage actions without opening the dashboard.
  </Card>

  <Card title="Approve safely" icon="shield-check">
    Review exactly what's changing before approving. Nothing is applied without your explicit confirmation.
  </Card>

  <Card title="Analyze files (Slack)" icon="paperclip">
    Upload a CSV or other supported file and ask questions about its contents directly from Slack.
  </Card>

  <Card title="Continue anywhere" icon="repeat">
    Start on Slack or iMessage and continue the same Backstage session on the web with full history, richer approvals, and interactive charts.
  </Card>
</CardGroup>

### Approving changes

Every change proposed by Backstage requires your explicit approval.

<Tabs>
  <Tab title="Slack">
    Review the proposed changes and approve or reject them directly from Slack.

    Each proposal includes:

    <ul>
      <li>A detailed diff of what will change</li>
      <li><strong>Approve</strong> and <strong>Reject</strong> controls for every change</li>
    </ul>
  </Tab>

  <Tab title="iMessage">
    React with:

    <ul>
      <li>👍 to approve</li>
      <li>👎 to reject</li>
    </ul>
  </Tab>
</Tabs>

You can also reply with messages like **"yes"**, **"approve"**, **"no"**, or **"reject"**, or equivalent phrases in any language.

<Note>
  If you send another request while an approval is pending, the previous proposal is automatically superseded. You won't accidentally approve an outdated change.
</Note>

### Connect Slack

1. Open your **Dashboard**.
2. Select your AI agent.
3. Open **Backstage**.
4. Click **Controllers** in the top-right corner.
5. Expand **Slack**.
6. Click **Add to Slack**. You only need to do this once per workspace.
7. Copy the generated link message.
8. Send it as a DM to the **Backstage** Slack app.
9. Once you receive **Connected ✓**, you're ready to chat.

<Info>
  Each Slack thread is its own Backstage session.

  If your Slack account has access to multiple AI agents, starting a new thread will ask which AI agent you'd like to use.
</Info>

### Connect iMessage

1. Open **Controllers** from the Backstage page.
2. Expand **iMessage**.
3. Text the generated link message to the displayed phone number, or scan the QR code to open Messages with the number and message pre-filled.
4. Once you receive **Connected ✓**, you can start chatting.

<Info>
  Your phone maintains one active conversation.

  To switch AI agents, send another AI agent's generated link message. This starts a new Backstage session for that AI agent.
</Info>

## Good to know

<AccordionGroup>
  <Accordion title="Link messages">
    Link messages are **single-use** and expire after **10 minutes**.
  </Accordion>

  <Accordion title="Permissions">
    Connections are personal. They inherit your Chatbase permissions and can be revoked at any time from the **Controllers** dialog.
  </Accordion>

  <Accordion title="Attachments">
    Slack supports uploading files for analysis.

    iMessage does not support attachments, if you send one, it'll tell you your caption.
  </Accordion>

  <Accordion title="Web experience">
    Large analyses, interactive charts, and long approval flows include a link back to the corresponding Backstage session in the dashboard.
  </Accordion>
</AccordionGroup>

<Warning>
  Nothing is ever changed without your explicit approval.
</Warning>

***

## Limitations

* **Message length**: 10,000 characters max per message
* **File uploads**: Max 50 MB per file, up to 5 files per message
* **Analytics range**: Queries can cover a maximum of 6 months
* **Knowledge base source size**: Max 1 MB per text source or Q\&A entry
* **Helpdesk is read-only**: Backstage can surface helpdesk analytics and tickets, but it **cannot** modify ticket status, assign tickets, or send messages to customers
* **File tools are agent-focused**: Backstage will only process uploaded files for agent-related tasks (improving knowledge base, instructions, analytics). It won't do general-purpose tasks like summarizing a random document or solving homework


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.