> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom Action

> Call your own API, run code in the browser, or show an interactive widget, all from inside the conversation

## Overview

Custom Actions let you connect your AI agent to anything you can reach over an API. The AI agent calls your endpoint, gets the response back, and uses that data in its reply, so it can answer questions and perform tasks that live entirely in your own systems. Custom Actions can also run code in the customer's browser or display an interactive widget in the chat.

<Card title="Best for:" icon="plug">
  Anything Chatbase doesn't have a built-in action for: looking up records in your own database, triggering a workflow, or showing a custom UI in the chat.
</Card>

**Common Use Cases:**

* "Upgrade my subscription to premium"
* "What's the weather in London?"
* "Look up my account balance"

## Action Types

When creating a custom action, you select a **type** that determines how the action behaves:

| Type | What it does |
| - | - |
| **Server** | Calls an external API and returns the response to the AI agent. The AI agent uses the response data in its reply. |
| **Server with UI (Widget)** | Calls an external API, then displays a [widget](/docs/developer-guides/widgets/overview) inline in the chat with the response data. Use this to show rich, interactive UI after fetching data. |
| **Client** | Executes code in the customer's browser via the [JavaScript embed script](/docs/developer-guides/client-side-custom-actions). Useful for accessing browser APIs and frontend context. |
| **Widget only (UI only)** | Displays a [widget](/docs/developer-guides/widgets/overview) inline in the chat without calling an API. The AI agent populates the widget from the conversation context. Use this for forms, info cards, and interactive menus. |

<Info>
  **Server with UI** and **Widget only** actions let you attach a widget to the action. You can create and manage widgets directly from the action's configuration page. See the [Widgets documentation](/docs/developer-guides/widgets/overview) for details on building widgets.
</Info>

## How to create the action

<Steps>
  <Step title="Navigate to Actions">
    Go to your [Chatbase dashboard](https://www.chatbase.co/dashboard/) and select your AI agent. Click **Build > Actions** in the left sidebar.
  </Step>

  <Step title="Create the Action">
    Click **Create action**, then select **Custom Action** and the [type](#action-types) you need.
  </Step>

  <Step title="Configure General Settings">
    See [General](#general) below, then click **Save and continue**.
  </Step>

  <Step title="Configure the API">
    Define the data inputs the AI agent collects and the request it sends. See [API](#api) below, then click **Save and continue**.
  </Step>

  <Step title="Test the response">
    Verify the endpoint returns what you expect. See [Test Response](#test-response) below, then click **Save and continue**.
  </Step>

  <Step title="Set data access">
    Choose how much of the response the AI agent can see. See [Data Access](#data-access) below, then click **Save and continue**.
  </Step>

  <Step title="Choose Channels">
    This action is compatible with every channel. Toggle it on or off for each configured channel, then click **Save**. See [Channels](/docs/user-guides/chatbot/actions/actions-overview#channels) for what configured, unconfigured, and incompatible mean.
  </Step>

  <Step title="Enable and Test">
    Ensure the action is toggled to **Enabled**, then test it in the Playground.
  </Step>
</Steps>

## General

**Action Name:** A descriptive name for this action. This helps the AI agent know when to use it.

**When to use:** A detailed description explaining when the AI agent should use this action and API. Include examples of the data this action provides and the customer queries it helps answer.

To restrict the action to [procedure](/docs/user-guides/chatbot/procedures/procedures-overview) steps only, turn on [**Only use in procedures**](/docs/user-guides/chatbot/actions/actions-overview#only-use-in-procedures). When it's on, the **When to use** field is hidden, because the AI agent no longer decides when to call the action.

<Info>
  All custom action requests must send a **JSON body**, and all custom action responses must be **JSON-formatted**.
</Info>

## API

### Collect data inputs from user

The list of information the AI agent needs from the customer to perform the action. Each input has:

* **Name:** Name of the data input.
* **Type:** Type of the data input.
* **Description:** A short sentence describing the data input to the AI agent, so it knows what to ask for.

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-13.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=9a3ed68a5d01a32c06059648dbc1a7fc" alt="Configuring data inputs for a custom action" width="1568" height="444" data-path="user-guides/chatbot/images/actions/actions-13.png" />
</Frame>

### API request

The endpoint the AI agent calls to retrieve data or send updates. You can include data inputs collected from the customer in the URL or the request body.

* **Method:** The HTTP method the request should use.
* **HTTPS URL:** The URL of the API the AI agent should call.
* **Add variable:** Inserts a variable that depends on the customer's input.

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-14.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=26b96a050e4b3a977ae42e3d68c32186" alt="Configuring the API request for a custom action" width="1568" height="356" data-path="user-guides/chatbot/images/actions/actions-14.png" />
</Frame>

When the URL is added, the parameters, headers, and body are populated automatically:

* **Parameters:** Key-value pairs sent as part of the request URL to provide input data or filter the response.
* **Headers:** Metadata sent along with the request to describe the request or client.
* **Body:** The data sent as part of the request. The body must be **JSON-formatted**. A variable inside quotes, such as `"{{message}}"`, is escaped automatically when its value would break the JSON, for example a quote or a line break, so you don't need to instruct the AI agent to escape it.

## Test Response

* **Live response:** Test with live data from the API to make sure it's configured correctly.
* **Example response:** Use example JSON data if the API isn't ready yet.

## Data Access

* **Full data access:** The AI agent can access all available information from the API's response, giving comprehensive replies based on complete data.
* **Limited data access:** Restricts the information the AI agent can access, giving more controlled and specific replies while protecting sensitive data.

<Check>
  Test the action in the Playground with a query that should trigger it, and confirm the AI agent calls your endpoint and uses the response in its reply.
</Check>

## Examples

### Upgrade subscription

An `Update_Subscription` action that lets the customer ask the AI agent to upgrade their subscription to the premium plan.

In the **General** section, the action is named `Update_Subscription`, with a **When to use** description telling the AI agent to call this API whenever the customer wants to upgrade.

<Frame>
  <img src="https://mintcdn.com/chatbase/fuaTVXjARv0sH-Me/user-guides/chatbot/images/actions/general-upgrade.png?fit=max&auto=format&n=fuaTVXjARv0sH-Me&q=85&s=2533ad2137dacdcd2ac6faaa8e319fe0" alt="General settings for the Update_Subscription action" width="1630" height="1318" data-path="user-guides/chatbot/images/actions/general-upgrade.png" />
</Frame>

In the **API** section, the data inputs are the status of the plan and the new plan requested, described as: *Active or canceled. If they want to upgrade to premium, send 'active'*.

<Frame>
  <img src="https://mintcdn.com/chatbase/fuaTVXjARv0sH-Me/user-guides/chatbot/images/actions/api-upgrade.png?fit=max&auto=format&n=fuaTVXjARv0sH-Me&q=85&s=880a1551ca3ea7d7a9fcff72c2946d23" alt="Data inputs for the Update_Subscription action" width="1554" height="830" data-path="user-guides/chatbot/images/actions/api-upgrade.png" />
</Frame>

In the **API request** section, the URL is `https://demo-rhythmbox.chatbase.fyi/api/update-subscription` with the method set to `GET`.

<Frame>
  <img src="https://mintcdn.com/chatbase/fuaTVXjARv0sH-Me/user-guides/chatbot/images/actions/request-upgrade.png?fit=max&auto=format&n=fuaTVXjARv0sH-Me&q=85&s=3c58bfdfd834d17c3fc77400133b6df8" alt="The API request for the Update_Subscription action" width="1562" height="764" data-path="user-guides/chatbot/images/actions/request-upgrade.png" />
</Frame>

In **Test Response**, the endpoint is tested with `active` and `premium` as the upgrade example.

<Frame>
  <img src="https://mintcdn.com/chatbase/fuaTVXjARv0sH-Me/user-guides/chatbot/images/actions/test-upgrade.png?fit=max&auto=format&n=fuaTVXjARv0sH-Me&q=85&s=26615f535b77e96a7f974cd6bd399a80" alt="Testing the Update_Subscription response" width="1574" height="1266" data-path="user-guides/chatbot/images/actions/test-upgrade.png" />
</Frame>

In **Data Access**, **Full data access** is selected so the AI agent can use all the information from the response.

<Frame>
  <img src="https://mintcdn.com/chatbase/Y-KB8kyKMqhKXtiO/user-guides/chatbot/images/actions/access-upgrade.png?fit=max&auto=format&n=Y-KB8kyKMqhKXtiO&q=85&s=4a309b5c4358c5bfc7f072f1aed2d01a" alt="Data access settings for the Update_Subscription action" width="1556" height="752" data-path="user-guides/chatbot/images/actions/access-upgrade.png" />
</Frame>

The AI agent can now upgrade or downgrade the subscription when the customer asks.

<Frame>
  <img src="https://mintcdn.com/chatbase/fuaTVXjARv0sH-Me/user-guides/chatbot/images/actions/upgrade-example.gif?s=7efb8fa8187a75e5c1561e23646fb88a" alt="The AI agent upgrading a subscription in chat" width="448" height="561" data-path="user-guides/chatbot/images/actions/upgrade-example.gif" />
</Frame>

### Weather API

A `Get_Weather` action that provides weather information for any city the customer asks about.

In the **General** section, the action is named `Get_Weather`, with a **When to use** description telling the AI agent to use this API whenever it's asked about the weather of any city.

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-15.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=a3ee91c6898fb52289b128ea35af7b3a" alt="General settings for the Get_Weather action" width="1564" height="1025" data-path="user-guides/chatbot/images/actions/actions-15.png" />
</Frame>

In the **API** section, the input is named `City`, with the type `Text` and the description: *The city that you want to know its weather*.

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-16.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=710a09ede97b9ba13d80a9c1c8672682" alt="Data inputs for the Get_Weather action" width="1574" height="636" data-path="user-guides/chatbot/images/actions/actions-16.png" />
</Frame>

In the **API request** section, the URL is `https://wttr.in/{{city}}?format=j1` with the method set to `GET`. The key-value pair in the parameters is added automatically after entering the URL.

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-17.gif?s=0e33d9664181294a2a2f54f5ae912018" alt="The API request for the Get_Weather action" width="790" height="518" data-path="user-guides/chatbot/images/actions/actions-17.gif" />
</Frame>

In **Test Response**, the endpoint is tested with `London` as the city.

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-18.gif?s=2fbd85f1eae6984cb7d892737bb6ac65" alt="Testing the Get_Weather response" width="838" height="613" data-path="user-guides/chatbot/images/actions/actions-18.gif" />
</Frame>

In **Data Access**, **Full data access** is selected so the AI agent can use all the information from the response.

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-19.png?fit=max&auto=format&n=DIWSTyTSabxfVW3B&q=85&s=58d2e212b4e4b1809c25ea00bcc3e0ef" alt="Data access settings for the Get_Weather action" width="1561" height="952" data-path="user-guides/chatbot/images/actions/actions-19.png" />
</Frame>

The AI agent can now answer the weather for any city the customer asks about.

<Frame>
  <img src="https://mintcdn.com/chatbase/DIWSTyTSabxfVW3B/user-guides/chatbot/images/actions/actions-20.gif?s=914e089812fc8122e77d813d77a4cf40" alt="The AI agent returning weather information in chat" width="573" height="450" data-path="user-guides/chatbot/images/actions/actions-20.gif" />
</Frame>

## Limitations

* **The maximum response size is 20KB.** Anything larger returns an error.
* **Requests and responses must be JSON.** The request body must be JSON-formatted, and the returned response must be JSON-formatted.
* **Client actions need the JavaScript embed.** The **Client** type executes in the customer's browser through the [embed script](/docs/developer-guides/client-side-custom-actions), so it won't run on channels that don't load it.

## Best Practices

<CardGroup cols={2}>
  <Card title="Clear Action Triggers" icon="bullseye">
    Write a specific **When to use** description that names the data this action provides and the customer queries it answers.
  </Card>

  <Card title="Describe Every Input" icon="pen-line">
    The input description is what the AI agent uses to decide what to ask the customer for. Vague descriptions produce wrong values.
  </Card>

  <Card title="Limit Data Access" icon="shield-check">
    Use **Limited data access** when the response contains anything the AI agent shouldn't repeat back to the customer.
  </Card>

  <Card title="Keep Responses Small" icon="compress">
    Return only the fields the AI agent needs. Trimming the response keeps you under the 20KB cap and makes replies more accurate.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.