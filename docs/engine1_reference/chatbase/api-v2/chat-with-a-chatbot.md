> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Chat with a chatbot

> Send a message to a chatbot and receive a response. Supports streaming responses.
Can continue existing conversations by providing a conversationId.


<Note>
  **Looking for API v2?** The new Chatbase API v2 features structured error codes, cursor-based pagination, and SSE streaming. Note that API v2 is available starting from the Standard Plan. [Check out the API v2 Reference →](/docs/api-v2/overview)
</Note>


## OpenAPI

````yaml /openapi.yaml post /chat
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
  /chat:
    post:
      tags:
        - Chat
      summary: Chat with a chatbot
      description: >
        Send a message to a chatbot and receive a response. Supports streaming
        responses.

        Can continue existing conversations by providing a conversationId.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - chatbotId
                - messages
              properties:
                chatbotId:
                  type: string
                  description: ID of the chatbot to chat with
                  example: ckl123abc456
                messages:
                  type: array
                  items:
                    type: object
                    required:
                      - role
                      - content
                    properties:
                      role:
                        type: string
                        enum:
                          - user
                          - assistant
                        description: Message sender role
                        example: user
                      content:
                        type: string
                        description: Message content
                        example: Hello, I need help with my order
                  description: Array of messages in the conversation
                conversationId:
                  type: string
                  description: >-
                    ID of existing conversation to continue, if not provided,
                    the conversation will not be saved
                  example: conv_abc123
                contactId:
                  type: string
                  description: External ID of the contact/user
                  example: user_123
                model:
                  $ref: '#/components/schemas/AIModel'
                temperature:
                  type: number
                  minimum: 0
                  maximum: 1
                  description: Temperature setting for AI response creativity
                  example: 0.7
                stream:
                  type: boolean
                  description: Whether to stream the response
                  default: false
      responses:
        '200':
          description: Chat response
          content:
            application/json:
              schema:
                type: object
                properties:
                  text:
                    type: string
                    description: The chatbot's response text
                    example: Hello! How can I help you today?
            text/plain:
              schema:
                type: string
                description: Streaming response (when stream=true)
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
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