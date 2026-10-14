> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom Initial Messages

> Create personalized welcome experiences by setting custom initial messages that greet users when your AI Agent first loads, with support for dynamic content and user personalization.

### Prerequisites

<Info>
  A website with the Chatbase embed script already installed and working.
  New to Chatbase? Check out [Your First AI Agent](/docs/user-guides/quick-start/your-first-agent) to get started with the embed script first.
</Info>

## Setting Up Custom Initial Messages

Configure initial messages using the JavaScript embed script to create personalized welcome experiences:

### Personalized Messages

Add user-specific content to your greetings by combining user identification with custom messages for personalized experiences:

```javascript theme={null}
// Get user information (from your auth system)
const user = getCurrentUser();

// Set personalized messages
window.chatbase.setInitialMessages([
  `Hi ${user.name}!`,
  "I remember our last conversation about your project.",
  "How can I help you today?"
]);
```

<Frame caption="Personalized messages">
  <img src="https://mintcdn.com/chatbase/-HHbinxDlwZUQ3Jt/developer-guides/images/custom-initial-messages/custom-initial-messages.png?fit=max&auto=format&n=-HHbinxDlwZUQ3Jt&q=85&s=c7f2504cf12314f04492524ae57f68c2" alt="Personalized messages" width="1024" height="934" data-path="developer-guides/images/custom-initial-messages/custom-initial-messages.png" />
</Frame>

### Dynamic Content Examples

Create context-aware messages based on user behavior or current page:

```javascript theme={null}
// Based on current page
const currentPage = window.location.pathname;
let messages = ["Hello! I'm here to help."];

if (currentPage.includes('/pricing')) {
  messages = [
    "Looking at our pricing?",
    "I can help you choose the right plan for your needs."
  ];
} else if (currentPage.includes('/support')) {
  messages = [
    "Need technical support?",
    "I'm here to help resolve any issues you're experiencing."
  ];
}

window.chatbase.setInitialMessages(messages);
```

## Method Reference

Initial messages can be set two ways — through the [runtime options API](/docs/developer-guides/chat-bubble-control#runtime-options) or the dedicated `setInitialMessages` method. Both write the same setting, and the last call wins whichever method made it.

### setOptions({ initialMessages })

The runtime options API accepts initial messages alongside the widget's other overridable options:

```javascript theme={null}
window.chatbase.setOptions({
  initialMessages: ["Hi!", "How can I help you today?"],
});
```

<ParamField path="options.initialMessages" type="string[]">
  Array of non-empty strings containing the messages to display in sequence

  **Requirements:**

  * Must be an array of non-empty strings
  * Total character count limited to 1000 characters — oversize input is rejected with a `console.error`, never truncated
</ParamField>

### setInitialMessages()

Set the messages displayed when the AI agent first loads:

<ParamField path="messages" type="string[]" required>
  Array containing the messages to display in sequence

  **Requirements:**

  * Must be an array of strings
  * Total character count limited to 1000 characters — input over the limit is truncated
</ParamField>

### Clearing custom initial messages

To remove your custom initial messages and return to the AI agent's configured ones, clear the override through [`resetOptions`](/docs/developer-guides/chat-bubble-control#resetoptions-fields):

```javascript theme={null}
window.chatbase.resetOptions({ initialMessages: true });
```

<Warning>
  Custom initial messages are shown only once per session. If a user refreshes the page or navigates to another page during the same session, the messages won't appear again to avoid creating an intrusive experience.
</Warning>

## Best Practices

<AccordionGroup>
  <Accordion title="Message Content">
    **Write effective initial messages**

    * **Keep messages concise**: Use short, clear messages that guide users effectively
    * **Avoid lengthy paragraphs**: Break long content into multiple shorter messages
    * **Be specific**: Mention what you can help with rather than generic greetings
    * **Use action-oriented language**: Encourage users to engage with specific questions
  </Accordion>

  <Accordion title="Personalization Strategy">
    **Use user data thoughtfully**

    * **Respect privacy**: Only use information users have explicitly shared
    * **Add value**: Personalization should enhance the experience, not just show off data
    * **Handle missing data**: Always have fallback messages for when user data isn't available
    * **Test thoroughly**: Verify personalized messages work with different user states
  </Accordion>

  <Accordion title="Timing and Performance">
    **Optimize when messages are set**

    * **Set early**: Configure initial messages as soon as possible in your application lifecycle
    * **Wait for embed script**: Ensure Chatbase script has loaded before calling `setInitialMessages`
    * **Consider async operations**: If fetching user data, handle loading states gracefully
    * **Cache when appropriate**: Store computed messages to avoid recalculating on every visit
  </Accordion>
</AccordionGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.