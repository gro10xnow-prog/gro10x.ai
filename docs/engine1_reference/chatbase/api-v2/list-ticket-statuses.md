> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# List ticket statuses

> Returns the active (non-archived) ticket statuses configured for an agent, ordered by category then position. Each category has exactly one default status.



## OpenAPI

````yaml /api-v2-openapi.json get /agents/{agentId}/helpdesk/ticket-statuses
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
  /agents/{agentId}/helpdesk/ticket-statuses:
    get:
      tags:
        - Helpdesk
      summary: List ticket statuses
      description: >-
        Returns the active (non-archived) ticket statuses configured for an
        agent, ordered by category then position. Each category has exactly one
        default status.
      operationId: listTicketStatuses
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
      responses:
        '200':
          description: List of ticket statuses
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TicketStatusList'
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
    TicketStatusList:
      type: array
      items:
        $ref: '#/components/schemas/TicketStatus'
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
    TicketStatus:
      type: object
      properties:
        id:
          type: string
          description: Status ID
        category:
          type: string
          enum:
            - new
            - on_you
            - on_customer
            - on_hold
            - closed
            - cancelled
          description: Status category. Controls the status color and ordering.
        externalLabel:
          type: string
          description: Customer-facing status label
          example: In progress
        internalLabel:
          type: string
          description: Agent-facing status label shown in the dashboard
          example: In progress
        color:
          type:
            - string
            - 'null'
          description: Hex color associated with this status
          example: '#2563EB'
        isDefault:
          type: boolean
          description: Whether this is the default status for its category
        position:
          type: integer
          description: Ordering position within the status category
      required:
        - id
        - category
        - externalLabel
        - internalLabel
        - color
        - isDefault
        - position
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.