> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Conversation & Pagination

> Reference for Conversation, ConversationStatus, and PaginatedResponse, the types used for conversation history.

## Conversation

`struct Conversation: Identifiable, Hashable, Sendable`

What [`listConversations`](/docs/ios-sdk/conversations#listconversations) returns.

```swift theme={null}
public struct Conversation: Identifiable, Hashable, Sendable {
    public let id: String
    public let title: String?
    public let createdAt: Date
    public let updatedAt: Date
    public let userId: String?
    public let status: ConversationStatus
}
```

<ResponseField name="id" type="String" required>
  The conversation ID. Pass it to `listMessages` or `send`.
</ResponseField>

<ResponseField name="title" type="String?">
  A title the server made or set. `nil` for conversations that do not have one yet, so show something like "New conversation" instead.
</ResponseField>

<ResponseField name="createdAt" type="Date" required>
  When the conversation started.
</ResponseField>

<ResponseField name="updatedAt" type="Date" required>
  When the last message arrived. Sort your list on this.
</ResponseField>

<ResponseField name="userId" type="String?">
  The signed-in user this conversation belongs to, or `nil` if it belongs to a device.
</ResponseField>

<ResponseField name="status" type="ConversationStatus" required>
  See [ConversationStatus](#conversationstatus).
</ResponseField>

<Note>
  `createdAt` and `updatedAt` arrive from the server as numbers and the SDK turns them into Swift `Date` values, so there is nothing to convert.
</Note>

`Conversation` works with `ForEach`, `List`, and `NavigationLink` without any extra work:

```swift theme={null}
List(conversations) { conversation in
    NavigationLink(value: conversation) {
        VStack(alignment: .leading) {
            Text(conversation.title ?? "New conversation")
            Text(conversation.updatedAt, style: .relative)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
```

## ConversationStatus

```swift theme={null}
public enum ConversationStatus: String, Decodable, Sendable {
    case ongoing                   // "ongoing"    active
    case ended                     // "ended"      finished
    case takenOver = "taken_over"  // a person took over
}
```

Only `.ongoing` conversations take new messages. Sending to any other one fails with `403` `CHAT_CONVERSATION_NOT_ONGOING`. See [Error Handling](/docs/ios-sdk/error-handling).

```swift theme={null}
if conversation.status == .ongoing {
    showComposer()
} else {
    showReadOnlyBanner()
}
```

<Note>
  Any status the SDK does not recognize is read as `.ongoing`, so a new status added later will not break your app.
</Note>

## Message

`Message` is used for both replies and history. See [ChatResponse → Message](/docs/ios-sdk/chat-response#message) for the full reference, along with [`MessagePart`](/docs/ios-sdk/chat-response#messagepart), [`MessageSender`](/docs/ios-sdk/chat-response#messagesender), and [`MessageFeedback`](/docs/ios-sdk/chat-response#messagefeedback).

## PaginatedResponse

`struct PaginatedResponse<T: Sendable>: Sendable`

What `listConversations()` and `listMessages()` return.

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

Gets the next page, or `nil` when `hasMore` is `false`. Each page remembers its own position and the `limit` you started with, so pages stay a consistent size and you have nothing to keep track of.

<Warning>
  The page you get back holds **only the next page's items**. It does not build up a full list. Add `next.data` to your own array yourself.
</Warning>

```swift theme={null}
var page = try await client.listConversations(limit: 20)
var all = page.data

while let next = try await page.loadMore() {
    all.append(contentsOf: next.data)
    page = next
}
```

<Note>
  There is no `cursor` property and no `canLoadMore`. Check `hasMore`, and let `loadMore()` handle the rest.
</Note>

## Related

<CardGroup cols={2}>
  <Card title="Conversations & History" icon="messages" href="/docs/ios-sdk/conversations">
    Listing conversations and loading history
  </Card>

  <Card title="ChatResponse" icon="brackets-curly" href="/docs/ios-sdk/chat-response">
    Message, MessagePart, and reply types
  </Card>

  <Card title="SwiftUI" icon="swift" href="/docs/ios-sdk/swiftui">
    ConversationListState pages for you
  </Card>

  <Card title="User Identity" icon="user" href="/docs/ios-sdk/user-identity">
    How sign-in changes what you see
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.