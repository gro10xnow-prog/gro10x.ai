> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Help Page Proxy

This guide explains how to use rewrites (also known as proxies) to display your Chatbase help page on your own domain. This provides a seamless and professional experience for your users, as they can access help content without leaving your site.

The goal is to make your Chatbase help page, normally available at `https://chatbase.co/{agentId}/help`, appear on a path like `https://your-domain.com/help`.

<Note>
  This Help Page proxy method is a free way to show your Help Page on your own domain. It's separate from the Custom Domain add-on, which white-labels the embed script and iframe. If you already have the add-on, your custom domain applies to your Help Page automatically and you can skip these steps.
</Note>

## The Core Concept: Rewrites

A rewrite acts as a proxy. When a user visits the `source` path on your domain, your server fetches the content from the `destination` URL and serves it to the user. Crucially, the URL in the user's browser bar does not change.

* **Source**: The path on your website that you want to use.
* **Destination**: The full URL of your Chatbase help center.

<Note>
  Remember to replace `{agentId}` with your actual Chatbase Agent ID. You can find this ID under the AI agent’s **Settings → General → Agent details**.
</Note>

<Info>
  **Required Routes**

  For the help center to function correctly, you must proxy these paths:

  * `/help` and `/help/*` - The help center pages
  * `/__cb/*` - Static assets (JavaScript, CSS, images)
  * `/api/chat/{agentId}/*` - Chat API endpoints for features like lead submission

  Replace `{agentId}` with your actual Agent ID in all rules.
</Info>

## Implementation Examples

Choose the tab below that corresponds to your website's framework or hosting platform.

<Tabs>
  <Tab title="Next.js">
    For projects using the Next.js framework, you can configure rewrites in your `next.config.js` file. This is the recommended method for Next.js applications.

    1. Open or create the `next.config.js` file at the root of your project.
    2. Add the `rewrites` function to the configuration object.

    ```javascript theme={null}
    // next.config.js

    /** @type {import('next').NextConfig} */
    const nextConfig = {
      async rewrites() {
        return [
          {
            source: "/help",
            destination: "https://chatbase.co/{agentId}/help",
          },
          // This rule is needed to correctly proxy sub-pages of your help center.
          {
            source: "/help/:path*",
            destination: "https://chatbase.co/{agentId}/help/:path*",
          },
          // Proxy static assets (JavaScript, CSS, images)
          {
            source: "/__cb/:path*",
            destination: "https://chatbase.co/__cb/:path*",
          },
          // Proxy chat API endpoints for your agent
          {
            source: "/api/chat/{agentId}/:path*",
            destination: "https://chatbase.co/api/chat/{agentId}/:path*",
          },
        ];
      },
    };

    module.exports = nextConfig;
    ```

    After adding this configuration, restart your Next.js development server to apply the changes.
  </Tab>

  <Tab title="Vercel">
    If you host your site on Vercel (regardless of the framework), you can use a `vercel.json` file to configure rewrites at the platform level.

    1. Create a `vercel.json` file at the root of your project if it doesn't already exist.
    2. Add a `rewrites` array to the file.

    ```json theme={null}
    // vercel.json
    {
      "rewrites": [
        {
          "source": "/help",
          "destination": "https://chatbase.co/{agentId}/help"
        },
        {
          "source": "/help/:path*",
          "destination": "https://chatbase.co/{agentId}/help/:path*"
        },
        {
          "source": "/__cb/:path*",
          "destination": "https://chatbase.co/__cb/:path*"
        },
        {
          "source": "/api/chat/{agentId}/:path*",
          "destination": "https://chatbase.co/api/chat/{agentId}/:path*"
        }
      ]
    }
    ```

    Vercel will automatically apply these rules on your next deployment.
  </Tab>

  <Tab title="Netlify">
    For sites hosted on Netlify, you can configure rewrites in your `netlify.toml` file.

    1. Create or open the `netlify.toml` file at the root of your project.
    2. Add a `[[rewrites]]` rule.

    ```toml theme={null}
    # netlify.toml

    [[rewrites]]
      from = "/help/*"
      to = "https://chatbase.co/{agentId}/help/:splat"
      status = 200 # A 200 status indicates a rewrite, not a redirect

    [[rewrites]]
      from = "/help"
      to = "https://chatbase.co/{agentId}/help"
      status = 200

    # Proxy static assets (JavaScript, CSS, images)
    [[rewrites]]
      from = "/__cb/*"
      to = "https://chatbase.co/__cb/:splat"
      status = 200

    # Proxy chat API endpoints for your agent
    [[rewrites]]
      from = "/api/chat/{agentId}/*"
      to = "https://chatbase.co/api/chat/{agentId}/:splat"
      status = 200
    ```

    Commit and push this file to your repository, and Netlify will apply the rule on the next build.
  </Tab>

  <Tab title="Express (Node.js)">
    If you are running a custom Node.js server with Express, you can use the `http-proxy-middleware` package to create a rewrite.

    1. First, install the necessary packages:
       ```bash theme={null}
       npm install express http-proxy-middleware
       ```
    2. Then, set up the proxy in your Express application.

    ```javascript theme={null}
    // server.js
    const express = require("express");
    const { createProxyMiddleware } = require("http-proxy-middleware");

    const app = express();
    const PORT = process.env.PORT || 3000;

    // The agentId should be stored securely, e.g., in environment variables
    const AGENT_ID = process.env.CHATBASE_AGENT_ID || "{agentId}";

    // Proxy for help center pages
    const helpProxy = createProxyMiddleware({
      target: `https://chatbase.co`,
      changeOrigin: true,
      pathRewrite: {
        [`^/help`]: `/${AGENT_ID}/help`,
      },
      proxyTimeout: 5000,
    });

    // Proxy for static assets (JavaScript, CSS, images)
    const assetsProxy = createProxyMiddleware({
      target: `https://chatbase.co`,
      changeOrigin: true,
      proxyTimeout: 5000,
    });

    // Proxy for chat API endpoints (scoped to your agent only)
    const chatApiProxy = createProxyMiddleware({
      target: `https://chatbase.co`,
      changeOrigin: true,
      proxyTimeout: 5000,
    });

    // Apply proxies to routes
    app.use("/help", helpProxy);
    app.use("/__cb", assetsProxy);
    app.use(`/api/chat/${AGENT_ID}`, chatApiProxy);

    // Your other routes...
    app.get("/", (req, res) => {
      res.send("Your ACME Inc. Homepage");
    });

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
    ```
  </Tab>
</Tabs>

<Note>
  **Sitemaps**

  Your proxied help center content will not be automatically included in your primary domain's sitemap. You may need to add these URLs manually if SEO for your help content is a priority.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.