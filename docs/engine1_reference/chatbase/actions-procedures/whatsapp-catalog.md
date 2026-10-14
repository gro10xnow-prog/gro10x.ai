> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# WhatsApp Catalog

> Show your Shopify products as native WhatsApp product cards with cart support

## Overview

WhatsApp Catalog lets your AI agent send product cards directly inside WhatsApp conversations. When a customer asks to see products, instead of plain text links they receive native WhatsApp product cards they can browse, add to a cart, and order from, all without leaving the chat.

This feature connects your Shopify product catalog to WhatsApp through Meta's commerce infrastructure. Products sync from Shopify to a Meta catalog, which WhatsApp then uses to render native product cards.

<Info>
  **Prerequisites:**

  * Your [Shopify integration](/docs/user-guides/integrations/shopify) must be set up.
  * The [Retrieve and display products](/docs/user-guides/chatbot/actions/shopify-actions#1-retrieve-and-display-products) action must be enabled on your AI agent.
  * Your [WhatsApp channel](/docs/user-guides/integrations/whatsapp) must be connected.
</Info>

## Setup

The setup involves six parts: installing Meta's Facebook & Instagram app on Shopify, creating a Meta catalog, publishing your products, assigning Chatbase as a partner, connecting the catalog in WhatsApp Manager, and confirming the connection in Chatbase.

### Part 1: Install the Facebook & Instagram app on Shopify

<Steps>
  <Step title="Open the Shopify App Store">
    Go to the [Facebook & Instagram app](https://apps.shopify.com/facebook) on the Shopify App Store and click **Install**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/shopify-app-store.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=1ec1938fb81212f201d01297b8531d1f" alt="Facebook & Instagram app on the Shopify App Store" width="1682" height="1238" data-path="images/whatsapp-catalog/shopify-app-store.png" />
    </Frame>
  </Step>

  <Step title="Approve permissions">
    Review the permissions the app needs (customer data, staff data, store data) and click **Install**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/install-app.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=3e641efaa999a8ddd44cfd81fc82c36e" alt="Install app permissions dialog" width="871" height="684" data-path="images/whatsapp-catalog/install-app.png" />
    </Frame>
  </Step>

  <Step title="Get started">
    Once installed, the app opens in your Shopify admin. Click **Get started**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/get-started.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=715ff3d66996a625a9826108e6e2c4b8" alt="Facebook & Instagram Get started page" width="2000" height="1217" data-path="images/whatsapp-catalog/get-started.png" />
    </Frame>
  </Step>
</Steps>

### Part 2: Connect your Meta account and create a catalog

<Steps>
  <Step title="Connect your account">
    Connect your Facebook profile and choose the business portfolio that owns your products. If you don't have one, click **Create new**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/connect-account.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=32d00651a7cab1bb92b7979a025b14c7" alt="Connect business portfolio" width="2000" height="1217" data-path="images/whatsapp-catalog/connect-account.png" />
    </Frame>
  </Step>

  <Step title="Create a catalog">
    Expand the **Catalog** section and click **Create catalog**. This creates a Meta product catalog that your Shopify products will sync to.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/create-catalog.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=c2084b1819a92dac3e695cb62f379a4e" alt="Create catalog in Meta" width="2000" height="1218" data-path="images/whatsapp-catalog/create-catalog.png" />
    </Frame>
  </Step>

  <Step title="Choose data sharing preference">
    Expand **Data sharing** and choose your preferred level (Conservative, Enhanced, or Maximum). This controls how customer activity data is shared with Meta. Click **Save**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/data-sharing.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=870ad4018117d0d1f031b3bc79076e5a" alt="Data sharing preference dialog" width="790" height="936" data-path="images/whatsapp-catalog/data-sharing.png" />
    </Frame>
  </Step>

  <Step title="Submit for review">
    Once all sections show a green checkmark (Facebook profile, Business portfolio, Catalog, Data sharing, Terms and conditions), click **Submit for review**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/submit-review.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=bdca43734e4a9c08f3a9fc077db7f195" alt="All sections complete, submit for review" width="2000" height="1213" data-path="images/whatsapp-catalog/submit-review.png" />
    </Frame>
  </Step>

  <Step title="Wait for setup to finalize">
    The channel setup takes several minutes. Do not refresh the page. Once it finishes, the **Overview** tab appears.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/finalizing-setup.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=2dfb3f5ddf34c04f778eef9fd6581817" alt="Finalizing channel setup progress bar" width="2000" height="1215" data-path="images/whatsapp-catalog/finalizing-setup.png" />
    </Frame>
  </Step>
</Steps>

### Part 3: Publish your products to the Meta catalog

<Steps>
  <Step title="Click Publish products">
    On the Facebook & Instagram **Overview** page, find the **Product Status** card and click **Publish products**. This opens the Shopify Products page.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/publish-products.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=504b7c6d19373fcf5690cc06b1baf71d" alt="Product Status card with Publish products button" width="2000" height="1216" data-path="images/whatsapp-catalog/publish-products.png" />
    </Frame>
  </Step>

  <Step title="Select all products">
    On the Products page, click the checkbox in the header row, then click **Select all results** to select every product in your store.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/select-all-products.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=d7755676f8653abb7afbf3f283f8ced7" alt="Select all results in Shopify Products" width="2000" height="1216" data-path="images/whatsapp-catalog/select-all-products.png" />
    </Frame>
  </Step>

  <Step title="Include in sales channels">
    Click the **...** menu, then **Include in sales channels**. In the dialog that appears, check **Facebook & Instagram** and click **Include products**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/include-sales-channels.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=d496057740b4006995a4c91938991a08" alt="Include in sales channels menu option" width="2000" height="1216" data-path="images/whatsapp-catalog/include-sales-channels.png" />
    </Frame>

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/select-fb-instagram-channel.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=d38ca0fb08fd05f7be0e04bf6e73ec7f" alt="Select Facebook & Instagram channel" width="2000" height="1222" data-path="images/whatsapp-catalog/select-fb-instagram-channel.png" />
    </Frame>
  </Step>

  <Step title="Verify products are syncing">
    Go back to the Facebook & Instagram app in Shopify. Expand **Connected Product Catalog** to see your catalog details and confirm products are syncing.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/connected-catalog.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=0ebbed402fba216ecc2ccea356f9a267" alt="Connected Product Catalog section" width="2000" height="1215" data-path="images/whatsapp-catalog/connected-catalog.png" />
    </Frame>

    You can also verify in [Meta Commerce Manager](https://business.facebook.com/commerce/) by navigating to your catalog's **Data sources** section. The product count should match your Shopify store.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/commerce-manager-synced.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=03e6f740cf89b371b5e422e70a88fac1" alt="Commerce Manager showing synced products" width="1994" height="1319" data-path="images/whatsapp-catalog/commerce-manager-synced.png" />
    </Frame>
  </Step>
</Steps>

<Warning>
  **Products showing 0 in Commerce Manager?** The initial sync can take a few minutes. If products still don't appear after waiting, go back to Shopify **Products**, select all products, click **...** > **Add tags**, add any tag (e.g. `sync-fix`), and save. Adding or removing a tag triggers Shopify to re-push the products to Meta. You can remove the tag afterwards.
</Warning>

<Frame>
  <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/commerce-manager-zero.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=70fbf897d30784ec788a4f7657351aa5" alt="Commerce Manager showing 0 products" width="2000" height="1311" data-path="images/whatsapp-catalog/commerce-manager-zero.png" />
</Frame>

<Frame>
  <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/add-tag-dialog.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=ba4e94afb9df86ab81f7eccdf1491603" alt="Add tag dialog to trigger sync" width="2000" height="1216" data-path="images/whatsapp-catalog/add-tag-dialog.png" />
</Frame>

### Part 4: Assign Chatbase as a partner

Chatbase needs partner access to your Meta catalog to serve products through WhatsApp.

<Steps>
  <Step title="Open Meta Business Settings">
    Go to [Meta Business Settings](https://business.facebook.com/settings/) and navigate to **Data sources > Catalogues** in the left sidebar. Select your Shopify Product Catalog.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/meta-catalogues.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=d2ddc58ddff3ae887fe674516aeca16b" alt="Meta Business Settings Catalogues page" width="2000" height="1141" data-path="images/whatsapp-catalog/meta-catalogues.png" />
    </Frame>
  </Step>

  <Step title="Assign Chatbase as a partner">
    Click **Assign partner**, choose **Business ID**, and enter Chatbase's Business ID:

    ```
    918723022608702
    ```

    Give **Partial access** and confirm.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/assign-partner.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=71e42c9e83973da50b01697180ab4142" alt="Assign partner dialog with Business ID option" width="2000" height="1147" data-path="images/whatsapp-catalog/assign-partner.png" />
    </Frame>
  </Step>
</Steps>

### Part 5: Confirm the connection in Chatbase

<Steps>
  <Step title="Open the Show Products action">
    In your [Chatbase dashboard](https://www.chatbase.co/dashboard/), go to **Build > Actions** and open the **Shopify get products** action. Scroll down to the **WhatsApp Catalog** section. You'll see the setup steps listed for each WhatsApp Business Account (WABA). Click **Check now** or wait for it to refresh automatically.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/chatbase-catalog-steps.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=cb9c1bbc1f4b138ecf6bfc2648ec1624" alt="Chatbase WhatsApp Catalog section with setup steps" width="2000" height="1141" data-path="images/whatsapp-catalog/chatbase-catalog-steps.png" />
    </Frame>
  </Step>
</Steps>

### Part 6: Connect the catalog in WhatsApp Manager

<Steps>
  <Step title="Open WhatsApp Manager">
    Once the partner assignment is detected, Chatbase shows a **Connect in WhatsApp Manager** button next to your WhatsApp number. Click it to open WhatsApp Manager.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/chatbase-connect-whatsapp.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=e2d84e8b959cd1aad7c085a860eedd07" alt="Chatbase showing Connect in WhatsApp Manager button" width="2000" height="1138" data-path="images/whatsapp-catalog/chatbase-connect-whatsapp.png" />
    </Frame>
  </Step>

  <Step title="Go to Catalogue">
    In WhatsApp Manager, navigate to **Account tools > Catalogue** in the left sidebar. Make sure you are viewing the correct WhatsApp Business Account (WABA) in the top-right dropdown. Click **Choose a Catalogue**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/whatsapp-manager-catalogue.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=8a68b8e9ec76abe315f8f0b9b73e2bce" alt="WhatsApp Manager Catalogue page" width="2000" height="1145" data-path="images/whatsapp-catalog/whatsapp-manager-catalogue.png" />
    </Frame>
  </Step>

  <Step title="Select and connect your catalog">
    In the **Connect a catalogue** dialog, search for your Shopify Product Catalog, select it, and click **Connect Catalogue**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/connect-catalogue-selected.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=ee50bb5f11761a9264dc6560fd8b9f0f" alt="Connect a catalogue dialog with catalog selected" width="2000" height="1140" data-path="images/whatsapp-catalog/connect-catalogue-selected.png" />
    </Frame>
  </Step>

  <Step title="Catalogue connected">
    You'll see a confirmation toast: **Catalogue successfully connected**. The page now shows your catalog details and options for showing the catalogue icon in the chat header and the "Add to basket" button.

    <Frame>
      <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/catalogue-connected.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=b7a93f7a51c88d1795ba4d63b741f204" alt="Catalogue successfully connected in WhatsApp Manager" width="2000" height="1140" data-path="images/whatsapp-catalog/catalogue-connected.png" />
    </Frame>
  </Step>
</Steps>

### Part 7: Wait for Meta review

Return to the **Shopify get products** action in Chatbase. The WhatsApp Catalog section now shows **In review** for your WhatsApp number. Meta reviews the products that were pushed from Shopify. This is part of Meta's standard review process and may take some time.

<Frame>
  <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/chatbase-in-review.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=a89999b13fa1cfe2e8aaee8b4954d102" alt="Chatbase showing catalog In review status" width="2000" height="1136" data-path="images/whatsapp-catalog/chatbase-in-review.png" />
</Frame>

Once Meta approves the catalog, the status changes to **Connected**. Your AI agent will now send native WhatsApp product cards with cart support when the Show Products action is triggered.

<Frame>
  <img src="https://mintcdn.com/chatbase/SshlV6jouna8lZa9/images/whatsapp-catalog/chatbase-connected.png?fit=max&auto=format&n=SshlV6jouna8lZa9&q=85&s=cd7257961ec15d5b5b66998b3f59b636" alt="Chatbase showing catalog Connected status" width="2000" height="1141" data-path="images/whatsapp-catalog/chatbase-connected.png" />
</Frame>

<Check>
  Test the integration by opening a WhatsApp conversation with your AI agent and asking to see products. The AI agent should respond with native product cards that customers can browse and add to a cart.
</Check>

## How it works

Once connected, the **Retrieve and display products** action automatically detects the WhatsApp channel and sends products as native WhatsApp catalog cards instead of plain text. Customers can:

* Browse product cards with images, titles, and prices
* Add items to a WhatsApp cart
* Send the cart to your AI agent to continue to checkout

### How the WhatsApp cart and the chat cart work together

Customers can fill their cart two ways: by tapping **Add to cart** on the catalog cards, or by asking the AI agent in chat (for example, "add two of these to my cart"), which uses the [Update cart](/docs/user-guides/chatbot/actions/shopify-actions#2-update-cart) action. Both end up in the same Shopify cart, but they don't show up in the same places:

* **Items added in chat don't appear in the WhatsApp catalog cart.** WhatsApp's cart only exists on the customer's phone, and Meta doesn't let businesses add items to it. Items the AI agent adds are saved to the Shopify cart, not the WhatsApp cart.
* **Items from the WhatsApp cart reach the Shopify cart once the customer sends it.** Chatbase adds the items the customer sent to the same Shopify cart the AI agent uses. Sending the cart doesn't place an order by itself. The AI agent picks up from there, and the order is placed with [Create order](/docs/user-guides/chatbot/actions/shopify-actions#4-create-order).
* **"View my cart" shows everything.** When the customer asks to see their cart, the [Get cart](/docs/user-guides/chatbot/actions/shopify-actions#3-get-cart) action lists every product in one place, whether it was added in chat or sent from the WhatsApp cart.

<Tip>
  Enable **Update cart**, **Get cart**, and **Create order** along with **Retrieve and display products** on your WhatsApp channel. Customers can then move between the catalog cards and the chat and still check out in one order.
</Tip>

Product data stays in sync with your Shopify store through the Meta catalog. Changes in Shopify (price updates, new products, stock changes) sync to Meta automatically, though it may take a few minutes.

## Troubleshooting

<AccordionGroup>
  <Accordion title="Products show 0 in Meta Commerce Manager">
    The initial sync from Shopify to Meta can take several minutes. If products still show 0 after waiting, go to **Shopify Admin > Products**, select all products, and use **... > Add tags** to add a temporary tag (e.g. `sync-fix`). This triggers Shopify to re-push the product data. You can remove the tag afterwards.
  </Accordion>

  <Accordion title="Catalog not appearing in WhatsApp Manager">
    Make sure you assigned Chatbase as a partner (Business ID `918723022608702`) with **Partial access** in [Meta Business Settings > Catalogues](https://business.facebook.com/settings/). Also verify you are viewing the correct WhatsApp Business Account (WABA) in the WhatsApp Manager dropdown.
  </Accordion>

  <Accordion title="Status stuck on 'In review'">
    Meta reviews catalog products before they can be served on WhatsApp. This is a standard Meta review process and is outside of Chatbase's control. Review times vary. Ensure your products comply with [Meta's commerce policies](https://www.facebook.com/policies/commerce/).
  </Accordion>

  <Accordion title="'No catalog shared' still showing in Chatbase">
    After assigning the partner in Meta Business Settings, return to the **Shopify get products** action in Chatbase and click **Check now** to refresh the status. It may take a moment for Meta to propagate the partner assignment.
  </Accordion>
</AccordionGroup>

## Related

<CardGroup cols={2}>
  <Card icon="bag-shopping" href="/docs/user-guides/chatbot/actions/shopify-actions#1-retrieve-and-display-products" title="Retrieve and display products">
    Configure the Show Products action that powers WhatsApp Catalog.
  </Card>

  <Card icon="whatsapp" href="/docs/user-guides/integrations/whatsapp" title="WhatsApp integration">
    Set up your WhatsApp channel connection.
  </Card>

  <Card icon="shopify" href="/docs/user-guides/integrations/shopify" title="Shopify integration">
    Connect your Shopify store to Chatbase.
  </Card>

  <Card icon="book" href="https://developers.facebook.com/documentation/business-messaging/whatsapp/catalogs/catalogs-overview/" title="Meta Catalogs documentation">
    Official Meta documentation on WhatsApp catalogs.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.