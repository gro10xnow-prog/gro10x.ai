> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Macros

> Save the replies your team writes every day and insert them into any ticket from the composer.

A macro is a saved reply. You write it once, give it a name, and from then on any agent can drop it into a ticket with two clicks, edit it if the situation calls for it, and send.

Macros suit the answers your team repeats: a refund policy, a request for an order number, a "we're looking into it" holding reply, a closing line. A reply can be formatted, with headings, lists, links, and bold text, using the same toolbar as the ticket composer. A macro can also carry files, like a returns form or a size chart, that go out with the reply.

Macros are shared. Every macro belongs to one AI agent and is visible to everyone who works its Helpdesk. There are no private macros. A workspace with two AI agents keeps a separate list for each.

***

## Inserting a macro

Open a ticket and click the **Macros** button in the reply composer toolbar. It has a lightning-bolt icon and sits next to the AI compose button.

<Steps>
  <Step title="Pick a macro">
    The list is alphabetical. Once you have five or more macros a **Search macros...** box appears at the top so you can type part of a name instead of scrolling.
  </Step>

  <Step title="Read it over">
    The text lands at your cursor. If the line you are on already has text, the macro starts on a new line beneath it. Anything you have already typed stays put.
  </Step>

  <Step title="Edit and send">
    A macro is ordinary text once inserted. Trim it, add a sentence, or send it as is.
  </Step>
</Steps>

On an agent with Shopify connected, the list holds in a loading state for a moment while the order is fetched. That is on purpose: inserting early would render the order variables blank.

Macros work in both the reply and the internal note composer. If your cursor is inside a bulleted list or a code block, the inserted text takes on that block's formatting.

If you can manage macros, the bottom of the picker also offers **Add macro**, which opens the create dialog without leaving the ticket. Handy when you have just typed a reply you know you will need again.

***

## Variables

A macro can carry placeholders that fill in from the ticket at the moment you insert it. Write `{{customer.first_name}}` and the agent sees `Hi Dana,` instead of a blank to fill.

| Variable | Fills in with |
| - | - |
| `{{customer.name}}` | The customer's full name |
| `{{customer.first_name}}` | The first word of the customer's name |
| `{{customer.email}}` | The customer's email address |
| `{{human_agent.name}}` | Your full name, as set on your Helpdesk profile |
| `{{human_agent.first_name}}` | The first word of your name |
| `{{ticket.number}}` | The ticket number |

Variables resolve when the macro is inserted, using the ticket you have open and the account you are signed in with. Two agents inserting the same macro get different signatures.

In the variable picker these are grouped under **Customer**, **Human agent**, and **Ticket**.

### Shopify variables

If the AI agent has a [Shopify store connected](/docs/user-guides/chatbot/help-desk/integrations/shopify), macros can also pull in the customer's order. Two more groups appear in the picker, **Shopify order** and **Shopify customer**, and both read from the most recent order Chatbase can match to the person who opened the ticket.

That makes a shipping-update macro a one-click reply instead of a trip to the Shopify admin:

```
Hi {{customer.first_name | there}}, order {{shopify.last_order.number}} is
{{shopify.last_order.status | on its way}}. You can follow it here:
{{shopify.last_order.status_url}}
```

**Shopify order** covers the order itself.

| Variable | Fills in with |
| - | - |
| `{{shopify.last_order.number}}` | The order number |
| `{{shopify.last_order.status}}` | Fulfillment status |
| `{{shopify.last_order.status_url}}` | The customer-facing status page URL |
| `{{shopify.last_order.tracking_url}}` | Tracking URL |
| `{{shopify.last_order.tracking_number}}` | Tracking number |
| `{{shopify.last_order.carrier}}` | Shipping carrier |
| `{{shopify.last_order.items}}` | Item names, comma-separated |
| `{{shopify.last_order.total}}` | Order total with its currency |
| `{{shopify.last_order.address1}}` | Shipping address line 1 |
| `{{shopify.last_order.address2}}` | Shipping address line 2 |
| `{{shopify.last_order.city}}` | Shipping city |
| `{{shopify.last_order.province}}` | Shipping province or state |
| `{{shopify.last_order.zip}}` | Shipping zip or postal code |
| `{{shopify.last_order.country}}` | Shipping country |

**Shopify customer** covers the account the order was placed under, which is not always the person emailing you.

| Variable | Fills in with |
| - | - |
| `{{shopify.customer.name}}` | Full name on the Shopify account |
| `{{shopify.customer.first_name}}` | First name on the Shopify account |
| `{{shopify.customer.address1}}` | Default address line 1 |
| `{{shopify.customer.address2}}` | Default address line 2 |
| `{{shopify.customer.city}}` | Default address city |
| `{{shopify.customer.province}}` | Default address province or state |
| `{{shopify.customer.zip}}` | Default address zip or postal code |
| `{{shopify.customer.country}}` | Default address country |

Province and country arrive as Shopify's codes, so expect `CA` rather than `California` and `US` rather than `United States`. Write the surrounding sentence to suit: "ships to `{{shopify.last_order.city}}`, `{{shopify.last_order.province}}`" reads fine, "the great state of `{{shopify.last_order.province}}`" does not.

<Note>Tracking fields come from the first fulfillment on the order that carries any tracking at all. A split shipment with two parcels gives you one tracking number, not both. For those, paste the second from the **Shopify Orders** panel in the ticket sidebar.</Note>

With no Shopify store connected, both groups are hidden and the picker shows a **Connect Shopify** link instead. The link appears when what you are typing would have matched a Shopify variable, so searching `tracking` on an unconnected agent tells you where to go rather than returning nothing.

### Fallbacks

Not every ticket has a customer name, and not every customer has an order. Add a fallback after a `|` and it is used whenever the variable is empty:

```
Hi {{customer.first_name | there}},
```

You can chain variables. The first one with a value wins, and a plain word at the end is the last resort:

```
{{shopify.customer.first_name | customer.first_name | there}}
```

Set a fallback on every variable that might be blank, and treat every Shopify variable as one that might be. A variable with no value and no fallback stays in the reply as literal text, `{{shopify.last_order.number}}` and all. That is deliberate: it is loud enough that you catch it before sending, rather than quietly shipping "your order  has shipped". Read the inserted text before you hit send.

<Tip>Keep fallbacks generic. `there` and `your order` read fine in every ticket. A fallback like `valued customer` sounds like a form letter the moment it appears.</Tip>

***

## Formatting

The reply field in the macro dialog is the same editor as the ticket composer, with the same formatting toolbar:

* **Headings**: **Normal text**, **Heading 1**, **Heading 2**, **Heading 3**
* **Bold**, **Italic**, **Underline**, **Strikethrough**
* Links, through **Insert Link**
* **Bullet List** and **Ordered List**
* **Blockquote**, **Inline Code**, **Code Block**, and **Divider**

Markdown shortcuts work as you type for bold, italic, strikethrough, inline code, code blocks, dividers, and bulleted and numbered lists. Headings, blockquotes, and underline come from the toolbar only. Pasted Markdown keeps its formatting, and a pasted URL becomes a link.

Press **Cmd+Enter** (**Ctrl+Enter** on Windows) to save the macro without reaching for the button.

When an agent inserts the macro, the formatting comes with it into the composer, where they can change it before sending. How it reaches the customer depends on the channel:

| Channel | What the customer sees |
| - | - |
| Email | The formatting as written |
| WhatsApp, Messenger, Instagram | Plain text with the line breaks kept. Bold, links, and other styles are dropped. |

A few rules to keep in mind:

* Links must start with `http://`, `https://`, or `mailto:`. A variable can't be part of a link URL, so `https://example.com/orders/{{ticket.number}}` is rejected with **Variables can't be used in link URLs**. Put the variable in the link text or next to the link instead.
* Format a variable as a whole or not at all. A variable with bold applied to only part of it stays in the reply as literal text. Select the full `{{...}}` before you apply a style.
* Images can't be added to a macro reply. Attach them as [files](#files) instead.
* Macros saved before formatting arrived open as plain paragraphs, one per line. Edit and save one to add formatting.

***

## Files

A macro can carry up to five files. Inserting it adds them to the reply as attachments, next to the text, the same as if you had attached them yourself. In the picker and on the settings page, a paperclip and a number next to a macro show how many files it carries.

A reply holds at most five files. If the composer already has some, the macro fills the free slots and skips the rest with a **Maximum 5 attachments per message** warning. Inserting two macros, or the same macro twice, adds the files each time, so check for doubles before you send.

You cannot send until every file has finished copying in. A file that fails shows an error on its chip and the message **Some of the macro's files could not be attached**. Remove that file to send without it.

Two kinds of ticket take no attachments at all: Instagram comments, and WhatsApp conversations whose messaging window has expired when no template is selected. On those, the macro's text and tags still go in, and a warning says how many files were skipped.

***

## Managing macros

Macros live on **Settings → Helpdesk → Macros**. The page lists every macro by name with a preview of its reply, a **Search macros...** box, and a **Create macro** button. Each row has an **Edit** and **Delete** action behind its menu.

### Creating a macro

<Steps>
  <Step title="Click Create macro">
    The **New macro** dialog opens.
  </Step>

  <Step title="Name it">
    The name is how agents find the macro in the composer, so make it the thing they would search for: `Refund policy`, not `Reply 12`. Names are unique within the AI agent, ignoring case.
  </Step>

  <Step title="Write the reply">
    Type the text as you want it to land, and format it with the toolbar above the field (see [Formatting](#formatting)). Type `{{` anywhere to open the variable list, or click **Add variable** above the field. The **Add variable** popover has an **If missing, use** box, so you can set the fallback and pick the variable in one step.
  </Step>

  <Step title="Attach tags (optional)">
    Click **Add tag** under the reply field to pick the tags the ticket should receive when the macro is used. They appear on the **Adds to ticket** row, and the **×** on a chip removes one. See [Tags](/docs/user-guides/chatbot/help-desk/tags).
  </Step>

  <Step title="Attach files (optional)">
    Click **Attach files** below the reply field and pick up to five files. Each can be up to 25 MB, and any file type works. Click an image to preview it. **Create macro** stays greyed out until every upload has finished.
  </Step>

  <Step title="Click Create macro">
    The macro appears in every agent's composer straight away.
  </Step>
</Steps>

If you type a placeholder that does not match a variable, say `{{customer.phone}}`, the dialog warns you that it will be inserted as text. Nothing stops you saving it, so read the warning.

A macro needs at least a reply, a tag, or a file, so a macro that only sends a file is fine. Closing the dialog without saving throws away any files you uploaded in it.

### Editing a macro

Pick **Edit** on the row. Changes take effect for the next insertion. Replies already sent keep the old wording and the old files.

### Deleting a macro

Pick **Delete** on the row and confirm. The macro is removed for everyone on the AI agent, and there is no undo. The macro's files are deleted with it.

***

## Who can do what

| If you can | You can |
| - | - |
| View tickets | Insert any macro from the composer and browse the list in settings |
| Manage macros | Create, edit, and delete macros, including their files |

Owners can manage macros. For everyone else it is a separate permission, granted per role alongside the other Helpdesk permissions. Most support agents only need to insert. Keep the manage permission with the few people who decide how your replies should sound.

***

## Good to know

* Macros are part of the Helpdesk, so they need a plan that includes it.
* Each AI agent can hold up to 300 macros. At the cap, **Create macro** greys out and tells you why when you hover it.
* Names can run to 200 characters. A reply can run to 2,500 characters of text. Formatting doesn't count toward that limit.
* A macro can carry up to five files of up to 25 MB each.
* The variable list covers customer, agent, ticket, and Shopify fields. Anything else inside `{{ }}` stays as typed.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.