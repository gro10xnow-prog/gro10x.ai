> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Delete a contact

> Permanently deletes a contact



## OpenAPI

````yaml /openapi.yaml delete /chatbots/{chatbotId}/contacts/{contactId}
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
  /chatbots/{chatbotId}/contacts/{contactId}:
    delete:
      tags:
        - Contacts
      summary: Delete a contact
      description: Permanently deletes a contact
      parameters:
        - name: chatbotId
          in: path
          required: true
          schema:
            type: string
          description: ID of the chatbot
          example: ckl123abc456
        - name: contactId
          in: path
          required: true
          schema:
            type: string
          description: External ID of the contact
          example: user_123
      responses:
        '200':
          description: Contact deleted successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Success
                  data:
                    $ref: '#/components/schemas/Contact'
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
    Contact:
      type: object
      properties:
        id:
          type: string
          description: Internal contact ID
          example: contact_internal_123
        external_id:
          type: string
          description: External contact identifier
          example: user_123
        name:
          type: string
          description: Contact's name
          example: John Doe
        email:
          type: string
          format: email
          description: Contact's email address
          example: john@example.com
        phonenumber:
          type: string
          description: Contact's phone number
          example: '+1234567890'
        stripe_accounts:
          type: array
          description: Array of Stripe accounts associated with this contact
          items:
            $ref: '#/components/schemas/StripeAccount'
          example:
            - label: main
              stripe_id: cus_123abc456
              stripe_email: john@example.com
        custom_attributes:
          type: object
          description: Custom attributes for the contact
          additionalProperties: true
          example:
            department: Sales
            subscription_tier: Premium
        created_at:
          type: integer
          description: Contact creation timestamp (Unix timestamp)
          example: 1704067200
        updated_at:
          type: integer
          description: Last update timestamp (Unix timestamp)
          example: 1704153600
    StripeAccount:
      type: object
      required:
        - label
        - stripe_id
      properties:
        label:
          type: string
          description: Label identifier for the Stripe account
          example: main
        stripe_id:
          type: string
          description: Stripe customer ID
          example: cus_123abc456
        stripe_email:
          type: string
          format: email
          description: Email address associated with the Stripe account
          example: john@example.com
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