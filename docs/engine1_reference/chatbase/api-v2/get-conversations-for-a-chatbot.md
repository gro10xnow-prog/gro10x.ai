> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get conversations for a chatbot

> Retrieves conversation history for a specific chatbot

<Note>
  **Looking for API v2?** The new Chatbase API v2 features structured error codes, cursor-based pagination, and SSE streaming. [Check out the API v2 Reference →](/docs/api-v2/overview)
</Note>


## OpenAPI

````yaml /openapi.yaml get /get-conversations
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
  /get-conversations:
    get:
      tags:
        - Conversations
      summary: Get conversations for a chatbot
      description: Retrieves conversation history for a specific chatbot
      parameters:
        - name: chatbotId
          in: query
          required: true
          schema:
            type: string
          description: ID of the chatbot
          example: ckl123abc456
        - name: filteredSources
          in: query
          required: false
          schema:
            type: string
          description: >-
            Comma-separated list of conversation sources to filter by. Example
            API,WhatsApp,Messenger,Instagram,Slack,Playground,Action
            preview,Widget or Iframe
        - name: startDate
          in: query
          required: false
          schema:
            type: string
            format: date
          description: Start date for conversation filtering (YYYY-MM-DD)
          example: '2024-01-01'
        - name: endDate
          in: query
          required: false
          schema:
            type: string
            format: date
          description: End date for conversation filtering (YYYY-MM-DD)
          example: '2024-12-31'
        - name: page
          in: query
          required: false
          schema:
            type: string
          description: Page number for pagination
          example: '1'
        - name: size
          in: query
          required: false
          schema:
            type: string
          description: Number of items per page
          example: '10'
      responses:
        '200':
          description: Conversations retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Conversation'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
        '500':
          $ref: '#/components/responses/InternalServerError'
components:
  schemas:
    Conversation:
      type: object
      properties:
        id:
          type: string
          description: Unique conversation identifier
          example: conv_123
        chatbot_id:
          type: string
          description: Associated chatbot ID
          example: ckl123abc456
        created_at:
          type: string
          format: date-time
          description: Conversation start time
          example: '2024-01-01T12:00:00Z'
        updated_at:
          type: string
          format: date-time
          description: Last message time
          example: '2024-01-01T12:05:00Z'
        source:
          type: string
          enum:
            - api
            - website
            - whatsapp
            - slack
            - messenger
            - instagram
          description: Conversation source
          example: api
        messages:
          type: array
          items:
            $ref: '#/components/schemas/ChatMessage'
          description: Messages in the conversation
    ChatMessage:
      type: object
      required:
        - role
        - content
      properties:
        id:
          type: string
          description: Unique message identifier
          example: msg_123
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
        type:
          type: string
          enum:
            - text
          description: Message type
          default: text
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