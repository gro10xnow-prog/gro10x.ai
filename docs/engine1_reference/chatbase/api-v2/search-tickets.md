> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Search tickets

> Searches ticket messages with a free-text query and returns matching tickets ranked by relevance. Results are capped and not paginated.



## OpenAPI

````yaml /api-v2-openapi.json post /agents/{agentId}/helpdesk/tickets/search
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
  /agents/{agentId}/helpdesk/tickets/search:
    post:
      tags:
        - Helpdesk
      summary: Search tickets
      description: >-
        Searches ticket messages with a free-text query and returns matching
        tickets ranked by relevance. Results are capped and not paginated.
      operationId: searchTickets
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
              $ref: '#/components/schemas/SearchTicketsBody'
      responses:
        '200':
          description: Ranked search results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SearchTicketsResponse'
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
    SearchTicketsBody:
      type: object
      properties:
        query:
          type: string
          minLength: 1
          maxLength: 512
          description: Free-text search terms, matched against ticket messages.
          example: refund not received
        limit:
          type: integer
          minimum: 1
          maximum: 50
          default: 20
          description: Number of results to return (1 to 50, default 20)
          example: 20
      required:
        - query
    SearchTicketsResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/SearchTicketsItem'
        pagination:
          $ref: '#/components/schemas/SearchTicketsPaginationMeta'
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
    SearchTicketsItem:
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
    SearchTicketsPaginationMeta:
      type: object
      properties:
        cursor:
          type:
            - string
            - 'null'
          description: >-
            Opaque continuation token. Null while search results are not
            paginated.
        hasMore:
          type: boolean
          description: >-
            Whether more matches exist beyond the returned window. Refine the
            query to narrow it.
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
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.