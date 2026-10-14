> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Activity

> Review every conversation your AI agent had, plus the leads and data it collected along the way

## Overview

**Activity** is the record of what your AI agent actually did. It holds the chat logs of every conversation your users had, the leads they submitted, and the data your AI agent collected, all filterable and exportable.

<Card title="What you can do:" icon="chart-area">
  Read real conversations to see where your AI agent falls short, correct its answers on the spot, and export what it collected.
</Card>

<Note>
  **Activity** shows data per conversation. [Analytics](/docs/user-guides/chatbot/analytics) aggregates the same activity into totals, topics, and sentiment.
</Note>

## Conversations

The chat logs give you a detailed view of all user interactions with your AI agent, so you can review individual conversations and evaluate its responses. Each log includes user messages, AI agent responses, and any triggered actions, helping you identify issues, optimize responses, and improve the overall user experience.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/activity/activity-1.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=56e47d0164d92a4eb60bf259c1372ba0" alt="The Conversations list in Activity" width="2464" height="1000" data-path="user-guides/chatbot/images/activity/activity-1.png" />
</Frame>

### Filters

Conversation filters are organized into three categories to make it easier to find the conversations you're looking for:

#### Conversation

Filter based on general conversation details:

* **Date range:** Choose the time period you want to review.
* **Channel:**  Filter by the channel where the conversation took place.
* **Conversation state:**  Filter by the current state of the conversation, such as **Ongoing**, **Ended**, **Taken over**, or **Paused**.
* **User:**  Filter conversations by a specific user.
* **Contains voice sessions:**  Show only conversations that include voice sessions.

#### Content

Filter based on the content and quality of conversations:

* **Topics:**  Find conversations associated with specific topics.
* **Sentiment:**  Filter based on the detected sentiment of the conversation.
* **Feedback:**  Filter conversations based on the feedback they received.
* **Confidence score:**  Filter based on the AI agent's confidence score.

#### Activity

Filter based on actions performed during conversations:

* **Action used:**  Find conversations where a specific action was used.
* **Action type:**  Filter by the type of action performed.
* **Action result:** Filter based on the result of an action.
* **Procedure used:**  Find conversations where a specific procedure was triggered.
* **Procedure result:**  Filter based on the result of a procedure.

### Conversation details

Open a conversation and select the **Details** tab to see its general details, including the contact, source, status, sentiment, message count, country, and conversation ID.

For conversations started on your website, such as from the chat bubble, iframe, or Center Stage, **Embedded on** shows the page where the conversation took place, for example `https://shop.example.com/pricing`. Use it to tell which site or page a conversation came from when your AI agent is embedded on more than one. Query strings are not recorded, since they can contain sign-in tokens or personal details. Some browsers report only the domain.

<Tip>
  If you directly embedded the iframe before support for page paths was added, add `referrerpolicy="no-referrer-when-downgrade"` to your `<iframe>` tag. Without it, **Embedded on** shows only the domain. Embeds that use the script need no change.
</Tip>

<Note>
  **Embedded on** is not shown for conversations started before this field was added.
</Note>

### Revise answer

This feature lets you adjust the AI agent's response if it wasn't accurate or satisfactory.

When you click **Revise Answer**, a form appears showing the user's original question, the AI agent's response, and a field where you can enter the expected answer. Once the answer is updated, the question and answer are added automatically to the Q\&A section of your sources.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/activity/revise-answer-feature.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=25f22c4bb035fa1236e712cc130344fe" alt="The Revise Answer form" width="2464" height="1400" data-path="user-guides/chatbot/images/activity/revise-answer-feature.png" />
</Frame>

**Matched Q\&A:** When a response matches a Q\&A source, you can click the matched Q\&A to open it directly, without searching for it in your sources.

<Frame>
  <img src="https://mintcdn.com/chatbase/d-nb8QHFt5ZZR9ql/user-guides/chatbot/images/activity/matched-qna.png?fit=max&auto=format&n=d-nb8QHFt5ZZR9ql&q=85&s=11d12a5b42df64fa7e1ffb83286ed64c" alt="Opening the matched Q&A source from a conversation" width="1152" height="390" data-path="user-guides/chatbot/images/activity/matched-qna.png" />
</Frame>

### Pausing a conversation

<Frame>
  <img src="https://mintcdn.com/chatbase/3pXUdlAnPude4UYE/images/Pause-conversation.png?fit=max&auto=format&n=3pXUdlAnPude4UYE&q=85&s=c551bca5802a3fc93b27cc862940d8aa" alt="Pausing a conversation from the chat logs" width="1582" height="364" data-path="images/Pause-conversation.png" />
</Frame>

You can pause a conversation manually from the chat logs. Open the conversation and use the pause control. While a conversation is paused, the AI agent stops replying to that user until you resume it. This is useful when a user is abusing the AI agent.

Manual pausing is supported on these channels:

* Chat bubble, iframe, Center Stage, and Help page
* API
* WhatsApp, Messenger, and Instagram
* Playground, Q\&A preview, and Action preview

<Note>
  Conversations can also be paused automatically when [Spam detection](/docs/user-guides/chatbot/guardrails#spam-detection) flags them under **Build > Guardrails**.
</Note>

### Confidence score

This indicates how confident the AI agent is in its response, based on the sources you've trained it on. Review responses with low confidence scores and revise them to improve their accuracy.

### Exporting conversations

You can export the conversations in the chat logs directly from the dashboard using the **Export** button. The export can be downloaded as JSON, PDF, or CSV.

<Frame>
  <img src="https://mintcdn.com/chatbase/St1vNiMgEx0Vl5Y7/user-guides/chatbot/images/activity/exporting-conversations.png?fit=max&auto=format&n=St1vNiMgEx0Vl5Y7&q=85&s=3e441f32686c24d912510c7bcc160089" alt="Exporting conversations as JSON, PDF, or CSV" width="2462" height="996" data-path="user-guides/chatbot/images/activity/exporting-conversations.png" />
</Frame>

### Automatic conversation ending

Idle conversations are automatically ended after **3 days of inactivity**. If a conversation hasn't received a new message within this period, it is marked as ended automatically.

This applies to conversations from every channel except **API**, which never end due to inactivity.

#### Continued conversations

On these channels, a user can send a new message after their conversation has ended:

* WhatsApp
* Messenger
* Instagram
* Email
* Slack
* Zendesk
* Salesforce
* Zendesk Messaging

When that happens, a new conversation starts with context from the ended one, so the AI agent replies as if the chat never stopped. The user sees one continuous chat. On the dashboard, you see two separate conversations linked to each other:

* **Previous conversation** opens the ended conversation so you can read its history.
* **Show summary** shows a recap of the ended conversation.

To see every conversation with the same user, use the **User** [filter](#conversation).

### Search conversations

You can **search within conversation text and filter conversations by actions and their results**.

Search is typo-tolerant, so searching for **"refnud"** still matches **"refund"**. Search covers conversations from up to **1 year ago**.

<Frame>
  <img src="https://mintcdn.com/chatbase/bZyz3xkUNdNqqRS_/user-guides/chatbot/images/activity/word-search.png?fit=max&auto=format&n=bZyz3xkUNdNqqRS_&q=85&s=e136ab3e7b4bfa149f2f8e1c5a083599" alt="Searching chat logs for a word, with matches highlighted in the results" width="2528" height="1502" data-path="user-guides/chatbot/images/activity/word-search.png" />
</Frame>

## Leads

This section shows the collected leads along with their submission date. Custom fields configured on the Collect Leads action each get their own column. You can filter leads by date and export them as CSV or PDF.

Configure the leads form under **Build > Actions** by creating a [Collect Leads action](/docs/user-guides/chatbot/actions/collect-leads).

## Collected data

This section shows the submissions gathered by your [Collect Data actions](/docs/user-guides/chatbot/actions/collect-data), along with their submission date and an **Action** column showing which action collected them. Each field configured on a Collect Data action gets its own column. You can filter submissions by date, export them as CSV or PDF, and delete the ones you select.

## Next steps

<CardGroup cols={2}>
  <Card title="Analytics" icon="chart-scatter" href="/docs/user-guides/chatbot/analytics">
    See the same activity aggregated into totals, topics, and sentiment.
  </Card>

  <Card title="Best Practices" icon="star" href="/docs/user-guides/quick-start/best-practices">
    Turn what you find in the logs into better instructions and data sources.
  </Card>

  <Card title="Collect Leads" icon="person" href="/docs/user-guides/chatbot/actions/collect-leads">
    Configure which lead details your AI agent captures, and where they go.
  </Card>

  <Card title="Guardrails" icon="shield-halved" href="/docs/user-guides/chatbot/guardrails">
    Set rate limits and spam detection so abusive conversations pause themselves.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.