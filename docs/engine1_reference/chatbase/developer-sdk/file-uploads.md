> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# File Uploads

> Let visitors upload files from a widget straight to your own endpoint, then use the uploaded file URLs in the widget.

A widget can accept files from the visitor and send them to an endpoint you control. Chatbase never stores or proxies the bytes. The visitor's browser sends each file directly to your URL as a `multipart/form-data` request, and the widget keeps a record of every file so you can show it, react to it, or pass its URL to another function.

Two pieces work together:

* An **Upload file** function that holds your endpoint URL, the file constraints, and what happens after each file finishes. Configure it on the **Functions** tab. See [Functions](/docs/developer-guides/widgets/functions#function-types).
* A `Dropzone` or `FileInput` component in the widget code that collects the files and shows their progress. See [Form Inputs](/docs/developer-guides/widgets/components/form-inputs#dropzone).

## Set Up an Upload

<Steps>
  <Step title="Add a Dropzone or FileInput to the code">
    Give it a `name` and point `uploadAction` at the function you create in the next step.

    ```jsx theme={null}
    <Card>
      <Col gap={3}>
        <Title value="Upload a photo" size="sm" />
        <Dropzone name="photos" uploadAction={{ functionName: "uploadPhoto" }} />
        <Image src={photos[0].url} />
      </Col>
    </Card>
    ```

    The `name` becomes a variable holding the list of files, so `photos[0].url` is the URL of the first uploaded file once your endpoint returns it.
  </Step>

  <Step title="Create the function">
    On the **Functions** tab, add a function named `uploadPhoto` and set its type to **Upload file**. Enter your endpoint under **Endpoint**, choose `POST` or `PUT`, and set **URL field** to the path in your JSON response that holds the file's URL, for example `data.url`.
  </Step>

  <Step title="Allow the request on your server">
    Your endpoint must accept multipart uploads and allow CORS from `https://www.chatbase.co`. The widget runs inside the Chatbase chat iframe, so that is the request's origin wherever your site embeds the agent, and it is also where the builder preview runs. If you serve the agent from a [custom domain](/docs/developer-guides/custom-domains), allow that domain as well. See [Your Endpoint](#your-endpoint).
  </Step>

  <Step title="Try it in the preview">
    Drop a file on the preview. Uploads in the builder go to your real endpoint with the function's current settings, so you can see the success and error rows before you save.
  </Step>
</Steps>

## How an Upload Runs

1. The visitor drops or picks files. Each file is checked against the function's **Accepted types**, **Max size**, and **Max files** before anything is sent. A file that fails becomes an error row with the reason, for example **This file type is not accepted**.
2. Each accepted file is sent in its own request, up to three at a time. The row shows a progress bar.
3. A `2xx` response marks the file as uploaded. If **URL field** is set, the URL is read from the JSON body at that path. Any **Return fields** you listed are kept on the file record too.
4. A non-`2xx` response marks the file as failed. The row shows the response's status text, such as **Internal Server Error**, and offers a retry. The response body is never shown to the visitor.
5. After each file settles, the function's **On success (per file)** or **On failure (per file)** action runs.

<Warning>
  If you set **URL field** and a `2xx` response has no string at that path, the file is marked as failed with **Upload succeeded but the response had no file URL at "data.url"**. Only set **URL field** when your endpoint returns a URL. Without it, a `2xx` counts as success and `file.url` stays empty.
</Warning>

## Your Endpoint

Each request is a `multipart/form-data` `POST` or `PUT` containing:

* Any **Form fields** you configured, appended first.
* The file, under the part name in **File field**. The default is `file`. The original filename is preserved.
* Your **Headers** and **Query parameters**, with [template tokens](/docs/developer-guides/widgets/functions#template-tokens) resolved.

Do not set a `Content-Type` header. The browser sets it so the multipart boundary is correct, and the builder blocks saving with **Remove the Content-Type header, the browser sets it**.

Tokens available in the URL, headers, query parameters and form fields: every widget variable, `{{user}}` fields, `{{conversationId}}`, `{{chatbotId}}`, `{{widgetId}}`, and `{{file.name}}`, `{{file.size}}`, `{{file.type}}` for the file being sent.

A minimal Express endpoint:

```js theme={null}
import cors from 'cors'
import express from 'express'
import multer from 'multer'

const upload = multer({ limits: { fileSize: 30 * 1024 * 1024 } })
const app = express()

app.use(cors({ origin: ['https://www.chatbase.co', 'https://chat.example.com'] }))

app.post('/uploads', upload.single('file'), async (req, res) => {
  const url = await storeSomewhere(req.file)
  res.json({ url })
})
```

With that response, set **URL field** to `url`. Drop `chat.example.com` from the origin list if you do not use a custom domain.

## Use the Uploaded Files

Every file becomes a record in the widget's data under the component's `name`:

```json theme={null}
{
  "name": "invoice.pdf",
  "size": 48213,
  "type": "application/pdf",
  "status": "success",
  "url": "https://files.example.com/invoice.pdf",
  "error": null,
  "response": { "id": "abc123" }
}
```

`status` is one of `staged`, `uploading`, `success`, or `error`. `response` holds the **Return fields** you chose.

Some ways to use the records:

* Show the first image: `<Image src={photos[0].url} />`.
* Copy a URL into another variable with an **On success (per file)** action of type **Set variables**: set `heroSrc` to `{{file.url}}`.
* Show a state only after an upload succeeded, with a [state condition](/docs/developer-guides/widgets/states) like `photos && photos.some(f => f.status === 'success')`.
* Send the URLs to another API with a Server Function whose body references `{{photos}}`.

In the per-file actions, the tokens `{{file.url}}`, `{{file.name}}`, `{{file.error}}` and every **Return field** are available.

<Note>
  Uploaded file URLs and return fields are stored with the conversation and are included in conversation webhooks. Return URLs you are comfortable keeping there. A short-lived signed URL will stop working in the conversation history once it expires.
</Note>

## Trigger Uploads From a Button

A plain `Button` or a `Form` can point at an upload function too. Set the function's **Target field** to the variable that should hold the records, because a button has no `name` of its own.

* If the field already holds staged files (from a `Dropzone` or `FileInput` with `autoUpload={false}`), the button uploads them.
* Otherwise clicking the button opens the visitor's file picker and uploads whatever they choose.

```jsx theme={null}
<Col gap={2}>
  <FileInput name="documents" autoUpload={false} uploadAction={{ functionName: "uploadDocs" }} />
  <Button label="Upload" onClickAction={{ functionName: "uploadDocs", loadingBehavior: "self" }} />
</Col>
```

Here **Target field** on `uploadDocs` must be `documents`. The builder blocks saving otherwise.

When the form's `onSubmitAction` is the same upload function the field's `uploadAction` names, staged files satisfy `required`.

## Limits

| Limit | Value |
| - | - |
| Maximum file size | 30 MB per file, whatever **Max size** says. The default is 10 MB. |
| Maximum files per field | 5, whatever **Max files** says. The default is 5. |
| Files uploaded at once | 3 per batch. |
| Methods | `POST` or `PUT`. |
| URL | Must start with `https://` or `http://`. |
| Blocked file types | Executables, installers, scripts and similar are always rejected by extension, for example `.exe`, `.bat`, `.cmd`, `.msi`, `.apk`, `.dll`, `.jar`, `.ps1`. **Accepted types** cannot re-allow them. |

Files that were still uploading when the visitor reloads the page are dropped from the widget. Finished and failed files stay.

<Note>
  The size check happens in the browser before any bytes are sent. Your endpoint should enforce its own limit as well.
</Note>

## Secure Your Endpoint

The upload request comes from the visitor's browser, not from Chatbase. Anyone who can open your chat can find the URL and send requests to it, so treat it as a public endpoint.

<AccordionGroup>
  <Accordion title="Rate limit it">
    Limit requests per client, and return `429 Too Many Requests` when the limit is hit. The widget shows the status text to the visitor and offers a retry, so a clear status text helps.

    Two keys work well together. The limiter runs after the multipart parser so the form field is available:

    * **Per IP**, to stop simple floods.
    * **Per conversation**, so one visitor cannot exhaust the limit for everyone behind the same network. Add a **Form field** such as `conversationId` = `{{conversationId}}` and key the limit on it. Chatbase caps each upload field at 5 files, so a legitimate visitor rarely sends more than a handful of requests per conversation.

    ```js theme={null}
    import rateLimit from 'express-rate-limit'

    const uploadLimiter = rateLimit({
      windowMs: 60 * 1000,
      limit: 10,
      keyGenerator: (req) => req.body?.conversationId || req.ip,
      message: 'Too Many Requests'
    })

    app.post('/uploads', upload.single('file'), uploadLimiter, handler)
    ```
  </Accordion>

  <Accordion title="Never put a secret in the headers">
    Header and query parameter values are sent from the browser, so the visitor can read them. The builder says so under **Headers**. Use a public, scoped key, or hand out a short-lived token:

    1. Add a **Server Function** that asks your API for an upload token and returns it as a **Return field**, with an **On Success** action that sets a variable such as `uploadToken`.
    2. Reference it in the upload function's **Headers** as `Bearer {{uploadToken}}`.
    3. Have the token expire after a few minutes and accept only uploads.
  </Accordion>

  <Accordion title="Validate on the server, not just in the widget">
    The **Accepted types**, **Max size** and blocked extensions are checked in the browser and are easy to bypass. On the server, check the size again, detect the file type from its content rather than its extension or the client's `Content-Type`, and reject anything you do not expect with a `4xx`.
  </Accordion>

  <Accordion title="Restrict CORS to the origins you use">
    Allow only `https://www.chatbase.co` and your custom agent domain if you have one. The request never comes from the site that embeds the chat, because the widget runs inside the Chatbase iframe. Avoid `Access-Control-Allow-Origin: *` on an endpoint that accepts writes, and answer `OPTIONS` preflight requests with the method and headers you actually use.
  </Accordion>

  <Accordion title="Store files out of your web root">
    Write uploads to object storage or a dedicated bucket, generate your own filenames instead of trusting the client's, and return a URL from there. Scan files with your malware tooling before making the URL public if visitors can upload arbitrary types.
  </Accordion>
</AccordionGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.