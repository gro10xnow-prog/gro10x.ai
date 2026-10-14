> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Chat bubble Control

> Programmatically control your chat bubble with JavaScript methods to open, close, reset conversations, and override configured options at runtime.

The Chatbase embed script exposes the `window.chatbase` object with methods to control your chat bubble programmatically.

## Methods

### open(options?)

Opens the chat bubble. Optionally sends a message when it opens.

```javascript theme={null}
window.chatbase.open();
```

**Parameters**

<ParamField path="options.message" type="string">
  A message to send automatically when the chat bubble opens.
</ParamField>

<ParamField path="options.hideMessage" default="false" type="boolean">
  When `true`, the sent message is hidden and the chat bubble stays closed until the bot **starts replying** — so it looks like the assistant reached out proactively. Only applies when `message` is set.
</ParamField>

<CodeGroup>
  ```javascript Open and send a visible message theme={null}
  window.chatbase.open({ message: "What is Chatbase's pricing?" });
  ```

  ```javascript Send a hidden message (proactive) theme={null}
  window.chatbase.open({
    message: "What is Chatbase's pricing?",
    hideMessage: true,
  });
  ```
</CodeGroup>

### close()

Closes the chat bubble.

```javascript theme={null}
window.chatbase.close();
```

### resetChat()

Clears the current conversation and starts a new session.

```javascript theme={null}
window.chatbase.resetChat();
```

<Info>
  Your chat bubble configuration and [custom initial messages](/docs/developer-guides/custom-initial-messages) are preserved after reset.
</Info>

## Runtime Options

Override a bounded set of your AI agent's configured options for the current page load — the chat bubble's display name, bubble text, footer, message placeholder, dismissible notice, initial messages, and suggested messages. Overrides are never persisted: reloading the page or calling `resetOptions` returns the chat bubble to its dashboard configuration.

In addition, set runtime-only options that have no dashboard equivalent — dictation-only mode, dictation silence timeout, dictation waveform color and hiding the actions menu. These aren't persisted either: reloading the page or calling `resetOptions` clears them.

### setOptions(options)

```javascript theme={null}
window.chatbase.setOptions({
  displayName: "Acme Support",
  bubbleText: "Need help?",
  footer: "Powered by Acme",
  messagePlaceholder: "Ask us anything…",
  dismissibleNotice: "Chats may be recorded for quality purposes.",
  initialMessages: ["Hi!", "How can I help you today?"],
  suggestedMessages: ["Track my order", "Talk to a human"],
  dictationOnly: true,
  dictationTimeout: 1000,
  hideActionsMenu: true,
  dictationWaveformColor: "#FF0000",
});
```

All keys are optional — pass only the ones you want to override.

**Parameters**

<ParamField path="options.displayName" type="string">
  Overrides the chat bubble header title. Also updates the launcher button's accessibility labels so assistive technology announces the same name. Maximum 100 characters.
</ParamField>

<ParamField path="options.bubbleText" type="string">
  Overrides the text shown beside the icon in the floating chat bubble. Maximum 40 characters, and long labels clip on narrow screens. A non-empty value shows the text even when **Show text in the chat bubble** is off in the dashboard; an empty string hides it even when that setting is on. The dashboard's icon alignment still decides which side the icon sits on, so runtime code cannot move it. Reading direction follows the text itself, so a right-to-left label reads correctly on a left-to-right page.
</ParamField>

<ParamField path="options.footer" type="string">
  Overrides the footer text. Maximum 1000 characters.
</ParamField>

<ParamField path="options.messagePlaceholder" type="string">
  Overrides the message input placeholder. Maximum 100 characters.
</ParamField>

<ParamField path="options.dismissibleNotice" type="string">
  Overrides the dismissible notice shown above the message input. Maximum 500 characters.
</ParamField>

<ParamField path="options.initialMessages" type="string[]">
  Overrides the AI agent's initial messages. Array of non-empty strings, limited to 1000 characters in total. Applies immediately if the conversation hasn't started; otherwise it takes effect on the next fresh conversation (for example after `resetChat()`). Writes the same setting as [`setInitialMessages`](/docs/developer-guides/custom-initial-messages) — the last call wins, whichever method made it.
</ParamField>

<ParamField path="options.suggestedMessages" type="string[]">
  Replaces the dashboard-configured suggested message chips. Up to 4 entries, each a non-empty string of at most 200 characters. Suggestions the AI generates during the conversation still take precedence over this override.
</ParamField>

<ParamField path="options.dictationOnly" type="boolean">
  When `true`, the message box keeps only the dictation button — the text area, send button, voice mode button and attachments button are all hidden, so the only way to compose a message is by speaking. If dictation is turned off for the agent, nothing is left to show and the whole message box disappears. Existing messages, suggested messages and the rest of the chat window are unaffected.
</ParamField>

<ParamField path="options.dictationTimeout" type="number">
  Stops dictation automatically after the user has been silent for this many milliseconds, then transcribes what was recorded, just as if they had pressed stop. Silence is only counted after the user starts speaking, so a user who hasn't said anything yet is never cut off. Must be a positive integer. When unset, dictation runs until the user stops it or the maximum recording length is reached.
</ParamField>

<ParamField path="options.hideActionsMenu" type="boolean">
  When `true`, hides the three-dots menu in the chat header, including start new chat, end chat, recent chats and tickets.
</ParamField>

<ParamField path="options.dictationWaveformColor" type="string">
  Sets the color of the waveform shown while the user dictates, as a hex color such as `"#FF0000"`. When unset, the waveform uses the theme's default gray.
</ParamField>

<Info>
  Every change to the runtime overrides fires an [`optionsChanged` event](/docs/developer-guides/chatbot-event-listeners) once the agent has re-rendered with it. Use it when you need to wait until an override is actually on screen — for example keeping a plain `<iframe>` hidden until `dictationOnly` has taken effect.
</Info>

<Info>
  Invalid keys or values are skipped with a `console.error`; valid keys in the same call still apply. `setOptions` never truncates — an oversize value is rejected. (The legacy `setInitialMessages` method instead truncates to 1000 characters, preserving its documented behavior.)
</Info>

### resetOptions(fields?)

Clears runtime overrides, returning those options to the AI agent's dashboard configuration.

```javascript theme={null}
window.chatbase.resetOptions(); // clear every override
window.chatbase.resetOptions({ displayName: true, footer: true }); // clear specific keys
```

**Parameters**

<ParamField path="fields" type="object">
  An object mapping option keys to `true` for each override to clear. When omitted, every runtime override is cleared.
</ParamField>

### Per-field methods

Each option also has a dedicated setter that behaves exactly like `setOptions` with that single key:

```javascript theme={null}
window.chatbase.setDisplayName("Acme Support");
window.chatbase.setBubbleText("Need help?");
window.chatbase.setFooterText("Powered by Acme");
window.chatbase.setMessagePlaceholder("Ask us anything…");
window.chatbase.setDismissibleNotice("Chats may be recorded.");
window.chatbase.setSuggestedMessages(["Track my order", "Talk to a human"]);
window.chatbase.setInitialMessages(["Hi!"]); // legacy alias — see Custom Initial Messages
window.chatbase.setDictationOnly(true);
window.chatbase.setDictationTimeout(1000);
window.chatbase.setHideActionsMenu(true);
window.chatbase.setDictationWaveformColor("#FF0000");
```

## Examples

Combine these methods with [event listeners](/docs/developer-guides/chatbot-event-listeners) to build powerful, context-aware chat experiences.

### Custom Buttons

Trigger chat bubble actions from your own UI elements:

```javascript theme={null}
document.getElementById("help-button").addEventListener("click", () => {
  window.chatbase.open();
});

document.getElementById("close-button").addEventListener("click", () => {
  window.chatbase.close();
});

document.getElementById("new-chat-button").addEventListener("click", () => {
  window.chatbase.resetChat();
});
```

### Answer FAQ Questions

Turn static FAQ entries into live answers — open the chat bubble with the question pre-filled:

```javascript theme={null}
document.querySelectorAll(".faq-question").forEach((item) => {
  item.addEventListener("click", () => {
    window.chatbase.open({ message: item.dataset.question });
  });
});
```

<img src="https://mintcdn.com/chatbase/yFrYmt3iO2efcq09/images/chat-bubble-open-proactive.gif?s=061623a97f0a6587125d3586ef06c1b4" alt="Chat Bubble Open Proactive" width="1688" height="1080" data-path="images/chat-bubble-open-proactive.gif" />

### Proactive Message on Intent

Reach out automatically when a visitor lingers on a high-intent page. The message is hidden until the bot replies, so it feels like the assistant started the conversation.

```javascript theme={null}
// On the /pricing page: if the user hasn't acted after 10 minutes, reach out
setTimeout(() => {
  window.chatbase.open({
    message: "Do you have any questions about our pricing?",
    hideMessage: true,
  });
}, 10 * 60 * 1000);
```

### Time-Based Reset

<Note>
  The 24-hour example uses `localStorage` to persist the last message time across page reloads.
</Note>

<CodeGroup>
  ```javascript Reset After 5 Minutes of Inactivity theme={null}
  let inactivityTimer;

  function startInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(
      () => window.chatbase.resetChat(),
      5 * 60 * 1000
    );
  }

  window.chatbase.addEventListener("user-message", startInactivityTimer);
  window.chatbase.addEventListener("assistant-message", startInactivityTimer);
  ```

  ```javascript Reset 24 Hours After Last Message theme={null}
  const STORAGE_KEY = "chatbase_last_message";
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  function updateLastMessageTime() {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }

  // Check on page load
  const lastMessage = localStorage.getItem(STORAGE_KEY);
  if (lastMessage && Date.now() - parseInt(lastMessage) > TWENTY_FOUR_HOURS) {
    window.chatbase.resetChat();
    updateLastMessageTime(); // Reset the timer after clearing
  }

  // Update timestamp on every message
  window.chatbase.addEventListener("user-message", updateLastMessageTime);
  window.chatbase.addEventListener("assistant-message", updateLastMessageTime);
  ```
</CodeGroup>

### Reset After Tool Completion

<CodeGroup>
  ```javascript After Transaction theme={null}
  let resetTimer;

  window.chatbase.addEventListener("tool-result", (event) => {
    const resetTools = ["complete-booking", "process-payment", "create-ticket"];

    if (resetTools.includes(event.data.name) && event.data.result?.success) {
      clearTimeout(resetTimer);
      // 2 second delay before resetting the chat
      resetTimer = setTimeout(() => window.chatbase.resetChat(), 2000);
    }
  });
  ```

  ```javascript After Support Ticket theme={null}
  let resetTimer;

  window.chatbase.addEventListener("tool-result", (event) => {
    if (event.data.name === "create-ticket") {
      clearTimeout(resetTimer);
      // 2 second delay before resetting the chat
      resetTimer = setTimeout(() => window.chatbase.resetChat(), 2000);
    }
  });
  ```
</CodeGroup>

### Reset on Keywords

<Warning>
  Always add a delay before resetting so users can read the final AI response.
</Warning>

<CodeGroup>
  ```javascript User Says Goodbye theme={null}
  let resetTimer;

  window.chatbase.addEventListener("user-message", (event) => {
    const goodbyePhrases = ["goodbye", "bye", "that's all", "start over"];
    const message = event.data.content.toLowerCase();

    // Use word boundaries to avoid matching substrings (e.g., "nearby" containing "bye")
    const matchesPhrase = goodbyePhrases.some((phrase) => {
      const regex = new RegExp(`\\b${phrase}\\b`);
      return regex.test(message);
    });

    if (matchesPhrase) {
      clearTimeout(resetTimer);
      // 2 second delay before resetting the chat
      resetTimer = setTimeout(() => window.chatbase.resetChat(), 2000);
    }
  });
  ```

  ```javascript AI Confirms Completion theme={null}
  let resetTimer;

  window.chatbase.addEventListener("assistant-message", (event) => {
    const donePhrases = ["order confirmed", "booking complete", "ticket created"];
    const message = event.data.content.toLowerCase();

    const matchesPhrase = donePhrases.some((phrase) => {
      const regex = new RegExp(`\\b${phrase}\\b`);
      return regex.test(message);
    });

    if (matchesPhrase) {
      clearTimeout(resetTimer);
      // 2 second delay before resetting the chat
      resetTimer = setTimeout(() => window.chatbase.resetChat(), 2000);
    }
  });
  ```
</CodeGroup>

### Reset on Navigation

Start fresh conversations when users enter specific sections of your site.

<CodeGroup>
  ```javascript Single-Page App theme={null}
  const resetOnRoutes = ["/checkout", "/new-project", "/support"];

  function checkRouteAndReset() {
    if (resetOnRoutes.includes(window.location.pathname)) {
      window.chatbase.resetChat();
    }
  }

  // Call this from your router's navigation callback
  // e.g., router.afterEach(checkRouteAndReset)
  checkRouteAndReset();
  ```

  ```javascript Multi-Page App theme={null}
  // Add this script to pages where you want fresh conversations
  window.chatbase.resetChat();
  ```
</CodeGroup>

## Controlling Without the Embed Script

If you embed the AI Agent as a plain `<iframe>`, `window.chatbase` doesn't exist. The iframe accepts the same actions as messages posted to it, so send them there:

```javascript theme={null}
iframe.contentWindow.postMessage(
  { type: "setOptions", params: { dictationOnly: true } },
  "*"
);
```

<Warning>
  Wait for the iframe's `iframeReady` message before posting. Anything sent before it is dropped.
</Warning>

Post to the agent's origin rather than `"*"` where you can.

## Best Practices

* **Debounce rapid calls** — Avoid calling methods in quick succession
* **Add delays before reset** — Give users time to read the final response
* **Respect dismissals** — Don't immediately reopen a closed chat bubble
* **Use contextual triggers** — Open chat at moments when help is most relevant

## Next Steps

<CardGroup cols={2}>
  <Card title="Event Listeners" icon="ear" href="/docs/developer-guides/chatbot-event-listeners">
    Learn to listen for and respond to chat events in real-time
  </Card>

  <Card title="Custom Initial Messages" icon="message" href="/docs/developer-guides/custom-initial-messages">
    Create dynamic, personalized initial messages for users
  </Card>

  <Card title="Floating Initial Messages" icon="bullhorn" href="/docs/developer-guides/floating-initial-messages">
    Display floating messages over the chat bubble
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.