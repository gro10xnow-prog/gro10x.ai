> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# UTM Tracking

> Keep campaign attribution on links your AI Agent shares.

Make every link your AI Agent shares carry the visitor's UTM parameters, so your analytics still knows which campaign brought them in.

## Why you need this

Visitors from ads and email campaigns arrive with UTM parameters in the address, like `utm_source=google`. Your analytics reads them to credit the right campaign.

Links your AI Agent shares in the chat don't have them. A visitor who clicks one and signs up may not be credited to the ad that brought them in.

| | Visitor lands on | AI Agent shares |
| - | - | - |
| **Without this guide** | `example.com/?utm_source=google` | `example.com/pricing` |
| **With this guide** | `example.com/?utm_source=google` | `example.com/pricing?utm_source=google` |

## How it works

| Step | What you do | Who | Where |
| - | - | - | - |
| [1. Save the UTMs](#step-1-save-the-utms) | Save the UTM parameters when a visitor arrives | Developer | Your website |
| [2. Pass them to your AI Agent](#step-2-pass-them-to-your-ai-agent) | Send them to your AI Agent as user attributes | Developer | Your website |
| [3. Update your instructions](#step-3-update-your-instructions) | Tell your AI Agent to add them to links | Anyone | Chatbase dashboard |

## Before you start

<Info>
  You need a website with the Chatbase embed script already installed and working.
  New to Chatbase? Check out [Your First AI Agent](/docs/user-guides/quick-start/your-first-agent) to get started with the embed script first.
</Info>

## Step 1: Save the UTMs

UTM parameters are only in the address of the first page a visitor lands on. They're gone once the visitor moves to another page. Your AI Agent also forgets its user attributes on every page load, so you need to send them again on each page.

The fix is to save the parameters in the browser on the first visit and read them back on every page.

### Add the code

Add this to your site so it runs on every page, before you call the Chatbase `identify` method:

```javascript theme={null}
function getUtmParams() {
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const url = new URLSearchParams(window.location.search);
  const saved = JSON.parse(sessionStorage.getItem("chatbase_utm") || "{}");

  // Only save UTMs if none were saved earlier this visit
  if (Object.keys(saved).length === 0) {
    for (const key of keys) {
      if (url.get(key)) saved[key] = url.get(key);
    }
    sessionStorage.setItem("chatbase_utm", JSON.stringify(saved));
  }

  return saved;
}
```

### How the code behaves

* **It only keeps the five standard UTM keys.** Anything else in the address is ignored. This keeps random query parameters away from your AI Agent and keeps the attributes short.
* **It keeps the first UTMs it sees.** If the visitor later clicks through from a different campaign in the same session, the original source is kept. To credit the most recent campaign instead, remove the `if` check so new UTMs replace the saved ones.
* **It uses `sessionStorage`.** The parameters are cleared when the visitor closes the tab. Use `localStorage` instead if you want them to last across visits.

## Step 2: Pass them to your AI Agent

Send the saved parameters to your AI Agent as user attributes. Your AI Agent reads user attributes while it replies, so it will know which campaign the visitor came from.

Pick the tab that matches your visitors. If your website has both logged-in and logged-out visitors, you need both.

<Tabs>
  <Tab title="Anonymous visitors">
    For visitors who aren't logged in, pass the parameters inside `user_metadata`. You don't need a token or a user ID.

    ```javascript theme={null}
    window.chatbase("identify", {
      user_metadata: getUtmParams()
    });
    ```

    To set this up before the Chatbase script loads, use `window.chatbaseUserConfig` instead:

    ```html theme={null}
    <script>
      window.chatbaseUserConfig = {
        user_metadata: getUtmParams()
      };
    </script>

    <!-- Your normal Chatbase embed script -->
    ```
  </Tab>

  <Tab title="Logged-in visitors">
    If you already identify logged-in users with a [JWT](/docs/developer-guides/identity-verification#method-1-jwt-recommended), add the UTM parameters **to the identify call you already have**. Put them next to the token, the same way you pass other public attributes:

    ```javascript theme={null}
    const token = await getJWTFromBackend();

    window.chatbase("identify", {
      token: token,
      name: user.firstName,
      ...getUtmParams()
    });
    ```

    <Warning>
      Don't add a second `identify` call just for the UTM parameters. Each `identify` call replaces the attributes from the last one. A separate call would erase the name, token, or anything else you passed before.
    </Warning>

    <Note>
      Still using the older [user hash method](/docs/developer-guides/identity-verification#method-2-user-hash-deprecated)? Add the UTM parameters to the `user_metadata` object you already send.
    </Note>
  </Tab>
</Tabs>

<Info>
  User attributes are visible to your AI Agent. UTM parameters aren't sensitive, so this is fine. Still, never put private information in these attributes. That belongs inside the signed token.
</Info>

## Step 3: Update your instructions

Your AI Agent now knows where the visitor came from, but it won't do anything with that on its own. You need to tell it what to do in its instructions.

### What your AI Agent sees

Each attribute appears as a line of text at the start of the conversation, like this:

```text theme={null}
user utm_source: google
user utm_medium: cpc
user utm_campaign: spring_sale
```

### Add the instructions

<Steps>
  <Step title="Open your instructions">
    In your [Chatbase Dashboard](https://www.chatbase.co/dashboard), open your AI Agent and go to **Build > Instructions**.
  </Step>

  <Step title="Paste the text below">
    Add it to the end of your instructions, and replace `example.com` with your own domain.
  </Step>

  <Step title="Save">
    Click **Save changes**.
  </Step>
</Steps>

```text theme={null}
### Links and UTM parameters
At the start of the conversation you may see lines such as "user utm_source: google" or "user utm_campaign: spring_sale". These are the visitor's UTM parameters.

Whenever you share a link to example.com, add every UTM parameter you were given to the end of the link.
- If the link has no "?" yet, start with "?", for example: https://example.com/pricing?utm_source=google&utm_campaign=spring_sale
- If the link already has a "?", add them with "&" instead.
- Use the parameter names and values exactly as given. Don't change, translate, or invent them.
- Only do this for links to example.com. Leave links to other websites unchanged.
- If you weren't given any UTM parameters, share links unchanged. Never make up UTM values.
- Don't mention UTM parameters or tracking to the visitor. Just share the link.
```

For more on writing instructions, see [Build](/docs/user-guides/chatbot/build#instructions).

<Note>
  AI models usually follow clear instructions like these, but not every time, so your AI Agent may now and then share a link without the parameters. Test it on your own site before you depend on it.
</Note>

## Test it

<Steps>
  <Step title="Visit your site with test UTMs">
    Open your website with test parameters in the address, for example `https://example.com/?utm_source=test&utm_campaign=chatbase_check`.
  </Step>

  <Step title="Ask for a link">
    Open the chat and ask something that should get a link back, like "Where can I see your pricing?"
  </Step>

  <Step title="Check the link">
    The link in the reply should end with `utm_source=test&utm_campaign=chatbase_check`.
  </Step>

  <Step title="Try another page">
    Go to another page on your site and ask for another link. The same UTM parameters should still be there.
  </Step>
</Steps>

<Tip>
  Test in the widget on your own website, not in the Playground. The Playground doesn't run your site's code, so it never receives the UTM parameters.
</Tip>

## Troubleshooting

<AccordionGroup>
  <Accordion title="The link comes back without UTM parameters">
    * Open your browser's developer console and run `sessionStorage.getItem("chatbase_utm")`. If it shows `null` or `"{}"`, the parameters weren't saved. Make sure the code from Step 1 runs on the page you landed on.
    * Check that `identify` runs on every page, not just the first one.
    * Look for a second `identify` call elsewhere on your site. It would replace the UTM attributes.
    * Make sure you saved the updated instructions, and that the domain in them matches your site.
  </Accordion>
</AccordionGroup>

## Good to know

<AccordionGroup>
  <Accordion title="Source cards don't get UTM parameters">
    The source cards shown under a reply link to your data sources as they are. Only links your AI Agent writes in the reply itself get the UTM parameters.
  </Accordion>

  <Accordion title="Keep user attributes short">
    All user attributes together are cut off at 1,000 characters. The five UTM parameters are well under that. If you also pass many other attributes, the last ones may not reach your AI Agent.
  </Accordion>

  <Accordion title="Instructions can't use placeholders">
    There's no `{{utm_source}}` placeholder syntax in instructions. Your AI Agent reads the attribute lines and adds the values itself, which is why the instructions above describe what the lines look like.
  </Accordion>

  <Accordion title="Using a fixed tag instead">
    To tag every link as coming from the chat, like `utm_source=chatbase`, you don't need Steps 1 and 2. Tell your AI Agent in its instructions to add those exact parameters to every link to your domain.
  </Accordion>
</AccordionGroup>

## Next steps

<CardGroup cols={2}>
  <Card title="Identity Verification" icon="shield-check" href="/docs/developer-guides/identity-verification">
    Identify logged-in users and pass more attributes to your AI Agent
  </Card>

  <Card title="Event Listeners" icon="ear" href="/docs/developer-guides/chatbot-event-listeners">
    Learn to listen for and respond to chat events in real-time
  </Card>

  <Card title="Custom Initial Messages" icon="message" href="/docs/developer-guides/custom-initial-messages">
    Create dynamic, personalized initial messages for users
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.