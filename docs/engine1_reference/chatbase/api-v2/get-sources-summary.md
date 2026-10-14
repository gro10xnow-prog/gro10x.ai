> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get sources summary

> Returns aggregated counts and sizes for each source type, plus a flag if the chatbot knowledge base requires a retrain to reflect any changes



## OpenAPI

````yaml /api-v2-openapi.json get /agents/{agentId}/sources/summary
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
  /agents/{agentId}/sources/summary:
    get:
      tags:
        - Sources
      summary: Get sources summary
      description: >-
        Returns aggregated counts and sizes for each source type, plus a flag if
        the chatbot knowledge base requires a retrain to reflect any changes
      operationId: getSourcesSummary
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
          description: Sources summary by type
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SourcesSummaryResponse'
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
    SourcesSummaryResponse:
      type: object
      properties:
        links:
          $ref: '#/components/schemas/SourceTypeCount'
        files:
          allOf:
            - $ref: '#/components/schemas/SourceTypeCount'
            - description: Aggregated stats for file sources
        qnas:
          allOf:
            - $ref: '#/components/schemas/SourceTypeCount'
            - description: Aggregated stats for Q&A sources
        notionPages:
          allOf:
            - $ref: '#/components/schemas/SourceTypeCount'
            - description: Aggregated stats for Notion sources
        texts:
          allOf:
            - $ref: '#/components/schemas/SourceTypeCount'
            - description: Aggregated stats for text sources
        zendeskTickets:
          allOf:
            - $ref: '#/components/schemas/SourceTypeCount'
            - description: >-
                Aggregated stats for Zendesk ticket sources. count = total
                number of ticket IDs tracked
        salesforceCases:
          allOf:
            - $ref: '#/components/schemas/SourceTypeCount'
            - description: >-
                Aggregated stats for Salesforce case sources. count = total
                number of case IDs tracked
        shouldRetrain:
          type: boolean
          description: >-
            True when the agent knowledge base requires a retrain to reflect any
            changes
      required:
        - links
        - files
        - qnas
        - notionPages
        - texts
        - zendeskTickets
        - salesforceCases
        - shouldRetrain
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
    SourceTypeCount:
      type: object
      properties:
        count:
          type: number
          description: Number of sources
        size:
          type: number
          description: Total size in bytes
      required:
        - count
        - size
      description: Aggregated stats for link sources
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.