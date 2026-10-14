> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get all chatbots

> Retrieves all chatbots for the authenticated account



## OpenAPI

````yaml /openapi.yaml get /get-chatbots
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
  /get-chatbots:
    get:
      tags:
        - Chatbots
      summary: Get all chatbots
      description: Retrieves all chatbots for the authenticated account
      responses:
        '200':
          description: List of chatbots retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  chatbots:
                    type: array
                    items:
                      $ref: '#/components/schemas/Chatbot'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '500':
          $ref: '#/components/responses/InternalServerError'
components:
  schemas:
    Chatbot:
      type: object
      properties:
        id:
          type: string
          description: Unique chatbot identifier
          example: ckl123abc456
        name:
          type: string
          description: Chatbot name
          example: Customer Support Bot
        status:
          type: string
          enum:
            - training
            - ready
            - failed
          description: Current chatbot status
          example: ready
        model:
          type: string
          description: AI model being used
          example: gpt-4o-mini
        instructions:
          type: string
          description: System instructions for the chatbot
          example: You are a helpful customer service assistant
        visibility:
          type: string
          enum:
            - public
            - private
          description: Chatbot visibility setting
          example: public
        created_at:
          type: string
          format: date-time
          description: Creation timestamp
          example: '2024-01-01T12:00:00Z'
        updated_at:
          type: string
          format: date-time
          description: Last update timestamp
          example: '2024-01-02T12:00:00Z'
  responses:
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