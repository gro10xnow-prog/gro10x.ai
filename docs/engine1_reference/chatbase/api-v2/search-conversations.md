> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Search conversations

> Search an agent's conversations by text, filters, or both. With `query`, results are ranked and carry a highlighted snippet; without it, most recently active first. Filters combine with AND; comma-separated values within a filter with OR. Covers conversations created since the 1st of the month 12 months ago (UTC), activity-date filters included. Results lag new messages by a few seconds. A page can hold fewer than `limit` items, even none, while `hasMore` is true; keep paging. Read messages via export with `conversationId`.



## OpenAPI

````yaml /api-v2-openapi.json get /agents/{agentId}/conversations/search
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
  /agents/{agentId}/conversations/search:
    get:
      tags:
        - Conversations
      summary: Search conversations
      description: >-
        Search an agent's conversations by text, filters, or both. With `query`,
        results are ranked and carry a highlighted snippet; without it, most
        recently active first. Filters combine with AND; comma-separated values
        within a filter with OR. Covers conversations created since the 1st of
        the month 12 months ago (UTC), activity-date filters included. Results
        lag new messages by a few seconds. A page can hold fewer than `limit`
        items, even none, while `hasMore` is true; keep paging. Read messages
        via export with `conversationId`.
      operationId: searchConversations
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
            description: >-
              Created at or after this point (`YYYY-MM-DD` or ISO 8601). Must be
              inside the searchable window.
          required: false
          description: >-
            Created at or after this point (`YYYY-MM-DD` or ISO 8601). Must be
            inside the searchable window.
          name: startDate
          in: query
        - schema:
            type: string
            description: >-
              Created at or before this point (`YYYY-MM-DD`, inclusive, or ISO
              8601).
          required: false
          description: >-
            Created at or before this point (`YYYY-MM-DD`, inclusive, or ISO
            8601).
          name: endDate
          in: query
        - schema:
            type: string
            maxLength: 512
            description: Free-text search over messages and titles.
            example: refund
          required: false
          description: Free-text search over messages and titles.
          name: query
          in: query
        - schema:
            type: string
            description: Comma-separated sources, e.g. `API,WhatsApp`.
            example: Widget or Iframe
          required: false
          description: Comma-separated sources, e.g. `API,WhatsApp`.
          name: source
          in: query
        - schema:
            type: string
            description: >-
              Comma-separated: `positive`, `neutral`, `negative`, or
              `unspecified` for none.
            example: negative
          required: false
          description: >-
            Comma-separated: `positive`, `neutral`, `negative`, or `unspecified`
            for none.
          name: sentiment
          in: query
        - schema:
            type: string
            description: Comma-separated topic names, or `unspecified` for none.
            example: billing
          required: false
          description: Comma-separated topic names, or `unspecified` for none.
          name: topic
          in: query
        - schema:
            type: string
            description: Comma-separated user IDs.
          required: false
          description: Comma-separated user IDs.
          name: userId
          in: query
        - schema:
            type: string
            description: 'Comma-separated: `ongoing`, `ended`, `taken_over`, `paused`.'
            example: taken_over
          required: false
          description: 'Comma-separated: `ongoing`, `ended`, `taken_over`, `paused`.'
          name: activityState
          in: query
        - schema:
            type: string
            description: 'Comma-separated message ratings: `positive`, `negative`.'
            example: negative
          required: false
          description: 'Comma-separated message ratings: `positive`, `negative`.'
          name: feedback
          in: query
        - schema:
            type: string
            enum:
              - 'true'
            description: >-
              `true`: only conversations escalated to a human (ticket or
              live-chat handoff).
            example: 'true'
          required: false
          description: >-
            `true`: only conversations escalated to a human (ticket or live-chat
            handoff).
          name: escalated
          in: query
        - schema:
            type: string
            description: Comma-separated action types that ran, e.g. `collect-leads`.
          required: false
          description: Comma-separated action types that ran, e.g. `collect-leads`.
          name: actionType
          in: query
        - schema:
            type: string
            description: Comma-separated tool names that were called.
          required: false
          description: Comma-separated tool names that were called.
          name: tool
          in: query
        - schema:
            type: string
            description: >-
              Comma-separated tool result statuses, e.g. `error`. Scoped to
              `tool` when set.
            example: error
          required: false
          description: >-
            Comma-separated tool result statuses, e.g. `error`. Scoped to `tool`
            when set.
          name: toolOutcome
          in: query
        - schema:
            type: string
            description: Comma-separated procedure names that ran.
          required: false
          description: Comma-separated procedure names that ran.
          name: procedure
          in: query
        - schema:
            type: string
            description: >-
              Comma-separated procedure run statuses. Scoped to `procedure` when
              set.
            example: completed
          required: false
          description: >-
            Comma-separated procedure run statuses. Scoped to `procedure` when
            set.
          name: procedureOutcome
          in: query
        - schema:
            type: string
            enum:
              - 'true'
              - 'false'
            description: Whether a voice session took place.
          required: false
          description: Whether a voice session took place.
          name: hasVoice
          in: query
        - schema:
            type: string
            description: Last active at or after this point (`YYYY-MM-DD` or ISO 8601).
          required: false
          description: Last active at or after this point (`YYYY-MM-DD` or ISO 8601).
          name: updatedAfter
          in: query
        - schema:
            type: string
            description: >-
              Last active at or before this point (`YYYY-MM-DD`, inclusive, or
              ISO 8601).
          required: false
          description: >-
            Last active at or before this point (`YYYY-MM-DD`, inclusive, or ISO
            8601).
          name: updatedBefore
          in: query
        - schema:
            type: string
            maxLength: 2048
            description: >-
              `pagination.cursor` from the previous page. Keep the other
              parameters unchanged.
          required: false
          description: >-
            `pagination.cursor` from the previous page. Keep the other
            parameters unchanged.
          name: cursor
          in: query
        - schema:
            type: integer
            minimum: 1
            maximum: 25
            default: 25
            description: Items per page (1 to 25, default 25)
            example: 25
          required: false
          description: Items per page (1 to 25, default 25)
          name: limit
          in: query
      responses:
        '200':
          description: Matching conversations
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SearchConversationsResponse'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                VALIDATION_INVALID_BODY:
                  summary: >-
                    The request body failed schema validation. Inspect the
                    `details` object in the error response for field-level
                    errors.
                  value:
                    error:
                      code: VALIDATION_INVALID_BODY
                      message: Invalid request
                VALIDATION_INVALID_DATE_RANGE:
                  summary: >-
                    The requested `createdAt` window is inverted. An inverted
                    window can never match a row, so it is rejected rather than
                    silently returning an empty page.
                  value:
                    error:
                      code: VALIDATION_INVALID_DATE_RANGE
                      message: startDate must not be after endDate
                VALIDATION_INVALID_CURSOR:
                  summary: >-
                    The `cursor` could not be decoded. Pass the exact
                    `pagination.cursor` value from a previous response, without
                    modification.
                  value:
                    error:
                      code: VALIDATION_INVALID_CURSOR
                      message: Invalid pagination cursor
                VALIDATION_CURSOR_QUERY_MISMATCH:
                  summary: >-
                    The cursor was issued for a different `query` or filter set.
                    Keep every search parameter except `cursor` and `limit`
                    constant across a cursor walk, or drop the cursor to restart
                    from the first page.
                  value:
                    error:
                      code: VALIDATION_CURSOR_QUERY_MISMATCH
                      message: Cursor does not match the requested search
                VALIDATION_SEARCH_WINDOW_EXCEEDED:
                  summary: >-
                    Conversation search covers conversations created since the
                    first day of the month twelve months ago (UTC). `startDate`,
                    `endDate` and `updatedBefore` must fall inside that window;
                    use the export endpoint for older conversations.
                  value:
                    error:
                      code: VALIDATION_SEARCH_WINDOW_EXCEEDED
                      message: The requested dates are before the searchable window
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
          description: Forbidden
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                CONVERSATION_SEARCH_UNAVAILABLE:
                  summary: >-
                    HIPAA-enabled accounts and agents configured to redact
                    conversation data cannot run a free-text `query`. Filters
                    alone are still allowed.
                  value:
                    error:
                      code: CONVERSATION_SEARCH_UNAVAILABLE
                      message: Conversation search is not available for this agent
                AUTH_INSUFFICIENT_PERMISSIONS:
                  summary: >-
                    The API key does not have the required permissions for this
                    operation. Ensure the key's account has the appropriate plan
                    and role.
                  value:
                    error:
                      code: AUTH_INSUFFICIENT_PERMISSIONS
                      message: You don't have permission to perform this action
                SUBSCRIPTION_API_RESTRICTED_PLAN:
                  summary: >-
                    Your current plan does not include API access. Upgrade to
                    the Standard plan or higher to use the API.
                  value:
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
          description: Service unavailable
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                SERVICE_UNDER_MAINTENANCE:
                  summary: >-
                    Chatbase is undergoing scheduled maintenance and the API is
                    temporarily rejecting requests. This is transient; retry
                    after a short delay. Requests are rejected before any data
                    is read or written, so no partial changes are applied.
                  value:
                    error:
                      code: SERVICE_UNDER_MAINTENANCE
                      message: >-
                        The API is temporarily unavailable for scheduled
                        maintenance, please try again later
                CONVERSATION_SEARCH_BUSY:
                  summary: >-
                    The search index timed out or is overloaded. This is
                    transient; retry after a short delay.
                  value:
                    error:
                      code: CONVERSATION_SEARCH_BUSY
                      message: >-
                        Conversation search is temporarily unavailable, please
                        retry
      security:
        - bearerAuth: []
components:
  schemas:
    SearchConversationsResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/ConversationSearchResult'
        pagination:
          $ref: '#/components/schemas/ConversationSearchPaginationMeta'
      required:
        - data
        - pagination
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
    ConversationSearchResult:
      type: object
      properties:
        id:
          type: string
          description: Conversation ID
        title:
          type:
            - string
            - 'null'
          description: Conversation title
        createdAt:
          type: number
          description: Unix epoch timestamp (seconds)
        updatedAt:
          type: number
          description: Unix epoch timestamp (seconds) of last activity
        userId:
          type:
            - string
            - 'null'
          description: User ID if the conversation is authenticated
        source:
          type:
            - string
            - 'null'
          enum:
            - API
            - WhatsApp
            - Messenger
            - Instagram
            - Slack
            - Salesforce
            - Zendesk
            - Zendesk Messaging
            - Chatbase site
            - Playground
            - Action preview
            - Qna preview
            - Widget or Iframe
            - Center stage
            - Search
            - Iframe
            - Email
            - Agent page
            - Phone
            - Android SDK
            - iOS SDK
            - Unspecified
            - null
          description: Conversation source
        embedOrigin:
          type:
            - string
            - 'null'
          description: >-
            URL of the page the chat widget was embedded on when the
            conversation started, without its query string, e.g.
            `https://www.example.com/pricing`. Only the origin is included when
            the browser did not send the page path. Null when unknown or for
            non-widget conversations.
          example: https://www.example.com/pricing
        status:
          type: string
          enum:
            - ongoing
            - ended
            - taken_over
            - paused
          description: Conversation activity status
        parentConversationId:
          type:
            - string
            - 'null'
          description: ID of the parent conversation this was continued from, if any
        parentSummary:
          type:
            - string
            - 'null'
          description: AI-generated summary of the parent conversation, if any
        snippet:
          anyOf:
            - $ref: '#/components/schemas/ConversationSearchSnippet'
            - type: 'null'
          description: >-
            Best matching excerpt. Null when no `query` was given or the match
            was only in the title.
      required:
        - id
        - title
        - createdAt
        - updatedAt
        - userId
        - source
        - embedOrigin
        - status
        - snippet
    ConversationSearchPaginationMeta:
      type: object
      properties:
        cursor:
          type:
            - string
            - 'null'
          description: Cursor for the next page, or null if no more pages
        hasMore:
          type: boolean
          description: Whether more results are available
      required:
        - cursor
        - hasMore
    ConversationSearchSnippet:
      type: object
      properties:
        speaker:
          type: string
          enum:
            - user
            - assistant
          description: Who wrote the matching message
        highlights:
          type: array
          items:
            type: object
            properties:
              value:
                type: string
              isHit:
                type: boolean
                description: Whether this segment matched the query
            required:
              - value
              - isHit
          description: >-
            The matching excerpt split into segments. Concatenate `value`s for
            the plain excerpt; segments with `isHit: true` matched the query.
      required:
        - speaker
        - highlights
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.