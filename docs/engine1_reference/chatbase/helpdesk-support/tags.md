> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Tags

> Label tickets with your own keywords, then filter the inbox and build saved views around them.

A tag is a short label you stick on a ticket, like `refund-request`, `billing`, `bug-report`, or `vip`. You decide what the labels mean.

Tags are descriptive. They record something about a ticket without touching its status, assignee, or routing. That makes tags the place to capture whatever the built-in fields do not, so you can answer questions like "how much of this week's volume was shipping complaints?" or keep a saved view of every ticket your team flagged as a bug.

A few things teams commonly tag for:

* A reason for contact that the ticket subject does not make obvious.
* A product area or feature, so the right specialist can find the queue.
* A one-off situation worth tracking, like an outage or a botched shipment batch.

Tags belong to one AI agent. If your workspace runs two agents, each keeps its own list, and a tag made in one does not show up in the other.

***

## Tagging a ticket

Open a ticket and look for the **Tags** row in the **Ticket Details** section of the right-hand panel, just below the status.

<Steps>
  <Step title="Click + Add">
    The button sits at the end of the tag row.
  </Step>

  <Step title="Pick a tag">
    Start typing to narrow the list, then click the tag you want. It appears as a chip on the ticket right away.
  </Step>

  <Step title="Add more if you need to">
    The list stays open after each pick, so you can apply several tags in a row. Click anywhere outside it when you are finished.
  </Step>
</Steps>

If nothing in the list matches what you typed, you may see a **Create "your-name"** option at the bottom. Clicking it makes the tag and applies it in one go. That option only appears if you are allowed to manage tags. If you are not, you will see a note asking you to check with an admin instead.

To take a tag off a ticket, click the **×** on its chip. That only affects this ticket. The tag itself stays available for everyone else.

Chips stay in the order you added them, so a new one goes on the end instead of shuffling the row. Past five chips the rest tuck behind a **+n** counter, with **Show more** to see them all.

A ticket can hold up to 20 tags. At that point **+ Add** greys out and tells you why when you hover it.

***

## Tagging tickets automatically

A [create ticket action](/docs/user-guides/chatbot/actions/escalate-to-human#tags) can tag the tickets it opens. You add up to five tags to the action and describe when each one applies, and the AI agent adds the tags that fit as it creates the ticket.

Tags added this way work like any other. You can remove them from the ticket, and filters and saved views pick them up.

***

## Naming tags

Tag names are tidied up as you type so the list stays consistent and searchable. Three things happen:

* Capitals become lowercase.
* Spaces become hyphens.
* Only letters, numbers, hyphens, and underscores are allowed. Anything else is rejected, so you never end up with a mangled name.

Type `Refund Request` and you get `refund-request`. Type `50% off` and you are told to *Use only letters, numbers, hyphens and underscores*.

Names can run to 50 characters and have to be unique within the AI agent. Archived tags still hold onto their names, so if a name looks taken but you cannot see the tag anywhere, it is probably sitting in the archive.

<Tip>Short and predictable beats descriptive. `refund-request` is easier for the whole team to remember and search than `customer-asked-for-a-refund`.</Tip>

***

## Filtering by tag

Once tickets are tagged, **Tags** is available as a field in the [filter builder](/docs/user-guides/chatbot/help-desk/filters), both for a quick look at the inbox and inside a [saved view](/docs/user-guides/chatbot/help-desk/saved-views).

| Operator | Shows you |
| - | - |
| `is any of` | Tickets carrying at least one of the tags you picked |
| `is none of` | Tickets carrying none of the tags you picked |

Alongside your tags, the list offers **Untagged**, which matches tickets with no tags at all. Handy for spotting work your team forgot to label. You can mix it in: picking `billing` and `Untagged` together returns both groups.

<Note>A tag filter always means "at least one of these", never "all of these". To find tickets that have both `billing` and `vip`, add two separate conditions, one per tag. Conditions in a filter are combined with AND, so the ticket has to satisfy every one.</Note>

Saving a filter as a view is what makes tags pay off. A view like *Tags is any of `bug-report`* gives your team a standing queue they can open every morning.

***

## Managing the tag list

Admins manage tags on **Settings → Helpdesk → Tags**. The page lists every tag with the number of tickets currently carrying it, so you can see at a glance which labels your team actually uses and which ones never caught on.

### Creating a tag

Type the name into the **Search or create a tag** box, then click **Create** or press <kbd>Enter</kbd>.

The same box searches the list below it, so if the name already exists you will see it appear rather than a create option, along with a note saying *This tag already exists*. Press <kbd>Escape</kbd> to clear the box.

### Renaming a tag

Click the tag name, or the pencil icon on its row, and type the new one. <kbd>Enter</kbd> saves, <kbd>Escape</kbd> cancels.

A rename carries everywhere. Every ticket holding the tag and every saved view filtering on it follows the new name, so you can clean up a naming mess without breaking anyone's queue.

### Archiving a tag

Tags are archived rather than deleted. Archiving retires a tag without touching your history, and you can undo it at any time.

Once a tag is archived:

* Nobody can add it to new tickets. It drops out of the picker.
* Tickets already carrying it keep it, and saved views filtering on it keep working.
* Its name stays reserved, so nobody creates a confusing near-duplicate.

Archived tags sit under an **Archived** toggle below the main list. Click the restore icon on a row to bring one back.

<Tip>Reach for archive when a tag has run its course, like a label for an incident that is now resolved. Your saved views keep working, and the tag quietly stops appearing in front of agents.</Tip>

### Running into an archived tag

If a tag was archived after someone applied it, it stays on that ticket as a dashed chip with a small archive icon. Click the chip and you get a short explanation plus two choices: bring the tag back into use for everyone, or drop it from this one ticket. If you cannot manage tags yourself, the panel points you to the settings page so you can ask an admin.

You will also meet archived tags in the picker. Type an archived tag's name in full and it shows up marked `archived`, with an option to restore and apply it in one step. Typing part of the name will not surface it, which keeps retired labels out of the way during everyday searching.

***

## Who can do what

| If you can | You can |
| - | - |
| View tickets | See tags and filter the inbox by them |
| Edit tickets | Add and remove tags on a ticket |
| Manage tags | Create, rename, archive, and restore tags |

Most support agents fall into the middle row. They can label tickets freely using the tags that exist, but cannot invent new names or bring archived ones back. That keeps the list from sprawling while still letting everyone tag their work.

If you open **Settings → Helpdesk → Tags** without tag management access, the page tells you so rather than showing the list.

***

## Good to know

* Archived tags are drawn with a dashed border so they stand out from the rest.
* Tags are internal. Customers never see them, in the chat widget or anywhere else.
* When a teammate tags a ticket you have open, the change appears without a refresh.
* Each AI agent can hold up to 500 tags.
* Deleting an AI agent deletes its tags along with it.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.