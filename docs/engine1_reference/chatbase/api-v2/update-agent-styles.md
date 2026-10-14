> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Update agent styles

> Updates the visual styles for an agent.



## OpenAPI

````yaml /api-v2-openapi.json put /agents/{agentId}/styles
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
  /agents/{agentId}/styles:
    put:
      tags:
        - Agents
      summary: Update agent styles
      description: Updates the visual styles for an agent.
      operationId: updateAgentStyles
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
              $ref: '#/components/schemas/UpdateAgentStylesBody'
      responses:
        '200':
          description: Styles updated
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
    UpdateAgentStylesBody:
      type: object
      properties:
        styles:
          $ref: '#/components/schemas/UpdateAgentStylesInput'
      required:
        - styles
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
    UpdateAgentStylesInput:
      type: object
      properties:
        chat:
          type: object
          properties:
            theme:
              type: string
              enum:
                - light
                - dark
              description: Widget color theme
              example: light
            headerColor:
              type: string
              pattern: ^#([0-9A-F]{3}){1,2}$/i
              example: '#1A2B3C'
              description: 'Chat header background color (hex, e.g. #1A2B3C)'
            userMessageColor:
              type: string
              pattern: ^#([0-9A-F]{3}){1,2}$/i
              example: '#1A2B3C'
              description: User message bubble background color (hex)
            buttonColor:
              anyOf:
                - type: string
                  pattern: ^#([0-9A-F]{3}){1,2}$/i
                  example: '#1A2B3C'
                - type: string
                  enum:
                    - transparent
              description: >-
                Chat launcher button and primary accent color. Pass a hex code
                or "transparent"
              example: '#1A2B3C'
            displayName:
              type:
                - string
                - 'null'
              maxLength: 100
              description: >-
                Name displayed in the chat header. Defaults to the agent name
                (max 100 chars)
            autoOpenChatWindowAfter:
              type:
                - number
                - 'null'
              description: >-
                Seconds after page load before the chat window opens
                automatically. null = disabled
              example: 5
            mobile:
              type: object
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
              description: >-
                Mobile-specific overrides for initial messages and auto-open
                timing
            alignChatButton:
              type: string
              enum:
                - left
                - right
              description: Corner the launcher button is anchored to
              example: right
            messagePlaceholder:
              type:
                - string
                - 'null'
              maxLength: 200
              description: >-
                Placeholder text shown inside the message input field (max 200
                chars)
            footer:
              type:
                - string
                - 'null'
              maxLength: 500
              description: >-
                Small text shown below the input bar, e.g. branding or legal
                notice (max 500 chars)
            showFeedback:
              type: boolean
              description: Show thumbs-up / thumbs-down buttons on agent messages
            showCopyButton:
              type: boolean
              description: Show a copy-to-clipboard button on agent messages
            dismissableNotice:
              type:
                - string
                - 'null'
              maxLength: 500
              description: >-
                Text shown in a dismissable banner above the chat. Empty string
                = hidden (max 500 chars)
            showDictation:
              type: boolean
              description: Show a microphone button for speech-to-text input
            showAttachments:
              type: boolean
              description: Allow users to attach files to their messages
            showVoiceMode:
              type: boolean
              description: Show the voice-conversation mode button in the chat
          description: Chat widget styles
        centerStage:
          type: object
          properties:
            enabled:
              type: boolean
              description: Enable or disable the Center Stage widget entirely
            displayName:
              type:
                - string
                - 'null'
              maxLength: 100
              description: >-
                Name shown in the widget header. Defaults to the agent name (max
                100 chars)
            welcomeMessage:
              type:
                - string
                - 'null'
              maxLength: 500
              description: >-
                Greeting text shown above the message input when the
                conversation is empty (max 500 chars)
            messagePlaceholder:
              type:
                - string
                - 'null'
              maxLength: 200
              description: Placeholder text inside the message input field (max 200 chars)
            dismissableNotice:
              type:
                - string
                - 'null'
              maxLength: 500
              description: >-
                Text shown in a dismissable banner inside the widget. Empty
                string = hidden (max 500 chars)
            footer:
              type:
                - string
                - 'null'
              maxLength: 500
              description: >-
                Small text below the input bar, e.g. branding or legal notice
                (max 500 chars)
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
              description: >-
                Quick-reply buttons shown to the user at the start of the
                conversation
            showChatBubble:
              type: boolean
              description: Wrap agent messages in a chat bubble style
            showAttachments:
              type: boolean
              description: Allow users to attach files to their messages
            showDictation:
              type: boolean
              description: Show a microphone button for speech-to-text input
            showVoiceMode:
              type: boolean
              description: Show the voice-conversation mode button
            showCopyButton:
              type: boolean
              description: Show a copy-to-clipboard button on agent messages
            showFeedback:
              type: boolean
              description: Show thumbs-up / thumbs-down feedback buttons on agent messages
            showDataSource:
              type: boolean
              description: Show the source citation below agent messages
            theme:
              type: string
              enum:
                - light
                - dark
              description: Widget color theme
              example: light
            buttonColor:
              type: string
              pattern: ^#([0-9A-F]{3}){1,2}$/i
              example: '#1A2B3C'
              description: Primary accent / send-button color (hex)
            headerColor:
              type: string
              pattern: ^#([0-9A-F]{3}){1,2}$/i
              example: '#1A2B3C'
              description: Header bar background color (hex)
            userMessageColor:
              type: string
              pattern: ^#([0-9A-F]{3}){1,2}$/i
              example: '#1A2B3C'
              description: User message bubble background color (hex)
            tintedGrayscale:
              type: object
              properties:
                enabled:
                  type: boolean
                  description: Whether tinted grayscale is active
                hue:
                  type: number
                  minimum: 0
                  maximum: 360
                  description: Base hue for the grayscale tint (0–360°)
                  example: 220
                tint:
                  type: number
                  minimum: 0
                  maximum: 10
                  description: Amount of hue mixed into lighter tones (0–10)
                  example: 3
                shade:
                  type: number
                  minimum: 0
                  maximum: 10
                  description: Amount of hue mixed into darker tones (0–10)
                  example: 3
              required:
                - enabled
                - hue
                - tint
                - shade
              description: >-
                Tinted grayscale palette. When enabled the widget uses shades of
                a single hue instead of neutral gray
            accentColor:
              type: object
              properties:
                enabled:
                  type: boolean
                  description: Whether the custom accent color is active
                color:
                  type: string
                  pattern: ^#([0-9A-F]{3}){1,2}$/i
                  example: '#1A2B3C'
                  description: Accent color applied to interactive elements (hex)
              required:
                - enabled
                - color
              description: Custom accent color override for interactive elements
            customSurfaceColors:
              type: object
              properties:
                enabled:
                  type: boolean
                  description: Whether custom surface colors are active
                background:
                  type: string
                  pattern: ^#([0-9A-F]{3}){1,2}$/i
                  example: '#1A2B3C'
                  description: Widget background color (hex)
                foreground:
                  type: string
                  pattern: ^#([0-9A-F]{3}){1,2}$/i
                  example: '#1A2B3C'
                  description: Primary text color on the background (hex)
              required:
                - enabled
                - background
                - foreground
              description: Override the widget background and foreground colors
            typography:
              type: object
              properties:
                fontFamily:
                  type: string
                  enum:
                    - Inter
                    - System
                    - Arial
                    - Helvetica
                    - Georgia
                    - Geist
                  description: Widget font family
                  example: Inter
                fontSize:
                  type: string
                  enum:
                    - 12px
                    - 14px
                    - 16px
                    - 18px
                    - 20px
                  description: Widget base font size
                  example: 16px
              required:
                - fontFamily
                - fontSize
              description: Widget font family and size
            width:
              type: string
              enum:
                - small
                - medium
                - large
              description: >-
                Widget width preset (small ≈ 360 px, medium ≈ 420 px, large ≈
                520 px)
              example: medium
            closeOnOutsideClick:
              type: boolean
              description: Close the widget when the user clicks outside of it
            notificationIndicator:
              type: object
              properties:
                enabled:
                  type: boolean
                  description: Whether the notification badge is shown
                number:
                  type: integer
                  minimum: 0
                  maximum: 99
                  description: Number displayed in the badge (0–99)
                  example: 3
              required:
                - enabled
                - number
              description: >-
                Numeric badge on the launcher to draw attention before the user
                opens the widget
            notificationMessage:
              type: object
              properties:
                enabled:
                  type: boolean
                  description: Whether the notification message bubble is shown
                text:
                  type: string
                  maxLength: 200
                  description: Message text displayed in the bubble (max 200 chars)
              required:
                - enabled
                - text
              description: >-
                Floating message bubble next to the launcher shown before the
                user opens the widget
          description: Center stage widget styles
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.