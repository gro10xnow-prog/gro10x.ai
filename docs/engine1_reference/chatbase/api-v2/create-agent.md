> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Create agent

> Creates a new agent. If `url` is provided, a link source is created from that URL and training is queued automatically.

The agent is always created even if source setup or training fails — `id` is always returned. Check `pendingSteps` in the response to see which steps need to be retried:
- `ADD_SOURCE` — the URL could not be added as a source. Add sources manually via the Sources API.
- `TRAIN_AGENT` — training could not be started. Trigger it manually via `POST /agents/{agentId}/train`.

When `pendingSteps` is absent, all steps succeeded.

Subject to plan agent limits — returns `AGENT_LIMIT_REACHED` (403) when the account has reached its maximum number of agents.



## OpenAPI

````yaml /api-v2-openapi.json post /agents
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
  /agents:
    post:
      tags:
        - Agents
      summary: Create agent
      description: >-
        Creates a new agent. If `url` is provided, a link source is created from
        that URL and training is queued automatically.


        The agent is always created even if source setup or training fails —
        `id` is always returned. Check `pendingSteps` in the response to see
        which steps need to be retried:

        - `ADD_SOURCE` — the URL could not be added as a source. Add sources
        manually via the Sources API.

        - `TRAIN_AGENT` — training could not be started. Trigger it manually via
        `POST /agents/{agentId}/train`.


        When `pendingSteps` is absent, all steps succeeded.


        Subject to plan agent limits — returns `AGENT_LIMIT_REACHED` (403) when
        the account has reached its maximum number of agents.
      operationId: createAgent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateAgentBody'
      responses:
        '201':
          description: Agent created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AgentCreatedResponse'
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
    CreateAgentBody:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: Agent name
          example: Support Bot
        url:
          type: string
          format: uri
          description: >-
            Homepage URL of the product. The agent is pre-configured to answer
            questions about this website.
          example: https://example.com
        instructions:
          type: string
          maxLength: 30000
          description: System prompt / instructions for the agent (max 30,000 characters)
        model:
          type: string
          enum:
            - gpt-4o-mini
            - gpt-oss-120b
            - gpt-oss-20b
            - gpt-5.2
            - gpt-5.5
            - gpt-5.6-terra
            - gpt-6.1-sol
            - gpt-6-luna
            - claude-opus-5-5
            - claude-sonnet-5-5
            - claude-haiku-5-5
            - gemini-2.5-pro
            - gemini-3-flash
            - gemini-3.1-flash-lite
            - gemini-3.1-pro
            - gemini-3.5-flash-lite
            - gemini-3.6-flash
            - gemini-3.8-flash
            - grok-4.7
            - DeepSeek-V3.1
            - DeepSeek-R1
            - DeepSeek-V4-Flash
            - DeepSeek-V4.1-Flash
            - kimi-k2.6
            - mistral-medium-3.5
            - mistral-small-2603
            - glm-5.2
            - glm-5.3-flash
            - auto
          description: AI model to use
          example: gpt-5.6-terra
        temp:
          type: number
          minimum: 0
          maximum: 1
          description: Model temperature (0–1)
          example: 0
        visibility:
          type: string
          enum:
            - public
            - private
          description: 'Agent visibility (default: private)'
      required:
        - name
    AgentCreatedResponse:
      type: object
      properties:
        id:
          type: string
          description: The agent ID
          example: 5QHA6VB-DIAbBhxwqxfdi
        pendingSteps:
          type: array
          items:
            type: string
            enum:
              - ADD_SOURCE
              - TRAIN_AGENT
          description: >-
            Steps that failed after the agent was created, absent when
            everything succeeded. ADD_SOURCE — the provided URL could not be
            added as a source; add sources manually via the Sources API.
            TRAIN_AGENT — training could not be started; trigger it manually via
            POST /agents/{agentId}/train.
      required:
        - id
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