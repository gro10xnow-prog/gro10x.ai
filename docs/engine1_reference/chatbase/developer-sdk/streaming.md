> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Streaming

> How to stream real-time replies from the Chatbase iOS SDK with async/await and callbacks.

## How Streaming Works

The SDK has one streaming method. `send(_:conversationId:configure:)` is an `async throws` function. It calls your callbacks as text arrives, then returns the finished [`ChatResponse`](/docs/ios-sdk/chat-response) when the reply is complete.

* **While it runs:** your `onTextDelta`, `onToolCall`, and `onToolResult` callbacks fire.
* **When it succeeds:** it returns a `ChatResponse`.
* **When it fails:** it throws.

The same call also runs your tools. If the AI agent asks for a tool, the SDK runs your handler, sends the result back, and continues the reply. See [Client-Side Tools](/docs/ios-sdk/client-side-tools).

<Tip>
  If you are building a SwiftUI chat screen, you usually do not call `send` yourself. [`ConversationState`](/docs/ios-sdk/swiftui) connects these callbacks to a message list for you.
</Tip>

## send

```swift theme={null}
public func send(
    _ message: String,
    conversationId: String? = nil,
    configure: @Sendable (inout StreamCallbacks) -> Void = { _ in }
) async throws -> ChatResponse
```

Sends a message, streams the reply, runs any registered tools, and returns the finished `ChatResponse`.

<ParamField body="message" type="String" required>
  The message to send to the AI agent.
</ParamField>

<ParamField body="conversationId" type="String?">
  Continue an existing conversation. `nil` **always starts a new conversation**.
</ParamField>

<ParamField body="configure" type="@Sendable (inout StreamCallbacks) -> Void">
  A closure where you set the callbacks you want. Set only the ones you need.
</ParamField>

<Warning>
  Unlike the Android SDK, passing `conversationId: nil` does **not** fall back to `currentConversationId`. It starts a new conversation. To continue one, pass the ID yourself, or use [`ConversationState`](/docs/ios-sdk/swiftui), which keeps track of it.
</Warning>

```swift theme={null}
let response = try await client.send("Tell me a story") { cb in
    cb.onTextDelta = { chunk in
        print(chunk, terminator: "")
    }
    cb.onToolCall = { info in
        print("Agent is calling: \(info.toolName)")
    }
    cb.onToolResult = { info in
        print("Got a result from: \(info.toolName)")
    }
}

print("\nMessage ID: \(response.message.id)")
print("Finish reason: \(response.finishReason)")
```

### StreamCallbacks

```swift theme={null}
public struct StreamCallbacks: Sendable {
    public var onTextDelta: (@Sendable (String) async -> Void)?
    public var onToolCall: (@Sendable (ToolCallInfo) async -> Void)?
    public var onToolResult: (@Sendable (ToolResultInfo) async -> Void)?
}
```

| Callback | When it runs |
| - | - |
| `onTextDelta` | For each chunk of text as it arrives. |
| `onToolCall` | When the AI agent asks for a tool, before your handler runs. |
| `onToolResult` | When a tool result is ready, whether it came from your handler or from the server. |

Callbacks you do not set are ignored. There is no `onStart`, `onFinish`, or `onError` callback. The `async throws` signature covers all three:

```swift theme={null}
do {
    let response = try await client.send("Hello") { cb in
        cb.onTextDelta = { print($0, terminator: "") }
    }
    // Same as onFinish
    handle(response)
} catch {
    // Same as onError
    show(error)
}
```

<Warning>
  Callbacks do not run on the main thread. Switch to the main actor before touching your UI:

  ```swift theme={null}
  cb.onTextDelta = { @Sendable chunk in
      await MainActor.run { self.text += chunk }
  }
  ```

  The SDK waits for each callback to finish before reading more of the reply, so a slow callback slows the whole stream. Keep them short.
</Warning>

### Showing text as it arrives

```swift theme={null}
@MainActor
@Observable
final class ChatViewModel {
    var text = ""
    var isSending = false

    private let client: ChatbaseClient
    private var conversationId: String?

    init(client: ChatbaseClient) { self.client = client }

    func send(_ message: String) async {
        isSending = true
        defer { isSending = false }
        text = ""

        do {
            let response = try await client.send(message, conversationId: conversationId) { cb in
                cb.onTextDelta = { [weak self] chunk in
                    await self?.append(chunk)
                }
            }
            conversationId = response.conversationId
        } catch {
            text = "Something went wrong. Please try again."
        }
    }

    private func append(_ chunk: String) { text += chunk }
}
```

`ChatViewModel` is marked `@MainActor`, so `await self?.append(chunk)` moves to the main thread for you.

## Stopping a Reply

Cancelling the `Task` around `send` closes the connection.

```swift theme={null}
var streamTask: Task<Void, Never>?

func start(_ message: String) {
    streamTask = Task {
        do {
            _ = try await client.send(message) { cb in
                cb.onTextDelta = { chunk in await self.append(chunk) }
            }
        } catch is CancellationError {
            // The user stopped it. Keep the text received so far.
        } catch {
            self.show(error)
        }
    }
}

func stop() {
    streamTask?.cancel()
}
```

<Note>
  Cancelling stops your app from reading the reply. The AI agent may still finish on the server, and the partial message is saved. The text you already received is still correct, and it will be there when you next call [`listMessages`](/docs/ios-sdk/conversations#listmessages).
</Note>

## Continuing a Conversation

The client remembers the last conversation in `currentConversationId`, but you have to pass it back in to continue:

```swift theme={null}
// First message, starts a new conversation
let first = try await client.send("My name is Alice.")
print(first.conversationId) // "conv_abc123"

// Continue it
let second = try await client.send(
    "What is my name?",
    conversationId: first.conversationId
) // The agent remembers: "Alice"
```

To start fresh, pass `nil` (the default), or clear the saved ID:

```swift theme={null}
client.newConversation()
_ = try await client.send("Fresh start!")
```

<Tip>
  See [Conversations & History](/docs/ios-sdk/conversations) for listing conversations and loading old messages, and [SwiftUI](/docs/ios-sdk/swiftui) for state that tracks the conversation ID for you.
</Tip>

## retry

```swift theme={null}
public func retry(
    conversationId: String,
    messageId: String,
    configure: @Sendable (inout StreamCallbacks) -> Void = { _ in }
) async throws -> ChatResponse
```

Ask the AI agent to answer again. Streams and runs tools exactly like `send`.

<ParamField body="conversationId" type="String" required>
  The conversation the message belongs to.
</ParamField>

<ParamField body="messageId" type="String" required>
  The ID of the AI agent message to redo.
</ParamField>

<ParamField body="configure" type="@Sendable (inout StreamCallbacks) -> Void">
  The same callbacks as `send`.
</ParamField>

```swift theme={null}
let response = try await client.send("Hello")

// Later, from a "Regenerate" button:
let retried = try await client.retry(
    conversationId: response.conversationId,
    messageId: response.message.id
) { cb in
    cb.onTextDelta = { print($0, terminator: "") }
}
```

<Note>
  The old message and everything after it are replaced. Remove those messages from your UI before the new reply starts. [`ConversationState.retry(messageId:)`](/docs/ios-sdk/swiftui#retry) does this for you.
</Note>

## sendNonStreaming

```swift theme={null}
public func sendNonStreaming(
    _ message: String,
    conversationId: String? = nil
) async throws -> ChatResponse
```

Sends a message and returns the whole reply at once. No callbacks, and **no tools**.

<ParamField body="message" type="String" required>
  The message to send to the AI agent.
</ParamField>

<ParamField body="conversationId" type="String?">
  Continue an existing conversation. `nil` starts a new one.
</ParamField>

```swift theme={null}
let response = try await client.sendNonStreaming("Summarize my last order")
print(response.message.text)
print(response.finishReason)  // .stop, .error, or .toolCalls
print(response.usage.credits)
```

<Warning>
  Your registered tools do **not** run. If the AI agent asks for a tool, you get back `finishReason == .toolCalls` and no answer. Use `send` for any AI agent that has client-side Custom Actions.
</Warning>

Use `sendNonStreaming` when you do not need to show text as it arrives, such as a background summary or a scripted first message.

## Which Method to Use

| | `send` | `retry` | `sendNonStreaming` |
| - | - | - | - |
| Streams text | Yes | Yes | No |
| Runs your tools | Yes | Yes | No |
| Callbacks | Yes | Yes | No |
| Starts a new conversation | When `conversationId` is `nil` | Never | When `conversationId` is `nil` |
| Returns | `ChatResponse` | `ChatResponse` | `ChatResponse` |

## Related

<CardGroup cols={2}>
  <Card title="Client-Side Tools" icon="bolt" href="/docs/ios-sdk/client-side-tools">
    Let the AI agent run functions on the device
  </Card>

  <Card title="Streaming Types" icon="list" href="/docs/ios-sdk/streaming-events">
    StreamCallbacks, ToolCallInfo, and more
  </Card>

  <Card title="ChatResponse" icon="brackets-curly" href="/docs/ios-sdk/chat-response">
    What a finished reply contains
  </Card>

  <Card title="Error Handling" icon="triangle-exclamation" href="/docs/ios-sdk/error-handling">
    Error types and how to handle them
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.