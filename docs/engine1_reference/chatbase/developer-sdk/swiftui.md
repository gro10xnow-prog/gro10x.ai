> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# SwiftUI

> Build a chat screen with ConversationState and ConversationListState, ready-made state that streams into your views.

## Why Use These?

Building a chat list by hand means handling placeholder bubbles, tool cards, empty slots between tool calls, paging through history, and error recovery. The SDK ships two classes that do all of that for you:

| Type | Use it for |
| - | - |
| [`ConversationState`](#conversationstate) | One chat screen: messages, streaming, tools, history, retry. |
| [`ConversationListState`](#conversationliststate) | A list of past conversations, with paging. |

Both update on the main thread and work with `@Observable`, so SwiftUI redraws when they change. Keep them in `@State`, in a view model, or in the environment, whichever your app already does.

## ConversationState

`@MainActor @Observable final class ConversationState`

### init

```swift theme={null}
public init(client: ChatbaseClient, conversationId: String? = nil)
```

<ParamField body="client" type="ChatbaseClient" required>
  The client to send through. Register your tools on it first.
</ParamField>

<ParamField body="conversationId" type="String?">
  Reopen an existing conversation. Leave it out for a new one.
</ParamField>

### A complete chat screen

```swift theme={null}
import SwiftUI
import ChatbaseSDK

struct ChatScreen: View {
    @State private var state: ConversationState
    @State private var input = ""

    init(client: ChatbaseClient) {
        _state = State(initialValue: ConversationState(client: client))
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                List {
                    if state.hasMoreHistory {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .task { await state.loadMoreHistory() }
                    }

                    ForEach(state.messages) { message in
                        MessageRow(message: message) {
                            Task { await state.retry(messageId: $0) }
                        }
                        .id(message.id)
                    }
                }
                .onChange(of: state.messages.count) {
                    withAnimation { proxy.scrollTo(state.messages.last?.id) }
                }
            }

            Composer(text: $input, isSending: state.isSending) {
                let text = input
                input = ""
                Task { await state.sendMessage(text) }
            }
        }
        .alert(
            "Something went wrong",
            isPresented: .init(
                get: { state.error != nil },
                set: { if !$0 { state.clearError() } }
            )
        ) {
            Button("OK") { state.clearError() }
        } message: {
            Text(state.error?.localizedDescription ?? "")
        }
    }
}
```

Notice what you did not have to write: no placeholder handling, no joining text chunks together, no tool loop tracking.

### Showing a message

```swift theme={null}
struct MessageRow: View {
    let message: ConversationState.UiMessage
    let onRetry: (String) -> Void

    var body: some View {
        switch message.kind {
        case .text(let text):
            TextBubble(text: text, isUser: message.sender == .user)
                .opacity(message.isStreaming && text.isEmpty ? 0.5 : 1)
                .overlay(alignment: .trailing) {
                    if message.isError, let id = message.messageId {
                        Button("Retry") { onRetry(id) }
                    }
                }

        case .toolCall(let card):
            ToolCard(
                name: card.toolName,
                status: card.status,
                output: card.output
            )
        }
    }
}
```

### What you can read

| Property | Type | Description |
| - | - | - |
| `messages` | `[UiMessage]` | The messages to show, oldest first. |
| `isSending` | `Bool` | A message or retry is in progress. Disable the text field. |
| `isLoadingHistory` | `Bool` | A page of history is loading. |
| `hasMoreHistory` | `Bool` | There are older messages to load. |
| `conversationId` | `String?` | Tracked for you after the first message. |
| `error` | `Error?` | The last error. Clear it with `clearError()`. |

You cannot set these directly. Use the methods below.

### sendMessage

```swift theme={null}
public func sendMessage(_ text: String) async
```

Adds the user's message, streams the reply into a new bubble, runs the tools, and tidies up at the end. It **never throws**. Errors go into `error`, and the failed bubble is marked with `isError`.

```swift theme={null}
Task { await state.sendMessage(text) }
```

Empty text is ignored, and so is a call made while `isSending` is `true`, so you do not have to guard the button yourself (though disabling it is nicer).

The conversation ID is taken from the first reply and reused after that.

### retry

```swift theme={null}
public func retry(messageId: String) async
```

Asks the AI agent to answer again. That message and everything after it are removed from `messages`, then the new reply streams in.

```swift theme={null}
Button("Regenerate") {
    Task { await state.retry(messageId: id) }
}
```

Pass the **server's** ID from `UiMessage.messageId`, not `UiMessage.id`. The call is ignored if a message is already being sent, if there is no conversation yet, or if that ID is not in the list.

### loadHistory

```swift theme={null}
public func loadHistory(conversationId: String, limit: Int = 20) async
```

Replaces `messages` with the newest page of an existing conversation and switches to it. Use it when opening a conversation from a list:

```swift theme={null}
.task { await state.loadHistory(conversationId: conversation.id) }
```

### loadMoreHistory

```swift theme={null}
public func loadMoreHistory() async
```

Loads the next page of older messages and adds them to the top, skipping any you already have. Does nothing when `hasMoreHistory` is `false` or a load is already running.

### clear

```swift theme={null}
public func clear()
```

Resets everything: messages, conversation ID, history, and error. Call it when the user signs out, together with `client.logout()`, or when starting a new chat:

```swift theme={null}
Button("New chat") { state.clear() }
```

### clearError and setConversationId

```swift theme={null}
public func clearError()
public func setConversationId(_ id: String?)
```

`clearError()` dismisses the last error. `setConversationId(_:)` points the state at a conversation without loading its messages, which is useful if you already have them from somewhere else.

## UiMessage

`struct ConversationState.UiMessage: Identifiable, Sendable`

One row on screen. A single message from the server can become several `UiMessage` values, one per part, so text and tool cards appear in the order the AI agent made them.

```swift theme={null}
public struct UiMessage: Identifiable, Sendable {
    public enum Kind: Sendable {
        case text(String)
        case toolCall(ToolCallCard)
    }

    public var id: String
    public var messageId: String?
    public var kind: Kind
    public var sender: MessageSender
    public var date: Date
    public var isStreaming: Bool
    public var isError: Bool
    public var feedback: MessageFeedback?
}
```

<ResponseField name="id" type="String" required>
  A stable ID for `ForEach`. Made locally for new rows, and from the server's message for older ones.
</ResponseField>

<ResponseField name="messageId" type="String?">
  The server's message ID, filled in once the reply finishes. Pass this to `retry(messageId:)`.
</ResponseField>

<ResponseField name="kind" type="Kind" required>
  `.text(String)` for a bubble, `.toolCall(ToolCallCard)` for a tool card.
</ResponseField>

<ResponseField name="sender" type="MessageSender" required>
  `.user` or `.agent`. Tool cards are always `.agent`.
</ResponseField>

<ResponseField name="date" type="Date" required>
  When the row was made, or when the message was sent.
</ResponseField>

<ResponseField name="isStreaming" type="Bool" required>
  `true` while text is still arriving in this bubble. Use it to show a typing dot or a cursor.
</ResponseField>

<ResponseField name="isError" type="Bool" required>
  `true` when the reply failed. Show a retry button.
</ResponseField>

<ResponseField name="feedback" type="MessageFeedback?">
  `.positive`, `.negative`, or `nil`. Set for messages loaded from history.
</ResponseField>

<Warning>
  `id` and `messageId` are different on purpose. `id` exists as soon as a row appears, so SwiftUI can animate it. `messageId` only exists once the server has given the message an ID. Use `id` for `ForEach` and `scrollTo`, and `messageId` for `retry`.
</Warning>

## ToolCallCard

`struct ConversationState.ToolCallCard: Sendable`

```swift theme={null}
public struct ToolCallCard: Sendable {
    public enum Status: Sendable { case executing, success, failure }

    public var toolCallId: String
    public var toolName: String
    public var input: JSONValue
    public var output: JSONValue?
    public var status: Status
}
```

A card appears as `.executing` as soon as the AI agent asks for the tool, then becomes `.success` or `.failure` when the result arrives.

<Note>
  The status follows the SDK's usual rule: a result that is an **object with an `error` key** counts as `.failure`, and anything else counts as `.success`. This is the same rule your handlers use to report a problem. See [Client-Side Tools](/docs/ios-sdk/client-side-tools#when-a-tool-fails).

  If the whole reply fails, every card still showing `.executing` is switched to `.failure`, so no card spins forever.
</Note>

```swift theme={null}
struct ToolCard: View {
    let name: String
    let status: ConversationState.ToolCallCard.Status
    let output: JSONValue?

    var body: some View {
        HStack {
            switch status {
            case .executing: ProgressView()
            case .success:   Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
            case .failure:   Image(systemName: "xmark.circle.fill").foregroundStyle(.red)
            }
            Text(name).font(.footnote.monospaced())
        }
    }
}
```

## ConversationListState

`@MainActor @Observable final class ConversationListState`

A list of the user's past conversations, loaded a page at a time.

```swift theme={null}
public init(client: ChatbaseClient)
```

| Property | Type | Description |
| - | - | - |
| `conversations` | `[Conversation]` | The conversations loaded so far, newest first. |
| `isLoading` | `Bool` | A page is loading. |
| `hasMore` | `Bool` | There are more pages. |
| `error` | `Error?` | The last error. Clear it with `clearError()`. |

### load

```swift theme={null}
public func load(limit: Int = 20) async
```

Loads the first page and **replaces** `conversations`. Use it for the first load and for pull to refresh.

### loadMore

```swift theme={null}
public func loadMore() async
```

Adds the next page to the list. Does nothing when `hasMore` is `false` or a page is already loading.

### clearError

```swift theme={null}
public func clearError()
```

```swift theme={null}
struct ConversationsScreen: View {
    @State private var state: ConversationListState

    init(client: ChatbaseClient) {
        _state = State(initialValue: ConversationListState(client: client))
    }

    var body: some View {
        List {
            ForEach(state.conversations) { conversation in
                NavigationLink(conversation.title ?? "New conversation") {
                    ChatScreen(conversationId: conversation.id)
                }
            }
            if state.hasMore {
                ProgressView()
                    .task { await state.loadMore() }
            }
        }
        .task { await state.load() }
        .refreshable { await state.load() }
    }
}
```

## Using UIKit

Neither class is tied to SwiftUI. From UIKit you can watch them with `withObservationTracking`, or skip them and call `client.send(_:conversationId:configure:)` yourself, switching to the main thread inside the callbacks:

```swift theme={null}
Task {
    do {
        let response = try await client.send(text) { cb in
            cb.onTextDelta = { chunk in
                await MainActor.run { self.appendToBubble(chunk) }
            }
        }
        await MainActor.run { self.finalize(response) }
    } catch {
        await MainActor.run { self.showError(error) }
    }
}
```

## Related

<CardGroup cols={2}>
  <Card title="Streaming" icon="wave-pulse" href="/docs/ios-sdk/streaming">
    The send and callback API underneath
  </Card>

  <Card title="Client-Side Tools" icon="bolt" href="/docs/ios-sdk/client-side-tools">
    What fills in the tool cards
  </Card>

  <Card title="Conversations & History" icon="messages" href="/docs/ios-sdk/conversations">
    The paging behind these classes
  </Card>

  <Card title="Error Handling" icon="triangle-exclamation" href="/docs/ios-sdk/error-handling">
    Turning `state.error` into a good message
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.