> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Upload chatbot profile picture

> Uploads a profile picture for the chatbot



## OpenAPI

````yaml /openapi.yaml post /upload-chatbot-profile-picture
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
  /upload-chatbot-profile-picture:
    post:
      tags:
        - Assets
      summary: Upload chatbot profile picture
      description: Uploads a profile picture for the chatbot
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - chatbotId
                - profilePictureFile
              properties:
                chatbotId:
                  type: string
                  description: ID of the chatbot
                  example: ckl123abc456
                profilePictureFile:
                  type: string
                  format: binary
                  description: Profile picture image file
      responses:
        '200':
          description: Profile picture uploaded successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Chatbot Profile Picture uploaded successfully.
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
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