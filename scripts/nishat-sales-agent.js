/**
 * scripts/nishat-sales-agent.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Nishat Sharmin — Autonomous AI Digital Sales Officer & Relationship Manager
 * Client: National Housing Finance PLC (Bangladesh)
 * Powered by: GRO10X.ai & Google Gemini
 * Bot Username: @NishatSharminBot
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const https = require('https');

const TOKEN = process.env.NISHAT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_NISHAT || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Initialize Telegram Bot with Polling
const bot = TOKEN ? new TelegramBot(TOKEN, { polling: true }) : null;

console.log('──────────────────────────────────────────────────────────');
console.log('🏢 [Nishat Sharmin AI Sales Agent] Starting up...');
console.log('🤖 Bot Username: @NishatSharminBot');
console.log('🧠 AI Core: Google Gemini (' + GEMINI_MODEL + ')');
console.log('📍 Client: National Housing Finance PLC (Bangladesh)');
console.log('──────────────────────────────────────────────────────────');

// In-memory conversation history per chat (keeps last 8 turns for fast context)
const chatHistories = new Map();

function getHistory(chatId) {
  if (!chatHistories.has(chatId)) {
    chatHistories.set(chatId, []);
  }
  return chatHistories.get(chatId);
}

function addToHistory(chatId, role, text) {
  const history = getHistory(chatId);
  history.push({ role, text });
  if (history.length > 12) {
    history.splice(0, history.length - 12);
  }
}

// EMI Calculation Utility
function calculateEMI(principalBDT, tenureYears, interestRateAnnual = 12.0) {
  const p = Number(principalBDT);
  const r = (interestRateAnnual / 12) / 100;
  const n = tenureYears * 12;
  const emi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const totalPayment = emi * n;
  const totalInterest = totalPayment - p;
  const minRequiredIncome = Math.round(emi * 2); // 50% DBR cap
  return { emi, totalPayment, totalInterest, minRequiredIncome };
}

// Call Google Gemini API
function callGemini(chatId, userMessage, userFirstName) {
  return new Promise((resolve) => {
    const history = getHistory(chatId);
    
    // Format conversation turns
    const contents = [
      {
        role: 'user',
        parts: [{
          text: `SYSTEM INSTRUCTIONS (STRICT):
You are Nishat Sharmin, Senior Business Development & Relationship Officer at National Housing Finance PLC in Dhaka, Bangladesh.
You are a dignified, warm, highly knowledgeable, and articulate retail finance professional.

YOUR MANDATE:
1. Represent National Housing Finance PLC with the highest corporate polish.
2. Help prospective clients evaluate:
   - Retail Home Loans (Flat Purchase, Self-Construction, Plot Purchase, Renovation)
   - NRB Home Financing (Special schemes for Non-Resident Bangladeshis abroad)
   - High-Yield Deposit Schemes (Term Deposits 3-36 mos, Kotipoti Scheme, Millionaire Scheme, Senior Citizen Schemes)
3. Financial & Regulatory Guidelines (Bangladesh Bank):
   - Maximum Debt Burden Ratio (DBR) is 50% (monthly EMI cannot exceed 50% of verifiable net income).
   - Loan-to-Value (LTV) is typically 70:30 (customer pays minimum 30% down payment, up to 70% financed).
   - Indicative home loan rates are ~11.5% - 12.5% per annum.
   - Mention that home loan interest payments offer eligible personal income tax rebates under Bangladesh tax laws.
   - Indicative fixed deposit rates are attractive (~9.5% - 10.5%).
4. Tone & Language:
   - Respond in the SAME language the client speaks (English, courteous Bengali/বাংলা, or Banglish).
   - Be concise, clear, and executive-friendly. Avoid technical AI jargon.
   - Always clarify politely that initial assessments are indicative, and formal sanction is completed upon standard CIB check and title vetting by our branch credit team.
5. Lead Generation / Call-to-Action:
   - When relevant, politely ask for their preferred property location (e.g. Gulshan, Dhanmondi, Uttara), monthly income or employer, and phone number so a Senior Branch Manager can coordinate their file.
6. The user's name is "${userFirstName || 'Valued Client'}".`
        }]
      },
      {
        role: 'model',
        parts: [{ text: `Understood. I am Nishat Sharmin, Senior Relationship Officer at National Housing Finance PLC. I will guide ${userFirstName || 'our client'} with professional precision, courteous tone, and strict regulatory adherence.` }]
      }
    ];

    // Append prior conversational turns
    for (const h of history) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      });
    }

    // Append current prompt
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const payload = JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.35
      }
    });

    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
            const reply = (parsed.candidates[0].content.parts || []).map(p => p.text || '').join('').trim();
            if (reply) return resolve(reply);
          }
          console.warn('[Gemini Warning] No text in candidate:', data.slice(0, 150));
          resolve(getFallbackReply(userMessage, userFirstName));
        } catch (err) {
          console.error('[Gemini Parse Error]:', err.message);
          resolve(getFallbackReply(userMessage, userFirstName));
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Gemini Request Error]:', err.message);
      resolve(getFallbackReply(userMessage, userFirstName));
    });

    req.setTimeout(12000, () => {
      req.destroy();
      console.warn('[Gemini Timeout] Fallback applied');
      resolve(getFallbackReply(userMessage, userFirstName));
    });

    req.write(payload);
    req.end();
  });
}

// Fallback logic if internet drops during live demo
function getFallbackReply(message, name) {
  const lower = (message || '').toLowerCase();
  if (lower.includes('loan') || lower.includes('flat') || lower.includes('home') || lower.includes('বাড়ি') || lower.includes('ফ্ল্যাট')) {
    return `Dear ${name || 'Sir'}, National Housing Finance PLC offers up to 70% financing for ready or under-construction residential flats across Dhaka and Chattogram, with repayment tenures up to 20–25 years.\n\nUnder Bangladesh Bank guidelines, your maximum monthly installment should not exceed 50% of your verifiable net income (DBR). You will also enjoy income tax rebate benefits on the loan interest.\n\nCould you kindly share your target apartment budget and preferred area? I will calculate your exact monthly installment.`;
  }
  if (lower.includes('deposit') || lower.includes('kotipoti') || lower.includes('millionaire') || lower.includes('টাকা') || lower.includes('ডিপোজিট')) {
    return `Dear ${name || 'Sir'}, National Housing Finance PLC provides highly competitive, Bangladesh Bank-approved deposit schemes:\n\n• Term Deposits: Flexible 3 to 36-month tenures with monthly/quarterly profit payout options.\n• Kotipoti Scheme: A systematic savings plan tailored to help you reach BDT 1 Crore.\n• Senior Citizen Scheme: Preferential profit rates for clients aged 59+.\n\nWould you prefer a one-time fixed term deposit or a monthly recurring savings plan?`;
  }
  return `Thank you for reaching out, ${name || 'Sir'}. As your dedicated Relationship Officer at National Housing Finance PLC, I am here to assist you with our Home Loan and High-Yield Deposit solutions.\n\nFeel free to ask any question regarding loan eligibility, monthly installment (EMI), or required paperwork!`;
}

// Main Interactive Menu Builder
function sendMainMenu(chatId, firstName) {
  const welcomeText = 
`🏢 *National Housing Finance PLC*
────────────────────────────
*Assalamu Alaikum & Welcome, ${firstName || 'Valued Client'}!*

I am *Nishat Sharmin*, your dedicated Senior Relationship & Business Development Officer.

Whether you are looking to acquire your dream apartment, finance a home renovation, or grow your personal wealth with secure deposit schemes, I am at your service.

Please select an option below, or simply ask me any question in *English* or *বাংলা*:`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '🏠 Flat Purchase Loan', callback_data: 'menu_flat_loan' },
        { text: '🔨 Renovation Loan', callback_data: 'menu_renovation' }
      ],
      [
        { text: '🌍 NRB Home Financing', callback_data: 'menu_nrb' },
        { text: '💰 High-Yield Deposits', callback_data: 'menu_deposits' }
      ],
      [
        { text: '🧮 Instant EMI Calculator', callback_data: 'menu_emi_calc' },
        { text: '📍 Nearest Branch & Team', callback_data: 'menu_branches' }
      ],
      [
        { text: '📞 Request Senior Officer Call', callback_data: 'menu_request_call' }
      ]
    ]
  };

  return bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: inlineKeyboard
  });
}

// Listen for /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from ? msg.from.first_name : 'Client';
  chatHistories.delete(chatId); // reset context
  sendMainMenu(chatId, firstName);
});

// Listen for /menu
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from ? msg.from.first_name : 'Client';
  sendMainMenu(chatId, firstName);
});

// Listen for /calc or /emi
bot.onText(/\/emi|\/calc/, (msg) => {
  const chatId = msg.chat.id;
  sendEmiOptions(chatId);
});

function sendEmiOptions(chatId) {
  const text = 
`🧮 *National Housing Finance — Instant EMI Quick Guide*
────────────────────────────
*(Indicative Rate: ~12.0% p.a. | Bangladesh Bank 50% DBR)*

• *৳50 Lakh (15 Yrs):* EMI ~৳60,000/mo (Min Income: ৳1.2L)
• *৳75 Lakh (15 Yrs):* EMI ~৳90,000/mo (Min Income: ৳1.8L)
• *৳1 Crore (20 Yrs):* EMI ~৳1,10,000/mo (Min Income: ৳2.2L)

Tap a quick calculation below or just reply with your loan amount and years (e.g. *"60 lakh 15 years"*):`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '৳40 Lakh (15 Yrs)', callback_data: 'calc_40_15' },
        { text: '৳60 Lakh (15 Yrs)', callback_data: 'calc_60_15' }
      ],
      [
        { text: '৳80 Lakh (20 Yrs)', callback_data: 'calc_80_20' },
        { text: '৳1.2 Crore (20 Yrs)', callback_data: 'calc_120_20' }
      ],
      [
        { text: '🔙 Back to Main Menu', callback_data: 'menu_main' }
      ]
    ]
  };

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
}

// Handle Callback Queries (Button Taps)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const firstName = query.from ? query.from.first_name : 'Valued Client';

  // Acknowledge callback immediately to remove loading spinner
  bot.answerCallbackQuery(query.id).catch(() => {});

  if (data === 'menu_main') {
    return sendMainMenu(chatId, firstName);
  }

  if (data === 'menu_flat_loan') {
    const text = 
`🏠 *National Housing Flat Purchase Financing*
────────────────────────────
• *Financing Limit:* Up to 70%–80% of approved flat value
• *Loan Ticket Size:* BDT 30 Lakh up to BDT 2 Crore+
• *Tenure:* Flexible 5 to 25 years
• *Tax Advantage:* Home loan interest provides direct income tax rebate under Bangladesh tax law.
• *Eligible Properties:* Ready apartments, under-construction projects from REHAB developers, and second-hand flats.

💬 *Next Step:* Tell me your monthly income and desired apartment area (e.g., *"I earn 2 Lakh, looking in Dhanmondi"*), and I will calculate your pre-approved limit!`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🧮 Calculate My EMI', callback_data: 'menu_emi_calc' }],
        [{ text: '📞 Connect with Branch Officer', callback_data: 'menu_request_call' }],
        [{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]
      ]
    };
    return bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }

  if (data === 'menu_renovation') {
    const text = 
`🔨 *Home Renovation & Interior Loan*
────────────────────────────
Upgrade your home with National Housing's fast-track Renovation Financing:

• *Ticket Size:* BDT 5 Lakh to BDT 30 Lakh
• *Tenure:* Up to 5 to 7 years
• *Fast Processing:* Simplified documentation for existing flat owners
• *Purpose:* Interior decoration, floor replacement, modular kitchen, bathroom remodeling, or structural upgrades.

💬 Would you like an estimate for your renovation budget? Just reply with your desired amount!`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📞 Apply for Renovation Loan', callback_data: 'menu_request_call' }],
        [{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]
      ]
    };
    return bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }

  if (data === 'menu_nrb') {
    const text = 
`🌍 *NRB Home Financing Scheme*
────────────────────────────
Designed specifically for Non-Resident Bangladeshis living in GCC, North America, UK, Europe, and Asia:

• Acquire or construct your family home in Bangladesh without being physically present.
• Servicing loan installments via legal banking remittance channels.
• Power of Attorney facilitation for local family representatives.
• Competitive interest rates with pre-approval before your visit to Dhaka.

💬 *Which country are you currently residing in?* Let me know and I will outline the exact documentation process!`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📞 Request NRB Desk Call', callback_data: 'menu_request_call' }],
        [{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]
      ]
    };
    return bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }

  if (data === 'menu_deposits') {
    const text = 
`💰 *National Housing High-Yield Deposit Schemes*
────────────────────────────
Secure, Bangladesh Bank-regulated wealth growth products:

1. *Term Deposit Scheme (TDR):* 3 to 36 months with monthly or quarterly profit disbursement options.
2. *Kotipoti Scheme:* Systematic monthly savings designed to accumulate BDT 1 Crore.
3. *Millionaire Scheme:* Flexible savings plans to reach BDT 10 Lakh+.
4. *Senior Citizen Term Deposit:* Preferential returns for respected citizens aged 59+.
5. *Housing Deposit Scheme:* Deposit savings that qualify you for up to 4x home loan eligibility!

💬 Are you planning a one-time fixed investment or a monthly savings plan? Let me know your target amount!`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📞 Speak with Deposit Manager', callback_data: 'menu_request_call' }],
        [{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]
      ]
    };
    return bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }

  if (data === 'menu_emi_calc') {
    return sendEmiOptions(chatId);
  }

  if (data === 'menu_branches') {
    const text = 
`📍 *National Housing Finance PLC — Key Branch Network*
────────────────────────────
🏢 *Corporate Head Office:*
Concord Baksh Tower (7th Floor), Plot 11A, Road 48, Block CWN-A, Gulshan-2, Dhaka-1212.
Hotline: +880 2 222288001 | Web: nationalhousingbd.com

🏛️ *Dhaka Branches:*
• *Gulshan Branch:* Concord Baksh Tower, Gulshan-2
• *Motijheel Branch:* Chamber Building (3rd Floor), 122-124 Motijheel C/A
• *Dhanmondi Branch:* Concord Royal Court, Dhanmondi 27
• *Uttara Branch:* Sector 3, Uttara Model Town

🏛️ *Regional Branches:*
• *Chattogram Branch:* Agrabad C/A
• *Sylhet Branch:* Garden Tower, Shahjalal Upashahar
• *Bogura Branch:* Rangpur Road, Bogura
• *Gazipur Branch:* Joydebpur Road

Would you like me to schedule a direct consultation with your nearest Branch Manager?`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📞 Schedule Branch Meeting', callback_data: 'menu_request_call' }],
        [{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]
      ]
    };
    return bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }

  if (data === 'menu_request_call') {
    const text = 
`📝 *Priority Branch Consultation Booking*
────────────────────────────
To connect you with our Senior Branch Manager in your area, please reply with:

1. *Your Name*
2. *Contact Number*
3. *Preferred Branch (e.g. Gulshan, Dhanmondi, Uttara)*
4. *Service Needed (Home Loan / Deposit Scheme)*

Our team will prioritize your consultation within 2 business hours.`;

    return bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  // Pre-set EMI calculators
  if (data.startsWith('calc_')) {
    let p = 5000000;
    let y = 15;
    if (data === 'calc_40_15') { p = 4000000; y = 15; }
    if (data === 'calc_60_15') { p = 6000000; y = 15; }
    if (data === 'calc_80_20') { p = 8000000; y = 20; }
    if (data === 'calc_120_20') { p = 12000000; y = 20; }

    const res = calculateEMI(p, y, 12.0);
    const text = 
`🧮 *Estimated Loan Breakdown*
────────────────────────────
• *Loan Principal:* ৳${(p / 100000).toFixed(1)} Lakh BDT
• *Repayment Tenure:* ${y} Years (${y * 12} Installments)
• *Indicative Interest Rate:* 12.00% p.a.

📊 *Monthly Installment (EMI):* ~*৳${res.emi.toLocaleString()}* / month
💼 *Minimum Recommended Monthly Income:* ~*৳${res.minRequiredIncome.toLocaleString()}* (50% DBR)
💡 *Tax Savings:* Eligible for annual personal income tax rebate on interest paid!

Would you like to proceed with pre-screening for this amount?`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📞 Connect with Branch Officer', callback_data: 'menu_request_call' }],
        [{ text: '🧮 Try Another Amount', callback_data: 'menu_emi_calc' }],
        [{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]
      ]
    };
    return bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }
});

// Handle Freeform Natural Language Messages (Gemini AI Core)
bot.on('message', async (msg) => {
  // Ignore commands handled by onText
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const userText = msg.text.trim();
  const firstName = msg.from ? msg.from.first_name : 'Client';

  // Check if user is sharing contact details or asking to book
  const phoneMatch = userText.match(/(?:\+?88)?01[3-9]\d{8}/);
  if (phoneMatch) {
    const formattedLead = 
`✅ *Thank You, ${firstName}!*
────────────────────────────
I have recorded your request and prioritized your file:

📋 *Client Inquiry Summary:*
• *Client Name:* ${firstName} ${msg.from.last_name || ''}
• *Contact Number:* \`${phoneMatch[0]}\`
• *Inquiry:* Retail Housing Finance / Deposit Advisory
• *Assigned Unit:* Nearest Corporate / Retail Branch Desk

Our Senior Branch Manager will reach out to you directly to guide you through the fast-track application process. Have a wonderful day!`;

    addToHistory(chatId, 'user', userText);
    addToHistory(chatId, 'model', formattedLead);
    return bot.sendMessage(chatId, formattedLead, { parse_mode: 'Markdown' });
  }

  // Show typing indicator
  bot.sendChatAction(chatId, 'typing').catch(() => {});

  try {
    const aiResponse = await callGemini(chatId, userText, firstName);
    
    // Save turn to history
    addToHistory(chatId, 'user', userText);
    addToHistory(chatId, 'model', aiResponse);

    const followUpKeyboard = {
      inline_keyboard: [
        [
          { text: '🧮 Calculate EMI', callback_data: 'menu_emi_calc' },
          { text: '📞 Talk to Officer', callback_data: 'menu_request_call' }
        ],
        [
          { text: '📋 Main Menu', callback_data: 'menu_main' }
        ]
      ]
    };

    bot.sendMessage(chatId, aiResponse, {
      reply_markup: followUpKeyboard
    }).catch(err => {
      // In case Markdown formatting has unescaped characters, retry without markdown
      bot.sendMessage(chatId, aiResponse);
    });

  } catch (err) {
    console.error('[Bot Error]:', err.message);
    bot.sendMessage(chatId, `Assalamu Alaikum. How may I assist you with National Housing Finance loans or deposits today?`, {
      reply_markup: {
        inline_keyboard: [[{ text: '📋 View Menu', callback_data: 'menu_main' }]]
      }
    });
  }
});

// Error handling
bot.on('polling_error', (error) => {
  // Silent transient polling errors
  if (!error.message.includes('EFATAL')) {
    console.warn('[Telegram Polling Notice]:', error.message.slice(0, 100));
  }
});

console.log('✅ [Nishat Sharmin AI Sales Agent] is LIVE and listening for Telegram messages!');
console.log('👉 Open Telegram and test: https://t.me/NishatSharminBot');
