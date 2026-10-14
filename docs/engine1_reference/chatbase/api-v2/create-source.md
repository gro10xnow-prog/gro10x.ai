> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Create source

> Creates a new source. Accepts text, qna, and link source types. File sources require a dedicated endpoint. Ticket and Notion sources are not accepted. The source starts training immediately — no separate training call is needed. It is returned as `untrained` and flips to `trained` when it is live, or `failed` if training did not land; poll `GET /agents/{agentId}/sources/{sourceId}` to follow it.

**Q&A request body limit:** The total request body must not exceed 4.5 MB for Q&A sources.



## OpenAPI

````yaml /api-v2-openapi.json post /agents/{agentId}/sources
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
  /agents/{agentId}/sources:
    post:
      tags:
        - Sources
      summary: Create source
      description: >-
        Creates a new source. Accepts text, qna, and link source types. File
        sources require a dedicated endpoint. Ticket and Notion sources are not
        accepted. The source starts training immediately — no separate training
        call is needed. It is returned as `untrained` and flips to `trained`
        when it is live, or `failed` if training did not land; poll `GET
        /agents/{agentId}/sources/{sourceId}` to follow it.


        **Q&A request body limit:** The total request body must not exceed 4.5
        MB for Q&A sources.
      operationId: createSource
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
              $ref: '#/components/schemas/CreateSourceBody'
      responses:
        '201':
          description: Source created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SourceListItem'
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
            A parent link with this URL and link type already exists for this
            agent.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: SOURCE_DUPLICATE
                  message: A source with this URL and type already exists
        '422':
          description: >-
            Adding or updating this source would exceed the storage limit for
            your plan. Remove existing sources or upgrade your plan.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: SOURCE_SIZE_LIMIT_EXCEEDED
                  message: Chatbot storage limit exceeded
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
    CreateSourceBody:
      oneOf:
        - type: object
          properties:
            type:
              type: string
              enum:
                - text
            name:
              type: string
              minLength: 1
              maxLength: 100
            content:
              type: string
              minLength: 1
              maxLength: 1048576
          required:
            - type
            - name
            - content
        - type: object
          properties:
            type:
              type: string
              enum:
                - qna
            name:
              type: string
              minLength: 1
            questions:
              type: array
              items:
                type: string
                minLength: 1
              minItems: 1
              maxItems: 50
            answer:
              type: string
              minLength: 1
          required:
            - type
            - name
            - questions
            - answer
        - type: object
          properties:
            type:
              type: string
              enum:
                - link
            url:
              type: string
              format: uri
            linkType:
              type: string
              enum:
                - individual
                - sitemap
                - crawl
            excludePaths:
              type: array
              items:
                type: string
              default: []
            includeOnlyPaths:
              type: array
              items:
                type: string
              default: []
            slowScraping:
              type: boolean
              default: false
          required:
            - type
            - url
            - linkType
    SourceListItem:
      type: object
      properties:
        id:
          type: string
          description: Source ID
        type:
          type: string
          enum:
            - link
            - file
            - qna
            - notionPage
            - text
          description: Source type
        name:
          type:
            - string
            - 'null'
          description: Source name or URL
        size:
          type: number
          description: Source size in bytes
        createdAt:
          type: string
          description: ISO 8601 creation timestamp
        status:
          type: string
          enum:
            - untrained
            - trained
            - toBeDeleted
            - updated
            - failed
          description: >-
            Training status of the source. `failed` means the last training run
            did not land; an earlier trained version, if any, stays live.
        metadata:
          $ref: '#/components/schemas/LinkMetadata'
      required:
        - id
        - type
        - name
        - size
        - createdAt
        - status
        - metadata
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
    LinkMetadata:
      anyOf:
        - type: object
          properties:
            type:
              type: string
              enum:
                - individual
          required:
            - type
        - type: object
          properties:
            type:
              type: string
              enum:
                - crawl
                - sitemap
            excludePaths:
              type: array
              items:
                type: string
              description: Regex patterns for excluded URL paths
            includeOnlyPaths:
              type: array
              items:
                type: string
              description: Regex patterns for included URL paths
            slowScraping:
              type: boolean
              description: Whether slow scraping mode is enabled
            crawlStatus:
              type: string
              enum:
                - fetching
                - fetched
                - failed
              description: Crawl progress status.
            children:
              $ref: '#/components/schemas/LinkChildren'
          required:
            - type
            - excludePaths
            - includeOnlyPaths
            - slowScraping
            - crawlStatus
            - children
        - type: 'null'
      description: Link-specific metadata. Present only for type="link".
    LinkChildren:
      type: object
      properties:
        included:
          type: number
          description: Non-excluded, non-failed links
        excluded:
          type: number
          description: Explicitly excluded links
        failed:
          type: number
          description: Failed or discarded links
      required:
        - included
        - excluded
        - failed
      description: Child link counts
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.