const https = require('https');

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Purplebot Digital <contact@purplebot.digital>';

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
  const subject = `Welcome to Purplebot Digital — Your Brand Partner Portal Access`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
      <h1 style="color: #c084fc;">🔮 Welcome to Purplebot Digital Agency</h1>
      <p style="font-size: 16px; color: #cbd5e1;">Dear <strong>${clientName}</strong> Team,</p>
      <p style="font-size: 15px; color: #94a3b8;">We are thrilled to partner with your brand. Access your dedicated Client Partner Portal to review 4K video deliverables, approve content, and view invoices.</p>
      
      <div style="margin: 25px 0;">
        <a href="${magicLink}" style="background: linear-gradient(135deg, #7c3aed, #ec4899); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          🤝 Launch Client Partner Portal
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b;">Direct URL: <a href="${magicLink}" style="color: #a855f7;">${magicLink}</a></p>
      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #64748b;">Purplebot Digital Limited • Banani & Niketon, Dhaka, Bangladesh</p>
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

  const subject = `Invoice ${invoice.id || ''} from Purplebot Digital`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width:600px; margin: 0 auto;">
      <h1 style="color: #c084fc; margin-top:0;">Purplebot Digital</h1>
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
      <p style="font-size: 12px; color: #64748b;">Purplebot Digital Limited • Banani & Niketon, Dhaka, Bangladesh</p>
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
  const subject = `We've received your proposal request — Purplebot Digital`;
  const name = contactPerson || company || 'there';
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px;">💜</span>
        <h1 style="color: #c084fc; margin: 8px 0 0 0; font-size: 24px;">Purplebot Digital</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Award-Winning Digital Marketing & Tech Agency</p>
      </div>

      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Proposal Request Received ✅</h2>
        <p style="color: #cbd5e1; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px;">Thank you for reaching out to Purplebot Digital. We have received your inquiry for <strong>${service || 'Agency Services'}</strong>${company ? ` on behalf of <strong>${company}</strong>` : ''}.</p>
        
        <div style="background: rgba(168, 85, 247, 0.08); border-left: 3px solid #c084fc; padding: 12px 16px; margin: 18px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #e2e8f0;">⚡ <strong>Next Step:</strong> Our Account Director will review your requirements and reach out via WhatsApp/Call within <strong>2 business hours</strong>.</p>
        </div>

        <p style="color: #94a3b8; font-size: 13px;">Meanwhile, feel free to explore our latest campaigns and client showreels:</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://gro10x-ai.vercel.app/#portfolio" style="background: linear-gradient(135deg, #7c3aed, #ec4899); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            🚀 Explore Our Work & Case Studies
          </a>
        </div>
      </div>

      <div style="font-size: 13px; color: #64748b; text-align: center;">
        <p style="margin: 4px 0;">Need immediate assistance? Reach our client desk:</p>
        <p style="margin: 4px 0;">📱 WhatsApp: <a href="https://wa.me/8801711019550" style="color: #c084fc; text-decoration: none;">+88 01711 019550</a> | 📧 Email: <a href="mailto:contact@purplebot.digital" style="color: #c084fc; text-decoration: none;">contact@purplebot.digital</a></p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 11px; margin: 0;">Purplebot Digital Limited • Banani & Niketon, Dhaka, Bangladesh</p>
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
  const svc = service || 'your marketing campaign';
  const subject = `Still thinking about ${svc}? We're here when you're ready — Purplebot Digital`;
  const name = contactPerson || company || 'there';
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px;">💜</span>
        <h1 style="color: #c084fc; margin: 8px 0 0 0; font-size: 24px;">Purplebot Digital</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Award-Winning Digital Marketing & Tech Agency</p>
      </div>

      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Checking In on Your Project 🎯</h2>
        <p style="color: #cbd5e1; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px;">We wanted to quickly follow up on your recent inquiry regarding <strong>${svc}</strong>${company ? ` for <strong>${company}</strong>` : ''}.</p>
        
        <p style="color: #94a3b8; font-size: 14px;">Whether you're looking for commercial TVCs, viral short-form reels, a full brand overhaul, or tech development — our production and strategy teams are ready to craft a tailored execution roadmap for your budget.</p>

        <div style="background: rgba(168, 85, 247, 0.08); border-left: 3px solid #c084fc; padding: 12px 16px; margin: 18px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #e2e8f0;">💬 <strong>Quick Consultation:</strong> Have 10 minutes to discuss your timeline or request custom package pricing?</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://wa.me/8801711019550?text=Hi%20Purplebot%20Team!%20Following%20up%20on%20my%20inquiry%20for%20${encodeURIComponent(svc)}" style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-right: 8px; margin-bottom: 8px;">
            📱 Chat on WhatsApp
          </a>
          <a href="https://gro10x-ai.vercel.app/#portfolio" style="background: linear-gradient(135deg, #7c3aed, #ec4899); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 8px;">
            🚀 See Our Showreels
          </a>
        </div>
      </div>

      <div style="font-size: 13px; color: #64748b; text-align: center;">
        <p style="margin: 4px 0;">Direct Contact: <a href="tel:+8801711019550" style="color: #c084fc; text-decoration: none;">+88 01711 019550</a> | <a href="mailto:contact@purplebot.digital" style="color: #c084fc; text-decoration: none;">contact@purplebot.digital</a></p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 11px; margin: 0;">Purplebot Digital Limited • Banani & Niketon, Dhaka, Bangladesh</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

module.exports = {
  sendEmail,
  sendClientOnboardingEmail,
  sendInvoiceEmail,
  sendLeadConfirmationEmail,
  sendLeadFollowUpEmail
};


