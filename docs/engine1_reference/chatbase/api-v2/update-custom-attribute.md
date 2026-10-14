> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Update custom attribute

> Updates an existing custom attribute



## OpenAPI

````yaml /openapi.yaml put /chatbots/{chatbotId}/custom-attributes/{name}
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
  /chatbots/{chatbotId}/custom-attributes/{name}:
    put:
      tags:
        - Contacts
      summary: Update custom attribute
      description: Updates an existing custom attribute
      parameters:
        - name: chatbotId
          in: path
          required: true
          schema:
            type: string
          description: ID of the chatbot
          example: ckl123abc456
        - name: name
          in: path
          required: true
          schema:
            type: string
          description: Name of the custom attribute
          example: department
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CustomAttributeUpdateInput'
      responses:
        '200':
          description: Custom attribute updated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Success
                  data:
                    type: object
                    description: Updated custom attribute
                    properties:
                      name:
                        type: string
                        description: Attribute name
                        example: department
                      label:
                        type: string
                        description: Display label for the attribute
                        example: Department
                      type:
                        type: string
                        enum:
                          - text
                          - number
                          - boolean
                          - date
                        description: Attribute data type
                        example: text
                      description:
                        type: string
                        description: Description of the attribute
                        example: Employee department
                      archived:
                        type: boolean
                        description: Whether the attribute is archived
                        example: false
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
        '429':
          $ref: '#/components/responses/RateLimited'
        '500':
          $ref: '#/components/responses/InternalServerError'
components:
  schemas:
    CustomAttributeUpdateInput:
      type: object
      properties:
        label:
          type: string
          description: Display label for the attribute
          example: Department
        description:
          type: string
          description: Description of the attribute
          example: Updated employee department
        archived:
          type: boolean
          description: Whether the attribute is archived
          example: false
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
    RateLimited:
      description: Rate Limited - Too many requests
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
                example: Rate limit exceeded. Please try again later.
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