> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Web Search

> Give your AI agent real-time web search so it can answer questions your training sources don't cover

## Overview

The Web Search action lets your AI agent browse the web during a conversation and feed the results back into its reply. Use it as an additional source of information for questions your training sources don't answer, and restrict it to the sites you trust.

<Card title="Best for:" icon="magnifying-glass">
  Answering questions that depend on live or fast-changing information, and filling gaps your training sources don't cover.
</Card>

**Common Use Cases:**

* Questions about information that changes too often to keep in a training source
* Topics covered on your industry's reference sites but not on your own
* Follow-up questions the AI agent can't answer from your sources alone

<Frame>
  <img src="https://mintcdn.com/chatbase/jxPxr8Rg1_N5Ffz-/user-guides/chatbot/images/actions/actions-36.png?fit=max&auto=format&n=jxPxr8Rg1_N5Ffz-&q=85&s=18f45da6aa6d10572ab9502601dcfea4" alt="The Web Search action in the action list" width="1510" height="1498" data-path="user-guides/chatbot/images/actions/actions-36.png" />
</Frame>

## How to create the action

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, then select **Web Search**.
  </Step>

  <Step title="Configure General Settings">
    **Action Name:** Give the action a descriptive name.

    **When to use:** Describe when the action should be triggered and the kind of customer queries that should trigger it. You can also add instructions the AI agent should follow once the action runs.

    To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.
  </Step>

  <Step title="Configure the search settings">
    Set **Include images** and **Included domains** as described in [Settings](#settings) below.
  </Step>

  <Step title="Choose Channels">
    This action is compatible with every channel. Toggle it on or off for each configured channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Click **Save and enable**, then test it.
  </Step>
</Steps>

## Settings

**Include images:** Lets the AI agent include images in its replies to illustrate the answer it found.

**Included domains:** The specific domains the AI agent is allowed to search. Leave this empty and the AI agent searches the whole web; add domains and it searches only those. Adding sites related to your business field keeps results relevant and on-brand.

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-32.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=3e5dbd28708c878bd995b29e26f9794f" alt="The Include images and Included domains settings for the Web Search action" width="1530" height="128" data-path="user-guides/chatbot/images/actions/actions-32.png" />
</Frame>

<Check>
  Test the action by asking your AI agent a question your training sources don't cover, and confirm the answer reflects live information from the domains you allowed.
</Check>

## Best Practices

<CardGroup cols={2}>
  <Card title="Restrict Your Domains" icon="filter">
    Add the reference sites you trust to **Included domains** rather than leaving the AI agent to search the open web.
  </Card>

  <Card title="Clear Action Triggers" icon="bullseye">
    Write a specific **When to use** description so the AI agent searches only when your own sources fall short, instead of reaching for the web first.
  </Card>

  <Card title="Prefer Your Own Sources" icon="database">
    Anything you control and can keep current belongs in a training source. Use web search for what you can't.
  </Card>

  <Card title="Test Thoroughly" icon="flask">
    Test with questions your sources don't answer and check that the results are accurate and from the sites you expect.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.