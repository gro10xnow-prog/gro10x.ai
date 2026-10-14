> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Webflow

> Embed your Chatbase AI agent on a Webflow site inside a container you control

## Overview

Adding your Chatbase AI agent to a Webflow site takes the iFrame embed code from your Chatbase dashboard plus a container on your page. The container matters: without one, the widget stretches the full width of the page.

<Card title="What you can do:" icon="comments">
  Put your AI agent in front of every visitor to your Webflow site, sized and placed exactly where you want it.
</Card>

## Before you start

* A Chatbase account with an AI agent. If you haven't built one yet, follow [Your first AI agent](/docs/user-guides/quick-start/your-first-agent).
* A Webflow site you can edit in the Designer.

## How to embed your AI agent

<Steps>
  <Step title="Copy your embed code">
    1. Go to the [dashboard](https://www.chatbase.co/dashboard/) of your Chatbase account.
    2. Click the AI agent you wish to integrate into your Webflow website.
    3. Click **Channels** in the left sidebar, then click **Manage** on the **Chat bubble** card (or **Setup**, if you haven't configured it yet).
    4. Click **Deploy** and select the **Website iFrame** embed type. Click **Copy** to copy the provided HTML code.

    <Frame>
      <img src="https://mintcdn.com/chatbase/DnMdgLj-7YGWYAcx/user-guides/integrations/images/Integrations/deploy-step.png?fit=max&auto=format&n=DnMdgLj-7YGWYAcx&q=85&s=31b0448df7dee6c3ccc65eaf9bb47879" alt="The Deploy step in the Chatbase dashboard" width="2524" height="1504" data-path="user-guides/integrations/images/Integrations/deploy-step.png" />
    </Frame>

    <Frame>
      <img src="https://mintcdn.com/chatbase/DnMdgLj-7YGWYAcx/user-guides/integrations/images/Integrations/iframe-embed.png?fit=max&auto=format&n=DnMdgLj-7YGWYAcx&q=85&s=aea38c13c9ed5f73151a530d81fc1a05" alt="Copying the iFrame embed code" width="2524" height="1504" data-path="user-guides/integrations/images/Integrations/iframe-embed.png" />
    </Frame>
  </Step>

  <Step title="Open your site in the Webflow Designer">
    Log into Webflow and go to your dashboard. Hover over the site you want to add the AI agent to and click **Open Designer**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/webflow/webflow-4.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=cd6378ed137ad41c072812736e9a0e82" alt="Opening a Webflow site in the Designer" width="1895" height="787" data-path="user-guides/integrations/images/webflow/webflow-4.png" />
    </Frame>

    Click the file icon (**Pages**) in the top-left corner and select the page you want to embed the AI agent on.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/webflow/webflow-5.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=2bcbb416bad4a995b5595fac62753347" alt="Selecting a page in the Webflow Designer" width="1916" height="870" data-path="user-guides/integrations/images/webflow/webflow-5.png" />
    </Frame>
  </Step>

  <Step title="Build a container for the widget">
    A container keeps the widget from spanning the entire width of the page.

    1. Click the plus button (**Add elements**) in the top-left corner of the Designer.
    2. Drag a **Section** element to the part of the page where you want the AI agent.
    3. Drag a **Container** element onto the Section.
    4. Drag a **Div** element onto the Container, and set its size so the AI agent stays contained.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/webflow/webflow-6.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=82b2a65aca954e3040343cf01da17de3" alt="Building a Section, Container, and Div in the Webflow Designer" width="1556" height="850" data-path="user-guides/integrations/images/webflow/webflow-6.png" />
    </Frame>
  </Step>

  <Step title="Add the Embed element and paste your code">
    Scroll down the list of elements and drag the **Embed** element onto the Div you just added.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/webflow/webflow-7.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=3239e49fdeb4063522786801ac3bc4e7" alt="Dragging the Embed element onto the Div in Webflow" width="1547" height="887" data-path="user-guides/integrations/images/webflow/webflow-7.png" />
    </Frame>

    Double-click the Embed element to open the HTML editor, paste your Chatbase embed code, and click **Save & Close**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/webflow/webflow-8.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=ea961278dcc7156a6a4515b970e1e3ae" alt="Pasting the embed code into the Webflow HTML editor" width="1593" height="888" data-path="user-guides/integrations/images/webflow/webflow-8.png" />
    </Frame>
  </Step>
</Steps>

<Check>
  You should see a preview of the AI agent on the live preview of your Webflow site, right inside the Designer.
</Check>

<Frame>
  <img src="https://mintcdn.com/chatbase/kU-6NVMb2BBkym9H/user-guides/integrations/images/webflow/webflow-9.png?fit=max&auto=format&n=kU-6NVMb2BBkym9H&q=85&s=2ef514e68cf1b721cd392ee18fd63b81" alt="The Chatbase AI agent previewing inside the Webflow Designer" width="684" height="685" data-path="user-guides/integrations/images/webflow/webflow-9.png" />
</Frame>

## Troubleshooting

<AccordionGroup>
  <Accordion title="The embed or AI agent element is the wrong size">
    **Possible cause:** Webflow's layout components take some getting used to, and the Embed element inherits its size from the Div you placed it in.

    **Solution:** adjust the size of the Div that wraps the Embed element. Webflow's [official documentation on the Embed element](https://university.webflow.com/lesson/custom-code-embed?topics=elements) covers embedding third-party tools in more detail.
  </Accordion>
</AccordionGroup>

<Note>
  You can customize the appearance and colors of your AI agent on your Chatbase dashboard. Go to your **dashboard**, choose an AI agent, click **Channels** in the left sidebar, click **Manage** on the **Chat bubble** card, then open the **Display** tab to edit Content, Capabilities, Colors, Floating bubble, and Localization.
</Note>

## Next steps

<Card icon="palette" href="/docs/user-guides/chatbot/channels#chat-bubble-display" title="Customize the chat bubble">
  Match the widget to your brand colors, position, and copy.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.