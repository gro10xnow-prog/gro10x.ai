> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Shopify

> Connect your Shopify store so your AI agent can help customers browse, buy, track orders, and manage their account

## Overview

Connect your Shopify store to Chatbase and turn your AI agent into an e-commerce assistant. Your AI agent can help customers browse products, manage their cart, place orders, track and exchange orders, and update their account details, all through natural conversation.

<Card title="What you can do:" icon="bag-shopping">
  Give shoppers a single place to find a product, add it to the cart, check out, and ask where their order is, without leaving the chat.
</Card>

<Warning>
  **You do not need to add any embed code manually.** Once you install the Chatbase Shopify app, whether from Chatbase or the Shopify App Store, the chat bubble is automatically added to your store. You do not need to copy or paste any embed script into your theme code.
</Warning>

## Before you start

* A Chatbase account with an AI agent, set to public. If you haven't built one yet, [create a free Chatbase account](https://www.chatbase.co/auth/signup) and follow [Your first AI agent](/docs/user-guides/quick-start/your-first-agent).
* A Shopify store you can install apps on.

## Integration methods

You can connect your Shopify store to Chatbase in two ways:

| Feature | Via Chatbase (Recommended) | Via Shopify Marketplace |
| - | - | - |
| Billing | Through Chatbase | Through Shopify |
| 7-day free trial | Available | Not available |
| Available add-ons | Auto recharge credits, Extra AI agents, Custom Domains, Remove 'Powered By Chatbase' | Auto recharge credits only |
| Number of AI agents | Multiple AI agents (only a single AI agent connected to the Shopify store) | Single AI agent per account |
| Setup location | Chatbase Dashboard | Shopify App Store |

<Note>
  We recommend connecting via Chatbase for full access to all features and add-ons.
</Note>

## Method 1: Connect via Chatbase (Recommended)

This method gives you access to all Chatbase features and add-ons, and you can start a 7-day free trial.

<Steps>
  <Step title="Find the Shopify integration">
    1. Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select the AI agent you want to connect to Shopify.
    2. Open the Shopify connection flow in either of these ways. Both lead to the same store connection step below:
       * Click **Channels** from the sidebar, then click **Setup** on the **Shopify** card.
       * Or, click **Integrations** from the sidebar, then click **Connect** on the **Shopify** card.
  </Step>

  <Step title="Connect your store">
    1. Enter your Shopify store name, which is the subdomain of your myshopify.com URL. For example, if your store is at `mystore.myshopify.com`, enter `mystore`.
    2. Click **Submit** to start the authorization process.
    3. Shopify will ask you to authorize Chatbase. Review the requested permissions and click **Install**.
    4. Once authorized, you'll be redirected back to Chatbase with a confirmation message.
  </Step>

  <Step title="Manage your integration">
    On the Channels page, click **Manage** on the Shopify card.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kRgbduNouxB30eyE/user-guides/integrations/images/shopify/shopify-11.png?fit=max&auto=format&n=kRgbduNouxB30eyE&q=85&s=e044fc40e54c3c2cc443b63d753fe613" alt="The Manage button on the Shopify card" width="2102" height="1004" data-path="user-guides/integrations/images/shopify/shopify-11.png" />
    </Frame>

    Make sure the toggle at the top right of the page is on. Then choose the theme your website is currently using, open your Shopify theme editor, and make sure the **Chatbase** app toggle is on.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kRgbduNouxB30eyE/user-guides/integrations/images/shopify/shopify-manage-1.png?fit=max&auto=format&n=kRgbduNouxB30eyE&q=85&s=43dd4947c5e7f0b11e3ccc7eaf764a32" alt="The Shopify manage page with the toggle switched on at the top right" width="2410" height="1036" data-path="user-guides/integrations/images/shopify/shopify-manage-1.png" />
    </Frame>

    <Frame>
      <img src="https://mintcdn.com/chatbase/kRgbduNouxB30eyE/user-guides/integrations/images/shopify/shopify-manage-2.png?fit=max&auto=format&n=kRgbduNouxB30eyE&q=85&s=fcb7dc794ac8db52a34fd7ef6f264064" alt="Choosing the live theme and opening the Shopify theme editor" width="2372" height="1316" data-path="user-guides/integrations/images/shopify/shopify-manage-2.png" />
    </Frame>
  </Step>
</Steps>

***

## Method 2: Connect via Shopify Marketplace

Choose this method if you prefer to manage billing through Shopify. This option has limited add-ons, allows only a single AI agent, and does not include the 7-day free trial.

<Steps>
  <Step title="Install the Chatbase app">
    1. Go to the **Chatbase** app listing on the [Shopify App Store](https://apps.shopify.com/chatbase).
    2. Click **Install**.
    3. Review the permissions Chatbase requires and click **Install** to approve.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kRgbduNouxB30eyE/user-guides/integrations/images/shopify/shopify-install-permissions.png?fit=max&auto=format&n=kRgbduNouxB30eyE&q=85&s=16770ec6840ce5933731aa831311ab6f" alt="The Shopify Install app dialog listing the permissions Chatbase needs" width="1216" height="972" data-path="user-guides/integrations/images/shopify/shopify-install-permissions.png" />
    </Frame>
  </Step>

  <Step title="Complete setup">
    1. After installation, you'll be redirected to the Chatbase onboarding process to finish setting up your account.
    2. Follow the prompts to configure your AI agent.
  </Step>

  <Step title="Manage your integration">
    On the Channels page, click **Manage** on the Shopify card.

    Make sure the toggle at the top right of the page is on. Then choose the theme your website is currently using, open your Shopify theme editor, and make sure the **Chatbase** app toggle is on.
  </Step>
</Steps>

<Warning>
  Accounts created through the Shopify Marketplace are limited to a single AI agent and do not include the 7-day Chatbase free trial. For multiple AI agents, additional add-ons, or the free trial, use Method 1 instead.
</Warning>

<Check>
  Open your storefront and confirm the chat bubble appears and your AI agent responds. If you can't see the AI agent on your website, check the toggle in either of these places:

  * Click **Channels** from the sidebar and open **Chat bubble**. In the **Overview** tab, make sure the **Visibility** toggle is switched on.
  * Or, on the **Channels** page, click **Manage** on the Shopify card and make sure the toggle at the top right of the page is on.
</Check>

<Frame>
  <img src="https://mintcdn.com/chatbase/kRgbduNouxB30eyE/user-guides/integrations/images/shopify/shopify-visibility.png?fit=max&auto=format&n=kRgbduNouxB30eyE&q=85&s=3f5c37139363fc955c375ec8f020f61e" alt="The Visibility toggle in the Chat bubble Overview tab" width="1376" height="1268" data-path="user-guides/integrations/images/shopify/shopify-visibility.png" />
</Frame>

## Limitations

* **One AI agent per store.** Even on the Chatbase method, where you can have multiple AI agents, only a single AI agent connects to the Shopify store.
* **Marketplace accounts are capped at one AI agent**, have access to auto recharge credits only, and do not include the 7-day free trial.

## Next steps

Once your store is connected, enable the **actions** that let your AI agent help customers with product search, order lookups, cart management, and more.

<Frame>
  <img src="https://mintcdn.com/chatbase/kRgbduNouxB30eyE/user-guides/integrations/images/shopify/shopify-actions-1.png?fit=max&auto=format&n=kRgbduNouxB30eyE&q=85&s=1f7879e7faa9073291b413a95596f3a4" alt="The first half of the Shopify actions list: Retrieve and display products, Update cart, Create order, Create exchange (new order), and Create return or exchange (same order)" width="1768" height="1104" data-path="user-guides/integrations/images/shopify/shopify-actions-1.png" />
</Frame>

<Frame>
  <img src="https://mintcdn.com/chatbase/kRgbduNouxB30eyE/user-guides/integrations/images/shopify/shopify-actions-2.png?fit=max&auto=format&n=kRgbduNouxB30eyE&q=85&s=5b4faf8725600edbd4fd3ac03339c5f5" alt="The second half of the Shopify actions list: Get cart, Retrieve and display orders, Update customer profile, Update billing address, Check account, and Tag an order" width="1774" height="1106" data-path="user-guides/integrations/images/shopify/shopify-actions-2.png" />
</Frame>

<Note>
  With the **Retrieve and display products** action enabled, you don't need to train your AI agent on your product or collection pages. The action syncs your catalog directly from Shopify, so exclude `/products` and `/collections` from your website training source. See [Sync your products](/docs/user-guides/chatbot/actions/shopify-actions#sync-your-products).
</Note>

<Card icon="bolt" href="/docs/user-guides/chatbot/actions/shopify-actions" title="Shopify Actions">
  Configure and use Shopify actions to help customers browse products, manage their cart, place orders, return and exchange items, track deliveries, and update their account information.
</Card>

<iframe width="100%" height="400" src="https://www.youtube.com/embed/A-5U72lw7Hk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen />


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.