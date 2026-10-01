const https = require('https');

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'GRO10X <gro10xnow@gmail.com>';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const AGENCY_WHATSAPP = process.env.AGENCY_WHATSAPP || '+880 1711-019550';
const AGENCY_WHATSAPP_CLEAN = AGENCY_WHATSAPP.replace(/[^0-9]/g, '');

/**
 * Sends an email via Resend HTTP API
 */
async function sendEmail({ to, subject, html, text }) {
  if (!RESEND_API_KEY) {
    console.warn('[Resend Service] Warning: RESEND_API_KEY is not set in environment. Email simulated.');
    return {
      success: true,
      simulated: true,
      to,
      subject,
      timestamp: new Date().toISOString()
    };
  }

  const payload = JSON.stringify({
    from: FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: html || text,
    text: text || undefined
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, data });
            } else {
              console.error('[Resend Error]', data);
              resolve({ success: false, error: data });
            }
          } catch (e) {
            resolve({ success: false, error: body });
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error('[Resend Request Error]', err);
      resolve({ success: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Send Client Workspace Magic Link Onboarding Email
 */
async function sendClientOnboardingEmail({ clientName, email, magicLink }) {
  const subject = `Welcome to GRO10X — Your Brand Partner Portal Access`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
      <h1 style="color: #00df89;">⚡ Welcome to GRO10X</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Dear <strong>${clientName}</strong> Team,</p>
      <p style="font-size: 15px; color: #94a3b8;">We are thrilled to partner with your brand. Access your dedicated Client Partner Portal to review AI deliverables, sprint reviews, approve content, and view invoices.</p>
      
      <div style="margin: 25px 0;">
        <a href="${magicLink}" style="background: linear-gradient(135deg, #00df89, #059669); color: #070b12; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          🤝 Launch Client Partner Portal
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b;">Direct URL: <a href="${magicLink}" style="color: #00df89;">${magicLink}</a></p>
      <div style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">
        <p style="margin: 4px 0;">Dedicated Executive Desk: <a href="https://wa.me/${AGENCY_WHATSAPP_CLEAN}" style="color: #00df89; text-decoration: none;">${AGENCY_WHATSAPP}</a> | <a href="mailto:gro10xnow@gmail.com" style="color: #00df89; text-decoration: none;">gro10xnow@gmail.com</a></p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 11px; margin: 0;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

async function sendInvoiceEmail({ invoice }) {
  const email = invoice.clientEmail;
  if (!email) return { success: false, error: 'No client email provided.' };
  
  const issueDate = invoice.issueDate || new Date().toISOString();
  const dateStr = new Date(issueDate).toLocaleDateString();
  const amtStr = Number(invoice.amount).toLocaleString();

  const subject = `Invoice ${invoice.id || ''} from GRO10X`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width:600px; margin: 0 auto;">
      <h1 style="color: #00df89; margin-top:0;">GRO10X</h1>
      <h2 style="color: #fff;">Invoice ${invoice.id || ''}</h2>
      
      <p style="font-size: 16px; color: #cbd5e1;">Dear <strong>${invoice.clientName || 'Valued Client'}</strong>,</p>
      <p style="font-size: 15px; color: #94a3b8;">This is a notification for your recent invoice.</p>
      
      <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0;">
        <div style="margin-bottom: 8px;"><strong>Invoice Date:</strong> ${dateStr}</div>
        <div style="margin-bottom: 8px;"><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Due on receipt'}</div>
        <div style="margin-bottom: 8px;"><strong>Description:</strong> ${invoice.description || 'Marketing Services'}</div>
        <div style="font-size: 18px; color: #10b981; margin-top: 15px;"><strong>Total Amount: BDT ৳${amtStr}</strong></div>
      </div>
      
      <p style="font-size: 14px; color: #94a3b8;">You can view and download the PDF copy of this invoice directly from your Client Portal.</p>
      
      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Proposal Request Confirmation Email to Prospect
 */
async function sendLeadConfirmationEmail({ contactPerson, email, service, company }) {
  if (!email || !email.includes('@') || email.includes('lead.com')) {
    return { success: false, reason: 'Invalid or placeholder email' };
  }
  const subject = `We've received your proposal request — GRO10X`;
  const name = contactPerson || company || 'there';
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px;">⚡</span>
        <h1 style="color: #00df89; margin: 8px 0 0 0; font-size: 24px;">GRO10X</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">AI-First Growth Agency & Multi-Engine Ecosystem</p>
      </div>

      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(0, 223, 137, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Proposal Request Received ✅</h2>
        <p style="color: #cbd5e1; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px;">Thank you for reaching out to GRO10X. We have received your inquiry for <strong>${service || 'Growth Services'}</strong>${company ? ` on behalf of <strong>${company}</strong>` : ''}.</p>
        
        <div style="background: rgba(0, 223, 137, 0.08); border-left: 3px solid #00df89; padding: 12px 16px; margin: 18px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #e2e8f0;">⚡ <strong>Next Step:</strong> Our Account Director will review your requirements and reach out via WhatsApp/Call within <strong>2 business hours</strong>.</p>
        </div>

        <p style="color: #94a3b8; font-size: 13px;">Meanwhile, feel free to explore our growth engines and live case studies:</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://gro10x-ai.vercel.app/#services" style="background: linear-gradient(135deg, #00df89, #059669); color: #070b12; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            🚀 Explore Our Services & Solutions
          </a>
        </div>
      </div>

      <div style="font-size: 13px; color: #64748b; text-align: center;">
        <p style="margin: 4px 0;">Need immediate assistance? Reach our client desk:</p>
        <p style="margin: 4px 0;">📱 WhatsApp: <a href="https://wa.me/${AGENCY_WHATSAPP_CLEAN}" style="color: #00df89; text-decoration: none;">${AGENCY_WHATSAPP}</a> | 📧 Email: <a href="mailto:gro10xnow@gmail.com" style="color: #00df89; text-decoration: none;">gro10xnow@gmail.com</a></p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 11px; margin: 0;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send 24-Hour Warm Follow-Up Email to Prospect
 */
async function sendLeadFollowUpEmail({ contactPerson, email, service, company }) {
  if (!email || !email.includes('@') || email.includes('lead.com')) {
    return { success: false, reason: 'Invalid or placeholder email' };
  }
  const svc = service || 'your growth project';
  const subject = `Still thinking about ${svc}? We're here when you're ready — GRO10X`;
  const name = contactPerson || company || 'there';
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px;">⚡</span>
        <h1 style="color: #00df89; margin: 8px 0 0 0; font-size: 24px;">GRO10X</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">AI-First Growth Agency & Multi-Engine Ecosystem</p>
      </div>

      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(0, 223, 137, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Checking In on Your Project 🎯</h2>
        <p style="color: #cbd5e1; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px;">We wanted to quickly follow up on your recent inquiry regarding <strong>${svc}</strong>${company ? ` for <strong>${company}</strong>` : ''}.</p>
        
        <p style="color: #94a3b8; font-size: 14px;">Whether you're looking for AI web/mobile development, synthetic media & video, or full brand scaling — our engineering and strategy teams are ready to craft a tailored roadmap for your business.</p>

        <div style="background: rgba(0, 223, 137, 0.08); border-left: 3px solid #00df89; padding: 12px 16px; margin: 18px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #e2e8f0;">💬 <strong>Quick Consultation:</strong> Have 10 minutes to discuss your goals or request custom package pricing?</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://wa.me/${AGENCY_WHATSAPP_CLEAN}?text=Hi%20GRO10X%20Team!%20Following%20up%20on%20my%20inquiry%20for%20${encodeURIComponent(svc)}" style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-right: 8px; margin-bottom: 8px;">
            📱 Chat on WhatsApp
          </a>
          <a href="https://gro10x-ai.vercel.app/#services" style="background: linear-gradient(135deg, #00df89, #059669); color: #070b12; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 8px;">
            🚀 See Our Services
          </a>
        </div>
      </div>

      <div style="font-size: 13px; color: #64748b; text-align: center;">
        <p style="margin: 4px 0;">Direct Contact: <a href="tel:+${AGENCY_WHATSAPP_CLEAN}" style="color: #00df89; text-decoration: none;">${AGENCY_WHATSAPP}</a> | <a href="mailto:gro10xnow@gmail.com" style="color: #00df89; text-decoration: none;">gro10xnow@gmail.com</a></p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 11px; margin: 0;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Deliverable Ready for Review Email to Client Partner
 */
async function sendDeliverableReadyEmail({ clientEmail, clientName, taskTitle, reviewUrl }) {
  if (!clientEmail || !clientEmail.includes('@')) {
    return { success: false, reason: 'No valid client email' };
  }
  const url = reviewUrl || 'https://gro10x-ai.vercel.app/client#review';
  const subject = `Creative Deliverable Ready for Review: ${taskTitle} — GRO10X`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: #00df89; margin-top:0;">🎬 Deliverable Ready for Review</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Dear <strong>${clientName || 'Valued Partner'}</strong>,</p>
      <p style="font-size: 15px; color: #94a3b8;">Your project deliverable for <strong>${taskTitle}</strong> is now live in your Review Room.</p>
      <p style="font-size: 14px; color: #94a3b8;">You can view the assets, leave timecoded feedback directly on the canvas, or give final 1-click approval.</p>
      
      <div style="margin: 25px 0; text-align: center;">
        <a href="${url}" style="background: linear-gradient(135deg, #00df89, #059669); color: #070b12; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          👁️ Open Review Room
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
    </div>
  `;
  return sendEmail({ to: clientEmail, subject, html });
}

/**
 * Send Payment Verified Confirmation Receipt Email
 */
async function sendPaymentReceiptEmail({ clientEmail, clientName, invoiceId, amount, transactionId }) {
  if (!clientEmail || !clientEmail.includes('@')) {
    return { success: false, reason: 'No valid client email' };
  }
  const amtStr = Number(amount || 0).toLocaleString();
  const subject = `Payment Confirmation Receipt — Invoice ${invoiceId || ''}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: #10b981; margin-top:0;">✅ Payment Verified & Received</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Dear <strong>${clientName || 'Valued Partner'}</strong>,</p>
      <p style="font-size: 15px; color: #94a3b8;">We have verified and recorded your payment for Invoice <strong>${invoiceId || 'N/A'}</strong>.</p>
      
      <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0;">
        <div style="margin-bottom: 8px;"><strong>Invoice:</strong> ${invoiceId || 'N/A'}</div>
        <div style="margin-bottom: 8px;"><strong>Transaction / TrxID:</strong> ${transactionId || 'Verified'}</div>
        <div style="font-size: 18px; color: #10b981; margin-top: 10px;"><strong>Amount Paid: BDT ৳${amtStr}</strong></div>
      </div>

      <p style="font-size: 14px; color: #94a3b8;">Your account status has been updated in your Client Portal.</p>
      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
    </div>
  `;
  return sendEmail({ to: clientEmail, subject, html });
}

/**
 * Send Support Ticket Resolved Email
 */
async function sendTicketResolutionEmail({ clientEmail, clientName, ticketTitle, ticketId, resolutionNotes }) {
  if (!clientEmail || !clientEmail.includes('@')) {
    return { success: false, reason: 'No valid client email' };
  }
  const subject = `Support Ticket Resolved: ${ticketId || ''} - ${ticketTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: #00df89; margin-top:0;">🔧 Support Ticket Resolved</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Dear <strong>${clientName || 'Partner'}</strong>,</p>
      <p style="font-size: 15px; color: #94a3b8;">Your support request <strong>"${ticketTitle}"</strong> (${ticketId || ''}) has been marked as resolved.</p>
      
      ${resolutionNotes ? `<div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin: 15px 0;"><strong>Resolution Notes:</strong> ${resolutionNotes}</div>` : ''}

      <p style="font-size: 14px; color: #94a3b8;">If you need any further assistance, feel free to reply directly to this email or reach out to your Account Manager.</p>
      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
    </div>
  `;
  return sendEmail({ to: clientEmail, subject, html });
}

/**
 * Send DCE Digital Product Delivery Email
 */
async function sendDigitalDeliveryEmail({ customerEmail, customerName, brandName, productTitle, sku, licenseKey, downloadUrl, expiresAt }) {
  if (!customerEmail || !customerEmail.includes('@')) {
    return { success: false, reason: 'No valid customer email' };
  }
  const name = customerName || 'Valued Customer';
  const brand = brandName || 'GRO10X Brand';
  const expiryText = expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Lifetime Access';
  const url = downloadUrl || 'https://gro10x-ai.vercel.app/dce/download';
  const subject = `🎉 Your ${brand} Order is Ready — Download Inside!`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #0b0f19; color: #f3f4f6; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px;">⚡</span>
        <h1 style="color: #6366f1; margin: 8px 0 0 0; font-size: 24px;">${brand}</h1>
        <p style="color: #9ca3af; font-size: 13px; margin: 4px 0 0 0;">Digital Asset Delivery</p>
      </div>

      <div style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #10b981; font-size: 18px; margin-top: 0;">Order Confirmed & Ready ✅</h2>
        <p style="color: #e5e7eb; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #9ca3af; font-size: 14px;">Your digital product <strong>"${productTitle || 'Digital Order'}"</strong> is ready for instant download.</p>

        <div style="background: #090e17; border: 1px dashed #374151; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <div style="margin-bottom: 8px; font-size: 13px; color: #9ca3af;">
            <strong style="color: #f3f4f6;">📦 SKU Code:</strong> <code style="color: #38bdf8; font-family: monospace;">${sku || 'N/A'}</code>
          </div>
          <div style="margin-bottom: 8px; font-size: 13px; color: #9ca3af;">
            <strong style="color: #f3f4f6;">🔑 License Key:</strong> <code style="color: #ec4899; font-family: monospace;">${licenseKey || 'AUTO-ACTIVATED'}</code>
          </div>
          <div style="font-size: 13px; color: #9ca3af;">
            <strong style="color: #f3f4f6;">⏰ Access Horizon:</strong> <span style="color: #10b981;">${expiryText}</span>
          </div>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            📥 Download / Access Your Product
          </a>
        </div>

        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 16px;">
          Need help? Reply to this email or visit our helpdesk.
        </p>
      </div>

      <div style="font-size: 12px; color: #6b7280; text-align: center;">
        <p style="margin: 0;">${brand} • Powered by GRO10X Digital Commerce Engine</p>
      </div>
    </div>
  `;

  return sendEmail({ to: customerEmail, subject, html });
}

/**
 * Send DCE License Renewal Reminder Email
 */
async function sendRenewalReminderEmail({ customerEmail, customerName, brandName, productTitle, sku, daysRemaining, renewalUrl }) {
  if (!customerEmail || !customerEmail.includes('@')) {
    return { success: false, reason: 'No valid customer email' };
  }
  const name = customerName || 'Valued Customer';
  const brand = brandName || 'GRO10X Brand';
  const url = renewalUrl || 'https://gro10x-ai.vercel.app/dce/renew';
  const subject = `⏳ Your ${brand} Access Expires in ${daysRemaining} Days — Renew Now`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #0b0f19; color: #f3f4f6; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px;">⏳</span>
        <h1 style="color: #f59e0b; margin: 8px 0 0 0; font-size: 24px;">${brand} Renewal</h1>
        <p style="color: #9ca3af; font-size: 13px; margin: 4px 0 0 0;">Subscription Retention Alert</p>
      </div>

      <div style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #f59e0b; font-size: 18px; margin-top: 0;">Access Expiring Soon ⚠️</h2>
        <p style="color: #e5e7eb; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #9ca3af; font-size: 14px;">Your subscription for <strong>"${productTitle || 'Digital License'}"</strong> (${sku || ''}) will expire in <strong>${daysRemaining} days</strong>.</p>
        
        <p style="color: #9ca3af; font-size: 14px;">Renew today to ensure uninterrupted access to all templates, updates, and cloud vault assets.</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            🔄 1-Click Renew Subscription
          </a>
        </div>
      </div>

      <div style="font-size: 12px; color: #6b7280; text-align: center;">
        <p style="margin: 0;">${brand} • Powered by GRO10X Digital Commerce Engine</p>
      </div>
    </div>
  `;

  return sendEmail({ to: customerEmail, subject, html });
}

/**
 * Send Service Case Study & Architecture Blueprint Delivery Email upon Lead Capture
 */
async function sendServiceAssetDeliveryEmail({ email, contactPerson, serviceName, productCode, slidesUrl, blueprintUrl, audioUrl }) {
  if (!email || !email.includes('@') || email.includes('lead.com')) {
    return { success: false, reason: 'Invalid or placeholder email' };
  }

  const name = contactPerson || 'there';
  const svcName = serviceName || 'AI Growth Sprint Architecture';
  const subject = `Your Requested Architecture Blueprint & Case Study: ${svcName} — GRO10X`;

  const sUrl = slidesUrl || 'https://gro10x-ai.vercel.app/assets/case-studies/overview.pdf';
  const bUrl = blueprintUrl || 'https://gro10x-ai.vercel.app/assets/blueprints/system.pdf';
  const aUrl = audioUrl || 'https://open.spotify.com/show/gro10x-ai-case-studies';

  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px;">⚡</span>
        <h1 style="color: #00df89; margin: 8px 0 0 0; font-size: 24px;">GRO10X</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">AI Architecture & Sprint Engineering</p>
      </div>

      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(0, 223, 137, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Here Are Your Requested Assets 📂</h2>
        <p style="color: #cbd5e1; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px;">Thank you for your interest in <strong>${svcName}</strong>. As promised, here are the direct links to examine our production architecture and case study breakdown:</p>
        
        <div style="margin: 20px 0; background: rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 16px;">
          <div style="margin-bottom: 12px;">
            <a href="${sUrl}" style="color: #00df89; font-weight: bold; text-decoration: none; font-size: 15px;">📄 Download 10-Slide Case Study Deck (PDF) &rarr;</a>
          </div>
          <div style="margin-bottom: 12px;">
            <a href="${bUrl}" style="color: #38bdf8; font-weight: bold; text-decoration: none; font-size: 15px;">🛠️ View Full Architecture Blueprint Diagram (PDF) &rarr;</a>
          </div>
          <div>
            <a href="${aUrl}" style="color: #a855f7; font-weight: bold; text-decoration: none; font-size: 15px;">🎙️ Listen to Two-Host Audio Breakdown (Spotify) &rarr;</a>
          </div>
        </div>

        <div style="background: rgba(0, 223, 137, 0.08); border-left: 3px solid #00df89; padding: 12px 16px; margin: 18px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #e2e8f0;">⚡ <strong>Need this deployed for your team?</strong> Our standard sprint framework delivers production MVP builds in <strong>14 days</strong> with 100% full source code transfer.</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://wa.me/${AGENCY_WHATSAPP_CLEAN}?text=Hi%20Tanvir!%20I%20reviewed%20the%20${encodeURIComponent(svcName)}%20blueprint%20and%20want%20to%20discuss%20a%20build." style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-right: 8px; margin-bottom: 8px;">
            📱 Chat on WhatsApp
          </a>
          <a href="https://gro10x-ai.vercel.app/services/${productCode || 'SVC-001'}" style="background: linear-gradient(135deg, #00df89, #059669); color: #070b12; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 8px;">
            🚀 Service Scope & Pricing
          </a>
        </div>
      </div>

      <div style="font-size: 13px; color: #64748b; text-align: center;">
        <p style="margin: 4px 0;">Direct Contact: <a href="tel:+${AGENCY_WHATSAPP_CLEAN}" style="color: #00df89; text-decoration: none;">${AGENCY_WHATSAPP}</a> | <a href="mailto:gro10xnow@gmail.com" style="color: #00df89; text-decoration: none;">gro10xnow@gmail.com</a></p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 11px; margin: 0;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Proposal Acceptance Confirmation & Onboarding Cockpit Launch Email
 */
async function sendProposalAcceptedClientEmail({ clientName, email, projectTitle, proposalId, onboardingUrl, invoiceUrl, currency, amount }) {
  if (!email || !email.includes('@') || email.includes('example.com') || email.includes('.test')) {
    return { success: false, reason: 'Invalid or placeholder client email' };
  }

  const name = clientName || 'Partner';
  const title = projectTitle || 'AI Sprint Solution';
  const propId = proposalId || 'PROP-2026';
  const curr = currency || 'BDT';
  const amtFormatted = amount ? Number(amount).toLocaleString() : null;
  const launchUrl = onboardingUrl || 'https://gro10x-ai.vercel.app/client#lockin';
  const invUrl = invoiceUrl || 'https://gro10x-ai.vercel.app/client#invoices';
  const subject = `🎉 Proposal Executed & Workspace Active: ${title} [${propId}] — GRO10X`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 620px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px;">⚡</span>
        <h1 style="color: #00df89; margin: 8px 0 0 0; font-size: 26px;">GRO10X</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Autonomous Enterprise AI Ecosystem & Solutions</p>
      </div>

      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(0, 223, 137, 0.25); border-radius: 12px; padding: 26px; margin-bottom: 24px;">
        <div style="display: inline-block; padding: 4px 12px; background: rgba(0, 223, 137, 0.15); border: 1px solid rgba(0, 223, 137, 0.4); border-radius: 6px; color: #00df89; font-size: 12px; font-weight: 700; margin-bottom: 12px;">
          SOW SIGNED & CONFIRMED
        </div>
        <h2 style="color: #f8fafc; font-size: 20px; margin: 0 0 12px 0;">Welcome to Your Dedicated Client Workspace!</h2>
        <p style="color: #cbd5e1; font-size: 15px;">Dear <strong>${name}</strong> Team,</p>
        <p style="color: #94a3b8; font-size: 14px;">Your digital SOW proposal for <strong>${title}</strong> (Ref: <code>${propId}</code>) has been successfully executed.</p>
        
        <div style="background: rgba(0, 0, 0, 0.25); border-radius: 8px; padding: 16px; margin: 18px 0;">
          <div style="margin-bottom: 8px; font-size: 14px; color: #cbd5e1;">📋 <strong>Project:</strong> ${title}</div>
          ${amtFormatted ? `<div style="margin-bottom: 8px; font-size: 14px; color: #cbd5e1;">💳 <strong>Milestone Deposit:</strong> ${curr} ${amtFormatted}</div>` : ''}
          <div style="font-size: 14px; color: #cbd5e1;">🛡️ <strong>Governance:</strong> 30-Day Defect-Free Bug Fix Warranty & Dedicated SLA Active</div>
        </div>

        <p style="color: #94a3b8; font-size: 14px;">Your dedicated Project Lock-In & Handover Cockpit is now provisioned with 1-click tokenized entry. No password creation required:</p>

        <div style="text-align: center; margin: 26px 0;">
          <a href="${launchUrl}" style="background: linear-gradient(135deg, #00df89, #059669); color: #070b12; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; margin-bottom: 10px;">
            🚀 Launch Project Handover Cockpit ➔
          </a>
          <br>
          <a href="${invUrl}" style="color: #38bdf8; text-decoration: none; font-size: 13px; font-weight: 600;">
            View Settlement Invoice & Bank Settlement Rails &rarr;
          </a>
        </div>
      </div>

      <div style="font-size: 13px; color: #64748b; text-align: center;">
        <p style="margin: 4px 0;">Dedicated Executive Desk: <a href="https://wa.me/${AGENCY_WHATSAPP_CLEAN}" style="color: #00df89; text-decoration: none;">${AGENCY_WHATSAPP}</a> | <a href="mailto:gro10xnow@gmail.com" style="color: #00df89; text-decoration: none;">gro10xnow@gmail.com</a></p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 11px; margin: 0;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Sprint Sign-off & 30-Day Warranty Certificate Email
 */
async function sendSprintSignOffCertificateEmail({ clientEmail, clientName, projectName, warrantyUntil, invoiceId, handoverUrl }) {
  if (!clientEmail || !clientEmail.includes('@')) {
    return { success: false, reason: 'No valid client email' };
  }
  const url = handoverUrl || 'https://gro10x-ai.vercel.app/client#review';
  const subject = `🛡️ Sprint Sign-Off & 30-Day Warranty Certificate: ${projectName || 'AI Solution'} — GRO10X`;
  const formattedExpiry = warrantyUntil ? new Date(warrantyUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Days from today';
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: #10b981; margin-top:0;">🛡️ Milestone Sign-Off & Warranty Certificate</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Dear <strong>${clientName || 'Valued Partner'}</strong>,</p>
      <p style="font-size: 15px; color: #94a3b8;">This certifies formal sign-off, commercial completion, and milestone acceptance for <strong>${projectName || 'Sprint Deliverable'}</strong>.</p>
      
      <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); padding: 18px; border-radius: 10px; margin: 20px 0;">
        <div style="margin-bottom: 8px;"><strong>Project Deliverable:</strong> ${projectName || 'Sprint Solution'}</div>
        <div style="margin-bottom: 8px;"><strong>Defect-Free Warranty Shield:</strong> Active (30 Days Zero-Cost Remediation)</div>
        <div style="margin-bottom: 8px;"><strong>Warranty Valid Until:</strong> <span style="color:#34d399; font-weight:bold;">${formattedExpiry}</span></div>
        ${invoiceId ? `<div><strong>Milestone Invoice Reference:</strong> ${invoiceId}</div>` : ''}
      </div>

      <p style="font-size: 14px; color: #94a3b8;">Full intellectual property (IP) transfer and verified production artifacts are accessible via your Client Portal Review Room.</p>

      <div style="margin: 25px 0; text-align: center;">
        <a href="${url}" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          📜 Inspect Signed Handover Cockpit
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
    </div>
  `;
  return module.exports.sendEmail({ to: clientEmail, subject, html });
}

/**
 * 1. Send Staff / Crew Invitation & Temporary PIN Access Card Email
 */
async function sendStaffInvitationEmail({ name, email, phone, pin, portalUrl }) {
  if (!email || !email.includes('@')) {
    return { success: false, reason: 'Invalid email' };
  }
  const url = portalUrl || 'https://gro10x-ai.vercel.app/crew';
  const subject = `🚀 Welcome to GRO10X: Your Workspace Access Credentials & Temporary PIN`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: #00df89; margin-top:0;">⚡ Welcome to GRO10X Team Workspace</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Hello <strong>${name || 'Team Member'}</strong>,</p>
      <p style="font-size: 15px; color: #94a3b8;">You have been officially invited to join the GRO10X Production & Operations Engine. Here are your access credentials:</p>
      
      <div style="background: rgba(0,223,137,0.08); border: 1px solid rgba(0,223,137,0.3); padding: 18px; border-radius: 10px; margin: 20px 0;">
        <div style="margin-bottom: 8px;"><strong>Authorized Mobile:</strong> <code>${phone || 'Registered Phone'}</code></div>
        <div style="margin-bottom: 8px;"><strong>Temporary 4-Digit PIN:</strong> <span style="font-size: 20px; font-weight: bold; color: #00df89; letter-spacing: 2px;">${pin || '****'}</span></div>
        <div style="font-size: 12px; color: #94a3b8;">* Please change your temporary PIN upon first login or complete the 3-stage onboarding wizard.</div>
      </div>

      <div style="margin: 25px 0; text-align: center;">
        <a href="${url}" style="background: linear-gradient(135deg, #00df89, #059669); color: #070b12; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          🔑 Launch Staff Cockpit
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X Autonomous Agency OS • Dhaka, Bangladesh</p>
    </div>
  `;
  return module.exports.sendEmail({ to: email, subject, html });
}

/**
 * 2. Send PIN Reset / Security Credential Alert Email
 */
async function sendPinResetAlertEmail({ name, email, phone, pin, portalUrl }) {
  if (!email || !email.includes('@')) {
    return { success: false, reason: 'Invalid email' };
  }
  const url = portalUrl || 'https://gro10x-ai.vercel.app/crew';
  const subject = `🔒 Security Alert: Your GRO10X Login PIN Was Reset`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: #f59e0b; margin-top:0;">🔒 Security Alert: PIN Updated</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Hello <strong>${name || 'Team Member'}</strong>,</p>
      <p style="font-size: 15px; color: #94a3b8;">Your account login PIN for <strong>${phone || 'your phone'}</strong> has been reset by HR / Executive Operations.</p>
      
      <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); padding: 18px; border-radius: 10px; margin: 20px 0;">
        <div style="margin-bottom: 8px;"><strong>New Login PIN:</strong> <span style="font-size: 20px; font-weight: bold; color: #f59e0b; letter-spacing: 2px;">${pin || '****'}</span></div>
        <div style="font-size: 12px; color: #94a3b8;">If you did not request this change, please immediately contact your Department Lead.</div>
      </div>

      <div style="margin: 25px 0; text-align: center;">
        <a href="${url}" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #070b12; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          🔐 Sign In with New PIN
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X Autonomous Agency OS • Dhaka, Bangladesh</p>
    </div>
  `;
  return module.exports.sendEmail({ to: email, subject, html });
}

/**
 * 3. Send Leave Request Approval / Rejection Email
 */
async function sendLeaveDecisionEmail({ name, email, leaveType, startDate, endDate, status, reviewerName, reason }) {
  if (!email || !email.includes('@')) {
    return { success: false, reason: 'Invalid email' };
  }
  const isApproved = status === 'Approved' || status === 'Owner Approved';
  const color = isApproved ? '#10b981' : '#ef4444';
  const icon = isApproved ? '✅' : '❌';
  const subject = `${icon} Leave Request ${status}: ${leaveType || 'Time Off'} (${startDate} to ${endDate})`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: ${color}; margin-top:0;">${icon} Leave Request ${status}</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Hello <strong>${name || 'Team Member'}</strong>,</p>
      <p style="font-size: 15px; color: #94a3b8;">Your leave request has been reviewed by <strong>${reviewerName || 'Department Manager'}</strong>.</p>
      
      <div style="background: rgba(255,255,255,0.05); border: 1px solid ${color}; padding: 18px; border-radius: 10px; margin: 20px 0;">
        <div style="margin-bottom: 8px;"><strong>Leave Type:</strong> ${leaveType || 'General Leave'}</div>
        <div style="margin-bottom: 8px;"><strong>Duration:</strong> ${startDate} to ${endDate}</div>
        <div style="margin-bottom: 8px;"><strong>Decision Status:</strong> <span style="color: ${color}; font-weight: bold;">${status}</span></div>
        ${reason ? `<div><strong>Notes / Reason:</strong> ${reason}</div>` : ''}
      </div>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X Autonomous Agency OS • Dhaka, Bangladesh</p>
    </div>
  `;
  return module.exports.sendEmail({ to: email, subject, html });
}

/**
 * 4. Send Expense Reimbursement Decision Email
 */
async function sendExpenseDecisionEmail({ name, email, title, amount, status, reviewerName, category }) {
  if (!email || !email.includes('@')) {
    return { success: false, reason: 'Invalid email' };
  }
  const isApproved = status === 'Approved' || status === 'Disbursed' || status.includes('Approved');
  const color = isApproved ? '#10b981' : '#ef4444';
  const icon = isApproved ? '💰' : '⚠️';
  const subject = `${icon} Expense Claim ${status}: ${title || 'Reimbursement'} (BDT ${Number(amount || 0).toLocaleString()})`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: ${color}; margin-top:0;">${icon} Expense Claim ${status}</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Hello <strong>${name || 'Team Member'}</strong>,</p>
      <p style="font-size: 15px; color: #94a3b8;">Your expense reimbursement claim has been reviewed by <strong>${reviewerName || 'Finance Controller'}</strong>.</p>
      
      <div style="background: rgba(255,255,255,0.05); border: 1px solid ${color}; padding: 18px; border-radius: 10px; margin: 20px 0;">
        <div style="margin-bottom: 8px;"><strong>Expense Title:</strong> ${title || 'Operational Outlay'}</div>
        <div style="margin-bottom: 8px;"><strong>Category:</strong> ${category || 'General'}</div>
        <div style="margin-bottom: 8px;"><strong>Claim Amount:</strong> ৳${Number(amount || 0).toLocaleString()} BDT</div>
        <div><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${status}</span></div>
      </div>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X Autonomous Agency OS • Dhaka, Bangladesh</p>
    </div>
  `;
  return module.exports.sendEmail({ to: email, subject, html });
}

/**
 * 5. Send Monthly Payslip Delivery Email
 */
async function sendPayslipDeliveryEmail({ name, email, month, netSalary, payslipId, baseSalary, bonus, commissions }) {
  if (!email || !email.includes('@')) {
    return { success: false, reason: 'Invalid email' };
  }
  const subject = `💸 Official Monthly Earnings Statement (${month || 'Salary'}): BDT ${Number(netSalary || 0).toLocaleString()} — GRO10X`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: #00df89; margin-top:0;">💸 Monthly Salary Disbursed</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Dear <strong>${name || 'Specialist'}</strong>,</p>
      <p style="font-size: 15px; color: #94a3b8;">Your official monthly remuneration statement for <strong>${month || 'this cycle'}</strong> has been finalized and disbursed.</p>
      
      <div style="background: rgba(0,223,137,0.08); border: 1px solid rgba(0,223,137,0.3); padding: 18px; border-radius: 10px; margin: 20px 0;">
        <div style="margin-bottom: 8px;"><strong>Payslip Reference:</strong> <code>${payslipId || 'PAY-N/A'}</code></div>
        <div style="margin-bottom: 8px;"><strong>Base Remuneration:</strong> ৳${Number(baseSalary || 0).toLocaleString()} BDT</div>
        ${bonus ? `<div style="margin-bottom: 8px;"><strong>Performance Bonus:</strong> +৳${Number(bonus).toLocaleString()} BDT</div>` : ''}
        ${commissions ? `<div style="margin-bottom: 8px;"><strong>Project Commissions:</strong> +৳${Number(commissions).toLocaleString()} BDT</div>` : ''}
        <div style="margin-top: 12px; font-size: 18px; font-weight: bold; color: #00df89;">
          Total Net Disbursed: ৳${Number(netSalary || 0).toLocaleString()} BDT
        </div>
      </div>

      <div style="margin: 25px 0; text-align: center;">
        <a href="https://gro10x-ai.vercel.app/crew#payslips" style="background: linear-gradient(135deg, #00df89, #059669); color: #070b12; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          📄 Download Detailed PDF Statement
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X Autonomous Agency OS • Dhaka, Bangladesh</p>
    </div>
  `;
  return module.exports.sendEmail({ to: email, subject, html });
}

module.exports = {
  sendEmail,
  sendClientOnboardingEmail,
  sendInvoiceEmail,
  sendLeadConfirmationEmail,
  sendLeadFollowUpEmail,
  sendDeliverableReadyEmail,
  sendPaymentReceiptEmail,
  sendTicketResolutionEmail,
  sendDigitalDeliveryEmail,
  sendRenewalReminderEmail,
  sendServiceAssetDeliveryEmail,
  sendProposalAcceptedClientEmail,
  sendSprintSignOffCertificateEmail,
  sendStaffInvitationEmail,
  sendPinResetAlertEmail,
  sendLeaveDecisionEmail,
  sendExpenseDecisionEmail,
  sendPayslipDeliveryEmail
};



