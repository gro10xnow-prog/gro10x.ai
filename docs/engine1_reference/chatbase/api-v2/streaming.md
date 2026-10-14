> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Streaming

> How to use Server-Sent Events (SSE) streaming with the Chatbase API v2 for real-time responses.

## Enabling Streaming

To receive a streaming response, set `stream: true` in the request body of the chat or retry endpoints:

```bash theme={null}
curl -X POST 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Explain quantum computing",
    "stream": true,
    "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "userId": "user_abc123"
  }'
```

## Request Body

<ParamField body="message" type="string">
  The user message to send to the AI agent. Omit to continue the conversation after submitting a client action result.
</ParamField>

<ParamField body="stream" type="boolean" default={true}>
  Stream the response as SSE. Defaults to `true`.
</ParamField>

<ParamField body="conversationId" type="string">
  Continue an existing conversation. Omit to create a new one.
</ParamField>

<ParamField body="userId" type="string">
  Associate a user with a new conversation. Max 128 chars, `[a-zA-Z0-9._-]` only. Ignored when `conversationId` is provided.
</ParamField>

<Note>
  Once set, a conversation's `userId` is immutable — it cannot be changed or removed. See [User Conversations](/docs/api-v2/user-conversations) for details on managing per-user conversation history.
</Note>

The response uses `Content-Type: text/event-stream` and follows the **AI SDK UIMessage Stream** protocol. Events arrive as Server-Sent Events — each event is a `data:` line whose payload is a JSON object with a `type` field, and the stream terminates with `data: [DONE]`:

```
data: {"type":"start","messageId":"msg_abc123"}

data: {"type":"text-delta","id":"text_001","delta":"Hello"}

data: [DONE]
```

## Event Types

<Tabs>
  <Tab title="Text Events" icon="font">
    ### `start`

    Emitted once at the beginning of a new message. Contains the message ID.

    ```json theme={null}
    { "type": "start", "messageId": "msg_abc123" }
    ```

    ### `text-start`

    Emitted at the beginning of a text block.

    ```json theme={null}
    { "type": "text-start", "id": "text_001" }
    ```

    ### `text-delta`

    Emitted for each chunk of generated text. Concatenate all deltas to build the full response.

    ```json theme={null}
    { "type": "text-delta", "id": "text_001", "delta": "Quantum computing is" }
    ```

    ### `text-end`

    Emitted when a text block is complete.

    ```json theme={null}
    { "type": "text-end", "id": "text_001" }
    ```
  </Tab>

  <Tab title="Client Action Events" icon="bolt">
    These events are emitted when the AI agent invokes a [client action](/docs/api-v2/client-actions). The `toolName` corresponds to the name of the configured action.

    ### `tool-input-start`

    Emitted at the start of a client action input.

    ```json theme={null}
    { "type": "tool-input-start", "toolCallId": "call_abc123", "toolName": "lookupOrder" }
    ```

    ### `tool-input-delta`

    Emitted for each chunk of the action input as it streams.

    ```json theme={null}
    { "type": "tool-input-delta", "toolCallId": "call_abc123", "inputTextDelta": "{\"order" }
    ```

    ### `tool-input-available`

    Emitted when the complete action input is ready.

    <Tip>You can read the full `input` object directly from this event without concatenating the preceding deltas.</Tip>

    ```json theme={null}
    { "type": "tool-input-available", "toolCallId": "call_abc123", "toolName": "lookupOrder", "input": { "orderId": "ORD-123" } }
    ```

    ### `tool-output-available`

    Emitted when a tool execution result is available.

    <Tip>The full `output` can be read directly from this event.</Tip>

    ```json theme={null}
    { "type": "tool-output-available", "toolCallId": "call_abc123", "output": { "status": "shipped", "eta": "2026-04-03" } }
    ```

    <Info>
      For the full client action flow — including how to submit results and continue the conversation — see [Client Actions](/docs/api-v2/client-actions).
    </Info>
  </Tab>

  <Tab title="Step & Completion Events" icon="flag-checkered">
    ### `start-step`

    Emitted at the start of a processing step.

    ```json theme={null}
    { "type": "start-step" }
    ```

    ### `finish-step`

    Emitted at the end of a processing step.

    ```json theme={null}
    { "type": "finish-step" }
    ```

    ### `finish`

    Emitted once when generation is complete. Carries the finish reason and Chatbase-specific metadata — see [Metadata](#metadata).

    ```json theme={null}
    {
      "type": "finish",
      "finishReason": "stop",
      "messageMetadata": {
        "messageId": "msg_abc123",
        "userMessageId": "msg_xyz789",
        "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        "userId": "user_abc123",
        "usage": { "credits": 2 }
      }
    }
    ```

    ### `error`

    Emitted if an error occurs during generation. The stream may have been partially delivered.

    ```json theme={null}
    { "type": "error", "errorText": "An error occurred during generation" }
    ```
  </Tab>
</Tabs>

## Metadata

The `finish` event carries the finish reason and, nested under `messageMetadata`, the Chatbase-specific metadata:

```json theme={null}
{
  "type": "finish",
  "finishReason": "stop",
  "messageMetadata": {
    "messageId": "msg_abc123",
    "userMessageId": "msg_xyz789",
    "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "userId": "user_abc123",
    "usage": { "credits": 2 }
  }
}
```

<ResponseField name="finishReason" type="string" required>
  Why the model stopped generating:

  * `"stop"` — normal completion
  * `"error"` — an error occurred
  * `"tool-calls"` — the AI agent invoked a client action — submit the result and continue

  Other values (`"length"`, `"content-filter"`, `"other"`, `"unknown"`) are possible but rare.
</ResponseField>

<ResponseField name="messageMetadata" type="object" required>
  <Expandable title="properties">
    <ResponseField name="messageId" type="string" required>
      Unique ID of the assistant message.
    </ResponseField>

    <ResponseField name="userMessageId" type="string" required>
      The ID of the user message that triggered this response. For continuation responses, this is the last user message in the conversation.
    </ResponseField>

    <ResponseField name="conversationId" type="string" required>
      The conversation ID. Use this for follow-up messages.
    </ResponseField>

    <ResponseField name="userId" type="string | null" required>
      The user ID associated with this conversation, or `null` if none.
    </ResponseField>

    <ResponseField name="usage" type="object" required>
      <Expandable title="properties">
        <ResponseField name="credits" type="number" required>
          Credits consumed by this request.
        </ResponseField>
      </Expandable>
    </ResponseField>
  </Expandable>
</ResponseField>

<Note>
  The protocol also allows standalone `message-metadata` events mid-stream, with the same object nested under a `messageMetadata` key. Handle them if present, but expect the metadata on the `finish` event.
</Note>

The stream terminates with `data: [DONE]`.

## Code Examples

<CodeGroup>
  ```javascript Node.js theme={null}
  const response = await fetch(
    "https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer YOUR_API_KEY",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Explain quantum computing",
        stream: true,
        // conversationId: "a1b2c3d4-...", // omit to start a new conversation
        // userId: "user_abc123",          // associate a user with the conversation
      }),
    }
  );

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let conversationId;
  let userId;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value, { stream: true }).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice("data: ".length);
      if (data === "[DONE]") continue;
      const event = JSON.parse(data);

      switch (event.type) {
        case "start":
          console.log("Message ID:", event.messageId);
          break;
        case "text-delta":
          process.stdout.write(event.delta);
          break;
        case "tool-input-available":
          console.log("\nClient action requested:", event.toolName, event.input);
          // Handle client action — see Client Actions guide
          break;
        case "finish":
          conversationId = event.messageMetadata.conversationId;
          userId = event.messageMetadata.userId;
          console.log("\nFinish reason:", event.finishReason);
          console.log("Credits used:", event.messageMetadata.usage.credits);
          break;
        case "error":
          console.error("Stream error:", event.errorText);
          break;
      }
    }
  }
  ```

  ```python Python theme={null}
  import requests
  import json

  response = requests.post(
      "https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat",
      headers={
          "Authorization": "Bearer YOUR_API_KEY",
          "Content-Type": "application/json",
      },
      json={
          "message": "Explain quantum computing",
          "stream": True,
          # "conversationId": "a1b2c3d4-...",  # omit to start a new conversation
          # "userId": "user_abc123",            # associate a user with the conversation
      },
      stream=True,
  )

  conversation_id = None
  user_id = None

  for line in response.iter_lines():
      if not line:
          continue
      line = line.decode()
      if not line.startswith("data: "):
          continue
      data = line[len("data: "):]
      if data == "[DONE]":
          continue
      event = json.loads(data)

      if event["type"] == "start":
          print(f"Message ID: {event['messageId']}")
      elif event["type"] == "text-delta":
          print(event["delta"], end="", flush=True)
      elif event["type"] == "tool-input-available":
          print(f"\nClient action requested: {event['toolName']}", event["input"])
          # Handle client action — see Client Actions guide
      elif event["type"] == "finish":
          metadata = event["messageMetadata"]
          conversation_id = metadata["conversationId"]
          user_id = metadata["userId"]
          print(f"\nFinish reason: {event['finishReason']}")
          print(f"Credits used: {metadata['usage']['credits']}")
      elif event["type"] == "error":
          print(f"Stream error: {event['errorText']}")
  ```

  ```bash curl theme={null}
  curl -N -X POST 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat' \
    -H 'Authorization: Bearer YOUR_API_KEY' \
    -H 'Content-Type: application/json' \
    -d '{
      "message": "Explain quantum computing",
      "stream": true,
      "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "userId": "user_abc123"
    }'
  ```
</CodeGroup>

## Non-Streaming Mode

When `stream` is set to `false`, the API returns a standard JSON response with the complete message:

<Tabs>
  <Tab title="Text Response">
    ```json theme={null}
    {
      "data": {
        "id": "msg_abc123",
        "role": "assistant",
        "parts": [
          { "type": "text", "text": "Quantum computing is a type of computation..." }
        ],
        "metadata": {
          "userMessageId": "msg_xyz789",
          "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          "userId": "user_abc123",
          "finishReason": "stop",
          "usage": { "credits": 2 }
        }
      }
    }
    ```
  </Tab>

  <Tab title="Client Action Response">
    When a client action is invoked, the response includes `tool-call` parts and `finishReason: "tool-calls"`:

    ```json theme={null}
    {
      "data": {
        "id": "msg_abc123",
        "role": "assistant",
        "parts": [
          { "type": "text", "text": "Let me look up that order for you." },
          { "type": "tool-call", "toolCallId": "call_abc123", "toolName": "lookupOrder", "input": { "orderId": "ORD-123" } }
        ],
        "metadata": {
          "userMessageId": "msg_xyz789",
          "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          "userId": "user_abc123",
          "finishReason": "tool-calls",
          "usage": { "credits": 2 }
        }
      }
    }
    ```

    See [Client Actions](/docs/api-v2/client-actions) for how to submit the result and continue the conversation.
  </Tab>
</Tabs>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.