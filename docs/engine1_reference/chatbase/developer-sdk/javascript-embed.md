> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# JavaScript Embed Script

> Complete guide to embedding Chatbase AI Agents in your web application with advanced customization options.

The JavaScript embed script is perfect for web applications that need rich chat functionality with minimal setup. Add a powerful AI agent to your website in minutes.

## What You Can Do

<AccordionGroup>
  <Accordion title="Basic Integration">
    * **Simple embed** - Add a chat widget to your website in minutes
    * **Identity verification** - Add advanced capabilities and customizations to your AI agent, by leveraging contacts and actions
    * **Widget control** - Programmatically open/close the chat interface
  </Accordion>

  <Accordion title="Advanced Features">
    * **Event listeners** - React to user messages and AI responses
    * **Actions** - Create interactive forms and actions directly in the chat interface
    * **Dynamic content** - Show personalized initial messages
  </Accordion>
</AccordionGroup>

## Quick Start Guide

<Steps>
  <Step title="Get Your Embed Script">
    1. Go to your [Chatbase Dashboard](https://www.chatbase.co/dashboard)
    2. Select your AI Agent → **Channels** → click **Manage** on the **Chat bubble** card
    3. Click **Deploy** (top-right) and choose **Website widget**
    4. Copy the JavaScript embed script

    <Frame>
      <img src="https://mintcdn.com/chatbase/-HHbinxDlwZUQ3Jt/developer-guides/images/javascript-embed/deploy-embed-tab.png?fit=max&auto=format&n=-HHbinxDlwZUQ3Jt&q=85&s=dde147ad0ec7a38d9a99e4c5134085de" alt="Deploy embed tab" width="1922" height="936" data-path="developer-guides/images/javascript-embed/deploy-embed-tab.png" />
    </Frame>
  </Step>

  <Step title="Add to Your Website">
    Paste the code in your website's `<head>` section or before the closing `</body>` tag.

    <Tip>
      Place in `<head>` for faster loading, or before `</body>` if you have loading performance concerns.
    </Tip>
  </Step>

  <Step title="Test Integration">
    Visit your website and look for the chat bubble. Click it to test!

    <Check>Your AI Agent should respond based on your training data.</Check>
  </Step>

  <Step title="Add Advanced Features (Optional)">
    Enhance your integration with identity verification, custom events, or styling.

    ```javascript theme={null}
    // Example: Listen for user messages
    window.chatbase.addEventListener("user-message", (event) => {
      console.log("User said:", event.content);
      // Your custom logic here
    });
    ```
  </Step>
</Steps>

## JavaScript Embed Core Features

<Tabs>
  <Tab title="Identity Verification">
    **Secure user sessions with verified identities**

    Perfect for authenticated applications where you need to:

    * Verify user identity for actions
    * Pass user context (name, email, etc.) to AI Agent
    * Use data stored in contacts to perform actions.

    [Full Identity Verification Guide →](/docs/developer-guides/identity-verification)
  </Tab>

  <Tab title="Event Listeners">
    **React to chat events in real-time**

    Listen for and respond to:

    * User messages and AI responses
    * Actions calls and results

    [Event Listeners Documentation →](/docs/developer-guides/chatbot-event-listeners)
  </Tab>

  <Tab title="Widget Control">
    **Programmatic control over chat interface**

    Control your chat widget with JavaScript:

    * Open/close programmatically
    * Customize initial messages
    * Show floating prompts over the chat bubble

    [Widget Control Guide →](/docs/developer-guides/chat-bubble-control)
  </Tab>

  <Tab title="Client-Side Custom Actions">
    **Create interactive experiences**

    Build custom:

    * Action buttons that trigger your backend
    * Forms for lead capture

    [Custom Actions Guide →](/docs/developer-guides/client-side-custom-actions)

    [Client-Side Custom Forms Guide →](/docs/developer-guides/client-side-custom-forms)
  </Tab>
</Tabs>

## Best Practices

### Performance Optimization

<Tip>
  **Load the embed script asynchronously** to avoid blocking your page load. The provided embed code already handles this automatically.
</Tip>

```html theme={null}
<!-- The embed script loads asynchronously by default -->
<script>
// Your embed code here - it won't block page rendering
</script>
```

### User Experience

<AccordionGroup>
  <Accordion title="Mobile Optimization">
    * Test the chat widget on various mobile devices
    * Ensure the chat bubble doesn't interfere with mobile navigation
    * Consider using smaller initial messages on mobile screens
  </Accordion>

  <Accordion title="Accessibility">
    * The widget includes ARIA labels and keyboard navigation
    * Ensure sufficient color contrast in custom styling
    * Test with screen readers for accessibility compliance
  </Accordion>

  <Accordion title="Context Awareness">
    * Pass relevant page/user context to provide better responses
    * Use identity verification for personalized experiences
    * Clear chat context when users navigate to different sections
  </Accordion>
</AccordionGroup>

### Security Considerations

<Warning>
  **Never expose sensitive data** through the embed script. Use [identity verification](/docs/developer-guides/identity-verification) instead of passing raw user data.
</Warning>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Widget Not Appearing">
    1. Check that your agent ID is correct in the embed script
    2. Verify the script is placed correctly in your HTML
    3. Check browser console for JavaScript errors
    4. Ensure your website domain is allowed in AI agent settings
  </Accordion>

  <Accordion title="Events Not Firing">
    1. Ensure event listeners are added after the chatbase script loads
    2. Check that event names are spelled correctly
    3. Verify the chatbase object is properly initialized
    4. Use browser dev tools to debug event flow
  </Accordion>
</AccordionGroup>

## What's Next?

<CardGroup cols={2}>
  <Card title="Identity Verification" icon="shield-check" href="/docs/developer-guides/identity-verification">
    Secure your AI agent for authenticated users
  </Card>

  <Card title="REST API Integration" icon="code" href="/docs/developer-guides/api-integration">
    Integrate Chatbase with your existing backend
  </Card>

  <Card title="Client-Side Custom Actions" icon="wand-magic-sparkles" href="/docs/developer-guides/client-side-custom-actions">
    Call backend actions from the client side
  </Card>

  <Card title="Client-Side Custom Forms" icon="rectangle-list" href="/docs/developer-guides/client-side-custom-forms">
    Add interactive forms and data collection to your chat
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.