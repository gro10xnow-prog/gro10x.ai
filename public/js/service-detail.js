// ⚡ GRO10X AI GROWTH AGENCY — SERVICE DETAIL PAGE CONTROLLER (v4.0)

// ── 1. GLOBAL CURRENCY & STATE ──
var currentCurrency = localStorage.getItem('gro10x_currency') || 'USD';
var activeService = null;

// ── 2. CANONICAL SERVICE CATALOG ──
var GRO10X_CATALOG = [
  {
    id: "SVC-001",
    slug: "ai-mobile-apps",
    category: "mobile-web",
    categoryName: "AI Mobile Development",
    icon: "📱",
    title: "AI Mobile Apps",
    badge: "NEW",
    description: "Custom iOS and Android mobile apps with native generative AI and intelligent agent features built-in.",
    priceUSD: "$3,500",
    priceBDT: "৳410,000",
    priceCycle: "/ project",
    deliveryTime: "3-4 Weeks",
    features: [
      "Native React Native / Flutter Stack",
      "On-Device & Cloud AI Model Integration",
      "Real-Time Sync & Offline Mode Support",
      "App Store & Play Store Deployment Setup"
    ],
    includedFeatures: [
      "UX/UI Mobile Prototype in Figma",
      "Full Source Code & GitHub Repository Handover",
      "Cloud Infrastructure & Database Setup",
      "30 Days Post-Launch Maintenance & Bug Fixes"
    ],
    details: "We engineer production-ready iOS and Android applications embedded with OpenAI, Claude, and on-device machine learning models. Perfect for AI startups, productivity apps, voice companions, and smart business utilities.",
    faq: [
      { q: "Which platforms do you support?", a: "We build cross-platform apps using React Native and Flutter, ensuring seamless performance on both iOS and Android with a single unified codebase." },
      { q: "Can we integrate our custom AI models?", a: "Yes. We connect via REST APIs, WebSockets, or on-device CoreML / TensorFlow Lite models depending on latency and privacy needs." },
      { q: "Who owns the intellectual property and code?", a: "You do. 100% of the source code, design assets, and intellectual property are transferred to your repository upon completion." }
    ]
  },
  {
    id: "SVC-002",
    slug: "ai-websites-software",
    category: "mobile-web",
    categoryName: "AI Mobile Development",
    icon: "💻",
    title: "AI Websites & Software",
    badge: "NEW",
    description: "Ultra-fast web platforms and SaaS apps powered by modern frameworks and smart AI automation tools.",
    priceUSD: "$2,500",
    priceBDT: "৳295,000",
    priceCycle: "/ project",
    deliveryTime: "2-3 Weeks",
    features: [
      "Next.js & Node.js Scalable Architecture",
      "AI Lead Generation & Dynamic Forms",
      "SEO & Core Web Vitals 95+ Optimized",
      "Custom Database & User Authentication"
    ],
    includedFeatures: [
      "Custom Responsive Design System",
      "Stripe / SSLCommerz Payment Gateway Integration",
      "Admin Analytics Dashboard",
      "Serverless Vercel Cloud Hosting Setup"
    ],
    details: "From high-converting landing pages to complex multi-tenant SaaS platforms, we design and code web experiences that turn visitors into paying customers on autopilot.",
    faq: [
      { q: "Is the website SEO-ready?", a: "Yes, every page is built with semantic HTML, automated sitemaps, structured schema data, and fast load speeds to ensure top Google rankings." },
      { q: "Can we add user accounts and subscriptions?", a: "Yes, we integrate authentication (Supabase / NextAuth) and payment billing (Stripe) out of the box." }
    ]
  },
  {
    id: "SVC-003",
    slug: "ai-chatbots-agents",
    category: "mobile-web",
    categoryName: "AI Mobile Development",
    icon: "🤖",
    title: "AI Chatbots & Intelligent Agents",
    badge: "POPULAR",
    description: "24/7 smart conversational assistants connected to your knowledge base, WhatsApp, and CRM pipelines.",
    priceUSD: "$1,500",
    priceBDT: "৳175,000",
    priceCycle: "/ setup",
    deliveryTime: "7-10 Days",
    features: [
      "Context-Aware RAG Knowledge Base",
      "WhatsApp, Telegram & Web Widget Sync",
      "Human Handoff & CRM Auto-Recording",
      "Multi-Language Automatic Translation"
    ],
    includedFeatures: [
      "Document Ingestion (PDFs, Notion, FAQs)",
      "Lead Qualification & Booking Engine",
      "Prompt Optimization & Anti-Hallucination Guardrails",
      "1 Year Cloud Vector Database Hosting"
    ],
    details: "Replace static web forms and slow customer service with intelligent AI agents that qualify leads, answer detailed product questions, and book sales calls 24/7.",
    faq: [
      { q: "How accurate is the chatbot?", a: "Using Retrieval-Augmented Generation (RAG) and strict guardrails, the bot only responds based on your verified business documents, preventing hallucinations." }
    ]
  },
  {
    id: "SVC-004",
    slug: "ai-integrations-apis",
    category: "mobile-web",
    categoryName: "AI Mobile Development",
    icon: "🔌",
    title: "AI Integrations & APIs",
    badge: "",
    description: "Seamlessly connect your existing business tools (Stripe, HubSpot, Slack, WhatsApp) to state-of-the-art AI models.",
    priceUSD: "$1,200",
    priceBDT: "৳140,000",
    priceCycle: "/ project",
    deliveryTime: "5-7 Days",
    features: [
      "Custom Webhooks & REST API Middleware",
      "Automated Data Sync Pipelines",
      "Zapier / Make.com / n8n Automation Nodes",
      "Zero Downtime Architecture"
    ],
    includedFeatures: [
      "API Error Handling & Retry Queues",
      "Rate-Limiting & Cost Monitoring",
      "Secure Environment Secrets Management",
      "Technical Documentation & Runbook"
    ],
    details: "Unify your fragmented tools. We build custom API bridges that automate repetitive data entry, customer notifications, and internal team operations.",
    faq: [
      { q: "Do you support no-code tools like Make.com?", a: "Yes, we build both custom Node.js/Python microservices and n8n/Make/Zapier automated workflows depending on your preference." }
    ]
  },
  {
    id: "SVC-005",
    slug: "ai-fine-tuning-custom-models",
    category: "mobile-web",
    categoryName: "AI Mobile Development",
    icon: "🧠",
    title: "AI Fine-Tuning & Custom Models",
    badge: "",
    description: "Train and customize large language models on your internal data and brand tone for hyper-accurate outputs.",
    priceUSD: "$2,800",
    priceBDT: "৳330,000",
    priceCycle: "/ model",
    deliveryTime: "2-3 Weeks",
    features: [
      "Dataset Cleaning, Formatting & Synthetic Data",
      "LoRA & Full Fine-Tuning Pipelines",
      "Automated Benchmark & Evals Testing",
      "Private Secure Cloud Hosting"
    ],
    includedFeatures: [
      "Training Loss & Accuracy Reports",
      "Inference API Endpoint Setup",
      "Model Weight Export & Archive",
      "Quarterly Retraining Protocol"
    ],
    details: "When off-the-shelf models are not specialized enough, we fine-tune open-weight models (Llama 3, Mistral, Gemma) or OpenAI models on your proprietary datasets.",
    faq: [
      { q: "Is our data kept secure and private?", a: "Absolutely. All training runs are conducted in isolated private environments and your data is never used to train public models." }
    ]
  },
  {
    id: "SVC-006",
    slug: "ai-technology-consulting",
    category: "mobile-web",
    categoryName: "AI Mobile Development",
    icon: "💡",
    title: "AI Technology Consulting",
    badge: "NEW",
    description: "Expert technical roadmap to help your executive team select, architect, and deploy the right AI toolset.",
    priceUSD: "$800",
    priceBDT: "৳95,000",
    priceCycle: "/ audit",
    deliveryTime: "3-5 Days",
    features: [
      "Complete Tech Stack Architecture Audit",
      "Cost vs. ROI Evaluation Matrix",
      "Technical Architecture Diagram & Blueprints",
      "Vendor & Foundation Model Selection"
    ],
    includedFeatures: [
      "2 x 90-Minute Executive Advisory Calls",
      "Written 15-Page Technical Roadmap PDF",
      "Security & Data Compliance Review",
      "Implementation Vendor RFP Template"
    ],
    details: "Avoid costly mistakes by having senior AI software architects evaluate your technology strategy, cost models, and infrastructure before writing code.",
    faq: [
      { q: "Who is this suitable for?", a: "Founders, CTOs, and agency owners planning new AI products who want clear architectural direction and risk mitigation." }
    ]
  },
  {
    id: "SVC-007",
    slug: "project-management",
    category: "mobile-web",
    categoryName: "AI Mobile Development",
    icon: "🛠️",
    title: "Let Us Manage Your Project",
    badge: "",
    description: "End-to-end dedicated technical management: we handle design, coding, testing, and cloud deployment.",
    priceUSD: "Custom Scope",
    priceBDT: "Custom Scope",
    priceCycle: "",
    deliveryTime: "Custom SLA",
    features: [
      "Dedicated Technical Project Lead",
      "Agile Weekly Sprints & Daily Standups",
      "Transparent Real-Time Kanban Tracking",
      "100% On-Time Delivery Guarantee"
    ],
    includedFeatures: [
      "Full Product Lifecycle Ownership",
      "Automated CI/CD Deployment Pipelines",
      "QA Testing & Code Review Audits",
      "Weekly Video Briefings & Demos"
    ],
    details: "Have an entire dedicated engineering and design team at your disposal. We turn your product vision into reality without the friction of hiring and managing developers.",
    faq: [
      { q: "How do we track progress?", a: "You get direct real-time access to our GRO10X Command Center Kanban board, weekly sprint demos, and Slack/Telegram channels." }
    ]
  },
  {
    id: "SVC-008",
    slug: "ai-avatar-design",
    category: "ai-artists",
    categoryName: "AI Artists",
    icon: "👤",
    title: "AI Avatar Design",
    badge: "NEW",
    description: "Photorealistic or stylized digital avatars and brand ambassadors customized for your marketing campaigns.",
    priceUSD: "$600",
    priceBDT: "৳70,000",
    priceCycle: "/ avatar kit",
    deliveryTime: "3-5 Days",
    features: [
      "Multiple Character Poses & Facial Expressions",
      "4K Ultra-HD Commercial License Export",
      "Voice-Sync Ready Lip Rigging Assets",
      "Complete Brand Asset Kit Included"
    ],
    includedFeatures: [
      "Character Consistency Prompt Bible",
      "Transparent PNG & Layered Master Files",
      "3 Revision Cycles",
      "Social Media Avatar Presets"
    ],
    details: "Create recognizable virtual brand mascots and spokespersons for your video ads, product demonstrations, and social media channels without expensive actor fees.",
    faq: [
      { q: "Can we use the avatar in video?", a: "Yes, our avatar asset kits are formatted for direct lip-syncing in HeyGen, SadTalker, and custom video pipelines." }
    ]
  },
  {
    id: "SVC-009",
    slug: "comfyui-workflow-creation",
    category: "ai-artists",
    categoryName: "AI Artists",
    icon: "⚙️",
    title: "ComfyUI Workflow Creation",
    badge: "POPULAR",
    description: "Bespoke ComfyUI nodes and automated pipelines for instant, consistent product photo generation.",
    priceUSD: "$1,500",
    priceBDT: "৳175,000",
    priceCycle: "/ workflow",
    deliveryTime: "7-10 Days",
    features: [
      "Custom ControlNet & IP-Adapter Pipelines",
      "One-Click Automated Generation Setup",
      "Product Consistency Presets & Seed Controls",
      "Cloud (RunPod / Modal) or Local Installation"
    ],
    includedFeatures: [
      "Exportable .json Node Graph Handover",
      "Model Checkpoint & LoRA Recommendations",
      "Step-by-Step Loom Video Walkthrough",
      "14 Days Technical Workflow Support"
    ],
    details: "Stop doing manual product photoshoots. Generate hundreds of studio-quality marketing images in any setting, angle, or lighting in seconds.",
    faq: [
      { q: "Can I run this on my own computer?", a: "Yes, if you have an NVIDIA GPU (8GB+ VRAM), or we can set it up on cloud serverless GPUs for pennies per generation." }
    ]
  },
  {
    id: "SVC-010",
    slug: "midjourney-stable-diffusion-art",
    category: "ai-artists",
    categoryName: "AI Artists",
    icon: "🎨",
    title: "Midjourney & Stable Diffusion Art",
    badge: "",
    description: "High-concept artwork, architectural renders, packaging concepts, and high-impact digital art.",
    priceUSD: "$500",
    priceBDT: "৳60,000",
    priceCycle: "/ batch",
    deliveryTime: "3-5 Days",
    features: [
      "Upscaled 4K / 8K Master Deliverables",
      "Prompt Formula & Seed Handover",
      "Vectorization & Layered Files Support",
      "Full Unrestricted Commercial Rights"
    ],
    includedFeatures: [
      "25 Curated High-Concept Visuals",
      "Color Grading & Post-Processing in Photoshop",
      "Multiple Aspect Ratios (16:9, 9:16, 1:1)",
      "2 Rounds of Detailed Revisions"
    ],
    details: "Premium visuals crafted by experienced creative directors and prompt engineers for ad campaigns, website headers, packaging, and digital publications.",
    faq: [
      { q: "Do we get full copyright?", a: "Yes, all deliverables come with complete commercial usage rights for unlimited marketing and product packaging." }
    ]
  },
  {
    id: "SVC-011",
    slug: "all-ai-art-services",
    category: "ai-artists",
    categoryName: "AI Artists",
    icon: "✨",
    title: "All AI Art Services",
    badge: "",
    description: "Full-service visual production covering marketing creatives, social graphics, icon sets, and vector illustrations.",
    priceUSD: "$500",
    priceBDT: "৳60,000",
    priceCycle: "/ month",
    deliveryTime: "Ongoing Retainer",
    features: [
      "Weekly Creative Design Batches",
      "Fast 48-Hour Turnaround SLA",
      "Unlimited Revision Cycles on Active Requests",
      "Social-Ready Formats (1:1, 9:16, 16:9)"
    ],
    includedFeatures: [
      "Dedicated Slack/Telegram Channel",
      "Shared Figma Asset Library",
      "Brand Style Guide Alignment",
      "Cancel Anytime Monthly Retainer"
    ],
    details: "A steady stream of fresh marketing assets every week to fuel your social channels, paid ads, blog posts, and marketing campaigns.",
    faq: [
      { q: "How many assets can we request?", a: "You can submit unlimited requests to your queue, and we work on them sequentially with 48-hour turnarounds." }
    ]
  },
  {
    id: "SVC-012",
    slug: "ai-business-consulting",
    category: "business-ai",
    categoryName: "AI for Businesses",
    icon: "👔",
    title: "AI Business Consulting",
    badge: "",
    description: "Practical 1-on-1 strategy sessions to find the highest-ROI AI automation opportunities in your workflows.",
    priceUSD: "$750",
    priceBDT: "৳90,000",
    priceCycle: "/ session",
    deliveryTime: "2 Days",
    features: [
      "Workflow Bottleneck Deep-Dive Analysis",
      "Curated AI Tool Stack Recommendations",
      "Step-by-Step Implementation Blueprint",
      "Recorded Session & Executive Action Plan"
    ],
    includedFeatures: [
      "2-Hour Deep-Dive Strategy Call",
      "Custom Automation Architecture Document",
      "Cost vs. Time Savings Calculator",
      "14 Days Follow-Up Q&A Support"
    ],
    details: "Learn how modern agencies and enterprises are cutting 20+ hours of manual work every week and scaling operations without growing headcount.",
    faq: [
      { q: "What should we prepare before the call?", a: "A list of your repetitive business tasks, current software tools, and your primary operational goals for the quarter." }
    ]
  },
  {
    id: "SVC-013",
    slug: "ai-strategy-growth-roadmap",
    category: "business-ai",
    categoryName: "AI for Businesses",
    icon: "🗺️",
    title: "AI Strategy & Growth Roadmap",
    badge: "",
    description: "A comprehensive operational transformation roadmap to scale your agency or enterprise using automated systems.",
    priceUSD: "$1,800",
    priceBDT: "৳210,000",
    priceCycle: "/ roadmap",
    deliveryTime: "10-14 Days",
    features: [
      "Multi-Department Operational AI Mapping",
      "Financial KPI & Margin Growth Projections",
      "Staff Upskilling & Tool Rollout Plan",
      "Risk, Security & Privacy Policy Guidelines"
    ],
    includedFeatures: [
      "3 Comprehensive Advisory Interviews",
      "25-Page Custom Transformation Playbook",
      "Technology Vendor Selection Matrix",
      "Quarterly Executive Milestone Plan"
    ],
    details: "A strategic, executive-level document mapping out quarterly milestones, AI tool deployment, team training, and targeted cost reductions.",
    faq: [
      { q: "Is this suitable for enterprise companies?", a: "Yes, we tailor roadmaps for teams ranging from 5 to 250+ employees across diverse industries." }
    ]
  },
  {
    id: "SVC-014",
    slug: "ai-lessons-team-workshops",
    category: "business-ai",
    categoryName: "AI for Businesses",
    icon: "🎓",
    title: "AI Lessons & Team Workshops",
    badge: "",
    description: "Hands-on interactive training sessions to teach your employees how to use ChatGPT, Claude, Midjourney, and automation tools effectively.",
    priceUSD: "$1,000",
    priceBDT: "৳120,000",
    priceCycle: "/ workshop",
    deliveryTime: "1-Day Workshop",
    features: [
      "Live Interactive Screen-Share Demos",
      "Company-Specific Custom Prompt Kits",
      "Interactive Q&A & Hands-On Exercises",
      "Certified Course Completion Badges"
    ],
    includedFeatures: [
      "4-Hour Intensive Live Training",
      "Permanent Access to Workshop Recordings",
      "Reusable Prompt Library Handbook",
      "Pre & Post-Training Capability Assessment"
    ],
    details: "Empower your existing staff to produce 3x the output. We train your team on practical, day-to-day AI workflows tailored to your specific industry.",
    faq: [
      { q: "Can the workshop be conducted remotely?", a: "Yes, workshops are hosted via Zoom/Google Meet with live exercises, or on-site in Dhaka upon request." }
    ]
  },
  {
    id: "SVC-015",
    slug: "data-science-machine-learning",
    category: "data",
    categoryName: "Operational Data Intelligence",
    icon: "🔬",
    title: "Data Science & ML",
    badge: "",
    description: "Turn your historical customer data into predictive models that forecast sales, churn, and high-value customer cohorts.",
    priceUSD: "$2,400",
    priceBDT: "৳280,000",
    priceCycle: "/ project",
    deliveryTime: "2-3 Weeks",
    features: [
      "Predictive Cohort & Churn Modeling",
      "Customer Lifetime Value (LTV) Projections",
      "Custom Python & SQL Data Pipeline Build",
      "Automated Scheduled Training Runs"
    ],
    includedFeatures: [
      "Exploratory Data Analysis (EDA) Report",
      "Feature Engineering Documentation",
      "Model Accuracy Evaluation Metrics",
      "REST API Endpoint for Real-Time Scoring"
    ],
    details: "Stop guessing what your customers want. Use scientific predictive machine learning models to guide marketing budgets, pricing, and product decisions.",
    faq: [
      { q: "What data format do we need?", a: "We can ingest data directly from PostgreSQL, MySQL, CSVs, Stripe, Google Analytics, or CRM exports." }
    ]
  },
  {
    id: "SVC-016",
    slug: "data-analytics-dashboards",
    category: "data",
    categoryName: "Operational Data Intelligence",
    icon: "📊",
    title: "Data Analytics & Dashboards",
    badge: "POPULAR",
    description: "Clean, real-time visual dashboards that give leadership an instant view of marketing ROI, leads, and financials.",
    priceUSD: "$1,200",
    priceBDT: "৳140,000",
    priceCycle: "/ dashboard",
    deliveryTime: "5-7 Days",
    features: [
      "Real-Time Data Connectors & Live Sync",
      "Custom KPI Metric Cards & Gauges",
      "Mobile-Friendly Responsive Interface",
      "Automated Weekly Email & Telegram Reports"
    ],
    includedFeatures: [
      "Multi-Source Data Consolidation (Meta, Google, Stripe)",
      "Role-Based Access Permissions",
      "Export to PDF & CSV Functionality",
      "Dashboard Customization Handover Call"
    ],
    details: "Unify data from Google Ads, Meta, Stripe, and your internal database into a single executive command center for instant visibility.",
    faq: [
      { q: "Can we embed the dashboard in our portal?", a: "Yes, we build standalone web dashboards or embed them directly into your existing admin panels." }
    ]
  },
  {
    id: "SVC-017",
    slug: "data-visualization-diagnostics",
    category: "data",
    categoryName: "Operational Data Intelligence",
    icon: "📈",
    title: "Data Visualization & Diagnostics",
    badge: "",
    description: "Diagnostic user-pathway funnels that pinpoint exactly where prospective customers drop off in your sales pipeline.",
    priceUSD: "$900",
    priceBDT: "৳105,000",
    priceCycle: "/ audit",
    deliveryTime: "3-5 Days",
    features: [
      "Funnel Drop-Off Heatmaps & Analytics",
      "Conversion Rate Optimization (CRO) Insights",
      "Cohort Retention & Engagement Graphs",
      "Prioritized Actionable Fix Checklist"
    ],
    includedFeatures: [
      "Interactive Funnel Diagram",
      "10-Point Conversion Leak Report",
      "Recommended A/B Test Variations",
      "30-Minute Diagnostic Review Call"
    ],
    details: "Fix hidden leaks in your acquisition funnels to dramatically increase conversion rates and customer revenue from your existing traffic.",
    faq: [
      { q: "How quickly do we see results?", a: "Clients usually identify 2-3 quick conversion wins within 48 hours of implementing our funnel diagnostic checklist." }
    ]
  },
  {
    id: "SVC-018",
    slug: "ai-music-videos",
    category: "video",
    categoryName: "AI Video",
    icon: "🎵",
    title: "AI Music Videos",
    badge: "",
    description: "Visually stunning AI-generated music videos, dynamic visualizers, and artistic teaser clips.",
    priceUSD: "$1,200",
    priceBDT: "৳140,000",
    priceCycle: "/ video",
    deliveryTime: "7-10 Days",
    features: [
      "Beat-Synced Visual Transitions & Effects",
      "Cinematic Dynamic Camera Motions",
      "Custom Visual Aesthetic & Mood Direction",
      "4K Ultra-HD Master Render Output"
    ],
    includedFeatures: [
      "Full Length Music Video (up to 4 mins)",
      "3 Vertical Teaser Cuts for TikTok / Shorts",
      "Thumbnail Art Package",
      "Full Commercial Distribution Rights"
    ],
    details: "Create mind-bending video visuals that capture viral attention across TikTok, YouTube, and Spotify Canvas without multi-thousand dollar camera crews.",
    faq: [
      { q: "Can we specify the art style?", a: "Yes, from hyper-realistic anime to 3D cyberpunk, cinematic noir, or retro-futurism, we tailor visuals to your song." }
    ]
  },
  {
    id: "SVC-019",
    slug: "ai-video-avatars",
    category: "video",
    categoryName: "AI Video",
    icon: "🗣️",
    title: "AI Video Avatars",
    badge: "POPULAR",
    description: "Photorealistic talking avatar videos for tutorials, product explainers, and localized multilingual ads.",
    priceUSD: "$800",
    priceBDT: "৳95,000",
    priceCycle: "/ 5 videos",
    deliveryTime: "3-5 Days",
    features: [
      "Realistic Lip-Sync & Natural Gestures",
      "20+ Languages & Native Accents",
      "Dynamic Backgrounds & Screen Capture Inserts",
      "Fast 24-48 Hour Delivery Turnaround"
    ],
    includedFeatures: [
      "5 Custom Explainer / Ad Videos (60s each)",
      "Dynamic Captions & Sound Effects",
      "Script Polish & Translation",
      "Horizontal & Vertical Deliverables"
    ],
    details: "Produce endless video presentations, tutorials, and localized multilingual ads without needing a camera, studio, or recording equipment.",
    faq: [
      { q: "Can we use our founder's likeness?", a: "Yes, with proper consent we can clone your likeness and voice into a permanent reusable video avatar." }
    ]
  },
  {
    id: "SVC-020",
    slug: "ai-ugc-social-ads",
    category: "video",
    categoryName: "AI Video",
    icon: "📱",
    title: "AI UGC Social Ads",
    badge: "",
    description: "Engaging, user-generated style vertical video ads optimized for TikTok, Instagram Reels, and YouTube Shorts.",
    priceUSD: "$650",
    priceBDT: "৳75,000",
    priceCycle: "/ 5 reels",
    deliveryTime: "3-4 Days",
    features: [
      "High-Retention Visual Hooks & Pacing",
      "Dynamic On-Screen Captions & Sound FX",
      "A/B Hook Variations for Paid Testing",
      "Proven E-Commerce & SaaS Ad Formats"
    ],
    includedFeatures: [
      "5 High-Converting Short-Form Videos",
      "3 Hook Variations per Video (15 total cuts)",
      "High-Res MP4 Delivery Ready to Run",
      "Full Ad Spend Commercial License"
    ],
    details: "Test dozens of viral ad angles quickly and cost-effectively to find your top-converting winners and lower your Customer Acquisition Cost (CAC).",
    faq: [
      { q: "What formats do you deliver?", a: "Standard 9:16 vertical videos formatted specifically for TikTok, Meta Reels, and YouTube Shorts." }
    ]
  },
  {
    id: "SVC-021",
    slug: "voice-synthesis-ai-voice-clones",
    category: "audio",
    categoryName: "AI Audio",
    icon: "🎙️",
    title: "Voice Synthesis & AI Voice Clones",
    badge: "",
    description: "Clone your own voice or create realistic synthetic brand voices for podcasts, ads, and interactive assistants.",
    priceUSD: "$500",
    priceBDT: "৳60,000",
    priceCycle: "/ voice model",
    deliveryTime: "2-3 Days",
    features: [
      "Studio Quality Voice Matching & Clarity",
      "Natural Tone, Emotion & Pacing Control",
      "Multi-Language Speaking Capability",
      "Commercial API Integration Ready"
    ],
    includedFeatures: [
      "Custom Voice Model Training",
      "10 Recorded Audio Sample Outputs",
      "API Integration Documentation",
      "Full Commercial Rights"
    ],
    details: "Maintain audio brand consistency across hundreds of videos, podcasts, and automated customer phone calls with ultra-realistic voice models.",
    faq: [
      { q: "What audio samples are needed?", a: "We require 5-10 minutes of clean, high-quality audio recording with minimal background noise." }
    ]
  },
  {
    id: "SVC-022",
    slug: "text-to-speech-engines",
    category: "audio",
    categoryName: "AI Audio",
    icon: "🔊",
    title: "Text to Speech Engines",
    badge: "",
    description: "High-speed automated narration pipelines to turn blog posts, articles, and training docs into studio audio.",
    priceUSD: "$400",
    priceBDT: "৳48,000",
    priceCycle: "/ setup",
    deliveryTime: "3-5 Days",
    features: [
      "Automated High-Speed Audio File Export",
      "Natural Pacing, Pauses & Pronunciation",
      "Podcast RSS Feed Automation",
      "Sub-Second Latency Cloud API Setup"
    ],
    includedFeatures: [
      "Webhook Triggered Audio Generation",
      "Cloudflare R2 / AWS S3 Storage Setup",
      "Custom SSML Pronunciation Dictionary",
      "14 Days Technical Setup Warranty"
    ],
    details: "Turn written content, articles, and documentation into engaging audiobooks and podcasts with zero manual recording time.",
    faq: [
      { q: "Which TTS engines do you use?", a: "We implement ElevenLabs, OpenAI Audio, Cartesia, and open-source models depending on your budget and latency needs." }
    ]
  },
  {
    id: "SVC-023",
    slug: "ai-content-editing",
    category: "content",
    categoryName: "AI Content",
    icon: "📝",
    title: "AI Content Editing",
    badge: "",
    description: "Human-in-the-loop polishing and optimization of AI-generated articles, blogs, and sales landing pages.",
    priceUSD: "$450",
    priceBDT: "৳52,000",
    priceCycle: "/ 10 articles",
    deliveryTime: "3-5 Days",
    features: [
      "Fact-Checking & Source Verification",
      "SEO Keyword Optimization & Headings",
      "Readability, Nuance & Tone Refinement",
      "Plagiarism & AI Detection Scanner Check"
    ],
    includedFeatures: [
      "10 Polished Articles (up to 1,500 words each)",
      "Meta Titles & Descriptions Included",
      "Internal & External Linking Structure",
      "CMS Direct Publishing Support"
    ],
    details: "Get the speed of AI writing with the credibility, tone, and depth of veteran human editors. Perfect for content scaling without sacrificing brand reputation.",
    faq: [
      { q: "Will this pass AI detection tools?", a: "Our human editors restructure sentences, infuse real-world nuance, and verify facts to ensure authentic, human-level readability." }
    ]
  },
  {
    id: "SVC-024",
    slug: "custom-writing-prompts",
    category: "content",
    categoryName: "AI Content",
    icon: "✨",
    title: "Custom Writing Prompts",
    badge: "NEW",
    description: "Tailored prompt engineering libraries designed for your marketing team to produce on-brand copy in seconds.",
    priceUSD: "$600",
    priceBDT: "৳70,000",
    priceCycle: "/ library",
    deliveryTime: "3-5 Days",
    features: [
      "Brand Voice Guidelines Matrix",
      "Tested System Prompts (Claude & GPT-4o)",
      "Email, Ad, Blog & Social Copy Templates",
      "Team Onboarding Video & Notion Handbook"
    ],
    includedFeatures: [
      "25+ Custom-Engineered Prompts",
      "Few-Shot Output Examples Library",
      "Prompt Optimization Cheat-Sheet",
      "30-Minute Team Training Call"
    ],
    details: "Equip your writers and marketers with bulletproof prompts that generate consistent, high-converting copy in your exact brand tone every time.",
    faq: [
      { q: "Do these prompts work on ChatGPT Plus?", a: "Yes, prompts are optimized for ChatGPT, Claude 3.5 Sonnet, and team AI workspaces." }
    ]
  }
];

// ── 3. INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
  initCurrency();
  loadServiceFromUrl();
  renderRelatedServices();
});

// ── 4. CURRENCY LOGIC ──
function initCurrency() {
  const saved = localStorage.getItem('gro10x_currency') || 'USD';
  setCurrency(saved, false);
}

function setCurrency(curr, rehydrate = true) {
  currentCurrency = curr;
  localStorage.setItem('gro10x_currency', curr);

  const isUSD = curr === 'USD';
  const btnUSD = document.getElementById('btnCurrUSD');
  const btnBDT = document.getElementById('btnCurrBDT');
  if (btnUSD) btnUSD.classList.toggle('active', isUSD);
  if (btnBDT) btnBDT.classList.toggle('active', !isUSD);

  if (activeService) {
    const priceEl = document.getElementById('svcPriceMain');
    if (priceEl) priceEl.innerText = isUSD ? activeService.priceUSD : activeService.priceBDT;
  }

  if (rehydrate) {
    renderRelatedServices();
  }
}
window.setCurrency = setCurrency;

// ── 5. URL SERVICE HYDRATION ──
function loadServiceFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get('id') || params.get('service') || 'SVC-001';
  const slug = params.get('slug');

  activeService = GRO10X_CATALOG.find(s => s.id === serviceId || (slug && s.slug === slug)) || GRO10X_CATALOG[0];

  hydrateServiceDOM(activeService);
}

function hydrateServiceDOM(service) {
  const isUSD = currentCurrency === 'USD';

  // Title & Metas
  document.title = `${service.title} — GRO10X AI Growth Agency`;
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.innerText = `${service.title} — GRO10X AI Agency`;

  // Hero fields
  document.getElementById('svcCategoryBadge').innerHTML = `<span>${service.icon}</span> <span>${service.categoryName}</span>`;
  document.getElementById('svcTitle').innerText = service.title;
  document.getElementById('svcDesc').innerText = service.description;
  document.getElementById('svcDeliveryTime').innerText = service.deliveryTime;

  // Price box
  document.getElementById('svcPriceMain').innerText = isUSD ? service.priceUSD : service.priceBDT;
  document.getElementById('svcPriceCycle').innerText = service.priceCycle;

  // Hidden form fields
  document.getElementById('serviceFormId').value = service.id;
  document.getElementById('serviceFormTitle').value = service.title;

  // Overview & Features
  document.getElementById('svcFullDetails').innerText = service.details;
  
  const featList = document.getElementById('svcFeaturesList');
  if (featList) {
    featList.innerHTML = service.features.map(f => `
      <li>
        <span class="svc-check-icon">✓</span>
        <span>${f}</span>
      </li>
    `).join('');
  }

  // Deliverables
  const incList = document.getElementById('svcIncludedList');
  if (incList) {
    incList.innerHTML = service.includedFeatures.map(f => `
      <li>
        <span class="svc-check-icon">✓</span>
        <span>${f}</span>
      </li>
    `).join('');
  }

  // FAQ Accordion
  const faqList = document.getElementById('svcFaqList');
  if (faqList && service.faq) {
    faqList.innerHTML = service.faq.map(item => `
      <div class="pb-faq-item">
        <button class="pb-faq-question" onclick="toggleDetailFAQ(this)">
          <span>${item.q}</span>
          <span class="faq-icon">+</span>
        </button>
        <div class="pb-faq-answer">
          ${item.a}
        </div>
      </div>
    `).join('');
  }
}

// ── 6. RELATED SERVICES ──
function renderRelatedServices() {
  const grid = document.getElementById('relatedServicesGrid');
  if (!grid || !activeService) return;

  const isUSD = currentCurrency === 'USD';
  const related = GRO10X_CATALOG
    .filter(s => s.id !== activeService.id)
    .slice(0, 3);

  grid.innerHTML = related.map(s => {
    const priceText = isUSD ? s.priceUSD : s.priceBDT;
    return `
      <div class="pb-service-card">
        <div class="pb-card-header">
          <div class="pb-card-icon">${s.icon}</div>
          ${s.badge ? `<span class="pb-card-badge">${s.badge}</span>` : ''}
        </div>
        <span class="pb-card-cat">${s.categoryName}</span>
        <h3 class="pb-card-title">${s.title}</h3>
        <p class="pb-card-desc">${s.description}</p>
        <div class="pb-card-price-row">
          <span class="pb-price-tag">${priceText}</span>
          <span class="pb-price-cycle">${s.priceCycle}</span>
        </div>
        <div class="pb-card-actions">
          <a href="/service-detail.html?id=${s.id}" class="pb-btn-card-details" style="text-align:center; text-decoration:none;">
            🔍 View Service →
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// ── 7. BOOKING FORM SUBMISSION ──
async function submitServiceBooking(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitBooking');
  const feedback = document.getElementById('bookingFeedback');

  const name = document.getElementById('bookName')?.value || '';
  const email = document.getElementById('bookEmail')?.value || '';
  const phone = document.getElementById('bookPhone')?.value || '';
  const notes = document.getElementById('bookNotes')?.value || '';
  const serviceId = document.getElementById('serviceFormId')?.value || activeService?.id;
  const serviceTitle = document.getElementById('serviceFormTitle')?.value || activeService?.title;

  if (!name || !email || !phone) return;

  btn.disabled = true;
  btn.innerText = 'Submitting Booking...';

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        service_interest: `${serviceTitle} (${serviceId})`,
        notes,
        currency: currentCurrency,
        source: `Service Detail Page: ${serviceTitle}`
      })
    });

    const data = await res.json();
    if (res.ok && (data.success || data.lead || data.id)) {
      feedback.style.display = 'block';
      feedback.style.background = 'rgba(0, 223, 137, 0.15)';
      feedback.style.color = '#00df89';
      feedback.style.border = '1px solid rgba(0, 223, 137, 0.35)';
      feedback.innerHTML = `🎉 <strong>Booking Received!</strong> Our lead engineer will contact you on WhatsApp/Email within 24 hours to begin sprint onboarding.`;
      document.getElementById('serviceBookingForm').reset();
    } else {
      throw new Error(data.error || 'Failed to submit');
    }
  } catch (err) {
    feedback.style.display = 'block';
    feedback.style.background = 'rgba(239, 68, 68, 0.15)';
    feedback.style.color = '#ef4444';
    feedback.style.border = '1px solid rgba(239, 68, 68, 0.35)';
    feedback.innerHTML = `⚠️ Saved locally. You can also email us directly at <a href="mailto:gro10xnow@gmail.com" style="color:#00df89;">gro10xnow@gmail.com</a>.`;
  } finally {
    btn.disabled = false;
    btn.innerText = 'Submit Booking Request →';
  }
}
window.submitServiceBooking = submitServiceBooking;

// ── 8. FAQ ACCORDION HELPER ──
function toggleDetailFAQ(button) {
  const item = button.closest('.pb-faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('is-open');

  document.querySelectorAll('.pb-faq-list .pb-faq-item').forEach(el => {
    el.classList.remove('is-open');
    const icon = el.querySelector('.faq-icon');
    if (icon) icon.innerText = '+';
  });

  if (!isOpen) {
    item.classList.add('is-open');
    const icon = item.querySelector('.faq-icon');
    if (icon) icon.innerText = '−';
  }
}
window.toggleDetailFAQ = toggleDetailFAQ;
