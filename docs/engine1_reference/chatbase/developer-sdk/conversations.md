> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Conversations & History

> Manage conversations, load message history, and page through results with the Chatbase iOS SDK.

## Starting and Continuing Conversations

<Steps>
  <Step title="Send a message">
    Send a message with no `conversationId` to start a new conversation. The server creates one.

    ```swift theme={null}
    let response = try await client.send("Hello!")
    ```
  </Step>

  <Step title="Keep the conversation ID">
    ```swift theme={null}
    let conversationId = response.conversationId
    ```

    You can also read it afterwards as `client.currentConversationId`.
  </Step>

  <Step title="Continue the conversation">
    Pass the ID to the next call:

    ```swift theme={null}
    let followUp = try await client.send(
        "Tell me more",
        conversationId: conversationId
    )
    ```
  </Step>
</Steps>

<Warning>
  Passing `conversationId: nil` **always starts a new conversation**. It does not fall back to `currentConversationId`. Pass the ID yourself, or use [`ConversationState`](/docs/ios-sdk/swiftui), which keeps it for you.

  ```swift theme={null}
  // Wrong: two separate conversations
  _ = try await client.send("My name is Alice.")
  _ = try await client.send("What is my name?")

  // Right: one conversation
  let first = try await client.send("My name is Alice.")
  _ = try await client.send("What is my name?", conversationId: first.conversationId)
  ```
</Warning>

## newConversation

```swift theme={null}
public func newConversation()
```

Clears `currentConversationId`. Use it if you track the current conversation through the client rather than your own state.

```swift theme={null}
client.newConversation()
_ = try await client.send("Brand new conversation!")
```

<Tip>
  `ConversationState` has its own [`clear()`](/docs/ios-sdk/swiftui#clear), which also empties the message list. Use that in UI code.
</Tip>

## listConversations

```swift theme={null}
public func listConversations(
    cursor: String? = nil,
    limit: Int? = nil
) async throws -> PaginatedResponse<Conversation>
```

Lists the current user's (or device's) conversations, newest first.

<ParamField body="cursor" type="String?">
  A cursor from an earlier page. Leave it out to start at the beginning. Prefer `loadMore()` over passing cursors yourself.
</ParamField>

<ParamField body="limit" type="Int?">
  How many per page, from 1 to 100. The server uses 20 if you leave it out.
</ParamField>

```swift theme={null}
let page = try await client.listConversations(limit: 20)

for conversation in page.data {
    print("\(conversation.id): \(conversation.title ?? "Untitled")")
    print("  Status: \(conversation.status)")
    print("  Updated: \(conversation.updatedAt.formatted())")
}

print("Total: \(page.total)")
print("Has more: \(page.hasMore)")
```

<Note>
  Only conversations created through the mobile SDKs are listed. Widget, API, and integration conversations are left out. Which ones you get depends on identity: the signed-in user's conversations if there is one, otherwise the device's. See [User Identity](/docs/ios-sdk/user-identity).
</Note>

See [`Conversation`](/docs/ios-sdk/conversation-models#conversation) for the full type.

## listMessages

```swift theme={null}
public func listMessages(
    conversationId: String,
    cursor: String? = nil,
    limit: Int? = nil
) async throws -> PaginatedResponse<Message>
```

Loads the messages in a conversation.

<ParamField body="conversationId" type="String" required>
  The conversation to load messages from.
</ParamField>

<ParamField body="cursor" type="String?">
  A cursor from an earlier page. Leave it out to start with the newest messages.
</ParamField>

<ParamField body="limit" type="Int?">
  How many per page, from 1 to 100. The server uses 20 if you leave it out.
</ParamField>

<Note>
  Pages go backwards in time. The first page holds the newest messages, and each `loadMore()` gets older ones. Inside a page, messages run oldest to newest, so you can add a page to a chat view as it is. When you load an older page, add it to the top.
</Note>

```swift theme={null}
let page = try await client.listMessages(conversationId, limit: 50)

for message in page.data {
    let who = message.sender == .user ? "You" : "Agent"
    print("\(who): \(message.text)")
}
```

Each `Message` has both a plain `text` value (all the text joined together) and a `parts` list, so you can show tool activity inline with the conversation:

```swift theme={null}
for part in message.parts {
    switch part {
    case .text(let text):
        renderBubble(text)
    case .toolCall(_, let toolName, let input):
        renderToolCard(toolName, input: input)
    case .toolResult(_, _, let output):
        attachToolOutput(output)
    }
}
```

<Note>
  Messages with no parts are skipped, so a page can hold fewer items than `limit` even when `hasMore` is `true`. Base your "load more" button on `hasMore`, never on `data.count`.
</Note>

See [`Message`](/docs/ios-sdk/conversation-models#message) for the full type.

## PaginatedResponse

```swift theme={null}
public struct PaginatedResponse<T: Sendable>: Sendable {
    public let data: [T]
    public let hasMore: Bool
    public let total: Int

    public func loadMore() async throws -> PaginatedResponse<T>?
}
```

<ResponseField name="data" type="[T]" required>
  The items on this page.
</ResponseField>

<ResponseField name="hasMore" type="Bool" required>
  Whether there are more pages.
</ResponseField>

<ResponseField name="total" type="Int" required>
  How many items there are in total.
</ResponseField>

### loadMore

```swift theme={null}
public func loadMore() async throws -> PaginatedResponse<T>?
```

Gets the next page, or `nil` when `hasMore` is `false`. The page keeps its own cursor, so you have nothing to pass along.

<Warning>
  `loadMore()` returns **only the next page's items**. It does not build up a full list. Add `next.data` to your own array yourself, at the top or bottom depending on the list.
</Warning>

```swift theme={null}
var page = try await client.listConversations(limit: 20)
var all = page.data

while let next = try await page.loadMore() {
    all.append(contentsOf: next.data)
    page = next
}

print("Loaded \(all.count) of \(page.total)")
```

The `limit` you passed the first time is reused for every later page, so page sizes stay the same.

<Tip>
  [`ConversationListState`](/docs/ios-sdk/swiftui#conversationliststate) and [`ConversationState`](/docs/ios-sdk/swiftui#loadhistory) build up the list for you, and skip messages you already have. Use them unless you need something custom.
</Tip>

### Infinite scroll in SwiftUI

```swift theme={null}
struct ConversationList: View {
    @State var state: ConversationListState

    var body: some View {
        List {
            ForEach(state.conversations) { conversation in
                ConversationRow(conversation)
            }

            if state.hasMore {
                ProgressView()
                    .task { await state.loadMore() }
            }
        }
        .task { await state.load() }
    }
}
```

## Conversation Status

A conversation that has ended, or that a person has taken over, cannot take new messages. Sending to one fails with `403` `CHAT_CONVERSATION_NOT_ONGOING`. Check before showing a text field:

```swift theme={null}
if conversation.status == .ongoing {
    showComposer()
} else {
    showReadOnlyBanner()
}
```

| Status | What it means |
| - | - |
| `.ongoing` | Active, and takes new messages. |
| `.ended` | Closed. Start a new conversation. |
| `.takenOver` | A person took over from the dashboard. |

## Related

<CardGroup cols={2}>
  <Card title="Conversation & Pagination" icon="list" href="/docs/ios-sdk/conversation-models">
    The full type reference
  </Card>

  <Card title="SwiftUI" icon="swift" href="/docs/ios-sdk/swiftui">
    Ready-made state for lists and history
  </Card>

  <Card title="Streaming" icon="wave-pulse" href="/docs/ios-sdk/streaming">
    Send messages and stream replies
  </Card>

  <Card title="User Identity" icon="user" href="/docs/ios-sdk/user-identity">
    Tie conversations to users
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.