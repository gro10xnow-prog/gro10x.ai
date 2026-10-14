> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Analytics

> Aggregate your AI agent's activity into chats, topics, sentiment, and helpdesk metrics over time

## Overview

**Analytics** aggregates the activity of your AI agent across conversations. It has four pages: **Chats**, **Topics**, **Sentiment**, and **Helpdesk**. By default it shows the activity for all AI agents in your workspace for the last week.

<Card title="What you can do:" icon="chart-scatter">
  See volume, subject matter, and mood at a glance, and tell whether the changes you made last week actually moved anything.
</Card>

<Note>
  **Analytics** aggregates the information, including topics, sentiment, and thumbs down. [Activity](/docs/user-guides/chatbot/activity) shows the data per conversation instead.
</Note>

## Chats

<Frame>
  <img src="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/chatbot/images/analytics/analytics-1.jpg" alt="The Chats page in Analytics" />
</Frame>

The top of the page shows the resolution rate, the total number of chats, total number of messages, the messages that got a thumbs up and a thumbs down, daily active users, weekly active users, and stickiness.

**Total messages** counts every message exchanged across all conversations, both from your visitors and your AI agent, including its initial messages. It won't match your credit usage, because credits are only charged for AI-generated responses, not initial messages.

Below the totals, a line chart plots chats over the selected period against the **Previous period** (the dotted line), so you can see whether volume is rising or falling. Hover any point to compare the two dates directly.

**Resolution rate:** The percentage of conversations your agent resolved independently, without creating a ticket or escalating to live chat.

**Chats by country** shades a world map by volume and lists the top countries beside it, with **View all** for the full ranking. Countries are detected from the IP of the users having conversations with the AI agent.

<Frame>
  <img src="https://mintcdn.com/chatbase/vNSeL3jbWe38rTUa/user-guides/chatbot/images/analytics/analytics-2.png?fit=max&auto=format&n=vNSeL3jbWe38rTUa&q=85&s=65f29ccc8b91c66487d18de92ae8b63a" alt="Chats by country, shown as a shaded world map" width="2528" height="1502" data-path="user-guides/chatbot/images/analytics/analytics-2.png" />
</Frame>

**Chats by channel** breaks the same total down by where the conversations came from, such as Widget/Iframe, Playground, or Slack.

**Action calls** ranks how often each of your actions ran over the period, with **View all** for the complete list. It is a quick way to see which actions your AI agent actually uses.

Each panel uses the visualization that suits it: a line chart for chats over time, a shaded world map for **Chats by country**, and horizontal bars for **Chats by channel** and **Action calls**.

### Filtering

You can filter the data by date, using pre-defined ranges such as last 7 days, last 30 days, last 3 months, and last year.

<Frame>
  <img src="https://mintcdn.com/chatbase/4pjz3jKY2rJqVh9o/user-guides/chatbot/images/analytics/analytics-filter.png?fit=max&auto=format&n=4pjz3jKY2rJqVh9o&q=85&s=452eec1a9cb0686ca04f73b37412fa3f" alt="The date filter options in Analytics" width="2528" height="1502" data-path="user-guides/chatbot/images/analytics/analytics-filter.png" />
</Frame>

## Topics

This page shows what users ask your AI agent about. Topics have two levels: broad **topics**, each with more specific **subtopics**, such as a Billing topic with Refunds and Invoices subtopics.

<Note>
  Topics are found once a day, for the previous day's conversations. The first topics appear after a day with at least 30 conversations. Until then the page shows **Not enough conversations yet**.
</Note>

The **Topics** card shows two views of the biggest topics:

* **Graph:** each day's conversations about each of the top 10 topics. Use **Show** to switch between **% of chats** (the share of that day's conversations) and **Number of chats**.
* **Treemap:** the top 10 topics as tiles sized by their number of conversations. Each tile is split into its 3 biggest subtopics and one **Other** tile for the rest. Topics past the top 10 share one grey tile.

<Frame>
  <img src="https://mintcdn.com/chatbase/_259RTfr1-UN7sBS/user-guides/chatbot/images/analytics/topics-graph.png?fit=max&auto=format&n=_259RTfr1-UN7sBS&q=85&s=df3dc71a54d473b2049b4c133bb05908" alt="The Topics card in Graph view, with the top topics over time" width="1579" height="670" data-path="user-guides/chatbot/images/analytics/topics-graph.png" />
</Frame>

<Frame>
  <img src="https://mintcdn.com/chatbase/_259RTfr1-UN7sBS/user-guides/chatbot/images/analytics/topics-treemap.png?fit=max&auto=format&n=_259RTfr1-UN7sBS&q=85&s=d0499bd840edec1a6ca302a9cb5710f2" alt="The Topics card in Treemap view, with topics split into subtopic tiles" width="1579" height="671" data-path="user-guides/chatbot/images/analytics/topics-treemap.png" />
</Frame>

The list beside the chart shows the top 10 topics, each with its share of all conversations in the period, or its number of conversations, as chosen in **Show**. A conversation can be about more than one topic, so the shares can add up to more than 100%.

**Topic distribution** lists every topic with its number of conversations. Search for a topic or subtopic, or click the arrow next to a topic to see its subtopics. **Other (no subtopic)** counts the conversations about that topic that none of its subtopics fits. A topic counts each conversation once, so when a conversation is about two of its subtopics, the subtopics add up to more than the topic's total.

<Frame>
  <img src="https://mintcdn.com/chatbase/_259RTfr1-UN7sBS/user-guides/chatbot/images/analytics/topics-distribution.png?fit=max&auto=format&n=_259RTfr1-UN7sBS&q=85&s=197381c7dbbc26455ab7ba3bde3cb06a" alt="Topic distribution with a topic expanded to show its subtopics" width="1579" height="793" data-path="user-guides/chatbot/images/analytics/topics-distribution.png" />
</Frame>

Click a topic, subtopic, or tile to open its conversations in [Activity](/docs/user-guides/chatbot/activity) for the same period, in a new tab.

**Export data** downloads a CSV with one row per topic and subtopic, in the columns `Topic`, `Subtopic`, and `Conversations`. The `(all)` row holds each topic's total.

### How topics are found

Each conversation gets up to five topics or subtopics, one for each separate need the user raised. Greetings, thanks, tests, and requests outside your AI agent's purpose get none.

When conversations keep asking about something the current topics don't cover, the AI agent suggests a new subtopic. It appears on this page once 3 conversations are about it. A suggestion that no new conversation backs for 30 days is dropped.

The AI agent keeps its topics to at most 20 topics with up to 10 subtopics each.

### Manage topics

Click **Manage** or **View all** to open **Manage topics**. Topics with subtopics start collapsed; click the arrow to show them.

<Frame>
  <img src="https://mintcdn.com/chatbase/_259RTfr1-UN7sBS/user-guides/chatbot/images/analytics/topics-manage.png?fit=max&auto=format&n=_259RTfr1-UN7sBS&q=85&s=acaa210ff61e282b21840e72db0429c6" alt="The Manage topics sheet with a topic's subtopics and menu" width="512" height="909" data-path="user-guides/chatbot/images/analytics/topics-manage.png" />
</Frame>

* **Add topic:** adds a topic. Type its name and press Enter.
* **Add subtopic:** adds a subtopic under a topic, from the topic's menu. A topic can have up to 10 subtopics.
* **Edit:** renames a topic or subtopic.
* **Delete:** removes a topic or subtopic.
* **Freeze topics:** pauses automatic topic discovery. Conversations are still tagged with existing topics.

Changes apply when you click **Save changes**. **Discard** drops them. Names can be up to 200 characters. Every name must be unique in the AI agent, across topics and subtopics.

Topics and subtopics you add or rename stay exactly as you set them. The AI agent tags new conversations with them, and never renames, merges, or removes them.

When you delete:

* **A topic:** it is hidden with its subtopics, and the AI agent does not create a topic with that name again.
* **A subtopic:** its conversations move to its topic, where they count under **Other (no subtopic)**, unless they are also in another of its subtopics.
* **Adding a deleted name again:** brings it back with its past conversations, under the topic you add it to. A deleted topic comes back with the subtopics that were deleted with it.
* **Adding a name the AI agent suggested:** the suggestion becomes a live subtopic and keeps the conversations behind it.

## Sentiment

This page shows how the AI agent detects the sentiment and emotion of users during conversations. Sentiment analysis is detected automatically by the AI agent.

<Frame>
  <img src="https://mintcdn.com/chatbase/4pjz3jKY2rJqVh9o/user-guides/chatbot/images/analytics/analytics-sentiment-new.png?fit=max&auto=format&n=4pjz3jKY2rJqVh9o&q=85&s=20db7c6696c99bdc6b1eb5db6d4b516b" alt="The Sentiment page in Analytics" width="2528" height="1502" data-path="user-guides/chatbot/images/analytics/analytics-sentiment-new.png" />
</Frame>

## Helpdesk

Track ticket volume over time to monitor your support workload and resolution trends. Most metrics on this page show their change against the previous period, and the line charts plot the **Selected period** as a solid line against the **Previous period** as a dotted one.

<Frame>
  <img src="https://mintcdn.com/chatbase/4pjz3jKY2rJqVh9o/user-guides/chatbot/images/analytics/helpdesk-analytics.png?fit=max&auto=format&n=4pjz3jKY2rJqVh9o&q=85&s=e414639dd9d097dd94a39ee75d46f31e" alt="Helpdesk in Analytics" width="2530" height="1496" data-path="user-guides/chatbot/images/analytics/helpdesk-analytics.png" />
</Frame>

### Team member performance

The table at the top of the page breaks the period down by team member, so you can see how the workload is spread across your human agents:

* **Solved tickets:** tickets that member marked solved.
* **Tickets replied:** tickets they replied to at least once.
* **Replies sent:** the total number of replies they sent.
* **CSAT:** the [CSAT score](#customer-satisfaction-csat) of the surveys credited to that member, with the number of answers below it. A survey is credited to whoever was assigned to the ticket when it was closed.
* **Rating columns:** one column per rating scale in use. **Stars** and **Smileys** show the member's average answer, and the 👍 and 👎 columns count each thumb.
* **Median first response time:** how long customers waited for that member's first reply.
* **Median response time:** the median across all of their replies.
* **Median time to close:** how long their tickets stayed open before being solved.

Every column is sortable. Scroll the table sideways to reach the columns that don't fit on screen. The **All agents** row totals the counts for the whole team, and a dash means there is no data for that member in the selected period.

### Ticket volume

* **Created tickets:** tickets opened during the period.
* **Solved tickets:** tickets marked solved during the period.
* **Unsolved tickets:** the outstanding backlog, plotted on its own chart so you can see whether it is growing or shrinking.
* **Agent replies sent:** replies sent by human agents during the period, charted beside Unsolved tickets. Internal notes, automated messages, and AI agent replies are excluded.

### Response times

* **Median first response time:** how long a customer waits for the first human reply.
* **Median response time:** the median across all replies, not just the first.
* **Median time to close:** how long a ticket stays open before it is solved.

Medians are used rather than averages, so a handful of long-running tickets don't skew the figure. A chart below the three tiles plots response time across the period.

### Resolution rates

* **Resolved on first contact rate:** solved tickets that were resolved in a single interaction, without the customer having to follow up, as a share of all solved tickets.
* **Resolved on first reply rate:** solved tickets that were resolved with a single reply from a human agent, as a share of all solved tickets.

### Tickets by channel

Breaks ticket volume down by where the tickets arrived from, such as **Email**, **Widget/Iframe**, or **API**.

### Customer satisfaction (CSAT)

Shows how customers rated the support they received, based on the [CSAT surveys](/docs/user-guides/chatbot/help-desk/satisfaction-surveys) sent after tickets are closed.

<Frame>
  <img src="https://mintcdn.com/chatbase/P3ZJITOwrAz68fIt/user-guides/images/help-desk/satisfaction/analytics-card.png?fit=max&auto=format&n=P3ZJITOwrAz68fIt&q=85&s=49871d136518c6250f2ca6ee87408a6b" alt="The Customer satisfaction card with the CSAT score, response rate, coverage, answers by rating and the daily chart" width="2178" height="918" data-path="user-guides/images/help-desk/satisfaction/analytics-card.png" />
</Frame>

* **CSAT score:** when every answer in the period is a thumb, the share of answers that were 👍. As soon as any answer uses **Stars** or **Smileys**, the score becomes the average answer from 1 to 5, with 👍 counted as 5 and 👎 as 1. The CSAT score also shows its change against the previous period.
* **Response rate:** answered surveys as a share of surveys sent.
* **Coverage:** surveys sent as a share of closed tickets that could have been surveyed.
* **Answers by rating:** a breakdown for each rating scale used in the period, with the number of each thumb and the average for Stars and for Smileys. Hover over a scale to see how many answers each rating got.

For each day, the chart shows what share of the tickets that could have been surveyed were **Surveyed**, **Answered**, and **Positive**. A positive answer is 👍, or 4 or 5 on Stars or Smileys. Figures are grouped by the day the survey went out, in UTC, so a late answer still counts toward that day.

**View all** opens the individual answers with their comments, the ticket they belong to, and the teammate who handled it, along with a breakdown of tickets that were not surveyed and why.

### Filtering

Use the date range picker to set the period. The filter button beside it narrows the whole page by **Assignee**, **Channel**, **Type**, or **Last message by**. Pick a field, choose an operator such as **is any of**, then select the values and click **Apply**. **Discard** clears the filter you were editing.

## Limitations

* **Data is updated with a 1-day delay,** reflecting the previous day's information.
* **Data is only recorded once you subscribe to a plan.** Topics and sentiment are only available after the upgrade, and anything from before it is not included.

## Next steps

<CardGroup cols={2}>
  <Card title="Activity" icon="chart-area" href="/docs/user-guides/chatbot/activity">
    Read the individual conversations behind these totals.
  </Card>

  <Card title="Usage" icon="chart-line" href="/docs/user-guides/workspace/usage">
    Track message credits consumed across your AI agents.
  </Card>

  <Card title="Help Desk" icon="headset" href="/docs/user-guides/chatbot/help-desk/help-desk-overview">
    Work the tickets these helpdesk metrics are measuring.
  </Card>

  <Card title="Best Practices" icon="star" href="/docs/user-guides/quick-start/best-practices">
    Act on what the numbers tell you about answer quality.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.