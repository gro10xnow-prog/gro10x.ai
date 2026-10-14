> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Update agent

> Partially updates an agent. Only provided fields are changed.



## OpenAPI

````yaml /api-v2-openapi.json put /agents/{agentId}
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
  /agents/{agentId}:
    put:
      tags:
        - Agents
      summary: Update agent
      description: Partially updates an agent. Only provided fields are changed.
      operationId: updateAgent
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
              $ref: '#/components/schemas/UpdateAgentBody'
      responses:
        '200':
          description: Agent updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'
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
    UpdateAgentBody:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: Agent name
        instructions:
          type: string
          maxLength: 30000
          description: System prompt (max 30,000 characters)
        channelInstructions:
          type:
            - object
            - 'null'
          properties:
            chat_widget:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            help_page:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            center_stage:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            side_panel:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            slack:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            whatsapp:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            messenger:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            instagram:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            salesforce:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            zendesk:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            zendesk_messaging:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            api:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            email:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            android_sdk:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            ios_sdk:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            phone:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
            search:
              anyOf:
                - type: string
                  maxLength: 30000
                - type: object
                  properties:
                    chat:
                      type: string
                      maxLength: 30000
                    voice:
                      type: string
                      maxLength: 30000
          description: Per-channel instruction overrides (max 30,000 characters each)
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
          description: AI model
          example: gpt-5.6-terra
        temp:
          type: number
          minimum: 0
          maximum: 1
          description: Temperature (0–1)
        visibility:
          type: string
          enum:
            - public
            - private
          description: Visibility
        allowedDomains:
          type:
            - array
            - 'null'
          items:
            type: string
          description: Allowed embed domains
        suggestedMessages:
          type:
            - array
            - 'null'
          items:
            anyOf:
              - type: object
                properties:
                  text:
                    type: string
                    minLength: 1
                  type:
                    type: string
                    enum:
                      - single
                  order:
                    type: number
                  icon:
                    type:
                      - string
                      - 'null'
                required:
                  - text
                  - type
                  - order
              - type: object
                properties:
                  name:
                    type: string
                    minLength: 1
                  type:
                    type: string
                    enum:
                      - nested
                  order:
                    type: number
                  icon:
                    type:
                      - string
                      - 'null'
                  items:
                    type: array
                    items:
                      type: object
                      properties:
                        text:
                          type: string
                          minLength: 1
                        order:
                          type: number
                        icon:
                          type:
                            - string
                            - 'null'
                      required:
                        - text
                        - order
                    minItems: 1
                    maxItems: 20
                required:
                  - name
                  - type
                  - order
                  - items
          description: Suggested messages
        initialMessages:
          type: array
          items:
            type: string
          description: Initial messages
        creditLimit:
          type:
            - integer
            - 'null'
          description: Per-agent credit limit (null = no limit)
        notificationsSettings:
          type:
            - object
            - 'null'
          properties:
            dailyLeadsCollected:
              type: object
              properties:
                active:
                  type: boolean
                  description: Whether this notification type is enabled
                emails:
                  type: array
                  items:
                    type: string
                    pattern: ^\w+([+.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$
                    example: alerts@company.com
                  maxItems: 10
                  description: Recipient email addresses (max 10)
              required:
                - active
                - emails
              description: Daily summary of new leads collected by this agent
            dailyConversations:
              type: object
              properties:
                active:
                  type: boolean
                  description: Whether this notification type is enabled
                emails:
                  type: array
                  items:
                    type: string
                    pattern: ^\w+([+.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$
                    example: alerts@company.com
                  maxItems: 10
                  description: Recipient email addresses (max 10)
              required:
                - active
                - emails
              description: Daily summary of conversation volume for this agent
          description: Email notification settings (null = disable all notifications)
        ipRateLimits:
          type:
            - object
            - 'null'
          properties:
            limit:
              type: integer
              minimum: 1
              maximum: 200
              description: Maximum messages per timeframe (1–200)
              example: 20
            timeframe:
              type: integer
              minimum: 1
              maximum: 3600
              description: Timeframe in seconds for the rate limit (1–3600)
              example: 240
            message:
              type: string
              description: Message shown when rate limit is exceeded
              example: Too many messages in a row
          description: >-
            IP-based rate limit settings (partial update; null = reset to
            defaults)
        spamSettings:
          type:
            - object
            - 'null'
          properties:
            enabled:
              type: boolean
              description: Whether spam detection is enabled
            prompt:
              type: string
              maxLength: 2000
              description: >-
                Custom prompt describing what counts as spam for this agent (max
                2000 chars)
          required:
            - enabled
            - prompt
          description: Spam detection settings (null = disable spam detection)
        voiceSettings:
          type:
            - object
            - 'null'
          properties:
            voice:
              type: object
              properties:
                voiceName:
                  type: string
                  enum:
                    - Sarah
                    - Laura
                    - Alice
                    - Matilda
                    - Jessica
                    - Lily
                    - Bella
                    - Roger
                    - George
                    - Charlie
                    - Adam
                    - Daniel
                    - Brian
                    - Eric
                    - Chris
                    - Liam
                    - Harry
                    - Will
                    - Bill
                    - Callum
                    - Masry
                    - Hanafi
                    - Alberto Rodríguez
                    - Jhenny
                    - Anna
                    - Peter
                    - Marc Aurèle
                    - Marie Line
                    - Yasmin Alves
                    - Lax
                    - Skylar
                    - Corey
                    - Jacqueline
                    - Blake
                    - Pedro
                    - Marta
                    - Alloy
                    - Ash
                    - Ballad
                    - Coral
                    - Echo
                    - Fable
                    - Nova
                    - Onyx
                    - Sage
                    - Shimmer
                    - Nouran
                    - Nermin
                    - Othman
                    - Layla
                    - Nada
                    - Mariam
                    - Samir
                    - Eman
                    - Haneen
                    - Fahd
                    - Jasem
                    - Marwa
                    - Razan
                    - Yehya
                    - Hamdan
                    - Zephyr
                    - Puck
                    - Charon
                    - Kore
                    - Fenrir
                    - Leda
                    - Orus
                    - Aoede
                    - Enceladus
                    - Sulafat
                    - Mina
                    - Nina
                    - Ruby
                    - Mason
                    - Rohan
                  example: Corey
                  description: Name of the voice for this agent.
                speed:
                  type: number
                  minimum: 0.7
                  maximum: 1.2
                  description: >-
                    Speech rate multiplier (0.7–1.2). Only supported on select
                    voices; ignored for others.
                  example: 1
                stability:
                  type: number
                  minimum: 0
                  maximum: 1
                  description: >-
                    Voice consistency (0–1). Higher values produce more
                    consistent delivery. Only supported on select voices;
                    ignored for others.
                  example: 0.5
                similarity:
                  type: number
                  minimum: 0
                  maximum: 1
                  description: >-
                    How closely the output matches the reference voice sample
                    (0–1). Only supported on select voices; ignored for others.
                  example: 0.75
                instructions:
                  type: string
                  maxLength: 500
                  description: >-
                    Natural-language delivery instructions for the voice (max
                    500 chars). Only supported on select voices; ignored for
                    others.
                  example: Speak slowly and clearly.
              required:
                - voiceName
              description: Text-to-speech voice configuration
            transcriber:
              type: object
              properties:
                model:
                  type: string
                  enum:
                    - elevenlabs/scribe_v2_realtime
                    - cartesia/ink-2
                    - cartesia/ink-whisper
                    - deepgram/nova-3
                    - deepgram/nova-2
                    - deepgram/flux-general-multi
                    - soniox/stt-rt-v5
                    - soniox/stt-rt-v4
                    - hamsa/hamsa-ar
                  example: soniox/stt-rt-v5
                  description: Speech-to-text model to use for this agent.
                language:
                  type: string
                  description: >-
                    BCP-47 language code for speech recognition (e.g. "en",
                    "fr", "ar"). Use "multi" for automatic detection. Valid
                    codes depend on the selected model.
                  example: multi
                minSilenceDuration:
                  type: number
                  minimum: 0.1
                  maximum: 3
                  description: >-
                    Seconds of continuous silence that signals the user has
                    finished speaking (0.1–3.0). Lower values make the agent
                    respond faster but may cut off slow speakers.
                  example: 0.75
                activationThreshold:
                  type: number
                  minimum: 0
                  maximum: 1
                  description: >-
                    Voice activity detection sensitivity (0–1). Lower values
                    detect quieter speech but may pick up background noise.
                    Higher values require clearer speech to activate.
                  example: 0.5
              required:
                - model
                - language
                - minSilenceDuration
                - activationThreshold
              description: Speech-to-text (voice input) configuration
            recordings:
              type: object
              properties:
                enabled:
                  type: boolean
                  description: Whether voice calls are recorded and stored
                retentionDays:
                  type: integer
                  minimum: 0
                  description: >-
                    How many days recordings are kept before automatic deletion.
                    0 disables storage even when enabled is true.
                  example: 30
              required:
                - enabled
                - retentionDays
              description: Call recording and retention settings
            maxConcurrentSessions:
              type:
                - integer
                - 'null'
              exclusiveMinimum: 0
              description: >-
                Maximum simultaneous active voice calls for this agent. null =
                no limit.
              example: 5
            maxCallDurationSeconds:
              type:
                - integer
                - 'null'
              exclusiveMinimum: 0
              description: >-
                Maximum length of a single call in seconds. The call ends
                automatically when reached. null = no limit.
              example: 900
            maxDailyCallsPerUser:
              type:
                - integer
                - 'null'
              exclusiveMinimum: 0
              description: >-
                Maximum voice calls a single user can start per calendar day.
                null = no limit.
              example: 10
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
              description: >-
                AI model used to generate responses during a voice call. Can be
                set independently from the chat model — faster, cheaper models
                are common here.
              example: gpt-6-luna
            temperature:
              type: number
              minimum: 0
              maximum: 1
              description: >-
                Randomness of voice responses (0–1). 0 = deterministic and
                focused, 1 = more varied and creative.
              example: 0
            allowInterruptions:
              type: boolean
              description: >-
                When true the user can speak while the agent is talking and the
                agent will stop and listen. When false the agent finishes its
                turn before processing new speech.
            allowTextInput:
              type: boolean
              description: >-
                When true users can also type messages during a voice session
                instead of only speaking.
            endConversationAfterSilenceSeconds:
              type:
                - integer
                - 'null'
              minimum: 10
              description: >-
                Seconds of inactivity before the session ends automatically.
                Minimum 10 seconds. null = session never auto-ends.
              example: 300
            initialMessage:
              type: string
              maxLength: 500
              description: >-
                Message the agent speaks immediately when a voice session
                starts, before the user says anything. Leave empty to wait for
                the user to speak first (max 500 chars).
            errorMessage:
              type: string
              maxLength: 500
              description: >-
                Fallback message spoken to the user when the agent encounters an
                unrecoverable error during a call (max 500 chars).
          description: Voice mode configuration (null = disable voice mode)
        blockedCountries:
          type:
            - array
            - 'null'
          items:
            type: string
            minLength: 2
            maxLength: 2
          maxItems: 300
          description: >-
            ISO 3166-1 alpha-2 country codes to block (null = remove all
            blocking)
          example:
            - RU
            - KP
    SuccessResponse:
      type: object
      properties:
        success:
          type: boolean
          enum:
            - true
      required:
        - success
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