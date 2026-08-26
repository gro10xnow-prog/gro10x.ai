/**
 * src/routes/brands.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Brand Empire API v1.0
 * 
 * Provides centralized server-side state & Supabase persistence for:
 * 1. 13-Brand Digital Portfolio & Catalog Tracker ($328k ARR engine)
 * 2. Real-time Product Upload Status syncing
 * 3. Automatic Engine 3 Revenue Syncing into 5-Engine Growth Cockpit
 * 4. DBM EOD Standup Logs & Mobile Check-ins
 * 5. 8-Step Store Launch Checklist State
 * 
 * Mounted at: /api/brands
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { readDB, writeDB } = require('../services/db');

// Multer memory storage configuration for Vault uploads (max 50MB)
const vaultUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Default 13-Brand Portfolio Data
const SEED_BRANDS_DATA = {
  brands: [
    {
      id: 1,
      name: 'PlannerQueenCo',
      tagline: 'Plan it. Own it. Live it.',
      niche: 'Productivity & Life Planning',
      type: 'Digital',
      dbmId: 1,
      phase: 'Phase 1 (Week 1–2)',
      etsyStatus: 'In Setup',
      etsyUrl: '',
      target12mo: 24200,
      netTarget: 20579,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'],
      fonts: 'Playfair Display + Lato',
      voice: 'Warm, empowering, practical, motivating',
      categories: ['Daily & Weekly Planners', 'Financial Trackers', 'Goal Setting & Habits', 'Life & Project Mgmt', 'Wellness & Self-Dev', 'Work & Career', 'Bundles', 'Seasonal & Holiday', 'Specialty Niches', 'E-books'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 2,
      name: 'WildMutt Co.',
      tagline: 'Wild at Heart. Loyal to the Bone.',
      niche: 'Pet Lovers (Dogs, Cats, Pets)',
      type: 'POD+Digital',
      dbmId: 2,
      phase: 'Phase 2 (Week 2–4)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 33540,
      netTarget: 18840,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#E85D04', '#1A1A2E', '#F48C06', '#FAA307', '#F5F3EF'],
      fonts: 'Abril Fatface + Plus Jakarta Sans',
      voice: 'Playful, fiercely loyal, witty, emotionally warm',
      categories: ['Custom Pet Portraits', 'Breed Graphic Tees', 'Pet Mugs & Tumblers', 'Pet Memorials', 'Bandanas & Apparel', 'Pet Health E-books', 'Party Printables', 'Breed Bundles', 'Holiday Specials', 'Training Guides'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 3,
      name: 'TinyDesks Studio',
      tagline: 'Big Business Systems for Small Desks.',
      niche: 'B2B Templates & Solo Agency Systems',
      type: 'Digital',
      dbmId: 3,
      phase: 'Phase 2 (Week 2–4)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 22050,
      netTarget: 18630,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#2D6A4F', '#F5F0E8', '#1B4332', '#D8F3DC', '#212529'],
      fonts: 'Syne + Inter',
      voice: 'Sharp, executive, ultra-clean, results-focused',
      categories: ['Canva Social Media Kits', 'Client Proposal Decks', 'Invoice & Contract Packs', 'Notion Client Portals', 'Brand Identity Kits', 'Pricing Calculator Sheets', 'B2B E-books', 'Onboarding SOP Packs', 'Pitch Decks', 'Agency Mega-Bundles'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 4,
      name: 'LittleStarsLearning',
      tagline: 'Big Minds Start with Little Stars.',
      niche: 'Kids Early Education & Homeschool',
      type: 'Digital',
      dbmId: 3,
      phase: 'Phase 3 (Week 4–6)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 17850,
      netTarget: 14800,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#F4A261', '#264653', '#2A9D8F', '#E76F51', '#FFF8F0'],
      fonts: 'Fredoka + Quicksand',
      voice: 'Gentle, enthusiastic, educational, child-safe',
      categories: ['Kindergarten Worksheets', 'Homeschool Curriculum Packs', 'Classroom Decor Printables', 'Montessori Busy Books', 'Sight Words Flashcards', 'Coloring & Activity Books', 'Preschool Math Bundles', 'Phonics Worksheets', 'Reward Charts', 'Parent Starter E-books'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 5,
      name: 'InkWrapped',
      tagline: 'Wrap Your World in Seamless Art.',
      niche: 'Sublimation & Tumbler Craft Files',
      type: 'Digital',
      dbmId: 1,
      phase: 'Phase 2 (Week 2–4)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 20900,
      netTarget: 17590,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#9B2335', '#1C1C1C', '#DFCFBE', '#5B7065', '#FAF7F2'],
      fonts: 'Cinzel Decorative + Montserrat',
      voice: 'Vibrant, crafter-friendly, trend-conscious',
      categories: ['20oz Skinny Tumbler PNGs', '40oz Stanley Style Wraps', 'Seamless Patterns', 'Mug Sublimation Files', 'Seasonal Mega-Bundles', 'Glitter & Marble Textures', 'Floral Wrap Sets', 'Inspirational Quote Wraps', 'Western & Boho PNGs', 'Crafter Business E-books'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 6,
      name: 'CozyThreads™',
      tagline: 'Wear Your Comfort. Live the Aesthetic.',
      niche: 'Cottagecore & Aesthetic POD Apparel',
      type: 'POD',
      dbmId: 2,
      phase: 'Phase 3–4 (Week 6–8)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 23200,
      netTarget: 8657,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#7B9E87', '#F7EDE2', '#F5CAC3', '#84A59D', '#3D405B'],
      fonts: 'Cormorant Garamond + Nunito Sans',
      voice: 'Cozy, nostalgic, gentle, nature-inspired',
      categories: ['Botanical Oversized Hoodies', 'Cottagecore Graphic Tees', 'Wildflower Canvas Totes', 'Embroidered Style Sweatshirts', 'Vintage Bookish Apparel', 'Coffee Lover Sweaters', 'Seasonal Autumn Drops', 'Aesthetic Stickers', 'Lookbook E-books', 'Comfort Bundles'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 7,
      name: 'ProudProfessional',
      tagline: 'Wear What You Achieved.',
      niche: 'Career Pride & Graduation Gifts',
      type: 'POD+Digital',
      dbmId: 2,
      phase: 'Phase 4 (Week 6–8)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 20650,
      netTarget: 9647,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#1E3A5F', '#C9A84C', '#EAEAEA', '#0B1D3A', '#FFFFFF'],
      fonts: 'Cinzel + Work Sans',
      voice: 'Dignified, celebratory, empowering, proud',
      categories: ['Nurse & Medical Pride Mugs', 'Teacher Appreciation Apparel', 'Engineer & Tech Hoodies', 'Graduation Printable Suites', 'Resume & CV Templates', 'Interview Playbook E-books', 'Desk Nameplate Prints', 'Office Wall Art', 'Milestone Bundles', 'Retirement Gifts'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 8,
      name: 'FiestaFoundry',
      tagline: 'Celebrate Every Milestone in Style.',
      niche: 'Events, Celebrations & Invitation Suites',
      type: 'Digital',
      dbmId: 1,
      phase: 'Phase 3 (Week 4–6)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 21250,
      netTarget: 17909,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#E63946', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'],
      fonts: 'Playfair Display + Montserrat',
      voice: 'Festive, elegant, welcoming, joy-sparking',
      categories: ['Editable Wedding Suites', 'Baby Shower Game Packs', 'Birthday Invitation Bundles', 'Bachelorette Itineraries', 'Graduation Announcements', 'Holiday Party Kits', 'Dinner Menu Templates', 'Seating Chart Posters', 'DIY Party Guide E-books', 'Custom Invitation Services'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 9,
      name: 'ZenWallCo',
      tagline: 'Art That Brings Peace to Your Space.',
      niche: 'Printable Wall Art & Modern Home Décor',
      type: 'Digital',
      dbmId: 3,
      phase: 'Phase 4 (Week 6–8)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 19100,
      netTarget: 15964,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#4A7C59', '#F8F4F0', '#365340', '#D6CEBE', '#1E2522'],
      fonts: 'Tenor Sans + Plus Jakarta Sans',
      voice: 'Serene, minimalist, sophisticated, grounding',
      categories: ['Minimalist Line Art Sets', 'Botanical Gallery Wall Prints', 'Japandi & Neutral Art', 'Typography Affirmation Sets', 'Mid-Century Modern Art', 'Kids Room Boho Prints', 'Architecture Sketch Sets', 'Printable Frame Mockups', 'Interior Styling E-books', 'Full Gallery Room Bundles'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 10,
      name: 'SparkSVG',
      tagline: 'Precision Cut Files for Maker Magic.',
      niche: 'SVG Cut Files for Cricut & Laser Cutters',
      type: 'Digital',
      dbmId: 4,
      phase: 'Phase 2 (Week 2–4)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 26400,
      netTarget: 22569,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#FF6B35', '#1A1A2E', '#F7C59F', '#004E89', '#EFEFD0'],
      fonts: 'Righteous + Outfit',
      voice: 'Maker-centric, energetic, precise, creative',
      categories: ['Holiday Cut File Bundles', 'Monogram Alphabet SVGs', 'Laser Cut 3D Wood Files', 'Funny Craft Quote SVGs', 'Sticker Sheet Cut Files', 'T-Shirt Decal Designs', 'Earring Pattern SVGs', 'Doormat Stencil Files', 'Cricut Mastery E-books', 'Maker Mega-Vaults'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 11,
      name: 'PageForge Publishing',
      tagline: 'Compounding Knowledge on Amazon KDP.',
      niche: 'Amazon KDP Non-Fiction & Low-Content Books',
      type: 'KDP',
      dbmId: 4,
      phase: 'Phase 1 (Week 1–2)',
      etsyStatus: 'In Setup',
      etsyUrl: '',
      target12mo: 33716,
      netTarget: 32786,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#2C3E50', '#E8D5B7', '#8E44AD', '#34495E', '#ECF0F1'],
      fonts: 'Merriweather + Lato',
      voice: 'Authoritative, clear, insightful, evergreen',
      categories: ['Productivity Workbooks', 'Self-Care Guided Journals', 'Niche Career Logbooks', 'Personal Finance Handbooks', 'ADHD Daily Workbooks', 'Habit Tracking Journals', 'Homeschool Lesson Planners', 'Grief & Healing Journals', 'Fitness Logbooks', 'Solopreneur Strategy Guides'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 12,
      name: 'LetterLab Fonts',
      tagline: 'Distinctive Typography for Modern Brands.',
      niche: 'Commercial Font Bundles & Handwritten Scripts',
      type: 'Digital',
      dbmId: 4,
      phase: 'Phase 3 (Week 4–6)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 20750,
      netTarget: 17891,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#5B4FCF', '#F0EFF4', '#1E1B3A', '#9D95FF', '#F9F871'],
      fonts: 'Cabinet Grotesk + Inter',
      voice: 'Contemporary, bespoke, design-forward, bold',
      categories: ['Handwritten Script Fonts', 'Modern Serif Duos', 'Retro 70s Display Fonts', 'Cricut Compatible Alphabets', 'Editorial Sans Serifs', 'Calligraphy Wedding Fonts', 'Bold Streetwear Fonts', 'Signature Stamp Fonts', 'Font Pairing Guides', 'Full Commercial Mega-Packs'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 13,
      name: 'PromptVault',
      tagline: 'Unfair AI Advantage Packaged into Systems.',
      niche: 'Professional AI Prompt Systems & Notion Vaults',
      type: 'Digital',
      dbmId: 4,
      phase: 'Phase 1 (Week 1–2)',
      etsyStatus: 'In Setup',
      etsyUrl: '',
      target12mo: 74560,
      netTarget: 65384,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#00DF89', '#070B12', '#06B6D4', '#1E293B', '#F8FAFC'],
      fonts: 'Space Grotesk + Plus Jakarta Sans',
      voice: 'Futuristic, hyper-optimized, actionable, elite',
      categories: ['Midjourney Photorealism Vaults', 'ChatGPT Executive Prompts', 'Etsy Seller AI Growth Kits', 'Copywriting Matrix Chains', 'ComfyUI Architecture Guides', 'SEO Programmatic Prompts', 'Social Media Generator Hubs', 'Developer Coding Assistant Vaults', 'Notion Operating Hubs', 'Lifetime Flagship All-Access Vault'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    }
  ],
  dbms: [
    {
      id: 1,
      name: 'DBM 1',
      title: 'Digital Products Specialist',
      assignedBrands: [1, 5, 8],
      todayUploads: 0,
      weeklyUploads: 0,
      status: 'Active',
      contact: '@dbm1_gro10x'
    },
    {
      id: 2,
      name: 'DBM 2',
      title: 'POD & Mixed Products Lead',
      assignedBrands: [2, 6, 7],
      todayUploads: 0,
      weeklyUploads: 0,
      status: 'Active',
      contact: '@dbm2_gro10x'
    },
    {
      id: 3,
      name: 'DBM 3',
      title: 'B2B & Education Products Lead',
      assignedBrands: [3, 4, 9],
      todayUploads: 0,
      weeklyUploads: 0,
      status: 'Active',
      contact: '@dbm3_gro10x'
    },
    {
      id: 4,
      name: 'DBM 4',
      title: 'Tech, Fonts & AI Vaults Lead',
      assignedBrands: [10, 11, 12, 13],
      todayUploads: 0,
      weeklyUploads: 0,
      status: 'Active',
      contact: '@dbm4_gro10x'
    }
  ],
  productsCatalog: {},
  monthlyLogs: []
};

const PLANNER_QUEEN_TITLES = {
  1: "Daily & Weekly Planners #1 — PlannerQueenCo Style",
  2: "Executive Work-Life Balance & Top-3 Priority Matrix Weekly Planner",
  3: "ADHD-Friendly Low-Dopamine & Low-Friction Daily Task Planner",
  4: "Teacher & Student Weekly Academic Lesson & Study Planner",
  5: "Busy Mom Household & Family Command Center Weekly Spread",
  6: "Wellness, Fitness & Daily Meal Prep Schedule Planner",
  7: "Solopreneur 90-Day Quarterly Sprint Execution Daily Planner",
  8: "Mindful Morning & Evening Routine Reflection Journal",
  9: "Undated Minimalist 365-Day Digital GoodNotes Tablet Planner",
  10: "The Master Life Management All-Inclusive Daily & Weekly Mega Bundle",
  11: "Zero-Based Budgeting & Monthly Cash Flow Master Spread",
  12: "50/30/20 Rule Annual Income & Expense Ledger",
  13: "Debt Snowball & Avalanche Payoff Visual Progress Thermometer",
  14: "No-Spend Challenge & Impulse Purchase Cooling Tracker",
  15: "Sinking Funds & Emergency Savings Milestones Visual Log",
  16: "Bi-Weekly Paycheck Budget & Fixed Bill Payment Calendar",
  17: "Small Business & Freelancer Tax Prep & Revenue Expense Sheet",
  18: "Subscription & Membership Recurring Fee Audit Dashboard",
  19: "Net Worth & Investment Growth Tracker (Quarterly Check-In)",
  20: "Ultimate Financial Freedom & Budgeting Mastery Flagship Toolkit",
  21: "30-Day Circular Habit Matrix & Streak Gamification Tracker",
  22: "Atomic Routine Builder & Habit Stacking Daily Blueprint",
  23: "Vision Board & 12-Month Life Wheel Goal Architecture Sheet",
  24: "Quarterly OKR & High-Impact Needle Mover Action Plan",
  25: "100-Day Discipline Challenge Tracker with Milestone Rewards",
  26: "Daily Micro-Habits & Identity Shift Habit Scorecard",
  27: "Morning Manifestation & Evening Wins Habit Anchor Journal",
  28: "Annual Level 10 Life Assessment & Gap Analysis Matrix",
  29: "Goal Breakdown Roadmap: From Big Vision to Weekly Sprints",
  30: "Complete Goal Mastery & Habit Transformation Power System",
  31: "Home Organizing & Room-by-Room Decluttering Action Checklist",
  32: "Moving House & Relocation Master Logistics & Box Inventory",
  33: "Event & Birthday Party Planning Master Coordinator Spread",
  34: "Vehicle Maintenance, Insurance & Service Log Book",
  35: "Medical History, Symptom & Family Health Record Keeper",
  36: "Home Renovation, Contractor & Material Budget Project Planner",
  37: "Pet Care, Vaccination, Vet Visit & Grooming Schedule",
  38: "Emergency Preparedness & Family Document Vault Index",
  39: "Garden Planning, Planting Calendar & Yard Care Schedule",
  40: "Ultimate Home & Life Operations Executive Binder System",
  41: "Daily Gratitude & Emotional Well-Being 5-Minute Reflection Journal",
  42: "Sleep Optimization, Sleep Cycle & Dream Journal Tracker",
  43: "Water Intake, Hydration & Electrolyte 30-Day Tracker",
  44: "Menstrual Cycle, Hormone Syncing & Energy Level Tracker",
  45: "Mental Health, Anxiety Trigger Log & Grounding Technique Sheets",
  46: "Self-Care Menu & 50 Ways to Reset Recharge Planner",
  47: "Daily Affirmations & Confidence Building Thought Reframing Pad",
  48: "Reading List, Book Review & Literature Reflection Journal",
  49: "Meditation, Mindfulness & Breathing Exercise Session Log",
  50: "Holistic Mind-Body Wellness & Self-Care Master Sanctuary Kit",
  51: "Job Search Pipeline, Interview Prep & Application Follow-Up CRM",
  52: "Meeting Notes, Action Item Triage & Follow-Up Tracker",
  53: "Weekly 1-on-1 Performance Review & Goal Alignment Agenda",
  54: "Professional Skill Development & Continuing Education Tracker",
  55: "Quarterly Business Review & Promotion Portfolio Builder",
  56: "Workplace Boundary & Time Protection Priority Matrix",
  57: "Freelance Client Project Delivery & Milestone Tracker",
  58: "Content Creator Weekly Batch Recording & Publishing Pipeline",
  59: "Networking & Professional Contact Rolodex Tracker",
  60: "Executive Career Acceleration & Professional Growth Toolkit",
  61: "Productivity Essentials Starter Bundle (Daily, Habits & Goals)",
  62: "Financial Glow-Up Bundle (Cash Flow, Debt Snowball & Savings)",
  63: "Mindful Living Sanctuary Bundle (Wellness, Gratitude & Self-Care)",
  64: "Home Harmony Management Bundle (Declutter, Meal Prep & Cleaning)",
  65: "Student Success & Academic Excellence Digital Bundle",
  66: "Working Mom Super-Organizer Digital Planner Bundle",
  67: "Solopreneur All-in-One Operations & Goal Sprint Bundle",
  68: "Health, Fitness & Habit Transformation Trio Bundle",
  69: "Ultimate GoodNotes Digital iPad Planner & Sticker Mega Pack",
  70: "The Entire PlannerQueenCo Empire All-Access Vault Bundle",
  71: "Christmas & Holiday Master Planner (Budget, Gifts, Menu & Traditions)",
  72: "Thanksgiving & Autumn Gathering Host Kit (Cooking Timeline & Guests)",
  73: "Halloween Party, Costume Project & Trick-or-Treat Organizer",
  74: "New Year Goal Reset & 365-Day Vision Quest Planner",
  75: "Valentine's & Self-Love 30-Day Intentional Journal",
  76: "Spring Cleaning & Home Refresh Chore System & Declutter Matrix",
  77: "Summer Family Vacation & Road Trip Itinerary Planner",
  78: "Back-to-School & Family Academic Command Center Pack",
  79: "Easter & Spring Celebration Family Event Guide & Brunch Plan",
  80: "Ultimate 4-Season All-in-One Holiday Master System",
  81: "Wedding Planning Master Binder (Budget, Timeline, Vendor Checklist)",
  82: "Pregnancy & Baby Milestone Week-by-Week Memory Journal",
  83: "Fitness Workout Log, Weight Training & PR Tracker",
  84: "Plant Care, Propagation & Indoor Botanical Growth Log",
  85: "Travel & Backpacking Itinerary, Packing List & Expense Journal",
  86: "Recipe Book, Family Heirloom Cookbook & Meal Master",
  87: "Home Buying, Mortgage Prep & Property Tour Evaluation Sheet",
  88: "Craft & Knitting Project Queue, Materials & Sizing Planner",
  89: "Skincare Routine, Product Expiry & Skin Reaction Tracker",
  90: "Specialty Life Milestones Master Digital Sanctuary Bundle",
  91: "The Intentional Life: A Beginner's Guide to Time-Blocking (E-book)",
  92: "Mastering Money: Debt-Free Living in 12 Months (E-book)",
  93: "Habit Psychology: The Science of Automatic Discipline (E-book)",
  94: "Clutter-Free Sanctuary: Room-by-Room Home Transformation (E-book)",
  95: "The Mindful Morning: 7 Rituals That Change Your Life (E-book)",
  96: "Overcoming Procrastination: The 5-Minute Action Method (E-book)",
  97: "The High-Impact Solopreneur: Systems for 20-Hour Workweeks (E-book)",
  98: "Meal Prep Mastery: Healthy Family Dinners in 30 Mins (E-book)",
  99: "Digital Planning Masterclass: GoodNotes & Tablet Guide (E-book)",
  100: "The Complete PlannerQueenCo Self-Mastery E-book Library Box Set"
};

function generateDefaultProductsForBrand(brand) {
  const list = [];
  const cats = brand.categories || ['Core Planners', 'Trackers', 'Bundles', 'E-books'];

  cats.forEach((cat, cIdx) => {
    for (let i = 1; i <= 10; i++) {
      const prodNum = cIdx * 10 + i;
      const isHero = (i === 1 || i === 2);
      const isFlagship = (i === 10);
      
      let productName = `${cat} #${i} — ${brand.name} Style`;
      if (brand.id === 1 && PLANNER_QUEEN_TITLES[prodNum]) {
        productName = PLANNER_QUEEN_TITLES[prodNum];
      }

      list.push({
        code: `${brand.name.substring(0, 3).toUpperCase()}-${prodNum.toString().padStart(2, '0')}`,
        name: productName,
        category: cat,
        format: (brand.type && brand.type.includes('POD')) ? (i % 2 === 0 ? 'POD T-Shirt' : 'Digital ZIP') : (prodNum >= 91 && brand.id === 1 ? 'PDF E-book' : 'Digital PDF'),
        price: (brand.type && brand.type.includes('POD')) ? (i % 2 === 0 ? 28 : 12) : (isFlagship ? 24 : (isHero ? 8.99 : 7.49)),
        status: 'Draft',
        hero: isHero
      });
    }
  });
  return list;
}

// Pre-populate 100 products for each brand
SEED_BRANDS_DATA.brands.forEach(b => {
  SEED_BRANDS_DATA.productsCatalog[b.id] = generateDefaultProductsForBrand(b);
});

// In-memory fallback initialized with full catalog
let memoryBrandsState = JSON.parse(JSON.stringify(SEED_BRANDS_DATA));
let memoryDbmLogs = [
  { date: new Date().toISOString().split('T')[0], dbmId: 1, brandName: 'PlannerQueenCo', listed: 8, revenue: 0, notes: 'Completed Batch 1 Hero daily & weekly planners' },
  { date: new Date().toISOString().split('T')[0], dbmId: 4, brandName: 'PromptVault', listed: 10, revenue: 0, notes: 'Configured Notion duplication templates for Midjourney prompts' }
];

const fs = require('fs');
const path = require('path');
const STATE_FILE_PATH = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, '../../data/brands_empire_state_test.json')
  : path.join(__dirname, '../../data/brands_empire_state.json');
const DBM_LOGS_FILE_PATH = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, '../../data/dbm_standup_logs_test.json')
  : path.join(__dirname, '../../data/dbm_standup_logs.json');

function getCleanCode(productCode) {
  return String(productCode || 'PROD').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getProductKey(brandId, productCode) {
  return `prd_${brandId}_${getCleanCode(productCode)}`;
}

function getMockupKey(brandId, productCode, rank) {
  return `mkp_${brandId}_${getCleanCode(productCode)}_${Number(rank) || 1}`;
}

// ─── DURABLE SUPABASE KV STORE (custom_fields backed) ────────────────────────
async function dbGet(key) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('custom_fields')
      .select('options')
      .eq('id', key)
      .maybeSingle();
    if (!error && data && data.options !== undefined && data.options !== null) return data.options;
  } catch (e) {}
  return null;
}

async function dbSet(key, value, entityType = 'app_setting') {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('custom_fields').upsert({
      id: key,
      entity_type: entityType,
      name: key,
      field_type: 'json',
      options: value
    }, { onConflict: 'id' });
  } catch (e) {
    console.warn(`[Supabase KV] Error writing ${key}:`, e.message);
  }
}

async function dbList(prefix) {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase.from('custom_fields')
      .select('id, options')
      .like('id', `${prefix}%`);
    if (!error && Array.isArray(data)) {
      return data.map(d => ({ key: d.id, value: d.options })).filter(d => d.value !== undefined && d.value !== null);
    }
  } catch (e) {}
  return [];
}

async function saveProductMockup(brandId, productCode, rank, mockupData) {
  const key = getMockupKey(brandId, productCode, rank);
  await dbSet(key, mockupData, 'mockup');
}

async function loadProductMockups(brandId, productCode) {
  const prefix = `mkp_${brandId}_${getCleanCode(productCode)}_`;
  const items = await dbList(prefix);
  return items.map(d => d.value).filter(Boolean).sort((a, b) => (Number(a.rank) || 0) - (Number(b.rank) || 0));
}

async function saveProductAssets(brandId, productCode, patch) {
  const key = getProductKey(brandId, productCode);
  const existing = (await dbGet(key)) || {};
  const merged = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  await dbSet(key, merged, 'product_asset');
  return merged;
}

async function loadProductAssets(brandId, productCode) {
  const key = getProductKey(brandId, productCode);
  return await dbGet(key);
}

async function loadFullProduct(brandId, productCode) {
  const [assetData, mockups] = await Promise.all([
    loadProductAssets(brandId, productCode),
    loadProductMockups(brandId, productCode)
  ]);

  const baseProd = {
    code: productCode,
    name: `Product ${productCode}`,
    status: 'Draft',
    price: 4.99
  };

  const merged = {
    ...baseProd,
    ...(assetData || {})
  };

  if (Array.isArray(mockups) && mockups.length > 0) {
    merged.mockups = mockups;
    merged.mockupsCount = mockups.length;
    merged.mockupUrls = mockups.map(m => m.url).filter(Boolean);
  }

  return merged;
}

async function loadBrandsState() {
  let state = null;

  // 1. Try Supabase FIRST for brand metadata
  if (isSupabaseConfigured()) {
    try {
      const dbMeta = await dbGet('brands_empire_state');
      if (dbMeta && dbMeta.brands && dbMeta.brands.length > 0) {
        state = dbMeta;
      }
    } catch (e) {
      console.warn('[Brands DB] Supabase state load notice:', e.message);
    }
  }

  // 2. Fallback to disk file if Supabase not ready or brand metadata empty
  if (!state) {
    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const fileData = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
        if (fileData && fileData.brands && fileData.brands.length > 0) {
          state = fileData;
        }
      }
    } catch (e) {
      console.warn('[Brands DB] Disk state load notice:', e.message);
    }
  }

  // 3. Fallback to memory state
  if (!state) {
    state = memoryBrandsState;
  }

  if (!state.productsCatalog) state.productsCatalog = {};
  state.brands.forEach(b => {
    if (!state.productsCatalog[b.id] || state.productsCatalog[b.id].length === 0) {
      state.productsCatalog[b.id] = generateDefaultProductsForBrand(b);
    }
  });

  // 4. Merge live atomic product assets and mockups from Supabase
  if (isSupabaseConfigured()) {
    try {
      const [prdList, mkpList] = await Promise.all([
        dbList('prd_'),
        dbList('mkp_')
      ]);

      const prdMap = {};
      prdList.forEach(row => {
        if (row.key && row.value) prdMap[row.key] = row.value;
      });

      const mkpMap = {};
      mkpList.forEach(row => {
        // key format: mkp_${brandId}_${cleanCode}_${rank}
        const parts = row.key.split('_');
        if (parts.length >= 4) {
          const bId = parts[1];
          const rank = parts[parts.length - 1];
          const pCode = parts.slice(2, parts.length - 1).join('_');
          const groupKey = `${bId}_${pCode}`;
          if (!mkpMap[groupKey]) mkpMap[groupKey] = [];
          mkpMap[groupKey].push(row.value);
        }
      });

      for (const brand of state.brands) {
        const bId = brand.id;
        if (!state.productsCatalog[bId]) state.productsCatalog[bId] = generateDefaultProductsForBrand(brand);
        state.productsCatalog[bId] = state.productsCatalog[bId].map(prod => {
          const cleanCode = getCleanCode(prod.code);
          const prdKey = `prd_${bId}_${cleanCode}`;
          const groupKey = `${bId}_${cleanCode}`;
          const prdAsset = prdMap[prdKey] || {};
          const mockups = (mkpMap[groupKey] || []).filter(Boolean).sort((a, b) => (Number(a.rank) || 0) - (Number(b.rank) || 0));

          const merged = {
            ...prod,
            ...prdAsset
          };
          if (mockups.length > 0) {
            merged.mockups = mockups;
            merged.mockupsCount = mockups.length;
            merged.mockupUrls = mockups.map(m => m.url).filter(Boolean);
          }
          return merged;
        });

        // Dynamically compute live counts and fees from the true merged catalog
        const liveProducts = state.productsCatalog[bId].filter(p => p.status === 'Live');
        brand.productsLive = liveProducts.length;
        brand.totalListingFeesCharged = Number(((brand.totalListingFeesCharged || 0) + (liveProducts.length * 0.20)).toFixed(2));
      }
    } catch (mergeErr) {
      console.warn('[Brands DB] Error merging live assets into catalog:', mergeErr.message);
    }
  }

  memoryBrandsState = state;
  try { fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(memoryBrandsState, null, 2), 'utf8'); } catch (err) {}
  return memoryBrandsState;
}

async function persistBrandsState(state) {
  memoryBrandsState = state;
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Brands DB] File write notice:', e.message);
  }

  if (isSupabaseConfigured()) {
    try {
      await dbSet('brands_empire_state', state, 'brand_state');
    } catch (e) {
      console.warn('[Brands DB] Supabase state persist notice:', e.message);
    }
  }
}

async function loadDbmLogs() {
  if (isSupabaseConfigured()) {
    try {
      const logs = await dbGet('dbm_standup_logs');
      if (logs && Array.isArray(logs)) {
        return logs;
      }
    } catch (e) {
      console.warn('[DBM Logs] Error loading logs:', e.message);
    }
  }
  return memoryDbmLogs;
}

async function persistDbmLogs(logs) {
  memoryDbmLogs = logs;
  if (isSupabaseConfigured()) {
    try {
      await dbSet('dbm_standup_logs', logs, 'dbm_logs');
    } catch (e) {
      console.warn('[DBM Logs] Error persisting logs:', e.message);
    }
  }
}

/**
 * GET /api/brands
 * Returns the entire brand empire state (brands, catalogs, dbms)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const state = await loadBrandsState();
    res.json({ success: true, ...state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/product
 * Updates a product's status and recalculates the brand's live product count
 */
router.post('/:id/product', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { productIdx, status, productData } = req.body;

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    if (!state.productsCatalog[brandId]) {
      state.productsCatalog[brandId] = [];
    }

    if (productIdx !== undefined && state.productsCatalog[brandId][productIdx]) {
      if (status) state.productsCatalog[brandId][productIdx].status = status;
      if (productData) Object.assign(state.productsCatalog[brandId][productIdx], productData);
    } else if (productData) {
      state.productsCatalog[brandId].push(productData);
    }

    // Recalculate brand live count
    brand.productsLive = state.productsCatalog[brandId].filter(p => p.status === 'Live').length;

    await persistBrandsState(state);
    res.json({ success: true, brand, productsLive: brand.productsLive });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/revenue
 * Logs monthly revenue and Ads spend, and automatically syncs to Engine 3 in Growth Cockpit
 */
router.post('/:id/revenue', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { amount, adsSpend, note } = req.body;

    const grossNum = Number(amount) || 0;
    const adsNum = Number(adsSpend) || 0;

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    brand.actualGross = (brand.actualGross || 0) + grossNum;
    brand.actualAds = (brand.actualAds || 0) + adsNum;

    // Record in monthly logs
    state.monthlyLogs.push({
      date: new Date().toISOString(),
      brandId,
      brandName: brand.name,
      amount: grossNum,
      adsSpend: adsNum,
      note: note || 'Monthly settlement'
    });

    await persistBrandsState(state);

    // AUTO-SYNC TO ENGINE 3 in app_settings (for /api/engines/summary)
    if (isSupabaseConfigured() && grossNum > 0) {
      try {
        const { data: curData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'engine_custom_logs')
          .maybeSingle();

        const currentLogs = (curData && curData.value) ? curData.value : {};
        currentLogs.engine3 = (Number(currentLogs.engine3) || 0) + grossNum;

        await supabase.from('app_settings').upsert({
          key: 'engine_custom_logs',
          value: currentLogs,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      } catch (e) {
        console.warn('[Engine 3 Sync] Error updating engine_custom_logs:', e.message);
      }
    }

    res.json({
      success: true,
      brand,
      loggedGross: grossNum,
      loggedAds: adsNum,
      totalBrandGross: brand.actualGross
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/checklist
 * Updates 8-step Store Launch Checklist
 */
router.post('/:id/checklist', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { stepNumber, completed } = req.body;

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    if (!brand.checklist) brand.checklist = {};
    brand.checklist[stepNumber] = !!completed;

    await persistBrandsState(state);
    res.json({ success: true, brandId, checklist: brand.checklist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/settings
 * Updates brand metadata such as Etsy URL, store status
 */
router.post('/:id/settings', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { etsyUrl, etsyStatus, name, tagline } = req.body;

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    if (etsyUrl !== undefined) brand.etsyUrl = etsyUrl;
    if (etsyStatus !== undefined) brand.etsyStatus = etsyStatus;
    if (name !== undefined) brand.name = name;
    if (tagline !== undefined) brand.tagline = tagline;

    await persistBrandsState(state);
    res.json({ success: true, brand });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/brands/dbm-logs
 * Returns all DBM EOD standup reports
 */
router.get('/dbm-logs', requireAuth, async (req, res) => {
  try {
    const logs = await loadDbmLogs();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/dbm-logs
 * Submits a new DBM EOD standup report
 */
router.post('/dbm-logs', requireAuth, async (req, res) => {
  try {
    const { dbmId, brandName, listed, revenue, notes } = req.body;
    if (!dbmId || !brandName) {
      return res.status(400).json({ success: false, error: 'dbmId and brandName are required' });
    }

    const logs = await loadDbmLogs();
    const newEntry = {
      id: 'log_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      dbmId: Number(dbmId),
      brandName,
      listed: Number(listed) || 0,
      revenue: Number(revenue) || 0,
      notes: notes || ''
    };

    logs.unshift(newEntry);
    await persistDbmLogs(logs);

    res.json({ success: true, log: newEntry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/vault/upload
 * Directly uploads deliverable PDF / ZIP into Supabase Storage bucket 'product-vault'
 */
router.post('/:id/vault/upload', requireAuth, vaultUpload.single('file'), async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { productCode, productName, version, canvaTemplateUrl, notionTemplateUrl } = req.body;
    const file = req.file;

    if (!file && !canvaTemplateUrl && !notionTemplateUrl) {
      return res.status(400).json({ success: false, error: 'Please provide a file (PDF/ZIP) or template link' });
    }

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    let storagePath = '';
    let signedDownloadUrl = '';

    if (file) {
      const cleanCode = (productCode || 'PROD').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const ver = (version || '1.0').replace(/[^a-zA-Z0-9._-]/g, '_');
      storagePath = `brands/${brandId}/${cleanCode}/v${ver}/${Date.now()}_${safeFileName}`;

      if (isSupabaseConfigured()) {
        try {
          const { error: uploadError } = await supabase.storage
            .from('product-vault')
            .upload(storagePath, file.buffer, {
              contentType: file.mimetype || 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            console.warn('[Vault Upload] Supabase upload notice:', uploadError.message);
          } else {
            const { data: signedData } = await supabase.storage
              .from('product-vault')
              .createSignedUrl(storagePath, 3600 * 24); // 24 hours
            signedDownloadUrl = signedData?.signedUrl || '';
          }
        } catch (storageErr) {
          console.warn('[Vault Upload] Storage exception:', storageErr.message);
        }
      }
    }

    const vaultData = {
      storagePath: storagePath || (file ? `local/${file.originalname}` : ''),
      fileName: file ? file.originalname : 'Cloud Template',
      fileSizeBytes: file ? file.size : 0,
      fileFormat: file ? (file.mimetype?.includes('pdf') ? 'PDF' : (file.mimetype?.includes('zip') ? 'ZIP' : 'Digital Deliverable')) : 'Cloud Link',
      version: version || '1.0',
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.name || req.user?.empCode || 'DBM',
      canvaTemplateUrl: canvaTemplateUrl || '',
      notionTemplateUrl: notionTemplateUrl || '',
      downloadUrl: signedDownloadUrl
    };

    // Save to atomic product asset key
    await saveProductAssets(brandId, productCode, {
      vault: vaultData,
      status: 'Vault Uploaded'
    });

    // Update in-memory state
    if (!state.productsCatalog) state.productsCatalog = {};
    if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = generateDefaultProductsForBrand(brand);
    let prod = state.productsCatalog[brandId].find(p =>
      (productCode && p.code === productCode) ||
      (productName && p.name === productName)
    );
    if (!prod && productCode) {
      prod = {
        code: productCode,
        name: productName || `Product ${productCode}`,
        category: brand.categories?.[0] || 'General',
        format: 'Digital PDF',
        price: 4.99,
        status: 'Draft'
      };
      state.productsCatalog[brandId].push(prod);
    }
    if (prod) {
      prod.vault = vaultData;
      if (prod.status !== 'Live' && prod.status !== 'Pending Review' && prod.status !== 'Revision Requested') {
        prod.status = 'Vault Uploaded';
      }
    }

    await persistBrandsState(state);

    res.json({
      success: true,
      vault: vaultData,
      brandId,
      productCode: productCode || ''
    });
  } catch (err) {
    console.error('[Vault Upload Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/brands/:id/vault/download
 * Generates fresh 24h signed URL for deliverable asset
 */
router.get('/:id/vault/download', requireAuth, async (req, res) => {
  try {
    const { storagePath } = req.query;
    if (!storagePath) {
      return res.status(400).json({ success: false, error: 'storagePath is required' });
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.storage
        .from('product-vault')
        .createSignedUrl(storagePath, 3600 * 24);

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.json({ success: true, downloadUrl: data.signedUrl, expiresIn: '24h' });
    }

    return res.json({ success: false, error: 'Cloud storage is not active' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/mockups/upload
 * Uploads up to 10 mockup images for a product to Supabase Storage 'product-vault'
 */
router.post('/:id/mockups/upload', requireAuth, vaultUpload.array('mockups', 10), async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { productCode, productName } = req.body;
    const files = req.files || [];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No image files provided. Select up to 10 mockup images (PNG/JPG/WEBP).' });
    }

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    const cleanCode = (productCode || 'PROD').replace(/[^a-zA-Z0-9_-]/g, '_');
    const uploadedMockups = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `brands/${brandId}/${cleanCode}/mockups/${Date.now()}_${i + 1}_${safeFileName}`;
      let signedUrl = '';

      if (isSupabaseConfigured()) {
        try {
          const { error: uploadError } = await supabase.storage
            .from('product-vault')
            .upload(storagePath, file.buffer, {
              contentType: file.mimetype || 'image/jpeg',
              upsert: true
            });

          if (!uploadError) {
            const { data: signedData } = await supabase.storage
              .from('product-vault')
              .createSignedUrl(storagePath, 3600 * 24 * 7); // 7 days
            signedUrl = signedData?.signedUrl || '';
          } else {
            console.warn('[Mockup Upload] Storage notice:', uploadError.message);
          }
        } catch (storageErr) {
          console.warn('[Mockup Storage Exception]:', storageErr.message);
        }
      }

      const item = {
        rank: i + 1,
        fileName: file.originalname,
        fileSizeBytes: file.size,
        contentType: file.mimetype,
        storagePath: storagePath,
        url: signedUrl,
        uploadedAt: new Date().toISOString()
      };

      // Save atomic mockup
      await saveProductMockup(brandId, productCode, i + 1, item);
      uploadedMockups.push(item);
    }

    // Save atomic product assets
    await saveProductAssets(brandId, productCode, {
      mockupsCount: uploadedMockups.length,
      mockupUrls: uploadedMockups.map(m => m.url).filter(Boolean)
    });

    // Update in-memory state
    if (!state.productsCatalog) state.productsCatalog = {};
    if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = generateDefaultProductsForBrand(brand);
    let prod = state.productsCatalog[brandId].find(p =>
      (productCode && p.code === productCode) ||
      (productName && p.name === productName)
    );
    if (prod) {
      prod.mockups = uploadedMockups;
      prod.mockupUrls = uploadedMockups.map(m => m.url).filter(Boolean);
      prod.mockupsCount = uploadedMockups.length;
      if (prod.status !== 'Live' && prod.status !== 'Pending Review' && prod.status !== 'Revision Requested') {
        if (uploadedMockups.length >= 4 && (prod.video?.storagePath || prod.video?.fileName)) {
          prod.status = 'Media Ready';
        }
      }
    }

    await persistBrandsState(state);

    return res.json({
      success: true,
      brandId,
      productCode,
      count: uploadedMockups.length,
      mockups: uploadedMockups
    });
  } catch (err) {
    console.error('[Mockups Upload Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/mockups/upload-single
 * Uploads a single mockup image for a product to Supabase Storage 'product-vault'
 */
router.post('/:id/mockups/upload-single', requireAuth, vaultUpload.single('mockup'), async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { productCode, productName, rank, totalFiles } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    const cleanCode = (productCode || 'PROD').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const rankNum = Number(rank) || 1;
    const storagePath = `brands/${brandId}/${cleanCode}/mockups/${Date.now()}_${rankNum}_${safeFileName}`;
    let signedUrl = '';

    if (isSupabaseConfigured()) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('product-vault')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype || 'image/jpeg',
            upsert: true
          });

        if (!uploadError) {
          const { data: signedData } = await supabase.storage
            .from('product-vault')
            .createSignedUrl(storagePath, 3600 * 24 * 7); // 7 days
          signedUrl = signedData?.signedUrl || '';
        } else {
          console.warn('[Mockup Upload] Storage notice:', uploadError.message);
        }
      } catch (storageErr) {
        console.warn('[Mockup Storage Exception]:', storageErr.message);
      }
    }

    const item = {
      rank: rankNum,
      fileName: file.originalname,
      fileSizeBytes: file.size,
      contentType: file.mimetype,
      storagePath: storagePath,
      url: signedUrl,
      uploadedAt: new Date().toISOString()
    };

    // 1. Save atomic mockup directly to Supabase key mkp_${brandId}_${cleanCode}_${rank}
    await saveProductMockup(brandId, productCode, rankNum, item);

    // 2. Load all current mockups for this product to get fresh count & list
    const currentMockups = await loadProductMockups(brandId, productCode);
    const mCount = currentMockups.length;

    // 3. Save product-level mockups count & status
    await saveProductAssets(brandId, productCode, {
      mockupsCount: mCount,
      mockupUrls: currentMockups.map(m => m.url).filter(Boolean)
    });

    // Update in-memory state
    if (!state.productsCatalog) state.productsCatalog = {};
    if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = generateDefaultProductsForBrand(brand);
    let prod = state.productsCatalog[brandId].find(p =>
      (productCode && p.code === productCode) ||
      (productName && p.name === productName)
    );
    if (!prod && productCode) {
      prod = {
        code: productCode,
        name: productName || `Product ${productCode}`,
        category: brand.categories?.[0] || 'General',
        format: 'Digital PDF',
        price: 4.99,
        status: 'Draft'
      };
      state.productsCatalog[brandId].push(prod);
    }
    if (prod) {
      prod.mockups = currentMockups;
      prod.mockupUrls = currentMockups.map(m => m.url).filter(Boolean);
      prod.mockupsCount = mCount;
      if (prod.status !== 'Live' && prod.status !== 'Pending Review' && prod.status !== 'Revision Requested') {
        if (mCount >= 4 && (prod.video?.storagePath || prod.video?.fileName)) {
          prod.status = 'Media Ready';
        }
      }
    }

    await persistBrandsState(state);

    return res.json({
      success: true,
      brandId,
      productCode,
      mockup: item,
      totalSaved: mCount
    });
  } catch (err) {
    console.error('[Mockup Single Upload Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/products/:code/ai-audit
 * Runs Gemini Multimodal Vision Quality & Dynamic Pricing Audit
 */
router.post('/:id/products/:code/ai-audit', requireAuth, vaultUpload.array('pageImages', 10), async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const productCode = req.params.code;
    const directFiles = req.files || [];

    const state = await loadBrandsState();
    const brand = state.brands?.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    const catalog = state.productsCatalog?.[brandId] || [];
    const prod = catalog.find(p => p.code === productCode) || { code: productCode, name: productCode };

    const { evaluateProductMultimodal } = require('../services/ai-evaluator');

    // Collect audit inputs: direct uploads > Vault Deliverable PDF/file > stored mockups
    let auditInputs = directFiles;
    if (auditInputs.length === 0 && (prod.vault?.storagePath || prod.vault?.downloadUrl)) {
      auditInputs = [{
        storagePath: prod.vault.storagePath,
        url: prod.vault.downloadUrl,
        fileName: prod.vault.fileName,
        fileFormat: prod.vault.fileFormat || 'PDF',
        type: 'vault_deliverable'
      }];
    }
    if (auditInputs.length === 0 && Array.isArray(prod.mockups) && prod.mockups.length > 0) {
      auditInputs = prod.mockups.map(m => m.storagePath || m.url).filter(Boolean);
    }
    if (auditInputs.length === 0 && Array.isArray(prod.mockupUrls) && prod.mockupUrls.length > 0) {
      auditInputs = prod.mockupUrls;
    }

    const auditReport = await evaluateProductMultimodal(auditInputs, prod, brand);

    const suggestedPrice = auditReport.pricing?.recommended_price || 7.49;

    // Save audit & suggested price to atomic product asset
    await saveProductAssets(brandId, productCode, {
      aiAudit: auditReport,
      suggestedPrice: suggestedPrice
    });

    // Save audit into product record & auto-stage suggested price
    prod.aiAudit = auditReport;
    prod.suggestedPrice = suggestedPrice;

    await persistBrandsState(state);

    return res.json({
      success: true,
      brandId,
      productCode,
      audit: auditReport,
      suggestedPrice
    });
  } catch (err) {
    console.error('[AI Audit Route Exception]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/products/:code/apply-price
 * Applies AI Recommended Price to product in catalog & Etsy listing matrix (Admin Only)
 */
router.post('/:id/products/:code/apply-price', requireAuth, requireAdmin, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const productCode = req.params.code;
    const { price } = req.body;

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive price required' });
    }

    const state = await loadBrandsState();
    const brand = state.brands?.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    const catalog = state.productsCatalog?.[brandId] || [];
    const prod = catalog.find(p => p.code === productCode);
    if (!prod) return res.status(404).json({ success: false, error: `Product ${productCode} not found` });

    prod.price = numPrice;
    prod.retailPrice = numPrice;

    await saveProductAssets(brandId, productCode, {
      price: numPrice,
      retailPrice: numPrice
    });

    await persistBrandsState(state);

    return res.json({
      success: true,
      brandId,
      productCode,
      price: numPrice,
      message: `Price updated to $${numPrice.toFixed(2)}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


/**
 * POST /api/brands
 * Creates a new custom brand
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, tagline, niche, type, target12mo, netTarget, palette, fonts, voice, categories, dbmId } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Brand name is required' });

    const state = await loadBrandsState();
    const existingIds = state.brands.map(b => b.id);
    const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

    const newBrand = {
      id: newId,
      name: name.trim(),
      tagline: tagline?.trim() || '',
      niche: niche?.trim() || 'General Digital',
      type: type || 'Digital',
      dbmId: Number(dbmId) || 1,
      phase: 'Phase 1 (Week 1–2)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: Number(target12mo) || 20000,
      netTarget: Number(netTarget) || Math.round((Number(target12mo) || 20000) * 0.85),
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: Array.isArray(palette) && palette.length > 0 ? palette : ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'],
      fonts: fonts || 'Playfair Display + Lato',
      voice: voice || 'Warm, empowering, practical',
      categories: Array.isArray(categories) && categories.length > 0 ? categories : ['Core Planners', 'Trackers', 'Bundles', 'E-books'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    };

    state.brands.push(newBrand);
    if (!state.productsCatalog) state.productsCatalog = {};
    state.productsCatalog[newId] = [];

    await persistBrandsState(state);

    return res.json({ success: true, brand: newBrand, message: `Brand ${newBrand.name} created successfully` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/brands/:id/product/:code
 * Edits product properties (name, category, price, format, seoTitle, seoDescription, seoTags, status)
 */
router.patch('/:id/product/:code', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const productCode = req.params.code;
    const { name, category, price, format, seoTitle, seoDescription, seoTags, status, hero } = req.body;

    const state = await loadBrandsState();
    const brand = state.brands?.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    const catalog = state.productsCatalog?.[brandId] || [];
    const prod = catalog.find(p => p.code === productCode);
    if (!prod) return res.status(404).json({ success: false, error: `Product ${productCode} not found` });

    if (name !== undefined) prod.name = name;
    if (category !== undefined) prod.category = category;
    if (price !== undefined) prod.price = Number(price);
    if (format !== undefined) prod.format = format;
    if (seoTitle !== undefined) prod.seoTitle = seoTitle;
    if (seoDescription !== undefined) prod.seoDescription = seoDescription;
    if (seoTags !== undefined) prod.seoTags = Array.isArray(seoTags) ? seoTags : String(seoTags).split(',').map(s => s.trim());
    if (status !== undefined) prod.status = status;
    if (hero !== undefined) prod.hero = Boolean(hero);

    brand.productsLive = catalog.filter(p => p.status === 'Live').length;
    await persistBrandsState(state);

    return res.json({ success: true, product: prod, message: `Product ${productCode} updated` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/product/:code/studio-save
 * Persists Studio Drawer draft data (Blueprint, Etsy SEO, Pricing, Type, AI Audit) into Supabase state blob
 */
router.post('/:id/product/:code/studio-save', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const productCode = req.params.code;
    const { tab, data, blueprint, seo, pricing, type, aiAudit, vault, mockups, video } = req.body;

    const state = await loadBrandsState();
    let brand = state.brands?.find(b => b.id === brandId);
    if (!brand) brand = state.brands?.[0] || { id: brandId, name: 'Brand', categories: ['General'] };

    if (!state.productsCatalog) state.productsCatalog = {};
    if (!state.productsCatalog[brandId] || state.productsCatalog[brandId].length === 0) {
      state.productsCatalog[brandId] = generateDefaultProductsForBrand(brand);
    }

    let prod = state.productsCatalog[brandId].find(p => p.code === productCode);
    if (!prod) {
      prod = {
        code: productCode,
        name: `Product ${productCode}`,
        category: brand.categories?.[0] || 'General',
        format: 'Digital PDF',
        price: 4.99,
        status: 'Draft'
      };
      state.productsCatalog[brandId].push(prod);
    }

    // 1. Handle tab-based or full-bundle saving
    if (tab === 'blueprint' || blueprint) {
      const bpData = tab === 'blueprint' ? data : blueprint;
      prod.blueprint = { ...(prod.blueprint || {}), ...(bpData || {}) };
    }

    if (tab === 'seo' || seo) {
      const seoData = tab === 'seo' ? data : seo;
      prod.seo = { ...(prod.seo || {}), ...(seoData || {}) };
      if (seoData?.title) prod.seoTitle = seoData.title;
      if (seoData?.description) prod.seoDescription = seoData.description;
      if (seoData?.tags) {
        prod.seoTags = Array.isArray(seoData.tags) 
          ? seoData.tags 
          : String(seoData.tags).split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (tab === 'pricing' || pricing) {
      const priceData = tab === 'pricing' ? data : pricing;
      const retail = Number(priceData?.retailPrice ?? priceData?.price ?? prod.price);
      if (!isNaN(retail) && retail > 0) {
        prod.price = retail;
        prod.retailPrice = retail;
      }
      if (priceData?.costPrice !== undefined) prod.costPrice = Number(priceData.costPrice);
    }

    if (tab === 'audit' || aiAudit) {
      const auditData = tab === 'audit' ? data : aiAudit;
      prod.aiAudit = { ...(prod.aiAudit || {}), ...(auditData || {}) };
      const score = Number(prod.aiAudit.score ?? prod.aiAudit.overallScore ?? 0);
      prod.aiAudit.gateStatus = score >= 70 ? 'passed' : 'failed';
    }

    if (tab === 'type' || type) {
      prod.type = (tab === 'type' ? data?.type : type) || prod.type || 'pdf-planner';
    }

    if (vault) prod.vault = { ...(prod.vault || {}), ...vault };
    if (mockups) {
      prod.mockups = mockups;
      prod.mockupUrls = mockups.map(m => m.url || m).filter(Boolean);
      prod.mockupsCount = mockups.length;
    }
    if (video) prod.video = video;

    // 2. Calculate Studio Progress %
    let progress = 0;
    const hasBlueprint = Boolean(prod.blueprint && (prod.blueprint.geometry || prod.blueprint.prompt || prod.blueprint.canvaPrompt || prod.blueprint.pages));
    const hasSEO = Boolean((prod.seo?.title || prod.seoTitle) && (prod.seo?.tags?.length > 0 || prod.seoTags?.length > 0));
    const hasVault = Boolean(prod.vault?.storagePath || prod.vault?.canvaTemplateUrl || prod.vault?.notionTemplateUrl);
    const hasMedia = Boolean((prod.mockups && prod.mockups.length > 0) || (prod.mockupUrls && prod.mockupUrls.length > 0));
    const auditScore = Number(prod.aiAudit?.score ?? prod.aiAudit?.overallScore ?? 0);
    const hasAudit = auditScore >= 70;

    if (hasBlueprint) progress += 20;
    if (hasSEO) progress += 20;
    if (hasVault) progress += 20;
    if (hasMedia) progress += 20;
    if (hasAudit) progress += 20;

    prod.studioPercent = progress;
    prod.updatedAt = new Date().toISOString();

    // 3. Automatic Status Advancement Based on Studio Activity (No manual changing needed)
    if (prod.status !== 'Live' && prod.status !== 'Pending Review' && prod.status !== 'Revision Requested') {
      if (hasSEO && hasAudit && hasMedia && hasVault && hasBlueprint) {
        prod.status = 'Ready for Review';
      } else if (hasAudit && hasMedia && hasVault) {
        prod.status = 'Audit Passed';
      } else if (hasMedia && hasVault) {
        prod.status = 'Media Ready';
      } else if (hasVault) {
        prod.status = 'Vault Uploaded';
      } else if (hasBlueprint) {
        prod.status = 'Blueprint Ready';
      }
    }

    // Save to atomic product asset key
    const assetPatch = {};
    if (tab === 'blueprint' || blueprint) assetPatch.blueprint = prod.blueprint;
    if (tab === 'seo' || seo) {
      assetPatch.seo = prod.seo;
      assetPatch.seoTitle = prod.seoTitle;
      assetPatch.seoDescription = prod.seoDescription;
      assetPatch.seoTags = prod.seoTags;
    }
    if (tab === 'pricing' || pricing) {
      assetPatch.price = prod.price;
      assetPatch.retailPrice = prod.retailPrice;
    }
    if (tab === 'type' || type) assetPatch.type = prod.type;
    if (tab === 'audit' || aiAudit) assetPatch.aiAudit = prod.aiAudit;
    if (vault) assetPatch.vault = prod.vault;
    if (video) assetPatch.video = prod.video;
    assetPatch.studioPercent = progress;
    assetPatch.status = prod.status;

    await saveProductAssets(brandId, productCode, assetPatch);

    await persistBrandsState(state);

    return res.json({
      success: true,
      product: prod,
      studioPercent: progress,
      gateStatus: prod.aiAudit?.gateStatus || 'pending',
      message: `Studio draft for ${productCode} saved successfully`
    });
  } catch (err) {
    console.error('[Studio Save Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/brands/:id/product/:code
 * Removes a product from the brand catalog
 */
router.delete('/:id/product/:code', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const productCode = req.params.code;

    const state = await loadBrandsState();
    const brand = state.brands?.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    if (!state.productsCatalog || !state.productsCatalog[brandId]) {
      return res.status(404).json({ success: false, error: 'Catalog not found' });
    }

    const initialLen = state.productsCatalog[brandId].length;
    state.productsCatalog[brandId] = state.productsCatalog[brandId].filter(p => p.code !== productCode);

    if (state.productsCatalog[brandId].length === initialLen) {
      return res.status(404).json({ success: false, error: `Product ${productCode} not found` });
    }

    brand.productsLive = state.productsCatalog[brandId].filter(p => p.status === 'Live').length;
    await persistBrandsState(state);

    return res.json({ success: true, message: `Product ${productCode} deleted from catalog` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/brands/:id/expiring-soon
 * Returns products with expiresAt within 14 days
 */
router.get('/:id/expiring-soon', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const state = await loadBrandsState();
    const catalog = state.productsCatalog?.[brandId] || [];

    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    const expiring = catalog.filter(p => {
      if (p.status !== 'Live' || !p.expiresAt) return false;
      const expiryTime = new Date(p.expiresAt).getTime();
      return expiryTime - now <= fourteenDaysMs;
    }).map(p => {
      const daysRemaining = Math.max(0, Math.ceil((new Date(p.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)));
      return {
        code: p.code,
        name: p.name,
        etsyListingId: p.etsyListingId,
        listedAt: p.listedAt,
        expiresAt: p.expiresAt,
        daysRemaining,
        isExpired: daysRemaining === 0,
        price: p.price
      };
    });

    return res.json({
      success: true,
      brandId,
      count: expiring.length,
      expiring
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/log-shop-creation-fee
 * Logs one-time $26 shop creation fee (Admin Only)
 */
router.post('/:id/log-shop-creation-fee', requireAuth, requireAdmin, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const state = await loadBrandsState();
    const brand = state.brands?.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    brand.shopCreationFee = 26.00;
    brand.shopCreationFeeLoggedAt = new Date().toISOString();
    await persistBrandsState(state);

    return res.json({
      success: true,
      brandId,
      shopCreationFee: 26.00,
      message: 'Shop creation fee ($26.00) logged in brand financial ledger'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/video/upload
 * Uploads a video file (.mp4/.mov) to Supabase Storage 'product-vault'
 */
router.post('/:id/video/upload', requireAuth, vaultUpload.single('video'), async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { productCode, productName } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No video file provided (.mp4 or .mov, max 100MB)' });
    }

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    const cleanCode = (productCode || 'PROD').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `brands/${brandId}/${cleanCode}/video/${Date.now()}_${safeFileName}`;
    let signedUrl = '';

    if (isSupabaseConfigured()) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('product-vault')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype || 'video/mp4',
            upsert: true
          });

        if (!uploadError) {
          const { data: signedData } = await supabase.storage
            .from('product-vault')
            .createSignedUrl(storagePath, 3600 * 24 * 7); // 7 days
          signedUrl = signedData?.signedUrl || '';
        } else {
          console.warn('[Video Vault Upload] Storage notice:', uploadError.message);
        }
      } catch (storageErr) {
        console.warn('[Video Storage Exception]:', storageErr.message);
      }
    }

    const videoItem = {
      fileName: file.originalname,
      fileSizeBytes: file.size,
      contentType: file.mimetype,
      storagePath: storagePath,
      url: signedUrl,
      uploadedAt: new Date().toISOString()
    };

    // Save atomic video asset
    await saveProductAssets(brandId, productCode, {
      video: videoItem
    });

    if (!state.productsCatalog) state.productsCatalog = {};
    if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = generateDefaultProductsForBrand(brand);
    let prod = state.productsCatalog[brandId].find(p =>
      (productCode && p.code === productCode) ||
      (productName && p.name === productName)
    );
    if (!prod && productCode) {
      prod = {
        code: productCode,
        name: productName || `Product ${productCode}`,
        category: brand.categories?.[0] || 'General',
        format: 'Digital PDF',
        price: 4.99,
        status: 'Draft'
      };
      state.productsCatalog[brandId].push(prod);
    }
    if (prod) {
      prod.video = videoItem;
      if (prod.status !== 'Live' && prod.status !== 'Pending Review' && prod.status !== 'Revision Requested') {
        if ((prod.mockups?.length || prod.mockupUrls?.length || 0) >= 4) {
          prod.status = 'Media Ready';
        }
      }
    }

    await persistBrandsState(state);

    return res.json({
      success: true,
      brandId,
      productCode,
      video: videoItem,
      message: 'Video uploaded to product vault successfully'
    });
  } catch (err) {
    console.error('[Video Vault Upload Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DVM REVIEW QUEUE & DBM INCENTIVE SYSTEM ENDPOINTS
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * POST /api/brands/:id/product/:code/submit-review
 * DVM submits a completed product for Admin Review
 */
router.post('/:id/product/:code/submit-review', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const productCode = req.params.code;
    const state = await loadBrandsState();
    const brand = state.brands?.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    if (!state.productsCatalog) state.productsCatalog = {};
    if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = [];

    let prod = state.productsCatalog[brandId].find(p => p.code === productCode);
    if (!prod) {
      prod = {
        code: productCode,
        name: req.body.title || `Product ${productCode}`,
        category: req.body.category || 'General',
        price: req.body.price || 4.99,
        status: 'Draft'
      };
      state.productsCatalog[brandId].push(prod);
    }

    // Merge request body into product if provided
    if (req.body.title && typeof req.body.title === 'string' && req.body.title.trim().length >= 3) {
      prod.seoTitle = req.body.title.trim();
      if (!prod.seo) prod.seo = {};
      prod.seo.title = req.body.title.trim();
    }
    if (req.body.description && typeof req.body.description === 'string') {
      prod.seoDescription = req.body.description;
      if (!prod.seo) prod.seo = {};
      prod.seo.description = req.body.description;
    }
    if (req.body.tags && Array.isArray(req.body.tags) && req.body.tags.length > 0) {
      prod.seoTags = req.body.tags;
      if (!prod.seo) prod.seo = {};
      prod.seo.tags = req.body.tags;
    }
    if (req.body.mockups !== undefined && Array.isArray(req.body.mockups) && req.body.mockups.length > 0) prod.mockups = req.body.mockups;
    if (req.body.mockupsCount !== undefined && Number(req.body.mockupsCount) > 0) prod.mockupsCount = Number(req.body.mockupsCount);
    if (req.body.video !== undefined && req.body.video) prod.video = req.body.video;
    if (req.body.vault !== undefined && req.body.vault) prod.vault = req.body.vault;
    if (req.body.aiAudit !== undefined) prod.aiAudit = req.body.aiAudit;
    if (req.body.price !== undefined && Number(req.body.price) > 0) prod.price = Number(req.body.price);

    // Validate minimum requirements
    const title = (prod.seoTitle || prod.seo?.title || prod.name || '').trim();
    const hasVault = Boolean(prod.vault?.storagePath || prod.vault?.fileName || prod.vault?.canvaTemplateUrl || prod.vault?.notionTemplateUrl || prod.vault?.downloadUrl);
    const mockupsCount = Math.max(
      Array.isArray(prod.mockups) ? prod.mockups.length : 0,
      Array.isArray(prod.mockupUrls) ? prod.mockupUrls.length : 0,
      Number(prod.mockupsCount) || 0
    );
    const hasVideo = Boolean(prod.video?.storagePath || prod.video?.fileName || prod.video?.url || (typeof prod.video === 'string' && prod.video.length > 0));
    const minMockups = brand.minMockups || 4;

    const missing = [];
    if (!title || title.length < 5) missing.push('SEO Title is missing (Studio Step 5)');
    if (!hasVault) missing.push('Deliverable file not uploaded to Vault (Studio Step 2)');
    if (mockupsCount < minMockups) missing.push(`At least ${minMockups} mockup photos required (currently ${mockupsCount})`);
    if (!hasVideo) missing.push('Listing video is required (Studio Step 3)');

    if (missing.length > 0) {
      return res.status(400).json({ success: false, error: `Cannot submit for review:\n• ${missing.join('\n• ')}` });
    }

    prod.status = 'Pending Review';
    prod.submittedAt = new Date().toISOString();
    prod.submittedBy = req.user?.name || req.user?.username || 'DVM';
    delete prod.adminRevisionNote;

    // Save status and submission details to atomic product key
    await saveProductAssets(brandId, productCode, {
      status: 'Pending Review',
      submittedAt: prod.submittedAt,
      submittedBy: prod.submittedBy,
      seoTitle: prod.seoTitle,
      seo: prod.seo,
      price: prod.price
    });

    await persistBrandsState(state);

    return res.json({
      success: true,
      data: {
        status: prod.status,
        product: prod
      },
      product: prod,
      message: `Product ${productCode} submitted for Admin Review!`
    });
  } catch (err) {
    console.error('[Submit Review Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/brands/review-queue
 * Fetches all products across all brands currently 'Pending Review' or 'Revision Requested' (Admin Only)
 */
router.get('/review-queue', requireAuth, requireAdmin, async (req, res) => {
  try {
    const state = await loadBrandsState();
    const queue = [];

    if (state.productsCatalog) {
      for (const [bId, catalog] of Object.entries(state.productsCatalog)) {
        const brand = state.brands?.find(b => b.id === Number(bId));
        if (Array.isArray(catalog)) {
          for (const prod of catalog) {
            if (prod.status === 'Pending Review' || prod.status === 'Revision Requested') {
              queue.push({
                brandId: Number(bId),
                brandName: brand?.name || `Brand #${bId}`,
                dbmId: brand?.dbmId || null,
                ...prod
              });
            }
          }
        }
      }
    }

    return res.json({
      success: true,
      count: queue.length,
      queue,
      data: {
        count: queue.length,
        queue
      }
    });
  } catch (err) {
    console.error('[Review Queue Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/product/:code/review-action
 * Admin approves, requests revision, or rejects a submitted product (Admin Only)
 */
router.post('/:id/product/:code/review-action', requireAuth, requireAdmin, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const productCode = req.params.code;
    const { action, revisionNote, priceOverride, priceNote } = req.body;

    const state = await loadBrandsState();
    const brand = state.brands?.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    if (!state.productsCatalog) state.productsCatalog = {};
    if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = [];

    let prod = state.productsCatalog[brandId].find(p => p.code === productCode);
    if (!prod) {
      prod = {
        code: productCode,
        name: `Product ${productCode}`,
        category: 'General',
        price: 4.99,
        status: 'Draft'
      };
      state.productsCatalog[brandId].push(prod);
    }

    const assetPatch = {};

    if (action === 'request_revision') {
      prod.status = 'Revision Requested';
      prod.adminRevisionNote = revisionNote || 'Please review and adjust product assets per guidelines.';
      prod.revisionRequestedAt = new Date().toISOString();
      assetPatch.status = prod.status;
      assetPatch.adminRevisionNote = prod.adminRevisionNote;
      assetPatch.revisionRequestedAt = prod.revisionRequestedAt;
    } else if (action === 'approve') {
      prod.status = 'Live';
      prod.approvedAt = new Date().toISOString();
      prod.approvedBy = req.user?.name || req.user?.username || req.user?.id || 'Admin';
      prod.listedAt = prod.listedAt || new Date().toISOString();
      delete prod.adminRevisionNote;

      if (priceOverride !== undefined && priceOverride !== null && !isNaN(Number(priceOverride))) {
        prod.price = Number(priceOverride);
        if (priceNote) prod.adminPriceNote = String(priceNote);
        assetPatch.price = prod.price;
        assetPatch.adminPriceNote = prod.adminPriceNote;
      }

      assetPatch.status = prod.status;
      assetPatch.approvedAt = prod.approvedAt;
      assetPatch.approvedBy = prod.approvedBy;
      assetPatch.listedAt = prod.listedAt;

      brand.productsLive = state.productsCatalog[brandId].filter(p => p.status === 'Live').length;
    }

    await saveProductAssets(brandId, productCode, assetPatch);
    await persistBrandsState(state);

    return res.json({
      success: true,
      product: prod,

      data: {
        status: prod.status,
        product: prod
      },
      message: `Product ${productCode} updated: ${prod.status}`
    });
  } catch (err) {
    console.error('[Review Action Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/brands/dbm-incentive-ledger
 * Calculates live DBM Earnings:
 * 1. Vault Product Completion Bonus = sum of product retail price for all Live/Published products
 * 2. 10% Flat Sales Commission on brand actualGross
 * 3. 3%/4%/5% Tier Achievement Incentive based on monthly upload target
 * 4. Mid-Month Surprise Incentive (if admin approved for the month)
 */
router.get('/dbm-incentive-ledger', requireAuth, async (req, res) => {
  try {
    const state = await loadBrandsState();
    const dbms = state.dbms || [];
    const brands = state.brands || [];
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const midMonthMap = state.midMonthIncentives?.[currentMonthKey] || {};

    const ledger = dbms.map(dbm => {
      const assignedBrands = brands.filter(b => b.dbmId === dbm.id);

      let vaultBonusTotal = 0;
      let totalLiveProducts = 0;
      let totalBrandGross = 0;
      let totalMonthlyTargetRevenue = 0;

      for (const brand of assignedBrands) {
        totalBrandGross += (brand.actualGross || 0);
        totalMonthlyTargetRevenue += ((brand.target12mo || 24000) / 12);

        const catalog = state.productsCatalog?.[brand.id] || [];
        for (const p of catalog) {
          if (p.status === 'Live' || p.etsyListingId) {
            totalLiveProducts++;
            const price = Number(p.price || p.seo?.price || p.retailPrice || 4.99);
            vaultBonusTotal += price;
          }
        }
      }

      // 1. Vault Completion Bonus
      // 2. 10% Flat Sales Commission
      const salesCommission = totalBrandGross * 0.10;

      // 3. Monthly Achievement Tiers (30 products/month default target)
      const monthlyProductTarget = dbm.monthlyProductTarget || 30;
      const achievementPct = monthlyProductTarget > 0 ? (totalLiveProducts / monthlyProductTarget) : 0;

      let tierName = 'Base Tier';
      let tierBonus = 0;
      let nextTierTarget = '80% Tier';
      let nextTierBonus = totalMonthlyTargetRevenue * 0.80 * 0.03;

      if (achievementPct >= 1.20) {
        tierName = '120% Super Achiever (5%)';
        tierBonus = totalMonthlyTargetRevenue * 1.20 * 0.05;
        nextTierTarget = 'Max Tier Achieved 🏆';
        nextTierBonus = 0;
      } else if (achievementPct >= 1.00) {
        tierName = '100% Target Achieved (4%)';
        tierBonus = totalMonthlyTargetRevenue * 1.00 * 0.04;
        nextTierTarget = '120% Tier';
        nextTierBonus = totalMonthlyTargetRevenue * 1.20 * 0.05;
      } else if (achievementPct >= 0.80) {
        tierName = '80% Bronze Tier (3%)';
        tierBonus = totalMonthlyTargetRevenue * 0.80 * 0.03;
        nextTierTarget = '100% Tier';
        nextTierBonus = totalMonthlyTargetRevenue * 1.00 * 0.04;
      }

      // 4. Mid-Month Surprise Incentive
      const surpriseIncentive = midMonthMap[dbm.id] || null;
      const surpriseBonus = (surpriseIncentive && surpriseIncentive.approved && achievementPct >= (surpriseIncentive.targetPct / 100))
        ? Number(surpriseIncentive.bonusUsd || 0)
        : 0;

      const totalEarnings = vaultBonusTotal + salesCommission + tierBonus + surpriseBonus;

      return {
        dbmId: dbm.id,
        name: dbm.name,
        role: dbm.role || 'Digital Brand Manager',
        assignedBrands: assignedBrands.map(b => ({ id: b.id, name: b.name })),
        totalLiveProducts,
        monthlyProductTarget,
        achievementPct: Math.round(achievementPct * 100),
        vaultBonusTotal: Number(vaultBonusTotal.toFixed(2)),
        salesCommission: Number(salesCommission.toFixed(2)),
        tierName,
        tierBonus: Number(tierBonus.toFixed(2)),
        nextTierTarget,
        nextTierBonus: Number(nextTierBonus.toFixed(2)),
        surpriseIncentive,
        surpriseBonus: Number(surpriseBonus.toFixed(2)),
        totalEarnings: Number(totalEarnings.toFixed(2)),
        monthKey: currentMonthKey
      };
    });

    return res.json({
      success: true,
      monthKey: currentMonthKey,
      ledger,
      data: {
        monthKey: currentMonthKey,
        ledger
      }
    });
  } catch (err) {
    console.error('[DBM Ledger Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/set-mid-month-incentive
 * Admin configures or approves a custom mid-month incentive for a DBM (Admin Only)
 */
router.post('/set-mid-month-incentive', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { dbmId, targetPct, bonusUsd, note, approved } = req.body;
    const state = await loadBrandsState();
    const currentMonthKey = new Date().toISOString().slice(0, 7);

    if (!state.midMonthIncentives) state.midMonthIncentives = {};
    if (!state.midMonthIncentives[currentMonthKey]) state.midMonthIncentives[currentMonthKey] = {};

    state.midMonthIncentives[currentMonthKey][dbmId] = {
      dbmId,
      targetPct: Number(targetPct) || 70,
      bonusUsd: Number(bonusUsd) || 50,
      note: note || 'Mid-Month Sprint Bonus',
      approved: Boolean(approved),
      updatedAt: new Date().toISOString()
    };

    await persistBrandsState(state);

    return res.json({
      success: true,
      monthKey: currentMonthKey,
      incentive: state.midMonthIncentives[currentMonthKey][dbmId],
      data: {
        monthKey: currentMonthKey,
        incentive: state.midMonthIncentives[currentMonthKey][dbmId]
      },
      message: `Mid-month incentive for DBM #${dbmId} ${approved ? 'approved & active' : 'configured'}`
    });
  } catch (err) {
    console.error('[Set Mid-Month Incentive Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/trigger-20th-telegram-evaluation
 * Generates mid-month performance summary and dispatches Telegram notification to Admin (Admin Only)
 */
router.post('/trigger-20th-telegram-evaluation', requireAuth, requireAdmin, async (req, res) => {
  try {
    const state = await loadBrandsState();
    const dbms = state.dbms || [];
    const brands = state.brands || [];
    const currentMonthKey = new Date().toISOString().slice(0, 7);

    let summaryText = `📊 *GRO10X 20th Mid-Month DBM Performance Brief* (${currentMonthKey})\n\n`;

    dbms.forEach(dbm => {
      const assigned = brands.filter(b => b.dbmId === dbm.id);
      let liveCount = 0;
      assigned.forEach(b => {
        const cat = state.productsCatalog?.[b.id] || [];
        liveCount += cat.filter(p => p.status === 'Live' || p.etsyListingId).length;
      });
      const target = dbm.monthlyProductTarget || 30;
      const pct = Math.round((liveCount / target) * 100);

      summaryText += `👤 *${dbm.name}* (${assigned.map(b => b.name).join(', ') || 'No brands'})\n` +
        `• Progress: *${liveCount}/${target} products* (${pct}% achieved)\n` +
        `• Suggested Incentive: ${pct < 80 ? `💡 Consider a ${Math.max(60, pct + 10)}% sprint bonus (\$35–\$50)` : '✅ On track for Tier bonus!'}\n\n`;
    });

    summaryText += `_Review and approve custom incentives in the Admin DBM Hub._`;

    // Attempt Telegram delivery if bot is configured
    try {
      const { sendToGroup } = require('../services/bot');
      if (sendToGroup) {
        sendToGroup(summaryText);
      }
    } catch (botErr) {
      console.warn('[Telegram 20th Brief Notice]:', botErr.message);
    }

    return res.json({
      success: true,
      summaryText,
      data: {
        summaryText
      },
      message: '20th Mid-Month Evaluation brief generated'
    });
  } catch (err) {
    console.error('[20th Telegram Eval Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.SEED_BRANDS_DATA = SEED_BRANDS_DATA;
router.loadBrandsState = loadBrandsState;
router.persistBrandsState = persistBrandsState;
router.saveProductAssets = saveProductAssets;
router.loadProductAssets = loadProductAssets;
router.saveProductMockup = saveProductMockup;
router.loadProductMockups = loadProductMockups;
router.loadFullProduct = loadFullProduct;

module.exports = router;
module.exports.SEED_BRANDS_DATA = SEED_BRANDS_DATA;
module.exports.loadBrandsState = loadBrandsState;
module.exports.persistBrandsState = persistBrandsState;
module.exports.saveProductAssets = saveProductAssets;
module.exports.loadProductAssets = loadProductAssets;
module.exports.saveProductMockup = saveProductMockup;
module.exports.loadProductMockups = loadProductMockups;
module.exports.loadFullProduct = loadFullProduct;



