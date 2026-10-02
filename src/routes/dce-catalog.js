/**
 * src/routes/dce-catalog.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine (DCE) — Catalog & SKU Management API v1.0
 * 
 * Hierarchy: Verticals → Brands → Categories → Products → SKUs
 * 
 * Endpoints:
 * - /api/dce/metrics (System overview & counts)
 * - /api/dce/verticals (CRUD)
 * - /api/dce/brands (CRUD + scoped by vertical)
 * - /api/dce/categories (CRUD + scoped by brand)
 * - /api/dce/products (CRUD + with SKUs)
 * - /api/dce/skus (CRUD + preview generator)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { ok, fail, paginated, getPaginationParams, asyncHandler } = require('../utils/response');
const { generateSKU, parseSKU, isValidSKU, VALID_CHANNELS, VALID_FORMATS } = require('../utils/sku-generator');
const { requireDCEAdmin } = require('../middleware/dce-auth');
const { validateSchema, whitelist, isValidUUID } = require('../middleware/dce-validate');

// In-Memory Seed Fallback (used if Supabase table is not yet migrated or offline)
let memVerticals = [
  { id: 'v-prod-01', slug: 'productivity', name: 'Productivity', description: 'Digital & physical organization, planning tools, and workflows', icon: '⚡', is_active: true, created_at: new Date().toISOString() },
  { id: 'v-fnb-02', slug: 'fnb', name: 'Food & Beverage', description: 'Specialty coffee roasters, culinary retail, and consumables', icon: '☕', is_active: true, created_at: new Date().toISOString() },
  { id: 'v-sub-03', slug: 'digital-subscriptions', name: 'Digital Subscriptions & Licenses', description: 'Premium streaming, developer tools, AI credits, and software access', icon: '🔐', is_active: true, created_at: new Date().toISOString() },
  { id: 'v-stem-04', slug: 'stem-spatial-3d', name: 'STEM & Spatial 3D', description: 'Interactive WebGL, AR Quick Look, and educational spatial models', icon: '🔮', is_active: true, created_at: new Date().toISOString() }
];

let memBrands = [
  { id: 'b-pq-01', vertical_id: 'v-prod-01', slug: 'plannerqueen', name: 'PlannerQueen', logo_url: 'https://gro10x-ai.vercel.app/images/plannerqueen-logo.png', brand_guidelines: { primaryColor: '#FF6B81', tone: 'Empowering & Aesthetic' }, is_active: true, created_at: new Date().toISOString() },
  { id: 'b-oro-02', vertical_id: 'v-fnb-02', slug: 'oro-roasters', name: 'ORO Roasters', logo_url: 'https://gro10x-ai.vercel.app/images/oro-logo.png', brand_guidelines: { primaryColor: '#D4A373', tone: 'Artisanal & Premium' }, is_active: true, created_at: new Date().toISOString() },
  { id: 'b-dv-03', vertical_id: 'v-sub-03', slug: 'digivault', name: 'DigiVault BD', logo_url: 'https://gro10x-ai.vercel.app/images/digivault-logo.png', brand_guidelines: { primaryColor: '#A855F7', tone: 'Fast, Verified & Trusted' }, is_active: true, created_at: new Date().toISOString() },
  { id: 'b-stem-04', vertical_id: 'v-stem-04', slug: 'gro10x-spatial-lab', name: 'Gro10x Spatial Lab', logo_url: 'https://gro10x-ai.vercel.app/images/spatial-lab-logo.png', brand_guidelines: { primaryColor: '#00F0FF', tone: 'Futuristic, High-Fidelity & Educational' }, is_active: true, created_at: new Date().toISOString() }
];

let memCategories = [
  { id: 'c-dw-01', brand_id: 'b-pq-01', slug: 'daily-weekly-planner', name: 'Daily & Weekly Planner', metadata_schema: { supportsDigital: true, supportsPrint: true }, is_active: true, created_at: new Date().toISOString() },
  { id: 'c-goal-02', brand_id: 'b-pq-01', slug: 'goal-setting-journals', name: 'Goal Setting Journals', metadata_schema: { supportsDigital: true, supportsPrint: true }, is_active: true, created_at: new Date().toISOString() },
  { id: 'c-sub-01', brand_id: 'b-dv-03', slug: 'ai-software-subscriptions', name: 'AI & Software Subscriptions', metadata_schema: { supportsDigital: true, supportsPrint: false }, is_active: true, created_at: new Date().toISOString() },
  { id: 'c-stem-01', brand_id: 'b-stem-04', slug: '3d-spatial-models', name: '3D Spatial Models & USDZ AR', metadata_schema: { supportsDigital: true, supportsPrint: true }, is_active: true, created_at: new Date().toISOString() }
];

let memProducts = [
  {
    id: 'p-dw1-01',
    brand_id: 'b-pq-01',
    category_id: 'c-dw-01',
    product_code: 'PLNRQN-01',
    title: 'Daily & Weekly Planners #1 — PlannerQueenGro Style',
    product_type: 'DIGITAL',
    description: 'Flagship productivity system for high-achievers. Includes daily time-blocking and digital GoodNotes templates.',
    media_gallery: ['https://gro10x-ai.vercel.app/images/samples/planner-mockup-1.jpg'],
    digital_assets: { downloadUrl: 'https://vault.gro10x.ai/digital/plannerqueen-v1.pdf', format: 'PDF' },
    physical_attributes: {},
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'p-stem-01',
    brand_id: 'b-stem-04',
    category_id: 'c-stem-01',
    product_code: 'STEM-3D-01',
    title: 'Kids STEM 3D Explorer & Spatial Model Pack (Fox, Horse, Flamingo, Astronaut)',
    product_type: 'DIGITAL',
    description: 'Complete 3D spatial asset bundle with GLB/USDZ models, skeletal animations, hotspot callouts, sound synthesizers, and WebXR AR Quick Look commercial license.',
    media_gallery: ['https://gro10x-ai.vercel.app/3d-viewer/models/Fox.glb'],
    digital_assets: { downloadUrl: 'https://vault.gro10x.ai/digital/stem-3d-bundle.zip', format: 'GLB_USDZ' },
    physical_attributes: {},
    is_active: true,
    created_at: new Date().toISOString()
  }
];

let memSKUs = [
  { id: 'sku-01', product_id: 'p-dw1-01', sku: 'PLNRQN-PDF-ETSY-USD9.99', format: 'PDF', channel_code: 'ETSY', price: 9.99, price_bdt: 1200, currency: 'USD', channel_title: 'Daily & Weekly Planner GoodNotes Aesthetic Digital Template', channel_listing_id: 'ETSY-11829', stock_quantity: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'sku-02', product_id: 'p-dw1-01', sku: 'PLNRQN-PDF-GUMROAD-USD7.99', format: 'PDF', channel_code: 'GUMROAD', price: 7.99, price_bdt: 950, currency: 'USD', channel_title: 'PlannerQueen Digital Daily & Weekly System', channel_listing_id: 'GUM-pqdaily', stock_quantity: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'sku-03', product_id: 'p-dw1-01', sku: 'PLNRQN-PRINT-AMAZON-USD14.99', format: 'PRINT', channel_code: 'AMAZON', price: 14.99, price_bdt: 1800, currency: 'USD', channel_title: 'PlannerQueen Hardcover Daily & Weekly Undated Journal', channel_listing_id: 'B09XYZABC', stock_quantity: 250, is_active: true, created_at: new Date().toISOString() },
  { id: 'sku-04', product_id: 'p-dw1-01', sku: 'PLNRQN-BUNDLE-DIRECT-USD19.99', format: 'BUNDLE', channel_code: 'DIRECT', price: 19.99, price_bdt: 2400, currency: 'USD', channel_title: 'All-In-One PlannerQueen Suite: Hardcover Print + GoodNotes PDF', channel_listing_id: 'DIR-BUNDLE-01', stock_quantity: 100, is_active: true, created_at: new Date().toISOString() },
  { id: 'sku-05', product_id: 'p-dw1-01', sku: 'PLNRQN-PHYS-DIRECT-USD34.99', format: 'PHYSICAL', channel_code: 'DIRECT', price: 34.99, price_bdt: 4200, currency: 'USD', channel_title: 'PlannerQueen Luxury Spiral Hardcover 2026 Planner', channel_listing_id: 'DIR-PHYS-01', stock_quantity: 150, is_active: true, created_at: new Date().toISOString() },
  { id: 'sku-stem-01', product_id: 'p-stem-01', sku: 'SKU-3D-STEM-01', format: 'GLB_USDZ', channel_code: 'DIRECT', price: 14.99, price_bdt: 1800, currency: 'USD', channel_title: 'Kids STEM 3D Spatial Explorer Commercial Bundle (Fox, Horse, Flamingo, Astronaut)', channel_listing_id: 'DIR-3D-STEM-01', stock_quantity: 9999, is_active: true, created_at: new Date().toISOString() }
];

// ─────────────────────────────────────────────────────────────────────────────
// 0. METRICS & OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
router.get('/metrics', requireDCEAdmin, asyncHandler(async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const [vRes, bRes, cRes, pRes, sRes] = await Promise.all([
        supabase.from('dce_verticals').select('id, is_active', { count: 'exact' }),
        supabase.from('dce_brands').select('id, is_active', { count: 'exact' }),
        supabase.from('dce_categories').select('id, is_active', { count: 'exact' }),
        supabase.from('dce_products').select('id, is_active, product_type', { count: 'exact' }),
        supabase.from('dce_skus').select('id, channel_code, price, stock_quantity, is_active')
      ]);

      if (!vRes.error && !bRes.error && !pRes.error && !sRes.error) {
        const skus = sRes.data || [];
        const channelBreakdown = {};
        VALID_CHANNELS.forEach(c => channelBreakdown[c] = 0);
        skus.forEach(s => {
          channelBreakdown[s.channel_code] = (channelBreakdown[s.channel_code] || 0) + 1;
        });

        return ok(res, {
          totalVerticals: vRes.count || vRes.data?.length || 0,
          totalBrands: bRes.count || bRes.data?.length || 0,
          totalCategories: cRes.count || cRes.data?.length || 0,
          totalProducts: pRes.count || pRes.data?.length || 0,
          totalSKUs: skus.length,
          channelBreakdown,
          supportedChannels: VALID_CHANNELS,
          supportedFormats: VALID_FORMATS,
          dataSource: 'supabase'
        });
      }
    } catch (e) {
      console.warn('[DCE Metrics] Supabase query note:', e.message);
    }
  }

  // Fallback to in-memory metrics
  const channelBreakdown = {};
  VALID_CHANNELS.forEach(c => channelBreakdown[c] = 0);
  memSKUs.forEach(s => {
    channelBreakdown[s.channel_code] = (channelBreakdown[s.channel_code] || 0) + 1;
  });

  return ok(res, {
    totalVerticals: memVerticals.length,
    totalBrands: memBrands.length,
    totalCategories: memCategories.length,
    totalProducts: memProducts.length,
    totalSKUs: memSKUs.length,
    channelBreakdown,
    supportedChannels: VALID_CHANNELS,
    supportedFormats: VALID_FORMATS,
    dataSource: 'memory'
  });
}));

// Public DCE Unified Product & SKU Catalog
router.get('/catalog', asyncHandler(async (req, res) => {
  const items = memSKUs.map(s => {
    const p = memProducts.find(prod => prod.id === s.product_id);
    return {
      sku: s.sku,
      title: s.channel_title || p?.title || s.sku,
      format: s.format,
      channel: s.channel_code,
      priceUsd: s.currency === 'USD' ? s.price : Math.round((s.price / 120) * 100) / 100,
      priceBdt: s.price_bdt || (s.currency === 'BDT' ? s.price : Math.round(s.price * 120)),
      brandId: p?.brand_id || 'b-stem-04'
    };
  });
  return ok(res, items);
}));

// ─────────────────────────────────────────────────────────────────────────────
// 1. VERTICALS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/verticals', asyncHandler(async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_verticals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return ok(res, data);
    } catch (e) {}
  }
  return ok(res, memVerticals);
}));

router.post('/verticals', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { name, slug, description, icon } = req.body;
  if (!name) return fail(res, 'Vertical name is required', 400);

  const cleanSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newVertical = {
    name,
    slug: cleanSlug,
    description: description || '',
    icon: icon || '📦',
    is_active: true
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_verticals')
        .insert([newVertical])
        .select()
        .single();

      if (!error && data) return ok(res, data, 201);
      if (error) console.warn('[DCE Catalog DB Warning]:', error.message);
    } catch (e) {
      console.warn('[DCE Catalog DB Warning]:', e.message);
    }
  }

  const inMemItem = { id: `v-${Date.now()}`, ...newVertical, created_at: new Date().toISOString() };
  memVerticals.unshift(inMemItem);
  return ok(res, inMemItem, 201);
}));

router.put('/verticals/:id', requireDCEAdmin, whitelist(['name', 'slug', 'description', 'icon', 'is_active']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const { data, error } = await supabase
        .from('dce_verticals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return ok(res, data);
    } catch (e) {
      console.warn('[DCE Catalog DB Warning]:', e.message);
    }
  }

  const idx = memVerticals.findIndex(v => v.id === id);
  if (idx === -1) return fail(res, 'Vertical not found', 404);
  memVerticals[idx] = { ...memVerticals[idx], ...updates, updated_at: new Date().toISOString() };
  return ok(res, memVerticals[idx]);
}));

// ─────────────────────────────────────────────────────────────────────────────
// 2. BRANDS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/brands', asyncHandler(async (req, res) => {
  const { vertical_id } = req.query;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('dce_brands')
        .select('*, dce_verticals(name, slug)');

      if (vertical_id) query = query.eq('vertical_id', vertical_id);
      const { data, error } = await query.order('name', { ascending: true });

      if (!error && data) return ok(res, data);
    } catch (e) {}
  }

  let results = [...memBrands];
  if (vertical_id) results = results.filter(b => b.vertical_id === vertical_id);
  results = results.map(b => {
    const v = memVerticals.find(vert => vert.id === b.vertical_id);
    return { ...b, vertical_name: v ? v.name : 'Unknown' };
  });

  return ok(res, results);
}));

router.post('/brands', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { vertical_id, name, slug, logo_url, brand_guidelines } = req.body;
  if (!name || !vertical_id) return fail(res, 'Brand name and vertical_id are required', 400);

  const cleanSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newBrand = {
    vertical_id,
    name,
    slug: cleanSlug,
    logo_url: logo_url || '',
    brand_guidelines: brand_guidelines || {},
    is_active: true
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_brands')
        .insert([newBrand])
        .select()
        .single();

      if (!error && data) return ok(res, data, 201);
      if (error) console.warn('[DCE Catalog DB Warning]:', error.message);
    } catch (e) {
      console.warn('[DCE Catalog DB Warning]:', e.message);
    }
  }

  const inMemItem = { id: `b-${Date.now()}`, ...newBrand, created_at: new Date().toISOString() };
  memBrands.unshift(inMemItem);
  return ok(res, inMemItem, 201);
}));

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATEGORIES (Scoped under Brand)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/brands/:brandId/categories', asyncHandler(async (req, res) => {
  const { brandId } = req.params;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_categories')
        .select('*')
        .eq('brand_id', brandId)
        .order('name', { ascending: true });

      if (!error && data) return ok(res, data);
    } catch (e) {}
  }

  const filtered = memCategories.filter(c => c.brand_id === brandId);
  return ok(res, filtered);
}));

router.get('/categories', asyncHandler(async (req, res) => {
  const { limit, offset, page } = getPaginationParams(req, 25);
  const { brand_id } = req.query;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('dce_categories').select('*, dce_brands(name, slug)', { count: 'exact' });
      if (brand_id) query = query.eq('brand_id', brand_id);
      const { data, error, count } = await query.order('name', { ascending: true }).range(offset, offset + limit - 1);

      if (!error && data) return paginated(res, data, { limit, offset, page, total: count !== null ? count : data.length });
    } catch (e) {}
  }

  let filtered = [...memCategories];
  if (brand_id) filtered = filtered.filter(c => c.brand_id === brand_id);
  const total = filtered.length;
  const paginatedCategories = filtered.slice(offset, offset + limit);
  return paginated(res, paginatedCategories, { limit, offset, page, total });
}));

router.post('/brands/:brandId/categories', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const { name, slug, metadata_schema } = req.body;
  if (!name) return fail(res, 'Category name is required', 400);

  const cleanSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newCat = {
    brand_id: brandId,
    name,
    slug: cleanSlug,
    metadata_schema: metadata_schema || {},
    is_active: true
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_categories')
        .insert([newCat])
        .select()
        .single();

      if (!error && data) return ok(res, data, 201);
      if (error) console.warn('[DCE Catalog DB Warning]:', error.message);
    } catch (e) {
      console.warn('[DCE Catalog DB Warning]:', e.message);
    }
  }

  const inMemItem = { id: `c-${Date.now()}`, ...newCat, created_at: new Date().toISOString() };
  memCategories.unshift(inMemItem);
  return ok(res, inMemItem, 201);
}));

// ─────────────────────────────────────────────────────────────────────────────
// 4. PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/products', asyncHandler(async (req, res) => {
  const { limit, offset, page } = getPaginationParams(req, 25);
  const { brand_id, category_id, product_type, search } = req.query;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('dce_products')
        .select('*, dce_brands(name, slug), dce_categories(name, slug), dce_skus(*)', { count: 'exact' });

      if (brand_id) query = query.eq('brand_id', brand_id);
      if (category_id) query = query.eq('category_id', category_id);
      if (product_type) query = query.eq('product_type', product_type);
      if (search) query = query.ilike('title', `%${search}%`);

      const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (!error && data) return paginated(res, data, { limit, offset, page, total: count !== null ? count : data.length });
    } catch (e) {}
  }

  let filtered = memProducts.map(p => {
    const brand = memBrands.find(b => b.id === p.brand_id);
    const cat = memCategories.find(c => c.id === p.category_id);
    const skus = memSKUs.filter(s => s.product_id === p.id);
    return {
      ...p,
      brand_name: brand ? brand.name : '',
      category_name: cat ? cat.name : '',
      skus
    };
  });

  if (brand_id) filtered = filtered.filter(p => p.brand_id === brand_id);
  if (category_id) filtered = filtered.filter(p => p.category_id === category_id);
  if (product_type) filtered = filtered.filter(p => p.product_type === product_type);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q));
  }

  const total = filtered.length;
  const paginatedProducts = filtered.slice(offset, offset + limit);
  return paginated(res, paginatedProducts, { limit, offset, page, total });
}));

router.get('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_products')
        .select('*, dce_brands(*), dce_categories(*), dce_skus(*)')
        .eq('id', id)
        .single();

      if (!error && data) return ok(res, data);
    } catch (e) {}
  }

  const p = memProducts.find(prod => prod.id === id);
  if (!p) return fail(res, 'Product not found', 404);

  const brand = memBrands.find(b => b.id === p.brand_id);
  const cat = memCategories.find(c => c.id === p.category_id);
  const skus = memSKUs.filter(s => s.product_id === p.id);

  return ok(res, { ...p, brand, category: cat, skus });
}));

router.post('/products', requireDCEAdmin, validateSchema({
  brand_id: { type: 'string', required: true },
  category_id: { type: 'string', required: true },
  product_code: { type: 'string', required: true },
  title: { type: 'string', required: true, minLength: 2, maxLength: 250 },
  product_type: { type: 'string', enum: ['DIGITAL', 'PHYSICAL', 'BUNDLE'], required: false }
}), asyncHandler(async (req, res) => {
  const { brand_id, category_id, product_code, title, product_type, description, media_gallery, digital_assets, physical_attributes } = req.body;

  const cleanCode = String(product_code).toUpperCase().replace(/[^A-Z0-9-]/g, '');

  const newProduct = {
    brand_id,
    category_id,
    product_code: cleanCode,
    title,
    product_type: (product_type || 'DIGITAL').toUpperCase(),
    description: description || '',
    media_gallery: media_gallery || [],
    digital_assets: digital_assets || {},
    physical_attributes: physical_attributes || {},
    is_active: true
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_products')
        .insert([newProduct])
        .select()
        .single();

      if (!error && data) return ok(res, data, 201);
      if (error) console.warn('[DCE Catalog DB Warning]:', error.message);
    } catch (e) {
      console.warn('[DCE Catalog DB Warning]:', e.message);
    }
  }

  const inMemItem = { id: `p-${Date.now()}`, ...newProduct, created_at: new Date().toISOString() };
  memProducts.unshift(inMemItem);
  return ok(res, inMemItem, 201);
}));

// ─────────────────────────────────────────────────────────────────────────────
// 5. SKUs (Product × Format × Channel × Price)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/skus/preview', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { product_code, format, channel_code, currency, price } = req.body;
  try {
    const sku = generateSKU({
      productCode: product_code,
      format,
      channelCode: channel_code,
      currency: currency || 'USD',
      price
    });
    return ok(res, { sku, isValid: true });
  } catch (err) {
    return fail(res, err.message, 400);
  }
}));

router.get('/products/:productId/skus', asyncHandler(async (req, res) => {
  const { limit, offset, page } = getPaginationParams(req, 25);
  const { productId } = req.params;

  if (isSupabaseConfigured()) {
    try {
      const { data, error, count } = await supabase
        .from('dce_skus')
        .select('*', { count: 'exact' })
        .eq('product_id', productId)
        .order('channel_code', { ascending: true })
        .range(offset, offset + limit - 1);

      if (!error && data) return paginated(res, data, { limit, offset, page, total: count !== null ? count : data.length });
    } catch (e) {}
  }

  const skus = memSKUs.filter(s => s.product_id === productId);
  const total = skus.length;
  const paginatedSKUs = skus.slice(offset, offset + limit);
  return paginated(res, paginatedSKUs, { limit, offset, page, total });
}));

router.post('/products/:productId/skus', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { format, channel_code, price, currency = 'USD', channel_title, channel_listing_id, stock_quantity } = req.body;

  if (!format || !channel_code || price === undefined) {
    return fail(res, 'format, channel_code, and price are required', 400);
  }

  // Lookup product to get product_code for SKU synthesis
  let productCode = 'DCE';
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('dce_products').select('product_code').eq('id', productId).single();
      if (data) productCode = data.product_code;
    } catch (e) {}
  } else {
    const p = memProducts.find(prod => prod.id === productId);
    if (p) productCode = p.product_code;
  }

  let generatedSKUString;
  try {
    generatedSKUString = generateSKU({
      productCode,
      format,
      channelCode: channel_code,
      currency,
      price
    });
  } catch (err) {
    return fail(res, err.message, 400);
  }

  const newSKU = {
    product_id: productId,
    sku: generatedSKUString,
    format: format.toUpperCase(),
    channel_code: channel_code.toUpperCase(),
    price: Number(price),
    currency: currency.toUpperCase(),
    channel_title: channel_title || '',
    channel_listing_id: channel_listing_id || '',
    stock_quantity: stock_quantity !== undefined && stock_quantity !== '' ? Number(stock_quantity) : null,
    is_active: true
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_skus')
        .insert([newSKU])
        .select()
        .single();

      if (!error && data) return ok(res, data, 201);
      if (error) console.warn('[DCE Catalog DB Warning]:', error.message);
    } catch (e) {
      console.warn('[DCE Catalog DB Warning]:', e.message);
    }
  }

  // Check in-memory uniqueness
  const existing = memSKUs.find(s => s.product_id === productId && s.format === newSKU.format && s.channel_code === newSKU.channel_code);
  if (existing) {
    return fail(res, `A SKU for format '${newSKU.format}' on channel '${newSKU.channel_code}' already exists for this product`, 409);
  }

  const inMemItem = { id: `sku-${Date.now()}`, ...newSKU, created_at: new Date().toISOString() };
  memSKUs.unshift(inMemItem);
  return ok(res, inMemItem, 201);
}));

router.put('/skus/:id', requireDCEAdmin, whitelist(['price', 'currency', 'channel_title', 'channel_listing_id', 'stock_quantity', 'is_active']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const { data, error } = await supabase
        .from('dce_skus')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return ok(res, data);
    } catch (e) {
      console.warn('[DCE Catalog DB Warning]:', e.message);
    }
  }

  const idx = memSKUs.findIndex(s => s.id === id);
  if (idx === -1) return fail(res, 'SKU not found', 404);
  memSKUs[idx] = { ...memSKUs[idx], ...updates, updated_at: new Date().toISOString() };
  return ok(res, memSKUs[idx]);
}));

router.delete('/skus/:id', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const { data, error } = await supabase.from('dce_skus').delete().eq('id', id).select();
      if (!error && data && data.length > 0) return ok(res, { deleted: true, id });
      if (error) {
        console.warn('[DCE Catalog DB Warning]:', error.message);
      }
    } catch (e) {
      console.warn('[DCE Catalog DB Warning]:', e.message);
    }
  }

  const idx = memSKUs.findIndex(s => s.id === id);
  if (idx === -1) return fail(res, 'SKU not found', 404);
  memSKUs.splice(idx, 1);
  return ok(res, { deleted: true, id });
}));

module.exports = router;
