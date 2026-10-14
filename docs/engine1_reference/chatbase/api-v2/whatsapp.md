> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# WhatsApp

> List the approved WhatsApp templates available to your AI agent and send them to any phone number.

The WhatsApp API [sends approved message templates](/docs/api-v2/whatsapp/send-a-whatsapp-template-message) from the numbers connected to your AI agent. A template is the only way to open a conversation with someone who has not messaged you in the last 24 hours.

Recipients are identified by phone number, with no Chatbase user id needed: a user is resolved from the `to` number or created, and replies arrive in that user's conversation through your AI agent's normal WhatsApp pipeline. Both endpoints return `WHATSAPP_NOT_CONNECTED` when the AI agent has no connected number.

## Listing templates

[List WhatsApp templates](/docs/api-v2/whatsapp/list-whatsapp-templates) returns every approved template across all of the AI agent's WhatsApp Business Accounts, together with the numbers you can send them from.

| Field | Meaning |
| - | - |
| `templates[].wabaId` | The Business Account the template belongs to. |
| `templates[].variables` | The values the template needs, grouped by component. |
| `senders[]` | The AI agent's connected numbers. Each entry carries the `from` value to send with, its `wabaId`, and the display name Meta verified. |
| `complete` | `false` when at least one Business Account could not be read. |
| `unavailableWabaIds` | The Business Accounts missing from an incomplete listing. Retry to pick them up. |

One Business Account failing does not fail the call, so check `complete` before treating the list as the full set.

## Selecting a template

Templates are addressed by name. `template.language` is optional when the name has one approved variant and required when it has several, which otherwise returns `TEMPLATE_LANGUAGE_REQUIRED`. Unapproved variants never make the choice ambiguous; when none is approved the send returns `TEMPLATE_NOT_APPROVED` with the review status in `details.status`.

A template whose buttons take a parameter cannot be sent from this API and returns `TEMPLATE_BUTTONS_UNSUPPORTED`:

| Button | Sendable |
| - | - |
| Quick reply | Yes |
| URL with a fixed address | Yes |
| URL containing a `{{1}}` placeholder | No |
| Copy code | No |
| One-time password | No |

Spot these before sending: in the listing, an unsendable URL button has a `{{...}}` placeholder in its `url`. Campaigns cannot send them either, so edit the template in WhatsApp Manager to use a fixed address, or send a variant without the button.

Templates with an image, video, or document header send the media approved with the template, so there is nothing to supply in the request. `MEDIA_UPLOAD_FAILED` means that media could not be uploaded to WhatsApp.

## Choosing the sender

| `from` | Connected numbers | Result |
| - | - | - |
| Omitted | Exactly one | That number sends. |
| Omitted | More than one | `PHONE_NUMBER_REQUIRED`. Pick a number from `senders`. |
| Provided | Any | Matched on digits, so `+1 415-555-2671` and `14155552671` are equivalent. No match returns `PHONE_NUMBER_NOT_FOUND`. |

A template is looked up on the Business Account of the number you send from, so pair the template's `wabaId` with a `senders` entry carrying the same `wabaId`. Sending from a number on a different account returns `TEMPLATE_NOT_FOUND` even though the template exists.

## Template variables

Each component numbers its placeholders from `{{1}}` independently, so values are grouped by component. A template whose header reads `Order {{1}}` and body reads `Hi {{1}}, arriving {{2}}` is listed as `{"header": ["1"], "body": ["1", "2"]}` and takes three values, the header's `1` being separate from the body's.

Send back exactly the keys the listing reported. For a named template, use the parameter names in place of the numbers. A value you leave out returns `MISSING_TEMPLATE_VARIABLES`, and one WhatsApp will not accept, meaning empty or containing a line break, a tab, or five or more consecutive spaces, returns `INVALID_TEMPLATE_VARIABLES`. Both name each slot as `component[key]`, such as `body[2]`.

## Delivery and conversations

Meta accepts sends from a blocked Business Account and drops them afterwards, reporting the reason only on a status webhook. Chatbase checks first, turning that silent loss into `SEND_BLOCKED` with the reason in `details.reason`. It is most often a billing problem: resolve it in WhatsApp Manager and sends resume within about a minute.

A `201` means WhatsApp accepted the message, not that it reached the recipient. It can still be dropped afterwards, most often because the recipient is not on WhatsApp, has blocked your business, or has already had its limit of marketing templates for the period. Match later webhooks against the returned `to`, which is the canonical WhatsApp id and can differ from what you sent.

`conversationId` is the conversation the recipient's replies continue in, and the template is appended to it unless a human has taken the conversation over or it has ended.

## Error codes

WhatsApp-specific error codes beyond the standard [authentication and rate-limiting errors](/docs/api-v2/error-handling):

<table>
  <thead>
    <tr>
      <th style={{ whiteSpace: 'nowrap' }}>Code</th>
      <th>HTTP</th>
      <th>Description</th>
    </tr>
  </thead>

  <tbody>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>WHATSAPP\_NOT\_CONNECTED</code></td><td>403</td><td>The AI agent has no connected WhatsApp number. Connect one from the deploy page.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>PHONE\_NUMBER\_REQUIRED</code></td><td>400</td><td>The AI agent has more than one connected number, so <code>from</code> must say which one sends.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>PHONE\_NUMBER\_NOT\_FOUND</code></td><td>404</td><td>No number connected to this AI agent matches <code>from</code>.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TEMPLATE\_NOT\_FOUND</code></td><td>404</td><td>No template with that name, and language when given, exists on the Business Account of the sending number. Check that the template's <code>wabaId</code> matches the sender's.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TEMPLATE\_LANGUAGE\_REQUIRED</code></td><td>400</td><td>The template name has more than one approved language variant. Pass <code>template.language</code>.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TEMPLATE\_NOT\_APPROVED</code></td><td>409</td><td>The template exists but has no approved variant to send. <code>details.status</code> carries the Meta review status.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>SEND\_BLOCKED</code></td><td>409</td><td>Meta has blocked business-initiated conversations for this Business Account. <code>details.reason</code> carries Meta's explanation.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>MISSING\_TEMPLATE\_VARIABLES</code></td><td>422</td><td>The template declares variables that were not provided. <code>details.missing</code> lists them as <code>component\[key]</code>.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>INVALID\_TEMPLATE\_VARIABLES</code></td><td>422</td><td>A value is empty, or contains a line break, a tab, or five or more consecutive spaces. <code>details.invalid</code> names each offending slot and why.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TEMPLATE\_BUTTONS\_UNSUPPORTED</code></td><td>422</td><td>The template has a button that takes a parameter, which this API cannot send. <code>details.buttons</code> lists the button types.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>TEMPLATE\_PARAMS\_REJECTED</code></td><td>422</td><td>WhatsApp rejected the parameters as not matching the approved template.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>RECIPIENT\_INVALID</code></td><td>422</td><td><code>to</code> is not a valid phone number for its country. Unassignable numbers, such as a <code>555</code> US area code, are rejected.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>RECIPIENT\_NOT\_REACHABLE</code></td><td>422</td><td>WhatsApp reported the recipient as undeliverable. The number may not be on WhatsApp or may have blocked business messages.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>MEDIA\_UPLOAD\_FAILED</code></td><td>502</td><td>The template has a media header and uploading its media to WhatsApp failed.</td></tr>
    <tr><td style={{ whiteSpace: 'nowrap' }}><code>WHATSAPP\_SEND\_FAILED</code></td><td>502</td><td>WhatsApp returned an error that does not map to a more specific code.</td></tr>
  </tbody>
</table>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.