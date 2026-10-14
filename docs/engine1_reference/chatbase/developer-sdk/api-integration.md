> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# REST API Integration

> Complete guide to integrating Chatbase AI Agents using the Chatbase API v2 for custom integrations and applications.

<Info>
  **Standard Plan required.** The Chatbase API v2 is available starting from the Standard Plan. [View pricing →](https://www.chatbase.co/pricing)
</Info>

## Overview

The Chatbase REST API enables you to integrate AI-powered conversations into any application or workflow. Build custom chat experiences, automate customer interactions, and manage your AI agents programmatically.

API v2 features structured error codes, cursor-based pagination, and real-time streaming via Server-Sent Events (SSE).

**Base URL:**

```
https://www.chatbase.co/api/v2
```

<CardGroup cols={3}>
  <Card title="Send Messages" icon="message-dots">
    Chat with your AI agents and handle real-time streaming responses
  </Card>

  <Card title="Manage AI Agents" icon="robot">
    Create, configure, and update AI agents and their training sources
  </Card>

  <Card title="Access Data" icon="database">
    Retrieve conversations and messages from your AI interactions
  </Card>
</CardGroup>

## Quick Start

<Steps>
  <Step title="Get Your API Key">
    <Frame>
      <img src="https://mintcdn.com/chatbase/-HHbinxDlwZUQ3Jt/developer-guides/images/api-integration/create-api-key.png?fit=max&auto=format&n=-HHbinxDlwZUQ3Jt&q=85&s=b612070a227667e9fd54a4047bcf2f9e" alt="Creating API key in Chatbase dashboard" width="1920" height="936" data-path="developer-guides/images/api-integration/create-api-key.png" />
    </Frame>

    1. Visit your [Chatbase Dashboard](https://www.chatbase.co/dashboard)
    2. Go to **Workspace settings** → **API keys**
    3. Click **Create API Key** and copy the generated key

    <Warning>
      Store your API key securely and never expose it in client-side code.
    </Warning>
  </Step>

  <Step title="Get Your Agent ID">
    <Frame>
      <img src="https://mintcdn.com/chatbase/-HHbinxDlwZUQ3Jt/developer-guides/images/api-integration/get-agent-id.png?fit=max&auto=format&n=-HHbinxDlwZUQ3Jt&q=85&s=8c6dd8d9516be295e68c89746b973c8a" alt="Finding Agent ID in Chatbase settings" width="1924" height="934" data-path="developer-guides/images/api-integration/get-agent-id.png" />
    </Frame>

    1. Select your AI Agent in the dashboard
    2. Go to **Settings** → **General**
    3. Copy the **Agent ID** from the **Agent details** card
  </Step>

  <Step title="Send Your First Message">
    Test your integration with a simple chat request:

    ```bash theme={null}
    curl -X POST 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat' \
      -H 'Authorization: Bearer YOUR_API_KEY' \
      -H 'Content-Type: application/json' \
      -d '{
        "message": "Hello! How can you help me?",
        "stream": false
      }'
    ```

    **Expected Response:**

    ```json theme={null}
    {
      "data": {
        "id": "msg_abc123",
        "role": "assistant",
        "parts": [
          { "type": "text", "text": "Hello! I'm here to help answer your questions and assist with any information you need. What can I help you with today?" }
        ],
        "metadata": {
          "userMessageId": "msg_xyz789",
          "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          "userId": null,
          "finishReason": "stop",
          "usage": { "credits": 2 }
        }
      }
    }
    ```

    <Note>
      `stream` defaults to `true` in API v2. Set it to `false` to receive the complete message as a single JSON response.
    </Note>
  </Step>

  <Step title="Continue the Conversation">
    Conversation history is stored by Chatbase — you don't need to resend previous messages. Pass the `conversationId` from the previous response to send a follow-up:

    ```bash theme={null}
    curl -X POST 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat' \
      -H 'Authorization: Bearer YOUR_API_KEY' \
      -H 'Content-Type: application/json' \
      -d '{
        "message": "Tell me more about your pricing.",
        "conversationId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        "stream": false
      }'
    ```

    To associate a new conversation with one of your users, pass a `userId` on the first message. See [User Conversations](/docs/api-v2/user-conversations) for details.
  </Step>
</Steps>

### Chat API Streaming

The [chat API](/docs/api-v2/agents/chat-with-an-agent) streams responses in real time using Server-Sent Events. Each event is a `data:` line containing a JSON object with a `type` field, and the stream ends with `data: [DONE]`. Concatenate the `text-delta` events to build the full reply, and read the `conversationId` from the `finish` event to continue the conversation.

<CodeGroup>
  ```javascript Node.js theme={null}
  // streamer.js (Node.js 18+)

  const apiKey = '<Your-Secret-Key>'
  const agentId = '<Your Agent ID>'
  const apiUrl = `https://www.chatbase.co/api/v2/agents/${agentId}/chat`

  async function readAgentReply() {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '<Your query here>',
        stream: true,
        // conversationId: '<Conversation ID>', // omit to start a new conversation
      }),
    })

    if (!response.ok) {
      const { error } = await response.json()
      throw new Error(`${error.code}: ${error.message}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let conversationId

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep any incomplete line for the next chunk

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice('data: '.length)
        if (data === '[DONE]') continue

        const event = JSON.parse(data)
        switch (event.type) {
          case 'text-delta':
            process.stdout.write(event.delta)
            break
          case 'finish':
            conversationId = event.messageMetadata.conversationId
            break
          case 'error':
            console.error('\nStream error:', event.errorText)
            break
        }
      }
    }

    console.log('\nConversation ID:', conversationId)
  }

  readAgentReply().catch((error) => console.log('Error:', error.message))
  ```

  ```python Python theme={null}
  ## streamer.py

  import json
  import requests

  api_key = '<Your-Secret-Key>'
  agent_id = '<Your Agent ID>'
  api_url = f'https://www.chatbase.co/api/v2/agents/{agent_id}/chat'

  def read_agent_reply():
      try:
          headers = {
              'Authorization': f'Bearer {api_key}',
              'Content-Type': 'application/json'
          }

          data = {
              'message': '<Your query here>',
              'stream': True,
              # 'conversationId': '<Conversation ID>',  # omit to start a new conversation
          }

          response = requests.post(api_url, json=data, headers=headers, stream=True)
          response.raise_for_status()

          conversation_id = None
          for line in response.iter_lines(decode_unicode=True):
              if not line or not line.startswith('data: '):
                  continue
              payload = line[len('data: '):]
              if payload == '[DONE]':
                  continue

              event = json.loads(payload)
              if event['type'] == 'text-delta':
                  print(event['delta'], end='', flush=True)
              elif event['type'] == 'finish':
                  conversation_id = event['messageMetadata']['conversationId']
              elif event['type'] == 'error':
                  print(f"\nStream error: {event['errorText']}")

          print(f'\nConversation ID: {conversation_id}')

      except requests.exceptions.RequestException as error:
          print('Error:', error)

  read_agent_reply()
  ```
</CodeGroup>

<Tip>
  For the full list of stream events — including client action (tool call) events — see the [Streaming guide](/docs/api-v2/streaming).
</Tip>

## Error Handling

API v2 returns structured errors with a machine-readable `code`:

```json theme={null}
{
  "error": {
    "code": "RATE_LIMIT_TOO_MANY_REQUESTS",
    "message": "Too many requests, please try again later"
  }
}
```

Every response includes an `x-request-id` header — include it when contacting support. See [Error Handling](/docs/api-v2/error-handling) for all error codes and [Rate Limiting](/docs/api-v2/authentication#rate-limiting) for limits and retry guidance.

## Performance Best Practices

<Tip>
  **Optimization Strategies:**

  * Use streaming for chat responses to improve perceived performance
  * Reuse `conversationId` for follow-ups instead of starting new conversations
  * Cache AI agent responses when appropriate
  * Respect the `Retry-After` header when you receive a `429` response
  * Use cursor-based [pagination](/docs/api-v2/pagination) when listing conversations, messages, or sources
</Tip>

## 🚀 Try It Live!

Ready to see the magic in action? Dive straight into our interactive playground where you can test every API endpoint, experiment with real responses, and build your integration in real-time.

<CardGroup cols={1}>
  <Card title="🎮 Launch Interactive Playground" icon="play" href="/docs/api-v2/agents/chat-with-an-agent">
    Test APIs instantly • No setup required • Real-time responses • Copy working code snippets
  </Card>
</CardGroup>

### Key API Endpoints

<CardGroup cols={2}>
  <Card title="Chat API" icon="message-dots" href="/docs/api-v2/agents/chat-with-an-agent">
    Send messages and receive AI responses with streaming support
  </Card>

  <Card title="AI Agent Management" icon="robot" href="/docs/api-v2/agents/create-agent">
    Create, update, and configure AI agents programmatically
  </Card>

  <Card title="Conversations" icon="messages" href="/docs/api-v2/conversations/list-conversations">
    Access chat history and conversation messages
  </Card>

  <Card title="Sources" icon="database" href="/docs/api-v2/sources/create-source">
    Add and manage the training sources for your AI agents
  </Card>
</CardGroup>

<Card title="API v2 Overview" icon="book" href="/docs/api-v2/overview">
  Explore the full API v2 reference — authentication, streaming, client actions, pagination, and more
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.