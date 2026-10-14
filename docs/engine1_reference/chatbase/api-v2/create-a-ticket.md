> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a ticket

> Creates a ticket on behalf of a customer. Unless an assignee is provided, the ticket is auto-assigned via the agent's routing rules.



## OpenAPI

````yaml /api-v2-openapi.json post /agents/{agentId}/helpdesk/tickets
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
    post:
      tags:
        - Helpdesk
      summary: Create a ticket
      description: >-
        Creates a ticket on behalf of a customer. Unless an assignee is
        provided, the ticket is auto-assigned via the agent's routing rules.
      operationId: createTicket
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
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTicketBody'
      responses:
        '201':
          description: The created ticket
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Ticket'
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
        '422':
          description: >-
            `statusId` does not belong to a status for this agent. Discover
            valid ids via GET /ticket-statuses.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: TICKET_INVALID_STATUS
                  message: The requested status could not be applied
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
      security:
        - bearerAuth: []
components:
  schemas:
    CreateTicketBody:
      type: object
      properties:
        subject:
          type: string
          minLength: 1
          maxLength: 500
          description: Ticket subject (1-500 characters)
          example: Export failing with 500
        description:
          type: string
          minLength: 1
          maxLength: 10000
          description: >-
            The first message body, written as a reply authored by the customer
            (1-10,000 characters)
          example: Customer cannot export orders.
        customer:
          $ref: '#/components/schemas/CreateTicketCustomer'
        statusId:
          type: string
          format: uuid
          description: >-
            ID of an existing status for this agent. Provide at most one of
            statusId / statusCategory.
        statusCategory:
          type: string
          enum:
            - new
            - on_you
            - on_customer
            - on_hold
            - closed
            - cancelled
          description: >-
            Status category; resolves to that category's default status. Provide
            at most one of statusId / statusCategory. Defaults to the "new"
            category default when neither is provided.
          example: new
        assigneeId:
          type:
            - string
            - 'null'
          format: uuid
          description: >-
            Platform user id of the agent to assign. Provide at most one of
            assigneeId / assigneeEmail. Pass `null` to explicitly create the
            ticket unassigned (suppresses auto-assignment); omit to let
            auto-assignment apply.
        assigneeEmail:
          type: string
          format: email
          description: >-
            Email of the agent to assign (case-insensitive). Provide at most one
            of assigneeId / assigneeEmail.
          example: sam@example.com
        teamId:
          type: string
          format: uuid
          description: >-
            ID of an existing team for this agent. When provided without any
            assignee field, an agent is picked within this team using the team's
            own assignment strategy, and routing rules are skipped. When
            provided together with assigneeId/assigneeEmail, including
            assigneeId: null, no auto-assignment runs and the team is written as
            given.
        priority:
          type: string
          enum:
            - none
            - low
            - normal
            - high
            - urgent
          description: Ticket priority. Defaults to `none` (untriaged) when omitted.
          example: high
      required:
        - subject
        - description
        - customer
    Ticket:
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
        description:
          type:
            - string
            - 'null'
          description: Ticket description
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
        metadata:
          type: object
          additionalProperties: {}
          description: Arbitrary extra fields captured on the ticket
          example:
            phone_number: +1 525-525-5255
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
        - description
        - statusCategory
        - statusId
        - assigneeId
        - customer
        - metadata
        - channel
        - conversationId
        - teamId
        - priority
        - createdAt
        - updatedAt
        - lastMessageAt
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
    CreateTicketCustomer:
      type: object
      properties:
        email:
          type: string
          format: email
          description: >-
            Resolves to an existing chatbot_users row for this agent, or creates
            one
          example: jane@example.com
        name:
          type: string
          maxLength: 255
          description: >-
            Used only when creating a new customer record; ignored if the email
            already resolves
          example: Jane Doe
      required:
        - email
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