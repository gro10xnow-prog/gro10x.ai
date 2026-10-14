> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Export conversations

> Export all conversations with full message history for an agent. Includes conversations from all sources. Tool results are sanitized to remove internal data. Supports cursor-based pagination. Pass `conversationId` to fetch a single conversation from any source (widget, API, WhatsApp, etc.). Pass `include=summary` to omit message bodies for a cheaper triage pass, `source` to restrict to one or more conversation sources, and `startDate` / `endDate` to restrict to a createdAt window.



## OpenAPI

````yaml /api-v2-openapi.json get /agents/{agentId}/conversations/export
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
  /agents/{agentId}/conversations/export:
    get:
      tags:
        - Conversations
      summary: Export conversations
      description: >-
        Export all conversations with full message history for an agent.
        Includes conversations from all sources. Tool results are sanitized to
        remove internal data. Supports cursor-based pagination. Pass
        `conversationId` to fetch a single conversation from any source (widget,
        API, WhatsApp, etc.). Pass `include=summary` to omit message bodies for
        a cheaper triage pass, `source` to restrict to one or more conversation
        sources, and `startDate` / `endDate` to restrict to a createdAt window.
      operationId: exportConversations
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
            description: Opaque cursor from a previous response to fetch the next page
            example: eyJ0IjoiMjAyNC0wMS0xNVQxMDozMDowMC4wMDBaIiwiaWQiOiJhYmMxMjMifQ==
          required: false
          description: Opaque cursor from a previous response to fetch the next page
          name: cursor
          in: query
        - schema:
            type: integer
            minimum: 1
            maximum: 20
            default: 20
            description: Number of items per page (1–20, default 20)
            example: 20
          required: false
          description: Number of items per page (1–20, default 20)
          name: limit
          in: query
        - schema:
            type: string
            description: >-
              Only return conversations created at or after this point. Accepts
              a calendar date (`YYYY-MM-DD`, interpreted as the start of that
              day in UTC) or an ISO 8601 date-time.
            example: '2024-01-01'
          required: false
          description: >-
            Only return conversations created at or after this point. Accepts a
            calendar date (`YYYY-MM-DD`, interpreted as the start of that day in
            UTC) or an ISO 8601 date-time.
          name: startDate
          in: query
        - schema:
            type: string
            description: >-
              Only return conversations created at or before this point. Accepts
              a calendar date (`YYYY-MM-DD`, interpreted as the *end* of that
              day in UTC, so the day itself is included) or an ISO 8601
              date-time.
            example: '2024-01-31'
          required: false
          description: >-
            Only return conversations created at or before this point. Accepts a
            calendar date (`YYYY-MM-DD`, interpreted as the *end* of that day in
            UTC, so the day itself is included) or an ISO 8601 date-time.
          name: endDate
          in: query
        - schema:
            type: string
            description: >-
              Return only the conversation with this ID. Use this to fetch a
              single conversation from any source (widget, API, WhatsApp, etc.).
          required: false
          description: >-
            Return only the conversation with this ID. Use this to fetch a
            single conversation from any source (widget, API, WhatsApp, etc.).
          name: conversationId
          in: query
        - schema:
            type: string
            enum:
              - summary
              - messages
            default: messages
            description: >-
              Whether to include message bodies. `summary` omits them and skips
              reading them from the database — use it to triage a page cheaply,
              then re-request a specific conversation with `conversationId`.
              Defaults to `messages`.
            example: summary
          required: false
          description: >-
            Whether to include message bodies. `summary` omits them and skips
            reading them from the database — use it to triage a page cheaply,
            then re-request a specific conversation with `conversationId`.
            Defaults to `messages`.
          name: include
          in: query
        - schema:
            type: string
            description: >-
              Comma-separated conversation sources to include, e.g.
              `API,WhatsApp`. Omit for all sources.
            example: Widget or Iframe
          required: false
          description: >-
            Comma-separated conversation sources to include, e.g.
            `API,WhatsApp`. Omit for all sources.
          name: source
          in: query
      responses:
        '200':
          description: Paginated list of conversations with full message history
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExportConversationsResponse'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                VALIDATION_INVALID_BODY:
                  summary: >-
                    The request body failed schema validation. Inspect the
                    `details` object in the error response for field-level
                    errors.
                  value:
                    error:
                      code: VALIDATION_INVALID_BODY
                      message: Invalid request
                VALIDATION_INVALID_DATE_RANGE:
                  summary: >-
                    The requested `createdAt` window is inverted. An inverted
                    window can never match a row, so it is rejected rather than
                    silently returning an empty page.
                  value:
                    error:
                      code: VALIDATION_INVALID_DATE_RANGE
                      message: startDate must not be after endDate
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
    ExportConversationsResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/ExportConversation'
        pagination:
          type: object
          properties:
            cursor:
              type:
                - string
                - 'null'
              description: Cursor for the next page, or null if no more pages
            hasMore:
              type: boolean
              description: Whether more results are available
            total:
              type: number
              description: Total number of items matching the query
          required:
            - cursor
            - hasMore
            - total
      required:
        - data
        - pagination
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
    ExportConversation:
      type: object
      properties:
        id:
          type: string
          description: Conversation ID
        title:
          type:
            - string
            - 'null'
          description: Conversation title
        createdAt:
          type: number
          description: Unix epoch timestamp (seconds)
        updatedAt:
          type: number
          description: Unix epoch timestamp (seconds) of last activity
        userId:
          type:
            - string
            - 'null'
          description: User ID if the conversation is authenticated
        source:
          type:
            - string
            - 'null'
          enum:
            - API
            - WhatsApp
            - Messenger
            - Instagram
            - Slack
            - Salesforce
            - Zendesk
            - Zendesk Messaging
            - Chatbase site
            - Playground
            - Action preview
            - Qna preview
            - Widget or Iframe
            - Center stage
            - Search
            - Iframe
            - Email
            - Agent page
            - Phone
            - Android SDK
            - iOS SDK
            - Unspecified
            - null
          description: Conversation source
        embedOrigin:
          type:
            - string
            - 'null'
          description: >-
            URL of the page the chat widget was embedded on when the
            conversation started, without its query string, e.g.
            `https://www.example.com/pricing`. Only the origin is included when
            the browser did not send the page path. Null when unknown or for
            non-widget conversations.
          example: https://www.example.com/pricing
        status:
          type: string
          enum:
            - ongoing
            - ended
            - taken_over
            - paused
          description: Conversation activity status
        parentConversationId:
          type:
            - string
            - 'null'
          description: ID of the parent conversation this was continued from, if any
        parentSummary:
          type:
            - string
            - 'null'
          description: AI-generated summary of the parent conversation, if any
        messages:
          type: array
          items:
            $ref: '#/components/schemas/ExportMessage'
          description: >-
            Conversation messages. Present unless `include=summary` was
            requested.
      required:
        - id
        - title
        - createdAt
        - updatedAt
        - userId
        - source
        - embedOrigin
        - status
    ExportMessage:
      type: object
      properties:
        id:
          type: string
          description: Message ID
        role:
          type: string
          enum:
            - user
            - assistant
          description: Message role
        parts:
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
          description: Message content parts
        createdAt:
          type: number
          description: Unix epoch timestamp (seconds)
        feedback:
          type:
            - string
            - 'null'
          enum:
            - positive
            - negative
            - null
          description: User feedback on this message (present on assistant messages)
        metadata:
          $ref: '#/components/schemas/MessageMetadata'
      required:
        - id
        - role
        - parts
    MessageMetadata:
      type: object
      properties:
        score:
          type:
            - number
            - 'null'
          description: Confidence score for this message (0 to 1 float value)
      required:
        - score
      description: Message metadata (present on assistant messages)
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.