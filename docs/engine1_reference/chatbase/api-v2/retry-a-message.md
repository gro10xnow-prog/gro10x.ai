> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Retry a message

> Retry generating an assistant response for a given message. Truncates the conversation at the target message, then re-sends the preceding user message through the chat service.



## OpenAPI

````yaml /api-v2-openapi.json post /agents/{agentId}/conversations/{conversationId}/retry
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
  /agents/{agentId}/conversations/{conversationId}/retry:
    post:
      tags:
        - Agents
      summary: Retry a message
      description: >-
        Retry generating an assistant response for a given message. Truncates
        the conversation at the target message, then re-sends the preceding user
        message through the chat service.
      operationId: retryMessage
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
        - schema:
            type: string
            minLength: 1
            description: The conversation ID
            example: a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
          required: true
          description: The conversation ID
          name: conversationId
          in: path
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RetryRequest'
      responses:
        '200':
          description: Successful response
          content:
            text/event-stream:
              schema:
                type: string
                description: Streaming text response
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
          description: The provided `messageId` does not exist in the conversation.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: CHAT_RETRY_MESSAGE_NOT_FOUND
                  message: Message not found in conversation
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
    RetryRequest:
      type: object
      properties:
        messageId:
          type: string
          minLength: 1
          description: The ID of the message to retry from
          example: msg-abc123
        stream:
          type: boolean
          default: true
          description: Whether to stream the response as SSE. Defaults to true.
      required:
        - messageId
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