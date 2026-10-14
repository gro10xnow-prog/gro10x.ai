> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom Domains

> On this page, you can configure your AI agent to integrate with your own domain. This allows you to hide the Chatbase branding, making it appear as if the AI agent is built entirely by your workspace rather than using a third-party tool.

<Frame>
  <img src="https://mintcdn.com/chatbase/bzvM1Aviavze3DyS/developer-guides/images/settings-20.png?fit=max&auto=format&n=bzvM1Aviavze3DyS&q=85&s=e06a79314eaeee2d9a9b11ede949bcf1" alt="Chatbase Embed Code Example" width="1728" height="732" data-path="developer-guides/images/settings-20.png" />
</Frame>

To set this up, enter the desired URL for your bot, and then configure a DNS record with your provider. Common DNS providers include Cloudflare, OpenDNS, and Quad9.

You will need to add a CNAME record with the specific values provided on the custom domain page in your dashboard. Please note that it may take up to 6 hours for the records to fully propagate and update.

### What "Custom Domain" Means on Chatbase?

When we say you can add a custom domain, it means you can host your AI agent on a subdomain that belongs to your company or brand, instead of Chatbase's default domain. For example, instead of your AI agent appearing on a URL like chatbase.co/yourbot, it could be hosted on yourbot.yourdomain.com.

This feature enhances your brand's professionalism and trustworthiness by keeping everything under your domain.

By adding a custom subdomain:

1. Your AI agent becomes an integrated part of your website.
2. Visitors' traffic requests won't be redirected to an external Chatbase URL.
3. It improves the user experience with consistent branding across your website and AI agent interactions.

### Step-by-Step Guide to Adding a Custom Subdomain to Your AI agent on Chatbase

1. **Log Into Your Chatbase Account**\
   First, sign in to your Chatbase account using your credentials. If you don't have an account yet, you can easily create one by following the sign-up process on the website.

<Frame>
  <img src="https://mintcdn.com/chatbase/bzvM1Aviavze3DyS/developer-guides/images/settings-21.png?fit=max&auto=format&n=bzvM1Aviavze3DyS&q=85&s=96946bc2d08c5ae6b6ffc3c34a79dab6" alt="Chatbase Embed Code Example" width="1105" height="168" data-path="developer-guides/images/settings-21.png" />
</Frame>

2. **Navigate to Your AI agent Settings**\
   Once you're logged in, locate the AI agent you want to associate with a custom subdomain. This could be a newly created bot or an existing one.

   Open the AI agent, then click **Settings** in the left sidebar.

<Frame>
  <img src="https://mintcdn.com/chatbase/bzvM1Aviavze3DyS/developer-guides/images/settings-22.png?fit=max&auto=format&n=bzvM1Aviavze3DyS&q=85&s=a6073f0eaac35133ced04f58cfba04dc" alt="Chatbase Embed Code Example" width="1100" height="167" data-path="developer-guides/images/settings-22.png" />
</Frame>

3. **Locate the Domain Customization Option**\
   In the Settings tab bar, select **Custom domains**.

<Frame>
  <img src="https://mintcdn.com/chatbase/bzvM1Aviavze3DyS/developer-guides/images/settings-23.png?fit=max&auto=format&n=bzvM1Aviavze3DyS&q=85&s=af915a7a441a201ecd66765730ba273e" alt="Chatbase Embed Code Example" width="1101" height="169" data-path="developer-guides/images/settings-23.png" />
</Frame>

4. **Enter Your Custom Subdomain**\
   This is where you type in the subdomain (e.g., support.yourbusiness.com) that you own or have control over. Chatbase currently supports subdomains only, so you'll need to ensure you're using a subdomain on your website.

   Adding a custom subdomain gives your AI agent a professional look by branding it with your website's URL instead of Chatbase's default domain.

5. **Configure DNS Settings**\
   You might need to configure additional DNS settings like CNAME records. This step will link the custom subdomain to your AI agent, ensuring it works correctly when users visit the URL.

   Chatbase will provide specific DNS instructions for setting this up, which usually includes pointing the subdomain to Chatbase's servers.

6. **Save and Test Your AI agent**\
   Once you've successfully configured the domain settings and DNS records, save your changes.

   It may take some time for the changes to propagate across the web (usually within a few minutes to 24 hours).

   Test the custom subdomain by entering it into a browser to ensure your AI agent loads correctly.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.