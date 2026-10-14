> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Client-Side Tools

> Let your Chatbase AI agent run functions on the device during a conversation.

## What Are Client-Side Tools?

Client-side tools let your AI agent run functions on the device. You register a handler, and the SDK does the rest. When the AI agent asks for the tool, your handler runs, the result goes back to the AI agent, and the reply continues, all inside the same `send(...)` call.

<Note>
  Client-side tools match the **Custom Actions** set up on your AI agent in the [Chatbase Dashboard](https://www.chatbase.co/dashboard). The name you register must match the action's name.
</Note>

## tool

```swift theme={null}
public func tool(_ name: String, handler: @escaping ToolHandler)
```

```swift theme={null}
public typealias ToolHandler = @Sendable (JSONValue) async throws -> JSONValue
```

Registers a tool handler. Registering the same name twice replaces the old handler.

<ParamField body="name" type="String" required>
  The tool name. Must match a Custom Action on your AI agent.
</ParamField>

<ParamField body="handler" type="@Sendable (JSONValue) async throws -> JSONValue" required>
  An async closure. It receives the tool's input as a [`JSONValue`](/docs/ios-sdk/json-value) and returns the result as a `JSONValue`.
</ParamField>

```swift theme={null}
client.tool("get_weather") { input in
    guard let city = input["city"]?.stringValue else {
        return .object(["error": .string("Missing 'city'")])
    }

    let forecast = try await WeatherService.fetch(city: city)

    return .object([
        "city": .string(city),
        "temperature": .string(forecast.temperature),
        "condition": .string(forecast.condition)
    ])
}
```

Register your tools once, right after creating the client, before the first `send`:

```swift theme={null}
let client = ChatbaseClient(agentId: "YOUR_AGENT_ID")
client.tool("get_weather") { ... }
client.tool("lookup_order") { ... }
```

<Warning>
  Tool results can be at most **20 KB** of JSON. Anything larger fails with a `400` `VALIDATION_INVALID_BODY` error. Return only the fields the AI agent needs. Never return a whole API response.
</Warning>

## How the Tool Loop Works

One `send` call can go back and forth with the server several times:

<Steps>
  <Step title="You send a message">
    `client.send("What's the weather in Tokyo?")` opens the connection.
  </Step>

  <Step title="The AI agent asks for a tool">
    The SDK runs your `onToolCall` callback and looks up your handler.
  </Step>

  <Step title="Your handler runs">
    The SDK waits for it, sends the result to the server, and runs `onToolResult`.
  </Step>

  <Step title="The reply continues">
    The SDK reconnects to the same conversation. The AI agent can now see the tool result, and either answers or asks for another tool.
  </Step>

  <Step title="Repeat until finished">
    This continues until the AI agent finishes without asking for a tool. `send` then returns the `ChatResponse`.
  </Step>
</Steps>

All of this happens inside that one `await`. Text from every round is joined together into `response.message.text`.

### Tool loop limit

There is a limit so a confused AI agent cannot loop forever. The default is 10 rounds, and you can change it per client:

```swift theme={null}
let client = ChatbaseClient(agentId: "YOUR_AGENT_ID", maxToolLoopSteps: 20)
```

Going over the limit throws `ChatError.toolLoopLimitExceeded(limit:)`:

```swift theme={null}
do {
    _ = try await client.send("Do the thing")
} catch ChatError.toolLoopLimitExceeded(let limit) {
    print("The agent used more than \(limit) tool steps, so we stopped")
}
```

<Tip>
  Hitting the limit usually means the AI agent keeps calling a tool because the result does not answer its question. Check that your handler returns what the action's description promises.
</Tip>

### Automatic retries

Sending a tool result is retried up to **3 times**, waiting 300 ms, then 600 ms, then 1.2 s. This covers the short gap before the server is ready for the result. You do not need to retry yourself.

## When a Tool Fails

Return an object with an `error` key to tell the AI agent the tool failed, so it can try something else or explain the problem to the user:

```swift theme={null}
client.tool("lookup_order") { input in
    guard let id = input["order_id"]?.stringValue else {
        return .object(["error": .string("Missing order_id")])
    }
    guard let order = try await OrderService.fetch(id: id) else {
        return .object(["error": .string("No order found with ID \(id)")])
    }
    return .object(["status": .string(order.status)])
}
```

**Thrown errors become the same thing.** If your handler throws, the SDK sends `{"error": "<the error's description>"}` instead of failing the whole `send` call, so one broken tool does not kill the reply.

<Warning>
  Because these errors are shown to the AI agent, they can end up in the conversation. Do not throw errors whose description contains tokens, signed URLs, internal IDs, or stack traces. Return a message you are happy for a user to read.
</Warning>

`CancellationError` is the one exception. It is passed through, so cancelling the `Task` cancels the whole reply instead of reporting a failed tool.

### Tools with no handler

If the AI agent asks for a tool you never registered, the SDK sends back `{"error": "No handler registered for tool 'name'"}`. The AI agent can then apologize or try something else, instead of hanging.

## Tools That Ask the User

Handlers are `async`, so they can wait for the user and return their answer as the tool result. This is how you build confirmation prompts, pickers, and in-chat forms.

```swift theme={null}
@MainActor
@Observable
final class ColorPickerCoordinator {
    var pending: CheckedContinuation<String, Never>?
    var isPresented = false

    func request() async -> String {
        await withCheckedContinuation { continuation in
            pending = continuation
            isPresented = true
        }
    }

    func choose(_ color: String) {
        isPresented = false
        pending?.resume(returning: color)
        pending = nil
    }
}
```

```swift theme={null}
client.tool("pick_color") { _ in
    let color = await coordinator.request()   // waits until the user taps
    return .object(["color": .string(color)])
}
```

```swift theme={null}
struct ChatView: View {
    @State var coordinator: ColorPickerCoordinator

    var body: some View {
        MessageList()
            .sheet(isPresented: $coordinator.isPresented) {
                ColorGrid { color in coordinator.choose(color) }
            }
    }
}
```

<Warning>
  Always call `resume` exactly once, on every path, including when the user dismisses the sheet. If you never resume it, the tool waits forever and `send` never returns. When the user cancels, resume with a default value or an `error` result.
</Warning>

## Watching Tools Run

Use `onToolCall` and `onToolResult` to show progress:

```swift theme={null}
let response = try await client.send("What's the weather in Tokyo?") { cb in
    cb.onToolCall = { info in
        print("Calling \(info.toolName) with \(info.input)")
    }
    cb.onToolResult = { info in
        print("\(info.toolName) returned \(info.output)")
    }
    cb.onTextDelta = { print($0, terminator: "") }
}
```

Both callbacks also run for tools the **server** handles, such as server-side Custom Actions and integrations, not just your own handlers. That means one piece of UI can show every tool the AI agent uses. See [`ToolCallInfo`](/docs/ios-sdk/streaming-events#toolcallinfo) and [`ToolResultInfo`](/docs/ios-sdk/streaming-events#toolresultinfo).

<Tip>
  [`ConversationState`](/docs/ios-sdk/swiftui) turns these callbacks into tool cards in the message list, with a running, finished, or failed state, using the `error` key rule above. Start there if you want tool UI without writing it.
</Tip>

## Reading Tool Input

Input arrives as a [`JSONValue`](/docs/ios-sdk/json-value). Read it with the subscript and the typed properties:

```swift theme={null}
client.tool("book_table") { input in
    let party = input["party_size"]?.intValue ?? 2
    let name  = input["name"]?.stringValue
    let vip   = input["vip"]?.boolValue ?? false
    let tags  = input["tags"]?.arrayValue?.compactMap(\.stringValue) ?? []
    // ...
}
```

For bigger inputs, decode into your own type. `JSONValue` works with `Codable`:

```swift theme={null}
struct BookingInput: Decodable {
    let partySize: Int
    let name: String
    let tags: [String]
}

client.tool("book_table") { input in
    let data = try JSONEncoder().encode(input)
    let booking = try JSONDecoder().decode(BookingInput.self, from: data)
    // ...
}
```

## Related

<CardGroup cols={2}>
  <Card title="Streaming" icon="wave-pulse" href="/docs/ios-sdk/streaming">
    The send method and its callbacks
  </Card>

  <Card title="JSONValue" icon="brackets-curly" href="/docs/ios-sdk/json-value">
    Reading and writing tool data
  </Card>

  <Card title="SwiftUI" icon="swift" href="/docs/ios-sdk/swiftui">
    Tool cards you get for free
  </Card>

  <Card title="Error Handling" icon="triangle-exclamation" href="/docs/ios-sdk/error-handling">
    Handling errors while tools run
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.