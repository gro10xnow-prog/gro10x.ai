const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');

const defaultCMSContent = {
  agencyInfo: {
    heroTitle: "Digital. Design. Tech.",
    heroSubtitle: "Expert solutions tailored to your brand. We combine data-driven marketing, viral short-form content, and cutting-edge tech to deliver measurable business growth.",
    email: "contact@purplebot.digital",
    phone: "+88 01711 019550",
    whatsapp: "+8801711019550",
    registeredAddress: "Plot 7, Road 17, Flat 2/C, Rupsha Tower, Banani C/A, Dhaka - 1213",
    operatingAddress: "Flat A5-B5-A4, House 9, Road 1, Block B, Niketon, Gulshan-1, Dhaka - 1212",
    stats: { years: "8+", clients: "100+", creatives: "20,000+", reach: "10M+" }
  },
  clientMarquee: [
    "LG Electronics", "Chillox", "BAT Global",
    "Taptap Send", "Mortein", "Harpic", "Yatai Japanese", "UCB Bank"
  ],
  whyUs: [
    { icon: "🎯", title: "Seth Godin 'Purple Cow' Ethos", description: "Founded by IBA graduates Ayman Rahman & Ifteker Mahmud. We build remarkable, impossible-to-ignore brand content." },
    { icon: "🎬", title: "Full-Scale In-House Studio", description: "From 4K commercial TVCs to viral TikToks and reels, our dedicated production crew handles end-to-end execution." },
    { icon: "🤖", title: "PurpleOS Bot Workflows", description: "Proprietary AI task dispatching, real-time client review portals, and frame-accurate feedback rooms." }
  ],
  services: [
    { id: "SVC-001", icon: "📢", title: "Digital Marketing & Growth", category: "Growth & Ads", description: "Data-driven social media management, paid advertising, and conversion rate optimization.", features: ["Paid Meta & Google Ads", "Social Media Strategy", "Audience Retargeting", "Monthly Growth Analytics"] },
    { id: "SVC-002", icon: "🎥", title: "Video Production & Editing", category: "Content & Film", description: "High-impact commercial TVCs, viral Reels/TikToks, and full post-production color grading.", features: ["Commercial TVC Shoots", "Short-Form Reels & TikToks", "Color Grading & Sound FX", "Frame.io Review Workflows"] },
    { id: "SVC-003", icon: "🎨", title: "Branding & Motion Design", category: "Design & Brand", description: "Brand identity systems, 3D motion graphics, packaging, and high-converting ad creative.", features: ["Brand Guidelines & Logos", "3D & 2D Motion Graphics", "Social Media Creative Kits", "Packaging & Print Design"] },
    { id: "SVC-004", icon: "💻", title: "Website & Tech Development", category: "Development", description: "Custom web applications, responsive landing pages, e-commerce, and bot integrations.", features: ["Custom React / Next.js Apps", "High-Converting Landing Pages", "Telegram & WhatsApp Bots", "API & CRM Integration"] }
  ],
  portfolioShowcase: [
    { id: "PORT-001", title: "LG Electronics Bangladesh", subtitle: "3+ Years Retainer • Digital Branding & 500k+ Audience Growth", category: "Electronics & Tech", metric: "📱 500,000+ Social Community", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" },
    { id: "PORT-002", title: "InterContinental Dhaka", subtitle: "Official Digital Marketing & 360° Creative Support Agency", category: "Hospitality & Luxury", metric: "🏨 2+ Years Full Content Support", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80" },
    { id: "PORT-003", title: "United Commercial Bank (UCB)", subtitle: "Annual Financial Report Video & Digital Launch Campaign", category: "Corporate Financial", metric: "💼 100% On-Time Delivery", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80" }
  ],
  pricingPackages: [
    { id: "PKG-001", name: "Lite Plan", tier: "STARTUP", price: "৳45,000", period: "/ month", featured: false, features: ["10 Total Content Items", "8 Image Based Content", "2 Motion or Carousel Content", "Monthly Content Plan & Captions", "Monthly Analytics Reporting", "Shared Account Manager"] },
    { id: "PKG-002", name: "Essential Plan", tier: "GROWTH", price: "৳75,000", period: "/ month", featured: true, features: ["16 Total Content Items", "12 Image Based Content", "4 Short-Form Video Reels", "Dedicated Copywriter & Designer", "Bi-Weekly Performance Meetings", "Dedicated Account Manager"] },
    { id: "PKG-003", name: "Advanced Plan", tier: "ENTERPRISE", price: "৳120,000", period: "/ month", featured: false, features: ["24 Total Content Items", "16 Image Based Content", "8 Short-Form Video Reels / TVCs", "Paid Ad Campaign Management", "Weekly Strategy & Shoot Dispatch", "Senior Lead Account Director"] }
  ]
};

// GET Public Landing Page CMS Content — Supabase settings table first, fallback to defaults
router.get(['/', '/content', '/public/content'], async (req, res) => {
  let content = defaultCMSContent;

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('settings').select('value').eq('key', 'cms_content').maybeSingle();
      if (data?.value) content = { ...defaultCMSContent, ...data.value };
    } catch (e) {
      console.warn('CMS read error:', e.message);
    }
  }

  res.json({ success: true, content });
});

// PUT Update CMS Content (Admin only) — upserts into Supabase settings
router.put('/', requireAuth, requireAdmin, async (req, res) => {
  let currentContent = defaultCMSContent;

  if (isSupabaseConfigured()) {
    try {
      const { data: existing } = await supabase.from('settings').select('value').eq('key', 'cms_content').maybeSingle();
      if (existing?.value) currentContent = existing.value;
    } catch (e) { /* use default */ }
  }

  const updatedContent = { ...defaultCMSContent, ...currentContent, ...req.body, updatedAt: new Date().toISOString() };

  if (isSupabaseConfigured()) {
    await supabase.from('settings').upsert(
      { key: 'cms_content', value: updatedContent, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  }

  broadcast('cms_update', updatedContent);
  res.json({ success: true, content: updatedContent });
});

module.exports = router;
