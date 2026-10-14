> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CSAT surveys

A CSAT survey is a short email that goes out after a ticket is closed. It asks the person who opened the ticket to rate the support they got, using the rating scale you choose: **Thumbs**, **Stars**, or **Smileys**. Clicking a rating opens a page where the person confirms it and can leave a comment.

The answer lands back on the ticket, next to the requester, and rolls up into a CSAT score in Helpdesk analytics. Each answer is credited to the teammate who was assigned to the ticket when it was closed.

Surveys are off until you turn them on, and each AI agent has its own settings. A workspace with two agents configures them separately.

***

## How a survey goes out

Closing a ticket is what starts a survey. Moving a ticket to **Cancelled** never does.

<Steps>
  <Step title="The ticket is closed">
    Any way of closing counts: the status picker on the ticket, a bulk status change in the inbox, or a conversation that ends and closes its ticket.
  </Step>

  <Step title="Chatbase waits">
    The **Send after** delay gives the team time to undo a close made by mistake. Reopening the ticket before the delay is up cancels the survey: with the delay set to two hours, a ticket closed by accident and reopened inside those two hours is never surveyed. Closing it again later starts the wait over.
  </Step>

  <Step title="The ticket is checked">
    When the delay is up, the ticket is checked against the rules below. A ticket that fails a check is recorded as not surveyed, with the reason, so coverage stays honest.
  </Step>

  <Step title="The email is sent">
    One email goes to the address on the ticket, from the sender you chose. The links inside work for 30 days.
  </Step>
</Steps>

A ticket is not surveyed when:

* **The channel cannot receive email.** Tickets from WhatsApp, Messenger, Instagram, and Facebook or Instagram comments are left out. They also do not count against coverage.
* **There is no email address on the ticket.** Widget tickets where no address was collected, for example.
* **Nobody replied.** A teammate or the AI agent must have sent at least one reply. Closing an untouched ticket does not trigger a survey.
* **The ticket carries an excluded tag.** Tags are checked when the email would go out, so tagging a ticket right after closing it still stops the survey.
* **The same address was surveyed recently**, within the cooldown set under [Timing](#timing).
* **The conversation went quiet long ago**, beyond the activity window set under [Timing](#timing).
* **The ticket was reopened** before the email went out.

A ticket is surveyed at most once, ever. If it is reopened and closed again after the email went out, no second email is sent. If it was skipped the first time, closing it again runs the checks again and can send the survey then.

***

## Turning surveys on

Open the AI agent, go to **Settings**, then **Helpdesk**, then **CSAT Surveys**. You need permission to edit the agent's settings to save changes here; anyone who can read the Helpdesk can view them. If the Helpdesk is not set up for the agent yet, the page shows **Measure customer satisfaction** with an **Enable** button.

<Steps>
  <Step title="Review the settings">
    The defaults work for most teams: a 10-minute delay, a 7-day activity window, a 7-day cooldown, the agent's no-reply address as the sender, and a ready-made email with the **Thumbs** scale.
  </Step>

  <Step title="Flip the switch">
    The switch in the top-right corner of the **Satisfaction surveys** card turns sending on. The word beside it shows the current state: **Draft** for a configuration that has never been enabled, **Enabled**, or **Disabled**.
  </Step>

  <Step title="Save">
    Nothing changes until you click **Save** at the bottom of the page. One **Save** covers both the settings and the survey email. From then on, every ticket closed while the switch is on is considered for a survey.
  </Step>
</Steps>

Turning the switch off pauses sending and keeps everything else: the settings, the answers already collected, and the analytics.

<Frame>
  <img src="https://mintcdn.com/chatbase/P3ZJITOwrAz68fIt/user-guides/images/help-desk/satisfaction/settings-surveys.png?fit=max&auto=format&n=P3ZJITOwrAz68fIt&q=85&s=07d15d036280c0d6ac84a6db51ea09bf" alt="The Satisfaction surveys card with the switch, delay, activity window, cooldown and excluded tags" width="1632" height="780" data-path="user-guides/images/help-desk/satisfaction/settings-surveys.png" />
</Frame>

***

## Settings

### Timing

| Setting | Default | Range | What it does |
| - | - | - | - |
| **Send after** | 10 minutes | 1 minute to 2 hours | How long after a ticket is closed the email goes out. |
| **Only survey conversations active in the last** | 7 days | 1 to 90 days | Tickets whose last message is older than this are not surveyed. |
| **Do not survey the same address again for** | 7 days | 0 to 365 days | One survey per email address in this window, across all their tickets. |

### Skip tickets tagged

Tickets carrying any of the selected tags are never surveyed. Pick up to 50 tags; the field reads **No tags excluded** when none are picked.

***

## Designing the survey email

The **Survey email** card shows the email the way your customer will see it, and you edit it in place. **Edit** is where you change it; **Preview** shows the finished email with sample values filled in, such as the name “Jane Doe” and the ticket subject “Refund for order #1042”.

<Columns cols={2}>
  <div>
    Everything on the canvas can be changed:

    * **From:** the address the survey comes from. See [Send from](#send-from).
    * **Subject:** up to 150 characters. Defaults to **How did we do?**
    * **Logo:** optional, at the top of the email. See [Logo](#logo).
    * **Introduction:** the text above the rating. It starts with a greeting, the heading **How was your support experience?**, and a line that quotes the ticket subject. Clear it and the email opens with the heading **Rate your support experience** instead.
    * **Rating:** the scale chosen in the toolbar, with its labels. See [Rating scales](#rating-scales).
    * **Footer:** the small print under the rating. It defaults to a note that the customer can comment on the next page and that replies are not read. Leave it empty and the email ends at the rating.

    The email ends with **Powered by Chatbase** unless you have the **Remove Powered by Chatbase** add-on.
  </div>

  <Frame>
    <img src="https://mintcdn.com/chatbase/P3ZJITOwrAz68fIt/user-guides/images/help-desk/satisfaction/settings-email.png?fit=max&auto=format&n=P3ZJITOwrAz68fIt&q=85&s=c502f51bc1b61426796dd410a05b7727" alt="The Survey email card in Edit mode, with the scale tabs, the formatting toolbar and the email canvas" width="1632" height="2144" data-path="user-guides/images/help-desk/satisfaction/settings-email.png" />
  </Frame>
</Columns>

<Tip>Keep the introduction to a line or two. The email has one job, and the rating should be visible without scrolling on a phone.</Tip>

### Formatting and variables

The toolbar above the canvas formats the introduction or the footer, whichever you clicked last. It holds a text style picker (**Normal text** and **Heading 1** to **Heading 3**), bold, italic, underline, strikethrough, [text colour](#text-colour), numbered and bulleted lists, links, and emoji. Selecting text also opens a small menu above it with the same formatting, colour, and link options.

Ticket fields such as `{{ticket.requester_name}}` or `{{ticket.subject}}` are filled in when the email is sent. Insert one with the **Variables** button in the toolbar, or type `{{` in the subject, the introduction, or the footer to pick from the list.

### Rating scales

The tabs at the left of the toolbar choose the rating scale the email uses:

| Scale | Choices | Ratings | Labels |
| - | - | - | - |
| **Thumbs** | 👍 👎 | Good or bad | One under each thumb, up to 30 characters. Defaults to **Good** and **Bad**. |
| **Stars** | ★★★★★ | 1 to 5 | A caption under the lowest and the highest star. Defaults to **Poor** and **Great**. |
| **Smileys** | 😡 😞 😐 😃 🤩 | 1 to 5 | A caption under the lowest and the highest face. Defaults to **Poor** and **Great**. |

Click a label on the canvas to change it, or leave it empty to hide it. Labels you type for one scale come back if you switch away and return to it.

Changing the scale affects surveys sent from then on. A survey that already went out keeps the scale it was sent with.

### Logo

Click **Add logo** at the top of the email and choose a PNG or JPEG image of up to 1MB. The logo is scaled down to fit 200 by 48 pixels and is never enlarged. Hover over the logo to align it with **Align left**, **Center**, or **Align right**, swap it with **Replace logo**, or delete it with **Remove logo**.

The logo is uploaded when you click **Save**. It appears at the top of the email and of the survey page.

### Text colour

<Columns cols={2}>
  <div>
    Select text in the introduction or the footer and click the **Text color** button to colour it. Pick a swatch, or type a hex code such as `#1f2937` and click **Apply**. Any other colours already used in that text appear in a row of their own, so you can reuse them.<br /><br />
    **Default** removes the colour. A variable is always coloured as a whole: if your selection covers part of one, the colour is applied to all of it.
  </div>

  <Frame>
    <img src="https://mintcdn.com/chatbase/P3ZJITOwrAz68fIt/user-guides/images/help-desk/satisfaction/text-color.png?fit=max&auto=format&n=P3ZJITOwrAz68fIt&q=85&s=94b77fd834f66d5e0868c72c33a58240" alt="The text colour picker with the Default swatch, two rows of colours and the hex field" width="664" height="250" data-path="user-guides/images/help-desk/satisfaction/text-color.png" />
  </Frame>
</Columns>

### Send from

Pick the address the survey comes from in the **From** line of the email. The list offers, in this order:

* `noreply@` on the agent's own Chatbase mail subdomain. This is the default and needs no setup.
* `noreply@` on each domain you have verified under [Email settings](/docs/user-guides/chatbot/help-desk/email-settings). Sending from your own domain makes the survey recognisable in the inbox.
* Every mailbox you have configured on those domains.

Only the domain has to be verified, so a `noreply@` address does not need to exist as a mailbox. If the Helpdesk email settings use a custom display name, the survey is sent under that name. Replies to the survey email are not read.

***

## What the customer sees

Each rating in the email is a link to the survey page with that rating already picked.

<Columns cols={2}>
  <div>
    **The survey page** shows your logo and the heading **Rate your support experience**, with the rating the person clicked already selected. Nothing is recorded yet, so link scanners and mail previews that follow the link do not create answers.<br /><br />
    The person can change their choice, add a comment of up to 2,000 characters under **Anything you would like to add? (optional)**, and click **Send feedback**.<br /><br />
    A thank-you screen confirms the answer and offers **Change your answer** until the link expires. Opening the link again shows the saved answer with **Update my answer**.
  </div>

  <Frame>
    <img src="https://mintcdn.com/chatbase/P3ZJITOwrAz68fIt/user-guides/images/help-desk/satisfaction/survey-page.png?fit=max&auto=format&n=P3ZJITOwrAz68fIt&q=85&s=ce732f991b9d43258c0dcca84965c964" alt="The survey page with five stars selected, the Poor and Great captions, a comment and the Update my answer button" width="960" height="984" data-path="user-guides/images/help-desk/satisfaction/survey-page.png" />
  </Frame>
</Columns>

<Info>
  Survey links work for 30 days. A link that has expired, or that was never issued, shows **This link is no longer valid** and suggests replying to the support conversation instead.
</Info>

***

## Where the answers show up

Answers land in two places. Each ticket carries its own rating in the right-hand panel, so a teammate sees the verdict next to the conversation it belongs to. Helpdesk analytics rolls every answer up into a CSAT score, a response rate and coverage, with a list of the individual answers behind it.

### On the ticket

<Columns cols={2}>
  <div>
    The **Satisfaction** section in the ticket's right-hand panel shows where the survey stands:

    * **Survey is being sent** while the email goes out.
    * **Survey sent** and **No answer yet** once it is out, with the time it was sent.
    * The rating and any comment once the customer answers, with when they answered.
    * **Not surveyed**, with the reason, if a check failed or the email could not be delivered.
  </div>

  <Frame>
    <img src="https://mintcdn.com/chatbase/kmVWjK3asQxtPbgY/user-guides/images/help-desk/satisfaction/ticket-sidebar.png?fit=max&auto=format&n=kmVWjK3asQxtPbgY&q=85&s=7ac97c03382f38ec4eb352c49366db41" alt="The ticket details panel with the Satisfaction section showing a five-star rating and the comment" width="930" height="848" data-path="user-guides/images/help-desk/satisfaction/ticket-sidebar.png" />
  </Frame>
</Columns>

### In Analytics

The **Customer satisfaction** card on the [Helpdesk analytics](/docs/user-guides/chatbot/analytics#customer-satisfaction-csat) page shows these figures for the selected period:

* **CSAT score:** when every answer is a thumb, the share of answers that were 👍. As soon as any answer uses **Stars** or **Smileys**, the score becomes the average answer from 1 to 5, with 👍 counted as 5 and 👎 as 1. The score also shows its change against the previous period.
* **Response rate:** answered surveys as a share of surveys sent.
* **Coverage:** surveys sent as a share of closed tickets that could have been surveyed. Channels that cannot receive email are left out.
* **Answers by rating:** how the answers split for each scale used in the period.

<Frame>
  <img src="https://mintcdn.com/chatbase/P3ZJITOwrAz68fIt/user-guides/images/help-desk/satisfaction/analytics-card.png?fit=max&auto=format&n=P3ZJITOwrAz68fIt&q=85&s=49871d136518c6250f2ca6ee87408a6b" alt="The Customer satisfaction card with the CSAT score, response rate, coverage, answers by rating and the daily chart" width="2178" height="918" data-path="user-guides/images/help-desk/satisfaction/analytics-card.png" />
</Frame>

For each day, the chart shows what share of the tickets that could have been surveyed were **Surveyed**, **Answered**, and **Positive**. A positive answer is 👍, or 4 or 5 on Stars or Smileys. Figures are grouped by the day the survey went out, in UTC, so a late answer still counts toward that day.

### Survey responses

<Columns cols={2}>
  <div>
    **View all** on the card opens **Survey responses**. The top shows coverage, such as **6 of 7 resolved tickets surveyed**, and **Not surveyed, by reason**.<br /><br />
    Below it, the 100 most recent answers each show the rating, the date, the comment or **No comment**, the ticket number and subject with a link into the Helpdesk, the requester, and the teammate who handled it.

    ### Who gets credit

    Each survey is credited to the teammate assigned to the ticket at the moment it was closed. Reassigning the ticket afterwards, or the teammate leaving the workspace, does not move the credit. A ticket closed with nobody assigned shows as **unassigned**.
  </div>

  <Frame>
    <img src="https://mintcdn.com/chatbase/P3ZJITOwrAz68fIt/user-guides/images/help-desk/satisfaction/responses-sheet.png?fit=max&auto=format&n=P3ZJITOwrAz68fIt&q=85&s=6ec1e76a131d4c4003a1cd0220e74f63" alt="The Survey responses list with coverage, the not surveyed reasons and individual answers" width="1024" height="1894" data-path="user-guides/images/help-desk/satisfaction/responses-sheet.png" />
  </Frame>
</Columns>

### By team member

The **Team member performance** table at the top of [Helpdesk analytics](/docs/user-guides/chatbot/analytics#team-member-performance) has a **CSAT** column with each teammate's CSAT score and number of answers, worked out the same way as the card. Next to it, one column per rating scale shows the teammate's average on **Stars** and **Smileys** and their count of 👍 and 👎.

<Frame>
  <img src="https://mintcdn.com/chatbase/kmVWjK3asQxtPbgY/user-guides/images/help-desk/satisfaction/team-performance.png?fit=max&auto=format&n=kmVWjK3asQxtPbgY&q=85&s=7f86e22189996204345d8de7bea96640" alt="The Team member performance table with the CSAT, Stars, Smileys and thumbs columns" width="2208" height="574" data-path="user-guides/images/help-desk/satisfaction/team-performance.png" />
</Frame>

***

## Limits

| Item | Limit |
| - | - |
| Subject | 150 characters |
| Thumbs label | 30 characters |
| Logo | PNG or JPEG, up to 1MB, shown at up to 200 × 48 pixels |
| Excluded tags | 50 tags |
| Customer comment | 2,000 characters |
| Survey link | Valid for 30 days |
| **Survey responses** list | The 100 most recent answers |

***

## Good to know

* The survey does not thread onto the ticket. A customer who replies to it gets no answer, and the ticket is not reopened.
* If the email cannot be delivered, the ticket shows **Not surveyed** with the reason **Email could not be sent**. Closing the ticket again after fixing the sender retries it.
* Cancelled tickets are never surveyed, and neither are tickets closed while the switch is off or in draft.
* Survey comments are written by customers and shown to your team as written. Treat them as you would any message from a customer.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.