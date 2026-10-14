> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Send a WhatsApp template message

> Sends an approved WhatsApp template to a recipient from one of the agent's connected phone numbers. Recipients are identified by phone number only — no user ID is required. A Chatbase user is resolved or created from the `to` number automatically, and their reply flows through the agent's regular WhatsApp pipeline. The message is also appended to that conversation, unless a human has taken it over or it has ended — see `conversationId` in the response.



## OpenAPI

````yaml /api-v2-openapi.json post /agents/{agentId}/whatsapp/messages/template
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
  /agents/{agentId}/whatsapp/messages/template:
    post:
      tags:
        - WhatsApp
      summary: Send a WhatsApp template message
      description: >-
        Sends an approved WhatsApp template to a recipient from one of the
        agent's connected phone numbers. Recipients are identified by phone
        number only — no user ID is required. A Chatbase user is resolved or
        created from the `to` number automatically, and their reply flows
        through the agent's regular WhatsApp pipeline. The message is also
        appended to that conversation, unless a human has taken it over or it
        has ended — see `conversationId` in the response.
      operationId: sendWhatsAppTemplateMessage
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
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SendWhatsAppTemplateBody'
      responses:
        '201':
          description: The message was accepted by WhatsApp
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SendWhatsAppTemplateResponse'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                PHONE_NUMBER_REQUIRED:
                  summary: >-
                    The agent has more than one connected WhatsApp number, so
                    `from` must be provided to pick the sender.
                  value:
                    error:
                      code: PHONE_NUMBER_REQUIRED
                      message: >-
                        This agent has multiple WhatsApp phone numbers; specify
                        a `from` number
                TEMPLATE_LANGUAGE_REQUIRED:
                  summary: >-
                    The template name has more than one approved language
                    variant. Pass `template.language` to choose one. Variants
                    that are not approved are ignored, so this is only returned
                    when the choice is genuinely ambiguous.
                  value:
                    error:
                      code: TEMPLATE_LANGUAGE_REQUIRED
                      message: >-
                        Multiple languages exist for this template; specify a
                        language
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
          description: Resource not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                PHONE_NUMBER_NOT_FOUND:
                  summary: >-
                    No WhatsApp number connected to this agent matches the
                    provided `from` number.
                  value:
                    error:
                      code: PHONE_NUMBER_NOT_FOUND
                      message: WhatsApp phone number not found for this agent
                TEMPLATE_NOT_FOUND:
                  summary: >-
                    No template with the given name (and language, if provided)
                    exists on the WhatsApp Business Account of the sending phone
                    number. When the agent has numbers on more than one Business
                    Account, check that the `from` number’s `wabaId` matches the
                    template’s `wabaId` from the list endpoint.
                  value:
                    error:
                      code: TEMPLATE_NOT_FOUND
                      message: WhatsApp template not found
        '409':
          description: Cannot send in the current state
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                TEMPLATE_NOT_APPROVED:
                  summary: >-
                    The template exists but has no approved variant to send. The
                    `details.status` field carries the Meta review status,
                    broken down per language when the name has several
                    unapproved variants.
                  value:
                    error:
                      code: TEMPLATE_NOT_APPROVED
                      message: WhatsApp template is not approved
                SEND_BLOCKED:
                  summary: >-
                    Meta has blocked business-initiated conversations for this
                    WhatsApp Business Account — commonly a billing or
                    payment-method problem, or an account restriction. The
                    `details.reason` field carries Meta's explanation. Resolve
                    it in WhatsApp Manager; sends resume within a minute of the
                    account being healthy again.
                  value:
                    error:
                      code: SEND_BLOCKED
                      message: >-
                        This WhatsApp Business Account is not allowed to start
                        new conversations
        '422':
          description: Unprocessable message
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                MISSING_TEMPLATE_VARIABLES:
                  summary: >-
                    The template declares variables that were not provided. The
                    `details.missing` field lists them as `component[key]`, e.g.
                    `body[2]`.
                  value:
                    error:
                      code: MISSING_TEMPLATE_VARIABLES
                      message: Missing values for template variables
                INVALID_TEMPLATE_VARIABLES:
                  summary: >-
                    WhatsApp refuses a parameter that is empty, or that contains
                    a line break, a tab, or more than four consecutive spaces.
                    It reports all of these as the same opaque send failure, so
                    they are rejected here instead. The `details.invalid` field
                    names each offending slot and why, as `body[1] (contains a
                    line break)`.
                  value:
                    error:
                      code: INVALID_TEMPLATE_VARIABLES
                      message: >-
                        One or more template variable values are not accepted by
                        WhatsApp
                TEMPLATE_BUTTONS_UNSUPPORTED:
                  summary: >-
                    The template has a button that takes a parameter — a dynamic
                    URL, a copy-code, or a one-time-password button — which this
                    endpoint cannot send. WhatsApp would reject the message, so
                    it is refused up front rather than attempted. The
                    `details.buttons` field lists the button types. Campaigns
                    cannot send these either — no Chatbase surface builds button
                    parameters today — so edit the template in WhatsApp Manager
                    to use a static button, or send a variant that has none.
                  value:
                    error:
                      code: TEMPLATE_BUTTONS_UNSUPPORTED
                      message: Template buttons are not supported by this endpoint
                TEMPLATE_PARAMS_REJECTED:
                  summary: >-
                    The WhatsApp API rejected the send because the provided
                    parameters do not match the approved template (wrong count,
                    format, or content).
                  value:
                    error:
                      code: TEMPLATE_PARAMS_REJECTED
                      message: Meta rejected the template parameters
                RECIPIENT_INVALID:
                  summary: >-
                    The `to` phone number is not a valid international phone
                    number — it is parsed and validated against its country, so
                    an unassignable number (e.g. a `555` US area code) is
                    rejected. Use digits only with country code, e.g.
                    14155552671.
                  value:
                    error:
                      code: RECIPIENT_INVALID
                      message: Recipient phone number is invalid
                RECIPIENT_NOT_REACHABLE:
                  summary: >-
                    The WhatsApp API reported the recipient as undeliverable —
                    the number may not be on WhatsApp or has blocked business
                    messages.
                  value:
                    error:
                      code: RECIPIENT_NOT_REACHABLE
                      message: Recipient cannot receive WhatsApp messages
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
        '502':
          description: Upstream WhatsApp API failure
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                WHATSAPP_SEND_FAILED:
                  summary: >-
                    The WhatsApp API returned an error that does not map to a
                    more specific code.
                  value:
                    error:
                      code: WHATSAPP_SEND_FAILED
                      message: WhatsApp API rejected the message
                MEDIA_UPLOAD_FAILED:
                  summary: >-
                    The template has a media header and uploading its media to
                    the WhatsApp API failed.
                  value:
                    error:
                      code: MEDIA_UPLOAD_FAILED
                      message: Failed to upload the template header media to WhatsApp
      security:
        - bearerAuth: []
components:
  schemas:
    SendWhatsAppTemplateBody:
      type: object
      properties:
        to:
          type: string
          minLength: 1
          description: >-
            Recipient phone number in international format (digits with country
            code, `+` and separators are tolerated). The phone number is the
            recipient identity: no user ID is needed — a Chatbase user is
            automatically resolved or created from this number (matching an
            existing contact with the same phone when one exists), and replies
            continue in that user’s conversation.
          example: '14155552671'
        from:
          type: string
          minLength: 1
          description: >-
            Which of the agent’s connected WhatsApp business numbers to send
            from, in international format. Formatting is ignored when matching,
            so `+1 415-555-2671` and `14155552671` are equivalent. Optional when
            the agent has exactly one connected number.
          example: '14155552671'
        template:
          type: object
          properties:
            name:
              type: string
              minLength: 1
              description: Name of the approved template
              example: order_confirmation
            language:
              type: string
              minLength: 1
              description: >-
                Template language code (e.g. `en_US`). Optional when the
                template exists in a single language.
              example: en_US
            variables:
              type: object
              additionalProperties:
                type: object
                additionalProperties:
                  type: string
              default: {}
              description: >-
                Values for the template variables, grouped by component
                (`header`, `body`) — the same grouping WhatsApp uses when it
                sends. Each component numbers its own placeholders from `{{1}}`,
                so a text header and the body can each declare a `{{1}}`;
                keeping them under separate keys is what tells the two apart.
                For a named template use the parameter names instead of numbers.
                The `variables` object on the list-templates response reports
                exactly which keys each component expects.
              example:
                header:
                  '1': '#1042'
                body:
                  '1': Jane
                  '2': Friday
          required:
            - name
      required:
        - to
        - template
      example:
        to: '14155552671'
        from: '14155552672'
        template:
          name: order_update
          language: en_US
          variables:
            header:
              '1': '#1042'
            body:
              '1': Jane
              '2': Friday
    SendWhatsAppTemplateResponse:
      type: object
      properties:
        messageId:
          type:
            - string
            - 'null'
          description: WhatsApp message ID (wamid) of the sent message
        conversationId:
          type:
            - string
            - 'null'
          description: >-
            Chatbase conversation the recipient’s replies continue in. The
            message is also appended to that conversation, unless a human has
            taken it over or it has ended — in those cases only the WhatsApp
            delivery happens.
        to:
          type: string
          description: Canonical recipient WhatsApp ID the message was sent to
      required:
        - messageId
        - conversationId
        - to
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
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key from your account settings

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.