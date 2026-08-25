const https = require('https');

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'GRO10X <gro10xnow@gmail.com>';

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
      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">GRO10X AI Growth Agency • Dhaka, Bangladesh</p>
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
          <a href="https://gro10x.ai/#services" style="background: linear-gradient(135deg, #00df89, #059669); color: #070b12; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            🚀 Explore Our Services & Solutions
          </a>
        </div>
      </div>

      <div style="font-size: 13px; color: #64748b; text-align: center;">
        <p style="margin: 4px 0;">Need immediate assistance? Reach our client desk:</p>
        <p style="margin: 4px 0;">📱 WhatsApp: <a href="https://wa.me/8801708459008" style="color: #00df89; text-decoration: none;">+880 1708 459008</a> | 📧 Email: <a href="mailto:gro10xnow@gmail.com" style="color: #00df89; text-decoration: none;">gro10xnow@gmail.com</a></p>
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
          <a href="https://wa.me/8801708459008?text=Hi%20GRO10X%20Team!%20Following%20up%20on%20my%20inquiry%20for%20${encodeURIComponent(svc)}" style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-right: 8px; margin-bottom: 8px;">
            📱 Chat on WhatsApp
          </a>
          <a href="https://gro10x.ai/#services" style="background: linear-gradient(135deg, #00df89, #059669); color: #070b12; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 8px;">
            🚀 See Our Services
          </a>
        </div>
      </div>

      <div style="font-size: 13px; color: #64748b; text-align: center;">
        <p style="margin: 4px 0;">Direct Contact: <a href="tel:+8801708459008" style="color: #00df89; text-decoration: none;">+880 1708 459008</a> | <a href="mailto:gro10xnow@gmail.com" style="color: #00df89; text-decoration: none;">gro10xnow@gmail.com</a></p>
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

module.exports = {
  sendEmail,
  sendClientOnboardingEmail,
  sendInvoiceEmail,
  sendLeadConfirmationEmail,
  sendLeadFollowUpEmail,
  sendDeliverableReadyEmail,
  sendPaymentReceiptEmail,
  sendTicketResolutionEmail
};


