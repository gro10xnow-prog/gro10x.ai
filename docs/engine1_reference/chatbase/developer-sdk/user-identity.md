> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# User Identity

> How to sign users in with JWT tokens and work with device identity in the Chatbase iOS SDK.

## Overview

The SDK has two levels of identity:

| Level | How it works | What conversations belong to |
| - | - | - |
| **Device ID** | Automatic, created on first use | The device |
| **User identity** | Optional, you call `identify(token:)` | The user |

The SDK works anonymously out of the box. Call `identify(token:)` to tie conversations to a specific user.

Every request includes the device ID in an `X-Device-Id` header. Once the user is signed in, requests also include the JWT in `X-User-Token`. The SDK sets both headers for you.

## Device ID

Every install gets a device ID the first time the SDK needs one:

```swift theme={null}
public var deviceId: String { get }
```

```swift theme={null}
let client = ChatbaseClient(agentId: "YOUR_AGENT_ID")
print(client.deviceId) // "A1B2C3D4-E5F6-..."
```

<Note>
  The device ID is a `UUID` saved in `UserDefaults.standard` under the key `com.chatbase.sdk.deviceId`. It stays the same across app launches and across clients, and it is created only once per install, even if you create several clients at the same time on a cold start.
</Note>

<Warning>
  Because it lives in `UserDefaults`, the device ID does **not** survive a reinstall, and it is included in device backups, so restoring a backup on a new device reuses the same ID. Anonymous conversations follow that ID. If you want conversations to survive a reinstall, sign the user in with a JWT.
</Warning>

## identify

```swift theme={null}
public func identify(token: String) async throws
```

Checks a JWT with the Chatbase server and signs the user in. Later requests belong to that user, and the token is saved so the user stays signed in after the app restarts.

<ParamField body="token" type="String" required>
  An HS256 JWT created by your backend and signed with your AI agent's identity verification secret. The payload needs a `user_id` (or `sub`) claim.
</ParamField>

<Steps>
  <Step title="Create a JWT on your backend">
    Sign a JWT with your AI agent's identity verification secret, with the user ID in the payload. See [Identity Verification](/docs/developer-guides/identity-verification) for the token format and where to find the secret.

    <Warning>
      Never put the identity verification secret in your app. Anyone can pull it out of an app bundle. Create tokens on your server and fetch them through your own API.
    </Warning>
  </Step>

  <Step title="Pass the token to the SDK">
    ```swift theme={null}
    do {
        try await client.identify(token: jwt)
    } catch {
        // The token was rejected. See Error Handling.
    }
    ```

    Conversations now belong to this user.
  </Step>

  <Step title="Check that it worked">
    ```swift theme={null}
    if case .identified = client.authState {
        print("Signed in")
    }
    print(client.currentUserId)  // set after the first reply finishes
    ```
  </Step>
</Steps>

`identify(token:)` throws if the token is invalid, expired, signed with the wrong secret, or if identity verification is not set up for the AI agent. When it throws, the SDK's sign-in state does not change, so a failed call cannot leave you half signed in.

<Info>
  When sign-in succeeds, the server also moves conversations created anonymously on this device into the user's account, so history from before sign-in is kept.

  The server does this in the background. A [`listConversations()`](/docs/ios-sdk/conversations#listconversations) call made right after `identify` returns may not show them yet. Refresh a moment later, or the next time the screen appears.
</Info>

## AuthState

```swift theme={null}
public enum AuthState: Sendable, Equatable {
    case anonymous
    case identified(token: String)
}
```

```swift theme={null}
public var authState: AuthState { get }
```

```swift theme={null}
switch client.authState {
case .anonymous:
    showSignInPrompt()
case .identified:
    showAccountBadge()
}
```

<Note>
  There is no `isIdentified` property. Check `authState`, or add your own shortcut:

  ```swift theme={null}
  extension ChatbaseClient {
      var isIdentified: Bool {
          if case .identified = authState { return true }
          return false
      }
  }
  ```
</Note>

## Staying Signed In

The token is saved in the **Keychain** (service `com.chatbase.sdk`, account `userToken`), and it can be read after the device is first unlocked. A new `ChatbaseClient` loads it when it is created, so the user stays signed in across app launches without calling `identify` again:

```swift theme={null}
let client = ChatbaseClient(agentId: "YOUR_AGENT_ID")

if case .identified = client.authState {
    // Loaded from the Keychain, already signed in
}
```

<Warning>
  The SDK does not check when the token expires. An expired token stays in `authState` until a request fails with `401` `AUTH_INVALID_JWT`. Handle that by getting a new token and calling `identify(token:)` again:

  ```swift theme={null}
  do {
      _ = try await client.send(text, conversationId: conversationId)
  } catch let error as APIError where error.statusCode == 401 {
      try await client.identify(token: await AuthAPI.freshChatbaseToken())
      _ = try await client.send(text, conversationId: conversationId)
  }
  ```

  Calling `identify(token:)` on every launch where the user is already signed in is cheap, and it keeps the saved token fresh.
</Warning>

## Identity Properties

| Property | Type | Description |
| - | - | - |
| `deviceId` | `String` | The device ID. Always available. |
| `authState` | `AuthState` | `.anonymous`, or `.identified(token:)` after a successful `identify`. |
| `currentUserId` | `String?` | The user ID the server confirmed on the last finished reply. `nil` before that. |

<Note>
  `currentUserId` comes from the end of a reply, so it appears after the first `send` or `retry` finishes, not right after `identify`. It is also set for anonymous users once the server assigns a user record to the device.
</Note>

## What Identity Changes

<Info>
  Once signed in, conversations belong to the user, so `listConversations()` returns that user's conversations from every device they have signed in on. Without sign-in, conversations belong to the device.
</Info>

## logout

```swift theme={null}
public func logout()
```

Removes the saved token and goes back to anonymous. There is no network call.

```swift theme={null}
client.logout()

print(client.authState)               // .anonymous
print(client.currentUserId)           // nil
print(client.currentConversationId)   // nil
print(client.deviceId)                // unchanged
```

`logout()` also deletes the token from the Keychain and clears `currentUserId` and `currentConversationId`, so the next message starts a new anonymous conversation.

<Warning>
  `logout()` does not clear message lists you are already showing. Call [`ConversationState.clear()`](/docs/ios-sdk/swiftui#clear), or reset your own state, at the same time, so the previous user's messages are not left on screen.

  ```swift theme={null}
  client.logout()
  state.clear()
  ```
</Warning>

## Switching Users

To switch from one user to another, log out first so nothing carries over:

```swift theme={null}
client.logout()
state.clear()
try await client.identify(token: newUserToken)
```

## Related

<CardGroup cols={2}>
  <Card title="Identity Verification" icon="key" href="/docs/developer-guides/identity-verification">
    Creating signed JWTs on your backend
  </Card>

  <Card title="Conversations & History" icon="messages" href="/docs/ios-sdk/conversations">
    List conversations and load old messages
  </Card>

  <Card title="Error Handling" icon="triangle-exclamation" href="/docs/ios-sdk/error-handling">
    Handling expired and rejected tokens
  </Card>

  <Card title="Overview" icon="book-open" href="/docs/ios-sdk/overview">
    Setup and configuration
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.