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

module.exports = {
  sendEmail,
  sendClientOnboardingEmail
};
