> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# iOS SDK Overview

> Introduction to the Chatbase iOS SDK, a Swift library for building conversational AI experiences on iOS and macOS.

<Info>
  **Beta Release.** The Chatbase iOS SDK is currently in beta (v0.1.0-beta.1). APIs may change in future releases.
</Info>

<Warning>
  Conversation methods apply exclusively to conversations created through the mobile SDKs (iOS and Android). Conversations generated through the widget, the API, or external integrations cannot be accessed using the SDK. A user identified on both platforms sees their iOS and Android SDK conversations together.
</Warning>

## What is the Chatbase iOS SDK?

The Chatbase iOS SDK is a Swift library that lets you add Chatbase AI agents to your iOS or macOS app. It gives you:

* **Real-time streaming** with `async`/`await` and per-chunk callbacks
* **Client-side tools** that let the AI agent run functions on the device
* **User identity** with JWT sign-in and an automatic device ID
* **Conversation management** with paginated history
* **Ready-made SwiftUI state** through `ConversationState` and `ConversationListState`
* **Typed errors** for everything that can go wrong

**Requirements:**

| Requirement | Minimum |
| - | - |
| iOS | 17.0 |
| macOS | 14.0 |
| Swift | 6.0 |
| Xcode | 16 |
| SwiftUI | Not required. The SDK works with UIKit or any UI framework. |

<Note>
  Everything in the SDK lives in one module, `ChatbaseSDK`. A single `import ChatbaseSDK` gives you every type in these docs.
</Note>

## Installation

The SDK ships as a Swift Package.

<Tabs>
  <Tab title="Xcode">
    1. **File** → **Add Package Dependencies…**
    2. Paste the repository URL:

       ```
       https://github.com/Chatbase-co/chatbase-ios-sdk.git
       ```
    3. Choose version `0.1.0-beta.1` (or **Up to Next Minor**) and add the **ChatbaseSDK** library to your app target.
  </Tab>

  <Tab title="Package.swift">
    ```swift theme={null}
    // Package.swift
    dependencies: [
        .package(
            url: "https://github.com/Chatbase-co/chatbase-ios-sdk.git",
            from: "0.1.0-beta.1"
        )
    ],
    targets: [
        .target(
            name: "YourApp",
            dependencies: [
                .product(name: "ChatbaseSDK", package: "chatbase-ios-sdk")
            ]
        )
    ]
    ```
  </Tab>
</Tabs>

Then import it:

```swift theme={null}
import ChatbaseSDK
```

<Note>
  No `Info.plist` changes are needed. The SDK talks to `https://www.chatbase.co` over HTTPS, which iOS allows by default.
</Note>

## Quick Start

<Steps>
  <Step title="Get your Agent ID">
    1. Go to the [Chatbase Dashboard](https://www.chatbase.co/dashboard)
    2. Select your AI agent
    3. Go to **Settings** → **General**
    4. Copy the **Agent ID**
  </Step>

  <Step title="Enable the iOS SDK channel">
    In the dashboard, go to **Deploy** → **iOS SDK** and enable the channel for your AI agent.

    <Warning>
      If the iOS SDK channel is not enabled, every SDK request fails with a `404` `AGENT_NOT_FOUND` error, even when the agent ID is correct.
    </Warning>
  </Step>

  <Step title="Create a client">
    ```swift theme={null}
    import ChatbaseSDK

    let client = ChatbaseClient(agentId: "YOUR_AGENT_ID")
    ```

    Create the client once and keep it around, in a view model, an app-level dependency, or a `@State` property. A new client starts anonymous, tied to a device ID that stays the same across launches.
  </Step>

  <Step title="Send your first message">
    ```swift theme={null}
    let response = try await client.send("Hello! How can you help me?") { cb in
        cb.onTextDelta = { chunk in
            // Runs for each chunk of text as it arrives
            print(chunk, terminator: "")
        }
    }

    print(response.message.text)
    print("Conversation: \(response.conversationId)")
    print("Credits used: \(response.usage.credits)")
    ```
  </Step>

  <Step title="Continue the conversation">
    ```swift theme={null}
    let followUp = try await client.send(
        "Tell me more",
        conversationId: response.conversationId
    )
    ```

    For UI code, use [`ConversationState`](/docs/ios-sdk/swiftui) instead. It keeps the conversation ID for you, along with the message list.
  </Step>
</Steps>

<Tip>
  There is no `close()` or cleanup call. The client shuts down its network session when it goes out of scope.
</Tip>

## ChatbaseClient

`final class ChatbaseClient`

The main entry point. You can call it from any task or actor.

### init

```swift theme={null}
public init(
    agentId: String,
    baseURL: String = "https://www.chatbase.co/api/sdk",
    configuration: URLSessionConfiguration = .default,
    maxToolLoopSteps: Int = 10
)
```

<ParamField body="agentId" type="String" required>
  The Chatbase agent ID to connect to.
</ParamField>

<ParamField body="baseURL" type="String" default="https://www.chatbase.co/api/sdk">
  The Chatbase API address. Leave this at its default.
</ParamField>

<ParamField body="configuration" type="URLSessionConfiguration" default=".default">
  The `URLSessionConfiguration` used for every request. Set timeouts and caching here.
</ParamField>

<ParamField body="maxToolLoopSteps" type="Int" default="10">
  How many times a single `send` or `retry` may run tools before giving up. Going over throws `ChatError.toolLoopLimitExceeded(limit:)`. See [Client-Side Tools](/docs/ios-sdk/client-side-tools#tool-loop-limit).
</ParamField>

```swift theme={null}
// Custom timeouts
let config = URLSessionConfiguration.default
config.timeoutIntervalForRequest = 30
config.timeoutIntervalForResource = 300

let client = ChatbaseClient(
    agentId: "YOUR_AGENT_ID",
    configuration: config,
    maxToolLoopSteps: 20
)
```

<Tip>
  `timeoutIntervalForRequest` measures the gap between pieces of data, not the length of the whole response. A long streaming reply will not be cut off by a 30 second timeout as long as data keeps arriving.
</Tip>

### Properties

| Property | Type | Description |
| - | - | - |
| `deviceId` | `String` | The device ID. Always available. |
| `authState` | `AuthState` | `.anonymous` or `.identified(token:)`. |
| `currentConversationId` | `String?` | The last conversation the client saw, or `nil`. |
| `currentUserId` | `String?` | The user ID the server confirmed on the last completed reply. |

### Methods

| Method | Description |
| - | - |
| `send(_:conversationId:configure:)` | Send a message, stream the reply, run tools. See [Streaming](/docs/ios-sdk/streaming#send). |
| `retry(conversationId:messageId:configure:)` | Ask the AI agent to answer again. See [Streaming](/docs/ios-sdk/streaming#retry). |
| `sendNonStreaming(_:conversationId:)` | Get the whole reply at once, with no streaming and no tools. See [Streaming](/docs/ios-sdk/streaming#sendnonstreaming). |
| `tool(_:handler:)` | Register a tool the AI agent can run. See [Client-Side Tools](/docs/ios-sdk/client-side-tools). |
| `identify(token:)` | Sign a user in with a JWT. See [User Identity](/docs/ios-sdk/user-identity). |
| `logout()` | Go back to anonymous. See [User Identity](/docs/ios-sdk/user-identity#logout). |
| `newConversation()` | Clear `currentConversationId`. See [Conversations](/docs/ios-sdk/conversations#newconversation). |
| `listConversations(cursor:limit:)` | List past conversations. See [Conversations](/docs/ios-sdk/conversations#listconversations). |
| `listMessages(conversationId:cursor:limit:)` | Load a conversation's messages. See [Conversations](/docs/ios-sdk/conversations#listmessages). |

## Logging

The SDK writes to Apple's logging system under the subsystem `com.chatbase.sdk`, in three categories:

| Category | What it logs |
| - | - |
| `APIClient` | Each request and response: method, path, status, duration, size |
| `ChatService` | Stream decoding failures and tool result retries |
| `ConversationState` | Skipped retries and similar UI state notes |

View them in Console.app, or run `log stream --predicate 'subsystem == "com.chatbase.sdk"'`. Message text is never logged.

## Rate Limits

Chatbase allows **1,000 requests every 10 seconds** per device. Going over throws an `APIError.httpError` with status `429`. See [Error Handling](/docs/ios-sdk/error-handling).

## Next Steps

<CardGroup cols={2}>
  <Card title="Streaming" icon="wave-pulse" href="/docs/ios-sdk/streaming">
    Stream replies with async/await and callbacks
  </Card>

  <Card title="SwiftUI" icon="swift" href="/docs/ios-sdk/swiftui">
    Ready-made state for chat screens
  </Card>

  <Card title="Client-Side Tools" icon="bolt" href="/docs/ios-sdk/client-side-tools">
    Let the AI agent run functions on the device
  </Card>

  <Card title="Conversations" icon="messages" href="/docs/ios-sdk/conversations">
    Conversations, history, and pagination
  </Card>

  <Card title="User Identity" icon="user" href="/docs/ios-sdk/user-identity">
    Sign users in with JWT tokens
  </Card>

  <Card title="Error Handling" icon="triangle-exclamation" href="/docs/ios-sdk/error-handling">
    Error types and how to handle them
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.