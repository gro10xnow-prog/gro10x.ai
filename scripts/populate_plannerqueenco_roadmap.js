/**
 * scripts/populate_plannerqueenco_roadmap.js
 * Enriches all 100 PlannerQueenCo SKUs (PLA-01 to PLA-100) with distinct, high-converting product titles,
 * preserving any live or configured listings (like PLA-01 and PLA-02).
 */

const fs = require('fs');
const path = require('path');

const PLANNER_QUEEN_TITLES = {
  // Category 1: Daily & Weekly Planners (PLA-01 to PLA-10)
  1: "Daily & Weekly Planners #1 — PlannerQueenCo Style", // Live listing preserved
  2: "Executive Work-Life Balance & Top-3 Priority Matrix Weekly Planner",
  3: "ADHD-Friendly Low-Dopamine & Low-Friction Daily Task Planner",
  4: "Teacher & Student Weekly Academic Lesson & Study Planner",
  5: "Busy Mom Household & Family Command Center Weekly Spread",
  6: "Wellness, Fitness & Daily Meal Prep Schedule Planner",
  7: "Solopreneur 90-Day Quarterly Sprint Execution Daily Planner",
  8: "Mindful Morning & Evening Routine Reflection Journal",
  9: "Undated Minimalist 365-Day Digital GoodNotes Tablet Planner",
  10: "The Master Life Management All-Inclusive Daily & Weekly Mega Bundle",

  // Category 2: Financial Trackers (PLA-11 to PLA-20)
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

  // Category 3: Goal Setting & Habits (PLA-21 to PLA-30)
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

  // Category 4: Life & Project Mgmt (PLA-31 to PLA-40)
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

  // Category 5: Wellness & Self-Dev (PLA-41 to PLA-50)
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

  // Category 6: Work & Career (PLA-51 to PLA-60)
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

  // Category 7: Bundles (PLA-61 to PLA-70)
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

  // Category 8: Seasonal & Holiday (PLA-71 to PLA-80)
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

  // Category 9: Specialty Niches (PLA-81 to PLA-90)
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

  // Category 10: E-books (PLA-91 to PLA-100)
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

const statePath = path.join(__dirname, '..', 'data', 'brands_empire_state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

if (!state.productsCatalog) state.productsCatalog = {};
const catalog1 = state.productsCatalog["1"] || [];

for (let i = 1; i <= 100; i++) {
  const code = `PLA-${i.toString().padStart(2, '0')}`;
  let prod = catalog1.find(p => p.code === code);
  const newName = PLANNER_QUEEN_TITLES[i] || `Product #${i}`;
  const isFlagship = (i % 10 === 0);
  const isHero = (i % 10 === 1 || i % 10 === 2);

  if (!prod) {
    prod = {
      code,
      name: newName,
      price: isFlagship ? 24.00 : (isHero ? 8.99 : 7.49),
      format: i >= 91 ? 'PDF E-book' : 'Digital PDF',
      status: 'Draft',
      hero: isHero
    };
    catalog1.push(prod);
  } else {
    // Only update name if it was a generic placeholder or not live
    if (prod.status !== 'Live' || !prod.name) {
      prod.name = newName;
    }
    if (isFlagship && (!prod.price || prod.price === 12)) {
      prod.price = 24.00;
    }
  }
}

state.productsCatalog["1"] = catalog1;
fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');

console.log('✅ Successfully updated all 100 PlannerQueenCo products in data/brands_empire_state.json');
