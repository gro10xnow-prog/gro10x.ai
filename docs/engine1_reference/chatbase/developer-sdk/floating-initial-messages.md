> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Floating Initial Messages

> Create eye-catching floating messages that appear above your chat widget to welcome visitors and boost engagement

### Prerequisites

<Info>
  A website with the Chatbase embed script already installed and working.
  New to Chatbase? Check out [Your First AI Agent](/docs/user-guides/quick-start/your-first-agent) to get started with the embed script first.
</Info>

## Setting Up Floating Initial Messages

This feature takes the initial messages you've configured in your Chatbase dashboard and displays them in an attention-grabbing floating format to welcome visitors and encourage interaction.

### Configuration

Set up floating initial messages using the JavaScript configuration object:

```javascript theme={null}
window.chatbaseConfig = {
  showFloatingInitialMessages: true,  // Enable floating messages
  floatingInitialMessagesDelay: 2,    // Show after 2 seconds
  floatingMessagesOncePerSession: true // Show once per session (default) or on every page load
};
```

## Configuration Reference

### chatbaseConfig Properties

Configure floating initial messages using these parameters in your `chatbaseConfig` object:

<ParamField path="showFloatingInitialMessages" type="boolean" default="false">
  Controls whether initial messages appear in a floating window above the chat widget

  **Requirements:**

  * Must be set before the Chatbase script loads
  * Displays the initial messages configured in your Chatbase dashboard as floating bubbles
</ParamField>

<ParamField path="floatingInitialMessagesDelay" type="number" default="2">
  Delay in seconds before displaying floating initial messages

  **Requirements:**

  * Minimum value: 0 (immediate display)
  * Maximum recommended: 10 seconds
</ParamField>

<ParamField path="floatingMessagesOncePerSession" type="boolean" default="true">
  Controls whether floating messages appear once per session or on every page load

  **Behavior:**

  * `true` (default): Messages appear only once per session. They won't reappear if users refresh the page or navigate to other pages during the same session.
  * `false`: Messages appear on every page load/refresh.
</ParamField>

<Warning>
  By default, floating initial messages are displayed only once per user session to maintain a non-intrusive experience. Set `floatingMessagesOncePerSession` to `false` if you want messages to appear on every page load.
</Warning>

## Best Practices

<AccordionGroup>
  <Accordion title="Timing Strategy">
    **Optimize when floating messages appear**

    * **User attention span**: Show messages within 2-4 seconds for best engagement
    * **Page context**: Use longer delays on content-heavy pages, shorter on simple pages
    * **Mobile considerations**: Account for slower loading on mobile devices
  </Accordion>

  <Accordion title="Message Design">
    **Create effective floating experiences**

    * **Keep messages concise**: Floating messages should be brief and attention-grabbing
    * **Maintain brand voice**: Ensure floating messages match your overall messaging tone
    * **Test across devices**: Verify messages display well on different screen sizes
  </Accordion>
</AccordionGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.