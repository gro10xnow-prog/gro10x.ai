> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get leads for a chatbot

> Retrieves collected leads/customers for a specific chatbot



## OpenAPI

````yaml /openapi.yaml get /get-leads
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
  /get-leads:
    get:
      tags:
        - Leads
      summary: Get leads for a chatbot
      description: Retrieves collected leads/customers for a specific chatbot
      parameters:
        - name: chatbotId
          in: query
          required: true
          schema:
            type: string
          description: ID of the chatbot
          example: ckl123abc456
        - name: startDate
          in: query
          required: false
          schema:
            type: string
            format: date
          description: Start date for lead filtering (YYYY-MM-DD)
          example: '2024-01-01'
        - name: endDate
          in: query
          required: false
          schema:
            type: string
            format: date
          description: End date for lead filtering (YYYY-MM-DD)
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
          description: Leads retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  collectedCustomers:
                    type: array
                    items:
                      $ref: '#/components/schemas/Lead'
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
    Lead:
      type: object
      properties:
        id:
          type: string
          description: Unique lead identifier
          example: lead_123
        name:
          type: string
          description: Lead's name
          example: John Doe
        email:
          type: string
          format: email
          description: Lead's email address
          example: john@example.com
        phone:
          type: string
          description: Lead's phone number
          example: '+1234567890'
        created_at:
          type: string
          format: date-time
          description: Lead collection timestamp
          example: '2024-01-01T12:00:00Z'
        chatbot_id:
          type: string
          description: Associated chatbot ID
          example: ckl123abc456
        account_id:
          type: string
          description: Associated account ID
          example: acc_123abc456
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