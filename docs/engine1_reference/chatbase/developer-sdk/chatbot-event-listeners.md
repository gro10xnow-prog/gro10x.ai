> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Event Listeners

> Listen for and respond to real-time chat events including user messages, AI responses, custom actions, and more to create interactive experiences.

Event listeners allow you to monitor and react to everything happening in your AI Agent conversations. From user messages to custom actions, you can build rich, interactive experiences that respond dynamically to user interactions.

## Why Use Event Listeners?

<AccordionGroup>
  <Accordion title="Custom User Experiences">
    Create dynamic, responsive interactions:

    * Show contextual information based on conversation topic
    * Trigger UI changes based on user messages
    * Provide visual feedback for AI responses
    * Integrate chat with other page elements
  </Accordion>

  <Accordion title="Third-party Integrations">
    Connect your chat with external systems:

    * Send data to CRM or analytics platforms
    * Trigger email campaigns or notifications
    * Update user profiles or preferences
    * Sync conversation data with support systems
  </Accordion>
</AccordionGroup>

### Prerequisites

<Info>
  A website with the Chatbase embed script already installed and working.
  New to Chatbase? Check out [Your First AI Agent](/docs/user-guides/quick-start/your-first-agent) to get started with the embed script first.
</Info>

## Available Events

Listen for these events to monitor and respond to chat activity:

<Tabs>
  <Tab title="Message Events">
    **Track conversation flow**

    <ParamField body="user-message" type="event">
      Triggered when a user sends a message

      **Payload:** `{ data: { content: string }, type: "user-message" }`\
      **Use cases:** Analytics, message validation, auto-suggestions
    </ParamField>

    <ParamField body="assistant-message" type="event">
      Triggered when your AI Agent responds

      **Payload:** `{ data: { content: string }, type: "assistant-message" }`\
      **Use cases:** UI updates, satisfaction surveys, follow-up actions
    </ParamField>

    ```javascript theme={null}
    // Example: Track conversation topics
    window.chatbase.addEventListener('user-message', (event) => {
      console.log('User asked:', event.data.content);
      
      // Track in analytics
      analytics.track('Chat Message Sent', {
        message_length: event.data.content.length,
        timestamp: new Date().toISOString()
      });
    });

    window.chatbase.addEventListener('assistant-message', (event) => {
      console.log('AI responded:', event.data.content);
      
      // Show satisfaction survey after response
      if (event.data.content.includes('solution') || event.data.content.includes('help')) {
        showSatisfactionSurvey();
      }
    });
    ```
  </Tab>

  <Tab title="Action Events">
    **Monitor custom actions and tools**

    <ParamField body="tool-call" type="event">
      Triggered when a custom action or tool is called

      **Payload:** `{ data: { args: object, id: string, name: string, type: string }, type: 'tool-call' }`\
      **Use cases:** Backend API calls, form submissions, third-party integrations
    </ParamField>

    <ParamField body="tool-result" type="event">
      Triggered when a tool returns results

      **Payload:** `{ data: { name: string, result: object, toolCallId: string, type: string }, type: 'tool-result' }`\
      **Use cases:** UI updates, error handling, success notifications
    </ParamField>

    ```javascript theme={null}
    // Example: Handle custom actions
    window.chatbase.addEventListener('tool-call', (event) => {
      console.log('Tool called:', event.data.name, event.data.args);
      
      if (event.data.name === 'schedule-meeting') {
        // Show calendar widget
        showCalendarWidget(event.data.args.preferredTime);
      } else if (event.data.name === 'get-pricing') {
        // Track pricing interest
        analytics.track('Pricing Inquiry', event.data.args);
      }
    });

    window.chatbase.addEventListener('tool-result', (event) => {
      if (event.data.name === 'schedule-meeting' && event.data.result.success) {
        // Show confirmation message
        showNotification('Meeting scheduled successfully!');
      }
    });
    ```
  </Tab>

  <Tab title="Dictation Events">
    **React to voice input**

    <ParamField body="dictation-transcript" type="event">
      Triggered when a dictated recording finishes transcribing, just before the text lands in the message box. An empty transcript fires nothing.

      **Payload:** `{ data: { transcript: string }, type: "dictation-transcript" }`\
      **Use cases:** Kiosks, accessibility flows, voice analytics
    </ParamField>

    ```javascript theme={null}
    window.chatbase.addEventListener('dictation-transcript', (event) => {
      console.log('User dictated:', event.data.transcript);
    });
    ```

    <Note>
      This fires when the transcript is ready, not when the message is sent. If the user edits the text first, the `user-message` that follows won't match it.
    </Note>
  </Tab>

  <Tab title="Option Events">
    **React to runtime option overrides**

    <ParamField body="optionsChanged" type="event">
      Triggered after the agent re-renders with a new set of [runtime option overrides](/docs/developer-guides/chat-bubble-control#runtime-options) — for example after `setOptions` or `resetOptions`. It also fires once on load with the overrides that are in effect at that point.

      **Payload:** `{ data: { options: object }, type: "optionsChanged" }`
      **Use cases:** Waiting until an override is visibly applied before showing the agent, keeping your own UI in sync with the current overrides
    </ParamField>

    The `options` object is the full set of overrides currently in effect, not just the keys that changed. A key you have never set, or one you cleared with `resetOptions`, is absent.

    ```javascript theme={null}
    window.chatbase.addEventListener('optionsChanged', (event) => {
      console.log('Overrides in effect:', event.data.options);
    });
    ```

    <Note>
      The event fires after the change is rendered, so it is safe to use as the signal that an override is on screen.
    </Note>
  </Tab>
</Tabs>

## Basic Event Listener Usage

### Adding Event Listeners

Add event listeners using the simple syntax:

```javascript theme={null}
window.chatbase.addEventListener(eventName, callbackFunction);
```

<ParamField path="eventName" type="enum" required>
  Must be one of the event names listed in Available Event Types.
</ParamField>

<ParamField path="callback" type="function" required>
  Function to be called when the event is fired. The event payload is passed as an argument.
</ParamField>

### Removing Event Listeners

Remove listeners when they're no longer needed to prevent memory leaks:

<CodeGroup>
  ```javascript Basic Removal theme={null}
  // Store reference to callback function
  const myEventHandler = (event) => {
    console.log('Event received:', event);
  };

  // Add listener
  window.chatbase.addEventListener('user-message', myEventHandler);

  // Remove listener later
  window.chatbase.removeEventListener('user-message', myEventHandler);
  ```

  ```javascript React Component Example theme={null}
  // In React, clean up listeners on unmount
  useEffect(() => {
    const handleUserMessage = (event) => {
      setLastMessage(event.data.content);
    };
    
    window.chatbase.addEventListener('user-message', handleUserMessage);
    
    // Cleanup on unmount
    return () => {
      window.chatbase.removeEventListener('user-message', handleUserMessage);
    };
  }, []);
  ```
</CodeGroup>

## Listening Without the Embed Script

If you embed the AI Agent as a plain `<iframe>`, `window.chatbase` doesn't exist. The iframe posts the same events to the parent window, so listen for them there:

```javascript theme={null}
window.addEventListener('message', (event) => {
  if (event.data?.type === 'dictation-transcript') {
    console.log('User dictated:', event.data.data.transcript);
  }
  if (event.data?.type === 'optionsChanged') {
    console.log('Overrides in effect:', event.data.data.options);
  }
});
```

<Warning>
  Note the extra nesting. The embed script unwraps the message for you, so it's `event.data.transcript` there but `event.data.data.transcript` here.
</Warning>

Check `event.origin` before you trust a message. Any script can post to your window.

## Event Management Best Practices

## Troubleshooting

<AccordionGroup>
  <Accordion title="Events Not Firing">
    **Problem:** Event listeners aren't being called

    **Solutions:**

    * **Check script loading**: Verify that the Chatbase embed script has loaded completely before adding event listeners. The `window.chatbase` object should be available.

    * **Verify event names**: Double-check that you're using the correct event names. Valid events include: `user-message`, `assistant-message`, `tool-call`, `tool-result`, `dictation-transcript`, and `optionsChanged`. Typos in event names will prevent listeners from firing.

    * **Check browser console**: Look for JavaScript errors that might prevent your listener functions from being registered or executed properly.
  </Accordion>

  <Accordion title="Memory Leaks">
    **Problem:** Application slowing down over time

    **Solutions:**

    * **Remove unused listeners**: Always remove event listeners when they're no longer needed using `removeEventListener` with the same function reference used in `addEventListener`.

    * **Clean up on page unload**: Remove all event listeners before the user navigates away from the page to prevent memory leaks in single-page applications.

    * **Handle route changes**: In single-page applications, ensure you clean up event listeners when routes change, not just on full page reloads.

    * **Use cleanup patterns**: Create cleanup functions that remove all your event listeners and call them at appropriate lifecycle points in your application.
  </Accordion>

  <Accordion title="Handler Function Issues">
    **Problem:** removeEventListener not working

    **Solutions:**

    * **Avoid inline functions**: Don't use anonymous or inline functions as event handlers if you need to remove them later. Inline functions create new function references each time, making them impossible to remove.

    * **Store function references**: Create named functions or store function references in variables before passing them to `addEventListener`. Use the same reference when calling `removeEventListener`.

    * **Test removal**: Verify that your event listeners are actually being removed by checking if they still fire after calling `removeEventListener`.
  </Accordion>
</AccordionGroup>

## Next Steps

<CardGroup cols={2}>
  <Card title="Custom Initial Messages" icon="message" href="/docs/developer-guides/custom-initial-messages">
    Create dynamic, personalized initial messages for users
  </Card>

  <Card title="Floating Initial Messages" icon="bullhorn" href="/docs/developer-guides/floating-initial-messages">
    Display floating messages over the chat bubble
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.