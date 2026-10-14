> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# WhatsApp Templates

> Create approved WhatsApp message templates in WhatsApp Manager and send them from the Chatbase Helpdesk

## Overview

WhatsApp message templates are pre-approved messages required by Meta to contact customers outside the 24-hour conversation window. When a customer hasn't messaged you in the last 24 hours, you must use an approved template to re-initiate the conversation.

Chatbase supports **Utility**, **Authentication**, and **Marketing** templates. All template categories can be sent from both the Helpdesk and [Outbound Campaigns](/docs/user-guides/chatbot/outbound-campaigns).

<Card title="What you can do:" icon="paper-plane">
  Reach a customer after their 24-hour reply window has closed, with a template Meta has already approved and variables filled in from the ticket.
</Card>

## Before you start

* A connected WhatsApp integration in Chatbase. If you haven't connected one, follow the [WhatsApp integration setup guide](/docs/user-guides/integrations/whatsapp) first.
* Access to [WhatsApp Manager](https://business.facebook.com/wa/manage/message-templates/)
* An approved WhatsApp Business Account

## Creating a template in WhatsApp Manager

<Steps>
  <Step title="Open Message Templates">
    Navigate to [WhatsApp Manager](https://business.facebook.com/wa/manage/message-templates/) and open **Message Templates**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/QRzUu31T0Hw8fzLf/user-guides/integrations/images/whatsapp-templates/meta-1-message-templates.png?fit=max&auto=format&n=QRzUu31T0Hw8fzLf&q=85&s=c2c2a997fddc580927e2823cd8106745" alt="WhatsApp Manager Message Templates page" width="1481" height="781" data-path="user-guides/integrations/images/whatsapp-templates/meta-1-message-templates.png" />
    </Frame>
  </Step>

  <Step title="Create the template">
    Click **Create Template**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/QRzUu31T0Hw8fzLf/user-guides/integrations/images/whatsapp-templates/meta-2-create-template.png?fit=max&auto=format&n=QRzUu31T0Hw8fzLf&q=85&s=9c67f83893e7ccd45eb25d3b3ca401e5" alt="Click Create Template" width="1481" height="781" data-path="user-guides/integrations/images/whatsapp-templates/meta-2-create-template.png" />
    </Frame>
  </Step>

  <Step title="Choose a category">
    Choose a template category:

    * **Utility**: for order updates, account notifications, and transaction confirmations
    * **Authentication**: for verification codes and login confirmations

    <Frame>
      <img src="https://mintcdn.com/chatbase/QRzUu31T0Hw8fzLf/user-guides/integrations/images/whatsapp-templates/meta-3-choose-category.png?fit=max&auto=format&n=QRzUu31T0Hw8fzLf&q=85&s=f4cb052fcf538e942cd32c18bfa44d6b" alt="Choose template category" width="1479" height="923" data-path="user-guides/integrations/images/whatsapp-templates/meta-3-choose-category.png" />
    </Frame>

    <Info>
      All template categories (**Utility**, **Authentication**, and **Marketing**) can be used in both the Helpdesk and [Outbound Campaigns](/docs/user-guides/chatbot/outbound-campaigns).
    </Info>
  </Step>

  <Step title="Name the template and pick a language">
    Enter a name for your template and select the language.

    <Frame>
      <img src="https://mintcdn.com/chatbase/QRzUu31T0Hw8fzLf/user-guides/integrations/images/whatsapp-templates/meta-4-name-and-language.png?fit=max&auto=format&n=QRzUu31T0Hw8fzLf&q=85&s=2e82be59e2bf4256447455520cebb710" alt="Enter template name and select language" width="1471" height="629" data-path="user-guides/integrations/images/whatsapp-templates/meta-4-name-and-language.png" />
    </Frame>
  </Step>

  <Step title="Write the body text">
    Write your template body text. You can include variables such as `{{1}}` and `{{2}}`, which are filled in when sending the template from Chatbase.

    <Frame>
      <img src="https://mintcdn.com/chatbase/QRzUu31T0Hw8fzLf/user-guides/integrations/images/whatsapp-templates/meta-5-body-text.png?fit=max&auto=format&n=QRzUu31T0Hw8fzLf&q=85&s=9261966cf48774f38c60955bc14271c9" alt="Write template body text" width="1471" height="850" data-path="user-guides/integrations/images/whatsapp-templates/meta-5-body-text.png" />
    </Frame>
  </Step>

  <Step title="Submit for review">
    Click **Submit for Review**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/QRzUu31T0Hw8fzLf/user-guides/integrations/images/whatsapp-templates/meta-6-submit-review.png?fit=max&auto=format&n=QRzUu31T0Hw8fzLf&q=85&s=b9ff34ecddd4ad06c4f3a9de129a2f3e" alt="Submit template for review" width="1481" height="1343" data-path="user-guides/integrations/images/whatsapp-templates/meta-6-submit-review.png" />
    </Frame>

    <Info>
      Meta reviews templates before they can be used. The review usually takes a few minutes, but can take longer. Your template must be approved before it appears in Chatbase.
    </Info>

    <Frame>
      <img src="https://mintcdn.com/chatbase/QRzUu31T0Hw8fzLf/user-guides/integrations/images/whatsapp-templates/meta-7-submit-review.png?fit=max&auto=format&n=QRzUu31T0Hw8fzLf&q=85&s=bd3a30938868fbcf0249dd3dafced851" alt="Template submitted for review" width="1485" height="893" data-path="user-guides/integrations/images/whatsapp-templates/meta-7-submit-review.png" />
    </Frame>
  </Step>
</Steps>

<Tip>
  To improve your chances of approval, keep your message clear and concise, avoid promotional language, and clearly specify the transactional or authentication purpose of the template.
</Tip>

<Warning>
  Meta charges fees for each template message sent. Fees vary by country and template category. See [Meta's WhatsApp pricing](https://developers.facebook.com/docs/whatsapp/pricing) for current rates.
</Warning>

## Sending a template from the Helpdesk

Once your template is approved in Meta, you can use it to message customers from the Chatbase Helpdesk.

<Steps>
  <Step title="Open the Helpdesk inbox">
    <Frame>
      <img src="https://mintcdn.com/chatbase/QRzUu31T0Hw8fzLf/user-guides/integrations/images/whatsapp-templates/helpdesk-1-inbox.png?fit=max&auto=format&n=QRzUu31T0Hw8fzLf&q=85&s=4c6f67613a624275424211af5b3c72b6" alt="Helpdesk inbox" width="257" height="481" data-path="user-guides/integrations/images/whatsapp-templates/helpdesk-1-inbox.png" />
    </Frame>
  </Step>

  <Step title="Open a WhatsApp ticket">
    Navigate to or open a WhatsApp ticket with the contact you want to message.

    <Frame>
      <img src="https://mintcdn.com/chatbase/BFVaHeOgBCVjN9KO/user-guides/integrations/images/whatsapp-templates/helpdesk-2-conversation.png?fit=max&auto=format&n=BFVaHeOgBCVjN9KO&q=85&s=eb543eb6582716dbb954c3d1f0b901d7" alt="Open a WhatsApp ticket with a contact" width="1427" height="442" data-path="user-guides/integrations/images/whatsapp-templates/helpdesk-2-conversation.png" />
    </Frame>
  </Step>

  <Step title="Choose a template">
    When the 24-hour reply window has closed, you'll see a notice that sending messages is no longer allowed. Click **Choose template**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/QRzUu31T0Hw8fzLf/user-guides/integrations/images/whatsapp-templates/helpdesk-3-select-template.png?fit=max&auto=format&n=QRzUu31T0Hw8fzLf&q=85&s=ab6878809ff2c4b2d2ad689652505153" alt="WhatsApp ticket showing the expired 24-hour window notice with Choose template button" width="787" height="222" data-path="user-guides/integrations/images/whatsapp-templates/helpdesk-3-select-template.png" />
    </Frame>

    Browse your approved templates in the picker. You can search by name and filter by category: **Marketing**, **Utility**, or **Authentication**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/BFVaHeOgBCVjN9KO/user-guides/integrations/images/whatsapp-templates/helpdesk-template-picker.png?fit=max&auto=format&n=BFVaHeOgBCVjN9KO&q=85&s=b5bb5810402ec55b38239a7881f05536" alt="Template picker dialog showing search bar, category filter, and template grid" width="1202" height="928" data-path="user-guides/integrations/images/whatsapp-templates/helpdesk-template-picker.png" />
    </Frame>
  </Step>

  <Step title="Map the variables">
    Select a template. If it includes variables such as `{{name}}`, an inline editor appears where you map each variable to a value. Click a variable token to open the mapping popover:

    * **Customer field**: pulls from the ticket customer's data (name, email, or phone number).
    * **Free text**: enter a static value manually.

    <Frame>
      <img src="https://mintcdn.com/chatbase/BFVaHeOgBCVjN9KO/user-guides/integrations/images/whatsapp-templates/helpdesk-template-variables.png?fit=max&auto=format&n=BFVaHeOgBCVjN9KO&q=85&s=6919a11e96932851497051b5d102d719" alt="Inline template editor showing variable mapping popover with customer fields and free text options" width="621" height="490" data-path="user-guides/integrations/images/whatsapp-templates/helpdesk-template-variables.png" />
    </Frame>

    Fill in each variable. The popover shows the customer's resolved values next to each field so you can pick the right one. You can also type a custom value in the free text input and click **Use**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/BFVaHeOgBCVjN9KO/user-guides/integrations/images/whatsapp-templates/helpdesk-template-variables-filled.png?fit=max&auto=format&n=BFVaHeOgBCVjN9KO&q=85&s=89bedeb7dfab800f508994464b1e48ca" alt="Variable mapping popover with a value filled in" width="683" height="483" data-path="user-guides/integrations/images/whatsapp-templates/helpdesk-template-variables-filled.png" />
    </Frame>
  </Step>

  <Step title="Preview and send">
    Once all variables are filled in, preview the final message and click **Send**.

    <Frame>
      <img src="https://mintcdn.com/chatbase/BFVaHeOgBCVjN9KO/user-guides/integrations/images/whatsapp-templates/helpdesk-template-ready.png?fit=max&auto=format&n=BFVaHeOgBCVjN9KO&q=85&s=8304baf908fbb39558b14ee0776a1051" alt="Template with all variables filled in and Send button enabled" width="657" height="419" data-path="user-guides/integrations/images/whatsapp-templates/helpdesk-template-ready.png" />
    </Frame>

    The template message appears in the conversation thread. If the 24-hour window is still closed, you can send another template or wait for the customer to reply.

    <Frame>
      <img src="https://mintcdn.com/chatbase/BFVaHeOgBCVjN9KO/user-guides/integrations/images/whatsapp-templates/helpdesk-template-sent.png?fit=max&auto=format&n=BFVaHeOgBCVjN9KO&q=85&s=517c30ee5de54ea973443150c4553e9d" alt="Sent template message in the conversation thread with the expired window banner below" width="670" height="596" data-path="user-guides/integrations/images/whatsapp-templates/helpdesk-template-sent.png" />
    </Frame>
  </Step>
</Steps>

<Info>
  **Understanding the 24-hour window:** WhatsApp allows free-form messaging only within 24 hours of the customer's last message. After that window expires, you must use an approved template to re-initiate the conversation. Once the customer replies, the 24-hour window resets and you can send free-form messages again.
</Info>

<Warning>
  Make sure you've added a payment method in your [Meta billing settings](https://business.facebook.com/billing_hub). Without one, template messages may fail to send.
</Warning>

## Limitations

* **Templates must be approved by Meta** before they appear in Chatbase.
* **Meta charges per template message sent,** with fees varying by country and category.
* **Free-form messaging only works inside the 24-hour window.** Outside it, a template is the only way to reach the customer.

## Troubleshooting

<AccordionGroup>
  <Accordion title="Template not appearing in Chatbase">
    **Possible cause:** the template hasn't been fully approved in Meta.

    **Solution:** check the approval status in WhatsApp Manager. All template categories (Utility, Authentication, and Marketing) are available in both the Helpdesk and [Outbound Campaigns](/docs/user-guides/chatbot/outbound-campaigns) once approved.
  </Accordion>

  <Accordion title="Message failed to send">
    **Possible causes:**

    * The contact doesn't have a valid WhatsApp phone number
    * No payment method is configured in Meta billing

    **Solutions:**

    * Confirm the contact's WhatsApp phone number is valid
    * Add a payment method in your [Meta billing settings](https://business.facebook.com/billing_hub)
  </Accordion>
</AccordionGroup>

## Next steps

<Card icon="bullhorn" href="/docs/user-guides/chatbot/outbound-campaigns" title="Outbound Campaigns">
  Send approved templates to many contacts at once, rather than one ticket at a time.
</Card>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.