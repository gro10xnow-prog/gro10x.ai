> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Update file source

> Replace a file source's content, rename it, or both. At least one of `name` or `file` must be provided.

**Base URL:** `https://files.chatbase.co/api/v2` — this endpoint uses a different host from all other Sources endpoints.



## OpenAPI

````yaml /api-v2-openapi.json put /api/v2/agents/{agentId}/sources/{sourceId}
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
  /api/v2/agents/{agentId}/sources/{sourceId}:
    put:
      tags:
        - Sources
      summary: Update file source
      description: >-
        Replace a file source's content, rename it, or both. At least one of
        `name` or `file` must be provided.


        **Base URL:** `https://files.chatbase.co/api/v2` — this endpoint uses a
        different host from all other Sources endpoints.
      operationId: updateFileSource
      parameters:
        - schema:
            type: string
            minLength: 1
            example: 5QHA6VB-DIAbBhxwqxfdi
          required: true
          name: agentId
          in: path
          description: The agent ID
        - schema:
            type: string
            minLength: 1
            example: a63a69a5-e7a9-4757-b73b-2041854d435d
          required: true
          name: sourceId
          in: path
          description: The source ID
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
                  description: >-
                    New display name. If omitted, the existing name is
                    preserved.
                  example: Employee Handbook v2
                file:
                  type: string
                  format: binary
                  description: >-
                    Replacement file. Same constraints as create. If omitted,
                    existing content is preserved.
      responses:
        '200':
          description: >-
            Updated file source. If the file was replaced and previously
            `trained`, status becomes `updated`.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SourceListItem'
              example:
                id: a63a69a5-e7a9-4757-b73b-2041854d435d
                type: file
                name: Employee Handbook v2
                size: 261120
                createdAt: '2025-01-15T10:30:00.000Z'
                status: updated
                metadata: null
        '400':
          description: >-
            No fields provided, unsupported file type, or a file outside the
            allowed size range.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: VALIDATION_INVALID_BODY
                  message: >-
                    No fields provided, unsupported file type, or a file outside
                    the allowed size range.
        '401':
          description: No Authorization header present.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: AUTH_MISSING_API_KEY
                  message: No Authorization header present.
        '403':
          description: Standard plan or higher required.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: SUBSCRIPTION_API_RESTRICTED_PLAN
                  message: Standard plan or higher required.
        '404':
          description: Agent or source not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: SOURCE_NOT_FOUND
                  message: Agent or source not found.
        '409':
          description: Source is pending deletion. Restore it before editing.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: SOURCE_PENDING_DELETION
                  message: Source is pending deletion. Restore it before editing.
        '422':
          description: Adding this file would exceed the plan storage limit for this agent.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: SOURCE_SIZE_LIMIT_EXCEEDED
                  message: >-
                    Adding this file would exceed the plan storage limit for
                    this agent.
        '429':
          description: Rate limit exceeded.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: RATE_LIMIT_TOO_MANY_REQUESTS
                  message: Rate limit exceeded.
        '500':
          description: Unhandled server error.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: INTERNAL_SERVER_ERROR
                  message: Unhandled server error.
      security:
        - bearerAuth: []
      servers:
        - url: https://files.chatbase.co
          description: Chatbase file upload server
components:
  schemas:
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