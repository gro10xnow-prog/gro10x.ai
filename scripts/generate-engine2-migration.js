/**
 * scripts/generate-engine2-migration.js
 * Generates supabase/migrations/20260921_engine2_services_catalog.sql
 * by merging src/constants/services.js and docs/NOTEBOOKLM_LINKEDIN_CONTENT_SYSTEM.md.
 */

const fs = require('fs');
const path = require('path');
const { DEFAULT_SERVICES } = require('../src/constants/services');

const notebookDocPath = path.join(__dirname, '../docs/NOTEBOOKLM_LINKEDIN_CONTENT_SYSTEM.md');
const notebookDoc = fs.existsSync(notebookDocPath) ? fs.readFileSync(notebookDocPath, 'utf8') : '';

// Helper to extract NotebookLM data per service code
function getNotebookData(serviceCode) {
  const regex = new RegExp(`#### [^\\n]*${serviceCode}:[\\s\\S]*?(?=####|### Cluster|\\Z)`, 'i');
  const match = notebookDoc.match(regex);
  if (!match) return {};
  const block = match[0];

  const caseStudyMatch = block.match(/\*\*Case Study Angle\*\*:\s*([^\n]+)/i);
  const techStackMatch = block.match(/\*\*Tech Stack\*\*:\s*([^\n]+)/i);
  const queryMatch = block.match(/```([\s\S]*?)```/);
  const metricsMatch = block.match(/\*\*Key Transformation Metrics\*\*:\s*([^\n]+)/i);

  return {
    caseStudyAngle: caseStudyMatch ? caseStudyMatch[1].replace(/^["']|["']$/g, '').trim() : '',
    techStack: techStackMatch ? techStackMatch[1].split(',').map(s => s.trim()) : [],
    deepResearchQuery: queryMatch ? queryMatch[1].trim() : '',
    transformationMetrics: metricsMatch ? metricsMatch[1].split('|').map(s => s.trim()) : []
  };
}

// Category mapping
function getCategoryId(svc) {
  const id = svc.id;
  const num = parseInt(id.replace('SVC-', ''), 10);
  if (num >= 1 && num <= 7) return 'cat-e2-mobile-web';
  if (num === 25) return 'cat-e2-mobile-web';
  if (num >= 8 && num <= 13) return 'cat-e2-automation';
  if (num >= 14 && num <= 18) return 'cat-e2-agents';
  if (num >= 19 && num <= 22) return 'cat-e2-data-vision';
  if (num >= 23 && num <= 26) return 'cat-e2-advisory';
  return 'cat-e2-mobile-web';
}

function escapeSql(str) {
  if (str === null || str === undefined) return "''";
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function generateMigrationSql() {
  const lines = [];

  lines.push(`-- ============================================================================`);
  lines.push(`-- Migration: 20260921_engine2_services_catalog.sql`);
  lines.push(`-- Description: Engine 2 (AI Service Agency) Master Product Profiles & Multi-Channel SKUs`);
  lines.push(`-- Canonical Model: All 26 Services + Sprint 01 with 5-Pillar Proof Pack & Channel Payloads`);
  lines.push(`-- ============================================================================`);
  lines.push(``);

  // 1. Ensure channel_payload column exists in catalog_skus
  lines.push(`-- 1. Ensure channel_payload column exists in catalog_skus`);
  lines.push(`DO $$`);
  lines.push(`BEGIN`);
  lines.push(`    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_skus' AND column_name = 'channel_payload') THEN`);
  lines.push(`        ALTER TABLE public.catalog_skus ADD COLUMN channel_payload JSONB DEFAULT '{}'::jsonb;`);
  lines.push(`    END IF;`);
  lines.push(`END $$;`);
  lines.push(``);

  // 2. Insert Standardized Engine 2 Categories under b-gro10x-growth
  lines.push(`-- 2. Standardized Engine 2 Categories`);
  lines.push(`INSERT INTO public.catalog_categories (id, brand_id, code, name, description, sort_order)`);
  lines.push(`VALUES`);
  lines.push(`('cat-e2-mobile-web', 'b-gro10x-growth', 'MWB', 'AI Mobile & Web Development', 'Production mobile apps, SaaS platforms, and PWAs', 1),`);
  lines.push(`('cat-e2-automation', 'b-gro10x-growth', 'AUT', 'Business Process Automation', 'Event-driven webhooks, CRM workflows, and zero-fee middleware', 2),`);
  lines.push(`('cat-e2-agents', 'b-gro10x-growth', 'AGT', 'Custom AI Agents & Voice Systems', 'Autonomous conversational RAG agents and voice bots', 3),`);
  lines.push(`('cat-e2-data-vision', 'b-gro10x-growth', 'DTV', 'Data & Computer Vision AI', 'Image recognition, document extraction, and visual inspection', 4),`);
  lines.push(`('cat-e2-advisory', 'b-gro10x-growth', 'ADV', 'AI Strategy, Audits & Training', 'Architecture audits, roadmaps, and custom operating systems', 5),`);
  lines.push(`('cat-e2-sprints', 'b-gro10x-growth', 'SPT', 'Rapid Product Sprints', 'Fixed-scope, high-velocity MVP builds and validation', 6)`);
  lines.push(`ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`);
  lines.push(``);

  // 3. Products: SPRINT-01 + 26 Services
  lines.push(`-- 3. Master Products: Sprint 01 + 26 Canonical Services`);
  lines.push(`INSERT INTO public.catalog_products (id, brand_id, category_id, product_code, name, delivery_type, pricing_model, metadata, sort_order)`);
  lines.push(`VALUES`);

  const productRows = [];

  // Sprint 01 row
  const sprintMetadata = {
    slug: 'sprint-01-idea-to-reality',
    icon: '⚡',
    badge: 'FLAGSHIP SPRINT',
    description: 'Turn your idea into a production-ready, revenue-generating software MVP in exactly 14 days.',
    target_icp: ['Funded Startup Founders', 'Corporate Innovation Teams', 'Solopreneurs'],
    price_usd: 3500,
    price_bdt: 410000,
    proof_pack: {
      case_study_title: 'How a Solo Founder Launched a Production MVP in 14 Days and Secured First 100 Paying Users',
      video_url: 'https://youtu.be/RvNFX5nYDlM',
      video_poster: '/images/video-poster.webp',
      slides_pdf_url: '/assets/case-studies/sprint-01-playbook.pdf',
      audio_overview_url: 'https://open.spotify.com/episode/4yHOpQ5t9LRImJJaUxGCiu',
      blueprint_url: '/assets/blueprints/sprint-01-architecture.pdf',
      deep_research_query: 'Rapid MVP agile development sprint frameworks for 14-day turnaround'
    },
    engineering: {
      tech_stack: ['Next.js', 'Node.js', 'Supabase PostgreSQL', 'Tailwind CSS', 'Vercel Edge'],
      core_deliverables: [
        'Complete UX/UI Wireframe in Figma',
        'Production Full-Stack Application Codebase',
        'Supabase Relational Database with Row-Level Security',
        'Automated CI/CD Deployment on Vercel',
        'Payment Gateway Integration (Stripe or SSLCommerz)'
      ],
      included_features: [
        'Full Source Code Handover (GitHub Repository)',
        '30 Days Bug-Fix Warranty & Maintenance',
        'Live 1-on-1 Founder Handover Call'
      ],
      turnaround_days: 14,
      warranty_days: 30
    },
    faq: [
      { q: 'What happens if we need more features?', a: 'Sprint 01 focuses strictly on core MVP needle-movers. Additional features transition seamlessly into our Engine 4 DevCare Retainer.' },
      { q: 'Do we own 100% of the code?', a: 'Yes. Full intellectual property and GitHub repository are transferred to your organization upon completion.' }
    ]
  };

  productRows.push(`(
    'prod-sprint-01',
    'b-gro10x-growth',
    'cat-e2-sprints',
    'SPRINT-01',
    'Sprint 01: Idea to Reality (14-Day MVP)',
    'SERVICE',
    'ONE_TIME',
    ${escapeSql(JSON.stringify(sprintMetadata))}::jsonb,
    0
  )`);

  // 26 services
  DEFAULT_SERVICES.forEach((svc, index) => {
    const nbData = getNotebookData(svc.id);
    const catId = getCategoryId(svc);
    const priceNum = parseFloat((svc.priceUSD || '$2,500').replace(/[^0-9.]/g, '')) || 2500;
    const priceBdtNum = parseFloat((svc.priceBDT || '৳295,000').replace(/[^0-9.]/g, '')) || 295000;

    const metadata = {
      slug: svc.slug,
      icon: svc.icon || '⚡',
      badge: svc.badge || 'PRO',
      description: svc.description,
      details: svc.details || '',
      price_usd: priceNum,
      price_bdt: priceBdtNum,
      price_cycle: svc.priceCycle || '/ project',
      delivery_time: svc.deliveryTime || '2-3 Weeks',
      proof_pack: {
        case_study_title: svc.caseStudyTitle || nbData.caseStudyAngle || `${svc.title} Transformation Case Study`,
        video_url: svc.videoUrl || 'https://youtu.be/RvNFX5nYDlM',
        video_poster: svc.videoPoster || '/images/video-poster.webp',
        slides_pdf_url: svc.slidesPdfUrl || `/assets/case-studies/${svc.slug}.pdf`,
        audio_overview_url: svc.audioOverviewUrl || 'https://open.spotify.com/show/gro10x-ai-case-studies',
        blueprint_url: svc.blueprintUrl || `/assets/blueprints/${svc.slug}-blueprint.pdf`,
        deep_research_query: nbData.deepResearchQuery || '',
        transformation_metrics: nbData.transformationMetrics || []
      },
      engineering: {
        tech_stack: nbData.techStack.length > 0 ? nbData.techStack : ['Node.js', 'Express', 'Supabase', 'Gemini AI'],
        core_deliverables: svc.features || [],
        included_features: svc.includedFeatures || [],
        turnaround_days: svc.deliveryTime ? (parseInt(svc.deliveryTime) * 7 || 14) : 14,
        warranty_days: 30
      },
      faq: svc.faq || []
    };

    const rowId = `prod-${svc.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    productRows.push(`(
      ${escapeSql(rowId)},
      'b-gro10x-growth',
      ${escapeSql(catId)},
      ${escapeSql(svc.id)},
      ${escapeSql(svc.title)},
      'SERVICE',
      'ONE_TIME',
      ${escapeSql(JSON.stringify(metadata))}::jsonb,
      ${index + 1}
    )`);
  });

  lines.push(productRows.join(',\n') + ';');
  lines.push(``);

  // 4. Canonical SKUs for all 26 services + Sprint 01
  lines.push(`-- 4. Canonical SKUs across Upwork, Fiverr, and Direct Wire`);
  lines.push(`INSERT INTO public.catalog_skus (id, product_id, sku_code, name, channel, price_usd, price_bdt, billing_interval, channel_payload)`);
  lines.push(`VALUES`);

  const skuRows = [];

  // Sprint 01 SKUs
  skuRows.push(`(
    'sku-sprint01-upw',
    'prod-sprint-01',
    'GRO-E2-SME-GWT-SPRINT01-UPW',
    'Sprint 01 Idea-to-Reality on Upwork',
    'UPWORK',
    3500.00,
    410000,
    'one-time',
    ${escapeSql(JSON.stringify({
      outcome_title: 'You will get a production-ready software MVP launched in 14 days',
      project_steps: [
        { step: 1, name: 'Architecture Blueprint & Figma Prototype', days: 3 },
        { step: 2, name: 'Full-Stack Core Development & Database RLS', days: 7 },
        { step: 3, name: 'Cloud Deployment, Testing & Handover', days: 4 }
      ]
    }))}::jsonb
  )`);

  skuRows.push(`(
    'sku-sprint01-fiv',
    'prod-sprint-01',
    'GRO-E2-SME-GWT-SPRINT01-FIV',
    'Sprint 01 Idea-to-Reality on Fiverr Pro',
    'FIVERR',
    3000.00,
    350000,
    'one-time',
    ${escapeSql(JSON.stringify({
      gig_title: 'I will build your custom software MVP or PWA in 14 days',
      tags: ['mvp development', 'software build', 'fast web app', 'startup mvp', 'supabase'],
      tiers: {
        basic: { name: 'MVP Prototype', price: 1500, deliveryDays: 5, revisions: 2 },
        standard: { name: 'Production MVP', price: 3000, deliveryDays: 14, revisions: 4 },
        premium: { name: 'Full Launch Suite', price: 4500, deliveryDays: 21, revisions: 'Unlimited' }
      },
      buyer_requirements: [
        'Do you have a product requirements document or reference sketch?',
        'What are your primary business goals for this MVP?',
        'Do you have your cloud hosting or API accounts ready?'
      ]
    }))}::jsonb
  )`);

  skuRows.push(`(
    'sku-sprint01-dir',
    'prod-sprint-01',
    'GRO-E2-SME-GWT-SPRINT01-DIR',
    'Sprint 01 Idea-to-Reality Direct Wire',
    'DIRECT_WIRE',
    3000.00,
    350000,
    'one-time',
    ${escapeSql(JSON.stringify({
      sow_type: 'FIXED_SPRINT',
      milestones: [
        { name: 'Kickoff & Architecture Approval', percent: 50 },
        { name: 'Staging Delivery & Source Code Handover', percent: 50 }
      ],
      warranty_days: 30
    }))}::jsonb
  )`);

  // 26 services SKUs
  DEFAULT_SERVICES.forEach(svc => {
    const prodId = `prod-${svc.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const codeClean = svc.id.replace(/[^A-Z0-9]/gi, '');
    const priceNum = parseFloat((svc.priceUSD || '$2,500').replace(/[^0-9.]/g, '')) || 2500;
    const priceBdtNum = parseFloat((svc.priceBDT || '৳295,000').replace(/[^0-9.]/g, '')) || 295000;

    // Upwork SKU
    skuRows.push(`(
      'sku-${svc.id.toLowerCase()}-upw',
      ${escapeSql(prodId)},
      'GRO-E2-SME-GWT-${codeClean}-UPW',
      ${escapeSql(`${svc.title} on Upwork Project Catalog`)},
      'UPWORK',
      ${priceNum},
      ${priceBdtNum},
      'one-time',
      ${escapeSql(JSON.stringify({
        outcome_title: `You will get ${svc.title.toLowerCase()} engineered with AI and cloud architecture`,
        delivery_time: svc.deliveryTime || '2-3 Weeks',
        key_deliverables: svc.features || []
      }))}::jsonb
    )`);

    // Fiverr SKU
    skuRows.push(`(
      'sku-${svc.id.toLowerCase()}-fiv',
      ${escapeSql(prodId)},
      'GRO-E2-SME-GWT-${codeClean}-FIV',
      ${escapeSql(`${svc.title} on Fiverr Pro`)},
      'FIVERR',
      ${priceNum},
      ${priceBdtNum},
      'one-time',
      ${escapeSql(JSON.stringify({
        gig_title: `I will build your ${svc.title.toLowerCase().substring(0, 45)}`,
        tags: [svc.category || 'ai development', 'automation', 'software', 'mvp', 'fast build'].slice(0, 5),
        tiers: {
          basic: { name: 'Starter Package', price: Math.round(priceNum * 0.5), deliveryDays: 5, revisions: 2 },
          standard: { name: 'Complete Package', price: priceNum, deliveryDays: 14, revisions: 4 },
          premium: { name: 'Enterprise Package', price: Math.round(priceNum * 1.6), deliveryDays: 21, revisions: 'Unlimited' }
        }
      }))}::jsonb
    )`);

    // Direct Wire SKU
    skuRows.push(`(
      'sku-${svc.id.toLowerCase()}-dir',
      ${escapeSql(prodId)},
      'GRO-E2-SME-GWT-${codeClean}-DIR',
      ${escapeSql(`${svc.title} Direct Proposal`)},
      'DIRECT_WIRE',
      ${priceNum},
      ${priceBdtNum},
      'one-time',
      ${escapeSql(JSON.stringify({
        contract_type: 'FIXED_MILESTONE',
        payment_terms: '50% upfront, 50% upon final acceptance',
        support_days: 30
      }))}::jsonb
    )`);
  });

  lines.push(skuRows.join(',\n') + ';');
  lines.push(``);

  return lines.join('\n');
}

const sql = generateMigrationSql();
const outPath = path.join(__dirname, '../supabase/migrations/20260921_engine2_services_catalog.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('✅ Generated migration successfully at:', outPath);
console.log('Total bytes:', sql.length);
