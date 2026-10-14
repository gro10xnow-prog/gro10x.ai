> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Vercel

> Install Chatbase on a Vercel-hosted app directly from the Vercel Marketplace, with no code required

## Overview

The Chatbase Vercel integration adds an AI agent to your Vercel-hosted applications directly from the Vercel Marketplace. You install Chatbase, configure your AI agent without leaving Vercel, and Vercel injects the environment variables into your project.

<Card title="What you can do:" icon="comments">
  Add conversational AI to a Vercel app in a few clicks: create and configure the AI agent inside Vercel, connect it to one or more projects, and scale on Vercel's edge network.
</Card>

<Info>
  The Chatbase integration works with all frameworks supported by Vercel, including Next.js, React, Vue.js, SvelteKit, and static HTML sites.
</Info>

## Before you start

* A Vercel account ([sign up for free](https://vercel.com/signup))
* An existing Vercel project, or [use our template](https://github.com/Chatbase-co/nextjs-marketplace-template)

## How to install the integration

<Steps>
  <Step title="Install Chatbase from the Vercel Marketplace">
    1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
    2. Click the **Marketplace** tab in the top navigation.
    3. Search for **Chatbase** and click the integration in the results.
    4. Click **Install**.

    <Tip>
      You can also go straight to [vercel.com/integrations/chatbase](https://vercel.com/integrations/chatbase).
    </Tip>

    <Check>
      You'll be redirected to the Chatbase configuration wizard.
    </Check>
  </Step>

  <Step title="Choose an AI agent preset and model">
    Select the preset that best matches your use case:

    * **AI Agent**: a general-purpose intelligent assistant
    * **Customer Support Agent**: optimized for answering customer questions and providing support
    * **Sales Agent**: guides customers through product selection and purchase decisions

    Then select an AI model. On a paid plan you can choose the model; on a free plan the default model is used, and you can change it later from your Chatbase dashboard.

    <Tip>
      Presets are only a starting point. You can change the personality, AI model, and styles at any time from your Chatbase dashboard.
    </Tip>
  </Step>

  <Step title="Choose your subscription plan">
    Choose the plan that fits your needs (**Free**, **Hobby**, **Standard**, or **Pro**), reviewing the features and message limits for each before selecting.

    After selecting your plan:

    1. An invoice is sent to your registered email address.
    2. Follow the payment link in the invoice to complete your subscription.
    3. Your plan becomes active once the invoice is paid.

    <Warning>
      Your selected plan only takes effect after the invoice is paid. Until then, you have access to the free tier features.
    </Warning>

    <Info>
      Billing is handled securely through Vercel's payment system. You can manage your subscription from the Vercel dashboard.
    </Info>
  </Step>

  <Step title="Name your AI agent">
    Provide a descriptive name. It appears in your Chatbase dashboard, helps you identify the AI agent if you create several, and is visible in your Vercel integration settings.

    **Examples:** "Website Support Agent", "Product Assistant", "Sales Lead Qualifier", "Documentation Helper".

    <Tip>
      Choose a name that clearly describes the AI agent's purpose, especially if you plan to create multiple AI agents for different projects.
    </Tip>
  </Step>

  <Step title="Customize in the Chatbase dashboard (optional)">
    After creating your AI agent you'll get a link to your Chatbase dashboard, or visit [chatbase.co/dashboard](https://www.chatbase.co/dashboard) and log in. From there you can:

    * [Customize the appearance](/docs/user-guides/chatbot/channels#chat-bubble-display)
    * [Add training data sources](/docs/user-guides/chatbot/data-sources). The more relevant data you provide, the better your AI agent responds
    * [Configure actions](/docs/user-guides/chatbot/actions/actions-overview) such as lead collection, calendar booking, Stripe payments, custom actions, and web search
    * Set up integrations with Slack, Zapier, webhooks, and CRM systems
  </Step>

  <Step title="Connect the integration to your Vercel project">
    1. Go back to your Vercel dashboard.
    2. In the Chatbase integration settings, click **Connect Project**.
    3. Select the project or projects where you want the AI agent.
    4. Click **Connect** to finalize. Vercel automatically injects the environment variables into the selected projects.

    <Info>
      You can connect the same AI agent to multiple projects.
    </Info>
  </Step>

  <Step title="Redeploy your project">
    For the environment variables to take effect, redeploy:

    1. Go to your project in the Vercel dashboard.
    2. Click the **Deployments** tab.
    3. Click the three-dot menu (⋯) on your latest deployment.
    4. Select **Redeploy**.

    <Info>
      Environment variables are injected at **build time**, not runtime. That's why a redeployment is necessary.
    </Info>
  </Step>
</Steps>

<Check>
  Visit your deployed project. The chat bubble should appear in the corner of the page. Click to open it, send a test message related to your training data, and confirm the AI agent responds correctly.
</Check>

## Managing your integration

### Updating your AI agent

Changes made in your Chatbase dashboard apply instantly without a redeployment, including appearance customization, training data updates, response behavior, and actions.

<Tip>
  Only environment variable changes require redeployment. All AI agent configuration changes are live immediately.
</Tip>

### Multiple projects

To connect the same Chatbase AI agent to more Vercel projects:

1. Go to your Vercel dashboard.
2. Navigate to **Integrations → Chatbase**.
3. Click **Manage** on your Chatbase integration.
4. Click **Add Project**.

<Tip>
  Useful if you have multiple frontends, such as a web app, marketing site, and documentation, that should share one AI agent.
</Tip>

### Different AI agents per environment

To use different AI agents for production, preview, and development:

1. Create separate AI agents in Chatbase for each environment.
2. In Vercel, go to **Settings → Environment Variables** and set different `NEXT_PUBLIC_CHATBOT_ID` values for Production, Preview, and Development.

This lets you test changes without affecting production conversations, keep separate training data per environment, and monitor analytics separately.

### Managing your subscription plan

Go to **Integrations → Chatbase → Settings** in your Vercel dashboard and click **Change Plan**.

| Change | When it takes effect |
| - | - |
| **Upgrade** | Immediately once the invoice is paid. New features and increased limits are available right away, with prorated charges calculated automatically |
| **Downgrade** | At the end of your current billing period, so you keep the features you've already paid for |
| **Cancel** (select the **Free** plan) | At the end of your current billing period; your AI agent keeps working until then, and no future charges are processed |

<Info>
  You can undo a cancellation before the period ends by selecting a paid plan again from the same settings page.
</Info>

### Uninstalling the integration

1. Go to your Vercel dashboard.
2. Navigate to **Integrations → Chatbase**.
3. Click **Manage → Remove Integration**.
4. Confirm removal.

<Warning>
  Removing the integration immediately stops the AI agent appearing on your Vercel deployments. Redeploy after removing environment variables.
</Warning>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Chat bubble not appearing after installation">
    **Possible causes:**

    * The project hasn't been redeployed since the environment variables were injected
    * `NEXT_PUBLIC_CHATBOT_ID` is missing or not enabled for all environments
    * A JavaScript error is preventing the embed script from loading
    * A cached version of the page is being served

    **Solutions:**

    * Redeploy: go to **Deployments**, select the latest, and click **Redeploy**
    * Check **Settings → Environment Variables** and confirm `NEXT_PUBLIC_CHATBOT_ID` is present and enabled everywhere
    * Open DevTools (F12) and look for Chatbase-related errors, confirming the embed script loads
    * Hard refresh (Ctrl+Shift+R / Cmd+Shift+R) or try an incognito window
  </Accordion>

  <Accordion title="Integration installation failed">
    **Possible causes:**

    * A partial or corrupted install
    * Insufficient permissions on the Vercel team or project

    **Solutions:**

    * Remove and reinstall: **Integrations → Chatbase → Manage → Remove Integration**, then reinstall from the Marketplace
    * Ensure you have admin access to the Vercel team or project, and that your Vercel account is properly authenticated
    * If issues persist, contact [Chatbase Support](https://chatbase.co/help) with your Vercel project ID and integration details
  </Accordion>

  <Accordion title="Environment variables not taking effect">
    **Possible cause:** environment variables are injected at build time, so changes need a new deployment.

    **Solutions:**

    * Make your environment variable changes
    * Trigger a new deployment, either by pushing a commit or redeploying manually from the Vercel dashboard
    * Clear your browser cache and test again
  </Accordion>

  <Accordion title="Plan or billing issues">
    **Possible causes:**

    * The invoice never arrived, or went to spam
    * Payment is still processing
    * The change was a downgrade or cancellation, which doesn't apply immediately

    **Solutions:**

    * Check your email spam folder and verify the email address in your Vercel account settings; contact Vercel support for a resend
    * Allow up to 10 minutes for payment processing, and check payment status in the Vercel billing dashboard
    * Remember that upgrades activate immediately after payment, while downgrades and cancellations take effect at the end of the current billing period
  </Accordion>
</AccordionGroup>

## Best Practices

<CardGroup cols={2}>
  <Card title="Add Comprehensive Training Data" icon="book">
    More relevant sources produce better responses. Remove irrelevant content and fill gaps as you find them.
  </Card>

  <Card title="Test Regularly" icon="flask">
    Use the Chatbase playground to verify answer quality before and after changes.
  </Card>

  <Card title="Monitor Conversations" icon="chart-line">
    Review chat logs in the Chatbase dashboard to see what customers actually ask.
  </Card>

  <Card title="Separate Your Environments" icon="layer-group">
    Use a different AI agent for Preview and Development so test traffic never mixes with production conversations.
  </Card>
</CardGroup>

## Next steps

<CardGroup cols={2}>
  <Card title="Add Training Data Sources" icon="book" href="/docs/user-guides/chatbot/data-sources">
    Upload documents, connect websites, and add Q\&A pairs.
  </Card>

  <Card title="Customize Appearance" icon="palette" href="/docs/user-guides/chatbot/settings">
    Match your brand colors and style.
  </Card>

  <Card title="Enable Actions" icon="bolt" href="/docs/user-guides/chatbot/actions/actions-overview">
    Add lead collection, bookings, and custom workflows.
  </Card>

  <Card title="Monitor Analytics" icon="chart-line" href="/docs/user-guides/chatbot/analytics">
    Track conversations and measure performance.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.