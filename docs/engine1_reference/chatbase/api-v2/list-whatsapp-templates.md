> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# List WhatsApp templates

> Lists the approved WhatsApp templates available to the agent, across all of its connected WhatsApp Business Accounts. Each template's `variables` object is the shape a send request must provide. A template can only be sent from a number on its own Business Account, so pair its `wabaId` with a matching entry in `senders` to pick the `from` value. Check `complete` before treating the list as exhaustive: it is `false` when one of the agent’s Business Accounts could not be read.



## OpenAPI

````yaml /api-v2-openapi.json get /agents/{agentId}/whatsapp/templates
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
  /agents/{agentId}/whatsapp/templates:
    get:
      tags:
        - WhatsApp
      summary: List WhatsApp templates
      description: >-
        Lists the approved WhatsApp templates available to the agent, across all
        of its connected WhatsApp Business Accounts. Each template's `variables`
        object is the shape a send request must provide. A template can only be
        sent from a number on its own Business Account, so pair its `wabaId`
        with a matching entry in `senders` to pick the `from` value. Check
        `complete` before treating the list as exhaustive: it is `false` when
        one of the agent’s Business Accounts could not be read.
      operationId: listWhatsAppTemplates
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
      responses:
        '200':
          description: The available templates
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ListWhatsAppTemplatesResponse'
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
            The agent exists but has no WhatsApp phone number connected. Connect
            a number from the deploy page before calling WhatsApp endpoints.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: WHATSAPP_NOT_CONNECTED
                  message: WhatsApp is not connected for this agent
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
      security:
        - bearerAuth: []
components:
  schemas:
    ListWhatsAppTemplatesResponse:
      type: object
      properties:
        templates:
          type: array
          items:
            $ref: '#/components/schemas/WhatsAppTemplate'
        complete:
          type: boolean
          description: >-
            False when at least one of the agent’s WhatsApp Business Accounts
            could not be read. The list is then partial and must not be treated
            as the full set.
        unavailableWabaIds:
          type: array
          items:
            type: string
          description: >-
            WhatsApp Business Account IDs whose templates could not be fetched.
            Retry to pick them up.
          example: []
        senders:
          type: array
          items:
            $ref: '#/components/schemas/WhatsAppSender'
          description: >-
            The agent’s connected WhatsApp numbers. Pick one whose `wabaId`
            matches the template’s `wabaId` and pass its `from` value to the
            send endpoint.
      required:
        - templates
        - complete
        - unavailableWabaIds
        - senders
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
    WhatsAppTemplate:
      type: object
      properties:
        id:
          type: string
          description: Meta template ID
        name:
          type: string
          description: Template name
        language:
          type: string
          description: Language code (e.g. `en_US`)
        category:
          type: string
          description: Template category (MARKETING, UTILITY, AUTHENTICATION)
        status:
          type: string
          description: Meta review status (APPROVED)
        parameterFormat:
          type: string
          enum:
            - POSITIONAL
            - NAMED
          description: Whether variables are positional (`{{1}}`) or named (`{{name}}`)
        wabaId:
          type: string
          description: WhatsApp Business Account ID this template belongs to
        variables:
          type: object
          additionalProperties:
            type: array
            items:
              type: string
          description: >-
            Variable keys the template expects, grouped by component and in
            order of appearance — the same shape `template.variables` takes on
            the send endpoint. Supply a value for every key listed.
          example:
            header:
              - '1'
            body:
              - '1'
              - '2'
        components:
          type: array
          items:
            $ref: '#/components/schemas/WhatsAppTemplateComponent'
          description: Template components as approved by Meta
      required:
        - id
        - name
        - language
        - category
        - status
        - parameterFormat
        - wabaId
        - variables
        - components
    WhatsAppSender:
      type: object
      properties:
        from:
          type: string
          description: >-
            Value to pass as `from` when sending. Formatting is ignored when
            matching.
          example: '14155552671'
        wabaId:
          type: string
          description: >-
            WhatsApp Business Account this number belongs to. Only templates
            whose `wabaId` matches can be sent from it.
        verifiedName:
          type:
            - string
            - 'null'
          description: Display name Meta verified for this number
      required:
        - from
        - wabaId
        - verifiedName
    WhatsAppTemplateComponent:
      type: object
      properties:
        type:
          type: string
          description: Component type (HEADER, BODY, FOOTER, BUTTONS)
        format:
          type: string
          description: Header format when type is HEADER (TEXT, IMAGE, VIDEO, DOCUMENT)
        text:
          type: string
          description: Component text with `{{...}}` variable placeholders, when applicable
        buttons:
          type: array
          items:
            $ref: '#/components/schemas/WhatsAppTemplateButton'
      required:
        - type
    WhatsAppTemplateButton:
      type: object
      properties:
        type:
          type: string
        text:
          type: string
        url:
          type: string
          description: >-
            Destination of a URL button. A `{{...}}` placeholder here means the
            button takes a parameter, which the send endpoint cannot supply —
            sending such a template returns `TEMPLATE_BUTTONS_UNSUPPORTED`.
      required:
        - type
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.