> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Authentication

> How to authenticate with the Chatbase API v2 using Bearer tokens, and understand rate limiting.

## Bearer Token Authentication

All API v2 endpoints (except the health check) require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <api-key>
```

### Getting an API Key

1. Go to the [Chatbase Dashboard](https://www.chatbase.co/dashboard)
2. Go to **Workspace settings** → **API keys**
3. Click **Create API Key**
4. Copy and securely store the generated key

<Warning>
  API keys grant full access to your workspace. Never expose them in client-side code, public repositories, or browser network requests.
</Warning>

<Note>
  API v2 requires a Chatbase Standard Plan or above. Requests from accounts on unsupported plans will be rejected.
</Note>

### Example Request

```bash theme={null}
curl -X POST 'https://www.chatbase.co/api/v2/agents/YOUR_AGENT_ID/chat' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Hello!"}'
```

## Rate Limiting

The API enforces a rate limit of **100 requests per 10-second sliding window**, scoped per API key and IP address.

### Rate Limit Headers

Every response includes rate limit headers so you can track your usage:

| Header | Description |
| - | - |
| `X-RateLimit-Limit` | Maximum number of requests allowed in the window (100). |
| `X-RateLimit-Remaining` | Number of requests remaining in the current window. |
| `X-RateLimit-Reset` | Unix timestamp in milliseconds when the current window resets. |
| `Retry-After` | Seconds to wait before retrying. Only present on `429` responses. |

### Handling Rate Limits

When you exceed the rate limit, the API returns a `429` status code:

```json theme={null}
{
  "error": {
    "code": "RATE_LIMIT_TOO_MANY_REQUESTS",
    "message": "Too many requests, please try again later"
  }
}
```

Use the `Retry-After` header to determine how long to wait before retrying:

```javascript theme={null}
async function fetchWithRetry(url, options) {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After"), 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return fetchWithRetry(url, options);
  }

  return response;
}
```

## Request ID

Every response includes an `x-request-id` header containing a unique identifier for the request. When contacting support about an error, always include this value to help with debugging.

```
x-request-id: req_a1b2c3d4e5f6
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.