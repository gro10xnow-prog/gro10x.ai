> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Submit a tool result

> Submit the result of a client-side tool call. Use the toolCallId from the tool-call part in the chat response to identify the tool call.



## OpenAPI

````yaml /api-v2-openapi.json post /agents/{agentId}/conversations/{conversationId}/tool-result
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
  /agents/{agentId}/conversations/{conversationId}/tool-result:
    post:
      tags:
        - Agents
      summary: Submit a tool result
      description: >-
        Submit the result of a client-side tool call. Use the toolCallId from
        the tool-call part in the chat response to identify the tool call.
      operationId: submitToolResult
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
              $ref: '#/components/schemas/SubmitToolResultRequest'
      responses:
        '200':
          description: Tool result submitted successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SubmitToolResultResponse'
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
            No pending tool call matches the provided `toolCallId`. It may have
            expired or already been resolved.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: RESOURCE_TOOL_CALL_NOT_FOUND
                  message: Tool call not found or expired
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
    SubmitToolResultRequest:
      type: object
      properties:
        toolCallId:
          type: string
          minLength: 1
          description: The toolCallId from the tool-call part in the chat response
        output:
          description: The result of executing the tool action
      required:
        - toolCallId
      additionalProperties: false
    SubmitToolResultResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            success:
              type: boolean
          required:
            - success
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