const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { DEFAULT_SERVICES } = require('../constants/services');

const defaultCMSContent = {
  agencyInfo: {
    heroTitle: "AI-First Growth Agency & Multi-Engine Ecosystem",
    heroSubtitle: "Build smart AI mobile apps, automate marketing, create synthetic media, and scale 10x faster through custom automation pipelines and intelligent agents.",
    email: "gro10xnow@gmail.com",
    phone: "+8801708459008",
    whatsapp: "+8801708459008",
    registeredAddress: "Dhaka, Bangladesh (BST / UTC+6)",
    operatingAddress: "Global Remote Operations & Dhaka Hub",
    stats: { years: "5+", clients: "50+", creatives: "10,000+", reach: "5M+" }
  },
  clientMarquee: [
    "AI Startups", "E-Commerce Brands", "Creator Networks",
    "Digital Agencies", "SaaS Founders", "Fintech Ventures"
  ],
  whyUs: [
    { icon: "⚡", title: "5-Engine Revenue Ecosystem", description: "Diversified, high-margin revenue model spanning Micro-SaaS, Freelance, Etsy Assets, Retainers, and Media." },
    { icon: "🤖", title: "Autonomous AI Workflows", description: "From ComfyUI studio pipelines to custom RAG bots and fine-tuned models delivering 10x output speed." },
    { icon: "🛡️", title: "65% Net Margin Architecture", description: "Ultra-lean, high-efficiency operations keeping fixed overhead under $35k to maximize net profitability." }
  ],
  services: DEFAULT_SERVICES,
  portfolioShowcase: [
    { id: "PORT-001", title: "Autonomous AI Chatbot Network", subtitle: "24/7 Multi-Language Customer Acquisition & Qualification", category: "AI & Automation", metric: "🤖 10,000+ Monthly Leads", image: "/images/portfolio/bot.webp" },
    { id: "PORT-002", title: "Studio ComfyUI Image Pipeline", subtitle: "Automated Commercial Product Photo Generation", category: "Synthetic Media", metric: "⚡ 500+ Images / Hour", image: "/images/portfolio/comfy.webp" },
    { id: "PORT-003", title: "Micro-SaaS Utility Platform", subtitle: "Next.js & Supabase Cloud Architecture with Stripe Billing", category: "SaaS & Web", metric: "💻 99.99% Uptime", image: "/images/portfolio/saas.webp" }
  ],
  pricingPackages: [
    { id: "PKG-001", name: "AI Sprint Setup", tier: "STARTUP", price: "$1,500", period: "/ one-time", featured: false, features: ["Custom AI Bot or Workflow Build", "Direct API & CRM Integrations", "Full Source Code Handover", "14 Days Launch Support"] },
    { id: "PKG-002", name: "Growth Retainer", tier: "GROWTH", price: "$500", period: "/ month", featured: true, features: ["Dedicated AI Engineering Team", "Weekly Content & Asset Batches", "Continuous Prompt Optimization", "Direct WhatsApp & Slack Channel"] },
    { id: "PKG-003", name: "Micro-SaaS Tier", tier: "SCALE", price: "$49", period: "/ month", featured: false, features: ["Full Access to GRO10X Tool Suite", "Cloud Hosted Vector Database", "Automated Daily Backups", "Community & Prompt Library Access"] }
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

  const portfolioList = content.portfolioShowcase || content.portfolio || defaultCMSContent.portfolioShowcase;

  res.json({
    success: true,
    content: {
      ...content,
      portfolio: portfolioList,
      portfolioShowcase: portfolioList
    }
  });
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


// ──────── SERVICE CATALOG CRUD ────────

let inMemoryServices = [...defaultCMSContent.services];

// GET /api/cms/services — list services from Supabase or default
router.get('/services', async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return res.json(data.map(s => ({
          ...s,
          features: s.features || s.included_features || [],
          includedFeatures: s.included_features || s.features || [],
          public: s.is_public ?? true
        })));
      }
    } catch (e) {}
  }
  // Fallback to embedded defaults
  res.json(inMemoryServices.map(s => ({ ...s, includedFeatures: s.features || s.includedFeatures || [], public: s.public ?? true })));
});

// GET /api/cms/services/:id — get a single service by ID
router.get('/services/:id', async (req, res) => {
  const { id } = req.params;
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return res.json({
          success: true,
          service: {
            ...data,
            features: data.features || data.included_features || [],
            includedFeatures: data.included_features || data.features || [],
            public: data.is_public ?? true
          }
        });
      }
    } catch (e) {}
  }

  const fallback = inMemoryServices.find(s => s.id === id);
  if (fallback) {
    return res.json({
      success: true,
      service: { ...fallback, includedFeatures: fallback.features || fallback.includedFeatures || [], public: fallback.public ?? true }
    });
  }

  res.status(404).json({ error: 'Service not found' });
});

// POST /api/cms/services — create a new service
router.post('/services', requireAuth, requireAdmin, async (req, res) => {
  const { title, category, price, description, icon, is_public } = req.body;
  const rawFeatures = req.body.features || req.body.includedFeatures || [];
  if (!title) return res.status(400).json({ error: 'title is required' });

  const crypto = require('crypto');
  const rawId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const newId = `SVC-${rawId.split('-')[0].toUpperCase()}`;
  const parsedFeatures = Array.isArray(rawFeatures) ? rawFeatures : (rawFeatures ? String(rawFeatures).split(',').map(f => f.trim()) : []);

  const payload = {
    id: newId,
    title: String(title).trim(),
    category: category || 'General',
    price: price || '',
    description: description || '',
    icon: icon || '⚡',
    features: parsedFeatures,
    included_features: parsedFeatures,
    includedFeatures: parsedFeatures,
    is_public: is_public !== false,
    public: is_public !== false,
    created_at: new Date().toISOString()
  };

  inMemoryServices.unshift(payload);

  if (isSupabaseConfigured()) {
    supabase.from('services').insert([payload]).then(null, e => {
      console.warn('[CMS API] Supabase insert background note:', e.message);
    });
  }

  try { broadcast('cms_update', { serviceAdded: payload }); } catch (e) {}
  return res.status(201).json({ success: true, service: payload });
});

// PUT /api/cms/services/:id — update an existing service
router.put('/services/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, category, price, description, icon, is_public } = req.body;
  const rawFeatures = req.body.features !== undefined ? req.body.features : req.body.includedFeatures;

  const updates = {};
  if (title !== undefined) updates.title = String(title).trim();
  if (category !== undefined) updates.category = category;
  if (price !== undefined) updates.price = price;
  if (description !== undefined) updates.description = description;
  if (icon !== undefined) updates.icon = icon;
  if (is_public !== undefined) {
    updates.is_public = is_public;
    updates.public = is_public;
  }
  if (rawFeatures !== undefined) {
    const parsedFeatures = Array.isArray(rawFeatures) ? rawFeatures : String(rawFeatures).split(',').map(f => f.trim());
    updates.features = parsedFeatures;
    updates.included_features = parsedFeatures;
    updates.includedFeatures = parsedFeatures;
  }
  updates.updated_at = new Date().toISOString();

  const memIdx = inMemoryServices.findIndex(s => s.id === id);
  if (memIdx !== -1) {
    inMemoryServices[memIdx] = { ...inMemoryServices[memIdx], ...updates };
  }

  if (isSupabaseConfigured()) {
    supabase.from('services').update(updates).eq('id', id).then(null, () => {});
  }

  try { broadcast('cms_update', { serviceUpdated: { id, ...updates } }); } catch (e) {}
  return res.json({ success: true, service: inMemoryServices[memIdx] || { id, ...updates } });
});

// DELETE /api/cms/services/:id — remove a service
router.delete('/services/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  inMemoryServices = inMemoryServices.filter(s => s.id !== id);

  if (isSupabaseConfigured()) {
    supabase.from('services').delete().eq('id', id).then(null, () => {});
  }

  try { broadcast('cms_update', { serviceDeleted: id }); } catch (e) {}
  return res.json({ success: true, id });
});

module.exports = router;


