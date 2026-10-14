> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Update a ticket

> Partially updates a ticket's status, assignee, team, or priority. Only provided fields are changed. Fields are validated together but written independently, so a 500 can leave a partial update.



## OpenAPI

````yaml /api-v2-openapi.json patch /agents/{agentId}/helpdesk/tickets/{ticketNumber}
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
  /agents/{agentId}/helpdesk/tickets/{ticketNumber}:
    patch:
      tags:
        - Helpdesk
      summary: Update a ticket
      description: >-
        Partially updates a ticket's status, assignee, team, or priority. Only
        provided fields are changed. Fields are validated together but written
        independently, so a 500 can leave a partial update.
      operationId: updateTicket
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
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateTicketBody'
      responses:
        '200':
          description: The updated ticket
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
        '422':
          description: >-
            The requested statusId/assignee/teamId either doesn't belong to this
            agent or account, or (for the assignee) was not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                TICKET_INVALID_STATUS:
                  summary: >-
                    `statusId` does not belong to a status for this agent.
                    Discover valid ids via GET /ticket-statuses.
                  value:
                    error:
                      code: TICKET_INVALID_STATUS
                      message: The requested status could not be applied
                TICKET_TEAM_MEMBER_NOT_FOUND:
                  summary: >-
                    Neither `assigneeId` nor `assigneeEmail` resolved to a team
                    member on this account.
                  value:
                    error:
                      code: TICKET_TEAM_MEMBER_NOT_FOUND
                      message: The requested assignee could not be found
                TICKET_TEAM_NOT_FOUND:
                  summary: >-
                    `teamId` does not belong to a team for this agent. Discover
                    valid ids via GET /teams.
                  value:
                    error:
                      code: TICKET_TEAM_NOT_FOUND
                      message: The requested team could not be found
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
    UpdateTicketBody:
      type: object
      properties:
        statusId:
          type: string
          format: uuid
          description: >-
            ID of an existing status for this agent. Provide at most one of
            statusId / statusCategory. Omit to leave the status unchanged.
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
            at most one of statusId / statusCategory. Omit to leave the status
            unchanged.
          example: on_customer
        assigneeId:
          type:
            - string
            - 'null'
          format: uuid
          description: >-
            Platform user id of the agent to assign. Provide at most one of
            assigneeId / assigneeEmail. Pass null to unassign the ticket. Omit
            to leave the assignee unchanged.
        assigneeEmail:
          type: string
          format: email
          description: >-
            Email of the agent to assign (case-insensitive). Provide at most one
            of assigneeId / assigneeEmail. Does not accept null; unassign via
            assigneeId: null. Omit to leave the assignee unchanged.
          example: sam@example.com
        teamId:
          type:
            - string
            - 'null'
          format: uuid
          description: >-
            ID of an existing team for this agent. Pass null to clear the team.
            Omit to leave the team unchanged.
        priority:
          type: string
          enum:
            - none
            - low
            - normal
            - high
            - urgent
          description: >-
            New ticket priority. Pass `none` to clear it. Omit to leave the
            priority unchanged.
          example: urgent
        agentEmail:
          type: string
          format: email
          description: >-
            Optional. Attribute this change to the agent with this email — a
            member of this account (case-insensitive). If omitted, or the email
            is not a recognized member, the change is recorded as an automatic
            system change. Not itself a change: you must still provide at least
            one field above.
          example: sam@example.com
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