> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get a conversation

> Get conversation metadata and its most recent messages. The pagination cursor can be used with the list messages endpoint to fetch older messages. Only returns conversations created through the API. To fetch a conversation from any source (widget, WhatsApp, etc.), use GET /agents/{agentId}/conversations/export?conversationId={conversationId} instead.



## OpenAPI

````yaml /api-v2-openapi.json get /agents/{agentId}/conversations/{conversationId}
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
  /agents/{agentId}/conversations/{conversationId}:
    get:
      tags:
        - Conversations
      summary: Get a conversation
      description: >-
        Get conversation metadata and its most recent messages. The pagination
        cursor can be used with the list messages endpoint to fetch older
        messages. Only returns conversations created through the API. To fetch a
        conversation from any source (widget, WhatsApp, etc.), use GET
        /agents/{agentId}/conversations/export?conversationId={conversationId}
        instead.
      operationId: getConversation
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
      responses:
        '200':
          description: Conversation metadata with recent messages
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GetConversationResponse'
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
        '404':
          description: >-
            No resource matches the provided ID, or it has been deleted. Verify
            the resource ID in the request path.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: RESOURCE_NOT_FOUND
                  message: The requested item could not be found
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
    GetConversationResponse:
      type: object
      properties:
        data:
          allOf:
            - $ref: '#/components/schemas/ConversationMetadata'
            - type: object
              properties:
                messages:
                  type: array
                  items:
                    $ref: '#/components/schemas/ConversationMessage'
              required:
                - messages
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
    ConversationMetadata:
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
      required:
        - id
        - title
        - createdAt
        - updatedAt
        - userId
        - status
        - parentConversationId
        - parentSummary
    ConversationMessage:
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
          allOf:
            - $ref: '#/components/schemas/MessageParts'
            - description: Message content parts
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