> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# List tickets

> Returns tickets for an agent, sorted by `updatedAt` descending by default. Supports filtering and cursor-based pagination. Filters combine with AND across parameters.



## OpenAPI

````yaml /api-v2-openapi.json get /agents/{agentId}/helpdesk/tickets
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
  /agents/{agentId}/helpdesk/tickets:
    get:
      tags:
        - Helpdesk
      summary: List tickets
      description: >-
        Returns tickets for an agent, sorted by `updatedAt` descending by
        default. Supports filtering and cursor-based pagination. Filters combine
        with AND across parameters.
      operationId: listTickets
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
            maximum: 100
            default: 20
            description: Number of items per page (1 to 100, default 20)
            example: 20
          required: false
          description: Number of items per page (1 to 100, default 20)
          name: limit
          in: query
        - schema:
            type: string
            description: >-
              Comma-separated status categories (is-any-of). Categories: new,
              on_you, on_customer, on_hold, closed, cancelled.
            example: new,on_you
          required: false
          description: >-
            Comma-separated status categories (is-any-of). Categories: new,
            on_you, on_customer, on_hold, closed, cancelled.
          name: status
          in: query
        - schema:
            type: string
            description: Comma-separated channels (is-any-of).
            example: email,api
          required: false
          description: Comma-separated channels (is-any-of).
          name: channel
          in: query
        - schema:
            anyOf:
              - type: string
                enum:
                  - none
              - type: string
                format: uuid
            description: >-
              Filter by assigned agent user id. Pass `none` for unassigned
              tickets.
          required: false
          description: >-
            Filter by assigned agent user id. Pass `none` for unassigned
            tickets.
          name: assigneeId
          in: query
        - schema:
            anyOf:
              - type: string
                enum:
                  - none
              - type: string
                format: uuid
            description: Filter by team id. Pass `none` for tickets with no team.
          required: false
          description: Filter by team id. Pass `none` for tickets with no team.
          name: teamId
          in: query
        - schema:
            type: string
            description: >-
              Comma-separated priorities (is-any-of). Priorities: none, low,
              normal, high, urgent. Pass `none` for untriaged tickets.
            example: high,urgent
          required: false
          description: >-
            Comma-separated priorities (is-any-of). Priorities: none, low,
            normal, high, urgent. Pass `none` for untriaged tickets.
          name: priority
          in: query
        - schema:
            type: string
            format: date-time
            description: Only tickets created at or after this ISO 8601 timestamp.
            example: '2026-07-01T00:00:00Z'
          required: false
          description: Only tickets created at or after this ISO 8601 timestamp.
          name: createdAfter
          in: query
        - schema:
            type: string
            format: date-time
            description: Only tickets created at or before this ISO 8601 timestamp.
            example: '2026-07-31T23:59:59Z'
          required: false
          description: Only tickets created at or before this ISO 8601 timestamp.
          name: createdBefore
          in: query
        - schema:
            type: string
            enum:
              - createdAt
              - updatedAt
              - lastMessageAt
            default: updatedAt
            description: >-
              Sort field. `updatedAt` and `lastMessageAt` fall back to
              `createdAt` when unset. Sorting by a mutable field means a page
              window is not a snapshot. Pollers should use
              `sortBy=updatedAt&order=asc` with a high-water mark.
            example: updatedAt
          required: false
          description: >-
            Sort field. `updatedAt` and `lastMessageAt` fall back to `createdAt`
            when unset. Sorting by a mutable field means a page window is not a
            snapshot. Pollers should use `sortBy=updatedAt&order=asc` with a
            high-water mark.
          name: sortBy
          in: query
        - schema:
            type: string
            enum:
              - asc
              - desc
            default: desc
            description: >-
              Sort direction. Defaults to `desc`, newest first. A cursor is only
              valid for the `sortBy`/`order` it was issued with; changing either
              mid-walk is a 400.
            example: desc
          required: false
          description: >-
            Sort direction. Defaults to `desc`, newest first. A cursor is only
            valid for the `sortBy`/`order` it was issued with; changing either
            mid-walk is a 400.
          name: order
          in: query
        - schema:
            type: string
            enum:
              - 'true'
              - 'false'
            default: 'false'
            description: >-
              When `true`, the response includes `pagination.total` (costs an
              extra count query).
            example: 'false'
          required: false
          description: >-
            When `true`, the response includes `pagination.total` (costs an
            extra count query).
          name: includeTotal
          in: query
        - schema:
            type: string
            enum:
              - 'true'
              - 'false'
            default: 'false'
            description: >-
              When `true`, each ticket includes `messages`: its first 25
              messages, oldest first, shaped like List ticket messages.
            example: 'false'
          required: false
          description: >-
            When `true`, each ticket includes `messages`: its first 25 messages,
            oldest first, shaped like List ticket messages.
          name: includeMessages
          in: query
        - schema:
            type: string
            default: reply,note
            description: >-
              Message types for `messages`, as in List ticket messages. Ignored
              unless `includeMessages=true`.
            example: reply,note
          required: false
          description: >-
            Message types for `messages`, as in List ticket messages. Ignored
            unless `includeMessages=true`.
          name: messageTypes
          in: query
      responses:
        '200':
          description: Paginated list of tickets
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ListTicketsResponse'
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
    ListTicketsResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/TicketListItem'
        pagination:
          $ref: '#/components/schemas/TicketListPaginationMeta'
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
    TicketListItem:
      type: object
      properties:
        ticketNumber:
          type: integer
          description: The ticket number
          example: 123
        subject:
          type:
            - string
            - 'null'
          description: Ticket subject
        statusCategory:
          type: string
          enum:
            - new
            - on_you
            - on_customer
            - on_hold
            - closed
            - cancelled
          description: Status category driving color/ordering semantics
          example: on_customer
        statusId:
          type: string
          description: ID of the ticket status. Resolve label/color via /ticket-statuses.
        assigneeId:
          type:
            - string
            - 'null'
          description: ID of the assigned agent user, or null when unassigned
        customer:
          $ref: '#/components/schemas/TicketCustomer'
        channel:
          type: string
          enum:
            - helpdesk
            - iframe
            - email
            - whatsapp
            - api
            - messenger
            - instagram
            - center_stage
            - phone
            - instagram_comment
            - facebook_comment
          description: Channel the ticket originated from
          example: email
        conversationId:
          type:
            - string
            - 'null'
          description: ID of the linked conversation, if any
        teamId:
          type:
            - string
            - 'null'
          description: ID of the assigned team, or null. Resolve via /teams.
        priority:
          type: string
          enum:
            - none
            - low
            - normal
            - high
            - urgent
          description: Ticket priority. `none` means the ticket has not been triaged.
          example: high
        createdAt:
          type: string
          description: ISO 8601 creation timestamp
          example: '2026-07-20T12:34:56.000Z'
        updatedAt:
          type: string
          description: ISO 8601 timestamp of the last update
          example: '2026-07-21T09:00:00.000Z'
        lastMessageAt:
          type:
            - string
            - 'null'
          description: >-
            ISO 8601 timestamp of the most recent message, or null if the ticket
            has no messages
          example: '2026-07-21T08:55:00.000Z'
        messages:
          $ref: '#/components/schemas/ListTicketMessagesResponse'
      required:
        - ticketNumber
        - subject
        - statusCategory
        - statusId
        - assigneeId
        - customer
        - channel
        - conversationId
        - teamId
        - priority
        - createdAt
        - updatedAt
        - lastMessageAt
    TicketListPaginationMeta:
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
          type: integer
          description: >-
            Total number of tickets matching the filters. Present only when
            `includeTotal=true`.
      required:
        - cursor
        - hasMore
    TicketCustomer:
      type: object
      properties:
        id:
          type: string
          description: ID of the customer participant
        name:
          type:
            - string
            - 'null'
          description: Customer display name, or null when not captured
          example: Ada Lovelace
        email:
          type:
            - string
            - 'null'
          description: Customer email, or null when not captured
          example: ada@example.com
        phoneNumber:
          type:
            - string
            - 'null'
          description: Customer phone number, or null when not captured
      required:
        - id
        - name
        - email
        - phoneNumber
    ListTicketMessagesResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Message'
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
    Message:
      type: object
      properties:
        id:
          type: string
          description: Message id
        type:
          type: string
          enum:
            - reply
            - note
            - event
          description: >-
            `reply` is customer-visible, `note` is an internal note, `event` is
            a system timeline entry
          example: reply
        sender:
          $ref: '#/components/schemas/MessageSender'
        content:
          type:
            - string
            - 'null'
          description: Rich (HTML) body. Null on `event` messages.
        contentText:
          type:
            - string
            - 'null'
          description: Plain-text body. Null on `event` messages.
        attachments:
          type: array
          items:
            $ref: '#/components/schemas/MessageAttachment'
          description: Always an empty array on `event` messages
        createdAt:
          type: string
          description: ISO 8601 creation timestamp
          example: '2026-07-25T10:15:00.000Z'
        metadata:
          $ref: '#/components/schemas/MessageEventMetadata'
      required:
        - id
        - type
        - sender
        - content
        - contentText
        - attachments
        - createdAt
    MessageSender:
      type:
        - object
        - 'null'
      properties:
        type:
          type: string
          enum:
            - customer
            - agent
            - system
          description: Who sent the message
          example: customer
        id:
          type:
            - string
            - 'null'
          description: 'Sender id: a platform user id for agents, a contact id for customers'
        name:
          type:
            - string
            - 'null'
          description: Sender name
        email:
          type:
            - string
            - 'null'
          description: Sender email
      required:
        - type
        - id
        - name
        - email
      description: Null on `event` messages
    MessageAttachment:
      type: object
      properties:
        name:
          type:
            - string
            - 'null'
          description: File name
        url:
          type:
            - string
            - 'null'
          description: >-
            Download URL. The route is unauthenticated and the token in the path
            is the secret. It redirects to a URL signed for 120 seconds, so it
            cannot be cached. Null when the stored attachment has no token.
        type:
          type:
            - string
            - 'null'
          description: MIME type
          example: application/pdf
        size:
          type:
            - number
            - 'null'
          description: Size in bytes
      required:
        - name
        - url
        - type
        - size
    MessageEventMetadata:
      type: object
      properties:
        eventType:
          type:
            - string
            - 'null'
          description: >-
            Event kind. `status_change` and `assign` are documented; other
            values may appear as new event kinds are added, and carry no further
            fields.
          example: status_change
        statusFrom:
          type:
            - string
            - 'null'
          description: Previous status category (status_change only)
          example: on_you
        statusTo:
          type:
            - string
            - 'null'
          description: New status category (status_change only)
          example: closed
        doneBy:
          type:
            - object
            - 'null'
          properties:
            id:
              type:
                - string
                - 'null'
            name:
              type:
                - string
                - 'null'
            email:
              type:
                - string
                - 'null'
            type:
              type:
                - string
                - 'null'
              enum:
                - agent
                - customer
                - null
              description: Whether the actor is one of your agents or the ticket customer
          required:
            - id
            - name
            - email
            - type
          description: Who triggered the event
        assignedTo:
          type:
            - object
            - 'null'
          properties:
            id:
              type:
                - string
                - 'null'
            name:
              type:
                - string
                - 'null'
            email:
              type:
                - string
                - 'null'
            type:
              type:
                - string
                - 'null'
              enum:
                - agent
                - customer
                - null
              description: Whether the actor is one of your agents or the ticket customer
          required:
            - id
            - name
            - email
            - type
          description: New assignee (assign only)
        assignedFrom:
          type:
            - object
            - 'null'
          properties:
            id:
              type:
                - string
                - 'null'
            name:
              type:
                - string
                - 'null'
            email:
              type:
                - string
                - 'null'
            type:
              type:
                - string
                - 'null'
              enum:
                - agent
                - customer
                - null
              description: Whether the actor is one of your agents or the ticket customer
          required:
            - id
            - name
            - email
            - type
          description: Previous assignee (assign only)
      required:
        - eventType
      description: Present only on `event` messages
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.