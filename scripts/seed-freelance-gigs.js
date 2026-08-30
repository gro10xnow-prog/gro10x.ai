const fs = require("fs");
const path = require("path");

const SEEDED_STATE = {
  "accounts": [
    {
      "id": "ACC-TECH-001",
      "category": "mobile-web",
      "categoryName": "Technology Development",
      "ownerName": "Firoz Uddin Ahmed",
      "email": "gro10xnow@gmail.com",
      "platform": "fiverr",
      "accountTier": "New Seller (7 Gigs Quota)",
      "maxGigs": 7,
      "activeGigs": 7
    }
  ],
  "gigs": [
    {
      "id": "GIG-TECH-001",
      "accountId": "ACC-TECH-001",
      "serviceId": "SVC-025",
      "category": "mobile-web",
      "platform": "fiverr",
      "gigIndex": 1,
      "title": "I will build your web app or PWA MVP in 48 hours",
      "categorySelection": {
        "primary": "Programming & Tech",
        "sub": "Vibe Coding",
        "serviceType": "Development & MVP"
      },
      "tags": [
        "web app",
        "pwa",
        "mvp development",
        "fast web app",
        "supabase"
      ],
      "pricing": {
        "basic": {
          "title": "48-Hour Core MVP",
          "price": 300,
          "deliveryDays": 2,
          "revisions": 2,
          "description": "1 core feature working web app or PWA with responsive UI, live Vercel deployment, and Supabase database.",
          "features": [
            "Single Core Feature",
            "Supabase Database & Auth",
            "Responsive Mobile & Desktop UI",
            "Live Vercel Deployment",
            "Source Code Handover"
          ]
        },
        "standard": {
          "title": "Full MVP Sprint",
          "price": 600,
          "deliveryDays": 4,
          "revisions": 3,
          "description": "Complete MVP with up to 3 features, user auth, dynamic forms, API integration, and admin dashboard.",
          "features": [
            "Up to 3 Core Features",
            "User Auth & Roles",
            "REST API Integration",
            "Admin KPI Panel",
            "PWA Offline Mode",
            "7 Days Launch Support"
          ]
        },
        "premium": {
          "title": "Production MVP Suite",
          "price": 1200,
          "deliveryDays": 7,
          "revisions": "Unlimited",
          "description": "Production-ready web platform with payment gateway, automated notifications, full documentation, and 14 days warranty.",
          "features": [
            "Full MVP Architecture",
            "Payment Gateway (Stripe/PayPal)",
            "Automated Email & Telegram Alerts",
            "Security Hardened & SEO Ready",
            "14 Days Post-Launch Support"
          ]
        }
      },
      "description": "Need to validate your startup idea fast without waiting months? Traditional agencies take 6 to 12 weeks just to deliver a prototype. We do it differently: using modern AI-assisted engineering and cloud-native architecture, we engineer and deploy your live working MVP in as fast as 48 hours.\n\nWhat You Get:\n• Fully responsive web application or installable Progressive Web App (PWA)\n• Secure user authentication and real-time database powered by Supabase\n• Instant serverless cloud hosting on Vercel with zero downtime\n• Clean, documented Node.js / JavaScript source code you 100% own\n• Seamless mobile-first design with interactive user flows\n\nWhy Choose Our Sprint Approach?\nUnlike conventional developers who bill endless hourly rates, we execute fixed-scope, rapid sprint deliveries. You receive a live URL to test and pitch to investors immediately.\n\nOur Verified Tech Stack:\nNode.js, Express, Supabase PostgreSQL, Modern Responsive JS, Vercel Edge Cloud, and RESTful APIs.\n\nReady to see your concept live? Send a message with your idea, and let us launch your MVP this week!",
      "faq": [
        {
          "q": "What is included in the 48-hour delivery?",
          "a": "You receive a working, live-deployed web app with 1 core feature, database connection, user auth, and responsive UI."
        },
        {
          "q": "Can users install the app on their phones?",
          "a": "Yes! We build Progressive Web Apps (PWAs) that users can install directly to their iOS and Android home screens without app store delays."
        },
        {
          "q": "Do I get full ownership of the source code?",
          "a": "Absolutely. You get full ownership and access to the GitHub repository and database credentials upon completion."
        },
        {
          "q": "What if I need custom integrations later?",
          "a": "Our architecture is modular and scalable, allowing you to easily add payment gateways, APIs, or advanced features anytime."
        }
      ],
      "buyerRequirements": [
        "What is the core problem your app solves?",
        "Do you have a wireframe, reference website, or sketch of the layout?",
        "What are the 1-3 essential features required for this MVP launch?"
      ],
      "thumbnailBrief": {
        "headline": "WEB APP / PWA MVP",
        "subheading": "LIVE IN 48 HOURS · NODE.JS + SUPABASE",
        "colorPalette": [
          "#00DF89",
          "#09090B",
          "#FFFFFF"
        ],
        "visualStyle": "Dark mode glassmorphism mockup showing mobile PWA + desktop browser frame side-by-side.",
        "badgeText": "⚡ 48-HR SPRINT DELIVERY",
        "layoutAdvice": "Bold neon green headline on dark background with clean screenshot preview of dashboard interface."
      },
      "healthCheck": {
        "score": 10,
        "passed": true,
        "checks": [
          {
            "rule": "Title starts with 'I will'",
            "passed": true,
            "message": "Valid title format."
          },
          {
            "rule": "Title length between 25-80 chars",
            "passed": true,
            "message": "Title is 48 chars."
          },
          {
            "rule": "Exactly 5 keyword search tags (<= 20 chars each)",
            "passed": true,
            "message": "5 valid keyword tags provided."
          },
          {
            "rule": "Description length between 800-1250 chars",
            "passed": true,
            "message": "Description length: 1080 chars."
          },
          {
            "rule": "No pricing amounts in description body",
            "passed": true,
            "message": "No dollar amounts in description body."
          },
          {
            "rule": "No competitor platform mentions",
            "passed": true,
            "message": "Compliant with marketplace TOS."
          },
          {
            "rule": "At least 4 comprehensive FAQs",
            "passed": true,
            "message": "4 detailed FAQ pairs provided."
          },
          {
            "rule": "Rapid delivery turnaround (Basic tier <= 5 days)",
            "passed": true,
            "message": "Basic tier turnaround: 2 day(s)."
          },
          {
            "rule": "At least 3 clear buyer onboarding requirements",
            "passed": true,
            "message": "3 onboarding requirements provided."
          },
          {
            "rule": "Verified GRO10X capability stack only",
            "passed": true,
            "message": "All referenced tools are within verified stack."
          }
        ]
      },
      "status": "Live",
      "liveUrl": "https://www.fiverr.com/farhan/build-your-pwa-mvp-48h",
      "updatedAt": "2026-08-30T19:39:25.428Z",
      "titleBody": "build your web app or pwa mvp in 48 hours",
      "pricingMatrix": {
        "screens": {
          "basic": 2,
          "standard": 3,
          "premium": 10
        },
        "apis": {
          "basic": 0,
          "standard": 1,
          "premium": 5
        },
        "checkboxes": {
          "database": [
            true,
            true,
            true
          ],
          "auth": [
            true,
            true,
            true
          ],
          "seo": [
            false,
            false,
            true
          ],
          "analytics": [
            false,
            false,
            true
          ],
          "payment": [
            false,
            true,
            true
          ],
          "hosting": [
            true,
            true,
            true
          ],
          "admin": [
            true,
            true,
            true
          ],
          "securityAudit": [
            false,
            false,
            true
          ]
        }
      },
      "galleryPrompts": {
        "videoScenes": [
          "Scene 1 (0-10s) Hook: Cinematic macro shot of a frustrated entrepreneur staring at calendar showing 3 months agency delay, dramatic neon green glow transitions into a stopwatch hitting 48 hours.",
          "Scene 2 (10-20s) Problem: Fast dynamic montage of messy legacy code, endless agency invoices, and slow loading wireframes disappearing into digital smoke.",
          "Scene 3 (20-30s) Solution: High-tech 3D glassmorphic laptop opening rapidly, revealing sleek dark-mode Progressive Web App dashboard booting with 60fps fluidity.",
          "Scene 4 (30-40s) Architecture: Holographic node network displaying Node.js backend connecting securely to Supabase PostgreSQL real-time database with lightning pulses.",
          "Scene 5 (40-50s) Feature Demo: Smartphone screen smoothly installing the PWA icon to home screen, instant biometric login, dynamic interactive data chart rendering live.",
          "Scene 6 (50-60s) Handover: Digital padlock opening smoothly, revealing 100% full GitHub repository ownership, zero recurring agency fees badge glowing.",
          "Scene 7 (60-70s) CTA: High energy closing card with neon green typography: FAST 48-HR MVP SPRINT - SEND US YOUR SCOPE TODAY with GRO10X verified badge."
        ],
        "imagePrompts": [
          "Image 1 (Hero Thumbnail 1280x769): High-contrast dark glassmorphic banner with neon green (#00DF89) bold 3D typography: WEB APP / PWA MVP IN 48 HOURS, sleek floating MacBook and iPhone mockup displaying modern SaaS dashboard, verified speed badge.",
          "Image 2 (Feature Matrix Slide): Infographic layout on dark slate background showing 3 tier features: 48h Sprint, Supabase Database, Auth, Stripe integration, with checkmark matrix and clean UI icons.",
          "Image 3 (Architecture & Deliverables): Isometric 3D diagram showing full stack pipeline: Frontend Responsive PWA -> Supabase PostgreSQL DB -> Vercel Cloud Edge -> Full GitHub Repo Handover."
        ],
        "pdfPrompts": [
          "PDF 1 (Agency Case Study & Capabilities Guide): Write a 2-page executive agency capabilities brief detailing GRO10X rapid 48-hour MVP sprint methodology, technical architecture standards (Node.js + Supabase + Vercel), client deliverables breakdown, and project timeline milestone guarantee for prospective enterprise buyers.",
          "PDF 2 (Technical Onboarding & Deliverables Spec Sheet): Generate a comprehensive technical spec sheet and onboarding checklist for MVP buyers, covering database configuration requirements, user role permissions, API key integration protocols, and post-launch maintenance runbook."
        ]
      }
    },
    {
      "id": "GIG-TECH-002",
      "accountId": "ACC-TECH-001",
      "serviceId": "SVC-002",
      "category": "mobile-web",
      "platform": "fiverr",
      "gigIndex": 2,
      "title": "I will build fast AI web apps and SaaS platforms in 48h",
      "categorySelection": {
        "primary": "Programming & Tech",
        "sub": "Web Applications"
      },
      "tags": [
        "ai website",
        "saas web app",
        "nodejs express",
        "supabase app",
        "gemini ai"
      ],
      "pricing": {
        "basic": {
          "title": "Sprint MVP Launch",
          "price": 250,
          "deliveryDays": 2,
          "revisions": 2,
          "description": "High-converting single-page AI web platform with smart lead capture and Vercel deployment.",
          "features": [
            "Node.js Backend Setup",
            "Gemini AI Dynamic Forms",
            "Mobile-Optimized UI",
            "Vercel Fast Deployment"
          ]
        },
        "standard": {
          "title": "Full SaaS Platform",
          "price": 650,
          "deliveryDays": 4,
          "revisions": 3,
          "description": "Multi-page dynamic web app with Supabase database, secure auth, and smart AI features.",
          "features": [
            "Supabase Database & Auth",
            "Express API Endpoints",
            "Gemini AI Automation",
            "Google Sheets Sync",
            "Core Web Vitals 95+"
          ]
        },
        "premium": {
          "title": "Enterprise AI Ecosystem",
          "price": 1350,
          "deliveryDays": 7,
          "revisions": "Unlimited",
          "description": "Complete production-grade SaaS system with Telegram bot alerts, AI pipelines, and admin CRM.",
          "features": [
            "End-to-End SaaS Architecture",
            "Custom Supabase PostgreSQL",
            "Telegram Bot API Integration",
            "Gemini AI Core Logic",
            "VIP Priority Support"
          ]
        }
      },
      "description": "Stop waiting months to launch your digital product. At GRO10X AI Agency, we engineer ultra-fast, production-grade AI web platforms and SaaS apps delivered in days not months.\n\nWhat We Deliver:\n• High-performance Node.js and Express backend architecture\n• Secure Supabase PostgreSQL database and user authentication\n• Intelligent dynamic lead generation forms powered by Gemini AI\n• Automated workflows via Google Workspace and Google Apps Script\n• Real-time lead notifications using Telegram Bot API\n• Blazing 95+ Core Web Vitals performance deployed on Vercel\n\nWhy Choose GRO10X:\n• Rapid 48-hour sprint execution with zero code bloat\n• Mobile-first, responsive design engineered for instant conversion\n• Robust, scalable data models built for enterprise growth\n\nLaunch your vision with a battle-tested team dedicated to speed, scale, and clean execution. Send a message to start your build today!",
      "faq": [
        {
          "q": "How fast can you deliver the first working version?",
          "a": "Our rapid sprint delivers a working MVP within 48 hours for the Basic tier and complete full-stack systems within 4 to 7 days."
        },
        {
          "q": "What database and hosting infrastructure do you use?",
          "a": "We build scalable backends with Node.js, Express, and Supabase PostgreSQL, deployed globally with instant edge speeds on Vercel."
        },
        {
          "q": "Can the web app integrate automated alerts and CRM data?",
          "a": "Yes. We connect Gemini AI workflows directly to Telegram Bot API for instant alerts and Google Workspace for automated lead tracking."
        },
        {
          "q": "Will my web application be optimized for mobile screens and SEO?",
          "a": "Every build is mobile-first, lightweight, and fine-tuned to score 95+ on Google Core Web Vitals for maximum SEO performance."
        }
      ],
      "buyerRequirements": [
        "Please share a brief summary of your web app concept, target users, and key desired features.",
        "Do you already have branding assets (logos, colors, copy), or should we use high-conversion standard templates?",
        "Do you have your Supabase, Vercel, or Gemini API keys ready, or do you need guided setup instructions?"
      ],
      "thumbnailBrief": {
        "headline": "AI WEB APPS & SAAS",
        "subheading": "NODE.JS • SUPABASE • GEMINI AI",
        "colorPalette": [
          "#00DF89",
          "#09090B",
          "#FFFFFF"
        ],
        "visualStyle": "Dark modern SaaS interface mockup with glowing neon green accents and crisp typography",
        "badgeText": "⚡ LAUNCH IN 48 HOURS",
        "layoutAdvice": "Position bold headline in top left with green highlight; place 3D high-speed web app mockup on the right with the 48h badge on top right corner."
      },
      "healthCheck": {
        "score": 10,
        "passed": true,
        "checks": [
          {
            "rule": "Title starts with 'I will'",
            "passed": true,
            "message": "Valid title format."
          },
          {
            "rule": "Title length between 25-80 chars",
            "passed": true,
            "message": "Title is 55 chars."
          },
          {
            "rule": "Exactly 5 keyword search tags (<= 20 chars each)",
            "passed": true,
            "message": "5 valid keyword tags provided."
          },
          {
            "rule": "Description length between 800-1250 chars",
            "passed": true,
            "message": "Description length: 897 chars."
          },
          {
            "rule": "No pricing amounts in description body",
            "passed": true,
            "message": "No dollar amounts in description body."
          },
          {
            "rule": "No competitor platform mentions",
            "passed": true,
            "message": "Compliant with marketplace TOS."
          },
          {
            "rule": "At least 4 comprehensive FAQs",
            "passed": true,
            "message": "4 detailed FAQ pairs provided."
          },
          {
            "rule": "Rapid delivery turnaround (Basic tier <= 5 days)",
            "passed": true,
            "message": "Basic tier turnaround: 2 day(s)."
          },
          {
            "rule": "At least 3 clear buyer onboarding requirements",
            "passed": true,
            "message": "3 onboarding requirements provided."
          },
          {
            "rule": "Verified GRO10X capability stack only",
            "passed": true,
            "message": "All referenced tools are within verified stack."
          }
        ]
      },
      "status": "Generated",
      "liveUrl": "",
      "updatedAt": "2026-08-30T19:39:40.450Z",
      "titleBody": "build fast AI web apps and SaaS platforms in 48h",
      "pricingMatrix": {
        "screens": {
          "basic": 2,
          "standard": 3,
          "premium": 10
        },
        "apis": {
          "basic": 0,
          "standard": 1,
          "premium": 5
        },
        "checkboxes": {
          "database": [
            true,
            true,
            true
          ],
          "auth": [
            true,
            true,
            true
          ],
          "seo": [
            false,
            false,
            true
          ],
          "analytics": [
            false,
            false,
            true
          ],
          "payment": [
            false,
            true,
            true
          ],
          "hosting": [
            true,
            true,
            true
          ],
          "admin": [
            true,
            true,
            true
          ],
          "securityAudit": [
            false,
            false,
            true
          ]
        }
      },
      "galleryPrompts": {
        "videoScenes": [
          "Scene 1 (0-10s) Hook: Cinematic macro shot of entrepreneur facing weeks of development delay, transitioning into rapid GRO10X sprint timer.",
          "Scene 2 (10-20s) Problem: Legacy systems and high agency invoices dissolving into streamlined digital flow.",
          "Scene 3 (20-30s) Solution: Sleek dark-mode dashboard interface loading with fluid 60fps responsiveness.",
          "Scene 4 (30-40s) Architecture: Node.js backend connecting securely to Supabase PostgreSQL real-time database.",
          "Scene 5 (40-50s) Feature Demo: Interactive feature walkthrough with live dynamic forms and instant cloud response.",
          "Scene 6 (50-60s) Handover: Complete GitHub repository ownership and zero recurring maintenance fees badge.",
          "Scene 7 (60-70s) CTA: High energy closing card: RAPID SPRINT DELIVERY - SEND YOUR PROJECT SCOPE TODAY."
        ],
        "imagePrompts": [
          "Image 1 (Hero Thumbnail 1280x769): High-contrast dark glassmorphic banner with neon green (#00DF89) bold 3D typography: AI WEBSITES & SOFTWARE, floating laptop mockup and verified speed badge.",
          "Image 2 (Feature Matrix Slide): Dark slate grid highlighting 4 core sprint features, Supabase integration, and live Vercel cloud deployment.",
          "Image 3 (Architecture & Deliverables): 3D isometric diagram illustrating end-to-end full stack architecture and source code handover."
        ],
        "pdfPrompts": [
          "PDF 1 (Agency Case Study & Capabilities Guide): 2-page executive summary detailing GRO10X rapid development methodology, architecture standards, and milestone timeline.",
          "PDF 2 (Technical Onboarding & Deliverables Spec Sheet): Technical spec sheet and onboarding checklist covering database config, auth roles, and deployment runbook."
        ]
      }
    },
    {
      "id": "GIG-TECH-003",
      "accountId": "ACC-TECH-001",
      "serviceId": "SVC-026",
      "category": "business-ai",
      "platform": "fiverr",
      "gigIndex": 3,
      "title": "I will build a custom ERP or business management system for your business",
      "categorySelection": {
        "primary": "Programming & Tech",
        "sub": "Databases & Internal Tools",
        "serviceType": "Custom Operating Systems"
      },
      "tags": [
        "custom erp",
        "business software",
        "management system",
        "supabase database",
        "dashboard app"
      ],
      "pricing": {
        "basic": {
          "title": "Starter Operations Hub",
          "price": 500,
          "deliveryDays": 5,
          "revisions": 2,
          "description": "2 core business modules (e.g., Client CRM + Invoice Generator) with role login and Supabase backend.",
          "features": [
            "2 Custom Business Modules",
            "Role-Based Authentication",
            "Supabase PostgreSQL Database",
            "Export to CSV/PDF",
            "7 Days Handover Support"
          ]
        },
        "standard": {
          "title": "Full Agency ERP",
          "price": 1000,
          "deliveryDays": 10,
          "revisions": 4,
          "description": "Complete 5-module business operating system: CRM, Kanban Task Manager, Invoice Ledger, Team Attendance & Telegram Alerts.",
          "features": [
            "5 Core Operational Modules",
            "Kanban Project Workflow",
            "Financial Ledger & Invoicing",
            "Telegram Bot Notifications",
            "Staff Performance Tracker",
            "14 Days Support"
          ]
        },
        "premium": {
          "title": "Enterprise Operating System",
          "price": 1800,
          "deliveryDays": 15,
          "revisions": "Unlimited",
          "description": "Comprehensive enterprise ERP with automated cron digests, multi-role permissions, analytics BI scorecards, and live onboarding call.",
          "features": [
            "Unlimited Modules & Data Tables",
            "Multi-Tier Role Hierarchy",
            "Automated Daily Executive Digests",
            "Client Proofing Portal",
            "Live Video Training Call",
            "30 Days SLA Support"
          ]
        }
      },
      "description": "Still running your agency, clinic, or business on scattered spreadsheets, WhatsApp chats, and paper notes? Disorganized systems lead to lost client leads, delayed project deliveries, and billing errors. We build bespoke, web-based ERP and business operating systems designed specifically for your exact daily workflow.\n\nWhat Your Custom ERP Includes:\n• Centralized Client CRM and lead pipeline with automated status tracking\n• Production Kanban boards for team task management and milestone deadlines\n• Financial ledger with instant branded invoice generation and payout tracking\n• Telegram Bot alerts notifying you instantly when tasks change or invoices are paid\n• Role-based login access (Owner, Department Manager, Staff Specialist, Client)\n\nBuilt From Real Agency Experience:\nWe do not build theoretical software. We engineered the entire operating system that powers our own multi-department agency. You get tested, practical tools that reduce operational chaos and save 20+ hours of management overhead every single week.\n\nTech Stack:\nNode.js, Supabase PostgreSQL, Secure JWT Auth, and Cloud Hosting.\n\nMessage us today to discuss your business workflow and get a custom system demo!",
      "faq": [
        {
          "q": "Can the ERP match our unique company workflow?",
          "a": "Yes! Every pipeline stage, form field, user permission, and report is custom tailored to your exact operating model."
        },
        {
          "q": "Is our business data secure and private?",
          "a": "Yes, we implement PostgreSQL Row-Level Security (RLS) and encrypted authentication so only authorized users access records."
        },
        {
          "q": "Can staff access the system from their smartphones?",
          "a": "Yes, the entire interface is fully responsive on mobile browsers and can integrate with Telegram for on-the-go updates."
        },
        {
          "q": "Do you provide team training after deployment?",
          "a": "Yes, we provide documented runbooks and step-by-step video walkthroughs so your team can start using it immediately."
        }
      ],
      "buyerRequirements": [
        "What type of business do you run and how many team members do you have?",
        "What are the top 3 manual tasks or spreadsheet workflows you want to automate?",
        "Which user roles do you need (e.g. Admin, Manager, Employee, Client)?"
      ],
      "thumbnailBrief": {
        "headline": "CUSTOM ERP / BUSINESS OS",
        "subheading": "REPLACE SPREADSHEETS · AUTOMATE OPERATIONS",
        "colorPalette": [
          "#3B82F6",
          "#10B981",
          "#09090B"
        ],
        "visualStyle": "Sleek dark mode enterprise dashboard showcasing Kanban board, revenue metrics, and CRM pipeline.",
        "badgeText": "⭐ AGENCY PROVEN SYSTEM",
        "layoutAdvice": "High-end corporate UI preview with clear badge highlighting operational time savings and multi-role access."
      },
      "healthCheck": {
        "score": 10,
        "passed": true,
        "checks": [
          {
            "rule": "Title starts with 'I will'",
            "passed": true,
            "message": "Valid title format."
          },
          {
            "rule": "Title length between 25-80 chars",
            "passed": true,
            "message": "Title is 73 chars."
          },
          {
            "rule": "Exactly 5 keyword search tags (<= 20 chars each)",
            "passed": true,
            "message": "5 valid keyword tags provided."
          },
          {
            "rule": "Description length between 800-1250 chars",
            "passed": true,
            "message": "Description length: 1189 chars."
          },
          {
            "rule": "No pricing amounts in description body",
            "passed": true,
            "message": "No dollar amounts in description body."
          },
          {
            "rule": "No competitor platform mentions",
            "passed": true,
            "message": "Compliant with marketplace TOS."
          },
          {
            "rule": "At least 4 comprehensive FAQs",
            "passed": true,
            "message": "4 detailed FAQ pairs provided."
          },
          {
            "rule": "Rapid delivery turnaround (Basic tier <= 5 days)",
            "passed": true,
            "message": "Basic tier turnaround: 5 day(s)."
          },
          {
            "rule": "At least 3 clear buyer onboarding requirements",
            "passed": true,
            "message": "3 onboarding requirements provided."
          },
          {
            "rule": "Verified GRO10X capability stack only",
            "passed": true,
            "message": "All referenced tools are within verified stack."
          }
        ]
      },
      "status": "Generated",
      "liveUrl": "",
      "updatedAt": "2026-08-30T19:35:58.445Z",
      "titleBody": "build a custom ERP or business management system for your business",
      "pricingMatrix": {
        "screens": {
          "basic": 3,
          "standard": 6,
          "premium": 12
        },
        "apis": {
          "basic": 1,
          "standard": 3,
          "premium": 8
        },
        "checkboxes": {
          "database": [
            true,
            true,
            true
          ],
          "auth": [
            true,
            true,
            true
          ],
          "seo": [
            false,
            false,
            false
          ],
          "analytics": [
            true,
            true,
            true
          ],
          "payment": [
            false,
            true,
            true
          ],
          "hosting": [
            true,
            true,
            true
          ],
          "admin": [
            true,
            true,
            true
          ],
          "securityAudit": [
            true,
            true,
            true
          ]
        }
      },
      "galleryPrompts": {
        "videoScenes": [
          "Scene 1 (0-10s) Hook: Office desk overflowing with messy paper invoices, tangled spreadsheets, and stressed business owner hitting keyboard in frustration.",
          "Scene 2 (10-20s) Transformation: Messy spreadsheets dissolve into glowing digital streams connecting directly into a sleek, unified GRO10X custom ERP dashboard.",
          "Scene 3 (20-30s) Module Showcase: Fast smooth navigation through Inventory Tracker, Staff Management, Automated Invoicing, and Real-time Cashflow modules.",
          "Scene 4 (30-40s) Role-Based Security: Multi-tier access control demo: Admin, Finance Manager, and Specialist logins displaying tailored permission views.",
          "Scene 5 (40-50s) Automated Alerts: Live trigger notification popping up on desktop and mobile: Invoice Paid, Stock Low, Leave Approved with 1-click actions.",
          "Scene 6 (50-60s) Custom Fit: Visual showing zero monthly SaaS per-user licensing fees, 100% database sovereignty on Supabase PostgreSQL.",
          "Scene 7 (60-70s) CTA: Executive boardroom closing card: TRANSFORM YOUR BUSINESS OPERATIONS INTO A CUSTOM ERP - BOOK A SYSTEM ARCHITECTURE CALL."
        ],
        "imagePrompts": [
          "Image 1 (Hero Thumbnail 1280x769): High-impact dark enterprise UI with royal purple and emerald green accents, bold headline: CUSTOM ERP & BUSINESS OPERATING SYSTEM, dual widescreen monitors displaying complete multi-module CRM and inventory dashboard.",
          "Image 2 (Modular ERP Architecture Slide): Clean grid showing 6 core modules: CRM & Leads, Invoicing & Payroll, Inventory, Kanban Operations, Telegram Bot Engine, Executive Telemetry.",
          "Image 3 (Enterprise Security & Data Sovereignty): Infographic illustrating dedicated Supabase PostgreSQL schema, Row-Level Security, automated daily backups, and source code ownership."
        ],
        "pdfPrompts": [
          "PDF 1 (Enterprise ERP Architecture & Implementation Roadmap): Produce a comprehensive 2-page systems blueprint detailing GRO10X custom business operating system modules, database ERD schema design, user RBAC matrices, and migration methodology from legacy spreadsheets.",
          "PDF 2 (ERP Operational Audit & Discovery Questionnaire): Create a 2-page operational discovery document with structured diagnostic questions for department heads (Sales, Inventory, Finance, HR) to scope custom ERP workflows."
        ]
      }
    },
    {
      "id": "GIG-TECH-004",
      "accountId": "ACC-TECH-001",
      "serviceId": "SVC-003",
      "category": "mobile-web",
      "platform": "fiverr",
      "gigIndex": 4,
      "title": "I will build a custom AI Telegram bot or WhatsApp chatbot for your business",
      "categorySelection": {
        "primary": "Programming & Tech",
        "sub": "Chatbots",
        "serviceType": "Chatbot Development"
      },
      "tags": [
        "telegram bot",
        "ai chatbot",
        "whatsapp bot",
        "custom bot",
        "business bot"
      ],
      "pricing": {
        "basic": {
          "title": "Menu & Command Bot",
          "price": 150,
          "deliveryDays": 3,
          "revisions": 2,
          "description": "Interactive Telegram or WhatsApp bot with custom button menus, command handling, and FAQs.",
          "features": [
            "Interactive Button Menus",
            "Custom Command Handlers",
            "FAQ Auto-Responder",
            "Webhook Deployment",
            "7 Days Support"
          ]
        },
        "standard": {
          "title": "Smart AI Assistant Bot",
          "price": 350,
          "deliveryDays": 5,
          "revisions": 3,
          "description": "AI-powered chatbot connected to your business documents (PDFs, FAQs) via Gemini model with lead capture.",
          "features": [
            "Gemini AI Document RAG",
            "Lead Qualification Engine",
            "Database CRM Recording",
            "Admin Broadcast Menu",
            "Multi-Language Support"
          ]
        },
        "premium": {
          "title": "Full Bot & Mini App Ecosystem",
          "price": 700,
          "deliveryDays": 8,
          "revisions": "Unlimited",
          "description": "Complete dual bot system (Team Ops + Client Success) with interactive Telegram Mini App and database sync.",
          "features": [
            "Dual Bot Architecture",
            "Telegram Mini App Integration",
            "Payment Verification Flow",
            "Real-Time Group Broadcasts",
            "30 Days Technical SLA"
          ]
        }
      },
      "description": "Are you losing valuable prospective leads because your customer service team cannot respond 24/7? We engineer high-performance AI chatbots and Telegram bot systems that engage visitors, answer complex product questions, qualify buyers, and notify your sales team in real time.\n\nWhat Our Bots Do For You:\n• 24/7 automated lead capture, question answering, and customer qualification\n• Retrieval-Augmented Generation (RAG) answering questions based strictly on your verified docs\n• Automated push notifications sent directly to staff or client Telegram channels\n• Interactive inline button menus, booking calendars, and web mini apps\n• Multi-language automatic recognition and response\n\nWhy Choose Our Bot Architecture:\nUnlike generic no-code bot builders that charge high monthly fees and suffer from downtime, we engineer custom Node.js webhook bots running on lightning-fast cloud servers with zero hallucination guardrails.\n\nTech Stack:\nTelegram Bot API, WhatsApp Business Webhooks, Google Gemini AI, Node.js, and Supabase PostgreSQL.\n\nLet us automate your customer interactions! Send us a message with your bot requirements to get started.",
      "faq": [
        {
          "q": "How does the bot prevent giving false information?",
          "a": "We implement strict prompt engineering guardrails and vector document ingestion so the bot only answers from your verified data."
        },
        {
          "q": "Can the bot notify my personal Telegram when a lead arrives?",
          "a": "Yes! We set up instant push alerts with buyer contact info and inquiry details sent immediately to your phone."
        },
        {
          "q": "Do I need to pay monthly subscription fees for the bot?",
          "a": "No, our bots run on serverless cloud architecture with free-tier capabilities for thousands of monthly messages."
        },
        {
          "q": "Can the bot include a Telegram Mini App?",
          "a": "Yes, on our Premium tier we can build interactive Webview Mini Apps directly inside the Telegram chat window."
        }
      ],
      "buyerRequirements": [
        "Which platform do you want the bot on (Telegram, WhatsApp, or Web Widget)?",
        "What are the primary actions the bot should perform (e.g. Lead capture, FAQ answering, Booking)?",
        "Do you have existing documentation or website text for the bot's knowledge base?"
      ],
      "thumbnailBrief": {
        "headline": "AI TELEGRAM & WHATSAPP BOT",
        "subheading": "24/7 LEAD CAPTURE · GEMINI AI · ZERO DOWNTIME",
        "colorPalette": [
          "#00DF89",
          "#229ED9",
          "#09090B"
        ],
        "visualStyle": "Smartphone showing clean Telegram bot conversation with inline buttons and instant lead notification badges.",
        "badgeText": "🤖 24/7 AUTONOMOUS AGENT",
        "layoutAdvice": "Prominent Telegram blue and AI neon green color accents with realistic chat bubble illustrations."
      },
      "healthCheck": {
        "score": 10,
        "passed": true,
        "checks": [
          {
            "rule": "Title starts with 'I will'",
            "passed": true,
            "message": "Valid title format."
          },
          {
            "rule": "Title length between 25-80 chars",
            "passed": true,
            "message": "Title is 75 chars."
          },
          {
            "rule": "Exactly 5 keyword search tags (<= 20 chars each)",
            "passed": true,
            "message": "5 valid keyword tags provided."
          },
          {
            "rule": "Description length between 800-1250 chars",
            "passed": true,
            "message": "Description length: 1142 chars."
          },
          {
            "rule": "No pricing amounts in description body",
            "passed": true,
            "message": "No dollar amounts in description body."
          },
          {
            "rule": "No competitor platform mentions",
            "passed": true,
            "message": "Compliant with marketplace TOS."
          },
          {
            "rule": "At least 4 comprehensive FAQs",
            "passed": true,
            "message": "4 detailed FAQ pairs provided."
          },
          {
            "rule": "Rapid delivery turnaround (Basic tier <= 5 days)",
            "passed": true,
            "message": "Basic tier turnaround: 3 day(s)."
          },
          {
            "rule": "At least 3 clear buyer onboarding requirements",
            "passed": true,
            "message": "3 onboarding requirements provided."
          },
          {
            "rule": "Verified GRO10X capability stack only",
            "passed": true,
            "message": "All referenced tools are within verified stack."
          }
        ]
      },
      "status": "Generated",
      "liveUrl": "",
      "updatedAt": "2026-08-30T19:35:58.445Z",
      "titleBody": "build a custom AI Telegram bot or WhatsApp chatbot for your business",
      "pricingMatrix": {
        "screens": {
          "basic": 1,
          "standard": 3,
          "premium": 5
        },
        "apis": {
          "basic": 1,
          "standard": 2,
          "premium": 4
        },
        "checkboxes": {
          "database": [
            true,
            true,
            true
          ],
          "auth": [
            true,
            true,
            true
          ],
          "seo": [
            false,
            false,
            false
          ],
          "analytics": [
            false,
            true,
            true
          ],
          "payment": [
            false,
            false,
            true
          ],
          "hosting": [
            true,
            true,
            true
          ],
          "admin": [
            true,
            true,
            true
          ],
          "securityAudit": [
            false,
            true,
            true
          ]
        }
      },
      "galleryPrompts": {
        "videoScenes": [
          "Scene 1 (0-10s) Hook: Midnight clock ticking, prospective client asking a product question on mobile chat with zero response from competing business.",
          "Scene 2 (10-20s) Instant AI Response: GRO10X AI Bot replying within 0.5 seconds with personalized, verified product info and interactive booking button.",
          "Scene 3 (20-30s) RAG Precision: Visual graphic showing Gemini AI scanning verified company knowledge base to generate hallucination-free answers.",
          "Scene 4 (30-40s) Interactive Menus: Smooth user interaction with Telegram inline buttons, web mini apps, order tracking, and lead qualification wizard.",
          "Scene 5 (40-50s) Team Escalation: High-value lead captured and instantly dispatched to business owner Telegram group with 1-click Contact button.",
          "Scene 6 (50-60s) Reliability: High uptime serverless architecture running 24/7 with zero monthly third-party platform bot fees.",
          "Scene 7 (60-70s) CTA: Glowing chatbot interface card: 24/7 AI TELEGRAM & WHATSAPP BOTS - AUTOMATE YOUR SALES & SUPPORT TODAY."
        ],
        "imagePrompts": [
          "Image 1 (Hero Thumbnail 1280x769): Futuristic dark background with electric blue glow, bold typography: 24/7 AI TELEGRAM & WHATSAPP CHATBOT, floating iPhone displaying interactive Telegram bot chat with inline buttons and verified badge.",
          "Image 2 (Bot Capabilities Grid): 4-quadrant diagram showing 24/7 Lead Capture, RAG Document Knowledge Base, Telegram Mini App Integration, and Real-time Team Push Alerts.",
          "Image 3 (Architecture Flowchart): Clean visual pipeline: Customer Query -> Gemini AI Engine -> Supabase DB -> Instant Telegram / WhatsApp Notification."
        ],
        "pdfPrompts": [
          "PDF 1 (AI Bot Architecture & RAG Knowledge Base Guide): Write a 2-page technical guide explaining how custom Telegram and WhatsApp bots integrate with enterprise RAG knowledge bases, handle fallback escalations, and protect proprietary business data.",
          "PDF 2 (Chatbot Conversation Flow & FAQ Configuration Handbook): Create a structured client onboarding worksheet for drafting intent trees, custom greeting messages, lead qualification criteria, and notification channel webhooks."
        ]
      }
    },
    {
      "id": "GIG-TECH-005",
      "accountId": "ACC-TECH-001",
      "serviceId": "SVC-016",
      "category": "data",
      "platform": "fiverr",
      "gigIndex": 5,
      "title": "I will build a real-time analytics or operations dashboard for your business",
      "categorySelection": {
        "primary": "Programming & Tech",
        "sub": "Data Analytics",
        "serviceType": "Data Visualization & Dashboards"
      },
      "tags": [
        "dashboard",
        "analytics dashboard",
        "kpi dashboard",
        "data visualization",
        "business metrics"
      ],
      "pricing": {
        "basic": {
          "title": "Starter KPI Card",
          "price": 250,
          "deliveryDays": 3,
          "revisions": 2,
          "description": "Interactive single-page dashboard with 4 core metric cards and 2 visual charts connected to your data.",
          "features": [
            "4 Metric KPI Cards",
            "2 Interactive Charts",
            "CSV/Spreadsheet Data Sync",
            "Responsive Mobile View",
            "Source Code Handover"
          ]
        },
        "standard": {
          "title": "Executive BI Dashboard",
          "price": 550,
          "deliveryDays": 5,
          "revisions": 3,
          "description": "Multi-tab visual dashboard with live database connection, date range filters, and export to CSV/PDF.",
          "features": [
            "Multi-Tab Visual Analytics",
            "Real-Time Database Sync",
            "Date Range & Category Filtering",
            "Export to CSV & PDF",
            "Automated Daily Summary"
          ]
        },
        "premium": {
          "title": "Full Operations Command Center",
          "price": 1000,
          "deliveryDays": 8,
          "revisions": "Unlimited",
          "description": "Enterprise-grade real-time command center with multi-source data consolidation, user roles, and Telegram alerts.",
          "features": [
            "Multi-Source Data Integration",
            "Role-Based View Permissions",
            "Automated Telegram Reports",
            "Live Event Stream (SSE)",
            "30 Days Support"
          ]
        }
      },
      "description": "Are you wasting hours every week digging through spreadsheets, Stripe accounts, and marketing platforms just to understand your business performance? We build custom, real-time analytics and operations dashboards that give executives and business owners clear visual visibility in one single screen.\n\nWhat We Deliver:\n• Real-time metric cards showing revenue, customer acquisition cost, conversion rate, and active leads\n• Interactive visual charts (trend lines, bar graphs, cohort heatmaps, and funnel drop-offs)\n• Custom date range filtering and search across all operational data\n• Automated daily or weekly digest reports sent directly to your Telegram or email\n• Clean, modern dark mode glassmorphism UI designed for rapid decision-making\n\nWhy Choose Us:\nWe do not just dump charts on a page. We engineer custom analytics platforms built specifically around your core business KPIs, ensuring leadership can identify trends and make data-driven decisions instantly.\n\nTech Stack:\nNode.js, Supabase PostgreSQL, Chart.js, HTML5/CSS3, and Vercel Cloud.\n\nMessage us with your data sources to discuss your custom dashboard build today!",
      "faq": [
        {
          "q": "What data sources can you connect to the dashboard?",
          "a": "We can connect PostgreSQL, MySQL, CSV spreadsheets, Stripe, Google Sheets, or custom REST APIs."
        },
        {
          "q": "Can I filter data by date range or specific categories?",
          "a": "Yes, our dashboards include interactive filters for dates, departments, sales reps, and customer tiers."
        },
        {
          "q": "Can we embed the dashboard inside our existing portal?",
          "a": "Yes, we can deliver it as a standalone web application or as an embeddable component for your existing system."
        },
        {
          "q": "Is the dashboard mobile-friendly?",
          "a": "Yes! All layout grids and charts resize seamlessly for smartphones and tablets."
        }
      ],
      "buyerRequirements": [
        "What data sources or spreadsheets will the dashboard connect to?",
        "What are the top 3-5 key metrics (KPIs) you need to monitor?",
        "Do you have a preferred color theme or brand aesthetic?"
      ],
      "thumbnailBrief": {
        "headline": "REAL-TIME KPI DASHBOARD",
        "subheading": "REVENUE · LEADS · OPERATIONS · LIVE DATA",
        "colorPalette": [
          "#38BDF8",
          "#818CF8",
          "#09090B"
        ],
        "visualStyle": "Dark glassmorphism analytics dashboard displaying colorful gradient charts and real-time metric gauges.",
        "badgeText": "📊 1-SCREEN EXECUTIVE VISIBILITY",
        "layoutAdvice": "Show dynamic chart widgets with modern neon blue and purple glowing data curves on dark backdrop."
      },
      "healthCheck": {
        "score": 10,
        "passed": true,
        "checks": [
          {
            "rule": "Title starts with 'I will'",
            "passed": true,
            "message": "Valid title format."
          },
          {
            "rule": "Title length between 25-80 chars",
            "passed": true,
            "message": "Title is 76 chars."
          },
          {
            "rule": "Exactly 5 keyword search tags (<= 20 chars each)",
            "passed": true,
            "message": "5 valid keyword tags provided."
          },
          {
            "rule": "Description length between 800-1250 chars",
            "passed": true,
            "message": "Description length: 1133 chars."
          },
          {
            "rule": "No pricing amounts in description body",
            "passed": true,
            "message": "No dollar amounts in description body."
          },
          {
            "rule": "No competitor platform mentions",
            "passed": true,
            "message": "Compliant with marketplace TOS."
          },
          {
            "rule": "At least 4 comprehensive FAQs",
            "passed": true,
            "message": "4 detailed FAQ pairs provided."
          },
          {
            "rule": "Rapid delivery turnaround (Basic tier <= 5 days)",
            "passed": true,
            "message": "Basic tier turnaround: 3 day(s)."
          },
          {
            "rule": "At least 3 clear buyer onboarding requirements",
            "passed": true,
            "message": "3 onboarding requirements provided."
          },
          {
            "rule": "Verified GRO10X capability stack only",
            "passed": true,
            "message": "All referenced tools are within verified stack."
          }
        ]
      },
      "status": "Generated",
      "liveUrl": "",
      "updatedAt": "2026-08-30T19:35:58.445Z",
      "titleBody": "build a real-time analytics or operations dashboard for your business",
      "pricingMatrix": {
        "screens": {
          "basic": 1,
          "standard": 3,
          "premium": 6
        },
        "apis": {
          "basic": 1,
          "standard": 2,
          "premium": 4
        },
        "checkboxes": {
          "database": [
            true,
            true,
            true
          ],
          "auth": [
            true,
            true,
            true
          ],
          "seo": [
            false,
            false,
            false
          ],
          "analytics": [
            true,
            true,
            true
          ],
          "payment": [
            false,
            false,
            false
          ],
          "hosting": [
            true,
            true,
            true
          ],
          "admin": [
            true,
            true,
            true
          ],
          "securityAudit": [
            false,
            false,
            true
          ]
        }
      },
      "galleryPrompts": {
        "videoScenes": [
          "Scene 1 (0-10s) Hook: Chaotic multiple browser tabs with Stripe, Google Analytics, and spreadsheets failing to give executive clear business health view.",
          "Scene 2 (10-20s) Single Screen Clarity: All data streams converge into a stunning dark glassmorphic command center with real-time KPI tiles glowing green.",
          "Scene 3 (20-30s) Interactive Charts: Cursor hovering smoothly over dynamic revenue charts, cohort retention heatmaps, and funnel drop-off analytics.",
          "Scene 4 (30-40s) Live Filters: Date range picker filtering instantly across millions of data points in milliseconds with zero loading lag.",
          "Scene 5 (40-50s) Automated Digests: Daily 9 AM morning briefing summary generating automatically and pinging executive mobile device.",
          "Scene 6 (50-60s) Data Security: Clean Supabase PostgreSQL connection with encrypted API tokens and strict access controls.",
          "Scene 7 (60-70s) CTA: High-end executive analytics display: REAL-TIME EXECUTIVE OPERATIONS DASHBOARDS - SEE YOUR ENTIRE BUSINESS IN ONE SCREEN."
        ],
        "imagePrompts": [
          "Image 1 (Hero Thumbnail 1280x769): Ultra-premium dark analytics cockpit with vibrant neon green and purple data graphs, bold text: REAL-TIME ANALYTICS & OPS DASHBOARD, dual curved monitors showing multi-chart KPI control center.",
          "Image 2 (Chart Types & Data Visualization Slide): Showcase of 4 interactive chart modules: Revenue Trends, Lead Conversion Funnel, Customer Cohorts, and Team Output Metrics.",
          "Image 3 (Data Pipeline Integration Diagram): Clear infographic mapping multiple data sources (Stripe, PostgreSQL, CSV, REST APIs) aggregating into unified Chart.js visual interface."
        ],
        "pdfPrompts": [
          "PDF 1 (Executive KPI Framework & Dashboard Design Spec): Produce a 2-page executive guide detailing essential SaaS and agency KPI metrics (MRR, CAC, LTV, Net Margin), chart visual hierarchy, and telemetry thresholds for leadership dashboards.",
          "PDF 2 (Dashboard Data Integration & API Connection Guide): Create a step-by-step technical spec sheet for connecting third-party databases, webhook endpoints, and scheduled aggregation jobs into custom dashboards."
        ]
      }
    },
    {
      "id": "GIG-TECH-006",
      "accountId": "ACC-TECH-001",
      "serviceId": "SVC-004",
      "category": "mobile-web",
      "platform": "fiverr",
      "gigIndex": 6,
      "title": "I will connect your apps with a custom API or webhook integration",
      "categorySelection": {
        "primary": "Programming & Tech",
        "sub": "API & Integrations",
        "serviceType": "API Integration & Middleware"
      },
      "tags": [
        "api integration",
        "webhook automation",
        "custom api",
        "google workspace",
        "automation bridge"
      ],
      "pricing": {
        "basic": {
          "title": "Single Webhook Bridge",
          "price": 150,
          "deliveryDays": 2,
          "revisions": 2,
          "description": "Connect 2 apps via custom webhook with data formatting and instant trigger verification.",
          "features": [
            "2 App Connection",
            "Custom Webhook Trigger",
            "Data Formatting & Mapping",
            "Error Notification Setup",
            "Deployment Runbook"
          ]
        },
        "standard": {
          "title": "Bi-Directional Pipeline",
          "price": 350,
          "deliveryDays": 4,
          "revisions": 3,
          "description": "Two-way automated sync between CRM, Google Workspace, payment gateway, and Telegram alerts.",
          "features": [
            "Bi-Directional Data Sync",
            "Google Apps Script Bridge",
            "Retry Queues & Fallbacks",
            "Rate Limit Protection",
            "14 Days Support"
          ]
        },
        "premium": {
          "title": "Multi-System Middleware",
          "price": 700,
          "deliveryDays": 7,
          "revisions": "Unlimited",
          "description": "Full custom Node.js middleware orchestrating 4+ business tools with database logging, auth, and monitoring.",
          "features": [
            "Multi-Tool Orchestration",
            "Database Audit Logging",
            "Automated Error Recovery",
            "Secure Secrets Vault",
            "30 Days SLA Warranty"
          ]
        }
      },
      "description": "Are your business software tools trapped in separate silos, forcing your team to manually copy and paste data between forms, spreadsheets, and CRMs? We build custom, rock-solid API bridges and webhook middleware that connect your applications automatically with zero manual effort.\n\nWhat We Integrate:\n• Google Workspace automations using custom Google Apps Script and Gemini AI\n• Payment gateways (Stripe, SSLCommerz, PayPal) connected to invoice databases\n• Lead capture forms triggering instant Telegram bot and WhatsApp team alerts\n• CRMs and databases syncing customer records in real time\n• Custom REST API microservices with automated retry queues\n\nWhy Custom Code Over Expensive Subscription Tools:\nThird-party subscription connectors charge hefty monthly fees and frequently fail when payload structures change. We build lightweight, serverless Node.js and Google Apps Script integrations you own forever with zero recurring fees.\n\nTech Stack:\nNode.js, Express, Google Apps Script, Supabase, and Webhooks.\n\nMessage us with the two tools you need connected to get a rapid integration plan!",
      "faq": [
        {
          "q": "What tools or platforms can you integrate?",
          "a": "Any service with a REST API, webhook support, or Google Workspace ecosystem can be seamlessly connected."
        },
        {
          "q": "What happens if an API endpoint temporarily goes down?",
          "a": "We build automated retry queues and error notification handlers so no data payloads are ever lost."
        },
        {
          "q": "Do I have to pay recurring monthly subscription fees?",
          "a": "No, we build custom serverless code hosted on free cloud tiers or within your Google Workspace."
        },
        {
          "q": "Will you provide documentation on how the integration works?",
          "a": "Yes, every delivery comes with clear technical documentation and endpoint runbooks."
        }
      ],
      "buyerRequirements": [
        "Which two or more applications do you need connected?",
        "What exact event should trigger the integration (e.g. New lead form submit, payment completed)?",
        "Do you have API keys or administrative access for both platforms?"
      ],
      "thumbnailBrief": {
        "headline": "CUSTOM API & WEBHOOK BRIDGE",
        "subheading": "CONNECT ANY 2 APPS · ZERO RECURRING FEES",
        "colorPalette": [
          "#10B981",
          "#3B82F6",
          "#09090B"
        ],
        "visualStyle": "Diagram showing data nodes flowing smoothly between webhooks, Google Workspace, and Telegram.",
        "badgeText": "⚡ ZERO RECURRING FEES",
        "layoutAdvice": "Clean connecting arrows between popular tech icons with bold green headline signifying active automation."
      },
      "healthCheck": {
        "score": 10,
        "passed": true,
        "checks": [
          {
            "rule": "Title starts with 'I will'",
            "passed": true,
            "message": "Valid title format."
          },
          {
            "rule": "Title length between 25-80 chars",
            "passed": true,
            "message": "Title is 65 chars."
          },
          {
            "rule": "Exactly 5 keyword search tags (<= 20 chars each)",
            "passed": true,
            "message": "5 valid keyword tags provided."
          },
          {
            "rule": "Description length between 800-1250 chars",
            "passed": true,
            "message": "Description length: 1097 chars."
          },
          {
            "rule": "No pricing amounts in description body",
            "passed": true,
            "message": "No dollar amounts in description body."
          },
          {
            "rule": "No competitor platform mentions",
            "passed": true,
            "message": "Compliant with marketplace TOS."
          },
          {
            "rule": "At least 4 comprehensive FAQs",
            "passed": true,
            "message": "4 detailed FAQ pairs provided."
          },
          {
            "rule": "Rapid delivery turnaround (Basic tier <= 5 days)",
            "passed": true,
            "message": "Basic tier turnaround: 2 day(s)."
          },
          {
            "rule": "At least 3 clear buyer onboarding requirements",
            "passed": true,
            "message": "3 onboarding requirements provided."
          },
          {
            "rule": "Verified GRO10X capability stack only",
            "passed": true,
            "message": "All referenced tools are within verified stack."
          }
        ]
      },
      "status": "Generated",
      "liveUrl": "",
      "updatedAt": "2026-08-30T19:35:58.445Z",
      "titleBody": "connect your apps with a custom API or webhook integration",
      "pricingMatrix": {
        "screens": {
          "basic": 1,
          "standard": 2,
          "premium": 4
        },
        "apis": {
          "basic": 2,
          "standard": 4,
          "premium": 8
        },
        "checkboxes": {
          "database": [
            true,
            true,
            true
          ],
          "auth": [
            true,
            true,
            true
          ],
          "seo": [
            false,
            false,
            false
          ],
          "analytics": [
            false,
            true,
            true
          ],
          "payment": [
            false,
            true,
            true
          ],
          "hosting": [
            true,
            true,
            true
          ],
          "admin": [
            true,
            true,
            true
          ],
          "securityAudit": [
            true,
            true,
            true
          ]
        }
      },
      "galleryPrompts": {
        "videoScenes": [
          "Scene 1 (0-10s) Hook: Data trapped in separate isolated software silos causing repetitive manual copy-pasting and human error.",
          "Scene 2 (10-20s) Custom Bridge: High-speed glowing digital bridge connecting two software platforms instantly with Node.js and REST webhooks.",
          "Scene 3 (20-30s) Form Trigger: Customer submitting lead on web form, instantly creating record in database, generating invoice, and sending Telegram ping.",
          "Scene 4 (30-40s) Google Workspace Sync: Custom Google Apps Script running automated sheet calculations, Gemini summary, and email dispatch.",
          "Scene 5 (40-50s) Error Handling & Retries: Automated retry queue handling network blips smoothly with zero data loss.",
          "Scene 6 (50-60s) Zero Subscription: Visual comparing expensive third-party Zapier bills versus  monthly custom code ownership.",
          "Scene 7 (60-70s) CTA: High-tech network visualization: CUSTOM API & WEBHOOK INTEGRATIONS - CONNECT YOUR APPS SEAMLESSLY."
        ],
        "imagePrompts": [
          "Image 1 (Hero Thumbnail 1280x769): Glowing network graph on dark slate background, bold typography: CUSTOM API & WEBHOOK INTEGRATIONS, visual icons of Google Workspace, Supabase, Stripe, and Telegram connecting smoothly.",
          "Image 2 (Integration Matrix Slide): Visual comparison table: 100% Source Code Ownership, Zero Recurring Monthly Subscription Fees, High-Frequency Webhook Speed.",
          "Image 3 (Workflow Automation Pipeline): Step-by-step diagram: Webhook Event Ingestion -> Payload Validation -> Database Upsert -> Automated Alert Dispatch."
        ],
        "pdfPrompts": [
          "PDF 1 (Custom Middleware Architecture & Zero-Fee Automation Blueprint): Write a 2-page technical guide contrasting custom Node.js/Apps Script webhook middleware against costly SaaS subscription tools, highlighting latency advantages, security, and cost savings.",
          "PDF 2 (API Integration Discovery & Payload Mapping Spec): Generate a structured client scoping worksheet for documenting API endpoints, JSON payload schemas, authentication methods (OAuth/API Keys), and webhook trigger events."
        ]
      }
    },
    {
      "id": "GIG-TECH-007",
      "accountId": "ACC-TECH-001",
      "serviceId": "SVC-006",
      "category": "business-ai",
      "platform": "fiverr",
      "gigIndex": 7,
      "title": "I will audit your business workflow and deliver a custom AI roadmap",
      "categorySelection": {
        "primary": "Business",
        "sub": "AI Strategy & Consulting",
        "serviceType": "AI Consulting & Roadmaps"
      },
      "tags": [
        "ai consulting",
        "workflow audit",
        "ai roadmap",
        "business automation",
        "tech strategy"
      ],
      "pricing": {
        "basic": {
          "title": "Written AI Audit",
          "price": 120,
          "deliveryDays": 2,
          "revisions": 1,
          "description": "Comprehensive written 5-page operational audit identifying top 3 highest-ROI automation opportunities.",
          "features": [
            "5-Page Custom Audit Report",
            "Bottleneck Identification",
            "Top 3 AI Tool Recommendations",
            "Estimated ROI & Time Savings"
          ]
        },
        "standard": {
          "title": "Audit + Strategy Session",
          "price": 250,
          "deliveryDays": 3,
          "revisions": 2,
          "description": "Full written transformation roadmap plus 45-minute 1-on-1 Zoom advisory call and prompt handbook.",
          "features": [
            "10-Page Transformation Blueprint",
            "45-Minute 1-on-1 Video Call",
            "Custom Prompt Kit Handbook",
            "Implementation Checklist",
            "7 Days Q&A Follow-up"
          ]
        },
        "premium": {
          "title": "Full Agency AI Roadmap",
          "price": 500,
          "deliveryDays": 5,
          "revisions": "Unlimited",
          "description": "End-to-end multi-department operational AI blueprint, tech stack selection matrix, and 2 advisory strategy sessions.",
          "features": [
            "20-Page Comprehensive Playbook",
            "2 x 45-Min Advisory Calls",
            "Architecture Blueprints",
            "Vendor Selection Matrix",
            "14 Days Ongoing Q&A Support"
          ]
        }
      },
      "description": "Curious about how modern AI tools can cut operational costs and speed up your team, but overwhelmed by hype and technical jargon? Most business owners waste thousands on the wrong software tools that their employees never actually adopt. We deliver practical, executive-level AI audits and implementation roadmaps tailored to your exact business.\n\nWhat You Receive:\n• Deep-dive operational bottleneck audit across your sales, delivery, and administration\n• Prioritized, step-by-step implementation matrix showing fastest-ROI automations\n• Curated tool stack recommendations matching your actual team skill level\n• Actionable prompt handbook and workflow templates you can use immediately\n• Direct 1-on-1 advisory strategy session addressing your specific questions\n\nWhy Work With Us:\nWe do not offer generic theoretical advice. We run our own high-output agency using automated AI pipelines and cloud workflows. You get tested, battle-hardened strategies that cut manual work and multiply team capacity.\n\nReady to scale your business with modern AI? Message us today to book your audit!",
      "faq": [
        {
          "q": "What information do I need to prepare before the audit?",
          "a": "Just a brief list of your current software tools, repetitive team tasks, and your primary operational goals for the quarter."
        },
        {
          "q": "Is this audit suitable for non-technical business owners?",
          "a": "Yes! All recommendations are written in clear, non-technical executive language with step-by-step action items."
        },
        {
          "q": "How is the 1-on-1 strategy call conducted?",
          "a": "We host a live video session via Zoom or Google Meet with screen sharing and deliver the recording afterward."
        },
        {
          "q": "Can you also help build the automations after the audit?",
          "a": "Yes, our engineering team can directly execute the recommended roadmap through our dedicated development services."
        }
      ],
      "buyerRequirements": [
        "What is your company industry and team size?",
        "What software tools do you currently use (e.g. Gmail, Excel, WhatsApp, CRM)?",
        "What is the single most time-consuming repetitive task in your business today?"
      ],
      "thumbnailBrief": {
        "headline": "AI BUSINESS WORKFLOW AUDIT",
        "subheading": "EXECUTIVE ROADMAP · CUT 20+ HOURS OVERHEAD",
        "colorPalette": [
          "#F59E0B",
          "#10B981",
          "#09090B"
        ],
        "visualStyle": "Executive consulting diagram displaying business workflow optimization stages and ROI growth metrics.",
        "badgeText": "🧭 ACTIONABLE IMPLEMENTATION ROADMAP",
        "layoutAdvice": "Professional gold and emerald green styling with clear roadmap icon highlights."
      },
      "healthCheck": {
        "score": 10,
        "passed": true,
        "checks": [
          {
            "rule": "Title starts with 'I will'",
            "passed": true,
            "message": "Valid title format."
          },
          {
            "rule": "Title length between 25-80 chars",
            "passed": true,
            "message": "Title is 67 chars."
          },
          {
            "rule": "Exactly 5 keyword search tags (<= 20 chars each)",
            "passed": true,
            "message": "5 valid keyword tags provided."
          },
          {
            "rule": "Description length between 800-1250 chars",
            "passed": true,
            "message": "Description length: 1086 chars."
          },
          {
            "rule": "No pricing amounts in description body",
            "passed": true,
            "message": "No dollar amounts in description body."
          },
          {
            "rule": "No competitor platform mentions",
            "passed": true,
            "message": "Compliant with marketplace TOS."
          },
          {
            "rule": "At least 4 comprehensive FAQs",
            "passed": true,
            "message": "4 detailed FAQ pairs provided."
          },
          {
            "rule": "Rapid delivery turnaround (Basic tier <= 5 days)",
            "passed": true,
            "message": "Basic tier turnaround: 2 day(s)."
          },
          {
            "rule": "At least 3 clear buyer onboarding requirements",
            "passed": true,
            "message": "3 onboarding requirements provided."
          },
          {
            "rule": "Verified GRO10X capability stack only",
            "passed": true,
            "message": "All referenced tools are within verified stack."
          }
        ]
      },
      "status": "Generated",
      "liveUrl": "",
      "updatedAt": "2026-08-30T19:35:58.445Z",
      "titleBody": "audit your business workflow and deliver a custom AI roadmap",
      "pricingMatrix": {
        "screens": {
          "basic": 1,
          "standard": 2,
          "premium": 4
        },
        "apis": {
          "basic": 0,
          "standard": 1,
          "premium": 2
        },
        "checkboxes": {
          "database": [
            false,
            false,
            true
          ],
          "auth": [
            false,
            false,
            false
          ],
          "seo": [
            false,
            false,
            false
          ],
          "analytics": [
            true,
            true,
            true
          ],
          "payment": [
            false,
            false,
            false
          ],
          "hosting": [
            false,
            false,
            false
          ],
          "admin": [
            false,
            false,
            true
          ],
          "securityAudit": [
            true,
            true,
            true
          ]
        }
      },
      "galleryPrompts": {
        "videoScenes": [
          "Scene 1 (0-10s) Hook: Confused business owner reading buzzwords about AI without knowing how to actually apply it profitably.",
          "Scene 2 (10-20s) Diagnosis: Expert diagnostic scan highlighting operational friction points across customer service, sales, and internal reporting.",
          "Scene 3 (20-30s) ROI Matrix: Prioritized 3D matrix sorting automation opportunities by High Impact vs Low Effort for rapid payback.",
          "Scene 4 (30-40s) Tool Stack Curation: Tailored selection of practical tools: Google Workspace, Gemini AI, Supabase, and Telegram Bot systems.",
          "Scene 5 (40-50s) Step-by-Step Roadmap: Clear Gantt chart showing 30-day, 60-day, and 90-day execution milestones with measurable KPIs.",
          "Scene 6 (50-60s) Strategic Deliverables: Executive PDF briefing, custom prompt library, and 1-on-1 strategy advisory call recording.",
          "Scene 7 (60-70s) CTA: High impact executive closing slide: ACTIONABLE AI WORKFLOW AUDIT & ROADMAP - SCHEDULE YOUR STRATEGY SESSION."
        ],
        "imagePrompts": [
          "Image 1 (Hero Thumbnail 1280x769): Sleek dark minimalist executive design with warm amber and emerald accents, bold text: ACTIONABLE AI WORKFLOW AUDIT & ROADMAP, 3D holographic roadmap timeline with milestone badges.",
          "Image 2 (Audit Deliverables Overview Slide): Infographic showcasing 5 core deliverables: Bottleneck Analysis, ROI Priority Matrix, Curated Tech Stack, Custom Prompt Library, 1-on-1 Strategy Call.",
          "Image 3 (ROI Impact Timeline): Visual 3-phase implementation roadmap illustrating Month 1 Quick Wins, Month 2 Workflow Automation, Month 3 Full OS Deployment."
        ],
        "pdfPrompts": [
          "PDF 1 (Executive AI Strategy & Operational Efficiency Framework): Produce a 2-page high-level whitepaper outlining the GRO10X AI maturity framework for SMBs, ROI measurement benchmarks, and adoption roadmaps.",
          "PDF 2 (Business Process Discovery & Automation Readiness Audit): Create a comprehensive 2-page diagnostic questionnaire covering department task frequencies, manual bottlenecks, data structure readiness, and employee tooling access."
        ]
      }
    }
  ]
};

module.exports = { SEEDED_STATE };
