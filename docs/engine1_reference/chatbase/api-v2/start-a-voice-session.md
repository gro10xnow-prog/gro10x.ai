> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Start a voice session

> Create a real-time voice session for an agent. Pass the response `data` to the Chatbase Voice SDK (`@chatbase-co/voice-sdk`) in your client: the SDK connects, publishes the microphone, and the agent joins automatically. Requires a plan with voice mode enabled; voice minutes consume message credits. Send `{}` when no options are needed.



## OpenAPI

````yaml /api-v2-openapi.json post /agents/{agentId}/voice/sessions
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
  /agents/{agentId}/voice/sessions:
    post:
      tags:
        - Agents
      summary: Start a voice session
      description: >-
        Create a real-time voice session for an agent. Pass the response `data`
        to the Chatbase Voice SDK (`@chatbase-co/voice-sdk`) in your client: the
        SDK connects, publishes the microphone, and the agent joins
        automatically. Requires a plan with voice mode enabled; voice minutes
        consume message credits. Send `{}` when no options are needed.
      operationId: createVoiceSession
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
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VoiceSessionRequest'
      responses:
        '200':
          description: Voice session created
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/VoiceSessionResponse'
                required:
                  - data
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
    VoiceSessionRequest:
      type: object
      properties:
        conversationId:
          type: string
          format: uuid
          description: >-
            Optional conversation UUID. Reuse a value to group multiple voice
            sessions into one conversation in chat logs. If omitted, a new
            conversation is created. A conversation belongs to the end-user who
            started it: when reusing, send that same userId or omit userId to
            inherit it; a different userId is rejected with
            CONVERSATION_USER_MISMATCH.
        userId:
          type: string
          maxLength: 128
          pattern: ^[a-zA-Z0-9._-]+$
          description: >-
            Your end-user ID. Send a stable ID so per-user voice limits apply;
            if omitted a random one is generated per session (or inherited from
            the conversation when reusing a conversationId). Sessions with the
            same userId but no conversationId are separate conversations owned
            by the same end-user. Must contain only URL-safe characters
            (letters, digits, hyphens, underscores, dots).
        timezone:
          type: string
          maxLength: 64
          default: UTC
          description: >-
            IANA timezone of the end user (e.g. "Europe/Paris"), used by the
            agent for time-aware answers. Defaults to UTC.
    VoiceSessionResponse:
      type: object
      properties:
        participantToken:
          type: string
          description: >-
            Short-lived token scoped to this session. Pass the response `data`
            to the Chatbase Voice SDK in your client; safe to hand to the
            browser or mobile app.
        sessionId:
          type: string
          description: The voice session ID.
        roomName:
          type: string
          description: The session room name, for correlating logs.
        maxDurationSeconds:
          type: integer
          description: >-
            Maximum session duration; the session ends automatically when it
            elapses.
        conversationId:
          type: string
          description: The conversation this session belongs to (echoed or generated).
        userId:
          type: string
          description: The end-user ID for this session (echoed or generated).
      required:
        - participantToken
        - sessionId
        - roomName
        - maxDurationSeconds
        - conversationId
        - userId
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