> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Zapier

> Connect your AI agent to Zapier to send leads and conversation data into thousands of other apps

## Overview

Integrating Chatbase with Zapier lets you send what your AI agent collects into thousands of other apps, with no code. This guide walks through one complete example, collecting leads with your AI agent and appending them to a Google Docs file, but the same trigger works for any Zapier action.

<Card title="What you can do:" icon="bolt">
  Push leads and conversation data straight into your CRM, spreadsheet, or inbox the moment your AI agent captures them.
</Card>

## Before you start

* A Chatbase account with an AI agent. If you haven't built one yet, follow [Your first AI agent](/docs/user-guides/quick-start/your-first-agent).
* An active Zapier account.
* Your Chatbase **API key** and **Agent ID** (see the steps below for where to find each).

## What you can automate

| Automation | How it works |
| - | - |
| **Draft responses to customer emails** | Send new customer emails to Chatbase, have it draft a relevant response from your documentation, and save the response as a draft or send it directly |
| **Categorize and prioritize support emails** | Connect Chatbase to Gmail or Outlook, have it analyze tone and content, categorize emails as urgent or by topic, and add follow-up tasks to your project tool |
| **Add AI-generated solutions to support tickets** | Send new ticket details from Jira, Intercom, or Zendesk to Chatbase, and add the suggested solution back onto the ticket |
| **Analyze customer feedback forms** | Connect Chatbase to Typeform or Google Forms, analyze feedback for intent, tone, and sentiment, and send summaries to email, Slack, or a spreadsheet |

## How to connect Zapier

<Steps>
  <Step title="Set up lead collection in Chatbase">
    1. Sign in to your Chatbase account to access your dashboard.
    2. Click the AI agent you want to set up lead collection for.
    3. From the sidebar, click **Build > Actions**, then select **Create action** and set up your [Collect Leads action](/docs/user-guides/chatbot/actions/collect-leads).
  </Step>

  <Step title="Create a Zap and add the trigger">
    1. Sign in to your Zapier account.
    2. Click **Create**, then **Zaps**, in the top-left corner of the Zapier homepage.

    <Frame>
      <img src="https://mintcdn.com/chatbase/JnjROJ-aB2q57UGe/user-guides/integrations/images/zapier/zapier-4.webp?fit=max&auto=format&n=JnjROJ-aB2q57UGe&q=85&s=a1859e7e6805d0a686e450e54ac23fdb" alt="Creating a new Zap in Zapier" width="1897" height="788" data-path="user-guides/integrations/images/zapier/zapier-4.webp" />
    </Frame>

    3. In the Zap editor, click **Trigger**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/JnjROJ-aB2q57UGe/user-guides/integrations/images/zapier/zapier-5.webp?fit=max&auto=format&n=JnjROJ-aB2q57UGe&q=85&s=58e90b7cda886a5e42c02534843d4c74" alt="Selecting the trigger in the Zap editor" width="1858" height="674" data-path="user-guides/integrations/images/zapier/zapier-5.webp" />
    </Frame>

    4. Search for **Chatbase** in the search bar and click it.

    <Frame>
      <img src="https://mintcdn.com/chatbase/JnjROJ-aB2q57UGe/user-guides/integrations/images/zapier/zapier-6.webp?fit=max&auto=format&n=JnjROJ-aB2q57UGe&q=85&s=fe3c94f96afc755f04b3773849c26a7f" alt="Searching for Chatbase in the Zapier app list" width="1452" height="883" data-path="user-guides/integrations/images/zapier/zapier-6.webp" />
    </Frame>

    5. On the right side of the page, click the **Event** field and select **Form Submission**, then click **Continue**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/JnjROJ-aB2q57UGe/user-guides/integrations/images/zapier/zapier-7.webp?fit=max&auto=format&n=JnjROJ-aB2q57UGe&q=85&s=b9a5dc1f6d2d4b6137ac958ea5ab7c39" alt="Selecting the Form Submission event" width="1917" height="795" data-path="user-guides/integrations/images/zapier/zapier-7.webp" />
    </Frame>
  </Step>

  <Step title="Authenticate your Chatbase account">
    Click **Sign in** on the next page. On the authentication page, provide your Chatbase API key and, optionally, a display name, then click **Yes, Continue to Chatbase**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/JnjROJ-aB2q57UGe/user-guides/integrations/images/zapier/zapier-8.webp?fit=max&auto=format&n=JnjROJ-aB2q57UGe&q=85&s=f07f72517677abcd3ede4061d2bb5edb" alt="Signing in to link your Chatbase account" width="1920" height="688" data-path="user-guides/integrations/images/zapier/zapier-8.webp" />
    </Frame>

    <Note>
      To get your API key, head to your [account dashboard](https://www.chatbase.co/dashboard/), go to **Workspace settings**, then select **API keys** in the sidebar. Copy an existing key, or click **Create API Key** to create a new one.
    </Note>

    <Frame>
      <img src="https://mintcdn.com/chatbase/tFta2uWaJCqIJoQ6/user-guides/integrations/images/zapier/zapier-9.png?fit=max&auto=format&n=tFta2uWaJCqIJoQ6&q=85&s=b970a3c4150e0e6ab4485ce7514e01e2" alt="The Chatbase authentication page in Zapier" width="1372" height="928" data-path="user-guides/integrations/images/zapier/zapier-9.png" />
    </Frame>
  </Step>

  <Step title="Provide your Agent ID and test the trigger">
    1. Click **Continue** after authenticating.
    2. Paste your Agent ID in the provided input field and click **Continue**.

    <Note>
      To find your Agent ID, open the AI agent you want to link with Zapier, go to **Settings → General**, and copy the **Agent ID** from the **Agent details** card.
    </Note>

    3. Click **Test Trigger**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/JnjROJ-aB2q57UGe/user-guides/integrations/images/zapier/zapier-11.webp?fit=max&auto=format&n=JnjROJ-aB2q57UGe&q=85&s=35e5e5a21c8a86de2e725990342ce7ed" alt="Testing the Chatbase trigger in Zapier" width="1831" height="791" data-path="user-guides/integrations/images/zapier/zapier-11.webp" />
    </Frame>

    4. When prompted, click **Continue with selected records**.
  </Step>

  <Step title="Set up the action">
    1. A window appears with a list of apps. Search for **Google Docs** and click it.

    <Frame>
      <img src="https://mintcdn.com/chatbase/JnjROJ-aB2q57UGe/user-guides/integrations/images/zapier/zapier-12.webp?fit=max&auto=format&n=JnjROJ-aB2q57UGe&q=85&s=dbe8b8fa157f032d90e90c88938a4d6d" alt="Searching for Google Docs in Zapier" width="1559" height="903" data-path="user-guides/integrations/images/zapier/zapier-12.webp" />
    </Frame>

    2. Click the **Event** field, select **Append Text to Document**, then click **Continue**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/JnjROJ-aB2q57UGe/user-guides/integrations/images/zapier/zapier-13.webp?fit=max&auto=format&n=JnjROJ-aB2q57UGe&q=85&s=f1844a32e6dc7f77ddc78a9809bebc22" alt="Selecting the Append Text to Document event" width="1835" height="797" data-path="user-guides/integrations/images/zapier/zapier-13.webp" />
    </Frame>

    3. Sign into your Google account and click **Continue**.
    4. Select the document you wish to append to, in the **Document Name** field.
    5. In the **Text to Append** field, select the lead form field you want to add, then click **Continue**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/JnjROJ-aB2q57UGe/user-guides/integrations/images/zapier/zapier-14.webp?fit=max&auto=format&n=JnjROJ-aB2q57UGe&q=85&s=454bc6249a9d87ec45ec4380ee931b1e" alt="Mapping lead fields to the Google Docs action" width="1848" height="810" data-path="user-guides/integrations/images/zapier/zapier-14.webp" />
    </Frame>
  </Step>

  <Step title="Test and publish">
    Click to test the setup, then click **Publish** to go live.
  </Step>
</Steps>

<Check>
  Trigger a lead capture on your site and confirm the lead is appended to your target Google Docs file.
</Check>

## Next steps

<CardGroup cols={2}>
  <Card icon="person" href="/docs/user-guides/chatbot/actions/collect-leads" title="Collect Leads action">
    Configure which details your AI agent captures, and when.
  </Card>

  <Card icon="bolt" href="/docs/user-guides/integrations/viasocket" title="viaSocket">
    An alternative no-code automation platform, connected through webhooks.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.