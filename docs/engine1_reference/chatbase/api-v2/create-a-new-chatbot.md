> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a new chatbot

> Creates a new chatbot with training data from text



## OpenAPI

````yaml /openapi.yaml post /create-chatbot
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
  /create-chatbot:
    post:
      tags:
        - Chatbots
      summary: Create a new chatbot
      description: Creates a new chatbot with training data from text
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - chatbotName
              properties:
                chatbotName:
                  type: string
                  minLength: 3
                  description: Name of the chatbot (minimum 3 characters)
                  example: Customer Support Bot
                sourceText:
                  type: string
                  description: Raw text content to train the chatbot
                  example: Welcome to our company...
      responses:
        '200':
          description: Chatbot created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  chatbotId:
                    type: string
                    description: Unique identifier for the created chatbot
                    example: ckl123abc456
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '500':
          $ref: '#/components/responses/InternalServerError'
components:
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