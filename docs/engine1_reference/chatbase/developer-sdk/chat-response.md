> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# ChatResponse

> Reference for ChatResponse, Message, MessagePart, FinishReason, and Usage, the types returned by send, retry, and sendNonStreaming.

## ChatResponse

`struct ChatResponse: Sendable`

What `send`, `retry`, and `sendNonStreaming` give you back.

```swift theme={null}
public struct ChatResponse: Sendable {
    public let message: Message
    public let conversationId: String
    public let userMessageId: String?
    public let finishReason: FinishReason
    public let usage: Usage
}
```

<ResponseField name="message" type="Message" required>
  The AI agent's reply. See [Message](#message).
</ResponseField>

<ResponseField name="conversationId" type="String" required>
  The conversation this reply belongs to. Pass it to your next `send` to continue.
</ResponseField>

<ResponseField name="userMessageId" type="String?">
  The server's ID for the user message that prompted this reply.
</ResponseField>

<ResponseField name="finishReason" type="FinishReason" required>
  Why the reply ended. See [FinishReason](#finishreason).
</ResponseField>

<ResponseField name="usage" type="Usage" required>
  How many credits it used. See [Usage](#usage).
</ResponseField>

```swift theme={null}
let response = try await client.send("Hello")

print(response.message.text)       // the whole reply
print(response.message.id)         // pass to retry(messageId:)
print(response.conversationId)     // pass to the next send
print(response.usage.credits)
```

<Note>
  When the AI agent uses tools, the reply takes several rounds. `message.text` is all the text from every round joined together, and `message.id` is the ID of the final message.
</Note>

## Message

`struct Message: Identifiable, Sendable`

Used both for the reply inside `ChatResponse` and for each item from [`listMessages`](/docs/ios-sdk/conversations#listmessages).

```swift theme={null}
public struct Message: Identifiable, Sendable {
    public var id: String
    public var text: String
    public var sender: MessageSender
    public var date: Date
    public var feedback: MessageFeedback?
    public var score: Double?
    public var parts: [MessagePart]
}
```

<ResponseField name="id" type="String" required>
  The message ID.
</ResponseField>

<ResponseField name="text" type="String" required>
  All the text joined together, which is handy for a plain bubble.
</ResponseField>

<ResponseField name="sender" type="MessageSender" required>
  `.user` or `.agent`.
</ResponseField>

<ResponseField name="date" type="Date" required>
  When the message was created. Falls back to the current time if the server does not send one.
</ResponseField>

<ResponseField name="feedback" type="MessageFeedback?">
  `.positive`, `.negative`, or `nil`. Set for messages loaded from history.
</ResponseField>

<ResponseField name="score" type="Double?">
  A score from the server, when there is one.
</ResponseField>

<ResponseField name="parts" type="[MessagePart]" required>
  The message broken into pieces: text, tool calls, and tool results, in order.
</ResponseField>

<Tip>
  Use `text` for a simple chat log. Use `parts` when you want to show tool activity in the conversation. `ConversationState` uses `parts`. See [SwiftUI](/docs/ios-sdk/swiftui#uimessage).
</Tip>

## MessagePart

```swift theme={null}
public enum MessagePart: Sendable {
    case text(String)
    case toolCall(toolCallId: String, toolName: String, input: JSONValue)
    case toolResult(toolCallId: String, toolName: String, output: JSONValue)
}
```

<Tabs>
  <Tab title="text">
    ### .text

    Text written by the AI agent, or sent by the user.

    ```swift theme={null}
    case text(String)
    ```

    The value is the text itself.
  </Tab>

  <Tab title="toolCall">
    ### .toolCall

    The AI agent asking for a tool.

    ```swift theme={null}
    case toolCall(toolCallId: String, toolName: String, input: JSONValue)
    ```

    <ResponseField name="toolCallId" type="String" required>
      An ID for this tool call. It matches the `toolCallId` on the matching `.toolResult`.
    </ResponseField>

    <ResponseField name="toolName" type="String" required>
      The tool's name, which matches the Custom Action name.
    </ResponseField>

    <ResponseField name="input" type="JSONValue" required>
      What the AI agent passed to the tool. An empty object if it passed nothing. See [JSONValue](/docs/ios-sdk/json-value).
    </ResponseField>
  </Tab>

  <Tab title="toolResult">
    ### .toolResult

    What the tool returned.

    ```swift theme={null}
    case toolResult(toolCallId: String, toolName: String, output: JSONValue)
    ```

    <ResponseField name="toolCallId" type="String" required>
      Matches the `.toolCall` it belongs to.
    </ResponseField>

    <ResponseField name="toolName" type="String" required>
      The tool's name.
    </ResponseField>

    <ResponseField name="output" type="JSONValue" required>
      The tool's result. An object with an `error` key means the tool failed. See [JSONValue](/docs/ios-sdk/json-value).
    </ResponseField>
  </Tab>
</Tabs>

```swift theme={null}
for part in message.parts {
    switch part {
    case .text(let text):
        renderBubble(text)
    case .toolCall(let id, let name, let input):
        beginToolCard(id: id, name: name, input: input)
    case .toolResult(let id, _, let output):
        completeToolCard(id: id, output: output)
    }
}
```

## MessageSender

```swift theme={null}
public enum MessageSender: Sendable {
    case user
    case agent
}
```

Anything that is not from the user counts as `.agent`, including messages typed by a person who has taken over the conversation.

## MessageFeedback

```swift theme={null}
public enum MessageFeedback: String, Codable, Sendable {
    case positive   // "positive"
    case negative   // "negative"
}
```

## FinishReason

```swift theme={null}
public enum FinishReason: String, Sendable {
    case stop        // "stop"       finished normally
    case error       // "error"      something went wrong
    case toolCalls   // "tool-calls" waiting for tool results
}
```

<Note>
  After `send` or `retry`, this is almost always `.stop`, because the SDK runs the tools for you and waits for the real answer. You will see `.toolCalls` from [`sendNonStreaming`](/docs/ios-sdk/streaming#sendnonstreaming), which skips tools: the AI agent wanted one and never got an answer.

  Any finish reason the SDK does not recognize is treated as `.stop`.
</Note>

## Usage

```swift theme={null}
public struct Usage: Sendable {
    public let credits: Double
}
```

<ResponseField name="credits" type="Double" required>
  How many message credits this reply used. `0` if the server did not report any.
</ResponseField>

## Related

<CardGroup cols={2}>
  <Card title="Streaming" icon="wave-pulse" href="/docs/ios-sdk/streaming">
    The methods that return a ChatResponse
  </Card>

  <Card title="Conversation & Pagination" icon="list" href="/docs/ios-sdk/conversation-models">
    Conversation, status, and paging types
  </Card>

  <Card title="JSONValue" icon="brackets-curly" href="/docs/ios-sdk/json-value">
    Reading tool data
  </Card>

  <Card title="Streaming Types" icon="bolt" href="/docs/ios-sdk/streaming-events">
    Callbacks and stream types
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.