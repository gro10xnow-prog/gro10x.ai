/**
 * scripts/seed-digivault.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seed script for DigiVault Digital Subscription & Product Commerce Engine.
 * 
 * Seeds:
 * 1. 2 Verified Suppliers (Premium Box Munir & Farhan Ahmed Rifat)
 * 2. 44 Digital Subscription & Software Products across 8 categories
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { supabase, isSupabaseConfigured } = require('../src/services/supabase');

const SEED_VENDORS = [
  {
    name: 'Premium Box Munir',
    contact_type: 'whatsapp',
    contact_handle: '+880 1602-733832',
    phone: '8801602733832',
    payment_method: 'bkash',
    avg_delivery_min: 15,
    reliability_score: 9.8,
    notes: 'Primary Specialist: Gemini Pro 18M Admin Accounts, VEO 3 Ultra Video Gen, Official CapCut Pro.',
    is_active: true
  },
  {
    name: 'Farhan Ahmed Rifat (FarhanFlix SubsBazar)',
    contact_type: 'whatsapp',
    contact_handle: '@farhan_ahmed_rifat / +880 1609-127266',
    phone: '8801609127266',
    payment_method: 'bkash',
    avg_delivery_min: 25,
    reliability_score: 9.4,
    notes: 'Primary Supplier: Streaming, Audio, Adobe, Office365, Google Drive, AI Tools, VPN & Career plans.',
    is_active: true
  }
];

const SEED_PRODUCTS = (munirId, farhanId) => [
  // ── 🤖 AI & Generative Video (Hero Category) ──
  {
    slug: 'gemini-pro-18m-veo-3',
    name: 'Gemini Pro 18 Months Admin Account + VEO 3 Pro',
    category: 'AI Tools',
    duration: '18 Months',
    vendor_price: 170,
    sale_price: 2000,
    profit_margin: 1830,
    delivery_type: 'admin_account',
    delivery_notes: 'Full Admin Account. Limited Video generation included. Bulk purchase discounts apply.',
    vendor_id: munirId,
    stock_status: 'available',
    is_hero: true,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Best Seller', 'AI', 'Google', 'VEO 3', 'High Margin'],
    sort_order: 1
  },
  {
    slug: 'veo-3-ultra-share',
    name: 'Official VEO 3 Ultra Share (Unlimited Video)',
    category: 'AI Tools',
    duration: '1 Month',
    vendor_price: 399,
    sale_price: 650,
    profit_margin: 251,
    delivery_type: 'shared',
    delivery_notes: 'Unlimited AI Video Generation. Shared access credentials provided.',
    vendor_id: munirId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['AI Video', 'VEO 3', 'Unlimited'],
    sort_order: 2
  },
  {
    slug: 'chatgpt-shared',
    name: 'ChatGPT Plus Shared (GPT-4o & Canvas)',
    category: 'AI Tools',
    duration: '1 Month',
    vendor_price: 300,
    sale_price: 450,
    profit_margin: 150,
    delivery_type: 'id_pass',
    delivery_notes: 'Shared ID + Password provided. Strictly max 1 device login.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['AI', 'ChatGPT', 'OpenAI'],
    sort_order: 3
  },
  {
    slug: 'chatgpt-personal',
    name: 'ChatGPT Plus Personal (Client Email)',
    category: 'AI Tools',
    duration: '1 Month',
    vendor_price: 1250,
    sale_price: 1650,
    profit_margin: 400,
    delivery_type: 'email_slot',
    delivery_notes: 'Activated directly on client email address. 100% private account.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['AI', 'ChatGPT', 'Personal'],
    sort_order: 4
  },
  {
    slug: 'claude-ai-shared',
    name: 'Claude AI Pro Shared (Sonnet 3.5 & Artifacts)',
    category: 'AI Tools',
    duration: '1 Month',
    vendor_price: 850,
    sale_price: 1250,
    profit_margin: 400,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided. Max 1 device login.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['AI', 'Claude', 'Anthropic'],
    sort_order: 5
  },
  {
    slug: 'claude-ai-personal',
    name: 'Claude AI Pro Personal (Client Email)',
    category: 'AI Tools',
    duration: '1 Month',
    vendor_price: 1500,
    sale_price: 2100,
    profit_margin: 600,
    delivery_type: 'email_slot',
    delivery_notes: 'Activated on client email. Private Anthropic account.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['AI', 'Claude', 'Personal'],
    sort_order: 6
  },
  {
    slug: 'perplexity-pro-shared',
    name: 'Perplexity AI Pro Shared (3 Months)',
    category: 'AI Tools',
    duration: '3 Months',
    vendor_price: 850,
    sale_price: 1250,
    profit_margin: 400,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided. Max 1 device login.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['AI', 'Search', 'Perplexity'],
    sort_order: 7
  },
  {
    slug: 'google-ai-pro-gemini-12m',
    name: 'Google AI Pro / Gemini Advanced (12 Months)',
    category: 'AI Tools',
    duration: '12 Months',
    vendor_price: 2500,
    sale_price: 3999,
    profit_margin: 1499,
    delivery_type: 'email_slot',
    delivery_notes: 'Activated on client Google email. 2TB Google One included.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['AI', 'Gemini', 'Google One'],
    sort_order: 8
  },
  {
    slug: 'elevenlabs-50k',
    name: 'ElevenLabs AI Voice 50k Characters',
    category: 'AI Tools',
    duration: '1 Month',
    vendor_price: 850,
    sale_price: 1250,
    profit_margin: 400,
    delivery_type: 'email_slot',
    delivery_notes: 'Client email invite or account credentials.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['AI Voice', 'Audio', 'ElevenLabs'],
    sort_order: 9
  },
  {
    slug: 'elevenlabs-100k',
    name: 'ElevenLabs AI Voice 100k Characters',
    category: 'AI Tools',
    duration: '1 Month',
    vendor_price: 1600,
    sale_price: 1850,
    profit_margin: 250,
    delivery_type: 'email_slot',
    delivery_notes: 'Client email invite or account credentials.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['AI Voice', 'Audio', 'ElevenLabs'],
    sort_order: 10
  },

  // ── 🎬 Streaming & OTT ──
  {
    slug: 'netflix-1m',
    name: 'Netflix Premium UHD 4K (Shared Profile)',
    category: 'Streaming',
    duration: '1 Month',
    vendor_price: 250,
    sale_price: 330,
    profit_margin: 80,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password + PIN provided. 1 screen private profile.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Streaming', 'Netflix', '4K'],
    sort_order: 11
  },
  {
    slug: 'prime-video-12m',
    name: 'Amazon Prime Video (12 Months)',
    category: 'Streaming',
    duration: '12 Months',
    vendor_price: 500,
    sale_price: 950,
    profit_margin: 450,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided. 12 months full warranty.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Streaming', 'Amazon', 'Prime'],
    sort_order: 12
  },
  {
    slug: 'disney-plus-1m',
    name: 'Disney+ Hotstar Premium',
    category: 'Streaming',
    duration: '1 Month',
    vendor_price: 250,
    sale_price: 350,
    profit_margin: 100,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Streaming', 'Disney', 'Hotstar'],
    sort_order: 13
  },
  {
    slug: 'hoichoi-1m',
    name: 'Hoichoi Bangladesh',
    category: 'Streaming',
    duration: '1 Month',
    vendor_price: 150,
    sale_price: 199,
    profit_margin: 49,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Bangla OTT', 'Hoichoi'],
    sort_order: 14
  },
  {
    slug: 'hoichoi-global-12m',
    name: 'Hoichoi Global (12 Months)',
    category: 'Streaming',
    duration: '12 Months',
    vendor_price: 1250,
    sale_price: 1650,
    profit_margin: 400,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided. Works worldwide.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Bangla OTT', 'Hoichoi', 'Global'],
    sort_order: 15
  },
  {
    slug: 'chorki-1m',
    name: 'Chorki Premium',
    category: 'Streaming',
    duration: '1 Month',
    vendor_price: 150,
    sale_price: 199,
    profit_margin: 49,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Bangla OTT', 'Chorki'],
    sort_order: 16
  },
  {
    slug: 'zee5-hbo-1m',
    name: 'Zee5 / HBO Max',
    category: 'Streaming',
    duration: '1 Month',
    vendor_price: 200,
    sale_price: 250,
    profit_margin: 50,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Streaming', 'Zee5', 'HBO'],
    sort_order: 17
  },
  {
    slug: 'sonyliv-1m',
    name: 'SonyLIV Premium',
    category: 'Streaming',
    duration: '1 Month',
    vendor_price: 100,
    sale_price: 120,
    profit_margin: 20,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Streaming', 'SonyLIV', 'Sports'],
    sort_order: 18
  },
  {
    slug: 'crunchyroll-1m',
    name: 'Crunchyroll Mega Fan',
    category: 'Streaming',
    duration: '1 Month',
    vendor_price: 100,
    sale_price: 120,
    profit_margin: 20,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided. Ad-free anime streaming.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Anime', 'Crunchyroll'],
    sort_order: 19
  },

  // ── 🎵 Music & Audio ──
  {
    slug: 'spotify-premium-12m',
    name: 'Spotify Premium Individual (12 Months)',
    category: 'Music',
    duration: '12 Months',
    vendor_price: 1250,
    sale_price: 1950,
    profit_margin: 700,
    delivery_type: 'id_pass',
    delivery_notes: 'Client Spotify ID + Password required for upgrade.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Music', 'Spotify', '12 Months'],
    sort_order: 20
  },
  {
    slug: 'youtube-premium-12m',
    name: 'YouTube Premium + YT Music (12 Months Family Slot)',
    category: 'Music',
    duration: '12 Months',
    vendor_price: 2250,
    sale_price: 2650,
    profit_margin: 400,
    delivery_type: 'email_slot',
    delivery_notes: 'Activated on client Google email. Ad-free + background play.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Music', 'YouTube', 'Ad-Free'],
    sort_order: 21
  },

  // ── 🎨 Creative & Video Design ──
  {
    slug: 'capcut-premium-official-munir',
    name: 'Official CapCut Pro Premium (All Devices)',
    category: 'Creative Tools',
    duration: '1 Month',
    vendor_price: 349,
    sale_price: 599,
    profit_margin: 250,
    delivery_type: 'credentials',
    delivery_notes: 'Official version. All PC, Mac, iOS & Android devices supported.',
    vendor_id: munirId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Video Editing', 'CapCut', 'All Devices'],
    sort_order: 22
  },
  {
    slug: 'canva-pro-ai-3m',
    name: 'Canva Pro with Full Magic Studio AI',
    category: 'Creative Tools',
    duration: '3 Months',
    vendor_price: 100,
    sale_price: 320,
    profit_margin: 220,
    delivery_type: 'email_slot',
    delivery_notes: 'Invited to Canva team on client email. Brand kit + AI access.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Design', 'Canva', 'AI'],
    sort_order: 23
  },
  {
    slug: 'adobe-cc-shared',
    name: 'Adobe Creative Cloud All Apps (Shared)',
    category: 'Creative Tools',
    duration: '1 Month',
    vendor_price: 299,
    sale_price: 499,
    profit_margin: 200,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided. Max 1 Device login strictly.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Design', 'Adobe', 'Photoshop'],
    sort_order: 24
  },
  {
    slug: 'adobe-cc-personal',
    name: 'Adobe Creative Cloud All Apps (Personal Account)',
    category: 'Creative Tools',
    duration: '1 Month',
    vendor_price: 650,
    sale_price: 799,
    profit_margin: 149,
    delivery_type: 'id_pass',
    delivery_notes: 'Activated on client Adobe ID. Max 2 Devices simultaneously.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Design', 'Adobe', 'Personal'],
    sort_order: 25
  },
  {
    slug: 'capcut-pro-shared',
    name: 'CapCut Pro Shared',
    category: 'Creative Tools',
    duration: '1 Month',
    vendor_price: 300,
    sale_price: 499,
    profit_margin: 199,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided. Max 1 Device.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Video Editing', 'CapCut'],
    sort_order: 26
  },
  {
    slug: 'capcut-pro-personal',
    name: 'CapCut Pro Personal (Client Email)',
    category: 'Creative Tools',
    duration: '1 Month',
    vendor_price: 650,
    sale_price: 850,
    profit_margin: 200,
    delivery_type: 'email_slot',
    delivery_notes: 'Activated on client email. Private account.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Video Editing', 'CapCut', 'Personal'],
    sort_order: 27
  },
  {
    slug: 'freepik-envato-elements',
    name: 'Freepik Premium & Envato Elements Shared',
    category: 'Creative Tools',
    duration: '1 Month',
    vendor_price: 500,
    sale_price: 650,
    profit_margin: 150,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided. Max 30 downloads/day.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Assets', 'Freepik', 'Envato'],
    sort_order: 28
  },

  // ── 💼 Productivity & Cloud Storage ──
  {
    slug: 'office-365-ready-acc',
    name: 'Microsoft 365 ProPlus Ready Account (5TB OneDrive)',
    category: 'Productivity',
    duration: '12 Months',
    vendor_price: 850,
    sale_price: 1250,
    profit_margin: 400,
    delivery_type: 'credentials',
    delivery_notes: 'Ready Account credentials. Up to 5 PCs/Macs + 5 Mobile devices.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Productivity', 'Office365', 'OneDrive'],
    sort_order: 29
  },
  {
    slug: 'office-365-personal-email',
    name: 'Microsoft 365 Family Slot (Client Personal Email)',
    category: 'Productivity',
    duration: '12 Months',
    vendor_price: 1850,
    sale_price: 2250,
    profit_margin: 400,
    delivery_type: 'email_slot',
    delivery_notes: 'Official invite to client Microsoft email. 1TB private OneDrive.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Productivity', 'Office365', 'Personal'],
    sort_order: 30
  },
  {
    slug: 'google-drive-100gb',
    name: 'Google One Cloud Storage 100GB',
    category: 'Productivity',
    duration: '12 Months',
    vendor_price: 1200,
    sale_price: 1599,
    profit_margin: 399,
    delivery_type: 'email_slot',
    delivery_notes: 'Invited to Google Family on client Gmail.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Storage', 'Google Drive'],
    sort_order: 31
  },
  {
    slug: 'google-drive-200gb',
    name: 'Google One Cloud Storage 200GB (1 Month)',
    category: 'Productivity',
    duration: '1 Month',
    vendor_price: 200,
    sale_price: 399,
    profit_margin: 199,
    delivery_type: 'email_slot',
    delivery_notes: 'Invited to Google Family on client Gmail.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Storage', 'Google Drive'],
    sort_order: 32
  },
  {
    slug: 'google-drive-5tb',
    name: 'Google Workspace Storage 5TB Dedicated',
    category: 'Productivity',
    duration: '12 Months',
    vendor_price: 3500,
    sale_price: 4500,
    profit_margin: 1000,
    delivery_type: 'email_slot',
    delivery_notes: 'Enterprise Google Workspace shared drive.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Storage', 'Google Drive', '5TB'],
    sort_order: 33
  },
  {
    slug: 'zoom-meet-premium',
    name: 'Zoom Pro / Google Meet Premium',
    category: 'Productivity',
    duration: '1 Month',
    vendor_price: 300,
    sale_price: 550,
    profit_margin: 250,
    delivery_type: 'email_slot',
    delivery_notes: 'Unlimited meeting duration up to 300 participants.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Productivity', 'Zoom', 'Meetings'],
    sort_order: 34
  },
  {
    slug: 'grammarly-quillbot',
    name: 'Grammarly Premium & Quillbot AI Shared',
    category: 'Productivity',
    duration: '1 Month',
    vendor_price: 150,
    sale_price: 220,
    profit_margin: 70,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided. Max 1 Device login.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Writing', 'Grammarly', 'Quillbot'],
    sort_order: 35
  },

  // ── 💼 Professional & Career (LinkedIn Suite) ──
  {
    slug: 'linkedin-career-12m',
    name: 'LinkedIn Premium Career Plan (12 Months)',
    category: 'Professional',
    duration: '12 Months',
    vendor_price: 3500,
    sale_price: 4500,
    profit_margin: 1000,
    delivery_type: 'redeem_link',
    delivery_notes: 'Official redemption link provided. Direct activation on client profile.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Career', 'LinkedIn', 'Premium'],
    sort_order: 36
  },
  {
    slug: 'linkedin-business-12m',
    name: 'LinkedIn Premium Business Plan (12 Months)',
    category: 'Professional',
    duration: '12 Months',
    vendor_price: 6500,
    sale_price: 7500,
    profit_margin: 1000,
    delivery_type: 'redeem_link',
    delivery_notes: 'Official redemption link provided. Direct activation on client profile.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['B2B', 'LinkedIn', 'Business'],
    sort_order: 37
  },
  {
    slug: 'linkedin-sales-navigator-1m',
    name: 'LinkedIn Sales Navigator Core (1 Month)',
    category: 'Professional',
    duration: '1 Month',
    vendor_price: 1250,
    sale_price: 1850,
    profit_margin: 600,
    delivery_type: 'redeem_link',
    delivery_notes: 'Redeem link provided. Advanced lead filters & InMail.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Sales', 'LinkedIn', 'LeadGen'],
    sort_order: 38
  },
  {
    slug: 'linkedin-recruiter-lite-12m',
    name: 'LinkedIn Recruiter Lite (12 Months)',
    category: 'Professional',
    duration: '12 Months',
    vendor_price: 27500,
    sale_price: 35000,
    profit_margin: 7500,
    delivery_type: 'login_access',
    delivery_notes: 'Recruiter dashboard access. Direct LinkedIn login setup required.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['HR', 'Recruiting', 'LinkedIn', 'High Ticket'],
    sort_order: 39
  },
  {
    slug: 'career-annual-pack',
    name: 'Career Annual Master Package (12 Months)',
    category: 'Professional',
    duration: '12 Months',
    vendor_price: 7000,
    sale_price: 7900,
    profit_margin: 900,
    delivery_type: 'credentials',
    delivery_notes: 'Active in 10-20 mins after client login verification.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Career', 'Bundle'],
    sort_order: 40
  },
  {
    slug: 'business-annual-pack',
    name: 'Business Annual Growth Master Pack (12 Months)',
    category: 'Professional',
    duration: '12 Months',
    vendor_price: 8500,
    sale_price: 12500,
    profit_margin: 4000,
    delivery_type: 'credentials',
    delivery_notes: 'Full corporate growth bundle. Active in 10-20 mins.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Business', 'Growth', 'Bundle'],
    sort_order: 41
  },

  // ── 📚 Learning & Education ──
  {
    slug: 'coursera-plus-1m',
    name: 'Coursera Plus (Unlimited Certificates)',
    category: 'Learning',
    duration: '1 Month',
    vendor_price: 300,
    sale_price: 499,
    profit_margin: 199,
    delivery_type: 'id_pass',
    delivery_notes: 'Client Coursera login credentials needed for activation.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Learning', 'Coursera', 'Certificates'],
    sort_order: 42
  },
  {
    slug: 'duolingo-plus-1m',
    name: 'Duolingo Super (Ad-Free & Unlimited Hearts)',
    category: 'Learning',
    duration: '1 Month',
    vendor_price: 150,
    sale_price: 250,
    profit_margin: 100,
    delivery_type: 'email_slot',
    delivery_notes: 'Client Duolingo email invite.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Learning', 'Languages', 'Duolingo'],
    sort_order: 43
  },

  // ── 🔒 VPN & Online Privacy ──
  {
    slug: 'nordvpn-proton-1m',
    name: 'NordVPN / ProtonVPN Plus (Ultra Fast)',
    category: 'VPN',
    duration: '1 Month',
    vendor_price: 100,
    sale_price: 199,
    profit_margin: 99,
    delivery_type: 'id_pass',
    delivery_notes: 'ID + Password provided. Max 1 Device login.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Privacy', 'VPN', 'NordVPN'],
    sort_order: 44
  },
  {
    slug: 'surfshark-express-1m',
    name: 'Surfshark / ExpressVPN Premium',
    category: 'VPN',
    duration: '1 Month',
    vendor_price: 150,
    sale_price: 249,
    profit_margin: 99,
    delivery_type: 'login_code',
    delivery_notes: 'Direct login code generated from client device.',
    vendor_id: farhanId,
    stock_status: 'available',
    is_hero: false,
    channels: ['web', 'telegram', 'facebook'],
    tags: ['Privacy', 'VPN', 'Surfshark'],
    sort_order: 45
  }
];

async function seedDigiVault() {
  console.log('🚀 [DigiVault] Initializing DigiVault Catalog Seeding...');

  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase is not connected. Seed script will run in standalone schema generation mode.');
    return;
  }

  try {
    // 1. Upsert Vendors
    console.log('📦 Seeding Vendors...');
    const insertedVendors = [];

    for (const v of SEED_VENDORS) {
      const { data, error } = await supabase
        .from('digi_vendors')
        .upsert({
          name: v.name,
          contact_type: v.contact_type,
          contact_handle: v.contact_handle,
          phone: v.phone,
          payment_method: v.payment_method,
          avg_delivery_min: v.avg_delivery_min,
          reliability_score: v.reliability_score,
          notes: v.notes,
          is_active: v.is_active
        }, { onConflict: 'name' })
        .select();

      if (error) {
        // If onConflict fails or table is fresh, try insert
        const { data: insData, error: insErr } = await supabase.from('digi_vendors').insert(v).select();
        if (!insErr && insData && insData[0]) {
          insertedVendors.push(insData[0]);
          console.log(`  ✅ Vendor seeded: ${v.name}`);
        } else {
          console.error(`  ❌ Failed to seed vendor ${v.name}:`, insErr ? insErr.message : error.message);
        }
      } else if (data && data[0]) {
        insertedVendors.push(data[0]);
        console.log(`  ✅ Vendor seeded: ${v.name}`);
      }
    }

    // Fetch vendor IDs
    const { data: allVendors } = await supabase.from('digi_vendors').select('id, name');
    const munir = (allVendors || []).find(v => v.name.includes('Munir')) || insertedVendors[0] || {};
    const farhan = (allVendors || []).find(v => v.name.includes('Farhan')) || insertedVendors[1] || {};

    console.log(`\n🔗 Linking Products to Munir (${munir.id || 'N/A'}) and Farhan (${farhan.id || 'N/A'})...`);

    // 2. Upsert Products
    const products = SEED_PRODUCTS(munir.id, farhan.id);
    let successCount = 0;

    for (const p of products) {
      const payload = {
        slug: p.slug,
        name: p.name,
        category: p.category,
        duration: p.duration,
        vendor_price: p.vendor_price,
        sale_price: p.sale_price,
        profit_margin: p.profit_margin,
        delivery_type: p.delivery_type,
        delivery_notes: p.delivery_notes,
        vendor_id: p.vendor_id || null,
        stock_status: p.stock_status,
        is_hero: p.is_hero,
        channels: p.channels,
        tags: p.tags,
        sort_order: p.sort_order,
        is_active: true
      };

      const { error } = await supabase
        .from('digi_products')
        .upsert(payload, { onConflict: 'slug' });

      if (error) {
        const { error: insErr } = await supabase.from('digi_products').insert(payload);
        if (insErr) {
          console.error(`  ❌ Failed product ${p.name}:`, insErr.message);
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    }

    console.log(`\n🎉 [DigiVault] Seeding Complete! Seeded ${successCount} of ${products.length} products successfully.`);
  } catch (err) {
    console.error('❌ [DigiVault] Seeding error:', err.message);
  }
}

if (require.main === module) {
  seedDigiVault().then(() => process.exit(0));
}

module.exports = { seedDigiVault, SEED_VENDORS, SEED_PRODUCTS };
