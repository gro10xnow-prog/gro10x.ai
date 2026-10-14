> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Update conversation status

> Update the activity state of a conversation.

- `ongoing` — resumes a paused or ended conversation.
- `paused` — pauses an ongoing conversation (stops AI replies but still records messages).
- `ended` — ends the conversation.

Conversation-based billing accounts cannot resume ended conversations.



## OpenAPI

````yaml /api-v2-openapi.json patch /agents/{agentId}/conversations/{conversationId}
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
    patch:
      tags:
        - Conversations
      summary: Update conversation status
      description: >-
        Update the activity state of a conversation.


        - `ongoing` — resumes a paused or ended conversation.

        - `paused` — pauses an ongoing conversation (stops AI replies but still
        records messages).

        - `ended` — ends the conversation.


        Conversation-based billing accounts cannot resume ended conversations.
      operationId: updateConversation
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
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateConversationRequest'
      responses:
        '200':
          description: Conversation updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UpdateConversationResponse'
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
        '409':
          description: >-
            Another actor (e.g. an operator taking over) changed the
            conversation between read and write. Nothing was updated.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: CONVERSATION_STATE_CHANGED
                  message: >-
                    The conversation changed state during the update, please
                    retry
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
    UpdateConversationRequest:
      type: object
      properties:
        status:
          type: string
          enum:
            - ongoing
            - paused
            - ended
          description: Target activity state for the conversation
      required:
        - status
      additionalProperties: false
    UpdateConversationResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            id:
              type: string
              description: Conversation ID
            status:
              type: string
              enum:
                - ongoing
                - paused
                - ended
              description: Conversation activity status
          required:
            - id
            - status
      required:
        - data
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
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.