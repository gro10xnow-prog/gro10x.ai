> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Restore source (deprecated)

> **Deprecated.** A delete takes effect immediately — the knowledge is purged right away, so there is no pending state to restore from. The call does nothing and always succeeds. Re-create the source instead.



## OpenAPI

````yaml /api-v2-openapi.json post /agents/{agentId}/sources/{sourceId}/restore
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
  /agents/{agentId}/sources/{sourceId}/restore:
    post:
      tags:
        - Sources
      summary: Restore source (deprecated)
      description: >-
        **Deprecated.** A delete takes effect immediately — the knowledge is
        purged right away, so there is no pending state to restore from. The
        call does nothing and always succeeds. Re-create the source instead.
      operationId: restoreSource
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
            description: The source ID
            example: a63a69a5-e7a9-4757-b73b-2041854d435d
          required: true
          description: The source ID
          name: sourceId
          in: path
      responses:
        '200':
          description: Nothing to do — deletes are final
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DeprecatedEndpointResponse'
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
      deprecated: true
      security:
        - bearerAuth: []
components:
  schemas:
    DeprecatedEndpointResponse:
      type: object
      properties:
        success:
          type: boolean
          enum:
            - true
        deprecated:
          type: boolean
          enum:
            - true
        message:
          type: string
          example: >-
            Deprecated: this endpoint does nothing. Sources train as soon as
            they are created, updated or deleted, so changes take effect
            immediately. Poll GET /agents/{agentId}/sources/{sourceId} for a
            source status.
      required:
        - success
        - deprecated
        - message
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