> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# List ticket messages

> Returns a ticket's message thread in chronological order. Supports cursor-based pagination.



## OpenAPI

````yaml /api-v2-openapi.json get /agents/{agentId}/helpdesk/tickets/{ticketNumber}/messages
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
  /agents/{agentId}/helpdesk/tickets/{ticketNumber}/messages:
    get:
      tags:
        - Helpdesk
      summary: List ticket messages
      description: >-
        Returns a ticket's message thread in chronological order. Supports
        cursor-based pagination.
      operationId: listTicketMessages
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
            type: integer
            exclusiveMinimum: 0
            maximum: 2147483647
            description: The ticket number
            example: 123
          required: true
          description: The ticket number
          name: ticketNumber
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
            default: reply,note
            description: >-
              Comma-separated message types. Defaults to `reply,note`; system
              `event` messages are opt-in.
            example: reply,note
          required: false
          description: >-
            Comma-separated message types. Defaults to `reply,note`; system
            `event` messages are opt-in.
          name: types
          in: query
        - schema:
            type: string
            enum:
              - asc
              - desc
            default: asc
            description: >-
              Chronological direction. Defaults to `asc`, so a thread reads
              oldest-first. A cursor is only valid for the direction it was
              issued with.
            example: asc
          required: false
          description: >-
            Chronological direction. Defaults to `asc`, so a thread reads
            oldest-first. A cursor is only valid for the direction it was issued
            with.
          name: order
          in: query
      responses:
        '200':
          description: Paginated list of messages
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ListTicketMessagesResponse'
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
            The agent could not be found (or does not belong to the
            authenticated account), or the ticket number does not exist for it.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                AGENT_NOT_FOUND:
                  summary: >-
                    No agent matches the provided `agentId`, or it does not
                    belong to the authenticated account.
                  value:
                    error:
                      code: AGENT_NOT_FOUND
                      message: Agent not found
                TICKET_NOT_FOUND:
                  summary: >-
                    No ticket matches the provided ticket number for this agent.
                    Verify the ticket number in the request path.
                  value:
                    error:
                      code: TICKET_NOT_FOUND
                      message: The requested ticket could not be found
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