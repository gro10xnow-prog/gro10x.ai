> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get agent

> Returns a single agent by ID.



## OpenAPI

````yaml /api-v2-openapi.json get /agents/{agentId}
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
    get:
      tags:
        - Agents
      summary: Get agent
      description: Returns a single agent by ID.
      operationId: getAgent
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
          description: Agent details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Agent'
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
    Agent:
      type: object
      properties:
        id:
          type: string
          description: Agent ID
          example: 5QHA6VB-DIAbBhxwqxfdi
        name:
          type: string
          description: Agent name
          example: Support Bot
        instructions:
          type: string
          description: System prompt / instructions for the agent
        channelInstructions:
          type:
            - object
            - 'null'
          properties:
            chat_widget:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            help_page:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            center_stage:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            side_panel:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            slack:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            whatsapp:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            messenger:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            instagram:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            salesforce:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            zendesk:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            zendesk_messaging:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            api:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            email:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            android_sdk:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            ios_sdk:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            phone:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
            search:
              anyOf:
                - type: string
                - type: object
                  properties:
                    chat:
                      type: string
                    voice:
                      type: string
          description: Per-channel instruction overrides
        model:
          type: string
          enum:
            - gpt-4o
            - gpt-4o-mini
            - o4-mini
            - gpt-oss-120b
            - gpt-oss-20b
            - gpt-5
            - gpt-5.1
            - gpt-5.2
            - gpt-5.4
            - gpt-5.4-mini
            - gpt-5.4-nano
            - gpt-5.5
            - gpt-5.6-terra
            - gpt-5.6-luna
            - gpt-6.1-sol
            - gpt-6-luna
            - gpt-5-mini
            - gpt-5-nano
            - claude-opus-5-5
            - claude-sonnet-5-5
            - claude-haiku-5-5
            - claude-opus-4-8
            - claude-opus-4-7
            - claude-opus-4-6
            - claude-sonnet-4-6
            - claude-opus-4-5
            - claude-haiku-4-5
            - claude-sonnet-4-5
            - gemini-2.5-pro
            - gemini-3-flash
            - gemini-3.1-flash-lite
            - gemini-3.1-pro
            - gemini-3.5-flash-lite
            - gemini-3.6-flash
            - gemini-3.8-flash
            - grok-4.7
            - grok-3
            - grok-3-mini
            - grok-4
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
            AI model used by the agent. Can be a deprecated model for agents
            that were configured before it was retired.
          example: gpt-5.6-terra
        autoRetrain:
          type: boolean
          description: Whether the agent automatically retrains every 7 days
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
          description: Whether the agent is publicly accessible or private
        allowedDomains:
          type:
            - array
            - 'null'
          items:
            type: string
          description: Domains allowed to embed this agent
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
          description: Suggested quick-reply messages shown to users
        initialMessages:
          type: array
          items:
            type: string
          description: Initial messages shown when a conversation starts
        creditLimit:
          type:
            - integer
            - 'null'
          description: Per-agent credit limit (null = no limit)
        creditsUsed:
          type: integer
          description: >-
            Credits consumed by this agent since the start of the current
            calendar month (UTC). Resets to 0 on the 1st of each month.
          example: 1284
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
                emails:
                  type: array
                  items:
                    type: string
                    pattern: ^\w+([+.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$
                  maxItems: 10
              required:
                - active
                - emails
            dailyConversations:
              type: object
              properties:
                active:
                  type: boolean
                emails:
                  type: array
                  items:
                    type: string
                    pattern: ^\w+([+.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$
                  maxItems: 10
              required:
                - active
                - emails
          required:
            - dailyLeadsCollected
            - dailyConversations
          description: Email notification settings including recipient addresses
        ipRateLimits:
          $ref: '#/components/schemas/AgentIpRateLimits'
        spamSettings:
          $ref: '#/components/schemas/AgentSpamSettings'
        blockedCountries:
          type:
            - array
            - 'null'
          items:
            type: string
          description: >-
            ISO 3166-1 alpha-2 country codes blocked from accessing this agent.
            Visitors from these countries will not see the chatbot.
          example:
            - RU
            - KP
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
                speed:
                  type: number
                  minimum: 0.7
                  maximum: 1.2
                stability:
                  type: number
                  minimum: 0
                  maximum: 1
                similarity:
                  type: number
                  minimum: 0
                  maximum: 1
                instructions:
                  type: string
                  maxLength: 500
              required:
                - speed
                - stability
                - similarity
            transcriber:
              type: object
              properties:
                model:
                  type: string
                language:
                  type: string
                minSilenceDuration:
                  type: number
                  minimum: 0.1
                  maximum: 3
                activationThreshold:
                  type: number
                  minimum: 0
                  maximum: 1
              required:
                - model
                - language
                - minSilenceDuration
                - activationThreshold
            recordings:
              type: object
              properties:
                enabled:
                  type: boolean
                retentionDays:
                  type: integer
                  minimum: 0
              required:
                - enabled
                - retentionDays
            maxConcurrentSessions:
              type:
                - integer
                - 'null'
              exclusiveMinimum: 0
            maxCallDurationSeconds:
              type:
                - integer
                - 'null'
              exclusiveMinimum: 0
            maxDailyCallsPerUser:
              type:
                - integer
                - 'null'
              exclusiveMinimum: 0
            model:
              type: string
              enum:
                - gpt-4o
                - gpt-4o-mini
                - o4-mini
                - gpt-oss-120b
                - gpt-oss-20b
                - gpt-5
                - gpt-5.1
                - gpt-5.2
                - gpt-5.4
                - gpt-5.4-mini
                - gpt-5.4-nano
                - gpt-5.5
                - gpt-5.6-terra
                - gpt-5.6-luna
                - gpt-6.1-sol
                - gpt-6-luna
                - gpt-5-mini
                - gpt-5-nano
                - claude-opus-5-5
                - claude-sonnet-5-5
                - claude-haiku-5-5
                - claude-opus-4-8
                - claude-opus-4-7
                - claude-opus-4-6
                - claude-sonnet-4-6
                - claude-opus-4-5
                - claude-haiku-4-5
                - claude-sonnet-4-5
                - gemini-2.5-pro
                - gemini-3-flash
                - gemini-3.1-flash-lite
                - gemini-3.1-pro
                - gemini-3.5-flash-lite
                - gemini-3.6-flash
                - gemini-3.8-flash
                - grok-4.7
                - grok-3
                - grok-3-mini
                - grok-4
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
            temperature:
              type: number
              minimum: 0
              maximum: 1
            allowInterruptions:
              type: boolean
            allowTextInput:
              type: boolean
            endConversationAfterSilenceSeconds:
              type:
                - integer
                - 'null'
              minimum: 10
            initialMessage:
              type: string
              maxLength: 500
            errorMessage:
              type: string
              maxLength: 500
          description: Voice mode settings
        styles:
          $ref: '#/components/schemas/AgentStyles'
        createdAt:
          type: string
          description: ISO 8601 creation timestamp
          example: '2024-01-15T10:30:00.000Z'
        lastMessageAt:
          type:
            - string
            - 'null'
          description: ISO 8601 timestamp of the last received message
        lastTrainedAt:
          type:
            - string
            - 'null'
          description: ISO 8601 timestamp of the last completed training
        status:
          type: string
          enum:
            - untrained
            - training
            - failed
            - trained
          description: >-
            Training state derived from the agent's sources. `untrained`: no
            live sources. `training`: at least one source is still being
            processed. `failed`: a source failed to train (the others are live).
            `trained`: every source is live.
          example: trained
        size:
          type: number
          description: Total size of training data in bytes
      required:
        - id
        - name
        - instructions
        - channelInstructions
        - model
        - autoRetrain
        - temp
        - visibility
        - allowedDomains
        - suggestedMessages
        - initialMessages
        - creditLimit
        - creditsUsed
        - notificationsSettings
        - ipRateLimits
        - spamSettings
        - blockedCountries
        - voiceSettings
        - styles
        - createdAt
        - lastMessageAt
        - lastTrainedAt
        - status
        - size
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
    AgentIpRateLimits:
      type: object
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
      required:
        - limit
        - timeframe
        - message
    AgentSpamSettings:
      type:
        - object
        - 'null'
      properties:
        enabled:
          type: boolean
          description: Whether spam detection is enabled
        prompt:
          type: string
          description: >-
            Custom prompt describing what counts as spam for this agent (max
            2000 chars)
      required:
        - enabled
        - prompt
      description: >-
        Spam detection settings. When enabled, conversations are checked for
        spam and automatically paused.
    AgentStyles:
      type:
        - object
        - 'null'
      properties:
        chat:
          type:
            - object
            - 'null'
          properties:
            theme:
              type: string
              enum:
                - light
                - dark
              default: light
            buttonColor:
              anyOf:
                - type: string
                  pattern: ^#([0-9A-F]{3}){1,2}$/i
                - type: string
                  enum:
                    - transparent
            headerColor:
              type: string
              pattern: ^#([0-9A-F]{3}){1,2}$/i
            userMessageColor:
              type: string
              pattern: ^#([0-9A-F]{3}){1,2}$/i
            displayName:
              type:
                - string
                - 'null'
            autoOpenChatWindowAfter:
              type:
                - number
                - 'null'
            mobile:
              type:
                - object
                - 'null'
              properties:
                initialMessages:
                  type:
                    - object
                    - 'null'
                  properties:
                    enabled:
                      type: boolean
                    value:
                      type: array
                      items:
                        type: string
                  required:
                    - enabled
                    - value
                autoOpenChatWindowAfter:
                  type:
                    - object
                    - 'null'
                  properties:
                    enabled:
                      type: boolean
                    value:
                      type: number
                  required:
                    - enabled
                    - value
                showAutoOpen:
                  type:
                    - boolean
                    - 'null'
            alignChatButton:
              type:
                - string
                - 'null'
              enum:
                - left
                - right
                - null
            messagePlaceholder:
              type:
                - string
                - 'null'
            footer:
              type:
                - string
                - 'null'
            showFeedback:
              type:
                - boolean
                - 'null'
            showCopyButton:
              type:
                - boolean
                - 'null'
            dismissableNotice:
              type:
                - string
                - 'null'
            showDictation:
              type:
                - boolean
                - 'null'
            showAttachments:
              type:
                - boolean
                - 'null'
            showVoiceMode:
              type:
                - boolean
                - 'null'
          description: Chat widget styles
        centerStage:
          type:
            - object
            - 'null'
          properties:
            enabled:
              type: boolean
              default: false
            theme:
              type: string
              enum:
                - light
                - dark
              default: light
            displayName:
              type:
                - string
                - 'null'
            welcomeMessage:
              type:
                - string
                - 'null'
            messagePlaceholder:
              type:
                - string
                - 'null'
            footer:
              type:
                - string
                - 'null'
            dismissableNotice:
              type:
                - string
                - 'null'
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
            showChatBubble:
              type: boolean
              default: true
            showAttachments:
              type: boolean
              default: false
            showDictation:
              type: boolean
              default: true
            showVoiceMode:
              type: boolean
              default: false
            showCopyButton:
              type: boolean
              default: false
            showFeedback:
              type: boolean
              default: true
            showDataSource:
              type: boolean
              default: true
            headerColor:
              type: string
              pattern: ^#([0-9A-F]{3}){1,2}$/i
            userMessageColor:
              type: string
              pattern: ^#([0-9A-F]{3}){1,2}$/i
            tintedGrayscale:
              type: object
              properties:
                enabled:
                  type: boolean
                  default: false
                hue:
                  type: number
                  minimum: 0
                  maximum: 360
                  default: 0
                tint:
                  type: number
                  minimum: 0
                  maximum: 9
                shade:
                  type: number
                  minimum: -4
                  maximum: 4
            accentColorEnabled:
              type: boolean
            accentSyncWithIcon:
              type: boolean
            typography:
              type: object
              properties:
                fontFamily:
                  type: string
                  pattern: ^[a-zA-Z0-9 ,'"_-]+$
                  default: Inter
                fontSize:
                  type: string
                  pattern: ^\d+(\.\d+)?(px|rem|em)$
                  default: 16px
            closeOnOutsideClick:
              type: boolean
              default: true
          description: Center stage widget styles
      required:
        - chat
        - centerStage
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.