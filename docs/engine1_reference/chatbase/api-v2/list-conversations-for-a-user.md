> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# List conversations for a user

> List conversations for a specific user under an agent, ordered by last activity. Supports cursor-based pagination.



## OpenAPI

````yaml /api-v2-openapi.json get /agents/{agentId}/users/{userId}/conversations
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
  /agents/{agentId}/users/{userId}/conversations:
    get:
      tags:
        - Conversations
      summary: List conversations for a user
      description: >-
        List conversations for a specific user under an agent, ordered by last
        activity. Supports cursor-based pagination.
      operationId: listUserConversations
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
            maxLength: 128
            pattern: ^[a-zA-Z0-9._-]+$
            description: >-
              The user ID (URL-safe characters only: letters, digits, hyphens,
              underscores, dots)
            example: user_abc123
          required: true
          description: >-
            The user ID (URL-safe characters only: letters, digits, hyphens,
            underscores, dots)
          name: userId
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
            maximum: 100
            default: 20
            description: Number of items per page (1 to 100, default 20)
            example: 20
          required: false
          description: Number of items per page (1 to 100, default 20)
          name: limit
          in: query
      responses:
        '200':
          description: Paginated list of user conversations
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ListUserConversationsResponse'
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
    ListUserConversationsResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/ConversationMetadata'
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
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.