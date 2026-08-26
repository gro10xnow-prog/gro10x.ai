/**
 * src/services/blueprint-generator.js
 * Blueprint Engine 2.0 — Category-Intelligent Digital Product Blueprint & Mockup Architect
 * Provides specialized, high-converting, 15–35 page product blueprints and tailored mockup briefs.
 */

// Category Identifier Resolution
function resolveCategory(productName = '', category = '', type = '') {
  const p = (productName + ' ' + category + ' ' + type).toLowerCase();

  // 1. E-books & Box sets
  if (p.includes('e-book') || p.includes('ebook') || p.includes('library box set') || (p.includes('guide') && p.includes('(e-book)'))) {
    return 'ebook';
  }
  // 2. Seasonal, Holiday & Event celebrations (Takes precedence over budget words inside holiday planner)
  if (p.includes('christmas') || p.includes('holiday') || p.includes('thanksgiving') || p.includes('halloween') || p.includes('easter') || p.includes('summer') || p.includes('autumn') || p.includes('new year') || p.includes('seasonal') || p.includes('gathering')) {
    return 'seasonal';
  }
  // 3. Academic, Teacher & Student
  if (p.includes('teacher') || p.includes('student') || p.includes('academic') || p.includes('lesson') || p.includes('homeschool') || p.includes('school')) {
    return 'academic';
  }
  // 4. Financial & Wealth Management
  if (p.includes('budget') || p.includes('finance') || p.includes('cash flow') || p.includes('debt') || p.includes('wealth') || p.includes('savings') || p.includes('expense') || p.includes('income')) {
    return 'finance';
  }
  // 5. Goals, Habits & Routines
  if (p.includes('goal') || p.includes('habit') || p.includes('okr') || p.includes('vision') || p.includes('streak') || p.includes('routine')) {
    return 'goals_habits';
  }
  // 6. Wellness & Fitness
  if (p.includes('wellness') || p.includes('fitness') || p.includes('health') || p.includes('workout') || p.includes('sleep') || p.includes('meal') || p.includes('nutrition') || p.includes('self-care') || p.includes('mental health')) {
    return 'wellness';
  }
  // 7. Home & Family
  if (p.includes('home') || p.includes('family') || p.includes('mom') || p.includes('household') || p.includes('cleaning') || p.includes('chore') || p.includes('declutter') || p.includes('parenting')) {
    return 'home_family';
  }
  // 8. Business & Operations
  if (p.includes('business') || p.includes('solopreneur') || p.includes('client') || p.includes('freelance') || p.includes('marketing') || p.includes('content creator') || p.includes('project mgmt') || p.includes('operations')) {
    return 'business';
  }
  // 9. Specialty Niches
  if (p.includes('wedding') || p.includes('real estate') || p.includes('nursing') || p.includes('travel') || p.includes('author') || p.includes('faith') || p.includes('devotional') || p.includes('specialty')) {
    return 'specialty';
  }
  return 'planners';
}

function getCategoryConfig(catId, cleanP, bName, colors, fonts) {
  const primary = colors[0] || '#8B5A7A';
  const bgTint = colors[1] || '#FAF3E8';
  const secondary = colors[2] || '#7D9B76';
  const highlight = colors[3] || '#C4887C';
  const textDark = colors[4] || '#2E2E2E';
  const hFont = fonts.heading || 'Playfair Display';
  const bFont = fonts.body || 'Lato';

  switch (catId) {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. ACADEMIC & TEACHER PLANNERS (25–30 Pages)
    // ─────────────────────────────────────────────────────────────────────────
    case 'academic':
      return {
        categoryName: 'Teacher & Student Academic Planners',
        targetAudience: 'K-12 teachers, homeschool parents, university professors, and ambitious students',
        designAesthetic: 'Clean academic minimalism, high-contrast grids, professional classroom organization with calming sage/neutral accents',
        dimensions: 'US Letter (8.5 x 11 in) / A4 Compatible (300 DPI Print Ready & GoodNotes Hyperlinked)',
        pageCount: 22,
        pages: [
          {
            pageNumber: 1,
            section: 'Cover & Teacher Profile',
            title: `${cleanP} · Academic Year Edition`,
            purpose: 'Establish professional classroom identity, school year ownership, and emergency contacts.',
            layoutSpecs: 'Clean academic layout with 0.5 in safe print borders. School name, room number, subject, and personal contact block.',
            elements: [
              `Brand Header: "${bName}" in ${hFont}`,
              `Product Title: "${cleanP}"`,
              'School Year & Grade Level / Room Number attribution block',
              'Teacher Name, Email & Emergency Contact Card',
              'Personal / Classroom License Declaration'
            ]
          },
          {
            pageNumber: 2,
            section: 'Quick Start & Classroom Guide',
            title: 'Teacher Planning System & How-To Guide',
            purpose: 'Guide educator on optimal use of weekly spreads, grading rubric shortcuts, and digital hyperlinking.',
            layoutSpecs: '3-card walkthrough structure with icon badges and color-coded curriculum legend.',
            elements: [
              'System Setup Guide (Weekly Prep Rhythm)',
              'Color-Coded Subject / Period Legend Table',
              'Digital Annotation & Hyperlink navigation guide for iPad / GoodNotes',
              'Yearly Goals & Classroom Vision Statement'
            ]
          },
          {
            pageNumber: 3,
            section: 'Academic Calendar',
            title: 'Full School Year Matrix (Aug–Jul)',
            purpose: 'Full year overview for term dates, professional development days, and holiday breaks.',
            layoutSpecs: '12-month calendar mini-grids with term boundary markers and shaded holiday boxes.',
            elements: [
              '12 Mini-Month Calendars (August through July)',
              'Semester / Trimester Milestone Checklist',
              'Key Testing Dates & Assembly Schedule Box'
            ]
          },
          {
            pageNumber: 4,
            section: 'Term & Semester Roadmaps',
            title: 'Quarterly Curriculum & Unit Map',
            purpose: 'High-level mapping of curriculum standards across 4 quarters.',
            layoutSpecs: '4-column quarterly grid with pacing guides, standards codes, and major project milestones.',
            elements: [
              'Q1, Q2, Q3, Q4 Unit Scope & Sequence Rows',
              'State / National Standards Tracking Column',
              'Core Learning Objectives & Resource Requirements'
            ]
          },
          {
            pageNumber: 5,
            section: 'Weekly Class Timetable',
            title: 'Master Weekly Class & Bell Schedule',
            purpose: 'Time-block daily teaching periods, duty slots, prep periods, and office hours.',
            layoutSpecs: '7:30 AM – 4:30 PM grid from Monday to Friday with shaded prep/recess blocks.',
            elements: [
              'Monday through Friday hourly bell schedule grid',
              'Hall / Yard Duty & Lunch Rotation Cards',
              'Planning & Conference Period Notes'
            ]
          },
          {
            pageNumber: 6,
            section: 'Monthly Lesson Overview',
            title: 'Monthly Intentions & Thematic Units',
            purpose: 'Theme of the month, school events, field trips, and parent-teacher conference dates.',
            layoutSpecs: '5x7 open calendar grid with side column for monthly learning goals and prep deadlines.',
            elements: [
              '5x7 Open Monthly Academic Calendar',
              'Top 3 Learning Milestones of the Month',
              'Field Trips, Guest Speakers & Assemblies Checklist',
              'Supplies to Order / Prep Reminders'
            ]
          },
          {
            pageNumber: 7,
            section: 'Weekly Lesson Planning Spread',
            title: 'Weekly 5-Subject Lesson Plan Matrix',
            purpose: 'Granular weekly lesson planning across 5 daily columns and up to 6 subject rows.',
            layoutSpecs: 'Grid matrix: Monday to Friday across the top, Subject periods (Math, ELA, Science, Social Studies, Electives) down the side.',
            elements: [
              '5-Day Monday–Friday Column Layout',
              '6 Subject / Period Rows with Lesson Objective & Activity boxes',
              'Daily Homework & Assessment Notes',
              'Standards Reference Numbers'
            ]
          },
          {
            pageNumber: 8,
            section: 'Detailed Daily Lesson Blueprint',
            title: 'Individual Lesson Plan Deep-Dive',
            purpose: 'Structured 45-60 min lesson plan structure with differentiation strategies.',
            layoutSpecs: 'Split format: Hook/Warm-Up (10m), Direct Instruction (15m), Guided Practice (15m), Independent Exit Ticket (10m).',
            elements: [
              'Lesson Objective & Essential Question Header',
              'Step-by-Step 4-Phase Instructional Framework',
              'Differentiation / Accommodation Notes (ELL & IEP)',
              'Required Materials & Technology Links'
            ]
          },
          {
            pageNumber: 9,
            section: 'Student Roster & Attendance',
            title: 'Student Roster & Attendance Matrix',
            purpose: 'Track daily attendance, tardies, and participation for up to 35 students.',
            layoutSpecs: '35 numbered student rows with 31 daily check boxes and monthly summary tally.',
            elements: [
              '35 Student Rows (Name, ID, Birthday, Medical Alert icon)',
              '31-Day Attendance / Participation Check Grid',
              'Monthly Total Absences / Tardies Summary Column'
            ]
          },
          {
            pageNumber: 10,
            section: 'Gradebook & Assessment Log',
            title: 'Class Gradebook & Assignment Tracker',
            purpose: 'Log scores for quizzes, homework, essays, and exams with weighted averages.',
            layoutSpecs: '35 student rows with 10 assignment score columns, total points, and letter grade column.',
            elements: [
              'Assignment Title, Date & Points Possible Header',
              'Granular Numerical Score Cells per Student',
              'Class Average Calculator Footer'
            ]
          },
          {
            pageNumber: 11,
            section: 'Parent-Teacher Communication',
            title: 'Parent Communication & Conference Log',
            purpose: 'Log phone calls, emails, IEP meetings, and behavior interventions with timestamps.',
            layoutSpecs: 'Table with Date, Student Name, Parent/Guardian, Contact Method (Call/Email/Meeting), Reason, and Agreed Action.',
            elements: [
              'Chronological Contact Entry Rows',
              'Action Item / Follow-Up Checkbox',
              'Parent Signature & Notes Space'
            ]
          },
          {
            pageNumber: 12,
            section: 'Special Education & Accommodations',
            title: 'IEP, 504 & Differentiation Tracker',
            purpose: 'Confidential summary of student accommodations, testing modifications, and review dates.',
            layoutSpecs: 'Confidential cards per student detailing testing time, seating, assistive tools, and case manager info.',
            elements: [
              'Student Name & IEP Review Due Date',
              'Specific Accommodations Checklist (Extended Time, Visual Aids, Sensory)',
              'Behavior Support Plan Strategies'
            ]
          },
          {
            pageNumber: 13,
            section: 'Classroom Seating Charts',
            title: 'Classroom Seating Chart & Grouping Layout',
            purpose: 'Visual desk layout mapping for lecture, small groups, and collaborative pods.',
            layoutSpecs: '36 editable desk layout grid boxes with Teacher Desk and Whiteboard markers.',
            elements: [
              'Front of Classroom Indicator',
              '36 Flexible Desk / Table Pod Cards with student name lines',
              'Small Group Project Rotation Assignment Legend'
            ]
          },
          {
            pageNumber: 14,
            section: 'Classroom Logistics & Volunteers',
            title: 'Classroom Inventory & Volunteer Schedule',
            purpose: 'Manage class supplies, textbook assignments, classroom wishlists, and parent volunteers.',
            layoutSpecs: 'Two-column log for physical supplies and volunteer time-slots.',
            elements: [
              'Classroom Library & Supply Inventory Table',
              'Parent Volunteer Dates, Tasks & Contact Numbers',
              'Quarterly Supply Wishlist & Ordering Log'
            ]
          },
          {
            pageNumber: 15,
            section: 'Substitute Teacher Info Sheet',
            title: 'Substitute Teacher Emergency & Day Plan',
            purpose: 'All critical classroom information in one easy-to-read emergency summary.',
            layoutSpecs: 'Emergency contacts, reliable helper students, daily schedule, medical protocols, and class rules.',
            elements: [
              'Emergency Procedures & Principal / Nurse Extensions',
              'Reliable Student Helpers List',
              'Daily Bell Schedule & Bathroom Pass Policies',
              'End-of-Day Substitute Feedback Form'
            ]
          },
          {
            pageNumber: 16,
            section: 'Professional Development & Goals',
            title: 'Teacher PD Credits & Observation Log',
            purpose: 'Track continuing education hours, mentorship observations, and evaluation goals.',
            layoutSpecs: 'Table for Workshop Date, Topic, Provider, PD Hours Earned, and Key Takeaway.',
            elements: [
              'Annual PD Hours Progress Bar',
              'Workshop & Certificate Log Table',
              'Admin Observation Feedback & Goal Action Plan'
            ]
          },
          {
            pageNumber: 17,
            section: 'Student Birthday & Celebration Tracker',
            title: 'Classroom Birthdays & Milestone Board',
            purpose: 'Foster a positive classroom community by tracking every student celebration.',
            layoutSpecs: '12 monthly celebratory banner cards with student name lines.',
            elements: [
              '12 Monthly Birthday Celebration Boxes',
              'Class Reward Milestone & Star of the Week Board'
            ]
          },
          {
            pageNumber: 18,
            section: 'End-of-Year Reflection & Next Year Prep',
            title: 'Annual Classroom Reflection & Archiving Checklist',
            purpose: 'Review curriculum pacing successes and create next year improvement plan.',
            layoutSpecs: 'What worked well, curriculum adjustments needed, and classroom packing checklist.',
            elements: [
              'Curriculum Unit Success Reflection',
              'Classroom Pack-Down & Inventory Checklist',
              'Top 3 Goals for Next School Year'
            ]
          },
          {
            pageNumber: 19,
            section: 'Meeting Notes & Staff Briefings',
            title: 'Faculty Meeting & PLC Collaboration Notes',
            purpose: 'Capture department discussions, action items, and data analysis notes.',
            layoutSpecs: 'Structured meeting template with Date, Attendees, Key Decisions, and Action Items with assignees.',
            elements: [
              'Meeting Agenda & Objective Header',
              'Key Discussion Points & Department Decisions',
              'Action Items Table (Task, Assignee, Due Date)'
            ]
          },
          {
            pageNumber: 20,
            section: 'Dot Grid Notes & Lesson Brainstorming',
            title: 'Creative Lesson Brainstorm & Dot Grid',
            purpose: 'Unstructured creative ideation, bulletin board design sketches, and brain dump.',
            layoutSpecs: '5mm subtle light gray dot grid with aesthetic botanical border motif.',
            elements: [
              'Date, Subject & Grade Tag Header',
              '5mm Vector Dot Grid (#E0DCD5)',
              'Action Item Summary Footer'
            ]
          }
        ]
      };

    // ─────────────────────────────────────────────────────────────────────────
    // 2. FINANCIAL TRACKERS & WEALTH BUDGETING (20–24 Pages)
    // ─────────────────────────────────────────────────────────────────────────
    case 'finance':
      return {
        categoryName: 'Financial Trackers & Wealth Management',
        targetAudience: 'Budget-conscious professionals, couples, side-hustlers, and individuals building financial freedom',
        designAesthetic: 'Luxury editorial finance, crisp legible ledger typography, warm neutral cash envelope elegance',
        dimensions: 'US Letter (8.5 x 11 in) / A4 Vector PDF (GoodNotes & Print Ready)',
        pageCount: 20,
        pages: [
          {
            pageNumber: 1,
            section: 'Cover & Financial Freedom Declaration',
            title: `${cleanP} · Master Financial Edition`,
            purpose: 'Set clear financial intentions, net worth baseline, and personal financial rules.',
            layoutSpecs: 'Luxury minimalist cover with gold/cream accents, personal declaration, and net worth target badge.',
            elements: [
              `Brand Header: "${bName}" in ${hFont}`,
              `Product Title: "${cleanP}"`,
              'Annual Financial Freedom Target & Starting Date',
              'Personal Financial Manifesto & Values Declaration',
              'Confidential Personal License Box'
            ]
          },
          {
            pageNumber: 2,
            section: 'System Setup & Financial Rules',
            title: 'Zero-Based Budgeting Method & Guide',
            purpose: 'Step-by-step framework explaining zero-based budgeting, sinking funds, and debt payoff.',
            layoutSpecs: '3-pillar framework card (Every Dollar Assigned, Sinking Funds Anchor, Debt Snowball Strategy).',
            elements: [
              'Zero-Based Budgeting Equation Guide (Income - Expenses = $0)',
              'Category Color-Coding & Spending Limits Guide',
              'Emergency Fund Milestone Rules (1 Month -> 3 Months -> 6 Months)',
              'Financial Peace Rhythm (Weekly 15-min check-in)'
            ]
          },
          {
            pageNumber: 3,
            section: 'Net Worth & Asset Dashboard',
            title: 'Annual Net Worth & Wealth Dashboard',
            purpose: 'Track total assets vs total liabilities across all 12 months with visual growth tracking.',
            layoutSpecs: 'Top summary KPI cards (Total Assets, Total Liabilities, Net Worth). 12-month comparison table.',
            elements: [
              'Assets Ledger (Cash, Retirement, Investments, Real Estate, Vehicles)',
              'Liabilities Ledger (Mortgage, Student Loans, Auto, Credit Cards)',
              'Monthly Net Worth Growth Progress Chart'
            ]
          },
          {
            pageNumber: 4,
            section: 'Annual Income Stream Planner',
            title: 'Annual Income & Side Hustle Matrix',
            purpose: 'Map primary salary, bonus streams, freelance clients, dividends, and passive income.',
            layoutSpecs: '12-month income tracking matrix with budgeted vs actual comparison rows.',
            elements: [
              'Primary Salary & Employment Income Rows',
              'Side Hustle, Freelance & Business Revenue Logs',
              'Investments, Dividends & Passive Streams Table',
              'Total Monthly Cash Inflow Summary'
            ]
          },
          {
            pageNumber: 5,
            section: 'Monthly Master Budget',
            title: 'Monthly Zero-Based Budget Spread',
            purpose: 'Allocate every dollar of monthly income into Giving, Savings, Fixed Bills, and Variable categories.',
            layoutSpecs: '4-quadrant layout: Income Inflow, Fixed Essentials, Sinking Funds/Savings, Variable Spending.',
            elements: [
              'Monthly Inflow Summary ($ Expected vs $ Actual)',
              'Fixed Housing & Utility Checklist (Budget vs Paid)',
              'Savings & Investment Allocations Table',
              'Variable Discretionary Spending Allowance'
            ]
          },
          {
            pageNumber: 6,
            section: 'Recurring Bills & Subscriptions',
            title: 'Recurring Bills & Auto-Pay Calendar',
            purpose: 'Prevent missed payments, overdraft fees, and identify unwanted subscription leaks.',
            layoutSpecs: 'Chronological due-date table (1st through 31st of month) with Auto-Pay checkboxes.',
            elements: [
              '31-Day Due Date Matrix (Bill Name, Due Day, Budgeted Amount, Actual, Paid Checkbox)',
              'Auto-Pay Indicator & Payment Method Column',
              'Subscription Audit & Cancellation Hit-List'
            ]
          },
          {
            pageNumber: 7,
            section: 'Daily Expense Ledger (Part 1)',
            title: 'Daily Spending & Transaction Log (Days 1–15)',
            purpose: 'Granular tracking of daily card and cash transactions to prevent impulse budget creep.',
            layoutSpecs: 'Chronological transaction rows: Date, Description, Category, Amount, Payment Method.',
            elements: [
              'Days 1–15 Transaction Log Table',
              'Category Tags (Groceries, Dining, Transport, Shopping, Personal)',
              'Mid-Month Budget Health Check-In Card'
            ]
          },
          {
            pageNumber: 8,
            section: 'Daily Expense Ledger (Part 2)',
            title: 'Daily Spending & Transaction Log (Days 16–31)',
            purpose: 'Complete monthly transaction tracking and end-of-month spending summary.',
            layoutSpecs: 'Transaction rows for the second half of the month with total spending summary footer.',
            elements: [
              'Days 16–31 Transaction Log Table',
              'Total Monthly Variable Spend Calculator',
              'Top 3 Unexpected Expenses Review'
            ]
          },
          {
            pageNumber: 9,
            section: 'Cash Envelopes & Sinking Funds',
            title: 'Cash Envelopes & Sinking Funds Tracker',
            purpose: 'Pre-fund irregular annual expenses (Car Insurance, Holiday Gifts, Home Maintenance).',
            layoutSpecs: 'Visual envelope cards with Starting Balance, Added Amount, Spent Amount, and Ending Balance.',
            elements: [
              '10 Dedicated Sinking Fund Categories (Gifts, Car Care, Medical, Travel, Tech, Clothes)',
              'Monthly Contribution & Target Goal Tracker',
              'Remaining Balance Thermometer'
            ]
          },
          {
            pageNumber: 10,
            section: 'Debt Snowball & Avalanche Plan',
            title: 'Debt Snowball & Payoff Accelerator',
            purpose: 'Rank and eliminate debts systematically with visual payoff milestone celebrations.',
            layoutSpecs: 'Debt ranking table (Creditor, Balance, APR, Min Payment, Snowball Addition) + visual progress path.',
            elements: [
              'Debt Ranking Table (Smallest Balance Snowball or Highest APR Avalanche)',
              'Debt-Free Target Date Milestone Counter',
              'Visual Debt Elimination Progress Ladder (Color-in as balances hit $0)'
            ]
          },
          {
            pageNumber: 11,
            section: 'Emergency Fund Accelerator',
            title: 'Emergency Fund 10k Milestone Tracker',
            purpose: 'Gamified visual saving path to build a 3–6 month emergency reserve.',
            layoutSpecs: '100-cell savings grid where each colored block equals $100 saved toward the $10,000 goal.',
            elements: [
              '100-Block Savings Grid (Color-in blocks)',
              'Tier 1 ($1,000 Starter), Tier 2 (3-Month Expenses), Tier 3 (6-Month Full Peace)',
              'Bank Account Location & High-Yield APY Interest Log'
            ]
          },
          {
            pageNumber: 12,
            section: 'High-Impact Savings Challenges',
            title: '52-Week & No-Spend Challenge Matrix',
            purpose: 'Gamified savings challenges to generate quick financial momentum and break impulse habits.',
            layoutSpecs: '52-week incremental savings table ($1,378 challenge) + 30-day No-Spend calendar challenge.',
            elements: [
              '52-Week Tiered Savings Schedule Checklist',
              '30-Day No-Spend Visual Calendar Tracker',
              'Saved Challenge Funds Allocation Plan'
            ]
          },
          {
            pageNumber: 13,
            section: 'Investment & Retirement Growth',
            title: 'Investment Portfolio & Retirement Log',
            purpose: 'Track index funds, Roth IRA, 401(k), ETFs, and crypto growth over time.',
            layoutSpecs: 'Account summary table with monthly contributions, employer match, and total portfolio balance.',
            elements: [
              'Retirement Accounts Ledger (401k, Roth IRA, HSA, Brokerage)',
              'Monthly Contribution & Compound Growth Tracker',
              'Annual Retirement Savings Rate Percentage Gauge'
            ]
          },
          {
            pageNumber: 14,
            section: 'Tax Deduction & Expense Organizer',
            title: 'Annual Tax Deduction & Receipt Log',
            purpose: 'Organize deductible business, charity, medical, and property expenses for stress-free filing.',
            layoutSpecs: 'Categorized deduction tables with Receipt ID, Date, Vendor, Amount, and Category.',
            elements: [
              'Charitable Donations & Tax Receipts Log',
              'Home Office & Business Write-Offs Table',
              'Medical & Health Savings (HSA/FSA) Expense Log'
            ]
          },
          {
            pageNumber: 15,
            section: 'Monthly Financial Reflection & Wins',
            title: 'Monthly Financial Review & Budget Audit',
            purpose: 'Review spending leaks, celebrate savings wins, and adjust the budget for next month.',
            layoutSpecs: '3-card reflection: What went right, where was overspending, and adjustments for next month.',
            elements: [
              'Budget Accuracy Scorecard (Actual vs Projected)',
              'Savings Rate Achievement (% of Income Saved)',
              'Next Month Top 3 Financial Non-Negotiables'
            ]
          },
          {
            pageNumber: 16,
            section: 'Financial Goals Vision Board',
            title: 'Financial Vision Board & Dream Milestones',
            purpose: 'Visual inspiration for long-term goals (Homeownership, Debt Freedom, Dream Vacation).',
            layoutSpecs: 'Aesthetic open grid with quote banner and image / sketch placement zones.',
            elements: [
              '5-Year Big Vision Milestone Cards',
              'Inspirational Financial Freedom Quote Header',
              'Why Freedom Matters To Me Motivation Journal Box'
            ]
          },
          {
            pageNumber: 17,
            section: 'Dot Grid Notes & Calculations',
            title: 'Financial Calculations & Notes Grid',
            purpose: 'Scratchpad for mortgage calculations, side hustle pricing formulas, and financial notes.',
            layoutSpecs: '5mm dot grid with aesthetic minimalist botanical accents.',
            elements: [
              'Date, Goal Tag & Calculation Header',
              '5mm Dot Grid (#E0DCD5)',
              'Key Financial Action Item Checklist'
            ]
          }
        ]
      };

    // ─────────────────────────────────────────────────────────────────────────
    // 3. E-BOOKS & DIGITAL MASTERCLASSES (15–20 Modules)
    // ─────────────────────────────────────────────────────────────────────────
    case 'ebook':
      return {
        categoryName: 'Digital E-book & Comprehensive Masterclass Guide',
        targetAudience: 'Self-directed learners, professionals, and digital creators looking for actionable step-by-step systems',
        designAesthetic: 'High-end editorial publication, luxury typography, structured chapter frameworks, executive summary cards',
        dimensions: 'US Letter / A4 Vector E-book (PDF & Tablet Reader Optimized)',
        pageCount: 18,
        pages: [
          {
            pageNumber: 1,
            section: 'Book Cover & Title Spread',
            title: `${cleanP}`,
            purpose: 'Establish authoritative book cover, subtitle hook, author attribution, and luxury branding.',
            layoutSpecs: 'Full-bleed publication cover with clean typography, serif title, and brand imprint.',
            elements: [
              `Author / Publisher: "${bName}" in ${hFont}`,
              `Main Book Title: "${cleanP}"`,
              'Subtitle: "The Complete Step-by-Step Blueprint & Practical Framework"',
              'Official First Edition · 2026 Imprint'
            ]
          },
          {
            pageNumber: 2,
            section: 'Copyright & Reader License Pass',
            title: 'Copyright, License & Reader Welcome',
            purpose: 'Provide copyright declaration, personal use license terms, and digital companion download links.',
            layoutSpecs: 'Formal copyright page with ISBN placeholder, legal disclaimer, and companion portal QR/link.',
            elements: [
              '© 2026 ' + bName + '. All Rights Reserved.',
              'Personal Reader License & Anti-Piracy Protection Statement',
              'Link to Free Digital Companion Templates & Audio Bonuses',
              'How to Read & Apply This Guide for Maximum Results'
            ]
          },
          {
            pageNumber: 3,
            section: 'Table of Contents & Roadmap',
            title: 'Table of Contents & Core Framework Map',
            purpose: 'Provide hyperlinked jump navigation and visual 6-part framework overview.',
            layoutSpecs: 'Two-column chapter index with page numbers and descriptive chapter subheadings.',
            elements: [
              'Part 1: The Foundation & Mindset Reset (Chapters 1–2)',
              'Part 2: Core Execution Systems & Protocols (Chapters 3–4)',
              'Part 3: Advanced Optimization & Scaling (Chapters 5–6)',
              'Action Worksheets & Resource Appendices'
            ]
          },
          {
            pageNumber: 4,
            section: 'Author Introduction & The Problem',
            title: 'Author Introduction: Why Most Systems Fail',
            purpose: 'Build deep rapport with reader by addressing pain points and outlining the transformation.',
            layoutSpecs: 'Editorial layout with large quote pullout, author signature, and 3 core principles.',
            elements: [
              'The Core Dilemma: Complexity vs Execution',
              'The 3 Fundamental Principles of This Method',
              'Author Signature & Mission Statement'
            ]
          },
          {
            pageNumber: 5,
            section: 'Chapter 1: The Diagnostic & Assessment',
            title: 'Chapter 1: The Baseline Diagnostic & Audit',
            purpose: 'Guide the reader through auditing their current situation and identifying bottlenecks.',
            layoutSpecs: 'Full text chapter with diagnostic assessment rubric and self-scoring matrix.',
            elements: [
              'Chapter 1 Introduction & Core Philosophy',
              '10-Point Self-Assessment Scoring Rubric',
              'Identifying Your Primary Leak / Bottleneck',
              'Chapter 1 Key Takeaway Summary Card'
            ]
          },
          {
            pageNumber: 6,
            section: 'Chapter 1 Action Worksheet',
            title: 'Worksheet 1: The Clarity & Bottleneck Audit',
            purpose: 'Fillable reader worksheet to immediately apply Chapter 1 concepts.',
            layoutSpecs: 'Fillable prompt cards, scoring boxes, and personal commitment declaration.',
            elements: [
              'Fillable Audit Questions (Current State vs Desired State)',
              'Top 3 Energy & Time Drains Checklist',
              'My Non-Negotiable Commitment Statement'
            ]
          },
          {
            pageNumber: 7,
            section: 'Chapter 2: The Core Framework',
            title: 'Chapter 2: The Core Architecture & Philosophy',
            purpose: 'Deliver the foundational methodology that solves the core problem.',
            layoutSpecs: 'Text with visual 3-step diagram framework and step-by-step implementation rules.',
            elements: [
              'The 3-Pillar Execution Engine Explained',
              'Visual Blueprint Architecture Diagram',
              'Eliminating Friction: The Rule of Simplicity',
              'Chapter 2 Key Takeaway Summary Card'
            ]
          },
          {
            pageNumber: 8,
            section: 'Chapter 3: The Daily & Weekly Protocol',
            title: 'Chapter 3: The Daily Execution Protocol',
            purpose: 'Provide the exact daily, weekly, and monthly routines to implement the method.',
            layoutSpecs: 'Hour-by-hour time-blocking structure and weekly planning cadence.',
            elements: [
              'The 15-Minute Morning Power Protocol',
              'The Weekly Sunday Review & Reset Ritual',
              'Handling Chaos, Urgencies & Distractions'
            ]
          },
          {
            pageNumber: 9,
            section: 'Chapter 3 Implementation Template',
            title: 'Worksheet 2: Master Routine & Schedule Designer',
            purpose: 'Fillable schedule builder for reader to design their custom daily routine.',
            layoutSpecs: 'Weekly time-block grid and routine checklist.',
            elements: [
              'My Morning Routine Anchor Stack',
              'Deep Work Time Blocking Grid',
              'Evening Shutdown & Recovery Checklist'
            ]
          },
          {
            pageNumber: 10,
            section: 'Chapter 4: Tools, Automation & Shortcuts',
            title: 'Chapter 4: High-Leverage Tools & Automation',
            purpose: 'Recommend digital tools, AI prompts, and software shortcuts that save 10+ hours a week.',
            layoutSpecs: 'Comparison table of top tools, setup guides, and time-saving automation recipes.',
            elements: [
              'The Curated Tech & Tool Stack (Free vs Paid)',
              '3 Essential Automation Workflows to Set Up Today',
              'Common Pitfalls to Avoid When Tooling Up'
            ]
          },
          {
            pageNumber: 11,
            section: 'Chapter 5: Real-World Case Studies',
            title: 'Chapter 5: Real-World Case Studies & Transformations',
            purpose: 'Provide proof, inspiration, and actionable examples across different scenarios.',
            layoutSpecs: '2 deep-dive case studies with Before/After breakdowns and exact timelines.',
            elements: [
              'Case Study 1: The Overwhelmed Professional (30-Day Turnaround)',
              'Case Study 2: The Scaling Solopreneur (10x Output System)',
              'Key Lessons & Replicable Strategies'
            ]
          },
          {
            pageNumber: 12,
            section: 'Chapter 6: Troubleshooting & Long-Term Mastery',
            title: 'Chapter 6: Troubleshooting Obstacles & Scaling',
            purpose: 'Address common roadblocks, motivation slumps, and how to sustain momentum for years.',
            layoutSpecs: 'Q&A format troubleshooting matrix (When X happens, do Y).',
            elements: [
              'Overcoming the 14-Day Motivation Dip',
              'What to Do When Life Knocks You Off Track (The Reset Protocol)',
              'Scaling Up: When and How to Expand Your Goals'
            ]
          },
          {
            pageNumber: 13,
            section: 'The 30-Day Action Sprint',
            title: 'The 30-Day Step-by-Step Implementation Sprint',
            purpose: 'Day-by-day checklist translating the entire book into daily actionable tasks.',
            layoutSpecs: '4-week sprint tracker (Week 1 Setup, Week 2 Momentum, Week 3 Optimization, Week 4 Habituation).',
            elements: [
              'Week 1 (Days 1–7): Audit & Workspace Setup',
              'Week 2 (Days 8–14): Core Routine Execution',
              'Week 3 (Days 15–21): Friction Removal & Automation',
              'Week 4 (Days 22–30): Long-Term System Lock-In'
            ]
          },
          {
            pageNumber: 14,
            section: 'The Master Cheat Sheet & SOPs',
            title: 'Master 1-Page Summary & Protocol Cheat Sheet',
            purpose: 'Printable 1-page summary of all rules, formulas, and emergency reset protocols.',
            layoutSpecs: 'High-density, beautifully organized summary reference cheat sheet.',
            elements: [
              'The Core Rules at a Glance',
              'Emergency 5-Minute Reset Protocol',
              'Weekly Sunday Scorecard Formula'
            ]
          },
          {
            pageNumber: 15,
            section: 'Resource Vault & Recommended Reading',
            title: 'Resource Vault, Tool Directory & Book List',
            purpose: 'Curated links, templates, book recommendations, and community access.',
            layoutSpecs: 'Directory table categorized by Books, Software, Podcasts, and Printable Templates.',
            elements: [
              'Top 5 Recommended Books for Deep Mastery',
              'Direct Links to Companion GoodNotes / Notion Templates',
              'Exclusive Community Invitation & Support Channels'
            ]
          },
          {
            pageNumber: 16,
            section: 'Final Words & Certificate of Completion',
            title: 'Conclusion & Reader Completion Award',
            purpose: 'Celebrate the reader\'s journey and encourage them to leave an Etsy review.',
            layoutSpecs: 'Aspirational closing letter, certificate of completion, and review request card.',
            elements: [
              'Author Closing Reflection: "Your Journey Starts Now"',
              'Printable Certificate of Completion',
              'Etsy Review QR Code & VIP Customer Discount Code'
            ]
          }
        ]
      };

    // ─────────────────────────────────────────────────────────────────────────
    // 4. SEASONAL, HOLIDAY & EVENT PLANNERS (18–22 Pages)
    // ─────────────────────────────────────────────────────────────────────────
    case 'seasonal':
      return {
        categoryName: 'Seasonal & Holiday Master Planners',
        targetAudience: 'Holiday hosts, busy families, event organizers, and holiday enthusiasts',
        designAesthetic: 'Warm festive luxury, celebratory color harmonies, organized holiday timelines, stress-free hosting systems',
        dimensions: 'US Letter / A4 Vector PDF (GoodNotes & Print Ready)',
        pageCount: 18,
        pages: [
          {
            pageNumber: 1,
            section: 'Cover & Holiday Countdown',
            title: `${cleanP} · Master Holiday Edition`,
            purpose: 'Establish festive holiday tone, family countdown, and holiday vision.',
            layoutSpecs: 'Warm festive cover with elegant serif typography and holiday countdown badge.',
            elements: [
              `Brand Header: "${bName}" in ${hFont}`,
              `Product Title: "${cleanP}"`,
              'Holiday Season & Year Attribution',
              'Family Holiday Vision & Core Traditions Declaration'
            ]
          },
          {
            pageNumber: 2,
            section: 'Master Holiday Timeline',
            title: '6-Week Holiday Countdown & Checklist',
            purpose: 'Week-by-week checklist from 6 weeks prior down to holiday eve.',
            layoutSpecs: '6 milestone cards (6 Weeks Out, 4 Weeks, 2 Weeks, 1 Week, 2 Days, Holiday Day).',
            elements: [
              'Week-by-Week Milestones Checklist',
              'Key Shipping & Online Order Deadlines',
              'Decorating & Baking Kick-Off Dates'
            ]
          },
          {
            pageNumber: 3,
            section: 'Holiday Master Budget',
            title: 'Holiday Spending Dashboard & Budget',
            purpose: 'Set clear spending caps for gifts, food, decor, outfits, and travel.',
            layoutSpecs: 'Category budget cards with Projected vs Actual spend and savings envelope tracker.',
            elements: [
              'Gift Budget Total ($ Cap vs Actual)',
              'Groceries, Alcohol & Baking Budget',
              'Decor, Cards & Shipping Expenses Table',
              'Holiday Sinking Fund Balance'
            ]
          },
          {
            pageNumber: 4,
            section: 'Master Gift Registry (Part 1)',
            title: 'Family & Friends Gift List (Recipients 1–10)',
            purpose: 'Track gift ideas, sizes, store, budgeted price, purchase status, and wrapped status.',
            layoutSpecs: '10 recipient cards with checklist: Idea, Size, Store, $ Budget, Bought [✓], Wrapped [✓].',
            elements: [
              '10 Recipient Gift Planning Blocks',
              'Budget vs Spent Tracker per Person',
              'Wrapping & Shipping Checkboxes'
            ]
          },
          {
            pageNumber: 5,
            section: 'Master Gift Registry (Part 2)',
            title: 'Extended Family, Teachers & Coworkers Gift List',
            purpose: 'Track bulk gifts, neighbor treats, coworker gifts, and service provider tips.',
            layoutSpecs: 'Structured table for Teachers, Service Providers, Neighbors, and Secret Santa.',
            elements: [
              'Teacher & Service Provider Tip / Gift Log',
              'Coworker & Secret Santa Exchange Table',
              'DIY Homemade Treats & Bakes Gift Plan'
            ]
          },
          {
            pageNumber: 6,
            section: 'Online Order & Shipping Tracker',
            title: 'Online Orders & Package Delivery Tracker',
            purpose: 'Track all holiday parcel deliveries, tracking numbers, and arrival dates.',
            layoutSpecs: 'Table: Store, Items Ordered, Tracking #, Carrier, Expected Arrival, Received [✓].',
            elements: [
              'Package Delivery Checklist',
              'Carrier Tracking & Return Policy Log',
              'Hidden Gifts Stash Location Notes'
            ]
          },
          {
            pageNumber: 7,
            section: 'Holiday Dinner Menu & Prep Timeline',
            title: 'Multi-Course Holiday Feast Menu Planner',
            purpose: 'Plan appetizers, main course, side dishes, desserts, cocktails, and wine pairings.',
            layoutSpecs: 'Course-by-course menu cards with prep ahead indicators and dietary allergy warnings.',
            elements: [
              'Appetizers, Mains, Sides & Desserts Course Plan',
              'Signature Cocktail & Beverage Station Plan',
              'Guest Dietary Accommodations & Allergy Matrix'
            ]
          },
          {
            pageNumber: 8,
            section: 'Timed Kitchen Cooking Schedule',
            title: 'Holiday Day Minute-by-Minute Oven & Kitchen Schedule',
            purpose: 'Eliminate kitchen chaos with exact oven temperatures, cooking times, and rest periods.',
            layoutSpecs: 'Chronological timeline (7:00 AM through 7:00 PM Dinner) with oven rack allocation.',
            elements: [
              'Oven Temperature & Cooking Timeline',
              'Dishes to Prep 1–2 Days Ahead',
              'Stovetop & Warming Tray Allocations'
            ]
          },
          {
            pageNumber: 9,
            section: 'Holiday Feast Grocery Master Sheet',
            title: 'Categorized Holiday Grocery & Market List',
            purpose: 'Stress-free grocery shopping organized by supermarket aisle.',
            layoutSpecs: '4-column layout: Fresh Produce, Meat/Poultry, Dairy/Refrigerated, Pantry & Baking.',
            elements: [
              'Produce & Fresh Herbs Checklist',
              'Meat, Poultry & Seafood Orders',
              'Pantry Staples, Spices & Baking Supplies',
              'Beverages, Wine & Ice Checklist'
            ]
          },
          {
            pageNumber: 10,
            section: 'Guest List & Party RSVPs',
            title: 'Guest List, Invitations & Table Seating Plan',
            purpose: 'Manage party headcount, RSVPs, potluck contributions, and table place cards.',
            layoutSpecs: 'Guest list table with RSVP status, dietary notes, and assigned dish/beverage.',
            elements: [
              'Guest Names & RSVP Status (Adults & Kids Count)',
              'Potluck & Dish Assignments Log',
              'Dining Table Seating Arrangement Chart'
            ]
          },
          {
            pageNumber: 11,
            section: 'Holiday Traditions & Activity Bucket List',
            title: 'Family Traditions & Seasonal Bucket List',
            purpose: 'Ensure meaningful memories with tree lighting, ice skating, movie nights, and baking.',
            layoutSpecs: 'Visual bucket list with 20 festive activities and space for family favorites.',
            elements: [
              '20 Curated Holiday Activities & Traditions',
              'Holiday Movie & Music Playlist Log',
              'Light Viewing Tour Route & Cocoa Nights'
            ]
          },
          {
            pageNumber: 12,
            section: 'Holiday Card & Mailing List',
            title: 'Holiday Card Addresses & Mailing Tracker',
            purpose: 'Manage printed card orders, family photoshoots, addresses, and sent/received status.',
            layoutSpecs: 'Address book matrix with Printed [✓], Addressed [✓], Sent [✓], and Received [✓].',
            elements: [
              'Family Address Directory Table',
              'Card Photo Selection & Print Order Details',
              'Sent vs Received Annual Tracker'
            ]
          },
          {
            pageNumber: 13,
            section: 'Decor Inventory & Storage Plan',
            title: 'Home Decor Plan & Storage Box Inventory',
            purpose: 'Plan room-by-room decorations and catalog storage bins for easy cleanup.',
            layoutSpecs: 'Room decor cards (Mantel, Tree, Porch, Dining) + Storage Box number labels.',
            elements: [
              'Room-by-Room Decorating Vision & Lighting',
              'Replacement Bulbs & Tree Stand Inspection',
              'Numbered Storage Bin Catalog for Post-Holiday Packing'
            ]
          },
          {
            pageNumber: 14,
            section: 'Charity, Giving & Gratitude',
            title: 'Charity Giving, Toy Drive & Kindness Tracker',
            purpose: 'Foster the true spirit of the season through community giving and volunteer hours.',
            layoutSpecs: 'Giving cards for Angel Tree gifts, food drive donations, and random acts of kindness.',
            elements: [
              'Toy Drive & Angel Tree Adoption Details',
              'Food Bank Donation Box Checklist',
              '12 Days of Kindness Random Acts Log'
            ]
          },
          {
            pageNumber: 15,
            section: 'Post-Holiday Reflection & Next Year Notes',
            title: 'Post-Holiday Review & Next Year Lessons',
            purpose: 'Document what dishes were hits, what was over-bought, and notes for next year.',
            layoutSpecs: 'Reflection boxes for Menu adjustments, Budget review, and Favorite memories.',
            elements: [
              'What Food Was Loved vs Leftover',
              'Final Budget vs Actual Spend Review',
              'Top 3 Tips for Next Year Self'
            ]
          },
          {
            pageNumber: 16,
            section: 'Holiday Notes & Recipes Dot Grid',
            title: 'Family Recipe Notes & Dot Grid',
            purpose: 'Scratchpad for grandma\'s secret cookie recipe, party sketches, and holiday brain dump.',
            layoutSpecs: '5mm dot grid with festive botanical corner accent.',
            elements: [
              'Recipe Title, Prep Time & Ingredients Header',
              '5mm Dot Grid (#E0DCD5)',
              'Holiday Shopping Notes Footer'
            ]
          }
        ]
      };

    // ─────────────────────────────────────────────────────────────────────────
    // 5. DEFAULT: COMPREHENSIVE DAILY & WEEKLY PRODUCTIVITY PLANNERS (20 Pages)
    // ─────────────────────────────────────────────────────────────────────────
    default:
      return {
        categoryName: 'Daily, Weekly & Life Productivity Planners',
        targetAudience: 'Intentional professionals, busy moms, students, and productivity enthusiasts',
        designAesthetic: 'Minimalist botanical luxury, warm cream backgrounds, clean typography, low-friction time blocking',
        dimensions: 'US Letter (8.5 x 11 in) / A4 Vector PDF (GoodNotes & Print Ready)',
        pageCount: 20,
        pages: [
          {
            pageNumber: 1,
            section: 'Front Cover & Owner Registration',
            title: `${cleanP} · Edition 1.0`,
            purpose: 'Establish premium brand identity, ownership license attribution, and aesthetic tone.',
            layoutSpecs: 'Full-bleed minimalist cover with 0.5 in inner safe zone. Centered brand badge, serif headline, and ownership card.',
            elements: [
              `Brand Header: "${bName}" in ${hFont}`,
              `Product Title: "${cleanP}" (${primary})`,
              'Subtitle: "Aesthetic Intentional System for Daily Productivity & Growth"',
              'Fillable "This Planner Belongs To:" Name / Email attribution card',
              'Legal Disclaimer: "© 2026 ' + bName + '. All Rights Reserved. Personal Use License."'
            ]
          },
          {
            pageNumber: 2,
            section: 'System Quick-Start & Rituals',
            title: 'How To Use This Planner & Daily Planning Rituals',
            purpose: 'Guide buyer through daily time-blocking, weekly review rhythms, and habit anchoring.',
            layoutSpecs: '3-card walkthrough structure with daily routine tips and GoodNotes navigation guide.',
            elements: [
              'The 3-Step Daily Planning Method (Morning Intention, Time Block, Evening Review)',
              'Weekly Sunday Reset Routine (15-Minute Blueprint)',
              'Digital Handwriting & Hyperlink Navigation Tips'
            ]
          },
          {
            pageNumber: 3,
            section: 'Year-at-a-Glance & Index',
            title: 'Master Index & Annual Calendar Matrix',
            purpose: 'Provide high-level annual visibility and hyperlinked navigation jump points.',
            layoutSpecs: 'Two-column layout. Left: 12-month calendar mini-grids. Right: Quarterly milestones and navigation tabs.',
            elements: [
              '12 Mini Month Calendar Grids with shaded weekend headers',
              'Quarterly Focus Blocks (Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep, Q4 Oct–Dec)',
              'Annual Important Dates & Holiday Checklist'
            ]
          },
          {
            pageNumber: 4,
            section: 'Quarterly Vision & Goals',
            title: 'Quarterly Focus Map & OKR Roadmaps',
            purpose: 'Break annual aspirations into 4 manageable 90-day sprints with measurable outcomes.',
            layoutSpecs: '4-quadrant quarterly cards with Top 3 Outcomes, Key Metrics, and Habit Anchors.',
            elements: [
              'Q1, Q2, Q3, Q4 Primary Focus Objective',
              'Top 3 Needle-Mover Outcomes per Quarter',
              'Quarterly Reward Milestone Declarations'
            ]
          },
          {
            pageNumber: 5,
            section: 'Monthly Calendar & Intentions',
            title: 'Monthly Intentions & Calendar Overview',
            purpose: 'Set monthly high-level priorities, habit anchors, and key deadlines.',
            layoutSpecs: 'Upper third: 3 Focus Cards. Lower two-thirds: 5-week un-dated open calendar grid with habit side-column.',
            elements: [
              'Top 3 Priority Goals (Ranked 1, 2, 3 with checkboxes)',
              '5x7 Open Monthly Calendar Grid for universal undated reuse',
              'Side Column: Upcoming Bills Due & Monthly Habit Focus (5 habits)'
            ]
          },
          {
            pageNumber: 6,
            section: 'Weekly Execution (Monday – Thursday)',
            title: 'Weekly Master Plan (Part 1: Mon – Thu)',
            purpose: 'Structure weekly high-impact tasks and weekday schedule with time-blocking clarity.',
            layoutSpecs: 'Top bar: Weekly Focus. Body: 4 vertical day columns with 6:00 AM – 9:00 PM hourly schedule.',
            elements: [
              'Weekly Top 3 Non-Negotiables',
              '4 Vertical Column Schedules (Mon, Tue, Wed, Thu) with 1-hour intervals',
              'Daily Top 3 Priorities & Water Intake (8 cups)'
            ]
          },
          {
            pageNumber: 7,
            section: 'Weekly Execution (Friday – Sunday & Review)',
            title: 'Weekly Master Plan (Part 2: Fri – Sun & Reset)',
            purpose: 'Capture weekend priorities, lifestyle planning, meal prep, and weekly win review.',
            layoutSpecs: 'Left: 3 vertical day columns (Fri, Sat, Sun). Right: 7-Day Meal Planner + Grocery List + Win Review.',
            elements: [
              '3 Vertical Column Schedules (Fri, Sat, Sun)',
              '7-Day Meal Planning Grid & Grocery Checklist',
              'Weekly Win Review: "What worked well? What will I adjust?"'
            ]
          },
          {
            pageNumber: 8,
            section: 'Daily Deep Work Execution',
            title: 'Daily Focused Execution Matrix',
            purpose: 'Granular hourly time blocking, Eisenhower task triage, and mindfulness tracking.',
            layoutSpecs: 'Split 2-column layout. Left: 6:00 AM – 9:00 PM timeline. Right: Eisenhower Priority Grid & Gratitude.',
            elements: [
              'Date, Day of Week & Daily Intention header',
              '6:00 AM – 9:00 PM Time Blocking Schedule with 30-min divider ticks',
              'Eisenhower Priority Grid: Must Do, Should Do, Could Do',
              'Daily Gratitude & Win of the Day prompt'
            ]
          },
          {
            pageNumber: 9,
            section: 'Daily Morning & Evening Rituals',
            title: 'Daily Morning & Evening Anchor Rituals',
            purpose: 'Build consistent start-of-day and end-of-day mindfulness routines for peak focus.',
            layoutSpecs: 'Two-column spread for Morning Energizers and Evening Wind-Down Checklist.',
            elements: [
              'Morning Anchor Stack (Hydrate, Movement, Mindset, Top Priority)',
              'Evening Wind-Down Checklist (Screen-off, Clean Desk, Tomorrow Prep)',
              'Daily Energy & Mood Check-In'
            ]
          },
          {
            pageNumber: 10,
            section: '30-Day Habit Matrix & Consistency',
            title: '30-Day Habit Matrix & Streak Tracker',
            purpose: 'Build consistent daily routines with visual gamification and milestone check-ins.',
            layoutSpecs: 'Full-width matrix with 20 habit rows and 31 numbered circular check-bubbles across columns.',
            elements: [
              '20 Habit Rows with category tags (Morning, Health, Work, Evening)',
              '31-Day Check Circles with shaded 7-day milestone dividers',
              'Milestone Reward Cards (7-Day Streak, 14-Day Streak, 30-Day Perfection)'
            ]
          },
          {
            pageNumber: 11,
            section: 'Project Planning & Sprint Tracker',
            title: 'Master Project Planner & Sprint Roadmap',
            purpose: 'Break any complex business, home, or personal initiative into actionable phases.',
            layoutSpecs: 'Project Overview card, 3-Phase Milestone Roadmap, and Task Action Checklist with assignees.',
            elements: [
              'Project Title, Scope & Target Completion Date',
              '3 Execution Phases (Phase 1 Foundation, Phase 2 Build, Phase 3 Launch)',
              '15-Point Action Checklist with Due Dates & Dependencies'
            ]
          },
          {
            pageNumber: 12,
            section: 'Monthly Financial Health Snapshot',
            title: 'Monthly Cash Flow, Expenses & Savings Tracker',
            purpose: 'Track monthly income streams, fixed/variable expenses, and debt payoff progress.',
            layoutSpecs: '3 KPI summary cards at top. 2 side-by-side tables for Fixed Bills and Variable Spending.',
            elements: [
              'KPI Cards: Income ($), Expenses ($), Savings Rate (%)',
              'Fixed Recurring Bills Checklist (Bill Name, Due Date, Actual, Paid)',
              'Variable Daily Expense Log & Savings Goal Progress Thermometer'
            ]
          },
          {
            pageNumber: 13,
            section: 'Self-Care & Wellness Check-In',
            title: 'Monthly Wellness & Self-Care Audit',
            purpose: 'Prevent burnout by tracking physical health, mental recharge, and leisure time.',
            layoutSpecs: '4-dimension wellness wheel (Physical, Emotional, Mental, Spiritual) + Self-care ideas menu.',
            elements: [
              'Monthly Wellness Rating Scale (1–10 across 4 areas)',
              'Self-Care Activities Menu (15-min, 30-min, Full Day)',
              'Sleep & Hydration Monthly Averages'
            ]
          },
          {
            pageNumber: 14,
            section: 'Reading & Learning Tracker',
            title: 'Book Log & Professional Growth Tracker',
            purpose: 'Track finished books, courses, podcasts, and actionable insights.',
            layoutSpecs: 'Bookshelf graphic cards with Title, Author, Rating (5 stars), and Key Takeaway bullet points.',
            elements: [
              'Visual Bookshelf Tracker for 12 Books',
              'Rating & Key Takeaway Notes per Book',
              'Wishlist of Books & Courses to Explore'
            ]
          },
          {
            pageNumber: 15,
            section: '90-Day Vision & Reflection',
            title: '90-Day Vision & Milestone Review',
            purpose: 'Translate high-level aspirations into actionable 3-phase OKR execution plans.',
            layoutSpecs: 'Top: Primary 90-Day Outcome Goal. Body: 3 Milestone checkpoints with weekly action items.',
            elements: [
              'Primary Goal Declaration with Target Date & Core Motivation',
              '3 Milestone Cards (Month 1, Month 2, Month 3)',
              'Obstacle & Solution Contingency Matrix'
            ]
          },
          {
            pageNumber: 16,
            section: 'Brain Dump & Dot Grid Notes',
            title: 'Ideas, Mind Maps & Dot Grid Notes',
            purpose: 'Unstructured creative thinking, meeting notes, project sketches, and brain dump.',
            layoutSpecs: 'Clean 5mm vector dot grid across canvas with subtle minimalist botanical corner motif.',
            elements: [
              'Header: Date, Subject & Project Tag',
              '5mm Vector Dot Grid (#E0DCD5)',
              'Action Items & Next Steps Footer'
            ]
          }
        ]
      };
  }
}

/**
 * Generate Complete Deterministic Blueprint with Category Intelligence
 */
function generateCategoryBlueprint(pName, bName, niche, voice, palette, fonts, pType, categoryName) {
  const cleanP = pName.replace(/^[A-Z]\d+\s*[-–]\s*/, '');
  const catId = resolveCategory(cleanP, categoryName, pType);

  let hFont = 'Playfair Display';
  let bFont = 'Lato';
  if (typeof fonts === 'string' && fonts.includes('+')) {
    const parts = fonts.split('+').map(s => s.trim());
    hFont = parts[0] || hFont;
    bFont = parts[1] || bFont;
  } else if (fonts && typeof fonts === 'object') {
    hFont = fonts.heading || fonts.headingFont || hFont;
    bFont = fonts.body || fonts.bodyFont || bFont;
  }

  const colors = Array.isArray(palette) && palette.length > 0
    ? palette
    : ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'];

  const config = getCategoryConfig(catId, cleanP, bName, colors, { heading: hFont, body: bFont });

  const primaryColor = colors[0] || '#8B5A7A';
  const bgTint = colors[1] || '#FAF3E8';
  const secondaryColor = colors[2] || '#7D9B76';
  const highlightColor = colors[3] || '#C4887C';
  const textColor = colors[4] || '#2E2E2E';

  const googleFlowPrompt =
    `BRAND & PRODUCT DESIGN BRIEF (CATEGORY: ${config.categoryName.toUpperCase()})\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Brand: ${bName} | Niche: ${niche || 'Digital Products'}\n` +
    `Product Title: "${cleanP}"\n` +
    `Category: ${config.categoryName}\n` +
    `Target Audience: ${config.targetAudience}\n` +
    `Design Aesthetic: ${config.designAesthetic}\n\n` +
    `VISUAL IDENTITY SYSTEM\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Color Palette:\n` +
    `  • Primary Accent: ${primaryColor}\n` +
    `  • Background / Fill: ${bgTint}\n` +
    `  • Secondary Accent: ${secondaryColor}\n` +
    `  • Highlight: ${highlightColor}\n` +
    `  • Body Text: ${textColor}\n\n` +
    `Typography Hierarchy:\n` +
    `  • Headings & Spread Titles: ${hFont} (Elegant, refined serif)\n` +
    `  • Table Headers, Body & Labels: ${bFont} (Clean, high-legibility sans-serif)\n` +
    `  • Callouts & Quotes: Cormorant Garamond (Italic — soft and inspiring)\n\n` +
    `PAGE-BY-PAGE DESIGN SPECIFICATIONS (${config.pages.length} SPREADS TOTAL)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    config.pages.map(p =>
      `PAGE ${p.pageNumber} — ${p.title.toUpperCase()} (${p.section})\n` +
      `Purpose: ${p.purpose}\n` +
      `Layout: ${p.layoutSpecs}\n` +
      `Required Elements:\n` +
      p.elements.map(el => `  • ${el}`).join('\n') +
      `\n`
    ).join('\n') +
    `OUTPUT INSTRUCTIONS FOR AI AGENT / GOOGLE FLOW:\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Generate each page as a VISUAL DESIGN IMAGE in 3:4 PORTRAIT ASPECT RATIO (matching A4 / US Letter portrait orientation — width:height = 3:4).\n\n` +
    `Process all ${config.pages.length} pages SEQUENTIALLY, one after the other:\n` +
    config.pages.map(p => `  Step ${p.pageNumber}: Generate visual layout for Page ${p.pageNumber} — "${p.title}"`).join('\n') + `\n\n` +
    `Design Guidelines per spread:\n` +
    `  • Background colour: ${bgTint} (warm cream / off-white)\n` +
    `  • Apply the exact hex colours (${primaryColor}, ${secondaryColor}) and font hierarchy above\n` +
    `  • Use crisp table cells, rounded corners (8px radius), and clean divider lines\n` +
    `  • All text labels, column headers, and fillable checkboxes must be razor-sharp and legible\n` +
    `  • Ensure print-ready 300 DPI vector clarity and seamless iPad / GoodNotes digital handwriting experience\n` +
    `  • DO NOT add random AI watermark artifacts or extra borders beyond the design spec\n` +
    `  • Keep the design elegant, aspirational, and true to the ${bName} brand voice: ${voice || 'warm, empowering, and practical'}\n`;

  return {
    productName: cleanP,
    brandName: bName,
    categoryName: config.categoryName,
    targetAudience: config.targetAudience,
    documentSpecs: {
      dimensions: config.dimensions,
      margins: '0.5 in (12.7 mm) safe printing zone',
      pageCount: `${config.pages.length} Core Master Spreads`,
      colorSystem: {
        primaryAccent: primaryColor,
        backgroundTint: bgTint,
        secondaryAccent: secondaryColor,
        highlight: highlightColor,
        darkText: textColor
      },
      typography: {
        headingFont: hFont,
        bodyFont: bFont,
        accentFont: 'Cormorant Garamond (Italic)'
      }
    },
    pageBreakdown: config.pages,
    googleFlowPrompt,
    storageArchitecture: {
      recommendedPath: `brands/${bName.toLowerCase().replace(/[^a-z0-9]/g, '_')}/${cleanP.toLowerCase().replace(/[^a-z0-9]/g, '_')}/v1.0/deliverable.pdf`,
      fileType: 'PDF (Interactive & Printable)',
      targetFileSize: '4–12 MB'
    },
    antiPiracyDelivery: {
      etsyUploadItem: '1-Page Branded GRO10X Access & License Pass (PDF)',
      deliveryPortalUrl: `https://gro10x-ai.vercel.app/delivery?brand=${encodeURIComponent(bName)}&product=${encodeURIComponent(cleanP)}`,
      watermarkTemplate: `Exclusively Licensed to: [Buyer Name] · Order #[Etsy_Receipt_ID] · License ID: GRO-LIC-XXXX · Personal Use Only · Resale Strictly Prohibited`
    }
  };
}

/**
 * Generate Category-Specific 10 Mockup Scenes
 */
function generateCategoryMockups(pName, bName, niche, voice, palette, fonts, pType, categoryName) {
  const cleanP = pName.replace(/^[A-Z]\d+\s*[-–]\s*/, '');
  const catId = resolveCategory(cleanP, categoryName, pType);

  const colors = Array.isArray(palette) && palette.length > 0
    ? palette
    : ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'];

  const primaryColor = colors[0] || '#8B5A7A';
  const bgTint = colors[1] || '#FAF3E8';
  const secondaryColor = colors[2] || '#7D9B76';

  let mockups = [];

  switch (catId) {
    case 'academic':
      mockups = [
        { number: 1, title: 'Hero Classroom iPad Flat-Lay (Main Thumbnail)', type: 'Hero Listing Thumbnail', scene: `Professional studio photography in 3:4 portrait ratio of an iPad Pro displaying the aesthetic academic cover of "${cleanP}" by ${bName}. Resting on a clean teacher's desk alongside highlighters, reading glasses, a wooden pencil cup, and soft botanical eucalyptus in morning sunlight. 8k resolution commercial Etsy photo.` },
        { number: 2, title: 'Weekly 5-Subject Lesson Plan Spread', type: 'Spread Showcase', scene: `Angled top-down view of the Weekly 5-Subject Lesson Plan Spread from "${cleanP}" open on desk. Color-coded mildliner highlights in pastel tones across Math, ELA, and Science boxes. Crisp legible typography.` },
        { number: 3, title: 'Teacher POV Writing in Lesson Book', type: 'Human Interaction', scene: `First-person point-of-view of a teacher's hands writing lesson objectives into "${cleanP}" with a fine-tip gel pen. Cozy classroom setting, warm morning window light.` },
        { number: 4, title: 'Gradebook & Assessment Log Macro Detail', type: 'Feature Deep-Dive', scene: `Macro close-up shot focusing on the Class Gradebook and Assessment Tracker page with neat checkmarks and test scores. High-resolution vector clarity, soft depth of field.` },
        { number: 5, title: '22-Page Cascading 3D Bundle Fan', type: 'Scope & Value Showcase', scene: `All 22 core pages of "${cleanP}" fanned out in a cascading 3D isometric stack revealing Lesson Plans, Gradebook, IEP Tracker, Seating Chart, and Calendars together. Bold value banner.` },
        { number: 6, title: 'Teacher Desk Aerial Overview Workspace', type: 'Aspirational Lifestyle', scene: `Overhead bird's-eye flat lay of an organized teacher workspace: planner tablet centered, laptop open with school portal, ceramic coffee mug, notebook, and grading pens. Clean color harmony in ${primaryColor}.` },
        { number: 7, title: 'Student Roster & IEP Accommodations Spread', type: 'Practical Feature', scene: `Angled spread view of the Student Roster and IEP Accommodations Tracker side by side. Professional, confidential, and beautifully organized format.` },
        { number: 8, title: 'Substitute Teacher Emergency Sheet Overview', type: 'Peace of Mind Feature', scene: `Clean tabletop photo of the Substitute Teacher Info Sheet printed on premium matte paper with a gold clip, alongside keys and badge.` },
        { number: 9, title: 'Multi-Device & Printable A4 Compatibility', type: 'Buyer Reassurance', scene: `Split graphic showing iPad with Apple Pencil, laptop, and printed A4 paper stack showing matching "${cleanP}" spreads. Badge: "GoodNotes · Notability · Printable PDF".` },
        { number: 10, title: '5-Star Teacher Transformation Review', type: 'Social Proof', scene: `Aesthetic review card graphic with 5 golden stars, a lifestyle photo of "${cleanP}", and teacher testimonial: "Completely saved my lesson prep time and reduced my Sunday stress!"` }
      ];
      break;

    case 'finance':
      mockups = [
        { number: 1, title: 'Hero Luxury Financial iPad Flat-Lay (Main Thumbnail)', type: 'Hero Listing Thumbnail', scene: `Professional flat-lay photo in 3:4 portrait ratio of an iPad Pro displaying the cover of "${cleanP}" by ${bName}. Resting on a luxury cream desk beside a sleek gold calculator, leather notebook, and brass pen in warm morning sunlight. 8k commercial listing photo.` },
        { number: 2, title: 'Zero-Based Monthly Budget Master Spread', type: 'Spread Showcase', scene: `Open two-page spread view of the Zero-Based Monthly Budget from "${cleanP}" on oak desk. Coffee cup with latte art in background, reading glasses, pastel highlighter. Clean vertical columns clearly visible.` },
        { number: 3, title: 'Hands Writing in Debt Snowball Payoff Tracker', type: 'Human Interaction', scene: `First-person POV photo of hands holding a fine pen, filling in debt payoff milestone thermometer in "${cleanP}". Empowering financial wellness feeling.` },
        { number: 4, title: 'Sinking Funds & Cash Envelopes Macro Close-Up', type: 'Feature Deep-Dive', scene: `Macro close-up shot of the Cash Envelopes and Sinking Funds page with clear balance entries. High-resolution typography, soft depth of field.` },
        { number: 5, title: '20-Page Cascading Financial System Stack', type: 'Value Showcase', scene: `All 20 core pages of "${cleanP}" fanned out in a 3D isometric stack showing Budget, Cash Flow, Bills Calendar, Debt Tracker, and Net Worth Dashboard together.` },
        { number: 6, title: 'Wealth Desk Aerial Lifestyle', type: 'Aspirational Lifestyle', scene: `Overhead flat lay of an executive desk: planner tablet centered, laptop open with investment charts, small succulent, scented candle, notebook, and ceramic dish.` },
        { number: 7, title: 'Net Worth & Annual Income Dashboard Spread', type: 'Transformation Feature', scene: `Clean angled shot of the Net Worth Dashboard and Annual Income Planner pages side by side. Minimalist gold paperclips, clean calculator, and motivational quote card.` },
        { number: 8, title: '10k Emergency Fund Savings Challenge Spread', type: 'Gamification Feature', scene: `Perspective shot of the 100-Block Emergency Fund Savings Challenge page with half the blocks neatly colored in pastel green ink (#7D9B76). Inspiring momentum.` },
        { number: 9, title: 'Instant Download & Device Stack', type: 'Buyer Reassurance', scene: `Split graphic showing iPhone, iPad tablet with Apple Pencil, and printable A4 budget sheet all showing matching "${cleanP}" layout. Badge: "Instant Digital Download · GoodNotes · Print at Home".` },
        { number: 10, title: 'Customer Financial Freedom Review Card', type: 'Social Proof', scene: `Aesthetic review card graphic with 5 golden stars, a lifestyle crop of "${cleanP}", and quote: "Paid off $8,000 of debt in 6 months using this exact budget spread!"` }
      ];
      break;

    case 'seasonal':
      mockups = [
        { number: 1, title: 'Hero Festive Holiday iPad Flat-Lay (Main Thumbnail)', type: 'Hero Listing Thumbnail', scene: `Warm cozy holiday flat-lay photography in 3:4 portrait orientation of an iPad Pro displaying the festive cover of "${cleanP}" by ${bName}. Resting on a rustic cream tabletop surrounded by pine cones, cinnamon sticks, twinkling fairy lights, and holiday ribbon. 8k resolution.` },
        { number: 2, title: 'Holiday Feast Menu & Oven Cooking Timeline Spread', type: 'Spread Showcase', scene: `Two-page open spread of the Multi-Course Dinner Menu and Kitchen Cooking Schedule from "${cleanP}" on kitchen counter beside fresh cranberries and rosemary.` },
        { number: 3, title: 'Hands-in-Frame Writing Holiday Gift List', type: 'Human Interaction', scene: `First-person POV of hands writing recipient names into the Master Gift Registry with gold pen, surrounded by wrapped gift boxes with velvet ribbons.` },
        { number: 4, title: 'Master Gift Budget & Shopping Tracker Close-Up', type: 'Feature Deep-Dive', scene: `Macro close-up of the Gift Registry page with Bought [✓] and Wrapped [✓] checkmarks filled in. Crisp festive typography, soft warm bokeh.` },
        { number: 5, title: '18-Page Cascading Holiday Master Stack', type: 'Value Showcase', scene: `All 18 core spreads of "${cleanP}" dynamically fanned out in a cascading 3D isometric stack revealing Menu, Gifts, Budget, Countdown, and Guest List together.` },
        { number: 6, title: 'Festive Living Room Coffee Table Setting', type: 'Aspirational Lifestyle', scene: `Cozy living room setting with planner tablet resting on coffee table next to warm gingerbread cookies, steaming mug of hot cocoa, and Christmas tree glow in background.` },
        { number: 7, title: 'Guest List & RSVP Table Seating Spread', type: 'Host Planning Feature', scene: `Angled view of the Guest List & Table Seating Plan spread beside formal dining dinnerware and cloth napkins.` },
        { number: 8, title: 'Online Delivery & Package Tracking Log', type: 'Practical Feature', scene: `Clean shot of the Package Tracker page with carrier tracking numbers alongside cardboard parcels with holiday tape.` },
        { number: 9, title: 'Instant Download & Printable Recipe / Gift Cards', type: 'Buyer Reassurance', scene: `Multi-device graphic showing smartphone, iPad, and printed A4 holiday checklists. Badge: "Instant Download · Stress-Free Holiday Planning".` },
        { number: 10, title: '5-Star Holiday Host Review Card', type: 'Social Proof', scene: `Aesthetic review card with 5 golden stars, a festive photo of "${cleanP}", and quote: "The most organized, stress-free Christmas our family has ever had!"` }
      ];
      break;

    case 'ebook':
      mockups = [
        { number: 1, title: 'Hero 3D Digital E-book & iPad Pro Display (Main Thumbnail)', type: 'Hero Listing Thumbnail', scene: `Professional 3D mockup in 3:4 portrait orientation displaying the luxury e-book cover of "${cleanP}" by ${bName} rendered as an elegant hardcover book standing beside an iPad Pro showing chapter text. Warm cream aesthetic background with soft shadows. 8k commercial photo.` },
        { number: 2, title: 'Open Chapter Spread & Key Framework Diagram', type: 'Content Showcase', scene: `Open two-page reading spread of Chapter 2 from "${cleanP}" showing high-end editorial typography, clear headers, and a central execution diagram. Clean scandinavian desk setting.` },
        { number: 3, title: 'Reader POV Highlighting Key Concepts', type: 'Human Interaction', scene: `First-person POV photo of hands holding an iPad Pro with Apple Pencil, actively highlighting key actionable frameworks in "${cleanP}". Cozy armchair and warm morning coffee.` },
        { number: 4, title: 'Fillable Action Worksheet & Diagnostic Rubric', type: 'Practical Application', scene: `Angled close-up of the Chapter 1 Diagnostic Worksheet with fillable question prompts and scoring cards. Crisp vector lines, soft depth of field.` },
        { number: 5, title: 'Full 16-Module Complete System Overview Stack', type: 'Value Showcase', scene: `Cascading 3D display of all 16 book modules, chapter worksheets, SOP cheat sheets, and 30-day action sprint stacked together with a "Complete Masterclass System" badge.` },
        { number: 6, title: 'Desk Reading Setup with Coffee & Notes', type: 'Aspirational Lifestyle', scene: `Overhead flat lay of an executive study desk: iPad displaying e-book, notebook with handwritten action items, ceramic mug, reading glasses, and laptop.` },
        { number: 7, title: 'Master 1-Page Protocol Cheat Sheet Close-Up', type: 'Quick Reference Feature', scene: `Clean photo of the 1-Page Summary Cheat Sheet printed out on premium paper, pinned to a bulletin board next to a computer monitor.` },
        { number: 8, title: '30-Day Step-by-Step Sprint Action Plan', type: 'Implementation Feature', scene: `Angled view of the 30-Day Day-by-Day Implementation Checklist showing week-by-week progress badges and milestone checkmarks.` },
        { number: 9, title: 'Multi-Device Universal Reader Compatibility', type: 'Buyer Reassurance', scene: `Split graphic showing iPhone (Kindle/Apple Books), iPad Pro, and PDF printout all displaying matching "${cleanP}" layout. Badge: "Instant PDF Download · Compatible with All Devices".` },
        { number: 10, title: '5-Star Reader Transformation Review Card', type: 'Social Proof', scene: `Aesthetic review card with 5 golden stars, a 3D book mockup of "${cleanP}", and reader review: "Clear, practical, and zero fluff. Completely transformed how I work!"` }
      ];
      break;

    default:
      mockups = [
        { number: 1, title: 'Hero iPad Pro Flat-Lay (Main Etsy Listing Thumbnail)', type: 'Primary Listing Hero', scene: `Professional studio flat-lay photography of an iPad Pro in 3:4 portrait orientation displaying the clean aesthetic cover of "${cleanP}" by ${bName}. Resting on a luxurious warm cream desk surface alongside a sleek minimalist brass pen, soft botanical eucalyptus branches, and gentle natural morning shadows. 8k, hyper-detailed commercial photo.` },
        { number: 2, title: 'Open Two-Page Master Spread Overview', type: 'Spread Showcase', scene: `Two-page open spread of "${cleanP}" lying flat on a modern scandinavian oak desk. Ceramic coffee mug with latte art in background, reading glasses, pastel highlighter. Clean vertical daily/weekly columns clearly readable. 3:4 portrait format.` },
        { number: 3, title: 'Lifestyle POV Writing & Planning in Cafe', type: 'Human Connection & Scale', scene: `First-person point-of-view photo of a well-manicured hand holding an elegant fine-tip pen, actively writing notes into "${cleanP}". Soft knit cozy sweater sleeve, warm morning ambience, diffused natural window light.` },
        { number: 4, title: 'Macro Close-Up on Habit & Task Tracking Spread', type: 'Feature Deep-Dive', scene: `Macro angled close-up view of the primary tracking spread from "${cleanP}". A gold pen rests across the grid with delicate checkmarks. High-resolution crisp typography, soft depth of field, bright daylight.` },
        { number: 5, title: '20-Page Cascading 3D Bundle Stack', type: 'Value & Scope Showcase', scene: `All core pages of "${cleanP}" dynamically fanned out in a cascading 3D isometric stack, revealing cover, monthly calendar, daily spread, habit tracker, and budget sheet together. Subtle realistic drop shadows.` },
        { number: 6, title: 'Desk Aerial Overview Workspace', type: 'Aspirational Lifestyle', scene: `Wide overhead bird's-eye flat lay of an entire productive desk workspace: planner tablet centered, laptop open with ambient screen, small potted succulent, scented candle, notebook, and ceramic dish. Colors harmonized in ${primaryColor}.` },
        { number: 7, title: 'Instant Download & Device Stack', type: 'Etsy Purchase Reassurance', scene: `Clean graphic showing a smartphone, iPad tablet with Apple Pencil, and printable A4 paper stack, all displaying matching layouts from "${cleanP}". Aesthetic badge: "Instant Digital Download · GoodNotes · Print at Home".` },
        { number: 8, title: '90-Day Goal & Financial Flow Spread', type: 'Transformation & Goals', scene: `Clean angled shot of the 90-Day Goal Roadmap and Cash Flow pages side by side. Minimal gold paperclips, clean calculator, and motivational quote card. High aspirational value.` },
        { number: 9, title: 'Printable A4 / US Letter Comparison', type: 'Print Flexibility', scene: `Crisp photo of printed planner pages held in hands or pinned to an aesthetic moodboard. Clean white borders, premium matte paper texture, crisp lines.` },
        { number: 10, title: 'Customer Transformation Review Card', type: 'Social Proof Showcase', scene: `Aesthetic review card graphic with 5 golden stars, a lifestyle crop of "${cleanP}", and quote: "Completely transformed my daily routine and focus."` }
      ];
  }

  const masterMockupPrompt =
    `BRAND & MOCKUP VISUAL PRODUCTION BRIEF (${catId.toUpperCase()})\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Brand: ${bName} | Niche: ${niche || 'Digital Products'}\n` +
    `Product: "${cleanP}"\n` +
    `Brand Colors: ${colors.join(', ')}\n` +
    `Typography: ${fonts}\n` +
    `Aesthetic Style: Minimalist luxury, warm natural morning lighting, clean editorial depth.\n\n` +
    `INSTRUCTIONS FOR AI AGENT / GOOGLE FLOW / MIDJOURNEY / FLUX:\n` +
    `Generate 10 distinct, high-converting Etsy listing mockup images in 3:4 PORTRAIT aspect ratio, sequentially one after the other:\n\n` +
    mockups.map(m =>
      `MOCKUP #${m.number} — ${m.title.toUpperCase()} (${m.type})\n` +
      `Prompt: ${m.scene}\n` +
      `Aspect Ratio: 3:4 Portrait | High resolution 300 DPI vector clarity | Realistic photographic textures\n`
    ).join('\n') +
    `\nOUTPUT GUIDELINES:\n` +
    `• Process all 10 mockup scenes one by one in sequence\n` +
    `• Maintain consistent brand color palette across all images\n` +
    `• Ensure high-end commercial photo realism with soft natural lighting and realistic props\n`;

  const videoPrompt =
    `🎥 10-SECOND ETSY LISTING VIDEO PROMPT\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Tool: Google Flow / Kling AI / Runway Gen-3 / Pika / Sora\n` +
    `Duration: 10 Seconds | Format: 4:5 Portrait (Etsy Video) or 9:16 (Reels/TikTok)\n` +
    `Product: "${cleanP}" by ${bName}\n` +
    `Color Grade: Warm cream tones (${bgTint}), soft mauve accents (${primaryColor}), natural golden hour window light\n` +
    `Music / Audio: Relaxing lo-fi acoustic guitar / soft piano instrumental (no vocals)\n\n` +
    `TIMELINE & SCENE TRANSITIONS (10 SECONDS TOTAL):\n\n` +
    `• [0:00 – 0:02s] SCENE 1 — OPENING HOOK (Slow Gliding Pan):\n` +
    `  Camera smoothly glides over a sunlit minimalist desk with coffee and botanical flowers, landing on the unopened aesthetic cover of "${cleanP}".\n\n` +
    `• [0:02 – 0:04s] SCENE 2 — THE OPENING (Smooth Page Turn):\n` +
    `  A hand gently turns the cover to reveal the Getting Started guide and Master Index spread with soft depth of field.\n\n` +
    `• [0:04 – 0:06s] SCENE 3 — CORE SPREADS (Fast Smooth Flip):\n` +
    `  Smooth cinematic page-flip motion displaying the primary planning matrices and tracking spreads in high resolution.\n\n` +
    `• [0:06 – 0:08s] SCENE 4 — INTERACTION & ACTIVE USE (Macro Close-Up):\n` +
    `  Close-up shot of a fine-tip gold pen smoothly ticking a checklist bubble, showing tactile satisfaction and clarity.\n\n` +
    `• [0:08 – 0:10s] SCENE 5 — CALL TO ACTION (Pull-Back & Text Fade):\n` +
    `  Camera pulls back to full styled desk view as elegant serif text fades onto screen: "${cleanP} — Instant Digital Download · GoodNotes & Printable".\n`;

  return {
    productName: cleanP,
    brandName: bName,
    mockups,
    masterMockupPrompt,
    videoPrompt
  };
}

module.exports = {
  resolveCategory,
  generateCategoryBlueprint,
  generateCategoryMockups
};
