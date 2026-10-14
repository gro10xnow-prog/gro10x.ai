> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Client-Side Custom Actions

> Execute custom actions directly in your user's browser with full control and seamless integration

Client-side custom actions allow you to execute code directly in your user's browser, giving you complete control over the execution environment and enabling seamless integration with your existing frontend systems.

## Benefits of Client-Side Actions

<CardGroup cols={2}>
  <Card title="Direct Integration" icon="puzzle-piece">
    Integrate seamlessly with your existing frontend architecture and user systems
  </Card>

  <Card title="User Context Access" icon="user">
    Access user-specific information and browser APIs not available on the server
  </Card>

  <Card title="Enhanced User Experience" icon="star">
    Create interactive, responsive experiences with immediate feedback and smooth workflows
  </Card>

  <Card title="Frontend Control" icon="code">
    Use your existing authentication, state management, and API integration patterns
  </Card>
</CardGroup>

## How Client-Side Actions Work

When a user interacts with your AI agent and triggers a client-side action:

1. The AI agent sends an event to your website window with action details
2. Your registered tool function executes in the browser
3. The result is sent back to the AI agent
4. The conversation continues with the action response

## Setup Guide

### Prerequisites

<Info>
  A website with the Chatbase embed script already installed and working.
  New to Chatbase? Check out [Your First AI Agent](/docs/user-guides/quick-start/your-first-agent) to get started with the embed script first.
</Info>

<Steps>
  <Step title="Create Your Custom Action">
    Create a new custom action in your Chatbase dashboard:

    1. Go to Chatbase dashboard [dashboard](https://chatbase.co/dashboard) page
    2. Select the AI agent you want to create the custom action for
    3. Navigate to **Build > Actions** → **Create action** → **Custom action**
    4. Fill in the action details:
       * **Name**: A unique identifier (e.g., `get_weather`)
       * **Description**: What the action does
       * **Parameters**: Define any data needed to have the AI agent collect from the user
    5. **Important**: Select **"Client"** as the action type to enable client-side execution
    6. Click on the **Save and Continue** button and enable the action.

    <Frame>
      <img src="https://mintcdn.com/chatbase/-HHbinxDlwZUQ3Jt/developer-guides/images/client-side-custom-actions/client-custom-action.png?fit=max&auto=format&n=-HHbinxDlwZUQ3Jt&q=85&s=265e021f09c25588ee355bb96096cf1e" alt="Custom action form" width="1469" height="798" data-path="developer-guides/images/client-side-custom-actions/client-custom-action.png" />
    </Frame>
  </Step>

  <Step title="Register Your Action Functions">
    Use the `registerTools` method to provide the actual implementation for your actions:

    ```javascript theme={null}
    window.chatbase("registerTools", {
      get_weather: async (args, user) => {
        try {
          // Access the parameters defined in your action configuration
          const { location } = args;
          
          // Make API requests to your backend
          const response = await fetch(`/api/weather?location=${location}`);

          if (!response.ok) {
            throw new Error('Failed to fetch weather data');
          }

          const weatherData = await response.json();

          return {
            status: "success",
            data: {
              temperature: weatherData.temperature,
              condition: weatherData.condition,
              location: location
            }
          };
        } catch (error) {
          return {
            status: "error",
            error: error.message
          };
        }
      },

      send_notification: async (args, user) => {
        try {
          // Show a simple alert with data collected from the user by the Ai agent
          alert(`${args.title}\n\n${args.message}`);
          
          return {
            status: "success",
            data: "Alert shown successfully"
          };
        } catch (error) {
          return {
            status: "error",
            error: "Failed to show alert"
          };
        }
      }
    });
    ```

    <Tip>
      Register all your tools in a single `registerTools` call. Multiple calls will override previously registered tools.
    </Tip>

    <Warning>
      The action names created in the dashboard must exactly match the function names you register with `registerTools`.
    </Warning>
  </Step>
</Steps>

## Function Parameters

Every client-side action function receives two parameters:

<ParamField path="args" type="object" required>
  Contains all the parameters defined in your custom action configuration. The structure matches exactly what you defined in the dashboard.
</ParamField>

<ParamField path="user" type="object">
  Contains user information that varies depending on your identity verification setup.

  <Expandable title="When identity verification is properly configured">
    <ResponseField name="user_id" type="string">
      Unique identifier for the authenticated user as provided during the identify call.
    </ResponseField>

    <ResponseField name="user_hash" type="string">
      Hash of the user\_id used for verification (generated server-side).
    </ResponseField>

    <ResponseField name="anon_user_id" type="string">
      Internal anonymous user identifier. You can ignore this field.
    </ResponseField>

    <ResponseField name="chatbase_anon_id" type="string">
      Internal Chatbase anonymous identifier. You can ignore this field.
    </ResponseField>

    <ResponseField name="user_metadata" type="object">
      Custom user data passed during the identify call (e.g., name, email, company). This field is only present if metadata was provided during identification.
    </ResponseField>
  </Expandable>

  <Expandable title="When identity verification is not properly configured">
    <ResponseField name="anon_user_id" type="string">
      Internal anonymous user identifier. You can ignore this field.
    </ResponseField>

    <ResponseField name="chatbase_anon_id" type="string">
      Internal Chatbase anonymous identifier. You can ignore this field.
    </ResponseField>

    <ResponseField name="user_metadata" type="object">
      Custom user data passed during any identify calls. This field is only present if metadata was provided during identification.
    </ResponseField>
  </Expandable>
</ParamField>

<Note>
  The anonymous IDs (`anon_user_id` and `chatbase_anon_id`) are internal identifiers used by Chatbase and can be safely ignored in your custom form implementations.
</Note>

## Response Format

Your action functions must return responses in a specific format:

<Tabs>
  <Tab title="Success Response">
    When your action succeeds, return both `status` and `data`:

    ```javascript theme={null}
    {
      status: "success",
      data: responseData // Can be string, object, array, etc.
    }
    ```

    **Examples:**

    <CodeGroup>
      ```javascript Object Response theme={null}
      {
        status: "success",
        data: {
          temperature: 72,
          condition: "sunny",
          humidity: 45,
          forecast: ["Clear skies", "Light breeze"]
        }
      }
      ```

      ```javascript String Response   theme={null}
      {
        status: "success",
        data: "The weather in New York is currently 72°F and sunny with light winds."
      }
      ```

      ```javascript Array Response theme={null}
      {
        status: "success", 
        data: [
          { name: "Product 1", price: 29.99 },
          { name: "Product 2", price: 49.99 }
        ]
      }
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Error Response">
    When an error occurs, return `status` and `error`:

    ```javascript theme={null}
    {
      status: "error",
      error: "Descriptive error message"
    }
    ```

    **Examples:**

    ```javascript theme={null}
    // API failure
    {
      status: "error",
      error: "Unable to connect to weather service. Please try again."
    }

    // Validation error
    {
      status: "error", 
      error: "Location parameter is required"
    }

    // Authentication error
    {
      status: "error",
      error: "User must be logged in to perform this action"
    }
    ```
  </Tab>
</Tabs>

## Advanced Examples

This example shows client-side actions utilizing the browser geolocation API to get the user's zip code.

<Frame>
  <img src="https://mintcdn.com/chatbase/-HHbinxDlwZUQ3Jt/developer-guides/images/client-side-custom-actions/custom-actions-zip-code-example.png?fit=max&auto=format&n=-HHbinxDlwZUQ3Jt&q=85&s=8523f33a71c48f56765169ada9563921" alt="Advanced example of a client-side action using the browser geolocation API" width="2940" height="1592" data-path="developer-guides/images/client-side-custom-actions/custom-actions-zip-code-example.png" />
</Frame>

<CodeGroup>
  ```javascript Browser Integration theme={null}
  window.chatbase("registerTools", {
    get_zip_code: async (args, user) => {
      try {
        // Use browser geolocation API
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        
        const response = await fetch(`/api/location-info?lat=${latitude}&lon=${longitude}`);
        const { zip_code } = await response.json();

        return {
          status: "success",
          data: {
            zip_code: zip_code,
          }
        };
      } catch (error) {
        return {
          status: "error",
          error: "Unable to access location information"
        };
      }
    }
  });
  ```
</CodeGroup>

<Frame>
  <img width="300" height="300" src="https://mintcdn.com/chatbase/-HHbinxDlwZUQ3Jt/developer-guides/images/client-side-custom-actions/custom-actions-zip-code-example-result.png?fit=max&auto=format&n=-HHbinxDlwZUQ3Jt&q=85&s=a5467fe3a5f19c93b83d4e92760111ec" alt="Advanced example of a client-side action using the browser geolocation API result" data-path="developer-guides/images/client-side-custom-actions/custom-actions-zip-code-example-result.png" />
</Frame>

## Best Practices

<AccordionGroup>
  <Accordion title="Error Handling">
    Always wrap your action logic in try-catch blocks and return meaningful error messages:

    ```javascript theme={null}
    window.chatbase("registerTools", {
      my_action: async (args, user) => {
        try {
          // Validate input parameters
          if (!args.requiredParam) {
            return {
              status: "error",
              error: "Required parameter is missing"
            };
          }

          // Your action logic here
          const result = await performAction(args);
          
          return {
            status: "success",
            data: result
          };
        } catch (error) {
          // Log for debugging.
          console.error('Action failed:', error);
          
          return {
            status: "error",
            error: "Action failed. Please try again."
          };
        }
      }
    });
    ```
  </Accordion>

  <Accordion title="Input Validation">
    Always validate user inputs and handle edge cases:

    ```javascript theme={null}
    window.chatbase("registerTools", {
      calculate_shipping: async (args, user) => {
        const { weight, destination, shippingMethod } = args;
        
        // Validate required parameters
        if (!weight || weight <= 0) {
          return {
            status: "error",
            error: "Valid weight is required"
          };
        }
        
        if (!destination || destination.length < 2) {
          return {
            status: "error", 
            error: "Valid destination is required"
          };
        }

        try {
          const result = await calculateShipping(weight, destination, shippingMethod);
          return { status: "success", data: result };
        } catch (error) {
          return { status: "error", error: "Shipping calculation failed" };
        }
      }
    });
    ```
  </Accordion>

  <Accordion title="Performance Optimization">
    * Cache frequently used data in browser storage
    * Use appropriate timeouts for external API calls
    * Minimize the size of returned data

    ```javascript theme={null}
    window.chatbase("registerTools", {
      get_cached_data: async (args, user) => {
        const cacheKey = `data_${args.type}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const isStale = Date.now() - timestamp > 300000; // 5 minutes
          
          if (!isStale) {
            return { status: "success", data };
          }
        }
        
        // Fetch fresh data if not cached or stale
        const freshData = await fetchData(args.type);
        localStorage.setItem(cacheKey, JSON.stringify({
          data: freshData,
          timestamp: Date.now()
        }));
        
        return { status: "success", data: freshData };
      }
    });
    ```
  </Accordion>
</AccordionGroup>

<Warning>
  **Environment Limitations**: Client-side custom forms will not function in:

  * Chatbase Playground environment
  * Action Preview mode
  * Compare features

  Testing this action should be done in your actual website environment. Embed the [JavaScript script](/docs/developer-guides/javascript-embed) in your website and test the action.
</Warning>

<Info>
  **Response Size Limits:** Keep your response data under reasonable size limits to ensure good performance. Very large responses may be truncated or cause timeouts.
</Info>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Action Not Found Error">
    **Problem:** Console shows "Tool \[name] not found"

    **Solutions:**

    * Ensure action names match exactly between dashboard and `registerTools`
    * Check that `registerTools` is called after the AI agent loads
    * Verify the action is marked as "client-side" in dashboard
  </Accordion>

  <Accordion title="No Response from Action">
    **Problem:** Action executes but AI agent doesn't receive response

    **Solutions:**

    * Check browser console for JavaScript errors
    * Ensure you're returning the correct response format
    * Verify async functions are properly awaited
    * Check for uncaught exceptions in your action code
  </Accordion>

  <Accordion title="User Context Issues">
    **Problem:** User parameter is null when expected

    **Solutions:**

    * Verify [identity verification](/docs/developer-guides/identity-verification) is properly configured
    * Test with and without authenticated users in your implementation
    * Add fallback logic for when user context is unavailable
  </Accordion>
</AccordionGroup>

## Next Steps

<CardGroup cols={2}>
  <Card title="Client-Side Custom Forms" icon="rectangle-list" href="/docs/developer-guides/client-side-custom-forms">
    Add interactive forms and data collection to your chat
  </Card>

  <Card title="Widget Control" icon="sliders" href="/docs/developer-guides/chat-bubble-control">
    Programmatically control the chat interface
  </Card>

  <Card title="Event Listeners" icon="ear" href="/docs/developer-guides/chatbot-event-listeners">
    Learn to listen for and respond to chat events in real-time
  </Card>

  <Card title="Custom Initial Messages" icon="message" href="/docs/developer-guides/custom-initial-messages">
    Create dynamic, personalized initial messages for users
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.