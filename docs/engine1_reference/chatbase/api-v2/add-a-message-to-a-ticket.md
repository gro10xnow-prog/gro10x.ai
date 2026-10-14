> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Add a message to a ticket

> Posts an agent reply to a ticket on behalf of a team member. Delivery to the customer is asynchronous; a 201 confirms the reply was recorded, not delivered. Posting a reply may transition the ticket status, matching dashboard behavior.



## OpenAPI

````yaml /api-v2-openapi.json post /agents/{agentId}/helpdesk/tickets/{ticketNumber}/messages
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
    post:
      tags:
        - Helpdesk
      summary: Add a message to a ticket
      description: >-
        Posts an agent reply to a ticket on behalf of a team member. Delivery to
        the customer is asynchronous; a 201 confirms the reply was recorded, not
        delivered. Posting a reply may transition the ticket status, matching
        dashboard behavior.
      operationId: createTicketMessage
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
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTicketMessageBody'
      responses:
        '201':
          description: The created message
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreatedTicketMessage'
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
            No ticket matches the provided ticket number for this agent. Verify
            the ticket number in the request path.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: TICKET_NOT_FOUND
                  message: The requested ticket could not be found
        '409':
          description: >-
            This ticket is linked to a live conversation that has not been taken
            over from the AI agent, so a human reply cannot be posted. Take over
            the conversation from the dashboard first.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: CONVERSATION_NOT_TAKEN_OVER
                  message: The linked conversation is not taken over
        '422':
          description: >-
            The authorId or authorEmail does not resolve to a member of your
            account. Authors must be existing team members. Also returned with
            code `MESSAGE_CONTENT_NOT_RENDERABLE` when the message body renders
            to empty HTML.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: TEAM_MEMBER_NOT_FOUND
                  message: No team member matches the provided author
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
    CreateTicketMessageBody:
      type: object
      properties:
        type:
          type: string
          enum:
            - reply
          description: >-
            Message type. Only `reply` (customer-visible, delivered to the
            customer) is supported.
          example: reply
        content:
          type: string
          minLength: 1
          maxLength: 10000
          description: >-
            Message body as GitHub-flavored Markdown. Plain text is valid
            markdown; single newlines are kept as line breaks. Raw inline HTML
            is stripped. Limited to 10,000 characters after trimming.
          example: Thanks for reaching out. This is **fixed** now.
        authorId:
          type: string
          format: uuid
          description: >-
            Platform user id of the team member the reply is attributed to.
            Provide exactly one of authorId / authorEmail.
        authorEmail:
          type: string
          format: email
          description: >-
            Email of the team member the reply is attributed to
            (case-insensitive). Provide exactly one of authorId / authorEmail.
          example: sam@example.com
      required:
        - type
        - content
    CreatedTicketMessage:
      type: object
      properties:
        id:
          type: string
          description: Message id
        type:
          type: string
          enum:
            - reply
          description: Message type
          example: reply
        sender:
          allOf:
            - $ref: '#/components/schemas/MessageSender'
            - description: The team member the reply is attributed to
        content:
          type: string
          description: Rendered, sanitized HTML body
        contentText:
          type: string
          description: The raw markdown body as submitted
        createdAt:
          type: string
          description: ISO 8601 creation timestamp
          example: '2026-07-29T09:00:00.000Z'
      required:
        - id
        - type
        - sender
        - content
        - contentText
        - createdAt
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
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.