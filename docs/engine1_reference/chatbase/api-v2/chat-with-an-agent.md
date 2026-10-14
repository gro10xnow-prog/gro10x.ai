> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Chat with an agent

> Send a message to an agent and receive a response. Supports streaming responses when `stream: true` is set in the request body.



## OpenAPI

````yaml /api-v2-openapi.json post /agents/{agentId}/chat
openapi: 3.1.0
info:
  title: Chatbase API v2
  version: 2.0.0
  description: >-
    Chatbase API v2 - A robust, structured API for managing agents,
    conversations, and the helpdesk.
servers:
  - url: https://www.chatbase.co/api/v2
    description: Chatbase API v2
security: []
paths:
  /agents/{agentId}/chat:
    post:
      tags:
        - Agents
      summary: Chat with an agent
      description: >-
        Send a message to an agent and receive a response. Supports streaming
        responses when `stream: true` is set in the request body.
      operationId: chatWithAgent
      parameters:
        - schema:
            type: string
            minLength: 1
            description: The agent ID
            example: 5QHA6VB-DIAbBhxwqxfdi
          required: true
          description: The agent ID
          name: agentId
          in: path
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatRequest'
      responses:
        '200':
          description: Successful response
          content:
            text/event-stream:
              schema:
                $ref: '#/components/schemas/StreamFinishMetadata'
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/ChatResponse'
                required:
                  - data
        '400':
          description: >-
            The request body failed schema validation. Inspect the `details`
            object in the error response for field-level errors.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: VALIDATION_INVALID_BODY
                  message: Invalid request
        '401':
          description: >-
            No Authorization header present. Provide a valid API key as a Bearer
            token in the Authorization header: `Authorization: Bearer
            <api-key>`.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: AUTH_MISSING_API_KEY
                  message: Authentication required
        '402':
          description: >-
            The account's message credit balance is zero. Upgrade the plan or
            wait for credits to reset at the next billing cycle.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: CHAT_CREDITS_EXHAUSTED
                  message: Message limit reached
        '403':
          description: >-
            Your current plan does not include API access. Upgrade to the
            Standard plan or higher to use the API.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: SUBSCRIPTION_API_RESTRICTED_PLAN
                  message: A Standard plan or higher is required to access the API
        '404':
          description: >-
            No agent matches the provided `agentId`, or it does not belong to
            the authenticated account.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: AGENT_NOT_FOUND
                  message: Agent not found
        '429':
          description: >-
            Rate limit exceeded. Check the `X-RateLimit-Reset` response header
            for the Unix epoch seconds when the limit resets.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: RATE_LIMIT_TOO_MANY_REQUESTS
                  message: Too many requests, please try again later
        '500':
          description: >-
            An unhandled server error occurred. If the issue persists, contact
            support with the `x-request-id` response header value for debugging.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: INTERNAL_SERVER_ERROR
                  message: Something went wrong, please try again
        '503':
          description: >-
            Chatbase is undergoing scheduled maintenance and the API is
            temporarily rejecting requests. This is transient; retry after a
            short delay. Requests are rejected before any data is read or
            written, so no partial changes are applied.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: SERVICE_UNDER_MAINTENANCE
                  message: >-
                    The API is temporarily unavailable for scheduled
                    maintenance, please try again later
      security:
        - bearerAuth: []
components:
  schemas:
    ChatRequest:
      type: object
      properties:
        message:
          type: string
          minLength: 1
          description: >-
            The user message to send to the agent. Omit to continue the
            conversation after submitting a tool result.
          example: Hello, how can you help me?
        conversationId:
          type: string
          description: >-
            Optional conversation ID to continue an existing conversation. If
            omitted, a new conversation will be started.
        stream:
          type: boolean
          default: true
          description: >-
            Whether to stream the response as Server-Sent Events (SSE). Defaults
            to true.
        userId:
          type: string
          maxLength: 128
          pattern: ^[a-zA-Z0-9._-]+$
          description: >-
            Optional user ID to associate with a new conversation. Only applied
            when creating a new conversation (no conversationId). Once set, a
            conversation's userId is immutable — this field is ignored for
            existing conversations. Must contain only URL-safe characters
            (letters, digits, hyphens, underscores, dots).
    StreamFinishMetadata:
      type: object
      properties:
        messageId:
          type: string
          description: Unique ID of the assistant message
        userMessageId:
          type: string
          description: >-
            The ID of the user message that triggered this response. For
            continuation responses, this is the last user message in the
            conversation.
        conversationId:
          type: string
          description: The conversation ID. Use this for follow-up messages.
        userId:
          type:
            - string
            - 'null'
          description: The user ID associated with this conversation, or null if none
        usage:
          type: object
          properties:
            credits:
              type: number
              description: Credits consumed by this request
              example: 2
          required:
            - credits
          description: Usage information for this request
      required:
        - messageId
        - userMessageId
        - conversationId
        - userId
        - usage
      description: >-
        Streaming response using the AI SDK UIMessage Stream protocol.


        Each SSE event has an `event:` field with the type and a `data:` field
        with JSON content.


        **AI SDK events:**

        - `message-start` — `{ type, messageId }` — Start of a new message

        - `text-start` — `{ type, id }` — Start of a text block

        - `text-delta` — `{ type, id, delta }` — Incremental text chunk

        - `text-end` — `{ type, id }` — End of a text block

        - `tool-input-start` — `{ type, toolCallId, toolName }` — Start of tool
        call input

        - `tool-input-delta` — `{ type, toolCallId, inputTextDelta }` —
        Incremental tool input

        - `tool-input-available` — `{ type, toolCallId, toolName, input }` —
        Complete tool input

        - `tool-output-available` — `{ type, toolCallId, output }` — Tool
        execution result

        - `start-step` — `{ type }` — Start of a processing step

        - `finish-step` — `{ type }` — End of a processing step

        - `finish` — `{ type }` — Stream complete

        - `error` — `{ type, errorText }` — Error occurred


        **Chatbase metadata (emitted as `message-metadata` on the finish
        event):**

        The schema below describes the custom metadata attached to the `finish`
        event. Use `conversationId` for follow-up messages.


        Stream terminates with `data: [DONE]`.
    ChatResponse:
      type: object
      properties:
        id:
          type: string
          description: Unique message ID
          example: msg_abc123
        role:
          type: string
          enum:
            - assistant
          description: The message role (always "assistant" for responses)
        parts:
          $ref: '#/components/schemas/MessageParts'
        metadata:
          type: object
          properties:
            userMessageId:
              type: string
              description: >-
                The ID of the user message that triggered this response. For
                continuation responses, this is the last user message in the
                conversation.
            conversationId:
              type: string
              description: >-
                The conversation ID. Use this for follow-up messages to continue
                the conversation.
            userId:
              type:
                - string
                - 'null'
              description: The user ID associated with this conversation, or null if none
            finishReason:
              type: string
              enum:
                - stop
                - error
                - tool-calls
              description: >-
                Why the model stopped generating. "stop" means normal
                completion, "error" means an error occurred, "tool-calls" means
                the model invoked a client-side action — submit the tool result
                and continue the conversation.
            usage:
              type: object
              properties:
                credits:
                  type: number
                  description: Credits consumed by this request
                  example: 2
              required:
                - credits
              description: Usage information for this request
          required:
            - userMessageId
            - conversationId
            - userId
            - finishReason
            - usage
          description: Response metadata including conversation tracking
      required:
        - id
        - role
        - parts
        - metadata
    ErrorResponse:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
              description: Machine-readable error code
            message:
              type: string
              description: Human-readable error message
            details:
              type: object
              additionalProperties:
                type: string
              description: Field-level validation errors
          required:
            - code
            - message
      required:
        - error
    MessageParts:
      type: array
      items:
        oneOf:
          - type: object
            properties:
              type:
                type: string
                enum:
                  - text
              text:
                type: string
            required:
              - type
              - text
          - type: object
            properties:
              type:
                type: string
                enum:
                  - tool-call
              toolCallId:
                type: string
              toolName:
                type: string
              input: {}
            required:
              - type
              - toolCallId
              - toolName
          - type: object
            properties:
              type:
                type: string
                enum:
                  - tool-result
              toolCallId:
                type: string
              toolName:
                type: string
              output: {}
            required:
              - type
              - toolCallId
              - toolName
      description: >-
        Message content parts. Can include text, tool calls, and tool results.
        Use this for full detail including tool interactions.
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.