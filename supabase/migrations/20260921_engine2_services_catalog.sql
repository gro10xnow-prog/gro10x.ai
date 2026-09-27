-- ============================================================================
-- Migration: 20260921_engine2_services_catalog.sql
-- Description: Engine 2 (AI Service Agency) Master Product Profiles & Multi-Channel SKUs
-- Canonical Model: All 26 Services + Sprint 01 with 5-Pillar Proof Pack & Channel Payloads
-- ============================================================================

-- 1. Ensure channel_payload column exists in catalog_skus
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_skus' AND column_name = 'channel_payload') THEN
        ALTER TABLE public.catalog_skus ADD COLUMN channel_payload JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Standardized Engine 2 Categories
INSERT INTO public.catalog_categories (id, brand_id, code, name, description, sort_order)
VALUES
('cat-e2-mobile-web', 'b-gro10x-growth', 'MWB', 'AI Mobile & Web Development', 'Production mobile apps, SaaS platforms, and PWAs', 1),
('cat-e2-automation', 'b-gro10x-growth', 'AUT', 'Business Process Automation', 'Event-driven webhooks, CRM workflows, and zero-fee middleware', 2),
('cat-e2-agents', 'b-gro10x-growth', 'AGT', 'Custom AI Agents & Voice Systems', 'Autonomous conversational RAG agents and voice bots', 3),
('cat-e2-data-vision', 'b-gro10x-growth', 'DTV', 'Data & Computer Vision AI', 'Image recognition, document extraction, and visual inspection', 4),
('cat-e2-advisory', 'b-gro10x-growth', 'ADV', 'AI Strategy, Audits & Training', 'Architecture audits, roadmaps, and custom operating systems', 5),
('cat-e2-sprints', 'b-gro10x-growth', 'SPT', 'Rapid Product Sprints', 'Fixed-scope, high-velocity MVP builds and validation', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 3. Master Products: Sprint 01 + 26 Canonical Services
INSERT INTO public.catalog_products (id, brand_id, category_id, product_code, name, delivery_type, pricing_model, metadata, sort_order)
VALUES
(
    'prod-sprint-01',
    'b-gro10x-growth',
    'cat-e2-sprints',
    'SPRINT-01',
    'Sprint 01: Idea to Reality (14-Day MVP)',
    'SERVICE',
    'ONE_TIME',
    '{"slug":"sprint-01-idea-to-reality","icon":"⚡","badge":"FLAGSHIP SPRINT","description":"Turn your idea into a production-ready, revenue-generating software MVP in exactly 14 days.","target_icp":["Funded Startup Founders","Corporate Innovation Teams","Solopreneurs"],"price_usd":3500,"price_bdt":410000,"proof_pack":{"case_study_title":"How a Solo Founder Launched a Production MVP in 14 Days and Secured First 100 Paying Users","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/sprint-01-playbook.pdf","audio_overview_url":"https://open.spotify.com/episode/4yHOpQ5t9LRImJJaUxGCiu","blueprint_url":"/assets/blueprints/sprint-01-architecture.pdf","deep_research_query":"Rapid MVP agile development sprint frameworks for 14-day turnaround"},"engineering":{"tech_stack":["Next.js","Node.js","Supabase PostgreSQL","Tailwind CSS","Vercel Edge"],"core_deliverables":["Complete UX/UI Wireframe in Figma","Production Full-Stack Application Codebase","Supabase Relational Database with Row-Level Security","Automated CI/CD Deployment on Vercel","Payment Gateway Integration (Stripe or SSLCommerz)"],"included_features":["Full Source Code Handover (GitHub Repository)","30 Days Bug-Fix Warranty & Maintenance","Live 1-on-1 Founder Handover Call"],"turnaround_days":14,"warranty_days":30},"faq":[{"q":"What happens if we need more features?","a":"Sprint 01 focuses strictly on core MVP needle-movers. Additional features transition seamlessly into our Engine 4 DevCare Retainer."},{"q":"Do we own 100% of the code?","a":"Yes. Full intellectual property and GitHub repository are transferred to your organization upon completion."}]}'::jsonb,
    0
  ),
(
      'prod-svc-001',
      'b-gro10x-growth',
      'cat-e2-mobile-web',
      'SVC-001',
      'AI Mobile Apps',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-mobile-apps","icon":"📱","badge":"NEW","description":"Custom iOS and Android mobile apps with native generative AI and intelligent agent features built-in.","details":"We engineer production-ready iOS and Android applications embedded with OpenAI, Claude, and on-device machine learning models. Perfect for AI startups, productivity apps, voice companions, and smart business utilities.","price_usd":3500,"price_bdt":410000,"price_cycle":"/ project","delivery_time":"3-4 Weeks","proof_pack":{"case_study_title":"How an AI Startup Shipped On-Device Companions on iOS & Android in 28 Days","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/svc-001-ai-mobile-apps.pdf","audio_overview_url":"https://open.spotify.com/episode/4yHOpQ5t9LRImJJaUxGCiu?si=eSydMHYPSEKZylfv219d0Q","blueprint_url":"/assets/blueprints/svc-001-ai-mobile-blueprint.pdf","deep_research_query":"Deep research best practices for building cross-platform React Native and Flutter mobile applications integrated with on-device LLMs (CoreML, llama.cpp, TensorFlow Lite) and streaming cloud APIs. Include latency benchmarks, offline-first sync patterns, app store review approval guidelines for AI generative apps, and case studies of early-stage AI startups cutting development timelines from 6 months to 4 weeks.","transformation_metrics":["75% faster time-to-market","60% lower development cost","4.8-star App Store launch."]},"engineering":{"tech_stack":["React Native","Flutter","CoreML","TensorFlow Lite","FastAPI","Claude 3.5 Sonnet / OpenAI API."],"core_deliverables":["Native React Native / Flutter Stack","On-Device & Cloud AI Model Integration","Real-Time Sync & Offline Mode Support","App Store & Play Store Deployment Setup"],"included_features":["UX/UI Mobile Prototype in Figma","Full Source Code & GitHub Repository Handover","Cloud Infrastructure & Database Setup","30 Days Post-Launch Maintenance & Bug Fixes"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"Which platforms do you support?","a":"We build cross-platform apps using React Native and Flutter, ensuring seamless performance on both iOS and Android with a single unified codebase."},{"q":"Can we integrate our custom AI models?","a":"Yes. We connect via REST APIs, WebSockets, or on-device CoreML / TensorFlow Lite models depending on latency and privacy needs."}]}'::jsonb,
      1
    ),
(
      'prod-svc-002',
      'b-gro10x-growth',
      'cat-e2-mobile-web',
      'SVC-002',
      'AI Websites & Software',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-websites-software","icon":"💻","badge":"NEW","description":"Ultra-fast web platforms and SaaS apps powered by modern frameworks and smart AI automation tools.","details":"From high-converting landing pages to complex multi-tenant SaaS platforms, we design and code web experiences that turn visitors into paying customers on autopilot.","price_usd":2500,"price_bdt":295000,"price_cycle":"/ project","delivery_time":"2-3 Weeks","proof_pack":{"case_study_title":"Why Your $10,000 Website Isn''t Generating Inbound Sales","video_url":"https://youtu.be/KB5IHPsJL1U","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/svc-002-ai-websites-software.pdf","audio_overview_url":"https://open.spotify.com/episode/4sUxfMs6SQLgLt8tkiXecz?si=WfTS4fQuQ1mFq-Yp23KeAg","blueprint_url":"/assets/blueprints/svc-002-ai-websites-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Next.js 15","Node.js","Vercel Edge","Tailwind CSS","Supabase","Dynamic AI Forms."],"core_deliverables":["Next.js & Node.js Scalable Architecture","AI Lead Generation & Dynamic Forms","SEO & Core Web Vitals 95+ Optimized","Custom Database & User Authentication"],"included_features":["Custom Responsive Design System","Stripe / SSLCommerz Payment Gateway Integration","Admin Analytics Dashboard","Serverless Vercel Cloud Hosting Setup"],"turnaround_days":14,"warranty_days":30},"faq":[{"q":"Is the website SEO-ready?","a":"Yes, every page is built with semantic HTML, automated sitemaps, structured schema data, and fast load speeds to ensure top Google rankings."}]}'::jsonb,
      2
    ),
(
      'prod-svc-003',
      'b-gro10x-growth',
      'cat-e2-mobile-web',
      'SVC-003',
      'AI Chatbots & Intelligent Agents',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-chatbots-agents","icon":"🤖","badge":"POPULAR","description":"24/7 smart conversational assistants connected to your knowledge base, WhatsApp, and CRM pipelines.","details":"Replace static web forms and slow customer service with intelligent AI agents that qualify leads, answer detailed product questions, and book sales calls 24/7.","price_usd":1500,"price_bdt":175000,"price_cycle":"/ setup","delivery_time":"7-10 Days","proof_pack":{"case_study_title":"*\"How an E-Commerce Merchant Automated 85% of Customer Tickets and Booked $32,000 in WhatsApp Sales with a","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-chatbots-agents.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-chatbots-agents-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Node.js","Express","Supabase","Gemini AI"],"core_deliverables":["Context-Aware RAG Knowledge Base","WhatsApp, Telegram & Web Widget Sync","Human Handoff & CRM Auto-Recording","Multi-Language Automatic Translation"],"included_features":["Document Ingestion (PDFs, Notion, FAQs)","Lead Qualification & Booking Engine","Prompt Optimization & Anti-Hallucination Guardrails","1 Year Cloud Vector Database Hosting"],"turnaround_days":49,"warranty_days":30},"faq":[{"q":"How accurate is the chatbot?","a":"Using Retrieval-Augmented Generation (RAG) and strict guardrails, the bot only responds based on your verified business documents, preventing hallucinations."}]}'::jsonb,
      3
    ),
(
      'prod-svc-004',
      'b-gro10x-growth',
      'cat-e2-mobile-web',
      'SVC-004',
      'AI Integrations & APIs',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-integrations-apis","icon":"🔌","badge":"PRO","description":"Seamlessly connect your business tools (Google Workspace, Telegram, Stripe, CRMs) to Gemini and OpenAI models via custom webhooks.","details":"Unify your fragmented tools. We build custom Node.js and Google Apps Script API bridges that automate repetitive data entry, customer notifications, and internal operations.","price_usd":1200,"price_bdt":140000,"price_cycle":"/ project","delivery_time":"5-7 Days","proof_pack":{"case_study_title":"*\"How a Real Estate Firm Saved 30 Hours/Week by Connecting Google Workspace, Stripe, and Telegram via Event-Driven AI Webhooks.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-integrations-apis.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-integrations-apis-blueprint.pdf","deep_research_query":"Deep research event-driven webhook architectures and middleware bridging Google Workspace, Telegram bots, Stripe billing, and Gemini/OpenAI models. Focus on reliable message retry queues, sub-second execution, automated document parsing pipelines, and case studies of businesses replacing repetitive manual data entry between fragmented SaaS apps.","transformation_metrics":["30 hours saved weekly","100% data sync accuracy","0 manual copy-pasting."]},"engineering":{"tech_stack":["Node.js microservices","Google Apps Script","Webhooks","Telegram Bot API","Stripe Events","Gemini Flash."],"core_deliverables":["Custom Webhooks & REST API Middleware","Google Workspace & Apps Script AI Bridges","Automated Multi-Channel Sync Pipelines","Zero Downtime Architecture"],"included_features":["API Error Handling & Retry Queues","Rate-Limiting & Cost Monitoring","Secure Environment Secrets Management","Technical Documentation & Runbook"],"turnaround_days":35,"warranty_days":30},"faq":[{"q":"Which platforms can you connect?","a":"We build custom REST API bridges, webhooks, and Google Workspace automations connecting any platform with API access."}]}'::jsonb,
      4
    ),
(
      'prod-svc-005',
      'b-gro10x-growth',
      'cat-e2-mobile-web',
      'SVC-005',
      'AI Fine-Tuning & Custom Models',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-fine-tuning-custom-models","icon":"🧠","badge":"PRO","description":"Train and customize large language models on your internal data and brand tone for hyper-accurate outputs.","details":"When off-the-shelf models are not specialized enough, we fine-tune open-weight models (Llama 3, Mistral, Gemma) or OpenAI models on your proprietary datasets.","price_usd":2800,"price_bdt":330000,"price_cycle":"/ model","delivery_time":"2-3 Weeks","proof_pack":{"case_study_title":"*\"How a Legal Tech Venture Cut Monthly OpenAI API Bills by 72% by Fine-Tuning Llama-3 on Domain-Specific Contract Corpora.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-fine-tuning-custom-models.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-fine-tuning-custom-models-blueprint.pdf","deep_research_query":"Deep research parameter-efficient fine-tuning (PEFT, LoRA, QLoRA) on open-source foundation models (Llama 3, Mistral, Gemma) for domain-specific business use cases. Compare cloud inference costs of fine-tuned 8B models vs GPT-4o API calls, synthetic data generation techniques for training sets, evaluation benchmarks, and data privacy advantages for proprietary enterprise datasets.","transformation_metrics":["72% reduction in inference expenses","94.6% domain benchmark accuracy","100% private data isolation."]},"engineering":{"tech_stack":["LoRA / QLoRA","Llama-3 8B","Unsloth","Hugging Face","vLLM inference server."],"core_deliverables":["Dataset Cleaning, Formatting & Synthetic Data","LoRA & Full Fine-Tuning Pipelines","Automated Benchmark & Evals Testing","Private Secure Cloud Hosting"],"included_features":["Training Loss & Accuracy Reports","Inference API Endpoint Setup","Model Weight Export & Archive","Quarterly Retraining Protocol"],"turnaround_days":14,"warranty_days":30},"faq":[{"q":"Is our data kept secure and private?","a":"Absolutely. All training runs are conducted in isolated private environments and your data is never used to train public models."}]}'::jsonb,
      5
    ),
(
      'prod-svc-006',
      'b-gro10x-growth',
      'cat-e2-mobile-web',
      'SVC-006',
      'AI Technology Consulting',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-technology-consulting","icon":"💡","badge":"NEW","description":"Expert technical roadmap to help your executive team select, architect, and deploy the right AI toolset.","details":"Avoid costly mistakes by having senior AI software architects evaluate your technology strategy, cost models, and infrastructure before writing code.","price_usd":800,"price_bdt":95000,"price_cycle":"/ audit","delivery_time":"3-5 Days","proof_pack":{"case_study_title":"*\"How an Architecture Audit Saved a Series-A Founder $55,000 in Projected Cloud Compute Fees Before Writing a Single Line of Code.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-technology-consulting.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-technology-consulting-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Architectural Diagrams","ROI Matrix","Latency Profiling","Foundation Model Selection."],"core_deliverables":["Complete Tech Stack Architecture Audit","Cost vs. ROI Evaluation Matrix","Technical Architecture Diagram & Blueprints","Vendor & Foundation Model Selection"],"included_features":["2 x 90-Minute Executive Advisory Calls","Written 15-Page Technical Roadmap PDF","Security & Data Compliance Review","Implementation Vendor RFP Template"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"Who is this suitable for?","a":"Founders, CTOs, and agency owners planning new AI products who want clear architectural direction and risk mitigation."}]}'::jsonb,
      6
    ),
(
      'prod-svc-007',
      'b-gro10x-growth',
      'cat-e2-mobile-web',
      'SVC-007',
      'Let Us Manage Your Project',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"project-management","icon":"🛠️","badge":"PRO","description":"End-to-end dedicated technical management: we handle design, coding, testing, and cloud deployment.","details":"Have an entire dedicated engineering and design team at your disposal. We turn your product vision into reality without the friction of hiring and managing developers.","price_usd":2500,"price_bdt":295000,"price_cycle":"/ project","delivery_time":"Custom SLA","proof_pack":{"case_study_title":"*\"How an Overwhelmed Non-Technical Founder Handed Over Full Sprint Management and Shipped a Market-Ready Product in 6 Weeks.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/project-management.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/project-management-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Agile Kanban","CI/CD automated test pipelines","GRO10X Command Center","Daily Async Standups."],"core_deliverables":["Dedicated Technical Project Lead","Agile Weekly Sprints & Daily Standups","Transparent Real-Time Kanban Tracking","100% On-Time Delivery Guarantee"],"included_features":["Full Product Lifecycle Ownership","Automated CI/CD Deployment Pipelines","QA Testing & Code Review Audits","Weekly Video Briefings & Demos"],"turnaround_days":14,"warranty_days":30},"faq":[{"q":"How do we track progress?","a":"You get direct real-time access to our GRO10X Command Center Kanban board, weekly sprint demos, and Slack/Telegram channels."}]}'::jsonb,
      7
    ),
(
      'prod-svc-008',
      'b-gro10x-growth',
      'cat-e2-automation',
      'SVC-008',
      'AI Avatar Design',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-avatar-design","icon":"👤","badge":"NEW","description":"Photorealistic or stylized digital avatars and brand ambassadors customized for your marketing campaigns.","details":"Create recognizable virtual brand mascots and spokespersons for your video ads, product demonstrations, and social media channels without expensive actor fees.","price_usd":600,"price_bdt":70000,"price_cycle":"/ avatar kit","delivery_time":"3-5 Days","proof_pack":{"case_study_title":"*\"How a Health Brand Created a Permanent 4K Virtual Brand Ambassador, Slashing Production Costs Across 40 Video Ads.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-avatar-design.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-avatar-design-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["ComfyUI","Character Consistency LoRAs","4K Upscalers","Lip-Sync Rigging Kits."],"core_deliverables":["Multiple Character Poses & Facial Expressions","4K Ultra-HD Commercial License Export","Voice-Sync Ready Lip Rigging Assets","Complete Brand Asset Kit Included"],"included_features":["Character Consistency Prompt Bible","Transparent PNG & Layered Master Files","3 Revision Cycles","Social Media Avatar Presets"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"Can we use the avatar in video?","a":"Yes, our avatar asset kits are formatted for direct lip-syncing in HeyGen, SadTalker, and custom video pipelines."}]}'::jsonb,
      8
    ),
(
      'prod-svc-009',
      'b-gro10x-growth',
      'cat-e2-automation',
      'SVC-009',
      'AI Visuals & Product Imagery',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-visual-generation","icon":"🎨","badge":"POPULAR","description":"Bespoke commercial product imagery, marketing visuals, and brand assets generated with Google Flow and Gemini Imagen.","details":"Stop doing expensive physical photoshoots. Generate studio-quality marketing imagery, product mockups, and banner visuals in any setting or style.","price_usd":800,"price_bdt":95000,"price_cycle":"/ kit","delivery_time":"3-5 Days","proof_pack":{"case_study_title":"*\"How a DTC Skincare Brand Replaced a $14,000 Studio Photoshoot with 30 Photorealistic Generative Product Shots in 72 Hours.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-visual-generation.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-visual-generation-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Google Flow","Gemini Imagen 3","ComfyUI","ControlNet","Photoshop Firefly retouching."],"core_deliverables":["Ultra-HD 4K Commercial Product Shots","Brand Consistency & Style Preservation","Multiple Aspect Ratios (1:1, 9:16, 16:9)","High-Resolution Upscaling & Touch-up"],"included_features":["25+ Curated High-Resolution Visuals","Layered Source Deliverables & Transparent PNGs","Prompt Formula & Visual Guidelines Document","2 Detailed Revision Cycles"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"What tools do you use?","a":"We utilize Google Flow, Gemini Imagen, and specialized creative pipelines to deliver pixel-perfect commercial imagery."}]}'::jsonb,
      9
    ),
(
      'prod-svc-010',
      'b-gro10x-growth',
      'cat-e2-automation',
      'SVC-010',
      'AI Video Creatives & Avatar Spokespersons',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-video-creatives-heygen-capcut","icon":"🎬","badge":"NEW","description":"Photorealistic AI avatar videos and viral short-form social creatives produced with HeyGen and CapCut Pro.","details":"Engage your social media audience with realistic avatar presentations and viral short-form videos tailored for TikTok, Instagram Reels, and YouTube Shorts.","price_usd":600,"price_bdt":70000,"price_cycle":"/ pack","delivery_time":"3-4 Days","proof_pack":{"case_study_title":"*\"How a Fintech Startup Scaled from 2 to 20 Short-Form Video Ads Per Week Using HeyGen, CapCut Pro, and Dynamic Voiceover Pacing.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-video-creatives-heygen-capcut.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-video-creatives-heygen-capcut-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["HeyGen Studio","CapCut Pro","ElevenLabs Voice Synthesis","High-Retention Motion Typography."],"core_deliverables":["Photorealistic Multi-Language Talking Avatars","Dynamic Captions & Motion Graphics","High-Retention Vertical Video Pacing","4K Ultra-HD Master Video Renders"],"included_features":["5 Ready-to-Publish Short-Form Videos","Script Polishing & Native Voice Synthesis","Custom Brand Color Grading & Typography","Full Commercial Distribution License"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"Can we use custom scripts and branding?","a":"Yes, you provide the message or topic, and we produce the complete script, avatar performance, captions, and edits."}]}'::jsonb,
      10
    ),
(
      'prod-svc-011',
      'b-gro10x-growth',
      'cat-e2-automation',
      'SVC-011',
      'All AI Art Services',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"all-ai-art-services","icon":"✨","badge":"PRO","description":"Full-service visual production covering marketing creatives, social graphics, icon sets, and vector illustrations.","details":"A steady stream of fresh marketing assets every week to fuel your social channels, paid ads, blog posts, and marketing campaigns.","price_usd":500,"price_bdt":60000,"price_cycle":"/ month","delivery_time":"Ongoing Retainer","proof_pack":{"case_study_title":"*\"How an Agency Slashed Their In-House Graphic Design Bottleneck with an Unlimited 48-Hour AI Creative Retainer.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/all-ai-art-services.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/all-ai-art-services-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Dedicated Shared Figma Asset Library","ComfyUI","Gemini Imagen","Slack/Telegram Priority Queue."],"core_deliverables":["Weekly Creative Design Batches","Fast 48-Hour Turnaround SLA","Unlimited Revision Cycles on Active Requests","Social-Ready Formats (1:1, 9:16, 16:9)"],"included_features":["Dedicated Slack/Telegram Channel","Shared Figma Asset Library","Brand Style Guide Alignment","Cancel Anytime Monthly Retainer"],"turnaround_days":14,"warranty_days":30},"faq":[{"q":"How many assets can we request?","a":"You can submit unlimited requests to your queue, and we work on them sequentially with 48-hour turnarounds."}]}'::jsonb,
      11
    ),
(
      'prod-svc-012',
      'b-gro10x-growth',
      'cat-e2-automation',
      'SVC-012',
      'AI Business Consulting',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-business-consulting","icon":"👔","badge":"PRO","description":"Practical 1-on-1 strategy sessions to find the highest-ROI AI automation opportunities in your workflows.","details":"Learn how modern agencies and enterprises are cutting 20+ hours of manual work every week and scaling operations without growing headcount.","price_usd":750,"price_bdt":90000,"price_cycle":"/ session","delivery_time":"2 Days","proof_pack":{"case_study_title":"*\"How a Single 2-Hour Strategy Session Pinpointed 3 Automation Leaks and Saved an Accounting Firm 18 Hours Every Week.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-business-consulting.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-business-consulting-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Workflow Bottleneck Audit","AI Tool Matrix","Automation Architecture Document","ROI Calculator."],"core_deliverables":["Workflow Bottleneck Deep-Dive Analysis","Curated AI Tool Stack Recommendations","Step-by-Step Implementation Blueprint","Recorded Session & Executive Action Plan"],"included_features":["2-Hour Deep-Dive Strategy Call","Custom Automation Architecture Document","Cost vs. Time Savings Calculator","14 Days Follow-Up Q&A Support"],"turnaround_days":14,"warranty_days":30},"faq":[{"q":"What should we prepare before the call?","a":"A list of your repetitive business tasks, current software tools, and your primary operational goals for the quarter."}]}'::jsonb,
      12
    ),
(
      'prod-svc-013',
      'b-gro10x-growth',
      'cat-e2-automation',
      'SVC-013',
      'AI Strategy & Growth Roadmap',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-strategy-growth-roadmap","icon":"🗺️","badge":"PRO","description":"A comprehensive operational transformation roadmap to scale your agency or enterprise using automated systems.","details":"A strategic, executive-level document mapping out quarterly milestones, AI tool deployment, team training, and targeted cost reductions.","price_usd":1800,"price_bdt":210000,"price_cycle":"/ roadmap","delivery_time":"10-14 Days","proof_pack":{"case_study_title":"*\"How a 45-Person Logistics Company Mapped a 4-Quarter AI Transformation to Protect Margins and Double Operational Throughput.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-strategy-growth-roadmap.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-strategy-growth-roadmap-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Multi-Department AI Mapping","Financial KPI Projections","Vendor Scorecards","Governance Playbook."],"core_deliverables":["Multi-Department Operational AI Mapping","Financial KPI & Margin Growth Projections","Staff Upskilling & Tool Rollout Plan","Risk, Security & Privacy Policy Guidelines"],"included_features":["3 Comprehensive Advisory Interviews","25-Page Custom Transformation Playbook","Technology Vendor Selection Matrix","Quarterly Executive Milestone Plan"],"turnaround_days":70,"warranty_days":30},"faq":[{"q":"Is this suitable for enterprise companies?","a":"Yes, we tailor roadmaps for teams ranging from 5 to 250+ employees across diverse industries."}]}'::jsonb,
      13
    ),
(
      'prod-svc-014',
      'b-gro10x-growth',
      'cat-e2-agents',
      'SVC-014',
      'AI Lessons & Team Workshops',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-lessons-team-workshops","icon":"🎓","badge":"PRO","description":"Hands-on interactive training sessions to teach your employees how to use ChatGPT, Claude, Midjourney, and automation tools effectively.","details":"Empower your existing staff to produce 3x the output. We train your team on practical, day-to-day AI workflows tailored to your specific industry.","price_usd":1000,"price_bdt":120000,"price_cycle":"/ workshop","delivery_time":"1-Day Workshop","proof_pack":{"case_study_title":"*\"How a 20-Person Marketing Department Tripled Content Production Speed After a 4-Hour Hands-On Interactive Prompt Engineering Workshop.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-lessons-team-workshops.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-lessons-team-workshops-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Custom Company Prompt Kits","Claude 3.5 Sonnet Workspaces","Midjourney Masterclasses","Live Screen-Share Drills."],"core_deliverables":["Live Interactive Screen-Share Demos","Company-Specific Custom Prompt Kits","Interactive Q&A & Hands-On Exercises","Certified Course Completion Badges"],"included_features":["4-Hour Intensive Live Training","Permanent Access to Workshop Recordings","Reusable Prompt Library Handbook","Pre & Post-Training Capability Assessment"],"turnaround_days":7,"warranty_days":30},"faq":[{"q":"Can the workshop be conducted remotely?","a":"Yes, workshops are hosted via Zoom/Google Meet with live exercises, or on-site in Dhaka upon request."}]}'::jsonb,
      14
    ),
(
      'prod-svc-015',
      'b-gro10x-growth',
      'cat-e2-agents',
      'SVC-015',
      'Data Science & ML',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"data-science-machine-learning","icon":"🔬","badge":"PRO","description":"Turn your historical customer data into predictive models that forecast sales, churn, and high-value customer cohorts.","details":"Stop guessing what your customers want. Use scientific predictive machine learning models to guide marketing budgets, pricing, and product decisions.","price_usd":2400,"price_bdt":280000,"price_cycle":"/ project","delivery_time":"2-3 Weeks","proof_pack":{"case_study_title":"*\"How an E-Commerce Platform Predicted Customer Churn 30 Days in Advance and Retained $48,000 in At-Risk ARR with Machine Learning.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/data-science-machine-learning.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/data-science-machine-learning-blueprint.pdf","deep_research_query":"Deep research predictive churn modeling and customer lifetime value (LTV) prediction pipelines using Python, XGBoost, and relational database data (PostgreSQL, MySQL, Stripe). Focus on feature engineering for customer behavior signals, model evaluation metrics (ROC-AUC, Precision-Recall), production REST API scoring deployment, and ROI case studies in subscription e-commerce.","transformation_metrics":["$48k retained ARR","89% churn prediction accuracy","Automated weekly scoring run."]},"engineering":{"tech_stack":["Python","Scikit-Learn","XGBoost","PostgreSQL","Automated SQL feature engineering pipelines","REST scoring endpoint."],"core_deliverables":["Predictive Cohort & Churn Modeling","Customer Lifetime Value (LTV) Projections","Custom Python & SQL Data Pipeline Build","Automated Scheduled Training Runs"],"included_features":["Exploratory Data Analysis (EDA) Report","Feature Engineering Documentation","Model Accuracy Evaluation Metrics","REST API Endpoint for Real-Time Scoring"],"turnaround_days":14,"warranty_days":30},"faq":[{"q":"What data format do we need?","a":"We can ingest data directly from PostgreSQL, MySQL, CSVs, Stripe, Google Analytics, or CRM exports."}]}'::jsonb,
      15
    ),
(
      'prod-svc-016',
      'b-gro10x-growth',
      'cat-e2-agents',
      'SVC-016',
      'Data Analytics & Dashboards',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"data-analytics-dashboards","icon":"📊","badge":"POPULAR","description":"Clean, real-time visual dashboards that give leadership an instant view of marketing ROI, leads, and financials.","details":"Unify data from Google Ads, Meta, Stripe, and your internal database into a single executive command center for instant visibility.","price_usd":1200,"price_bdt":140000,"price_cycle":"/ dashboard","delivery_time":"5-7 Days","proof_pack":{"case_study_title":"*\"How a Multi-Brand Agency Consolidated Google Ads, Meta Ads, and Stripe into a Single Real-Time Executive Command Center.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/data-analytics-dashboards.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/data-analytics-dashboards-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Next.js","Chart.js","Vercel Edge","Automated Daily Sync Connectors","Telegram Digest Bots."],"core_deliverables":["Real-Time Data Connectors & Live Sync","Custom KPI Metric Cards & Gauges","Mobile-Friendly Responsive Interface","Automated Weekly Email & Telegram Reports"],"included_features":["Multi-Source Data Consolidation (Meta, Google, Stripe)","Role-Based Access Permissions","Export to PDF & CSV Functionality","Dashboard Customization Handover Call"],"turnaround_days":35,"warranty_days":30},"faq":[{"q":"Can we embed the dashboard in our portal?","a":"Yes, we build standalone web dashboards or embed them directly into your existing admin panels."}]}'::jsonb,
      16
    ),
(
      'prod-svc-017',
      'b-gro10x-growth',
      'cat-e2-agents',
      'SVC-017',
      'Data Visualization & Diagnostics',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"data-visualization-diagnostics","icon":"📈","badge":"PRO","description":"Diagnostic user-pathway funnels that pinpoint exactly where prospective customers drop off in your sales pipeline.","details":"Fix hidden leaks in your acquisition funnels to dramatically increase conversion rates and customer revenue from your existing traffic.","price_usd":900,"price_bdt":105000,"price_cycle":"/ audit","delivery_time":"3-5 Days","proof_pack":{"case_study_title":"Data Visualization & Diagnostics Transformation Case Study","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/data-visualization-diagnostics.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/data-visualization-diagnostics-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Node.js","Express","Supabase","Gemini AI"],"core_deliverables":["Funnel Drop-Off Heatmaps & Analytics","Conversion Rate Optimization (CRO) Insights","Cohort Retention & Engagement Graphs","Prioritized Actionable Fix Checklist"],"included_features":["Interactive Funnel Diagram","10-Point Conversion Leak Report","Recommended A/B Test Variations","30-Minute Diagnostic Review Call"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"How quickly do we see results?","a":"Clients usually identify 2-3 quick conversion wins within 48 hours of implementing our funnel diagnostic checklist."}]}'::jsonb,
      17
    ),
(
      'prod-svc-018',
      'b-gro10x-growth',
      'cat-e2-agents',
      'SVC-018',
      'AI Music Videos',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-music-videos","icon":"🎵","badge":"PRO","description":"Visually stunning AI-generated music videos, dynamic visualizers, and artistic teaser clips.","details":"Create mind-bending video visuals that capture viral attention across TikTok, YouTube, and Spotify Canvas without multi-thousand dollar camera crews.","price_usd":1200,"price_bdt":140000,"price_cycle":"/ video","delivery_time":"7-10 Days","proof_pack":{"case_study_title":"*\"How an Independent Music Producer Generated a Viral 4K Cinematic Music Video with 250,000 Views at 10% of Studio Film Budgets.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-music-videos.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-music-videos-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Deforum ComfyUI","Stable Video Diffusion","Beat-Synced Keyframing","4K Topa"],"core_deliverables":["Beat-Synced Visual Transitions & Effects","Cinematic Dynamic Camera Motions","Custom Visual Aesthetic & Mood Direction","4K Ultra-HD Master Render Output"],"included_features":["Full Length Music Video (up to 4 mins)","3 Vertical Teaser Cuts for TikTok / Shorts","Thumbnail Art Package","Full Commercial Distribution Rights"],"turnaround_days":49,"warranty_days":30},"faq":[{"q":"Can we specify the art style?","a":"Yes, from hyper-realistic anime to 3D cyberpunk, cinematic noir, or retro-futurism, we tailor visuals to your song."}]}'::jsonb,
      18
    ),
(
      'prod-svc-019',
      'b-gro10x-growth',
      'cat-e2-data-vision',
      'SVC-019',
      'AI Video Avatars',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-video-avatars","icon":"🗣️","badge":"POPULAR","description":"Photorealistic talking avatar videos for tutorials, product explainers, and localized multilingual ads.","details":"Produce endless video presentations, tutorials, and localized multilingual ads without needing a camera, studio, or recording equipment.","price_usd":800,"price_bdt":95000,"price_cycle":"/ 5 videos","delivery_time":"3-5 Days","proof_pack":{"case_study_title":"*\"How a Global SaaS Platform Produced Onboarding Videos in 8 Languages in 48 Hours Without Recording Studio Sessions.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-video-avatars.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-video-avatars-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Photorealistic Talking Avatars","20+ Language Lip-Sync Engines","Screen-Capture Inserts","Automated Captions."],"core_deliverables":["Realistic Lip-Sync & Natural Gestures","20+ Languages & Native Accents","Dynamic Backgrounds & Screen Capture Inserts","Fast 24-48 Hour Delivery Turnaround"],"included_features":["5 Custom Explainer / Ad Videos (60s each)","Dynamic Captions & Sound Effects","Script Polish & Translation","Horizontal & Vertical Deliverables"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"Can we use our founder''s likeness?","a":"Yes, with proper consent we can clone your likeness and voice into a permanent reusable video avatar."}]}'::jsonb,
      19
    ),
(
      'prod-svc-020',
      'b-gro10x-growth',
      'cat-e2-data-vision',
      'SVC-020',
      'AI UGC Social Ads',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-ugc-social-ads","icon":"📱","badge":"PRO","description":"Engaging, user-generated style vertical video ads optimized for TikTok, Instagram Reels, and YouTube Shorts.","details":"Test dozens of viral ad angles quickly and cost-effectively to find your top-converting winners and lower your Customer Acquisition Cost (CAC).","price_usd":650,"price_bdt":75000,"price_cycle":"/ 5 reels","delivery_time":"3-4 Days","proof_pack":{"case_study_title":"*\"How an E-Commerce Brand Tested 15 UGC Video Hook Variations to Drop Customer Acquisition Cost (CAC) by 41% on TikTok.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-ugc-social-ads.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-ugc-social-ads-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Dynamic 9:16 Vertical Video Pacing","A/B Hook Variations","Fast-Cut CapCut Pro Templates","High-Retention Subtitles."],"core_deliverables":["High-Retention Visual Hooks & Pacing","Dynamic On-Screen Captions & Sound FX","A/B Hook Variations for Paid Testing","Proven E-Commerce & SaaS Ad Formats"],"included_features":["5 High-Converting Short-Form Videos","3 Hook Variations per Video (15 total cuts)","High-Res MP4 Delivery Ready to Run","Full Ad Spend Commercial License"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"What formats do you deliver?","a":"Standard 9:16 vertical videos formatted specifically for TikTok, Meta Reels, and YouTube Shorts."}]}'::jsonb,
      20
    ),
(
      'prod-svc-021',
      'b-gro10x-growth',
      'cat-e2-data-vision',
      'SVC-021',
      'Voice Synthesis & AI Voice Clones',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"voice-synthesis-ai-voice-clones","icon":"🎙️","badge":"PRO","description":"Clone your own voice or create realistic synthetic brand voices for podcasts, ads, and interactive assistants.","details":"Maintain audio brand consistency across hundreds of videos, podcasts, and automated customer phone calls with ultra-realistic voice models.","price_usd":500,"price_bdt":60000,"price_cycle":"/ voice model","delivery_time":"2-3 Days","proof_pack":{"case_study_title":"*\"How a Course Creator Cloned Their Voice to Narrate 50 Hours of Content in a Weekend Without Vocal Strain or Studio Retakes.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/voice-synthesis-ai-voice-clones.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/voice-synthesis-ai-voice-clones-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["ElevenLabs Professional Voice Cloning","SSML Tone & Emotion Modulation","Lossless Audio Mastering."],"core_deliverables":["Studio Quality Voice Matching & Clarity","Natural Tone, Emotion & Pacing Control","Multi-Language Speaking Capability","Commercial API Integration Ready"],"included_features":["Custom Voice Model Training","10 Recorded Audio Sample Outputs","API Integration Documentation","Full Commercial Rights"],"turnaround_days":14,"warranty_days":30},"faq":[{"q":"What audio samples are needed?","a":"We require 5-10 minutes of clean, high-quality audio recording with minimal background noise."}]}'::jsonb,
      21
    ),
(
      'prod-svc-022',
      'b-gro10x-growth',
      'cat-e2-data-vision',
      'SVC-022',
      'Text to Speech Engines',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"text-to-speech-engines","icon":"🔊","badge":"PRO","description":"High-speed automated narration pipelines to turn blog posts, articles, and training docs into studio audio.","details":"Turn written content, articles, and documentation into engaging audiobooks and podcasts with zero manual recording time.","price_usd":400,"price_bdt":48000,"price_cycle":"/ setup","delivery_time":"3-5 Days","proof_pack":{"case_study_title":"*\"How a Media Publication Turned 100 Blog Posts into a Syndicated Audio Podcast Feed on Autopilot.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/text-to-speech-engines.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/text-to-speech-engines-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Cloudflare R2 / AWS S3 Storage","Automated Webhook Triggers","ElevenLabs / OpenAI Audio API","Custom Pronunciation Dictionaries."],"core_deliverables":["Automated High-Speed Audio File Export","Natural Pacing, Pauses & Pronunciation","Podcast RSS Feed Automation","Sub-Second Latency Cloud API Setup"],"included_features":["Webhook Triggered Audio Generation","Cloudflare R2 / AWS S3 Storage Setup","Custom SSML Pronunciation Dictionary","14 Days Technical Setup Warranty"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"Which TTS engines do you use?","a":"We implement ElevenLabs, OpenAI Audio, Cartesia, and open-source models depending on your budget and latency needs."}]}'::jsonb,
      22
    ),
(
      'prod-svc-023',
      'b-gro10x-growth',
      'cat-e2-advisory',
      'SVC-023',
      'AI Content Editing',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"ai-content-editing","icon":"📝","badge":"PRO","description":"Human-in-the-loop polishing and optimization of AI-generated articles, blogs, and sales landing pages.","details":"Get the speed of AI writing with the credibility, tone, and depth of veteran human editors. Perfect for content scaling without sacrificing brand reputation.","price_usd":450,"price_bdt":52000,"price_cycle":"/ 10 articles","delivery_time":"3-5 Days","proof_pack":{"case_study_title":"*\"How a Tech Consultancy Scaled to 40 Monthly SEO Thought Leadership Articles While Maintaining 100% Human Credibility and","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/ai-content-editing.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/ai-content-editing-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Node.js","Express","Supabase","Gemini AI"],"core_deliverables":["Fact-Checking & Source Verification","SEO Keyword Optimization & Headings","Readability, Nuance & Tone Refinement","Plagiarism & AI Detection Scanner Check"],"included_features":["10 Polished Articles (up to 1,500 words each)","Meta Titles & Descriptions Included","Internal & External Linking Structure","CMS Direct Publishing Support"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"Will this pass AI detection tools?","a":"Our human editors restructure sentences, infuse real-world nuance, and verify facts to ensure authentic, human-level readability."}]}'::jsonb,
      23
    ),
(
      'prod-svc-024',
      'b-gro10x-growth',
      'cat-e2-advisory',
      'SVC-024',
      'Custom Writing Prompts',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"custom-writing-prompts","icon":"✨","badge":"NEW","description":"Tailored prompt engineering libraries designed for your marketing team to produce on-brand copy in seconds.","details":"Equip your writers and marketers with bulletproof prompts that generate consistent, high-converting copy in your exact brand tone every time.","price_usd":600,"price_bdt":70000,"price_cycle":"/ library","delivery_time":"3-5 Days","proof_pack":{"case_study_title":"*\"How a 12-Person Remote Marketing Team Standardi","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/custom-writing-prompts.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/custom-writing-prompts-blueprint.pdf","deep_research_query":"","transformation_metrics":[]},"engineering":{"tech_stack":["Node.js","Express","Supabase","Gemini AI"],"core_deliverables":["Brand Voice Guidelines Matrix","Tested System Prompts (Claude & GPT-4o)","Email, Ad, Blog & Social Copy Templates","Team Onboarding Video & Notion Handbook"],"included_features":["25+ Custom-Engineered Prompts","Few-Shot Output Examples Library","Prompt Optimization Cheat-Sheet","30-Minute Team Training Call"],"turnaround_days":21,"warranty_days":30},"faq":[{"q":"Do these prompts work on ChatGPT Plus?","a":"Yes, prompts are optimized for ChatGPT, Claude 3.5 Sonnet, and team AI workspaces."}]}'::jsonb,
      24
    ),
(
      'prod-svc-025',
      'b-gro10x-growth',
      'cat-e2-mobile-web',
      'SVC-025',
      'Progressive Web Apps (PWA) & Fast MVPs',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"progressive-web-apps","icon":"⚡","badge":"POPULAR","description":"Lightning-fast, offline-capable Progressive Web Apps and rapid MVPs engineered with modern Node.js and Supabase.","details":"Launch your product concept in record time. PWAs provide native app feel with zero app store delays, perfect for rapid MVPs and business tools.","price_usd":2000,"price_bdt":235000,"price_cycle":"/ MVP","delivery_time":"48 Hours - 5 Days","proof_pack":{"case_study_title":"*\"How an On-Demand Service Bypassed 30% App Store Fees and Shipped an Offline-Ready PWA to 1,000 Users in 4 Days.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/progressive-web-apps.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/progressive-web-apps-blueprint.pdf","deep_research_query":"Deep research modern Progressive Web Apps (PWAs) built with service workers, offline-first caching strategies, web push notifications, and home screen installation on iOS and Android. Compare PWA conversion funnels vs native app store friction, development turnaround speed, Supabase backend integration, and case studies of rapid 48-hour MVP launches.","transformation_metrics":["0% app store commission","4-day launch from scratch","Full offline functionality."]},"engineering":{"tech_stack":["PWA Service Workers","Supabase Real-Time","Node.js","Web Push API","Vercel Edge."],"core_deliverables":["Offline-First Service Worker Architecture","Installable on iOS & Android without App Store friction","Real-Time Database & Auth with Supabase","Deployable Vercel Edge Hosting Setup"],"included_features":["Responsive Glassmorphic UI Design","Push Notification Integration","1-Click Installation Prompt","14 Days Post-Launch Warranty"],"turnaround_days":336,"warranty_days":30},"faq":[{"q":"Can users install the app on their phone?","a":"Yes, PWAs install directly from the browser with an app icon on the home screen and full offline functionality."}]}'::jsonb,
      25
    ),
(
      'prod-svc-026',
      'b-gro10x-growth',
      'cat-e2-advisory',
      'SVC-026',
      'Custom ERP & Business Operating Systems',
      'SERVICE',
      'ONE_TIME',
      '{"slug":"custom-erp-business-os","icon":"🏢","badge":"FLAGSHIP","description":"Tailored business operating systems to replace messy pen-and-paper or spreadsheet workflows with automated dashboards, CRM, and team tracking.","details":"Transform traditional pen-and-paper operations into a modern, cloud-connected agency operating system designed specifically around your business rules.","price_usd":3000,"price_bdt":350000,"price_cycle":"/ system","delivery_time":"1-2 Weeks","proof_pack":{"case_study_title":"*\"How a Freight Brokerage Replaced 12 Messy Spreadsheets and 4 Disconnected SaaS Apps with a Unified Supabase & Telegram ERP in 10 Days.\"*","video_url":"https://youtu.be/RvNFX5nYDlM","video_poster":"/images/video-poster.webp","slides_pdf_url":"/assets/case-studies/custom-erp-business-os.pdf","audio_overview_url":"https://open.spotify.com/show/gro10x-ai-case-studies","blueprint_url":"/assets/blueprints/custom-erp-business-os-blueprint.pdf","deep_research_query":"Deep research custom lightweight ERP and Business Operating Systems (BOS) built on Supabase, Node.js, and instant messaging interfaces (Telegram bots, WhatsApp webhooks). Compare total cost of ownership (TCO) and agility of custom micro-ERPs vs bloated legacy platforms (NetSuite, SAP), covering role-based security, automated invoicing, task pipelines, and 10-day deployment strategies.","transformation_metrics":["$1,800/month saved in SaaS subscription bloat","10-day deployment","Instant Telegram team notifications."]},"engineering":{"tech_stack":["Supabase PostgreSQL","Node.js API","Telegram Bot Real-Time Alerts","Role-Based Access Control","Custom KPI Dashboards."],"core_deliverables":["Role-Based Access Control (Admins, Managers, Staff, Clients)","Automated Financial Ledgers & Invoice Generation","Kanban Task & Project Management Pipeline","Telegram Bot & Real-Time Event Alerts"],"included_features":["Tailored Database Schema on Supabase","Custom Executive KPI Command Center","Team Onboarding & Video Walkthrough Guide","30 Days Post-Deployment Technical Support"],"turnaround_days":7,"warranty_days":30},"faq":[{"q":"Is the system customized to our workflow?","a":"Yes, every module, stage pipeline, role, and notification rule is configured specifically to match your operational model."}]}'::jsonb,
      26
    );

-- 4. Canonical SKUs across Upwork, Fiverr, and Direct Wire
INSERT INTO public.catalog_skus (id, product_id, sku_code, name, channel, price_usd, price_bdt, billing_interval, channel_payload)
VALUES
(
    'sku-sprint01-upw',
    'prod-sprint-01',
    'GRO-E2-SME-GWT-SPRINT01-UPW',
    'Sprint 01 Idea-to-Reality on Upwork',
    'UPWORK',
    3500.00,
    410000,
    'one-time',
    '{"outcome_title":"You will get a production-ready software MVP launched in 14 days","project_steps":[{"step":1,"name":"Architecture Blueprint & Figma Prototype","days":3},{"step":2,"name":"Full-Stack Core Development & Database RLS","days":7},{"step":3,"name":"Cloud Deployment, Testing & Handover","days":4}]}'::jsonb
  ),
(
    'sku-sprint01-fiv',
    'prod-sprint-01',
    'GRO-E2-SME-GWT-SPRINT01-FIV',
    'Sprint 01 Idea-to-Reality on Fiverr Pro',
    'FIVERR',
    3000.00,
    350000,
    'one-time',
    '{"gig_title":"I will build your custom software MVP or PWA in 14 days","tags":["mvp development","software build","fast web app","startup mvp","supabase"],"tiers":{"basic":{"name":"MVP Prototype","price":1500,"deliveryDays":5,"revisions":2},"standard":{"name":"Production MVP","price":3000,"deliveryDays":14,"revisions":4},"premium":{"name":"Full Launch Suite","price":4500,"deliveryDays":21,"revisions":"Unlimited"}},"buyer_requirements":["Do you have a product requirements document or reference sketch?","What are your primary business goals for this MVP?","Do you have your cloud hosting or API accounts ready?"]}'::jsonb
  ),
(
    'sku-sprint01-dir',
    'prod-sprint-01',
    'GRO-E2-SME-GWT-SPRINT01-DIR',
    'Sprint 01 Idea-to-Reality Direct Wire',
    'DIRECT_WIRE',
    3000.00,
    350000,
    'one-time',
    '{"sow_type":"FIXED_SPRINT","milestones":[{"name":"Kickoff & Architecture Approval","percent":50},{"name":"Staging Delivery & Source Code Handover","percent":50}],"warranty_days":30}'::jsonb
  ),
(
      'sku-svc-001-upw',
      'prod-svc-001',
      'GRO-E2-SME-GWT-SVC001-UPW',
      'AI Mobile Apps on Upwork Project Catalog',
      'UPWORK',
      3500,
      410000,
      'one-time',
      '{"outcome_title":"You will get ai mobile apps engineered with AI and cloud architecture","delivery_time":"3-4 Weeks","key_deliverables":["Native React Native / Flutter Stack","On-Device & Cloud AI Model Integration","Real-Time Sync & Offline Mode Support","App Store & Play Store Deployment Setup"]}'::jsonb
    ),
(
      'sku-svc-001-fiv',
      'prod-svc-001',
      'GRO-E2-SME-GWT-SVC001-FIV',
      'AI Mobile Apps on Fiverr Pro',
      'FIVERR',
      3500,
      410000,
      'one-time',
      '{"gig_title":"I will build your ai mobile apps","tags":["mobile-web","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":1750,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":3500,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":5600,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-001-dir',
      'prod-svc-001',
      'GRO-E2-SME-GWT-SVC001-DIR',
      'AI Mobile Apps Direct Proposal',
      'DIRECT_WIRE',
      3500,
      410000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-002-upw',
      'prod-svc-002',
      'GRO-E2-SME-GWT-SVC002-UPW',
      'AI Websites & Software on Upwork Project Catalog',
      'UPWORK',
      2500,
      295000,
      'one-time',
      '{"outcome_title":"You will get ai websites & software engineered with AI and cloud architecture","delivery_time":"2-3 Weeks","key_deliverables":["Next.js & Node.js Scalable Architecture","AI Lead Generation & Dynamic Forms","SEO & Core Web Vitals 95+ Optimized","Custom Database & User Authentication"]}'::jsonb
    ),
(
      'sku-svc-002-fiv',
      'prod-svc-002',
      'GRO-E2-SME-GWT-SVC002-FIV',
      'AI Websites & Software on Fiverr Pro',
      'FIVERR',
      2500,
      295000,
      'one-time',
      '{"gig_title":"I will build your ai websites & software","tags":["mobile-web","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":1250,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":2500,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":4000,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-002-dir',
      'prod-svc-002',
      'GRO-E2-SME-GWT-SVC002-DIR',
      'AI Websites & Software Direct Proposal',
      'DIRECT_WIRE',
      2500,
      295000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-003-upw',
      'prod-svc-003',
      'GRO-E2-SME-GWT-SVC003-UPW',
      'AI Chatbots & Intelligent Agents on Upwork Project Catalog',
      'UPWORK',
      1500,
      175000,
      'one-time',
      '{"outcome_title":"You will get ai chatbots & intelligent agents engineered with AI and cloud architecture","delivery_time":"7-10 Days","key_deliverables":["Context-Aware RAG Knowledge Base","WhatsApp, Telegram & Web Widget Sync","Human Handoff & CRM Auto-Recording","Multi-Language Automatic Translation"]}'::jsonb
    ),
(
      'sku-svc-003-fiv',
      'prod-svc-003',
      'GRO-E2-SME-GWT-SVC003-FIV',
      'AI Chatbots & Intelligent Agents on Fiverr Pro',
      'FIVERR',
      1500,
      175000,
      'one-time',
      '{"gig_title":"I will build your ai chatbots & intelligent agents","tags":["mobile-web","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":750,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":1500,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":2400,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-003-dir',
      'prod-svc-003',
      'GRO-E2-SME-GWT-SVC003-DIR',
      'AI Chatbots & Intelligent Agents Direct Proposal',
      'DIRECT_WIRE',
      1500,
      175000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-004-upw',
      'prod-svc-004',
      'GRO-E2-SME-GWT-SVC004-UPW',
      'AI Integrations & APIs on Upwork Project Catalog',
      'UPWORK',
      1200,
      140000,
      'one-time',
      '{"outcome_title":"You will get ai integrations & apis engineered with AI and cloud architecture","delivery_time":"5-7 Days","key_deliverables":["Custom Webhooks & REST API Middleware","Google Workspace & Apps Script AI Bridges","Automated Multi-Channel Sync Pipelines","Zero Downtime Architecture"]}'::jsonb
    ),
(
      'sku-svc-004-fiv',
      'prod-svc-004',
      'GRO-E2-SME-GWT-SVC004-FIV',
      'AI Integrations & APIs on Fiverr Pro',
      'FIVERR',
      1200,
      140000,
      'one-time',
      '{"gig_title":"I will build your ai integrations & apis","tags":["mobile-web","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":600,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":1200,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":1920,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-004-dir',
      'prod-svc-004',
      'GRO-E2-SME-GWT-SVC004-DIR',
      'AI Integrations & APIs Direct Proposal',
      'DIRECT_WIRE',
      1200,
      140000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-005-upw',
      'prod-svc-005',
      'GRO-E2-SME-GWT-SVC005-UPW',
      'AI Fine-Tuning & Custom Models on Upwork Project Catalog',
      'UPWORK',
      2800,
      330000,
      'one-time',
      '{"outcome_title":"You will get ai fine-tuning & custom models engineered with AI and cloud architecture","delivery_time":"2-3 Weeks","key_deliverables":["Dataset Cleaning, Formatting & Synthetic Data","LoRA & Full Fine-Tuning Pipelines","Automated Benchmark & Evals Testing","Private Secure Cloud Hosting"]}'::jsonb
    ),
(
      'sku-svc-005-fiv',
      'prod-svc-005',
      'GRO-E2-SME-GWT-SVC005-FIV',
      'AI Fine-Tuning & Custom Models on Fiverr Pro',
      'FIVERR',
      2800,
      330000,
      'one-time',
      '{"gig_title":"I will build your ai fine-tuning & custom models","tags":["mobile-web","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":1400,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":2800,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":4480,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-005-dir',
      'prod-svc-005',
      'GRO-E2-SME-GWT-SVC005-DIR',
      'AI Fine-Tuning & Custom Models Direct Proposal',
      'DIRECT_WIRE',
      2800,
      330000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-006-upw',
      'prod-svc-006',
      'GRO-E2-SME-GWT-SVC006-UPW',
      'AI Technology Consulting on Upwork Project Catalog',
      'UPWORK',
      800,
      95000,
      'one-time',
      '{"outcome_title":"You will get ai technology consulting engineered with AI and cloud architecture","delivery_time":"3-5 Days","key_deliverables":["Complete Tech Stack Architecture Audit","Cost vs. ROI Evaluation Matrix","Technical Architecture Diagram & Blueprints","Vendor & Foundation Model Selection"]}'::jsonb
    ),
(
      'sku-svc-006-fiv',
      'prod-svc-006',
      'GRO-E2-SME-GWT-SVC006-FIV',
      'AI Technology Consulting on Fiverr Pro',
      'FIVERR',
      800,
      95000,
      'one-time',
      '{"gig_title":"I will build your ai technology consulting","tags":["mobile-web","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":400,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":800,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":1280,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-006-dir',
      'prod-svc-006',
      'GRO-E2-SME-GWT-SVC006-DIR',
      'AI Technology Consulting Direct Proposal',
      'DIRECT_WIRE',
      800,
      95000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-007-upw',
      'prod-svc-007',
      'GRO-E2-SME-GWT-SVC007-UPW',
      'Let Us Manage Your Project on Upwork Project Catalog',
      'UPWORK',
      2500,
      295000,
      'one-time',
      '{"outcome_title":"You will get let us manage your project engineered with AI and cloud architecture","delivery_time":"Custom SLA","key_deliverables":["Dedicated Technical Project Lead","Agile Weekly Sprints & Daily Standups","Transparent Real-Time Kanban Tracking","100% On-Time Delivery Guarantee"]}'::jsonb
    ),
(
      'sku-svc-007-fiv',
      'prod-svc-007',
      'GRO-E2-SME-GWT-SVC007-FIV',
      'Let Us Manage Your Project on Fiverr Pro',
      'FIVERR',
      2500,
      295000,
      'one-time',
      '{"gig_title":"I will build your let us manage your project","tags":["mobile-web","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":1250,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":2500,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":4000,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-007-dir',
      'prod-svc-007',
      'GRO-E2-SME-GWT-SVC007-DIR',
      'Let Us Manage Your Project Direct Proposal',
      'DIRECT_WIRE',
      2500,
      295000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-008-upw',
      'prod-svc-008',
      'GRO-E2-SME-GWT-SVC008-UPW',
      'AI Avatar Design on Upwork Project Catalog',
      'UPWORK',
      600,
      70000,
      'one-time',
      '{"outcome_title":"You will get ai avatar design engineered with AI and cloud architecture","delivery_time":"3-5 Days","key_deliverables":["Multiple Character Poses & Facial Expressions","4K Ultra-HD Commercial License Export","Voice-Sync Ready Lip Rigging Assets","Complete Brand Asset Kit Included"]}'::jsonb
    ),
(
      'sku-svc-008-fiv',
      'prod-svc-008',
      'GRO-E2-SME-GWT-SVC008-FIV',
      'AI Avatar Design on Fiverr Pro',
      'FIVERR',
      600,
      70000,
      'one-time',
      '{"gig_title":"I will build your ai avatar design","tags":["ai-artists","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":300,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":600,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":960,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-008-dir',
      'prod-svc-008',
      'GRO-E2-SME-GWT-SVC008-DIR',
      'AI Avatar Design Direct Proposal',
      'DIRECT_WIRE',
      600,
      70000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-009-upw',
      'prod-svc-009',
      'GRO-E2-SME-GWT-SVC009-UPW',
      'AI Visuals & Product Imagery on Upwork Project Catalog',
      'UPWORK',
      800,
      95000,
      'one-time',
      '{"outcome_title":"You will get ai visuals & product imagery engineered with AI and cloud architecture","delivery_time":"3-5 Days","key_deliverables":["Ultra-HD 4K Commercial Product Shots","Brand Consistency & Style Preservation","Multiple Aspect Ratios (1:1, 9:16, 16:9)","High-Resolution Upscaling & Touch-up"]}'::jsonb
    ),
(
      'sku-svc-009-fiv',
      'prod-svc-009',
      'GRO-E2-SME-GWT-SVC009-FIV',
      'AI Visuals & Product Imagery on Fiverr Pro',
      'FIVERR',
      800,
      95000,
      'one-time',
      '{"gig_title":"I will build your ai visuals & product imagery","tags":["ai-artists","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":400,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":800,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":1280,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-009-dir',
      'prod-svc-009',
      'GRO-E2-SME-GWT-SVC009-DIR',
      'AI Visuals & Product Imagery Direct Proposal',
      'DIRECT_WIRE',
      800,
      95000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-010-upw',
      'prod-svc-010',
      'GRO-E2-SME-GWT-SVC010-UPW',
      'AI Video Creatives & Avatar Spokespersons on Upwork Project Catalog',
      'UPWORK',
      600,
      70000,
      'one-time',
      '{"outcome_title":"You will get ai video creatives & avatar spokespersons engineered with AI and cloud architecture","delivery_time":"3-4 Days","key_deliverables":["Photorealistic Multi-Language Talking Avatars","Dynamic Captions & Motion Graphics","High-Retention Vertical Video Pacing","4K Ultra-HD Master Video Renders"]}'::jsonb
    ),
(
      'sku-svc-010-fiv',
      'prod-svc-010',
      'GRO-E2-SME-GWT-SVC010-FIV',
      'AI Video Creatives & Avatar Spokespersons on Fiverr Pro',
      'FIVERR',
      600,
      70000,
      'one-time',
      '{"gig_title":"I will build your ai video creatives & avatar spokespersons","tags":["ai-artists","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":300,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":600,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":960,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-010-dir',
      'prod-svc-010',
      'GRO-E2-SME-GWT-SVC010-DIR',
      'AI Video Creatives & Avatar Spokespersons Direct Proposal',
      'DIRECT_WIRE',
      600,
      70000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-011-upw',
      'prod-svc-011',
      'GRO-E2-SME-GWT-SVC011-UPW',
      'All AI Art Services on Upwork Project Catalog',
      'UPWORK',
      500,
      60000,
      'one-time',
      '{"outcome_title":"You will get all ai art services engineered with AI and cloud architecture","delivery_time":"Ongoing Retainer","key_deliverables":["Weekly Creative Design Batches","Fast 48-Hour Turnaround SLA","Unlimited Revision Cycles on Active Requests","Social-Ready Formats (1:1, 9:16, 16:9)"]}'::jsonb
    ),
(
      'sku-svc-011-fiv',
      'prod-svc-011',
      'GRO-E2-SME-GWT-SVC011-FIV',
      'All AI Art Services on Fiverr Pro',
      'FIVERR',
      500,
      60000,
      'one-time',
      '{"gig_title":"I will build your all ai art services","tags":["ai-artists","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":250,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":500,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":800,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-011-dir',
      'prod-svc-011',
      'GRO-E2-SME-GWT-SVC011-DIR',
      'All AI Art Services Direct Proposal',
      'DIRECT_WIRE',
      500,
      60000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-012-upw',
      'prod-svc-012',
      'GRO-E2-SME-GWT-SVC012-UPW',
      'AI Business Consulting on Upwork Project Catalog',
      'UPWORK',
      750,
      90000,
      'one-time',
      '{"outcome_title":"You will get ai business consulting engineered with AI and cloud architecture","delivery_time":"2 Days","key_deliverables":["Workflow Bottleneck Deep-Dive Analysis","Curated AI Tool Stack Recommendations","Step-by-Step Implementation Blueprint","Recorded Session & Executive Action Plan"]}'::jsonb
    ),
(
      'sku-svc-012-fiv',
      'prod-svc-012',
      'GRO-E2-SME-GWT-SVC012-FIV',
      'AI Business Consulting on Fiverr Pro',
      'FIVERR',
      750,
      90000,
      'one-time',
      '{"gig_title":"I will build your ai business consulting","tags":["business-ai","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":375,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":750,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":1200,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-012-dir',
      'prod-svc-012',
      'GRO-E2-SME-GWT-SVC012-DIR',
      'AI Business Consulting Direct Proposal',
      'DIRECT_WIRE',
      750,
      90000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-013-upw',
      'prod-svc-013',
      'GRO-E2-SME-GWT-SVC013-UPW',
      'AI Strategy & Growth Roadmap on Upwork Project Catalog',
      'UPWORK',
      1800,
      210000,
      'one-time',
      '{"outcome_title":"You will get ai strategy & growth roadmap engineered with AI and cloud architecture","delivery_time":"10-14 Days","key_deliverables":["Multi-Department Operational AI Mapping","Financial KPI & Margin Growth Projections","Staff Upskilling & Tool Rollout Plan","Risk, Security & Privacy Policy Guidelines"]}'::jsonb
    ),
(
      'sku-svc-013-fiv',
      'prod-svc-013',
      'GRO-E2-SME-GWT-SVC013-FIV',
      'AI Strategy & Growth Roadmap on Fiverr Pro',
      'FIVERR',
      1800,
      210000,
      'one-time',
      '{"gig_title":"I will build your ai strategy & growth roadmap","tags":["business-ai","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":900,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":1800,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":2880,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-013-dir',
      'prod-svc-013',
      'GRO-E2-SME-GWT-SVC013-DIR',
      'AI Strategy & Growth Roadmap Direct Proposal',
      'DIRECT_WIRE',
      1800,
      210000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-014-upw',
      'prod-svc-014',
      'GRO-E2-SME-GWT-SVC014-UPW',
      'AI Lessons & Team Workshops on Upwork Project Catalog',
      'UPWORK',
      1000,
      120000,
      'one-time',
      '{"outcome_title":"You will get ai lessons & team workshops engineered with AI and cloud architecture","delivery_time":"1-Day Workshop","key_deliverables":["Live Interactive Screen-Share Demos","Company-Specific Custom Prompt Kits","Interactive Q&A & Hands-On Exercises","Certified Course Completion Badges"]}'::jsonb
    ),
(
      'sku-svc-014-fiv',
      'prod-svc-014',
      'GRO-E2-SME-GWT-SVC014-FIV',
      'AI Lessons & Team Workshops on Fiverr Pro',
      'FIVERR',
      1000,
      120000,
      'one-time',
      '{"gig_title":"I will build your ai lessons & team workshops","tags":["business-ai","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":500,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":1000,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":1600,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-014-dir',
      'prod-svc-014',
      'GRO-E2-SME-GWT-SVC014-DIR',
      'AI Lessons & Team Workshops Direct Proposal',
      'DIRECT_WIRE',
      1000,
      120000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-015-upw',
      'prod-svc-015',
      'GRO-E2-SME-GWT-SVC015-UPW',
      'Data Science & ML on Upwork Project Catalog',
      'UPWORK',
      2400,
      280000,
      'one-time',
      '{"outcome_title":"You will get data science & ml engineered with AI and cloud architecture","delivery_time":"2-3 Weeks","key_deliverables":["Predictive Cohort & Churn Modeling","Customer Lifetime Value (LTV) Projections","Custom Python & SQL Data Pipeline Build","Automated Scheduled Training Runs"]}'::jsonb
    ),
(
      'sku-svc-015-fiv',
      'prod-svc-015',
      'GRO-E2-SME-GWT-SVC015-FIV',
      'Data Science & ML on Fiverr Pro',
      'FIVERR',
      2400,
      280000,
      'one-time',
      '{"gig_title":"I will build your data science & ml","tags":["data","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":1200,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":2400,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":3840,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-015-dir',
      'prod-svc-015',
      'GRO-E2-SME-GWT-SVC015-DIR',
      'Data Science & ML Direct Proposal',
      'DIRECT_WIRE',
      2400,
      280000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-016-upw',
      'prod-svc-016',
      'GRO-E2-SME-GWT-SVC016-UPW',
      'Data Analytics & Dashboards on Upwork Project Catalog',
      'UPWORK',
      1200,
      140000,
      'one-time',
      '{"outcome_title":"You will get data analytics & dashboards engineered with AI and cloud architecture","delivery_time":"5-7 Days","key_deliverables":["Real-Time Data Connectors & Live Sync","Custom KPI Metric Cards & Gauges","Mobile-Friendly Responsive Interface","Automated Weekly Email & Telegram Reports"]}'::jsonb
    ),
(
      'sku-svc-016-fiv',
      'prod-svc-016',
      'GRO-E2-SME-GWT-SVC016-FIV',
      'Data Analytics & Dashboards on Fiverr Pro',
      'FIVERR',
      1200,
      140000,
      'one-time',
      '{"gig_title":"I will build your data analytics & dashboards","tags":["data","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":600,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":1200,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":1920,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-016-dir',
      'prod-svc-016',
      'GRO-E2-SME-GWT-SVC016-DIR',
      'Data Analytics & Dashboards Direct Proposal',
      'DIRECT_WIRE',
      1200,
      140000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-017-upw',
      'prod-svc-017',
      'GRO-E2-SME-GWT-SVC017-UPW',
      'Data Visualization & Diagnostics on Upwork Project Catalog',
      'UPWORK',
      900,
      105000,
      'one-time',
      '{"outcome_title":"You will get data visualization & diagnostics engineered with AI and cloud architecture","delivery_time":"3-5 Days","key_deliverables":["Funnel Drop-Off Heatmaps & Analytics","Conversion Rate Optimization (CRO) Insights","Cohort Retention & Engagement Graphs","Prioritized Actionable Fix Checklist"]}'::jsonb
    ),
(
      'sku-svc-017-fiv',
      'prod-svc-017',
      'GRO-E2-SME-GWT-SVC017-FIV',
      'Data Visualization & Diagnostics on Fiverr Pro',
      'FIVERR',
      900,
      105000,
      'one-time',
      '{"gig_title":"I will build your data visualization & diagnostics","tags":["data","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":450,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":900,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":1440,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-017-dir',
      'prod-svc-017',
      'GRO-E2-SME-GWT-SVC017-DIR',
      'Data Visualization & Diagnostics Direct Proposal',
      'DIRECT_WIRE',
      900,
      105000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-018-upw',
      'prod-svc-018',
      'GRO-E2-SME-GWT-SVC018-UPW',
      'AI Music Videos on Upwork Project Catalog',
      'UPWORK',
      1200,
      140000,
      'one-time',
      '{"outcome_title":"You will get ai music videos engineered with AI and cloud architecture","delivery_time":"7-10 Days","key_deliverables":["Beat-Synced Visual Transitions & Effects","Cinematic Dynamic Camera Motions","Custom Visual Aesthetic & Mood Direction","4K Ultra-HD Master Render Output"]}'::jsonb
    ),
(
      'sku-svc-018-fiv',
      'prod-svc-018',
      'GRO-E2-SME-GWT-SVC018-FIV',
      'AI Music Videos on Fiverr Pro',
      'FIVERR',
      1200,
      140000,
      'one-time',
      '{"gig_title":"I will build your ai music videos","tags":["video","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":600,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":1200,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":1920,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-018-dir',
      'prod-svc-018',
      'GRO-E2-SME-GWT-SVC018-DIR',
      'AI Music Videos Direct Proposal',
      'DIRECT_WIRE',
      1200,
      140000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-019-upw',
      'prod-svc-019',
      'GRO-E2-SME-GWT-SVC019-UPW',
      'AI Video Avatars on Upwork Project Catalog',
      'UPWORK',
      800,
      95000,
      'one-time',
      '{"outcome_title":"You will get ai video avatars engineered with AI and cloud architecture","delivery_time":"3-5 Days","key_deliverables":["Realistic Lip-Sync & Natural Gestures","20+ Languages & Native Accents","Dynamic Backgrounds & Screen Capture Inserts","Fast 24-48 Hour Delivery Turnaround"]}'::jsonb
    ),
(
      'sku-svc-019-fiv',
      'prod-svc-019',
      'GRO-E2-SME-GWT-SVC019-FIV',
      'AI Video Avatars on Fiverr Pro',
      'FIVERR',
      800,
      95000,
      'one-time',
      '{"gig_title":"I will build your ai video avatars","tags":["video","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":400,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":800,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":1280,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-019-dir',
      'prod-svc-019',
      'GRO-E2-SME-GWT-SVC019-DIR',
      'AI Video Avatars Direct Proposal',
      'DIRECT_WIRE',
      800,
      95000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-020-upw',
      'prod-svc-020',
      'GRO-E2-SME-GWT-SVC020-UPW',
      'AI UGC Social Ads on Upwork Project Catalog',
      'UPWORK',
      650,
      75000,
      'one-time',
      '{"outcome_title":"You will get ai ugc social ads engineered with AI and cloud architecture","delivery_time":"3-4 Days","key_deliverables":["High-Retention Visual Hooks & Pacing","Dynamic On-Screen Captions & Sound FX","A/B Hook Variations for Paid Testing","Proven E-Commerce & SaaS Ad Formats"]}'::jsonb
    ),
(
      'sku-svc-020-fiv',
      'prod-svc-020',
      'GRO-E2-SME-GWT-SVC020-FIV',
      'AI UGC Social Ads on Fiverr Pro',
      'FIVERR',
      650,
      75000,
      'one-time',
      '{"gig_title":"I will build your ai ugc social ads","tags":["video","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":325,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":650,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":1040,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-020-dir',
      'prod-svc-020',
      'GRO-E2-SME-GWT-SVC020-DIR',
      'AI UGC Social Ads Direct Proposal',
      'DIRECT_WIRE',
      650,
      75000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-021-upw',
      'prod-svc-021',
      'GRO-E2-SME-GWT-SVC021-UPW',
      'Voice Synthesis & AI Voice Clones on Upwork Project Catalog',
      'UPWORK',
      500,
      60000,
      'one-time',
      '{"outcome_title":"You will get voice synthesis & ai voice clones engineered with AI and cloud architecture","delivery_time":"2-3 Days","key_deliverables":["Studio Quality Voice Matching & Clarity","Natural Tone, Emotion & Pacing Control","Multi-Language Speaking Capability","Commercial API Integration Ready"]}'::jsonb
    ),
(
      'sku-svc-021-fiv',
      'prod-svc-021',
      'GRO-E2-SME-GWT-SVC021-FIV',
      'Voice Synthesis & AI Voice Clones on Fiverr Pro',
      'FIVERR',
      500,
      60000,
      'one-time',
      '{"gig_title":"I will build your voice synthesis & ai voice clones","tags":["audio","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":250,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":500,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":800,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-021-dir',
      'prod-svc-021',
      'GRO-E2-SME-GWT-SVC021-DIR',
      'Voice Synthesis & AI Voice Clones Direct Proposal',
      'DIRECT_WIRE',
      500,
      60000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-022-upw',
      'prod-svc-022',
      'GRO-E2-SME-GWT-SVC022-UPW',
      'Text to Speech Engines on Upwork Project Catalog',
      'UPWORK',
      400,
      48000,
      'one-time',
      '{"outcome_title":"You will get text to speech engines engineered with AI and cloud architecture","delivery_time":"3-5 Days","key_deliverables":["Automated High-Speed Audio File Export","Natural Pacing, Pauses & Pronunciation","Podcast RSS Feed Automation","Sub-Second Latency Cloud API Setup"]}'::jsonb
    ),
(
      'sku-svc-022-fiv',
      'prod-svc-022',
      'GRO-E2-SME-GWT-SVC022-FIV',
      'Text to Speech Engines on Fiverr Pro',
      'FIVERR',
      400,
      48000,
      'one-time',
      '{"gig_title":"I will build your text to speech engines","tags":["audio","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":200,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":400,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":640,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-022-dir',
      'prod-svc-022',
      'GRO-E2-SME-GWT-SVC022-DIR',
      'Text to Speech Engines Direct Proposal',
      'DIRECT_WIRE',
      400,
      48000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-023-upw',
      'prod-svc-023',
      'GRO-E2-SME-GWT-SVC023-UPW',
      'AI Content Editing on Upwork Project Catalog',
      'UPWORK',
      450,
      52000,
      'one-time',
      '{"outcome_title":"You will get ai content editing engineered with AI and cloud architecture","delivery_time":"3-5 Days","key_deliverables":["Fact-Checking & Source Verification","SEO Keyword Optimization & Headings","Readability, Nuance & Tone Refinement","Plagiarism & AI Detection Scanner Check"]}'::jsonb
    ),
(
      'sku-svc-023-fiv',
      'prod-svc-023',
      'GRO-E2-SME-GWT-SVC023-FIV',
      'AI Content Editing on Fiverr Pro',
      'FIVERR',
      450,
      52000,
      'one-time',
      '{"gig_title":"I will build your ai content editing","tags":["content","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":225,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":450,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":720,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-023-dir',
      'prod-svc-023',
      'GRO-E2-SME-GWT-SVC023-DIR',
      'AI Content Editing Direct Proposal',
      'DIRECT_WIRE',
      450,
      52000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-024-upw',
      'prod-svc-024',
      'GRO-E2-SME-GWT-SVC024-UPW',
      'Custom Writing Prompts on Upwork Project Catalog',
      'UPWORK',
      600,
      70000,
      'one-time',
      '{"outcome_title":"You will get custom writing prompts engineered with AI and cloud architecture","delivery_time":"3-5 Days","key_deliverables":["Brand Voice Guidelines Matrix","Tested System Prompts (Claude & GPT-4o)","Email, Ad, Blog & Social Copy Templates","Team Onboarding Video & Notion Handbook"]}'::jsonb
    ),
(
      'sku-svc-024-fiv',
      'prod-svc-024',
      'GRO-E2-SME-GWT-SVC024-FIV',
      'Custom Writing Prompts on Fiverr Pro',
      'FIVERR',
      600,
      70000,
      'one-time',
      '{"gig_title":"I will build your custom writing prompts","tags":["content","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":300,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":600,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":960,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-024-dir',
      'prod-svc-024',
      'GRO-E2-SME-GWT-SVC024-DIR',
      'Custom Writing Prompts Direct Proposal',
      'DIRECT_WIRE',
      600,
      70000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-025-upw',
      'prod-svc-025',
      'GRO-E2-SME-GWT-SVC025-UPW',
      'Progressive Web Apps (PWA) & Fast MVPs on Upwork Project Catalog',
      'UPWORK',
      2000,
      235000,
      'one-time',
      '{"outcome_title":"You will get progressive web apps (pwa) & fast mvps engineered with AI and cloud architecture","delivery_time":"48 Hours - 5 Days","key_deliverables":["Offline-First Service Worker Architecture","Installable on iOS & Android without App Store friction","Real-Time Database & Auth with Supabase","Deployable Vercel Edge Hosting Setup"]}'::jsonb
    ),
(
      'sku-svc-025-fiv',
      'prod-svc-025',
      'GRO-E2-SME-GWT-SVC025-FIV',
      'Progressive Web Apps (PWA) & Fast MVPs on Fiverr Pro',
      'FIVERR',
      2000,
      235000,
      'one-time',
      '{"gig_title":"I will build your progressive web apps (pwa) & fast mvps","tags":["mobile-web","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":1000,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":2000,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":3200,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-025-dir',
      'prod-svc-025',
      'GRO-E2-SME-GWT-SVC025-DIR',
      'Progressive Web Apps (PWA) & Fast MVPs Direct Proposal',
      'DIRECT_WIRE',
      2000,
      235000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    ),
(
      'sku-svc-026-upw',
      'prod-svc-026',
      'GRO-E2-SME-GWT-SVC026-UPW',
      'Custom ERP & Business Operating Systems on Upwork Project Catalog',
      'UPWORK',
      3000,
      350000,
      'one-time',
      '{"outcome_title":"You will get custom erp & business operating systems engineered with AI and cloud architecture","delivery_time":"1-2 Weeks","key_deliverables":["Role-Based Access Control (Admins, Managers, Staff, Clients)","Automated Financial Ledgers & Invoice Generation","Kanban Task & Project Management Pipeline","Telegram Bot & Real-Time Event Alerts"]}'::jsonb
    ),
(
      'sku-svc-026-fiv',
      'prod-svc-026',
      'GRO-E2-SME-GWT-SVC026-FIV',
      'Custom ERP & Business Operating Systems on Fiverr Pro',
      'FIVERR',
      3000,
      350000,
      'one-time',
      '{"gig_title":"I will build your custom erp & business operating systems","tags":["business-ai","automation","software","mvp","fast build"],"tiers":{"basic":{"name":"Starter Package","price":1500,"deliveryDays":5,"revisions":2},"standard":{"name":"Complete Package","price":3000,"deliveryDays":14,"revisions":4},"premium":{"name":"Enterprise Package","price":4800,"deliveryDays":21,"revisions":"Unlimited"}}}'::jsonb
    ),
(
      'sku-svc-026-dir',
      'prod-svc-026',
      'GRO-E2-SME-GWT-SVC026-DIR',
      'Custom ERP & Business Operating Systems Direct Proposal',
      'DIRECT_WIRE',
      3000,
      350000,
      'one-time',
      '{"contract_type":"FIXED_MILESTONE","payment_terms":"50% upfront, 50% upon final acceptance","support_days":30}'::jsonb
    );
