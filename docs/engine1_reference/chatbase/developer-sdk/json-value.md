> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# JSONValue

> Reference for JSONValue, the type the SDK uses for tool input and output.

## Overview

`enum JSONValue: Sendable, Equatable, Codable`

Tool input and output can be any JSON, so the SDK uses `JSONValue` instead of `Any`. That means you can read it without casting, and pass it between threads safely.

```swift theme={null}
public enum JSONValue: Sendable, Equatable, Codable {
    case string(String)
    case int(Int)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null
}
```

You will run into it in four places:

| Where | What you do |
| - | - |
| A tool handler's input | Read it |
| A tool handler's return value | Write it |
| `ToolCallInfo.input` | Read it |
| `ToolResultInfo.output` and message parts | Read it |

## Reading Values

### Looking up a key

```swift theme={null}
public subscript(key: String) -> JSONValue? { get }
```

Looks up a key. Returns `nil` if the key is missing or the value is not an object, so you can chain safely:

```swift theme={null}
let city = input["location"]?["city"]
```

### Getting a Swift type

```swift theme={null}
public var stringValue: String? { get }
public var intValue: Int? { get }
public var numberValue: Double? { get }
public var boolValue: Bool? { get }
public var objectValue: [String: JSONValue]? { get }
public var arrayValue: [JSONValue]? { get }
```

Each one returns `nil` if the value is a different type:

```swift theme={null}
client.tool("book_table") { input in
    let name  = input["name"]?.stringValue ?? "Guest"
    let party = input["party_size"]?.intValue ?? 2
    let vip   = input["vip"]?.boolValue ?? false
    let tags  = input["tags"]?.arrayValue?.compactMap(\.stringValue) ?? []
    // ...
}
```

<Note>
  `numberValue` is the forgiving one. It works for whole numbers and decimals alike, so both `9` and `9.0` read cleanly. `intValue` is stricter and returns `nil` for `9.0`. If a value might arrive either way, read it with `numberValue`.
</Note>

### Handling every case

To cover all the possibilities, switch on the value:

```swift theme={null}
func describe(_ value: JSONValue) -> String {
    switch value {
    case .string(let s):  return s
    case .int(let i):     return String(i)
    case .number(let d):  return String(d)
    case .bool(let b):    return b ? "yes" : "no"
    case .array(let a):   return a.map(describe).joined(separator: ", ")
    case .object(let o):  return o.map { "\($0): \(describe($1))" }.joined(separator: "; ")
    case .null:           return "-"
    }
}
```

## Writing Values

Build results from the cases:

```swift theme={null}
return .object([
    "status": .string("shipped"),
    "eta_days": .int(2),
    "cost": .number(14.99),
    "expedited": .bool(true),
    "items": .array([.string("SKU-1"), .string("SKU-2")]),
    "note": .null
])
```

### Reporting a failure

An **object with an `error` key** is how you report a problem anywhere in the SDK. The AI agent sees the tool as failed, and [`ConversationState`](/docs/ios-sdk/swiftui#toolcallcard) shows the card as failed too:

```swift theme={null}
return .object(["error": .string("No order found with that ID")])
```

See [When a Tool Fails](/docs/ios-sdk/client-side-tools#when-a-tool-fails).

## Using Your Own Types

`JSONValue` works with `Codable`, so you can convert to and from your own types with `JSONEncoder` and `JSONDecoder`.

### Reading input into a struct

```swift theme={null}
struct BookingInput: Decodable {
    let name: String
    let partySize: Int
    let tags: [String]

    enum CodingKeys: String, CodingKey {
        case name
        case partySize = "party_size"
        case tags
    }
}

client.tool("book_table") { input in
    let booking = try JSONDecoder().decode(
        BookingInput.self,
        from: JSONEncoder().encode(input)
    )
    // booking.partySize, booking.tags, ...
}
```

### Returning a struct

```swift theme={null}
struct BookingResult: Encodable {
    let confirmationCode: String
    let time: String
}

client.tool("book_table") { input in
    let result = BookingResult(confirmationCode: "AB12", time: "19:30")
    return try JSONDecoder().decode(
        JSONValue.self,
        from: JSONEncoder().encode(result)
    )
}
```

<Tip>
  A small helper makes both directions easier to read:

  ```swift theme={null}
  extension JSONValue {
      init<T: Encodable>(encoding value: T) throws {
          self = try JSONDecoder().decode(JSONValue.self, from: JSONEncoder().encode(value))
      }

      func decoded<T: Decodable>(as type: T.Type = T.self) throws -> T {
          try JSONDecoder().decode(T.self, from: JSONEncoder().encode(self))
      }
  }
  ```

  ```swift theme={null}
  client.tool("book_table") { input in
      let booking: BookingInput = try input.decoded()
      return try JSONValue(encoding: BookingResult(confirmationCode: "AB12", time: "19:30"))
  }
  ```

  Throwing here is fine. The SDK turns it into an `error` result for the AI agent instead of failing the whole reply. Just keep the message safe to show a user.
</Tip>

## How Values Are Read

The SDK tries the cases in this order: null, `Bool`, `Int`, `Double`, `String`, object, array. Two things follow from that:

* A whole number is always read as `.int`, never `.number`. If the AI agent might send either, read it with `numberValue`.
* Anything that matches none of the cases is read as `.null` instead of failing, so an odd tool result will not break the reply.

## Size Limit

Tool results can be at most **20 KB** of JSON. Anything larger fails with `400` `VALIDATION_INVALID_BODY`.

<Warning>
  Tool results are passed on exactly as they are, including to HIPAA conversation webhooks. Never put tokens, signed URLs, file paths, internal IDs, or stack traces in a `JSONValue` you return. Return only what the AI agent needs to answer.
</Warning>

## Related

<CardGroup cols={2}>
  <Card title="Client-Side Tools" icon="bolt" href="/docs/ios-sdk/client-side-tools">
    Where you use JSONValue most
  </Card>

  <Card title="Streaming Types" icon="list" href="/docs/ios-sdk/streaming-events">
    ToolCallInfo and ToolResultInfo
  </Card>

  <Card title="ChatResponse" icon="brackets-curly" href="/docs/ios-sdk/chat-response">
    Message parts
  </Card>

  <Card title="SwiftUI" icon="swift" href="/docs/ios-sdk/swiftui">
    Showing tool input and output
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.