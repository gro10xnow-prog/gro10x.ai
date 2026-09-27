-- ============================================================================
-- Seed: seed_taxonomy.sql
-- Description: Master Seed Data for Gro10x 5-Engine Taxonomy
-- Canonical Model: Company -> Engine -> Vertical -> Brand -> Category -> Product -> SKU
-- ============================================================================

-- 1. SEED ENGINES
INSERT INTO public.catalog_engines (id, engine_num, code, name, tagline, target_arr, target_share, icon)
VALUES
('engine1', 1, 'E1', 'AI Agent Ecosystem and Platform', 'Proprietary multi-tenant AI agents and SaaS tools', 35000, '35%', '🤖'),
('engine2', 2, 'E2', 'AI Service Agency', 'High-intent client builds, bespoke MVPs, and sprint delivery', 25000, '25%', '⚡'),
('engine3', 3, 'E3', 'Omnichannel Commerce & Asset Brands', 'Interactive micro-software, POD merchandise, and DCE physical goods', 20000, '20%', '📦'),
('engine4', 4, 'E4', 'Managed Retainer Services', 'Recurring operational retainers, vertical OS hosting, and SLAs', 15000, '15%', '🤝'),
('engine5', 5, 'E5', 'Programmatic AI Video & Media Scale', 'Owned channels, executive personal branding, and high-CPM media', 5000, '5%', '🎬')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    target_arr = EXCLUDED.target_arr,
    target_share = EXCLUDED.target_share;

-- 2. SEED VERTICALS
INSERT INTO public.catalog_verticals (id, engine_id, code, name, description, icon, sort_order)
VALUES
-- Engine 1 Verticals
('e1-career', 'engine1', 'CAR', 'Career & Capability', 'AI agents for career progression, interview mastery, and skill certification', '🎯', 1),
('e1-finance', 'engine1', 'FIN', 'Finance', 'AI bookkeeping, expense leakage audits, and automated ledgers', '💳', 2),
('e1-sme', 'engine1', 'SME', 'Service Provider & SME', 'AI operating copilots, client intake bots, and solo-operator workflows', '🏢', 3),
('e1-education', 'engine1', 'EDU', 'Education', 'Interactive learning engines, student copilots, and visual study tutors', '🎓', 4),

-- Engine 2 Verticals
('e2-enterprise', 'engine2', 'ENT', 'Enterprise', 'Large enterprise bespoke LLM integrations and private pipeline architectures', '🏛️', 1),
('e2-sme', 'engine2', 'SME', 'SME', 'Fast-paced automation sprints, custom MVPs, and workflow optimizations', '📈', 2),
('e2-personal', 'engine2', 'PER', 'Personal & Creators', 'Founder brand tooling, personalized AI assistants, and creator workflows', '👤', 3),
('e2-govtech', 'engine2', 'GOV', 'Government & NGOs', 'Public sector portals, civic service meshes, and institutional solutions', '🇧🇩', 4),

-- Engine 3 Verticals
('e3-digital', 'engine3', 'DIG', 'Digital', 'Interactive planners, Notion systems, SVG cut files, fonts, and software licenses', '💻', 1),
('e3-food', 'engine3', 'FNB', 'Food and Beverage', 'Specialty nutrition, functional beverage brands, and artisanal pantry goods', '☕', 2),
('e3-fashion', 'engine3', 'FAS', 'Fashion and Lifestyle', 'Cottagecore apparel, custom pet accessories, aesthetic wall art, and party decor', '✨', 3),
('e3-electronics', 'engine3', 'ELC', 'Electronics and IT', '3D printed desk organization, ergonomic peripherals, and creator tech gear', '🔌', 4),
('e3-b2b', 'engine3', 'B2B', 'B2B', 'Solo agency template suites, career gifts, and DCE physical luxury binders', '💼', 5),

-- Engine 4 Verticals
('e4-content', 'engine4', 'CNT', 'AI Brand Content Retainers', 'Monthly managed short-form reels, AI avatars, voiceovers, and graphic assets', '📱', 1),
('e4-os-workflows', 'engine4', 'SYS', 'AI Operating Systems & Workflows', 'Single-tenant OS hosting, database maintenance, and bot mesh SLAs', '🖥️', 2),
('e4-devcare', 'engine4', 'DEV', 'AI-Enhanced Digital Products', 'Fractional AI CTO support, vector index maintenance, and API upgrades', '🛠️', 3),
('e4-growth', 'engine4', 'GRO', 'AI Growth & Managed Leads', 'Automated scraping pipelines, multi-channel outreach, and CRM triage', '🚀', 4),
('e4-custom', 'engine4', 'CUS', 'Custom AI Project Retainers', 'Dedicated custom engineering squads and private model fine-tuning', '⚙️', 5),

-- Engine 5 Verticals
('e5-owned', 'engine5', 'OWN', 'Owned Brands', 'In-house media operations fueling Gro10x products across Engines 1, 3, and 4', '💎', 1),
('e5-managed-brands', 'engine5', 'MGB', 'Managed Brands', 'End-to-end video and social production for corporate clients and SMEs', '🏷️', 2),
('e5-managed-ind', 'engine5', 'IND', 'Managed Individuals', 'Executive and founder personal branding pipelines and thought leadership', '👑', 3),
('e5-media-local', 'engine5', 'MHL', 'Media House Local', 'High-volume domestic audience reach, civic journalism, and cultural entertainment', '📍', 4),
('e5-media-global', 'engine5', 'MHG', 'Media House Global', 'High-CPM international documentary essays and strategic intelligence', '🌍', 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 3. SEED BRANDS & PLATFORM HUBS
INSERT INTO public.catalog_brands (id, vertical_id, code, name, type, tagline, sort_order)
VALUES
-- Engine 1 Platforms
('b-group-academy', 'e1-career', 'GRP', 'GroUp Academy', 'PLATFORM', 'Career mastery, interview simulation, and capability certification', 1),
('b-grocash', 'e1-finance', 'CSH', 'GroCash FinLedger', 'PLATFORM', 'Intelligent automated bookkeeping and cash leakage intelligence', 2),
('b-sme-os', 'e1-sme', 'SMO', 'SME Platform Hub', 'PLATFORM', 'Autonomous AI copilots for solo agencies and trade contractors', 3),
('b-edagent', 'e1-education', 'EDA', 'EdAgent Labs', 'PLATFORM', 'Personalized adaptive study companions and educational workflows', 4),

-- Engine 2 Practices
('b-gro10x-enterprise', 'e2-enterprise', 'ENT', 'GRO10X Enterprise Solutions', 'PRACTICE', 'Custom LLM architectures and mission-critical enterprise engineering', 1),
('b-gro10x-growth', 'e2-sme', 'GWT', 'GRO10X Growth Studio', 'PRACTICE', 'Agile MVP sprints, automations, and high-velocity builds', 2),

-- Engine 3 Brands (13 Etsy Brands + DigiVault + DCE)
('b-plannerqueengro', 'e3-digital', 'PLN', 'PlannerQueenGro', 'BRAND', 'Plan it. Own it. Live it. Interactive productivity and AI coaching', 1),
('b-promptvault', 'e3-digital', 'PRM', 'PromptVault', 'BRAND', 'Professional AI prompt operating systems and executive Notion hubs', 2),
('b-sparksvg', 'e3-digital', 'SPK', 'SparkSVG', 'BRAND', 'Precision cut files for Cricut, Glowforge, and maker laser crafts', 3),
('b-letterlab', 'e3-digital', 'LLF', 'LetterLab Fonts', 'BRAND', 'Distinctive typography and commercial handwritten scripts', 4),
('b-littlestars', 'e3-digital', 'LSL', 'LittleStarsLearning', 'BRAND', 'Early childhood Montessori worksheets and interactive learning apps', 5),
('b-pageforge', 'e3-digital', 'PGF', 'PageForge Publishing', 'BRAND', 'Amazon KDP non-fiction, low-content books, and guided journals', 6),
('b-inkwrapped', 'e3-digital', 'INK', 'InkWrapped', 'BRAND', 'Sublimation art, 20oz tumbler wraps, and seamless pattern files', 7),
('b-digivault-bd', 'e3-digital', 'DGV', 'DigiVault BD', 'BRAND', 'Local software utility licenses, developer kits, and subscriptions', 8),

('b-cozythreads', 'e3-fashion', 'COZ', 'CozyThreads™', 'BRAND', 'Cottagecore oversized hoodies, botanical totes, and aesthetic apparel', 1),
('b-wildmutt', 'e3-fashion', 'WLD', 'WildMutt Co.', 'BRAND', 'Pet lover lifestyle, custom breed graphic tees, and pet bandanas', 2),
('b-zenwallco', 'e3-fashion', 'ZEN', 'ZenWallCo', 'BRAND', 'Modern Japandi printable wall art and framed minimalist canvas', 3),
('b-fiestafoundry', 'e3-fashion', 'FST', 'FiestaFoundry', 'BRAND', 'Celebration suites, wedding printables, and milestone event decor', 4),

('b-tinydesks', 'e3-b2b', 'TNY', 'TinyDesks Studio', 'BRAND', 'Solo agency operating systems, client proposal decks, and contract packs', 1),
('b-proudpro', 'e3-b2b', 'PRD', 'ProudProfessional', 'BRAND', 'Career milestone celebration gifts, graduation suites, and awards', 2),
('b-dce-supplies', 'e3-b2b', 'DCE', 'DCE Luxury Supplies', 'BRAND', 'Physical A5 vegan leather ring binders, luxury brass pens, and paper refills', 3),

-- Engine 4 OS Brands & Practices
('b-shamsdental', 'e4-os-workflows', 'SHM', 'Shams Dental Care OS', 'OPERATING_SYSTEM', '17-Module Dental Practice OS with Gemini Vision Tooth Scan score', 1),
('b-bellavista', 'e4-os-workflows', 'BLV', 'BellaVista Hospitality OS', 'OPERATING_SYSTEM', 'Resort & multi-property management OS with AI Guest Concierge', 2),
('b-laundrymama', 'e4-os-workflows', 'LMA', 'LaundryMama Logistics OS', 'OPERATING_SYSTEM', 'Smart laundry and fleet delivery routing with Telegram MiniApps', 3),
('b-purpleos', 'e4-os-workflows', 'PRP', 'PurpleOS Agency OS', 'OPERATING_SYSTEM', 'Creative agency operating system with dual Telegram bot mesh', 4),
('b-hrx', 'e4-os-workflows', 'HRX', 'HRX Staffing OS', 'OPERATING_SYSTEM', '26-Module enterprise HRMS and Gemini candidate screening engine', 5),
('b-shopway', 'e4-os-workflows', 'SHP', 'ShopWay Commerce OS', 'OPERATING_SYSTEM', 'Omnichannel D2C storefront and multi-agent AI customer inbox', 6),
('b-dwc', 'e4-os-workflows', 'DWC', 'Dhaka Wholesale Club OS', 'OPERATING_SYSTEM', 'Mobile-first B2C wholesale commerce and zone hub logistics OS', 7),
('b-tarangini', 'e4-os-workflows', 'TRN', 'Tarangini Distribution OS', 'OPERATING_SYSTEM', 'Hyperlocal field franchise commerce with 400k-lead database', 8),
('b-gro10x-content', 'e4-content', 'MCT', 'GRO10X Media Retainer Practice', 'PRACTICE', 'Monthly managed short-form video pipelines and avatar generation', 9),
('b-gro10x-devcare', 'e4-devcare', 'DVC', 'GRO10X DevCare SLA', 'PRACTICE', 'Fractional AI CTO support, uptime guarantees, and model maintenance', 10),
('b-gro10x-leadmesh', 'e4-growth', 'LDM', 'GRO10X LeadMesh', 'PRACTICE', 'Turnkey automated lead generation, scraping, and WhatsApp triage', 11),
('b-gro10x-squad', 'e4-custom', 'CST', 'GRO10X Custom AI Squad', 'PRACTICE', 'Dedicated bespoke AI engineering and private LLM fine-tuning', 12),

-- Engine 5 Media Properties
('b-grow-bangla', 'e5-media-local', 'GBN', 'Grow Bangla', 'MEDIA_NETWORK', 'Career roadmaps, spoken English guides, and visa intelligence', 1),
('b-jonosharthe', 'e5-media-local', 'JNS', 'Jonosharthe Bangladesh', 'MEDIA_NETWORK', 'Civic investigations, public interest journalism, and social reality', 2),
('b-bong-hits', 'e5-media-local', 'BNG', 'Bong Hits', 'MEDIA_NETWORK', 'Bengali youth culture, comedy skits, and viral music video releases', 3),
('b-pilutics', 'e5-media-global', 'PLT', 'PILUTICS', 'MEDIA_NETWORK', 'Geopolitical deep-dives, economic corridors, and strategic map essays', 4),
('b-firoz-media', 'e5-managed-ind', 'FRZ', 'Firoz Executive Media', 'MEDIA_NETWORK', 'Founder-led thought leadership, tech engineering insights, and podcasts', 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline;

-- 4. SEED REPRESENTATIVE CATEGORIES
INSERT INTO public.catalog_categories (id, brand_id, code, name, description, sort_order)
VALUES
('cat-pln-planners', 'b-plannerqueengro', 'PLN', 'Daily & Weekly Planners', 'Interactive productivity planners and routines', 1),
('cat-pln-financial', 'b-plannerqueengro', 'FIN', 'Financial Trackers', 'Cash flow and spending leak audits', 2),
('cat-prm-midjourney', 'b-promptvault', 'MJN', 'Midjourney Prompt Vaults', 'Photorealism and cinematography prompts', 1),
('cat-coz-hoodies', 'b-cozythreads', 'HOD', 'Oversized Hoodies', 'Cottagecore and botanical oversized hoodies', 1),
('cat-tny-agency', 'b-tinydesks', 'OPS', 'Agency Operating Systems', 'Notion client portals and proposal kits', 1),
('cat-dce-binders', 'b-dce-supplies', 'BND', 'Ring Binders & Hardware', 'Vegan leather A5 binders and accessories', 1),
('cat-shm-dental', 'b-shamsdental', 'CLN', 'Clinic OS Core Modules', 'Tooth charting, EMR, and AI vision triage', 1),
('cat-g2-sprints', 'b-gro10x-growth', 'SPT', 'Product Sprints', 'High-intent MVP build sprints', 1),
('cat-g2-services', 'b-gro10x-growth', 'SVC', 'Agile Agency Services', 'Canonical fixed-scope agency services', 2),
('cat-mct-video', 'b-gro10x-content', 'VID', 'Short-form Content Retainers', 'Monthly managed video quotas', 1),
('cat-gbn-career', 'b-grow-bangla', 'VID', 'Career Video Series', 'Job interview breakdowns and tutorials', 1),
('cat-plt-geopolitics', 'b-pilutics', 'DOC', 'Geopolitical Documentaries', 'Animated documentary analysis', 1)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED REPRESENTATIVE PRODUCTS
INSERT INTO public.catalog_products (id, brand_id, category_id, product_code, name, delivery_type, pricing_model, metadata)
VALUES
('prod-pla14', 'b-plannerqueengro', 'cat-pln-planners', 'PLA-14', 'Daily & Weekly Planners #1 (Interactive Edition)', 'SOFTWARE', 'ONE_TIME', '{"spreads": 16, "ai_coach": true}'::jsonb),
('prod-pla15', 'b-plannerqueengro', 'cat-pln-planners', 'PLA-15', 'ADHD Low-Dopamine Focus Planner', 'SOFTWARE', 'ONE_TIME', '{"spreads": 12, "neurodivergent_focus": true}'::jsonb),
('prod-prm01', 'b-promptvault', 'cat-prm-midjourney', 'PRM-01', 'Midjourney Photorealism 10k Prompt Vault', 'DIGITAL_DOWNLOAD', 'ONE_TIME', '{"prompts": 10000}'::jsonb),
('prod-coz-hd01', 'b-cozythreads', 'cat-coz-hoodies', 'COZ-HD01', 'Wildflower Aesthetic Oversized Hoodie', 'PHYSICAL_POD', 'ONE_TIME', '{"fabric": "Organic Cotton", "pod_provider": "Printify"}'::jsonb),
('prod-dce-bnd01', 'b-dce-supplies', 'cat-dce-binders', 'DCE-BND01', 'A5 Vegan Leather Refillable Ring Binder', 'PHYSICAL_POD', 'ONE_TIME', '{"rings": 6, "color": "Plum Mauve"}'::jsonb),
('prod-sprint01', 'b-gro10x-growth', 'cat-g2-sprints', 'SPRINT-01', 'Sprint 01: Idea to Reality (2-Week MVP)', 'SERVICE', 'ONE_TIME', '{"duration_weeks": 2, "deliverables": ["Architecture", "MVP", "CI/CD"]}'::jsonb),
('prod-svc001', 'b-gro10x-growth', 'cat-g2-services', 'SVC-001', 'Full-Stack Web App Development', 'SERVICE', 'ONE_TIME', '{"stack": "React, Node, Supabase"}'::jsonb),
('prod-shams-os', 'b-shamsdental', 'cat-shm-dental', 'SHM-CORE', 'Shams Dental Practice Operating System', 'RETAINER_SLA', 'MONTHLY_RETAINER', '{"modules": 17, "ai_vision": true}'::jsonb),
('prod-mct-tier1', 'b-gro10x-content', 'cat-mct-video', 'MCT-TIER1', 'AI Brand Content Monthly Retainer (Tier 1)', 'RETAINER_SLA', 'MONTHLY_RETAINER', '{"reels": 8, "statics": 16, "commercials": 1}'::jsonb),
('prod-gbn-mcdonald', 'b-grow-bangla', 'cat-gbn-career', 'GBN-VID01', 'McDonalds Service Crew Interview English Guide', 'MEDIA_BROADCAST', 'FREE_MONETIZED', '{"youtube_id": "mcdonald-guide", "format": "Long-form"}'::jsonb),
('prod-plt-bayofbengal', 'b-pilutics', 'cat-plt-geopolitics', 'PLT-DOC01', 'Why Bangladesh Matters in Bay of Bengal Geopolitics', 'MEDIA_BROADCAST', 'FREE_MONETIZED', '{"youtube_id": "bay-of-bengal", "format": "Documentary"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    pricing_model = EXCLUDED.pricing_model;

-- 6. SEED CANONICAL SKUS WITH CHANNELS
INSERT INTO public.catalog_skus (id, product_id, sku_code, name, channel, price_usd, price_bdt, billing_interval)
VALUES
-- Engine 3 SKUs
('sku-pla14-etsy', 'prod-pla14', 'GRO-E3-DIG-PLN-PLA14-ETSY', 'PlannerQueen Daily Planner #1 on Etsy', 'ETSY', 14.99, 1750, 'one-time'),
('sku-pla14-portal', 'prod-pla14', 'GRO-E3-DIG-PLN-PLA14-PORTAL', 'PlannerQueen Daily Planner #1 Direct Portal', 'OWN_PORTAL', 12.99, 1500, 'one-time'),
('sku-coz-hd01-tiktok', 'prod-coz-hd01', 'GRO-E3-FAS-COZ-HD01-TIKTOK', 'Wildflower Hoodie on TikTok Shop', 'TIKTOK', 48.00, 5600, 'one-time'),
('sku-dce-bnd01-store', 'prod-dce-bnd01', 'GRO-E3-B2B-DCE-BND01-STORE', 'DCE A5 Luxury Binder Direct Store', 'OWN_PORTAL', 34.00, 3950, 'one-time'),

-- Engine 2 SKUs
('sku-sprint01-upwork', 'prod-sprint01', 'GRO-E2-SME-GWT-SPRINT01-UPW', 'Sprint 01 Idea-to-Reality on Upwork', 'UPWORK', 3500.00, 410000, 'one-time'),
('sku-sprint01-direct', 'prod-sprint01', 'GRO-E2-SME-GWT-SPRINT01-DIR', 'Sprint 01 Idea-to-Reality Direct Wire', 'DIRECT_WIRE', 3000.00, 350000, 'one-time'),
('sku-svc001-fiverr', 'prod-svc001', 'GRO-E2-SME-GWT-SVC001-FIV', 'Full-Stack Web App Build on Fiverr Pro', 'FIVERR', 1800.00, 210000, 'one-time'),

-- Engine 4 Retainer SKUs
('sku-shams-core-mth', 'prod-shams-os', 'GRO-E4-SYS-SHM-CORE-MTH', 'Shams Dental OS Monthly SLA Retainer', 'RETAINER_SLA', 300.00, 35000, 'monthly'),
('sku-mct-tier1-mth', 'prod-mct-tier1', 'GRO-E4-CNT-MCT-TIER1-MTH', 'AI Brand Content Monthly Retainer (8 Reels + 16 Statics)', 'RETAINER_SLA', 1500.00, 175000, 'monthly'),

-- Engine 5 Media SKUs
('sku-gbn-vid01-adsense', 'prod-gbn-mcdonald', 'GRO-E5-MHL-GBN-VID01-ADSENSE', 'Grow Bangla McDonald Guide AdSense Monetization', 'OWN_PORTAL', 0.00, 0, 'one-time'),
('sku-plt-doc01-adsense', 'prod-plt-bayofbengal', 'GRO-E5-MHG-PLT-DOC01-ADSENSE', 'PILUTICS Bay of Bengal Doc AdSense Monetization', 'OWN_PORTAL', 0.00, 0, 'one-time')
ON CONFLICT (id) DO UPDATE SET
    sku_code = EXCLUDED.sku_code,
    price_usd = EXCLUDED.price_usd,
    price_bdt = EXCLUDED.price_bdt;
