> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Streaming Types

> Reference for StreamCallbacks, ToolCallInfo, ToolResultInfo, StreamEvent, and related streaming types.

## StreamCallbacks

`struct StreamCallbacks: Sendable`

The callbacks you pass to `send(_:conversationId:configure:)` and `retry(conversationId:messageId:configure:)`.

```swift theme={null}
public struct StreamCallbacks: Sendable {
    public var onTextDelta: (@Sendable (String) async -> Void)?
    public var onToolCall: (@Sendable (ToolCallInfo) async -> Void)?
    public var onToolResult: (@Sendable (ToolResultInfo) async -> Void)?

    public init()
}
```

<ResponseField name="onTextDelta" type="(@Sendable (String) async -> Void)?">
  Runs for each chunk of text. Add it to the current bubble.
</ResponseField>

<ResponseField name="onToolCall" type="(@Sendable (ToolCallInfo) async -> Void)?">
  Runs when the AI agent asks for a tool, before your handler runs.
</ResponseField>

<ResponseField name="onToolResult" type="(@Sendable (ToolResultInfo) async -> Void)?">
  Runs when a tool result is ready, whether it came from your handler or from the server.
</ResponseField>

Callbacks you do not set are ignored:

```swift theme={null}
let response = try await client.send("Hello") { cb in
    cb.onTextDelta = { chunk in await self.append(chunk) }
    // onToolCall and onToolResult not set
}
```

<Note>
  There is no `onStart`, `onFinish`, or `onError` callback. The `async throws` signature covers all three: the call returns a `ChatResponse` when it works and throws when it does not. See [Streaming](/docs/ios-sdk/streaming#streamcallbacks).
</Note>

<Warning>
  Callbacks do not run on the main thread. Use `await MainActor.run { ... }`, or call into a `@MainActor` type, before touching your UI. The SDK waits for each callback before reading more of the reply, so keep them quick.
</Warning>

## ToolCallInfo

`struct ToolCallInfo: Sendable`

Passed to `onToolCall`.

```swift theme={null}
public struct ToolCallInfo: Sendable {
    public let toolCallId: String
    public let toolName: String
    public let input: JSONValue
}
```

<ResponseField name="toolCallId" type="String" required>
  An ID for this tool call. Use it to match this call with its `ToolResultInfo`.
</ResponseField>

<ResponseField name="toolName" type="String" required>
  The tool's name, which matches the Custom Action on your AI agent.
</ResponseField>

<ResponseField name="input" type="JSONValue" required>
  Everything the AI agent passed to the tool. See [JSONValue](/docs/ios-sdk/json-value).
</ResponseField>

```swift theme={null}
cb.onToolCall = { info in
    let city = info.input["city"]?.stringValue
    await self.showToolCard(id: info.toolCallId, name: info.toolName, city: city)
}
```

## ToolResultInfo

`struct ToolResultInfo: Sendable`

Passed to `onToolResult`.

```swift theme={null}
public struct ToolResultInfo: Sendable {
    public let toolCallId: String
    public let toolName: String
    public let output: JSONValue
}
```

<ResponseField name="toolCallId" type="String" required>
  Matches the `toolCallId` on the `ToolCallInfo` it belongs to.
</ResponseField>

<ResponseField name="toolName" type="String" required>
  The tool's name.
</ResponseField>

<ResponseField name="output" type="JSONValue" required>
  What the tool returned. An object with an `error` key means it failed. See [JSONValue](/docs/ios-sdk/json-value).
</ResponseField>

```swift theme={null}
cb.onToolResult = { info in
    let failed = info.output["error"] != nil
    await self.completeToolCard(id: info.toolCallId, failed: failed)
}
```

<Tip>
  Both callbacks also run for tools the server handles, not just your own, so one piece of UI can show every tool the AI agent uses.
</Tip>

## ToolHandler

```swift theme={null}
public typealias ToolHandler = @Sendable (JSONValue) async throws -> JSONValue
```

The shape of a tool handler you register with `client.tool(_:handler:)`. See [Client-Side Tools](/docs/ios-sdk/client-side-tools).

## Lower-Level Types

The types below are the pieces a reply is made of. The SDK handles them for you and gives you the results through `StreamCallbacks` and `ChatResponse`, so you do not work with them directly. They are public so you can read what a reply contains and name the types in your own code.

<Warning>
  There is no way to read these events as they arrive. `ChatbaseClient` has no Combine publisher and no `AsyncSequence`, so there is no equivalent of Android's `sendMessageStream`. Use `send` with callbacks. If the callbacks do not give you what you need, contact support.
</Warning>

### StreamEvent

```swift theme={null}
public enum StreamEvent: Sendable {
    case messageStarted(id: String)
    case textChunk(String)
    case toolCall(ToolCall)
    case toolOutput(toolCallId: String, output: JSONValue)
    case finished(StreamFinishInfo)
}
```

| Case | What it means |
| - | - |
| `.messageStarted(id:)` | The server created the AI agent's message. |
| `.textChunk(String)` | A chunk of text. You get this as `onTextDelta`. |
| `.toolCall(ToolCall)` | The AI agent asked for a tool and sent everything it needs. |
| `.toolOutput(toolCallId:output:)` | The server finished a tool. |
| `.finished(StreamFinishInfo)` | The reply is done and the details are final. |

### ToolCall

```swift theme={null}
public struct ToolCall: Sendable {
    public let toolCallId: String
    public let toolName: String
    public let input: JSONValue
}
```

The raw tool call inside `.toolCall`. `ToolCallInfo` is the version you get in callbacks.

### StreamFinishInfo

The details that arrive when a reply ends. Everything is optional, since the server may leave any of it out.

```swift theme={null}
public struct StreamFinishInfo: Sendable {
    public let conversationId: String?
    public let messageId: String?
    public let userMessageId: String?
    public let userId: String?
    public let finishReason: FinishReason?
    public let usage: Usage?
}
```

<ResponseField name="conversationId" type="String?">
  The conversation this reply belongs to. On a new conversation, this is where the ID first arrives.
</ResponseField>

<ResponseField name="messageId" type="String?">
  The AI agent's final message ID.
</ResponseField>

<ResponseField name="userMessageId" type="String?">
  The server's ID for the user's message.
</ResponseField>

<ResponseField name="userId" type="String?">
  Who the reply belongs to. This fills in `client.currentUserId`.
</ResponseField>

<ResponseField name="finishReason" type="FinishReason?">
  See [FinishReason](/docs/ios-sdk/chat-response#finishreason). Treated as `.stop` when missing.
</ResponseField>

<ResponseField name="usage" type="Usage?">
  Credits used. Treated as `0` when missing.
</ResponseField>

These become the matching fields on the [`ChatResponse`](/docs/ios-sdk/chat-response) that `send` returns.

<Note>
  Anything in a reply that the SDK does not recognize is skipped rather than treated as an error, so a shipped app keeps working as Chatbase adds new capabilities. A reply that cannot be read at all ends with `ChatError.decodingFailed`.
</Note>

## Related

<CardGroup cols={2}>
  <Card title="Streaming" icon="wave-pulse" href="/docs/ios-sdk/streaming">
    Using the callbacks in practice
  </Card>

  <Card title="Client-Side Tools" icon="bolt" href="/docs/ios-sdk/client-side-tools">
    Registering tools the AI agent can run
  </Card>

  <Card title="ChatResponse" icon="brackets-curly" href="/docs/ios-sdk/chat-response">
    What a finished reply contains
  </Card>

  <Card title="JSONValue" icon="code" href="/docs/ios-sdk/json-value">
    Reading tool data
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.