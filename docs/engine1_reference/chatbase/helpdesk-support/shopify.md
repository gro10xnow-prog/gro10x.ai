> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Shopify Orders

> See a customer's Shopify order history right inside the ticket.

## Introduction

When your AI agent is connected to a Shopify store, the **Shopify Orders** panel appears in the ticket sidebar. It shows the order history of the person you are talking to—without leaving the Helpdesk or opening Shopify in another tab.

Use it to check what a customer bought, confirm a shipping address, look up tracking, or jump straight to the order in Shopify admin while you reply.

<Note>
  The panel only shows up when a **Shopify integration** is connected to this AI agent. If you don't see it, connect your store first—see the [Shopify integration guide](/docs/user-guides/integrations/shopify).
</Note>

## How orders are matched

The panel looks up orders using the ticket contact's details, in this order:

1. **Email** — the contact's email address is tried first.
2. **Phone** — if no orders are found by email (or there's no email on file), it falls back to the contact's phone number.

### Looking up a different customer

Sometimes the ticket contact isn't the same person who placed the order (for example, they wrote in from a different email). Use the **lookup field** at the top of the panel to search by a different email or phone number.

* Edit the field and confirm to run a new search.
* Reset it to go back to the ticket contact's original details.

## The order list

Each order shows a summary card with:

* **Order number** (e.g. `#1024`) and the date it was placed
* **Total price**
* **Status badge** for fulfillment (unfulfilled, partially fulfilled, fulfilled)

The panel heading shows how many orders the customer has, e.g. `Shopify Orders (12)`. When Shopify can't give an exact number, you'll see an estimate instead, like `Shopify Orders (12+)`.

### Load more

Only the most recent orders load at first. Click **Load more** at the bottom of the list to fetch the next batch. This continues from where the list left off, so you won't see duplicates.

## Order details

Click any order card to open its full details. From here you can see everything needed to help with the order:

* **Line items** — each product with its image, quantity, and price
* **Pricing breakdown** — subtotal, shipping, tax, discounts, and the final total
* **Shipping address** — name, full address, and phone
* **Status badges** for fulfillment and payment (paid, pending, refunded, and so on)
* **Fulfillments & tracking** — fulfillment status plus tracking number, carrier, and a link to track the shipment
* **Quick links** — open the order in **Shopify admin**, or view the customer-facing **order status page**

Use **Back** to return to the order list.

## Order data in macros

You do not have to copy these details by hand. With a store connected, [macros](/docs/user-guides/chatbot/help-desk/macros) can pull the same order in as variables, so a shipping-update reply writes itself from `{{shopify.last_order.number}}`, `{{shopify.last_order.carrier}}`, and `{{shopify.last_order.tracking_url}}`. The variable picker gains two groups, **Shopify order** and **Shopify customer**, both reading the same most-recent order this panel shows.

## Related

<Card icon="bag-shopping" href="/docs/user-guides/integrations/shopify" title="Shopify Integration">
  Connect your Shopify store to Chatbase to enable the orders panel and Shopify actions.
</Card>

<Card icon="bolt" href="/docs/user-guides/chatbot/help-desk/macros" title="Macros">
  Saved replies that can fill in order number, status, and tracking automatically.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.