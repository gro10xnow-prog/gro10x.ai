> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Update chatbot settings

> Updates various chatbot configuration settings



## OpenAPI

````yaml /openapi.yaml post /update-chatbot-settings
openapi: 3.0.3
info:
  title: Chatbase API v1
  description: >
    Comprehensive API documentation for all Chatbase v1 endpoints.


    ## Authentication

    All endpoints require authentication using a Bearer token in the
    Authorization header:

    ```

    Authorization: Bearer YOUR_API_KEY

    ```
  version: 1.0.0
  contact:
    name: Chatbase Support
    url: https://chatbase.co/help
servers:
  - url: https://www.chatbase.co/api/v1
    description: Production server
security:
  - bearerAuth: []
tags:
  - name: Chatbots
    description: Chatbot management operations
  - name: Chat
    description: Chat conversation endpoints
  - name: Conversations
    description: Conversation history and management
  - name: Leads
    description: Lead collection and management
  - name: Contacts
    description: Contact management for chatbots
  - name: Assets
    description: File upload and management
paths:
  /update-chatbot-settings:
    post:
      tags:
        - Chatbots
      summary: Update chatbot settings
      description: Updates various chatbot configuration settings
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - chatbotId
              properties:
                chatbotId:
                  type: string
                  description: ID of the chatbot to update
                  example: ckl123abc456
                name:
                  type: string
                  description: Chatbot name
                  example: My Chatbot
                instructions:
                  type: string
                  description: System instructions for the chatbot
                  example: You are a helpful customer service assistant
                initialMessages:
                  type: array
                  items:
                    type: string
                  description: Initial greeting messages
                  example:
                    - Hello! How can I help you?
                suggestedMessages:
                  type: array
                  items:
                    type: string
                  description: Suggested conversation starters
                  example:
                    - What are your hours?
                    - How can I contact support?
                visibility:
                  type: string
                  enum:
                    - public
                    - private
                  description: Enable or disable access to the chatbot
                  example: public
                domains:
                  type: array
                  items:
                    type: string
                  description: Allowed domains for the chatbot
                  example:
                    - example.com
                    - subdomain.example.com
                onlyAllowOnAddedDomains:
                  type: boolean
                  description: Whether to restrict to allowed domains only
                  example: false
                ipLimit:
                  type: integer
                  description: Rate limit per IP address
                  example: 10
                ipLimitTimeframe:
                  type: integer
                  description: Timeframe for IP rate limiting
                  example: 3600
                ipLimitMessage:
                  type: string
                  description: Message shown when rate limit is exceeded
                  example: Too many requests. Please try again later.
                model:
                  $ref: '#/components/schemas/AIModel'
                temp:
                  type: number
                  minimum: 0
                  maximum: 1
                  description: Temperature setting for AI responses
                  example: 0.7
                styles:
                  $ref: '#/components/schemas/ChatbotStyles'
                collectCustomerInformation:
                  $ref: '#/components/schemas/CollectLeadsSettings'
      responses:
        '202':
          description: Settings updated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Your changes are saved.
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'
        '500':
          $ref: '#/components/responses/InternalServerError'
components:
  schemas:
    AIModel:
      type: string
      description: AI model to use for the response
      enum:
        - gpt-4o-mini
        - gpt-oss-120b
        - gpt-oss-20b
        - gpt-5.2
        - gpt-5.5
        - gpt-5.6-terra
        - gpt-6-luna
        - gpt-6.1-sol
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
      example: gpt-4o-mini
    ChatbotStyles:
      type: object
      properties:
        theme:
          type: string
          enum:
            - light
            - dark
          description: UI theme
          example: light
        buttonColor:
          type: string
          description: Color for buttons (hex code)
          example: '#007bff'
        displayName:
          type: string
          description: Display name for the chatbot
          example: Support Bot
        alignChatButton:
          type: string
          enum:
            - left
            - right
          description: Chat button alignment
          example: right
        userMessageColor:
          type: string
          description: Color for user messages (hex code)
          example: '#007bff'
        autoOpenChatWindowAfter:
          type: integer
          description: Auto-open delay in seconds (0 to disable)
          example: 5
    CollectLeadsSettings:
      type: object
      properties:
        title:
          type: string
          description: Form title
          example: Contact Information
        name:
          type: object
          properties:
            active:
              type: boolean
              description: Whether name field is enabled
              example: true
            label:
              type: string
              description: Label for name field
              example: Full Name
        email:
          type: object
          properties:
            active:
              type: boolean
              description: Whether email field is enabled
              example: true
            label:
              type: string
              description: Label for email field
              example: Email Address
        phone:
          type: object
          properties:
            active:
              type: boolean
              description: Whether phone field is enabled
              example: false
            label:
              type: string
              description: Label for phone field
              example: Phone Number
  responses:
    BadRequest:
      description: Bad Request - Invalid input parameters
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
                example: Invalid request data
    Unauthorized:
      description: Unauthorized - Invalid or missing API key
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
                example: No API key provided.
    Forbidden:
      description: Forbidden - Access denied or quota exceeded
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
                example: Access denied or quota exceeded
    NotFound:
      description: Not Found - Resource does not exist
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
                example: Resource not found
    InternalServerError:
      description: Internal Server Error
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
                example: Internal server error
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: API key in Bearer token format

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.