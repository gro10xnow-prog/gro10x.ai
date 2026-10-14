> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Health check

> Returns the API health status. No authentication required.



## OpenAPI

````yaml /api-v2-openapi.json get /health
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
  /health:
    get:
      tags:
        - Health
      summary: Health check
      description: Returns the API health status. No authentication required.
      operationId: getHealth
      responses:
        '200':
          description: API is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum:
                      - ok
                  timestamp:
                    $ref: '#/components/schemas/UnixTimestamp'
                required:
                  - status
                  - timestamp
              example:
                status: ok
                timestamp: 1770681600
components:
  schemas:
    UnixTimestamp:
      type: number

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.