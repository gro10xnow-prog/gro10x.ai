> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Error Handling

> Error types, codes, and handling patterns for the Chatbase iOS SDK.

## The Two Error Types

The SDK throws two kinds of error. Both give you a readable `localizedDescription`.

| Type | Covers |
| - | - |
| `APIError` | Network problems and error responses from the Chatbase server. |
| `ChatError` | Problems the SDK finds on its own, before or instead of a server reply. |

Swift errors are not arranged in a hierarchy, so there is no single type that catches both. Match each one, and keep a final `catch` for anything else, such as a `CancellationError` or an error from your own tool handler.

## APIError

```swift theme={null}
public enum APIError: Error, LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int, detail: APIErrorDetail)
    case networkError(Error)
}
```

<ResponseField name="invalidResponse" type="case">
  The server sent something that was not an HTTP response. Rare. Treat it like a network problem.
</ResponseField>

<ResponseField name="httpError(statusCode:detail:)" type="case">
  The server returned an error status. `detail` holds the code you can check in your app.
</ResponseField>

<ResponseField name="networkError(Error)" type="case">
  The request never got through: no connection, DNS failure, or a timeout. The value inside is the underlying `URLError`.
</ResponseField>

### Shortcuts

```swift theme={null}
public var statusCode: Int?   // nil unless it is .httpError
public var apiCode: String?   // the server's error code, nil unless it is .httpError
```

```swift theme={null}
catch let error as APIError {
    switch error.statusCode {
    case 401: promptSignIn()
    case 402: showUpgradePrompt()
    case 429: backOffAndRetry()
    default:  showGenericError()
    }
}
```

### APIErrorDetail

```swift theme={null}
public struct APIErrorDetail: Decodable, Sendable {
    public let code: String
    public let message: String
    public let details: [String: String]?
}
```

<ResponseField name="code" type="String" required>
  The error code. Check this in your app, never the `message`.
</ResponseField>

<ResponseField name="message" type="String" required>
  A description written for developers.
</ResponseField>

<ResponseField name="details" type="[String: String]?">
  Which fields were wrong, when the server tells you.
</ResponseField>

<Warning>
  `message` is written for developers. It is not translated and not meant for your users. Turn `code` into your own wording instead of showing `localizedDescription` on screen.
</Warning>

If the error body cannot be read, the SDK still throws `.httpError` with `code` set to `"UNKNOWN"`, so you never lose the status code.

## ChatError

```swift theme={null}
public enum ChatError: Error, LocalizedError {
    case noContent
    case decodingFailed(String)
    case invalidURL(String)
    case toolLoopLimitExceeded(limit: Int)
}
```

| Case | What happened | What to do |
| - | - | - |
| `.noContent` | The AI agent asked for a tool before there was a conversation to attach the result to. | Send the message again. |
| `.decodingFailed(String)` | A reply did not look the way the SDK expected. | Update to the latest SDK version. If it keeps happening, contact support. |
| `.invalidURL(String)` | The client was created with a `baseURL` that is not a valid URL. | Leave `baseURL` at its default. Every request fails until you do. |
| `.toolLoopLimitExceeded(limit:)` | The AI agent asked for more tool rounds than `maxToolLoopSteps` allows. | See [Client-Side Tools](/docs/ios-sdk/client-side-tools#tool-loop-limit). |

```swift theme={null}
catch ChatError.toolLoopLimitExceeded(let limit) {
    print("Stopped after \(limit) tool steps")
}
```

## Error Codes

These are the codes you can get from `APIError.apiCode`:

<table>
  <thead>
    <tr>
      <th>Status</th>
      <th style={{ whiteSpace: 'nowrap' }}>Code</th>
      <th>Description</th>
    </tr>
  </thead>

  <tbody>
    <tr><td>400</td><td style={{ whiteSpace: 'nowrap' }}><code>VALIDATION\_INVALID\_BODY</code></td><td>The request was not valid. <code>details</code> says which fields were wrong. You also get this when a tool result is over 20 KB.</td></tr>
    <tr><td>400</td><td style={{ whiteSpace: 'nowrap' }}><code>VALIDATION\_INVALID\_JSON</code></td><td>The request body was not valid JSON.</td></tr>
    <tr><td>400</td><td style={{ whiteSpace: 'nowrap' }}><code>VALIDATION\_MISSING\_USER\_IDENTIFIER</code></td><td>The device ID header was missing. You should not see this, since the SDK always sends it.</td></tr>
    <tr><td>400</td><td style={{ whiteSpace: 'nowrap' }}><code>AUTH\_INVALID\_USER\_AGENT</code></td><td>The SDK's <code>User-Agent</code> header was missing or not recognized. You should only see this if something rewrites your headers.</td></tr>
    <tr><td>400</td><td style={{ whiteSpace: 'nowrap' }}><code>CHAT\_RETRY\_NO\_USER\_MESSAGE</code></td><td>The message you passed to <code>retry()</code> has no user message before it to answer.</td></tr>
    <tr><td>401</td><td style={{ whiteSpace: 'nowrap' }}><code>AUTH\_INVALID\_JWT</code></td><td>The token you passed to <code>identify()</code>, or the saved token on a later request, is invalid or expired. You also get this when identity verification is not set up for the AI agent. See <a href="/docs/ios-sdk/user-identity">User Identity</a>.</td></tr>
    <tr><td>402</td><td style={{ whiteSpace: 'nowrap' }}><code>CHAT\_CREDITS\_EXHAUSTED</code></td><td>The workspace has no message credits left. Upgrade the plan or wait for credits to reset.</td></tr>
    <tr><td>402</td><td style={{ whiteSpace: 'nowrap' }}><code>CHAT\_AGENT\_CREDITS\_EXHAUSTED</code></td><td>This AI agent has used up its share of credits.</td></tr>
    <tr><td>403</td><td style={{ whiteSpace: 'nowrap' }}><code>AUTH\_OWNERSHIP\_MISMATCH</code></td><td>The conversation belongs to a different user or device. <code>retry()</code> and <code>listMessages()</code> also return this when the conversation does not exist.</td></tr>
    <tr><td>403</td><td style={{ whiteSpace: 'nowrap' }}><code>CHAT\_CONVERSATION\_MISMATCH</code></td><td>The conversation does not belong to this AI agent.</td></tr>
    <tr><td>403</td><td style={{ whiteSpace: 'nowrap' }}><code>CHAT\_MODEL\_NOT\_ALLOWED</code></td><td>The AI agent uses a model that the current plan does not include.</td></tr>
    <tr><td>403</td><td style={{ whiteSpace: 'nowrap' }}><code>CHAT\_CONVERSATION\_NOT\_ONGOING</code></td><td>The conversation has ended, or a person took it over, so it cannot take new messages. Start a new one.</td></tr>
    <tr><td>404</td><td style={{ whiteSpace: 'nowrap' }}><code>AGENT\_NOT\_FOUND</code></td><td>No AI agent has that ID, or the <strong>iOS SDK channel is turned off</strong> for the AI agent. See <a href="/docs/ios-sdk/overview#quick-start">Quick Start</a>.</td></tr>
    <tr><td>404</td><td style={{ whiteSpace: 'nowrap' }}><code>RESOURCE\_NOT\_FOUND</code></td><td>The conversation or message does not exist.</td></tr>
    <tr><td>404</td><td style={{ whiteSpace: 'nowrap' }}><code>CHAT\_RETRY\_MESSAGE\_NOT\_FOUND</code></td><td>The message ID you gave <code>retry()</code> was not found.</td></tr>
    <tr><td>404</td><td style={{ whiteSpace: 'nowrap' }}><code>RESOURCE\_TOOL\_CALL\_NOT\_FOUND</code></td><td>The tool call was not found, or it expired. This can come up during the tool loop.</td></tr>
    <tr><td>404</td><td style={{ whiteSpace: 'nowrap' }}><code>RESOURCE\_TOOL\_CALL\_MISMATCH</code></td><td>The tool call belongs to a different conversation.</td></tr>
    <tr><td>404</td><td style={{ whiteSpace: 'nowrap' }}><code>RESOURCE\_TOOL\_RESULT\_NOT\_PENDING</code></td><td>The server was not waiting for this tool result. Usually it was sent twice.</td></tr>
    <tr><td>429</td><td style={{ whiteSpace: 'nowrap' }}><code>RATE\_LIMIT\_TOO\_MANY\_REQUESTS</code></td><td>Too many requests (the limit is 1,000 every 10 seconds per device). Wait and try again. The response includes a <code>Retry-After</code> header.</td></tr>
    <tr><td>500</td><td style={{ whiteSpace: 'nowrap' }}><code>CHAT\_STREAMING\_ERROR</code></td><td>The reply failed on the server. Safe to try again.</td></tr>
    <tr><td>500</td><td style={{ whiteSpace: 'nowrap' }}><code>INTERNAL\_SERVER\_ERROR</code></td><td>Something went wrong on the server. Try again, or contact support if it keeps happening.</td></tr>
  </tbody>
</table>

<Note>
  `AGENT_NOT_FOUND` looks the same whether the AI agent does not exist or the iOS SDK channel is turned off. If you are sure the agent ID is right, check **Deploy** → **iOS SDK** first.
</Note>

## Handling Errors

<Tabs>
  <Tab title="async/await" icon="code">
    ```swift theme={null}
    do {
        let response = try await client.send("Hello", conversationId: conversationId)
        render(response)

    } catch let error as APIError {
        switch (error.statusCode, error.apiCode) {
        case (401, _):
            try await refreshIdentity()
        case (402, _):
            show("You're out of message credits.")
        case (403, "CHAT_CONVERSATION_NOT_ONGOING"):
            startNewConversation()
        case (404, "AGENT_NOT_FOUND"):
            assertionFailure("Check the agent ID and that the iOS SDK channel is on")
        case (429, _):
            await backOff()
        default:
            show("Something went wrong. Please try again.")
        }

    } catch let error as ChatError {
        switch error {
        case .toolLoopLimitExceeded:
            show("That took too many steps. Try rewording it.")
        default:
            show("Something went wrong. Please try again.")
        }

    } catch is CancellationError {
        // The user stopped it. Nothing to show.

    } catch {
        show("Something went wrong. Please try again.")
    }
    ```
  </Tab>

  <Tab title="Network problems" icon="wifi">
    Connection problems come back as `.networkError`, wrapping a `URLError`:

    ```swift theme={null}
    catch let error as APIError {
        if case .networkError(let underlying) = error {
            switch (underlying as? URLError)?.code {
            case .notConnectedToInternet, .networkConnectionLost:
                show("You appear to be offline.")
            case .timedOut:
                show("The request timed out. Try again.")
            default:
                show("Couldn't reach Chatbase.")
            }
        }
    }
    ```

    Change timeouts with the `URLSessionConfiguration` you pass to `ChatbaseClient`. See [Overview](/docs/ios-sdk/overview#init).
  </Tab>

  <Tab title="SwiftUI state" icon="swift">
    `ConversationState` and `ConversationListState` never throw. Errors go into `error`:

    ```swift theme={null}
    .alert(
        "Something went wrong",
        isPresented: .init(
            get: { state.error != nil },
            set: { if !$0 { state.clearError() } }
        )
    ) {
        Button("OK") { state.clearError() }
    } message: {
        Text(userFacingMessage(for: state.error))
    }
    ```

    The failed bubble is also marked `isError`, so you can show a retry button in the list instead of an alert. See [SwiftUI](/docs/ios-sdk/swiftui).
  </Tab>

  <Tab title="Rate limits" icon="gauge">
    Wait before trying again, and make each wait longer than the last:

    ```swift theme={null}
    func withRetry<T>(
        attempts: Int = 3,
        _ operation: () async throws -> T
    ) async throws -> T {
        var delay: Duration = .milliseconds(500)
        for attempt in 1...attempts {
            do {
                return try await operation()
            } catch let error as APIError where error.statusCode == 429 && attempt < attempts {
                try await Task.sleep(for: delay + .milliseconds(.random(in: 0...200)))
                delay *= 2
            }
        }
        throw APIError.invalidResponse
    }
    ```

    The small random amount keeps many devices from retrying at the same moment.

    <Note>
      Tool results are already retried inside the SDK, 3 times with a growing wait. Do not add your own retry around tool handlers.
    </Note>
  </Tab>
</Tabs>

## Errors Inside Tool Handlers

An error thrown by a tool handler does **not** come out of `send`. The SDK turns it into `{"error": "..."}` and gives it to the AI agent, so the AI agent can recover. See [When a Tool Fails](/docs/ios-sdk/client-side-tools#when-a-tool-fails).

`CancellationError` is the exception. It is passed through, so cancelling the `Task` cancels the reply.

## What to Report

The SDK already logs each request and response under `com.chatbase.sdk`. See [Logging](/docs/ios-sdk/overview#logging). When you report a problem, include the `apiCode`, the `statusCode`, and the time. That is enough to find the request on the server.

<Warning>
  Do not send tokens or message text to a crash reporting service. `APIError.localizedDescription` is safe. It contains only the code, the message, and the status.
</Warning>

## Related

<CardGroup cols={2}>
  <Card title="Streaming" icon="wave-pulse" href="/docs/ios-sdk/streaming">
    Where most errors show up
  </Card>

  <Card title="User Identity" icon="user" href="/docs/ios-sdk/user-identity">
    Handling expired and rejected tokens
  </Card>

  <Card title="Client-Side Tools" icon="bolt" href="/docs/ios-sdk/client-side-tools">
    Reporting failures back to the AI agent
  </Card>

  <Card title="Overview" icon="book-open" href="/docs/ios-sdk/overview">
    Setup and configuration
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.