> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Webhook API Guide

> Guide to setting up webhooks to receive real-time notifications for when users submit your custom forms and events like phone call summaries.

# Webhook API Guide

The Webhook API guide allows you to set-up webhooks to receive a `POST` request on when an event or more is triggered.

## Create a webhook

Webhooks are configured on the action that produces the event. For lead submissions, use the [Collect Leads](/docs/user-guides/chatbot/actions/collect-leads) action:

1. Go to **Build > Actions** and open your **Collect Leads** action.
2. Click the **Webhooks** tab in the action settings.
3. Enter the URL that should receive the `POST` request, then click **Create Webhook**.

Other actions that emit events, such as [custom forms](/docs/developer-guides/client-side-custom-forms), have the same **Webhooks** tab.

For phone call summaries, the webhook is configured on the phone channel instead:

1. Go to **Phone > Connections** on an AI agent with a phone number assigned.
2. In the **Call summary webhook** card, enter the URL that should receive the `POST` request, then click **Create webhook**.

The same event can also be subscribed from **Settings > Webhooks** while the phone channel is active.

## Payload

| Key | Type | Description |
| :- | :- | :- |
| **eventType** | string | [Event type](#event-types) |
| **chatbotId** | string | Agent ID |
| **payload** | Object | Payload of the event. [Learn more](#event-payload) |

## Event types[](#event-types)

These are the list of events supported in webhooks:

* `leads.submit` : When a customer submits their info (Name, Email, Phone, and any custom fields configured on the Collect Leads action) to your AI agent.
* `{action name}_collect_data.submit` : When a customer submits the fields collected by a [Collect Data](/docs/user-guides/chatbot/actions/collect-data) action, where `{action name}` is the name of that action.
* `{action name}_custom_form.submit` : When a customer submits a [custom form](/docs/developer-guides/client-side-custom-forms), where `{action name}` is the name of that action.
* `phone_call.summary` : When a phone call to your AI agent ends. Sent once per call, shortly after the caller hangs up, with an AI-generated summary of the conversation.

## Event payload[](#event-payload)

The payload of each event:

* `leads.submit` :

```json theme={null}
{
  conversationId: string,
  customerEmail: string,
  customerName: string,
  customerPhone: string,
  customFields: object // optional, only present when the Collect Leads action has custom fields
}
```

`customFields` is keyed by the field names configured on the Collect Leads action, e.g. `{ "Company name": "Acme", "Team size": 12 }`. It is only sent when the action collects custom fields (conversational mode).

* `{action name}_collect_data.submit` :

```json theme={null}
{
  conversationId: string,
  customFields: object // keyed by the field names configured on the Collect Data action
}
```

* `{action name}_custom_form.submit` :

```json theme={null}
{
  conversationId: string,
  data: object, // the submitted form fields, keyed by field name
  error: string | null // set when an attachment upload failed
}
```

* `phone_call.summary` :

```json theme={null}
{
  conversationId: string,
  callSummary: string,     // Generated summary of the call
  duration: number, // call length in seconds
  callerNumber: string,    // caller's phone number as presented by the carrier
  calledNumber: string     // your agent's number that the caller dialed, in E.164
}
```

`callSummary` can be an empty string if a summary could not be generated for the call. `callerNumber` may arrive in national format rather than E.164, depending on the carrier. `calledNumber` is the number on your account that received the call, webhooks are subscribed per AI agent, so use it to tell which line was dialed when one AI agent answers several numbers.

## Receiving the request

You can receive the payload by accessing the body same as any request. But it is recommended to to check the request header `x-chatbase-signature` for securing your endpoint from spam from anyone knows your endpoint.

You can achieve this by using SHA-1 (Secure Hash Algorithm 1) function to generate a signature for the request and compare it with `x-chatbase-signature` found in the request headers. If the are identical then the request is from Chatbase.

```javascript Next.js theme={null}
import crypto from 'crypto'
import {NextApiRequest, NextApiResponse} from 'next'
import getRawBody from 'raw-body'

// Raw body is required.
export const config = {
  api: {
    bodyParser: false,
  },
}

async function webhookHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const {SECRET_KEY} = process.env

    if (typeof SECRET_KEY != 'string') {
      throw new Error('No secret key found')
    }

    const rawBody = await getRawBody(req)

    const requestBodySignature = sha1(rawBody, SECRET_KEY)

    if (requestBodySignature !== req.headers['x-chatbase-signature']) {
      return res.status(400).json({message: "Signature didn't match"})
    }

    const receivedJson = await JSON.parse(rawBody.toString())

    console.log('Received:', receivedJson)

    /*
    Body example for leads.submit event
    {
      eventType: 'leads.submit',
      chatbotId: 'xxxxxxxx',
      payload: {
        conversationId: 'xxxxxxxx',
        customerEmail: 'example@chatbase.co',
        customerName: 'Example',
        customerPhone: '123',
        customFields: {
          'Company name': 'Acme',
          'Team size': 12
        }
      }
    }
    */

    res.status(200).end('OK')
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

function sha1(data: Buffer, secret: string): string {
  return crypto.createHmac('sha1', secret).update(data).digest('hex')
}

export default webhookHandler
```

```javascript Node.js theme={null}
import crypto from 'crypto'
import {Request, Response} from 'express'

// Note: In this example json body parser is enabled in the app

export async function webhookHandler(req: Request, res: Response) {
  if (req.method === 'POST') {
    const {SECRET_KEY} = process.env

    if (typeof SECRET_KEY != 'string') {
      throw new Error('No secret key found')
    }

    const receivedJson = req.body

    const rawBody = Buffer.from(JSON.stringify(receivedJson))

    const bodySignature = sha1(rawBody, secretKey)

    if (requestBodySignature !== req.headers['x-chatbase-signature']) {
      return res.status(400).json({message: "Signature didn't match"})
    }

    console.log('Received:', receivedJson)

    /*
    Body example for leads.submit event
    {
      eventType: 'leads.submit',
      chatbotId: 'xxxxxxxx',
      payload: {
        conversationId: 'xxxxxxxx',
        customerEmail: 'example@chatbase.co',
        customerName: 'Example',
        customerPhone: '123',
        customFields: {
          'Company name': 'Acme',
          'Team size': 12
        }
      }
    }
    */

    res.status(200).end('OK')
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

function sha1(data: Buffer, secret: string): string {
  return crypto.createHmac('sha1', secret).update(data).digest('hex')
}
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.