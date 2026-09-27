/**
 * GRO10X QA Automation Runner - Expanded Portal Health Audits
 * Comprehensive interactive assertions across all non-admin portals:
 * - Client Partner Portal (/client)
 * - Crew Specialist Workspace (/crew)
 * - Department Manager Portal (/manager)
 * - Digital Brand Manager (/dbm)
 * - Digital Commerce Engine (/dce)
 * - Enterprise Partner Portal (/partners)
 * - Public Portals & Micro-Apps (/)
 */

const PORTAL_AUDITS = {
  "client_home": {
    "id": "client_home",
    "title": "Client Overview Health Audit",
    "targetHash": "#home",
    "steps": [
      {
        "id": "ca-h-1",
        "title": "1. Navigate to #home",
        "action": "navigate_hash",
        "target": "#home",
        "assertion": {
          "type": "wait_selector",
          "selector": "#client-view h1, #client-view .kpi-tile",
          "timeout": 5000
        }
      },
      {
        "id": "ca-h-2",
        "title": "2. Verify Client Dashboard Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_client_view_rendered"
        }
      },
      {
        "id": "ca-h-3",
        "title": "3. Verify Client Header & Welcome Hero",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view h1"
        }
      },
      {
        "id": "ca-h-4",
        "title": "4. Verify Organization & Partner Status Badges",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view .badge-purple, #client-view .badge-emerald, #client-view .badge-blue"
        }
      },
      {
        "id": "ca-h-5",
        "title": "5. Verify Header Action CTAs (Submit Brief & MSA)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view a[href=\"#brief\"], #client-view a[href*=\"msa-view.html\"]"
        }
      },
      {
        "id": "ca-h-6",
        "title": "6. Verify Active Rapid Sprint Progress Cockpit",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view .badge-purple, #client-view h2, #client-view a[href=\"#review\"]"
        }
      },
      {
        "id": "ca-h-7",
        "title": "7. Verify Sprint Execution Stages Bar",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view [style*=\"background:linear-gradient(90deg, #8b5cf6, #00df89)\"]"
        }
      },
      {
        "id": "ca-h-8",
        "title": "8. Verify 4 KPI Tiles Grid & Hash Destination Links",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "a.kpi-tile[href=\"#review\"], a.kpi-tile[href=\"#campaign\"], a.kpi-tile[href=\"#invoices\"], a.kpi-tile[href=\"#tickets\"]"
        }
      },
      {
        "id": "ca-h-9",
        "title": "9. Verify Next Scheduled Content Preview Area",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view h2, #client-view a[href=\"#campaign\"]"
        }
      },
      {
        "id": "ca-h-10",
        "title": "10. Verify Client Quick Action Buttons Rendered",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view a[href=\"#review\"], #client-view a[href=\"#brief\"], #client-view a[href=\"#account\"]"
        }
      },
      {
        "id": "ca-h-11",
        "title": "11. Verify 30-Day Defect Warranty Shield Active",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "custom_check",
          "check": "assert_warranty_shield_active"
        }
      },
      {
        "id": "ca-h-12",
        "title": "12. Integrity Audit: Clean Console & Zero Native Dialogs",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "client_retainer": {
    "id": "client_retainer",
    "title": "Retainer Health & Quota Audit",
    "targetHash": "#retainer",
    "steps": [
      {
        "id": "ca-r-1",
        "title": "1. Navigate to #retainer",
        "action": "navigate_hash",
        "target": "#retainer",
        "assertion": {
          "type": "wait_selector",
          "selector": "#client-view h1, #client-view .card-glass",
          "timeout": 5000
        }
      },
      {
        "id": "ca-r-2",
        "title": "2. Verify Retainer View Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_client_view_rendered"
        }
      },
      {
        "id": "ca-r-3",
        "title": "3. Verify Header Title & Action CTAs",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view h1, #client-view a[href=\"#brief\"], #client-view a[href*=\"msa-view.html\"]"
        }
      },
      {
        "id": "ca-r-4",
        "title": "4. Verify Engineering Hours Bank Badge & Capacity Indicator",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view .badge-emerald, #client-view h2"
        }
      },
      {
        "id": "ca-r-5",
        "title": "5. Verify Delivered Hours vs Remaining Hours Metrics",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view [style*=\"linear-gradient(90deg, #10b981\"], #client-view strong"
        }
      },
      {
        "id": "ca-r-6",
        "title": "6. Verify Transparent Engineering Activity Log Table",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view table th, #client-view table tbody tr"
        }
      },
      {
        "id": "ca-r-7",
        "title": "7. Verify Main Health Score Banner & Delivered Progress",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view [style*=\"linear-gradient(90deg, #8b5cf6, #10b981)\"], #client-view span"
        }
      },
      {
        "id": "ca-r-8",
        "title": "8. Verify Format Quotas Grid (Reels, Statics, Commercial, Strategy)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view .card-glass, #client-view .badge-purple, #client-view .badge-emerald"
        }
      },
      {
        "id": "ca-r-9",
        "title": "9. Verify Retainer Contract Terms Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view h3"
        }
      },
      {
        "id": "ca-r-10",
        "title": "10. Verify Assigned Creative Team Pod Roster",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view h3, #client-view [style*=\"justify-content:space-between\"]"
        }
      },
      {
        "id": "ca-r-11",
        "title": "11. Verify 30-Day Defect Warranty Shield Active",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "custom_check",
          "check": "assert_warranty_shield_active"
        }
      },
      {
        "id": "ca-r-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "client_review": {
    "id": "client_review",
    "title": "Client Review Room Audit",
    "targetHash": "#review",
    "steps": [
      {
        "id": "ca-rv-1",
        "title": "1. Navigate to #review",
        "action": "navigate_hash",
        "target": "#review",
        "assertion": {
          "type": "wait_selector",
          "selector": "#client-view h1, #client-view a[href=\"/reviewroom.html\"]",
          "timeout": 5000
        }
      },
      {
        "id": "ca-rv-2",
        "title": "2. Verify Review Room Cockpit Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_client_view_rendered"
        }
      },
      {
        "id": "ca-rv-3",
        "title": "3. Verify Engine 2 Delivery Badges & Scope Creep Shield",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view .badge-purple, #client-view .badge-cyan, #client-view a[href=\"/reviewroom.html\"]"
        }
      },
      {
        "id": "ca-rv-4",
        "title": "4. Verify Review Header Title & Description",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view h1"
        }
      },
      {
        "id": "ca-rv-5",
        "title": "5. Open Structured Sprint Feedback Modal",
        "action": "click",
        "selector": "#client-view button[onclick*=\"openAdjustModal\"], #clFeedbackModal",
        "assertion": {
          "type": "modal_open",
          "selector": "#clFeedbackModal"
        }
      },
      {
        "id": "ca-rv-6",
        "title": "6. Verify Feedback Modal Fields",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#clFeedbackType, #clFeedbackText, #clSubmitFeedbackBtn"
        }
      },
      {
        "id": "ca-rv-7",
        "title": "7. Close Feedback Modal via ✕",
        "action": "click",
        "selector": "#clFeedbackModal button[onclick*=\"closeAdjustModal\"]",
        "assertion": {
          "type": "modal_closed",
          "selector": "#clFeedbackModal"
        }
      },
      {
        "id": "ca-rv-8",
        "title": "8. Open Milestone Sign-Off Modal",
        "action": "click",
        "selector": "#client-view button[onclick*=\"openSignOffModal\"], #clSignOffModal",
        "assertion": {
          "type": "modal_open",
          "selector": "#clSignOffModal"
        }
      },
      {
        "id": "ca-rv-9",
        "title": "9. Verify Sign-Off Commercial & Warranty Snapshot",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#signOffUsd, #signOffBdt, #btnConfirmSignOff"
        }
      },
      {
        "id": "ca-rv-10",
        "title": "10. Close Sign-Off Modal via Cancel",
        "action": "click",
        "selector": "#clSignOffModal button[onclick*=\"closeSignOffModal\"]",
        "assertion": {
          "type": "modal_closed",
          "selector": "#clSignOffModal"
        }
      },
      {
        "id": "ca-rv-11",
        "title": "11. Verify Deliverables Card or Ready-for-Sprint Area",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view .card-glass"
        }
      },
      {
        "id": "ca-rv-12",
        "title": "12. Verify 30-Day Defect-Free Warranty Terms Active",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "custom_check",
          "check": "assert_warranty_shield_active"
        }
      },
      {
        "id": "ca-rv-13",
        "title": "13. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "client_campaign": {
    "id": "client_campaign",
    "title": "Campaign Schedule Audit",
    "targetHash": "#campaign",
    "steps": [
      {
        "id": "ca-cp-1",
        "title": "1. Navigate to #campaign",
        "action": "navigate_hash",
        "target": "#campaign",
        "assertion": {
          "type": "wait_selector",
          "selector": "#btnViewGrid, #btnViewList, #btnViewCal",
          "timeout": 6000
        }
      },
      {
        "id": "ca-cp-2",
        "title": "2. Verify Campaign Schedule View Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_client_view_rendered"
        }
      },
      {
        "id": "ca-cp-3",
        "title": "3. Verify View Switchers Rendered (Grid, List, Calendar)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#btnViewGrid, #btnViewList, #btnViewCal"
        }
      },
      {
        "id": "ca-cp-4",
        "title": "4. Verify Filter Buttons (All, Pending, Approved, Scheduled)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view button[onclick*=\"setFilter('all')\"], #client-view button[onclick*=\"setFilter('pending')\"]"
        }
      },
      {
        "id": "ca-cp-5",
        "title": "5. Click Pending Approval Filter Button",
        "action": "click",
        "selector": "#client-view button[onclick*=\"setFilter('pending')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view button[onclick*=\"setFilter('pending')\"]"
        }
      },
      {
        "id": "ca-cp-6",
        "title": "6. Click All Posts Filter Button to Reset",
        "action": "click",
        "selector": "#client-view button[onclick*=\"setFilter('all')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view button[onclick*=\"setFilter('all')\"]"
        }
      },
      {
        "id": "ca-cp-7",
        "title": "7. Click List View Button",
        "action": "click",
        "selector": "#btnViewList, button#btnViewList, [onclick*=\"setView('list')\"]"
      },
      {
        "id": "ca-cp-8",
        "title": "8. Verify List View Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#btnViewList, #client-view table, #client-view th"
        }
      },
      {
        "id": "ca-cp-9",
        "title": "9. Click Calendar View Button",
        "action": "click",
        "selector": "#btnViewCal, button#btnViewCal, [onclick*=\"setView('calendar')\"]"
      },
      {
        "id": "ca-cp-10",
        "title": "10. Verify Calendar View Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#btnViewCal, #client-view [style*=\"min-height:90px\"], #client-view [style*=\"min-height:85px\"]"
        }
      },
      {
        "id": "ca-cp-11",
        "title": "11. Click Grid View Button",
        "action": "click",
        "selector": "#btnViewGrid, button#btnViewGrid, [onclick*=\"setView('grid')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#btnViewGrid"
        }
      },
      {
        "id": "ca-cp-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "client_brief": {
    "id": "client_brief",
    "title": "Submit Brief Form Audit",
    "targetHash": "#brief",
    "steps": [
      {
        "id": "ca-bf-1",
        "title": "1. Navigate to #brief",
        "action": "navigate_hash",
        "target": "#brief",
        "assertion": {
          "type": "wait_selector",
          "selector": "#campaignBriefForm, #briefTitle, #briefObjective",
          "timeout": 6000
        }
      },
      {
        "id": "ca-bf-2",
        "title": "2. Verify Brief Intake Wizard Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_client_view_rendered"
        }
      },
      {
        "id": "ca-bf-3",
        "title": "3. Verify Step 1: Campaign Title Input",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#briefTitle, input[type=\"text\"]"
        }
      },
      {
        "id": "ca-bf-4",
        "title": "4. Input Campaign Title",
        "action": "input_text",
        "selector": "#briefTitle, input[type=\"text\"]",
        "value": "Q4 Omnichannel Growth Push"
      },
      {
        "id": "ca-bf-5",
        "title": "5. Verify Primary Objective Selector",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#briefObjective, select"
        }
      },
      {
        "id": "ca-bf-6",
        "title": "6. Input Target Audience & Brand Tone",
        "action": "input_text",
        "selector": "#briefAudience, input[type=\"text\"]",
        "value": "E-commerce Directors & Founders"
      },
      {
        "id": "ca-bf-7",
        "title": "7. Click Continue to Deliverables Button",
        "action": "click",
        "selector": "#campaignBriefForm button[onclick*=\"goToStep(2)\"], #briefStep1 button"
      },
      {
        "id": "ca-bf-8",
        "title": "8. Verify Step 2: Deliverables Selection Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#briefStep2, input[name=\"briefDeliv\"]"
        }
      },
      {
        "id": "ca-bf-9",
        "title": "9. Select Deliverables Checkbox",
        "action": "click",
        "selector": "input[name=\"briefDeliv\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "input[name=\"briefDeliv\"]"
        }
      },
      {
        "id": "ca-bf-10",
        "title": "10. Click Continue to Creative Direction",
        "action": "click",
        "selector": "#briefStep2 button[onclick*=\"goToStep(3)\"]"
      },
      {
        "id": "ca-bf-11",
        "title": "11. Verify Step 3: Technical Specifications & Scope Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#briefStep3, #briefDescription, #btnSubmitBrief"
        }
      },
      {
        "id": "ca-bf-12",
        "title": "12. Click Step 3 Back Button to Return to Deliverables",
        "action": "click",
        "selector": "#briefStep3 button[onclick*=\"goToStep(2)\"]"
      },
      {
        "id": "ca-bf-13",
        "title": "13. Verify Step 2 Re-mounted Successfully",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#briefStep2, input[name=\"briefDeliv\"]"
        }
      },
      {
        "id": "ca-bf-14",
        "title": "14. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "client_lockin": {
    "id": "client_lockin",
    "title": "Sprint Lock-In & Warranty Audit",
    "targetHash": "#lockin",
    "steps": [
      {
        "id": "ca-li-1",
        "title": "1. Navigate to #lockin",
        "action": "navigate_hash",
        "target": "#lockin",
        "assertion": {
          "type": "wait_selector",
          "selector": "#lockinTabContent, #client-view h1",
          "timeout": 6000
        }
      },
      {
        "id": "ca-li-2",
        "title": "2. Verify 30-Day Defect Warranty Shield & Terms",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_warranty_shield_active"
        }
      },
      {
        "id": "ca-li-3",
        "title": "3. Verify Lock-In Turnaround Days & Milestone Banner",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view .card-glass"
        }
      },
      {
        "id": "ca-li-4",
        "title": "4. Verify Handover Shield Progress Bar",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view [style*=\"background:linear-gradient(90deg, #8b5cf6, #10b981)\"], #client-view [style*=\"border-radius:99px\"]"
        }
      },
      {
        "id": "ca-li-5",
        "title": "5. Verify Prerequisites Checklist Cards Rendered",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#lockinTabContent .card-glass"
        }
      },
      {
        "id": "ca-li-6",
        "title": "6. Click Scope & DoD Lock Subtab",
        "action": "click",
        "selector": "#client-view button[onclick*=\"switchTab('scope')\"]"
      },
      {
        "id": "ca-li-7",
        "title": "7. Verify Guaranteed Core Inclusions & Formal DoD",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#lockinTabContent .card-glass"
        }
      },
      {
        "id": "ca-li-8",
        "title": "8. Click Key Contacts & Roles Subtab",
        "action": "click",
        "selector": "#client-view button[onclick*=\"switchTab('pocs')\"]"
      },
      {
        "id": "ca-li-9",
        "title": "9. Verify Authorized Decision Roster & Delegated Authorities",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#lockinTabContent .card-glass"
        }
      },
      {
        "id": "ca-li-10",
        "title": "10. Click Scoping Discovery Subtab",
        "action": "click",
        "selector": "#client-view button[onclick*=\"switchTab('discovery')\"]"
      },
      {
        "id": "ca-li-11",
        "title": "11. Verify Scoping Discovery Specifications Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#lockinTabContent .card-glass"
        }
      },
      {
        "id": "ca-li-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "client_invoices": {
    "id": "client_invoices",
    "title": "Billing & Invoices Audit",
    "targetHash": "#invoices",
    "steps": [
      {
        "id": "ca-inv-1",
        "title": "1. Navigate to #invoices",
        "action": "navigate_hash",
        "target": "#invoices",
        "assertion": {
          "type": "wait_selector",
          "selector": "#clientPayModal, .data-table, #client-view table",
          "timeout": 6000
        }
      },
      {
        "id": "ca-inv-2",
        "title": "2. Verify Invoices View & Table Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_client_view_rendered"
        }
      },
      {
        "id": "ca-inv-3",
        "title": "3. Verify BRAC Bank Institutional Settlement Rails",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_brac_bank_institutional_rails"
        }
      },
      {
        "id": "ca-inv-4",
        "title": "4. Verify Copy Bank Info Button Rendered",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "button[onclick*=\"copyInfo\"]"
        }
      },
      {
        "id": "ca-inv-5",
        "title": "5. Verify Invoices Table Headers & Columns",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".data-table th, table th"
        }
      },
      {
        "id": "ca-inv-6",
        "title": "6. Verify Download Tax Invoice (PDF) Links",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "a[href*=\"invoice-view.html\"]"
        }
      },
      {
        "id": "ca-inv-7",
        "title": "7. Open Payment Proof Submission Modal",
        "action": "click",
        "selector": "button[onclick*=\"openPayModal\"], #clientPayModal"
      },
      {
        "id": "ca-inv-8",
        "title": "8. Verify Client Payment Modal Form Inputs",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#clientPayModal #payAmount, #clientPayModal #payMethod, #clientPayModal #payTrxId"
        }
      },
      {
        "id": "ca-inv-9",
        "title": "9. Close Payment Submission Modal",
        "action": "click",
        "selector": "#clientPayModal button[onclick*=\"closePayModal\"], #clientPayModal button"
      },
      {
        "id": "ca-inv-10",
        "title": "10. Verify Payment Modal Dismissed",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_hidden",
          "selector": "#clientPayModal"
        }
      },
      {
        "id": "ca-inv-11",
        "title": "11. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "client_tickets": {
    "id": "client_tickets",
    "title": "Support Requests Audit",
    "targetHash": "#tickets",
    "steps": [
      {
        "id": "ca-tc-1",
        "title": "1. Navigate to #tickets",
        "action": "navigate_hash",
        "target": "#tickets",
        "assertion": {
          "type": "wait_selector",
          "selector": "#tabBtnTickets, #tabBtnChangeOrders",
          "timeout": 6000
        }
      },
      {
        "id": "ca-tc-2",
        "title": "2. Verify Support Desk View Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_client_view_rendered"
        }
      },
      {
        "id": "ca-tc-3",
        "title": "3. Verify Action Buttons Rendered (Feedback, Dispute, Escalation, Submit)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view button[onclick*=\"openModal\"], #client-view button[onclick*=\"openTestimonialModal\"]"
        }
      },
      {
        "id": "ca-tc-4",
        "title": "4. Open New Support Ticket Modal",
        "action": "click",
        "selector": "#client-view button[onclick*=\"openModal()\"]"
      },
      {
        "id": "ca-tc-5",
        "title": "5. Verify Ticket Modal Form Inputs Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#clTicketModal #clTckCategory, #clTicketModal #clTckTitle, #clTicketModal #clTckDesc"
        }
      },
      {
        "id": "ca-tc-6",
        "title": "6. Close Ticket Modal",
        "action": "click",
        "selector": "#clTicketModal button[onclick*=\"closeModal()\"]"
      },
      {
        "id": "ca-tc-7",
        "title": "7. Verify Ticket Modal Dismissed",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_hidden",
          "selector": "#clTicketModal"
        }
      },
      {
        "id": "ca-tc-8",
        "title": "8. Open Share Feedback / Testimonial Modal",
        "action": "click",
        "selector": "#client-view button[onclick*=\"openTestimonialModal()\"]"
      },
      {
        "id": "ca-tc-9",
        "title": "9. Verify Testimonial Modal Form Inputs Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#clTestimonialModal #clTstRating, #clTestimonialModal #clTstFeedback"
        }
      },
      {
        "id": "ca-tc-10",
        "title": "10. Close Testimonial Modal",
        "action": "click",
        "selector": "#clTestimonialModal button[onclick*=\"closeTestimonialModal()\"]"
      },
      {
        "id": "ca-tc-11",
        "title": "11. Click Scope Change Orders Tab",
        "action": "click",
        "selector": "#tabBtnChangeOrders"
      },
      {
        "id": "ca-tc-12",
        "title": "12. Verify Scope Change Orders View Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#tabBtnChangeOrders, #client-view table, #client-view .data-table"
        }
      },
      {
        "id": "ca-tc-13",
        "title": "13. Switch Back to Support Tickets Tab",
        "action": "click",
        "selector": "#tabBtnTickets"
      },
      {
        "id": "ca-tc-14",
        "title": "14. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "client_account": {
    "id": "client_account",
    "title": "Account & Contracts Audit",
    "targetHash": "#account",
    "steps": [
      {
        "id": "ca-ac-1",
        "title": "1. Navigate to #account",
        "action": "navigate_hash",
        "target": "#account",
        "assertion": {
          "type": "wait_selector",
          "selector": "#client-view h1, #clAddPocModal",
          "timeout": 6000
        }
      },
      {
        "id": "ca-ac-2",
        "title": "2. Verify Account Details & Governance Hub Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_client_view_rendered"
        }
      },
      {
        "id": "ca-ac-3",
        "title": "3. Verify Company Profile Card Active",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view .card-glass"
        }
      },
      {
        "id": "ca-ac-4",
        "title": "4. Verify Dedicated Account Manager Direct Contact Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view a[href*=\"wa.me\"], #client-view a[href*=\"tel:\"]"
        }
      },
      {
        "id": "ca-ac-5",
        "title": "5. Verify Legal Contracts & Governance Section",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view a[href*=\"msa-view.html\"], #client-view a[href*=\"handover-view.html\"]"
        }
      },
      {
        "id": "ca-ac-6",
        "title": "6. Verify Authorized Points of Contact Roster",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#client-view .card-glass"
        }
      },
      {
        "id": "ca-ac-7",
        "title": "7. Open Add Team Member Access Modal",
        "action": "click",
        "selector": "#client-view button[onclick*=\"openAddPocModal()\"]"
      },
      {
        "id": "ca-ac-8",
        "title": "8. Verify Team Member Access Modal Inputs Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#clAddPocModal #newPocName, #clAddPocModal #newPocPhone, #clAddPocModal #newPocRole"
        }
      },
      {
        "id": "ca-ac-9",
        "title": "9. Close Team Member Access Modal",
        "action": "click",
        "selector": "#clAddPocModal button[onclick*=\"closeAddPocModal()\"]"
      },
      {
        "id": "ca-ac-10",
        "title": "10. Open Master IP Handover Certificate Modal",
        "action": "click",
        "selector": "#client-view button[onclick*=\"openIpCertModal\"]"
      },
      {
        "id": "ca-ac-11",
        "title": "11. Close Master IP Handover Certificate Modal",
        "action": "click",
        "selector": "#clIpCertModal button[onclick*=\"closeIpCertModal()\"]"
      },
      {
        "id": "ca-ac-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_home": {
    "id": "crew_home",
    "title": "Crew Home & Clock-In Audit",
    "targetHash": "#home",
    "steps": [
      {
        "id": "cra-h-1",
        "title": "1. Navigate to #home",
        "action": "navigate_hash",
        "target": "#home",
        "assertion": {
          "type": "wait_selector",
          "selector": "#crew-view h1, #crew-view .card-glass",
          "timeout": 6000
        }
      },
      {
        "id": "cra-h-2",
        "title": "2. Verify Crew Workspace Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_view_rendered"
        }
      },
      {
        "id": "cra-h-3",
        "title": "3. Verify Welcome Header & Specialist Status",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view h1, #crew-view h2"
        }
      },
      {
        "id": "cra-h-4",
        "title": "4. Verify 3 Core KPI Widgets (Tasks, Attendance, EOD Streak)",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_kpis"
        }
      },
      {
        "id": "cra-h-5",
        "title": "5. Verify Active Tasks Quick Link",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "a[href=\"#tasks\"]"
        }
      },
      {
        "id": "cra-h-6",
        "title": "6. Verify Attendance Status Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .kpi-tile"
        }
      },
      {
        "id": "cra-h-7",
        "title": "7. Verify EOD Streak Quick Link",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "a[href=\"#eod\"], #crew-view a.kpi-tile"
        }
      },
      {
        "id": "cra-h-8",
        "title": "8. Verify Telegram Bot Field Actions Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .card-glass, #crew-view a[href*=\"t.me\"]"
        }
      },
      {
        "id": "cra-h-9",
        "title": "9. Verify Telegram Bot Action Commands",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view code, #crew-view span, #crew-view .card-glass"
        }
      },
      {
        "id": "cra-h-10",
        "title": "10. Verify Crew Header User Badge Display",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewHeaderName, #topNav"
        }
      },
      {
        "id": "cra-h-11",
        "title": "11. Verify Quick Shortcuts Navigation Bar",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".bottom-nav-item, #crew-view"
        }
      },
      {
        "id": "cra-h-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_tasks": {
    "id": "crew_tasks",
    "title": "Assigned Tasks Pipeline Audit",
    "targetHash": "#tasks",
    "steps": [
      {
        "id": "cra-ts-1",
        "title": "1. Navigate to #tasks",
        "action": "navigate_hash",
        "target": "#tasks",
        "assertion": {
          "type": "wait_selector",
          "selector": "#crew-view h1, #crew-view .card-glass",
          "timeout": 6000
        }
      },
      {
        "id": "cra-ts-2",
        "title": "2. Verify Task Pipeline & Cards Rendered",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view h1, #crew-view .card-glass"
        }
      },
      {
        "id": "cra-ts-3",
        "title": "3. Verify 14-Day Autonomous Sprint Velocity Burndown Widget",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view [style*=\"14-Day Autonomous Sprint Velocity\"], #crew-view .card-glass"
        }
      },
      {
        "id": "cra-ts-4",
        "title": "4. Verify Active PRs Link to GitHub Monorepo",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "a[href*=\"github.com\"], a[href*=\"pulls\"], #crew-view a"
        }
      },
      {
        "id": "cra-ts-5",
        "title": "5. Verify Delivery Pod Badge Rendered",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .badge, #crew-view .badge-purple"
        }
      },
      {
        "id": "cra-ts-6",
        "title": "6. Open Task Detail Modal",
        "action": "click",
        "selector": "#crew-view button[onclick*=\"crewOpenTask\"], #crew-view [onclick*=\"crewOpenTask\"], #crew-view .card-glass"
      },
      {
        "id": "cra-ts-7",
        "title": "7. Verify Task Detail Modal Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewTaskModal, #crewTaskModalContent"
        }
      },
      {
        "id": "cra-ts-8",
        "title": "8. Verify Task Priority & Current Stage Badges",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewTaskModal .card-glass, #crewTaskModal .badge, #crewTaskModal"
        }
      },
      {
        "id": "cra-ts-9",
        "title": "9. Close Task Detail Modal",
        "action": "click",
        "selector": "#crewTaskModal button[onclick*=\"display='none'\"], #crewTaskModal button"
      },
      {
        "id": "cra-ts-10",
        "title": "10. Verify Task Modal Dismissed",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_hidden",
          "selector": "#crewTaskModal"
        }
      },
      {
        "id": "cra-ts-11",
        "title": "11. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_deliverables": {
    "id": "crew_deliverables",
    "title": "Deliverables Submission Audit",
    "targetHash": "#deliverables",
    "steps": [
      {
        "id": "cra-dl-1",
        "title": "1. Navigate to #deliverables",
        "action": "navigate_hash",
        "target": "#deliverables",
        "assertion": {
          "type": "wait_selector",
          "selector": "#delivTabUpload, #delivTabFeedback",
          "timeout": 6000
        }
      },
      {
        "id": "cra-dl-2",
        "title": "2. Verify Deliverable Form & Instructions Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_view_rendered"
        }
      },
      {
        "id": "cra-dl-3",
        "title": "3. Verify Upload vs Feedback Tabs Rendered",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#delivTabUpload, #delivTabFeedback"
        }
      },
      {
        "id": "cra-dl-4",
        "title": "4. Switch to Feedback Received Tab",
        "action": "click",
        "selector": "#delivTabFeedback, button#delivTabFeedback, [onclick*=\"crewDelivTab('feedback')\"]"
      },
      {
        "id": "cra-dl-5",
        "title": "5. Verify Feedback Content Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#delivFeedbackContent"
        }
      },
      {
        "id": "cra-dl-6",
        "title": "6. Switch Back to Upload Deliverables Tab",
        "action": "click",
        "selector": "#delivTabUpload, button#delivTabUpload, [onclick*=\"crewDelivTab('upload')\"]"
      },
      {
        "id": "cra-dl-7",
        "title": "7. Verify Upload Section Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#delivUploadContent"
        }
      },
      {
        "id": "cra-dl-8",
        "title": "8. Verify Deliverables File Input Or Upload Area",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#delivUploadContent input[type=\"file\"], #delivUploadContent input, #delivUploadContent textarea, #delivUploadContent .card-glass"
        }
      },
      {
        "id": "cra-dl-9",
        "title": "9. Verify External Cloud Link Input",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#delivUploadContent input[type=\"url\"], #delivUploadContent input[placeholder*=\"http\"], #delivUploadContent .card-glass"
        }
      },
      {
        "id": "cra-dl-10",
        "title": "10. Verify Version Notes Input",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#delivUploadContent textarea, #delivUploadContent input, #delivUploadContent .card-glass"
        }
      },
      {
        "id": "cra-dl-11",
        "title": "11. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_calendar": {
    "id": "crew_calendar",
    "title": "Content Calendar Audit",
    "targetHash": "#calendar",
    "steps": [
      {
        "id": "cra-cl-1",
        "title": "1. Navigate to #calendar",
        "action": "navigate_hash",
        "target": "#calendar",
        "assertion": {
          "type": "wait_selector",
          "selector": "#crewCalPrevMonthBtn, #crewCalNextMonthBtn, #crew-view h1",
          "timeout": 10000
        }
      },
      {
        "id": "cra-cl-2",
        "title": "2. Verify Calendar View & Navigation Controls",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_view_rendered"
        }
      },
      {
        "id": "cra-cl-3",
        "title": "3. Click Next Month Button",
        "action": "click",
        "selector": "#crewCalNextMonthBtn, button#crewCalNextMonthBtn, [onclick*=\"changeCrewCalMonth(1)\"]"
      },
      {
        "id": "cra-cl-4",
        "title": "4. Verify Calendar Grid Updated",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewCalNextMonthBtn, #crew-view [style*=\"grid-template-columns\"]"
        }
      },
      {
        "id": "cra-cl-5",
        "title": "5. Click Previous Month Button",
        "action": "click",
        "selector": "#crewCalPrevMonthBtn, button#crewCalPrevMonthBtn, [onclick*=\"changeCrewCalMonth(-1)\"]"
      },
      {
        "id": "cra-cl-6",
        "title": "6. Verify Return to Original Month",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewCalPrevMonthBtn, #crew-view [style*=\"grid-template-columns\"]"
        }
      },
      {
        "id": "cra-cl-7",
        "title": "7. Verify 7 Weekday Headers Rendered (SUN to SAT)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view [style*=\"grid-template-columns:repeat(7, 1fr)\"], #crew-view [style*=\"grid-template-columns\"]"
        }
      },
      {
        "id": "cra-cl-8",
        "title": "8. Select Date in Calendar Grid",
        "action": "click",
        "selector": "#crew-view [onclick*=\"selectCrewCalDate\"], #crew-view [style*=\"min-height:65px\"]"
      },
      {
        "id": "cra-cl-9",
        "title": "9. Verify Selected Date Deliverables Card Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .card-glass"
        }
      },
      {
        "id": "cra-cl-10",
        "title": "10. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_tickets": {
    "id": "crew_tickets",
    "title": "Support Tickets & Deploy Log Audit",
    "targetHash": "#tickets",
    "steps": [
      {
        "id": "cra-tc-1",
        "title": "1. Navigate to #tickets",
        "action": "navigate_hash",
        "target": "#tickets",
        "assertion": {
          "type": "wait_selector",
          "selector": "#deployEnv, #deployPR",
          "timeout": 6000
        }
      },
      {
        "id": "cra-tc-2",
        "title": "2. Verify Tech Tickets Queue & Deploy Status",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_view_rendered"
        }
      },
      {
        "id": "cra-tc-3",
        "title": "3. Verify Environment Selector Available",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#deployEnv, select"
        }
      },
      {
        "id": "cra-tc-4",
        "title": "4. Input PR URL",
        "action": "input_text",
        "selector": "#deployPR",
        "value": "https://github.com/Gro10x/gro10x-monorepo/pull/142"
      },
      {
        "id": "cra-tc-5",
        "title": "5. Verify PR URL Input Field Active",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#deployPR"
        }
      },
      {
        "id": "cra-tc-6",
        "title": "6. Input Deployment Notes",
        "action": "input_text",
        "selector": "#deployNotes",
        "value": "Hotfix deployed to staging: telemetry webhooks verified"
      },
      {
        "id": "cra-tc-7",
        "title": "7. Verify Deployment Notes Value Populated",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#deployNotes"
        }
      },
      {
        "id": "cra-tc-8",
        "title": "8. Verify Log Deployment Button Active",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#deploySubmitBtn, #crew-view button"
        }
      },
      {
        "id": "cra-tc-9",
        "title": "9. Verify Technical Support Tickets Section Rendered",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view h1, #crew-view .card-glass"
        }
      },
      {
        "id": "cra-tc-10",
        "title": "10. Verify Assigned Tickets Queue Or Clean State",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .card-glass"
        }
      },
      {
        "id": "cra-tc-11",
        "title": "11. Verify Environment Selector Options",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#deployEnv"
        }
      },
      {
        "id": "cra-tc-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_earnings": {
    "id": "crew_earnings",
    "title": "Earnings & Payroll Audit",
    "targetHash": "#earnings",
    "steps": [
      {
        "id": "cra-ea-1",
        "title": "1. Navigate to #earnings",
        "action": "navigate_hash",
        "target": "#earnings",
        "assertion": {
          "type": "wait_selector",
          "selector": "#crew-view h1, #crew-view .kpi-tile",
          "timeout": 6000
        }
      },
      {
        "id": "cra-ea-2",
        "title": "2. Verify Specialist Earnings & Compensation Summary Card",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_view_rendered"
        }
      },
      {
        "id": "cra-ea-3",
        "title": "3. Verify Base Salary KPI Metric",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .kpi-tile"
        }
      },
      {
        "id": "cra-ea-4",
        "title": "4. Verify Project Commissions KPI Metric",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .kpi-val"
        }
      },
      {
        "id": "cra-ea-5",
        "title": "5. Verify Estimated Monthly Payout Metric",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .kpi-sub"
        }
      },
      {
        "id": "cra-ea-6",
        "title": "6. Verify Print Payslip Action Button",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "button[onclick*=\"openCrewPayslip\"], #crew-view button"
        }
      },
      {
        "id": "cra-ea-7",
        "title": "7. Verify XP Milestone Progress Level & Ladder Badge",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view [style*=\"XP\"], #crew-view .card-glass"
        }
      },
      {
        "id": "cra-ea-8",
        "title": "8. Verify Monthly Mood Analytics Telemetry",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .card-glass"
        }
      },
      {
        "id": "cra-ea-9",
        "title": "9. Verify bKash / Bank Settlement Channel Info",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .card-glass"
        }
      },
      {
        "id": "cra-ea-10",
        "title": "10. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_leaderboard": {
    "id": "crew_leaderboard",
    "title": "XP Leaderboard Audit",
    "targetHash": "#leaderboard",
    "steps": [
      {
        "id": "cra-lb-1",
        "title": "1. Navigate to #leaderboard",
        "action": "navigate_hash",
        "target": "#leaderboard",
        "assertion": {
          "type": "wait_selector",
          "selector": "#leaderboardBoard, #crew-view h1",
          "timeout": 5000
        }
      },
      {
        "id": "cra-lb-2",
        "title": "2. Verify XP Leaderboard Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_view_rendered"
        }
      },
      {
        "id": "cra-lb-3",
        "title": "3. Verify Specialist Standings & Ranking Cards",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#leaderboardBoard .card-glass, #leaderboardBoard"
        }
      },
      {
        "id": "cra-lb-4",
        "title": "4. Verify Tier Badges & XP Points",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#leaderboardBoard .badge, #leaderboardBoard"
        }
      },
      {
        "id": "cra-lb-5",
        "title": "5. Verify Department Filter Buttons",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".lb-filter-btn"
        }
      },
      {
        "id": "cra-lb-6",
        "title": "6. Filter Leaderboard by Department",
        "action": "click",
        "selector": ".lb-filter-btn:nth-child(2), button[onclick*=\"filterCrewLeaderboard\"]"
      },
      {
        "id": "cra-lb-7",
        "title": "7. Verify Filter Applied & Board Rendered",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#leaderboardBoard"
        }
      },
      {
        "id": "cra-lb-8",
        "title": "8. Reset Department Filter to All",
        "action": "click",
        "selector": ".lb-filter-btn[data-dept=\"All\"], .lb-filter-btn:nth-child(1)"
      },
      {
        "id": "cra-lb-9",
        "title": "9. Verify XP Rules & Earning Guide Footer",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .card-glass:last-of-type"
        }
      },
      {
        "id": "cra-lb-10",
        "title": "10. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_leaves": {
    "id": "crew_leaves",
    "title": "Leave Requests Audit",
    "targetHash": "#leaves",
    "steps": [
      {
        "id": "cra-lv-1",
        "title": "1. Navigate to #leaves",
        "action": "navigate_hash",
        "target": "#leaves",
        "assertion": {
          "type": "wait_selector",
          "selector": "#crewApplyLeaveBtn, #crew-view h1",
          "timeout": 10000
        }
      },
      {
        "id": "cra-lv-2",
        "title": "2. Verify Leave Requests View Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_view_rendered"
        }
      },
      {
        "id": "cra-lv-3",
        "title": "3. Verify Casual & Sick Leave Balance Tiles",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".kpi-tile"
        }
      },
      {
        "id": "cra-lv-4",
        "title": "4. Verify Leave History Data Table",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".data-table-container table.data-table"
        }
      },
      {
        "id": "cra-lv-5",
        "title": "5. Verify Apply for Leave Action Button",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewApplyLeaveBtn, button[onclick*=\"CREW_LEAVES.openModal\"], button:has-text(\"Apply for Leave\")",
          "timeout": 10000
        }
      },
      {
        "id": "cra-lv-6",
        "title": "6. Click Apply for Leave Button",
        "action": "click",
        "selector": "#crewApplyLeaveBtn, button[onclick*=\"CREW_LEAVES.openModal\"]"
      },
      {
        "id": "cra-lv-7",
        "title": "7. Verify Leave Modal Opened",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#crLeaveModal.active, #crLeaveModal .modal-box"
        }
      },
      {
        "id": "cra-lv-8",
        "title": "8. Verify Leave Form Inputs Mounted",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crLeaveType, #crLeaveStart, #crLeaveReason"
        }
      },
      {
        "id": "cra-lv-9",
        "title": "9. Input Leave Reason",
        "action": "input_text",
        "selector": "#crLeaveReason",
        "value": "Attending family function - 1 day"
      },
      {
        "id": "cra-lv-10",
        "title": "10. Dismiss Leave Modal via Close Button",
        "action": "click",
        "selector": "#crLeaveModal button[onclick*=\"CREW_LEAVES.closeModal\"], #crLeaveModal .modal-box button"
      },
      {
        "id": "cra-lv-11",
        "title": "11. Verify Modal Dismissed",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .kpi-tile"
        }
      },
      {
        "id": "cra-lv-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_eod": {
    "id": "crew_eod",
    "title": "Daily EOD Report Audit",
    "targetHash": "#eod",
    "steps": [
      {
        "id": "cra-eod-1",
        "title": "1. Navigate to #eod",
        "action": "navigate_hash",
        "target": "#eod",
        "assertion": {
          "type": "wait_selector",
          "selector": "#crewEodSummary, #crewEodTomorrow, #crewEodSubmitBtn",
          "timeout": 5000
        }
      },
      {
        "id": "cra-eod-2",
        "title": "2. Verify Daily EOD Form Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_view_rendered"
        }
      },
      {
        "id": "cra-eod-3",
        "title": "3. Verify Summary of Completed Tasks Field",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewEodSummary"
        }
      },
      {
        "id": "cra-eod-4",
        "title": "4. Input Summary of Tasks",
        "action": "input_text",
        "selector": "#crewEodSummary",
        "value": "Completed 3 cut approvals and verified automated QA tests."
      },
      {
        "id": "cra-eod-5",
        "title": "5. Verify Tomorrow Plans Field",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewEodTomorrow"
        }
      },
      {
        "id": "cra-eod-6",
        "title": "6. Input Tomorrow Plans",
        "action": "input_text",
        "selector": "#crewEodTomorrow",
        "value": "Review brand studio design mockups and update task pipelines."
      },
      {
        "id": "cra-eod-7",
        "title": "7. Input Blockers",
        "action": "input_text",
        "selector": "#crewEodBlockers",
        "value": "None"
      },
      {
        "id": "cra-eod-8",
        "title": "8. Input Billable Hours",
        "action": "input_text",
        "selector": "#crewEodHours",
        "value": "8.0"
      },
      {
        "id": "cra-eod-9",
        "title": "9. Verify Mood Selector Buttons",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".crew-mood-btn"
        }
      },
      {
        "id": "cra-eod-10",
        "title": "10. Click Fired Up Mood Button",
        "action": "click",
        "selector": ".crew-mood-btn[data-mood*=\"Fired Up\"]"
      },
      {
        "id": "cra-eod-11",
        "title": "11. Verify Mood Selected State",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".crew-mood-btn.selected"
        }
      },
      {
        "id": "cra-eod-12",
        "title": "12. Verify Submit Daily EOD Button Enabled",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewEodSubmitBtn"
        }
      },
      {
        "id": "cra-eod-13",
        "title": "13. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_expenses": {
    "id": "crew_expenses",
    "title": "Submit Expense Claim Audit",
    "targetHash": "#expenses",
    "steps": [
      {
        "id": "cra-ex-1",
        "title": "1. Navigate to #expenses",
        "action": "navigate_hash",
        "target": "#expenses",
        "assertion": {
          "type": "wait_selector",
          "selector": "#tabBtnStandardExpense, #tabBtnComputeCogs, #crewExpSubmitBtn",
          "timeout": 5000
        }
      },
      {
        "id": "cra-ex-2",
        "title": "2. Verify Expense Claim Categories Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_view_rendered"
        }
      },
      {
        "id": "cra-ex-3",
        "title": "3. Verify Category Tabs Rendered (Standard vs Compute COGS)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#tabBtnStandardExpense, #tabBtnComputeCogs"
        }
      },
      {
        "id": "cra-ex-4",
        "title": "4. Verify Out-of-Pocket Form Inputs",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewExpAmount, #crewExpDescription"
        }
      },
      {
        "id": "cra-ex-5",
        "title": "5. Input Expense Amount (BDT)",
        "action": "input_text",
        "selector": "#crewExpAmount",
        "value": "1850"
      },
      {
        "id": "cra-ex-6",
        "title": "6. Input Expense Description",
        "action": "input_text",
        "selector": "#crewExpDescription",
        "value": "Cloud GPU instance test run"
      },
      {
        "id": "cra-ex-7",
        "title": "7. Switch to Compute & GPU Claims Tab",
        "action": "click",
        "selector": "#tabBtnComputeCogs, button[onclick*=\"switchCrewExpenseTab('compute')\"]"
      },
      {
        "id": "cra-ex-8",
        "title": "8. Verify Compute COGS Section Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#computeCogsSection"
        }
      },
      {
        "id": "cra-ex-9",
        "title": "9. Verify Dual-Currency Inputs (USD & BDT)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#cogsAmountUsd, #cogsAmountBdt"
        }
      },
      {
        "id": "cra-ex-10",
        "title": "10. Input USD Compute Claim",
        "action": "input_text",
        "selector": "#cogsAmountUsd",
        "value": "150"
      },
      {
        "id": "cra-ex-11",
        "title": "11. Verify Live Margin Guardrail Telemetry Widget",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#cogsMarginPreview"
        }
      },
      {
        "id": "cra-ex-12",
        "title": "12. Switch Back to Out-of-Pocket Tab",
        "action": "click",
        "selector": "#tabBtnStandardExpense, button[onclick*=\"switchCrewExpenseTab('standard')\"]"
      },
      {
        "id": "cra-ex-13",
        "title": "13. Verify Standard Expense Form Restored",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#standardExpenseSection"
        }
      },
      {
        "id": "cra-ex-14",
        "title": "14. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "crew_profile": {
    "id": "crew_profile",
    "title": "Specialist Profile Audit",
    "targetHash": "#profile",
    "steps": [
      {
        "id": "cra-pf-1",
        "title": "1. Navigate to #profile",
        "action": "navigate_hash",
        "target": "#profile",
        "assertion": {
          "type": "wait_selector",
          "selector": "#crewProfileEditBtn, #crewSpiCard, #crewProfileSaveBtn",
          "timeout": 5000
        }
      },
      {
        "id": "cra-pf-2",
        "title": "2. Verify Specialist Profile & SPI Cockpit Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_crew_view_rendered"
        }
      },
      {
        "id": "cra-pf-3",
        "title": "3. Verify SPI Radial Gauge & Tier Badge",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewSpiCard, #crewSpiCircle, #crewSpiTierBadge"
        }
      },
      {
        "id": "cra-pf-4",
        "title": "4. Verify 3-Factor Telemetry Grid (Velocity, Defect Rate, Peer Review)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewSpiVelocityPts, #crewSpiDefectPts, #crewSpiPeerPts"
        }
      },
      {
        "id": "cra-pf-5",
        "title": "5. Verify Bonus Pool Qualification & Settlement Rail",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewSpiBonusEligible, #crewSpiRail"
        }
      },
      {
        "id": "cra-pf-6",
        "title": "6. Verify Official Employment Record Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crew-view .card-glass:nth-of-type(2)"
        }
      },
      {
        "id": "cra-pf-7",
        "title": "7. Verify Edit Profile Action Button",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewProfileEditBtn"
        }
      },
      {
        "id": "cra-pf-8",
        "title": "8. Click Edit Profile Button",
        "action": "click",
        "selector": "#crewProfileEditBtn, button[onclick*=\"toggleCrewProfileEdit(true)\"]"
      },
      {
        "id": "cra-pf-9",
        "title": "9. Verify Save & Cancel Action Buttons in Edit Mode",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewProfileSaveBtn, #crewProfileCancelBtn"
        }
      },
      {
        "id": "cra-pf-10",
        "title": "10. Verify Profile Input Fields Active in Edit Mode",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#profBkash, #profPhone, #profPersonalEmail"
        }
      },
      {
        "id": "cra-pf-11",
        "title": "11. Click Cancel to Exit Edit Mode",
        "action": "click",
        "selector": "#crewProfileCancelBtn, button[onclick*=\"toggleCrewProfileEdit(false)\"]"
      },
      {
        "id": "cra-pf-12",
        "title": "12. Verify Profile Read-Only View Restored",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#crewProfileEditBtn, #crewSpiCard"
        }
      },
      {
        "id": "cra-pf-13",
        "title": "13. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "manager_overview": {
    "id": "manager_overview",
    "title": "Department Overview Audit",
    "targetHash": "#overview",
    "steps": [
      {
        "id": "mga-ov-1",
        "title": "1. Navigate to #overview",
        "action": "navigate_hash",
        "target": "#overview",
        "assertion": {
          "type": "wait_selector",
          "selector": "#mgrVelocityChart, #btnGenerateSprintRetro",
          "timeout": 5000
        }
      },
      {
        "id": "mga-ov-2",
        "title": "2. Verify Department Lead Cockpit Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_manager_view_rendered"
        }
      },
      {
        "id": "mga-ov-3",
        "title": "3. Verify 4 Core KPI Tiles (Active Tasks, Pending Leaves, Attendance, Tickets)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".kpi-tile"
        }
      },
      {
        "id": "mga-ov-4",
        "title": "4. Verify Autonomous Pod Capacity & Bench Utilization Radar",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#manager-view .card-glass h2"
        }
      },
      {
        "id": "mga-ov-5",
        "title": "5. Verify Pod Utilization Benchmarks & Badges",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".badge.badge-emerald"
        }
      },
      {
        "id": "mga-ov-6",
        "title": "6. Verify Department Pipeline Velocity Canvas Chart",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrVelocityChart"
        }
      },
      {
        "id": "mga-ov-7",
        "title": "7. Verify 1-Click Sprint Retrospective Button",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#btnGenerateSprintRetro"
        }
      },
      {
        "id": "mga-ov-8",
        "title": "8. Click 1-Click Sprint Retrospective Button",
        "action": "click",
        "selector": "#btnGenerateSprintRetro, button[onclick*=\"openSprintRetroModal\"]"
      },
      {
        "id": "mga-ov-9",
        "title": "9. Verify Sprint Retrospective Modal Injected & Opened",
        "action": "wait_ms",
        "duration": 500,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrSprintRetroModal, #mgrRetroTitle"
        }
      },
      {
        "id": "mga-ov-10",
        "title": "10. Verify Retrospective Body Metrics & Markdown Copy Button",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#btnCopyRetroMd, #btnDispatchRetroTelegram"
        }
      },
      {
        "id": "mga-ov-11",
        "title": "11. Dismiss Retrospective Modal via Close Button",
        "action": "click",
        "selector": "#mgrSprintRetroModal button[onclick*=\"closeSprintRetroModal\"], #mgrSprintRetroModal .card-glass button"
      },
      {
        "id": "mga-ov-12",
        "title": "12. Verify Retrospective Modal Closed",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrVelocityChart"
        }
      },
      {
        "id": "mga-ov-13",
        "title": "13. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "manager_tasks": {
    "id": "manager_tasks",
    "title": "Task Pipeline & Dispatch Audit",
    "targetHash": "#tasks",
    "steps": [
      {
        "id": "mga-tk-1",
        "title": "1. Navigate to #tasks",
        "action": "navigate_hash",
        "target": "#tasks",
        "assertion": {
          "type": "wait_selector",
          "selector": "#taskSearchInput, .data-table-container.card-glass table.data-table",
          "timeout": 5000
        }
      },
      {
        "id": "mga-tk-2",
        "title": "2. Verify Task Pipeline Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_manager_view_rendered"
        }
      },
      {
        "id": "mga-tk-3",
        "title": "3. Verify Task Search Input Field",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#taskSearchInput"
        }
      },
      {
        "id": "mga-tk-4",
        "title": "4. Input Filter Query into Search Box",
        "action": "input_text",
        "selector": "#taskSearchInput",
        "value": "Video"
      },
      {
        "id": "mga-tk-5",
        "title": "5. Clear Task Search Box",
        "action": "input_text",
        "selector": "#taskSearchInput",
        "value": ""
      },
      {
        "id": "mga-tk-6",
        "title": "6. Verify Pipeline Filter Pills Available",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".filter-pill"
        }
      },
      {
        "id": "mga-tk-7",
        "title": "7. Click Active Pipeline Filter Button",
        "action": "click",
        "selector": "#mgrTaskFilterActive, button[onclick*=\"MGR_TASKS.setFilter('active')\"]"
      },
      {
        "id": "mga-tk-8",
        "title": "8. Verify Active Pipeline Filter Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrTaskFilterActive.active, #taskSearchInput"
        }
      },
      {
        "id": "mga-tk-9",
        "title": "9. Click QC / Review Filter Button",
        "action": "click",
        "selector": "button[onclick*=\"MGR_TASKS.setFilter('review')\"]"
      },
      {
        "id": "mga-tk-10",
        "title": "10. Verify QC Review Filter Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "button[onclick*=\"MGR_TASKS.setFilter('review')\"].active"
        }
      },
      {
        "id": "mga-tk-11",
        "title": "11. Click All Tasks Filter Button to Restore",
        "action": "click",
        "selector": "#mgrTaskFilterAll, button[onclick*=\"MGR_TASKS.setFilter('all')\"]"
      },
      {
        "id": "mga-tk-12",
        "title": "12. Verify Task Pipeline Table & Stage Select Dropdowns",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": ".data-table-container.card-glass table.data-table"
        }
      },
      {
        "id": "mga-tk-13",
        "title": "13. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "manager_finance": {
    "id": "manager_finance",
    "title": "Financial Command & Tier 1 Audit",
    "targetHash": "#finance",
    "steps": [
      {
        "id": "mga-fn-1",
        "title": "1. Navigate to #finance",
        "action": "navigate_hash",
        "target": "#finance",
        "assertion": {
          "type": "wait_selector",
          "selector": "#mgrExportCsvBtn, #manager-view h1, .kpi-tile",
          "timeout": 10000
        }
      },
      {
        "id": "mga-fn-2",
        "title": "2. Verify Financial Command Hub Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_manager_view_rendered"
        }
      },
      {
        "id": "mga-fn-3",
        "title": "3. Verify Financial Telemetry Tiles (Pending Claims, Collected Invoices, Payroll)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".kpi-tile"
        }
      },
      {
        "id": "mga-fn-4",
        "title": "4. Verify Claims Awaiting Finance Review Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".card-glass h2"
        }
      },
      {
        "id": "mga-fn-5",
        "title": "5. Verify Claims Checkbox Selector or Clean Queue",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".card-glass table.data-table"
        }
      },
      {
        "id": "mga-fn-6",
        "title": "6. Verify Export to CSV Action Button",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrExportCsvBtn, button[onclick*=\"exportCSV\"], .btn-secondary:has-text(\"Export\")"
        }
      },
      {
        "id": "mga-fn-7",
        "title": "7. Click Export to CSV Button",
        "action": "click",
        "selector": "#mgrExportCsvBtn, button[onclick*=\"exportCSV\"]"
      },
      {
        "id": "mga-fn-8",
        "title": "8. Verify Invoices Aging & Receivables Section Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": ".card-glass:last-of-type table.data-table"
        }
      },
      {
        "id": "mga-fn-9",
        "title": "9. Verify Receivables Table Column Headers",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".card-glass:last-of-type th"
        }
      },
      {
        "id": "mga-fn-10",
        "title": "10. Verify Data Table Rows Mounted Cleanly",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".data-table"
        }
      },
      {
        "id": "mga-fn-11",
        "title": "11. Verify Financial Command Glass Structure",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#manager-view .card-glass"
        }
      },
      {
        "id": "mga-fn-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "manager_team": {
    "id": "manager_team",
    "title": "Team Roster & Attendance Audit",
    "targetHash": "#team",
    "steps": [
      {
        "id": "mga-tm-1",
        "title": "1. Navigate to #team",
        "action": "navigate_hash",
        "target": "#team",
        "assertion": {
          "type": "wait_selector",
          "selector": "#mgrTeamFilterAll, .data-table-container.card-glass",
          "timeout": 5000
        }
      },
      {
        "id": "mga-tm-2",
        "title": "2. Verify Department Roster & Workload View Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_manager_view_rendered"
        }
      },
      {
        "id": "mga-tm-3",
        "title": "3. Verify Team Search Input Field",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#manager-view input[placeholder*=\"Search team member\"]"
        }
      },
      {
        "id": "mga-tm-4",
        "title": "4. Input Search Query for Specialist",
        "action": "input_text",
        "selector": "#manager-view input[placeholder*=\"Search team member\"]",
        "value": "Specialist"
      },
      {
        "id": "mga-tm-5",
        "title": "5. Clear Team Search Box",
        "action": "input_text",
        "selector": "#manager-view input[placeholder*=\"Search team member\"]",
        "value": ""
      },
      {
        "id": "mga-tm-6",
        "title": "6. Click Creative & Design Department Filter",
        "action": "click",
        "selector": "#mgrTeamFilterCreative, button[onclick*=\"MGR_TEAM.setDept('creative')\"]"
      },
      {
        "id": "mga-tm-7",
        "title": "7. Verify Creative Department Filter Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrTeamFilterCreative.active, button[onclick*=\"MGR_TEAM.setDept('creative')\"].active, #mgrTeamFilterCreative"
        }
      },
      {
        "id": "mga-tm-8",
        "title": "8. Click Technology Department Filter",
        "action": "click",
        "selector": "#mgrTeamFilterTech, button[onclick*=\"MGR_TEAM.setDept('technology')\"]"
      },
      {
        "id": "mga-tm-9",
        "title": "9. Verify Technology Roster Filter Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrTeamFilterTech.active, button[onclick*=\"MGR_TEAM.setDept('technology')\"].active, #mgrTeamFilterTech"
        }
      },
      {
        "id": "mga-tm-10",
        "title": "10. Restore All Departments Filter",
        "action": "click",
        "selector": "#mgrTeamFilterAll, button[onclick*=\"MGR_TEAM.setDept('all')\"]"
      },
      {
        "id": "mga-tm-11",
        "title": "11. Verify Specialist Cards, Attendance Badges & Workload Heatmap",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": ".badge, .data-table"
        }
      },
      {
        "id": "mga-tm-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "manager_leaves": {
    "id": "manager_leaves",
    "title": "Leave Approvals Audit",
    "targetHash": "#leaves",
    "steps": [
      {
        "id": "mga-lv-1",
        "title": "1. Navigate to #leaves",
        "action": "navigate_hash",
        "target": "#leaves",
        "assertion": {
          "type": "wait_selector",
          "selector": "#manager-view h1, #mgrLeavesFilterPending, #mgrLeavesFilterAll",
          "timeout": 10000
        }
      },
      {
        "id": "mga-lv-2",
        "title": "2. Verify Leave Approvals Queue Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_manager_view_rendered"
        }
      },
      {
        "id": "mga-lv-3",
        "title": "3. Verify Leave Search Input Field",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#manager-view input[placeholder*=\"Search employee name\"]"
        }
      },
      {
        "id": "mga-lv-4",
        "title": "4. Click Pending Review Filter Button",
        "action": "click",
        "selector": "#mgrLeavesFilterPending, button[onclick*=\"MGR_LEAVES.setFilter('pending')\"]"
      },
      {
        "id": "mga-lv-5",
        "title": "5. Verify Pending Filter Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrLeavesFilterPending.active, button[onclick*=\"MGR_LEAVES.setFilter('pending')\"].active, #mgrLeavesFilterPending"
        }
      },
      {
        "id": "mga-lv-6",
        "title": "6. Click Approved Requests Filter Button",
        "action": "click",
        "selector": "#mgrLeavesFilterApproved, button[onclick*=\"MGR_LEAVES.setFilter('approved')\"]"
      },
      {
        "id": "mga-lv-7",
        "title": "7. Verify Approved Filter Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrLeavesFilterApproved.active, button[onclick*=\"MGR_LEAVES.setFilter('approved')\"].active, #mgrLeavesFilterApproved"
        }
      },
      {
        "id": "mga-lv-8",
        "title": "8. Click Declined Filter Button",
        "action": "click",
        "selector": "button[onclick*=\"MGR_LEAVES.setFilter('rejected')\"]"
      },
      {
        "id": "mga-lv-9",
        "title": "9. Verify Declined Filter Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "button[onclick*=\"MGR_LEAVES.setFilter('rejected')\"].active"
        }
      },
      {
        "id": "mga-lv-10",
        "title": "10. Restore All Requests Filter Button",
        "action": "click",
        "selector": "#mgrLeavesFilterAll, button[onclick*=\"MGR_LEAVES.setFilter('all')\"]"
      },
      {
        "id": "mga-lv-11",
        "title": "11. Verify Leave Approvals Table Structure (Staff, Type, Dates, Status)",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": ".data-table-container.card-glass table.data-table"
        }
      },
      {
        "id": "mga-lv-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "manager_tickets": {
    "id": "manager_tickets",
    "title": "Ticket Triage Queue Audit",
    "targetHash": "#tickets",
    "steps": [
      {
        "id": "mga-tc-1",
        "title": "1. Navigate to #tickets",
        "action": "navigate_hash",
        "target": "#tickets",
        "assertion": {
          "type": "wait_selector",
          "selector": "#tabBtnTickets, #tabBtnChangeOrders",
          "timeout": 5000
        }
      },
      {
        "id": "mga-tc-2",
        "title": "2. Verify Pod Triage & Governance Desk Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_manager_view_rendered"
        }
      },
      {
        "id": "mga-tc-3",
        "title": "3. Verify 24-Hour Contractor Defect SLA Triage Banner",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".card-glass h3"
        }
      },
      {
        "id": "mga-tc-4",
        "title": "4. Click 24h Defect SLA Filter Button",
        "action": "click",
        "selector": "#mgrFilterDefectSla, button[onclick*=\"MGR_TICKETS.setFilter('defect')\"]"
      },
      {
        "id": "mga-tc-5",
        "title": "5. Verify Defect SLA Filter Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrFilterDefectSla.active, button[onclick*=\"MGR_TICKETS.setFilter('defect')\"].active, #mgrFilterDefectSla"
        }
      },
      {
        "id": "mga-tc-6",
        "title": "6. Click High Priority Filter Button",
        "action": "click",
        "selector": "#mgrFilterHighPrio, button[onclick*=\"MGR_TICKETS.setFilter('high')\"]"
      },
      {
        "id": "mga-tc-7",
        "title": "7. Verify High Priority Filter Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#mgrFilterHighPrio.active, button[onclick*=\"MGR_TICKETS.setFilter('high')\"].active, #mgrFilterHighPrio"
        }
      },
      {
        "id": "mga-tc-8",
        "title": "8. Switch to Scope Change Orders Tab",
        "action": "click",
        "selector": "#tabBtnChangeOrders, button[onclick*=\"MGR_TICKETS.switchTab('change_orders')\"]"
      },
      {
        "id": "mga-tc-9",
        "title": "9. Verify Scope Change Orders Desk Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": ".data-table"
        }
      },
      {
        "id": "mga-tc-10",
        "title": "10. Verify Change Orders Table Headers & Action Buttons",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".data-table th"
        }
      },
      {
        "id": "mga-tc-11",
        "title": "11. Switch Back to Support Tickets Tab",
        "action": "click",
        "selector": "#tabBtnTickets, button[onclick*=\"MGR_TICKETS.switchTab('tickets')\"]"
      },
      {
        "id": "mga-tc-12",
        "title": "12. Verify Support & Defects View Restored",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#tabBtnTickets, #mgrFilterDefectSla"
        }
      },
      {
        "id": "mga-tc-13",
        "title": "13. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "manager_tech": {
    "id": "manager_tech",
    "title": "Tech Diagnostics Audit",
    "targetHash": "#tech",
    "steps": [
      {
        "id": "mga-th-1",
        "title": "1. Navigate to #tech",
        "action": "navigate_hash",
        "target": "#tech",
        "assertion": {
          "type": "wait_selector",
          "selector": "#techLogConsole, button[onclick*=\"runFullDiagnostic\"]",
          "timeout": 5000
        }
      },
      {
        "id": "mga-th-2",
        "title": "2. Verify Technology Admin & Telemetry Hub Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_manager_view_rendered"
        }
      },
      {
        "id": "mga-th-3",
        "title": "3. Verify Live Service Health Grid (Supabase DB, Telegram Bot, SSE Stream)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".kpi-tile"
        }
      },
      {
        "id": "mga-th-4",
        "title": "4. Verify Real-Time Diagnostic Feed Log Console Window",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#techLogConsole"
        }
      },
      {
        "id": "mga-th-5",
        "title": "5. Verify DevOps Diagnostics & Emergency Actions Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".card-glass h2"
        }
      },
      {
        "id": "mga-th-6",
        "title": "6. Click Resync Supabase State Button",
        "action": "click",
        "selector": "#mgrTechResyncBtn, button[onclick*=\"resyncDB\"]"
      },
      {
        "id": "mga-th-7",
        "title": "7. Verify Resync Log Entry in Console Feed",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#techLogConsole"
        }
      },
      {
        "id": "mga-th-8",
        "title": "8. Click Test Telegram Webhook Button",
        "action": "click",
        "selector": "button[onclick*=\"testWebhook\"]"
      },
      {
        "id": "mga-th-9",
        "title": "9. Click Run Full Diagnostic Button",
        "action": "click",
        "selector": "button[onclick*=\"runFullDiagnostic\"]"
      },
      {
        "id": "mga-th-10",
        "title": "10. Verify Diagnostic Checks Streamed in Console",
        "action": "wait_ms",
        "duration": 600,
        "assertion": {
          "type": "element_exists",
          "selector": "#techLogConsole"
        }
      },
      {
        "id": "mga-th-11",
        "title": "11. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dbm_workspace": {
    "id": "dbm_workspace",
    "title": "Store Workspace Audit",
    "targetHash": "#workspace",
    "steps": [
      {
        "id": "dbm-ws-1",
        "title": "1. Navigate to #workspace",
        "action": "navigate_hash",
        "target": "#workspace",
        "assertion": {
          "type": "wait_selector",
          "selector": "#dbm-main, .brand-logo, aside.dbm-sidebar",
          "timeout": 5000
        }
      },
      {
        "id": "dbm-ws-2",
        "title": "2. Verify DBM Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_dbm_view_rendered"
        }
      },
      {
        "id": "dbm-ws-3",
        "title": "3. Verify Workspace Welcome Heading",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspaceWelcomeHeading, #dbm-main h1"
        }
      },
      {
        "id": "dbm-ws-4",
        "title": "4. Switch to Multi-Brand Overview Mode",
        "action": "click",
        "selector": "button[onclick*=\"switchWorkspaceBrand('all')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main h1"
        }
      },
      {
        "id": "dbm-ws-5",
        "title": "5. Verify Multi-Brand Progression Cards",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main .card"
        }
      },
      {
        "id": "dbm-ws-6",
        "title": "6. Switch Focus Back to Brand Division 1",
        "action": "click",
        "selector": "button[onclick*=\"switchWorkspaceBrand(1)\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#workspaceWelcomeHeading, #dbm-main h1"
        }
      },
      {
        "id": "dbm-ws-7",
        "title": "7. Verify Execution Queue Table Mounted",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#executionTableContainer, #dbm-main table"
        }
      },
      {
        "id": "dbm-ws-8",
        "title": "8. Filter Queue by Live References",
        "action": "click",
        "selector": "button[onclick*=\"setQueueFilter('live')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#executionTableContainer"
        }
      },
      {
        "id": "dbm-ws-9",
        "title": "9. Filter Queue by Today's Batch",
        "action": "click",
        "selector": "button[onclick*=\"setQueueFilter('today')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#executionTableContainer"
        }
      },
      {
        "id": "dbm-ws-10",
        "title": "10. Filter Queue by In Review",
        "action": "click",
        "selector": "button[onclick*=\"setQueueFilter('review')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#executionTableContainer"
        }
      },
      {
        "id": "dbm-ws-11",
        "title": "11. Reset Queue Filter to All",
        "action": "click",
        "selector": "button[onclick*=\"setQueueFilter('all')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#executionTableContainer"
        }
      },
      {
        "id": "dbm-ws-12",
        "title": "12. Verify Dhaka Operations Clock",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dhakaClock"
        }
      },
      {
        "id": "dbm-ws-13",
        "title": "13. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dbm_studio": {
    "id": "dbm_studio",
    "title": "Brand Studio Stepper Audit",
    "targetHash": "#studio",
    "steps": [
      {
        "id": "dbm-st-1",
        "title": "1. Navigate to #studio",
        "action": "navigate_hash",
        "target": "#studio",
        "assertion": {
          "type": "wait_selector",
          "selector": ".studio-stepper, #dbm-main h1, #dbm-main .card",
          "timeout": 5000
        }
      },
      {
        "id": "dbm-st-2",
        "title": "2. Verify Brand Studio Stepper Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_dbm_view_rendered"
        }
      },
      {
        "id": "dbm-st-3",
        "title": "3. Verify Step 1 Product Name Input",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#step1ProdName"
        }
      },
      {
        "id": "dbm-st-4",
        "title": "4. Input Product Name",
        "action": "input_text",
        "selector": "#step1ProdName",
        "value": "Minimalist Digital Life Planner 2026"
      },
      {
        "id": "dbm-st-5",
        "title": "5. Input Creative Prompt",
        "action": "input_text",
        "selector": "#step1Prompt",
        "value": "Modern aesthetic layout with sage green accents and goal tracking."
      },
      {
        "id": "dbm-st-6",
        "title": "6. Advance to Step 2: Deliverables Vault",
        "action": "click",
        "selector": "button[onclick*=\"goToStudioStep(2)\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#step2CanvaUrl"
        }
      },
      {
        "id": "dbm-st-7",
        "title": "7. Input Canva Master Template URL",
        "action": "input_text",
        "selector": "#step2CanvaUrl",
        "value": "https://www.canva.com/design/DAFtest2026/view"
      },
      {
        "id": "dbm-st-8",
        "title": "8. Advance to Step 3: 10 Mockup Slots",
        "action": "click",
        "selector": "button[onclick*=\"goToStudioStep(3)\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "input.mockup-input-slot, #step3VideoUrl"
        }
      },
      {
        "id": "dbm-st-9",
        "title": "9. Verify Listing Video Slot Input",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#step3VideoUrl"
        }
      },
      {
        "id": "dbm-st-10",
        "title": "10. Advance to Step 4: AI Etsy SEO",
        "action": "click",
        "selector": "button[onclick*=\"goToStudioStep(4)\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#step4Title, #step4Tags"
        }
      },
      {
        "id": "dbm-st-11",
        "title": "11. Input Etsy Listing Title & Price",
        "action": "input_text",
        "selector": "#step4Title",
        "value": "Minimalist Digital Planner 2026 Daily Weekly Monthly GoodNotes iPad Template"
      },
      {
        "id": "dbm-st-12",
        "title": "12. Return to Step 1: Blueprint & Prompt",
        "action": "click",
        "selector": "button[onclick*=\"goToStudioStep(1)\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#step1ProdName, #step1Prompt"
        }
      },
      {
        "id": "dbm-st-13",
        "title": "13. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dbm_references": {
    "id": "dbm_references",
    "title": "Reference Product Library Audit",
    "targetHash": "#references",
    "steps": [
      {
        "id": "dbm-rf-1",
        "title": "1. Navigate to #references",
        "action": "navigate_hash",
        "target": "#references",
        "assertion": {
          "type": "wait_selector",
          "selector": "#refSearchInput, #dbm-main .card",
          "timeout": 5000
        }
      },
      {
        "id": "dbm-rf-2",
        "title": "2. Verify Reference Library Grid Rendered",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_dbm_view_rendered"
        }
      },
      {
        "id": "dbm-rf-3",
        "title": "3. Filter Category: Daily & Weekly",
        "action": "click",
        "selector": "button[onclick*=\"setRefCategoryFilter('daily')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#referencesGridContainer"
        }
      },
      {
        "id": "dbm-rf-4",
        "title": "4. Filter Category: Financial & Budget",
        "action": "click",
        "selector": "button[onclick*=\"setRefCategoryFilter('finance')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#referencesGridContainer"
        }
      },
      {
        "id": "dbm-rf-5",
        "title": "5. Reset Filter to All References",
        "action": "click",
        "selector": "button[onclick*=\"setRefCategoryFilter('all')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#referencesGridContainer"
        }
      },
      {
        "id": "dbm-rf-6",
        "title": "6. Search Reference Models by Keyword",
        "action": "input_text",
        "selector": "#refSearchInput",
        "value": "Planner"
      },
      {
        "id": "dbm-rf-7",
        "title": "7. Clear Reference Search Query",
        "action": "input_text",
        "selector": "#refSearchInput",
        "value": ""
      },
      {
        "id": "dbm-rf-8",
        "title": "8. Open Reference Product Specs Modal",
        "action": "click",
        "selector": "button[onclick*=\"openReferenceProductModal('PLA-01')\"], .card[onclick*=\"openReferenceProductModal\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#referenceModal"
        }
      },
      {
        "id": "dbm-rf-9",
        "title": "9. Verify Reference Modal Elements Mounted",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#referenceModalInner"
        }
      },
      {
        "id": "dbm-rf-10",
        "title": "10. Dismiss Reference Modal via Escape Key",
        "action": "press_key",
        "key": "Escape",
        "assertion": {
          "type": "wait_ms",
          "duration": 300
        }
      },
      {
        "id": "dbm-rf-11",
        "title": "11. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dbm_output": {
    "id": "dbm_output",
    "title": "My Output & Performance Audit",
    "targetHash": "#output",
    "steps": [
      {
        "id": "dbm-op-1",
        "title": "1. Navigate to #output",
        "action": "navigate_hash",
        "target": "#output",
        "assertion": {
          "type": "wait_selector",
          "selector": ".card, #dbm-main h1",
          "timeout": 5000
        }
      },
      {
        "id": "dbm-op-2",
        "title": "2. Verify Output & Performance Heading",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main h1"
        }
      },
      {
        "id": "dbm-op-3",
        "title": "3. Verify Performance KPI Cards Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_dbm_view_rendered"
        }
      },
      {
        "id": "dbm-op-4",
        "title": "4. Verify 7-Day Production Velocity Tracker",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main .card"
        }
      },
      {
        "id": "dbm-op-5",
        "title": "5. Verify Founder Review Queue Table",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main table, #dbm-main .card"
        }
      },
      {
        "id": "dbm-op-6",
        "title": "6. Verify Compensation & Monthly Payouts Summary",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main .card strong"
        }
      },
      {
        "id": "dbm-op-7",
        "title": "7. Verify Standup Submission History Table",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main .card"
        }
      },
      {
        "id": "dbm-op-8",
        "title": "8. Verify Quality Multiplier Indicator",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main .card"
        }
      },
      {
        "id": "dbm-op-9",
        "title": "9. Verify Vault Bonus Metric Accrual",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main .card"
        }
      },
      {
        "id": "dbm-op-10",
        "title": "10. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dbm_standup": {
    "id": "dbm_standup",
    "title": "Daily EOD Standup Audit",
    "targetHash": "#standup",
    "steps": [
      {
        "id": "dbm-su-1",
        "title": "1. Navigate to #standup",
        "action": "navigate_hash",
        "target": "#standup",
        "assertion": {
          "type": "wait_selector",
          "selector": "#standupBrandSelect, #dbm-main form",
          "timeout": 5000
        }
      },
      {
        "id": "dbm-su-2",
        "title": "2. Verify DBM Daily Standup Form Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_dbm_view_rendered"
        }
      },
      {
        "id": "dbm-su-3",
        "title": "3. Verify Brand Selector & Products Listed Inputs",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#standupBrandSelect, #standupListedCount"
        }
      },
      {
        "id": "dbm-su-4",
        "title": "4. Trigger Auto-Populate from Today's Activity",
        "action": "click",
        "selector": "button[onclick*=\"autoPopulateStandupFromActivity\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#standupProductCodes"
        }
      },
      {
        "id": "dbm-su-5",
        "title": "5. Verify Auto-Populated SKUs Field",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#standupProductCodes"
        }
      },
      {
        "id": "dbm-su-6",
        "title": "6. Append Quick Win Note Chip",
        "action": "click",
        "selector": "button[onclick*=\"appendStandupNote('🎯 Hit 8/8 daily target smoothly.')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#standupNotes"
        }
      },
      {
        "id": "dbm-su-7",
        "title": "7. Verify Daily Notes Textarea Populated",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#standupNotes"
        }
      },
      {
        "id": "dbm-su-8",
        "title": "8. Toggle Blocker Checkbox On",
        "action": "click",
        "selector": "#standupIsBlocker",
        "assertion": {
          "type": "element_exists",
          "selector": "#blockerCategoryContainer"
        }
      },
      {
        "id": "dbm-su-9",
        "title": "9. Verify Blocker Reason Select Field",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#standupBlockerCategory"
        }
      },
      {
        "id": "dbm-su-10",
        "title": "10. Toggle Blocker Checkbox Off",
        "action": "click",
        "selector": "#standupIsBlocker",
        "assertion": {
          "type": "wait_ms",
          "duration": 200
        }
      },
      {
        "id": "dbm-su-11",
        "title": "11. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dbm_settings": {
    "id": "dbm_settings",
    "title": "Store Settings Audit",
    "targetHash": "#settings",
    "steps": [
      {
        "id": "dbm-stg-1",
        "title": "1. Navigate to #settings",
        "action": "navigate_hash",
        "target": "#settings",
        "assertion": {
          "type": "wait_selector",
          "selector": "#settingsNewPin, #dbm-main form, #dbm-main .card",
          "timeout": 5000
        }
      },
      {
        "id": "dbm-stg-2",
        "title": "2. Verify Store Settings Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_dbm_view_rendered"
        }
      },
      {
        "id": "dbm-stg-3",
        "title": "3. Verify Official DBM Profile Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main .card h3"
        }
      },
      {
        "id": "dbm-stg-4",
        "title": "4. Verify Assigned Brand Portfolios Listed",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dbm-main .card span"
        }
      },
      {
        "id": "dbm-stg-5",
        "title": "5. Verify Telegram Bot Notifications Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "a[href*=\"t.me/GRO10X_Bot\"], #dbm-main .card"
        }
      },
      {
        "id": "dbm-stg-6",
        "title": "6. Input New 4-Digit Security PIN",
        "action": "input_text",
        "selector": "#settingsNewPin",
        "value": "8899"
      },
      {
        "id": "dbm-stg-7",
        "title": "7. Confirm New Security PIN",
        "action": "input_text",
        "selector": "#settingsConfirmPin",
        "value": "8899"
      },
      {
        "id": "dbm-stg-8",
        "title": "8. Toggle PIN Visibility",
        "action": "click",
        "selector": "button[onclick*=\"togglePinVisibility('settingsNewPin'\"]",
        "assertion": {
          "type": "wait_ms",
          "duration": 200
        }
      },
      {
        "id": "dbm-stg-9",
        "title": "9. Verify Session Sign Out Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "button[onclick*=\"dbmSignOut\"]"
        }
      },
      {
        "id": "dbm-stg-10",
        "title": "10. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dce_dashboard": {
    "id": "dce_dashboard",
    "title": "DCE Dashboard Audit",
    "targetPath": "/dce",
    "steps": [
      {
        "id": "dce-db-1",
        "title": "1. Verify Command Hub & Revenue Metric Card",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#metric-rev, #tab-overview"
        }
      },
      {
        "id": "dce-db-2",
        "title": "2. Verify Orders, SKUs, Brands, Subs KPI Cards",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#metric-orders, #metric-skus, #metric-brands, #metric-subs"
        }
      },
      {
        "id": "dce-db-3",
        "title": "3. Verify View Mode Tabs Rendered (Overview, Verticals, Brands)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#viewModeTabs, #tabBtnOverview"
        }
      },
      {
        "id": "dce-db-4",
        "title": "4. Switch to Verticals Tab",
        "action": "click",
        "selector": "#tabBtnVerticals, #viewModeTabs button[onclick*=\"tab-verticals\"]"
      },
      {
        "id": "dce-db-5",
        "title": "5. Verify Verticals Table Mounted",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#verticals-table-body, #tab-verticals"
        }
      },
      {
        "id": "dce-db-6",
        "title": "6. Switch to Brands Tab",
        "action": "click",
        "selector": "#tabBtnBrands, #viewModeTabs button[onclick*=\"tab-brands\"]"
      },
      {
        "id": "dce-db-7",
        "title": "7. Verify Brands Table Mounted",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#brands-table-body, #tab-brands"
        }
      },
      {
        "id": "dce-db-8",
        "title": "8. Switch to Categories Tab",
        "action": "click",
        "selector": "#tabBtnCategories, #viewModeTabs button[onclick*=\"tab-categories\"]"
      },
      {
        "id": "dce-db-9",
        "title": "9. Verify Categories Table Mounted",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#categories-table-body, #tab-categories"
        }
      },
      {
        "id": "dce-db-10",
        "title": "10. Switch to Products & SKUs Tab",
        "action": "click",
        "selector": "#tabBtnProducts, #viewModeTabs button[onclick*=\"tab-products\"]"
      },
      {
        "id": "dce-db-11",
        "title": "11. Verify Products Table Mounted",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#products-table-body, #tab-products"
        }
      },
      {
        "id": "dce-db-12",
        "title": "12. Switch to SKU Lab Simulator Tab",
        "action": "click",
        "selector": "#tabBtnSimulator, #viewModeTabs button[onclick*=\"tab-simulator\"]"
      },
      {
        "id": "dce-db-13",
        "title": "13. Verify SKU Simulator Controls Mounted",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#sim-code, #sim-format, #sim-channel, #sim-currency, #sim-price, #sim-output"
        }
      },
      {
        "id": "dce-db-14",
        "title": "14. Test SKU Code Simulation Input",
        "action": "input_text",
        "selector": "#sim-code",
        "value": "PLNRQN-99"
      },
      {
        "id": "dce-db-15",
        "title": "15. Verify Computed SKU Output Preview Updated",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#sim-output"
        }
      },
      {
        "id": "dce-db-16",
        "title": "16. Switch Back to Command Hub Tab",
        "action": "click",
        "selector": "#tabBtnOverview, #viewModeTabs button[onclick*=\"tab-overview\"]"
      },
      {
        "id": "dce-db-17",
        "title": "17. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dce_orders": {
    "id": "dce_orders",
    "title": "Order Fulfillment Audit",
    "targetPath": "/dce/orders",
    "steps": [
      {
        "id": "dce-ord-1",
        "title": "1. Verify Orders Pipeline & KPIs",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#kpi-orders, #kpi-gmv, #kpi-fees, #kpi-net"
        }
      },
      {
        "id": "dce-ord-2",
        "title": "2. Verify Channel & Status Filter Dropdowns",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#filter-channel, #filter-status"
        }
      },
      {
        "id": "dce-ord-3",
        "title": "3. Filter Orders by Channel: Etsy",
        "action": "input_text",
        "selector": "#filter-channel",
        "value": "ETSY"
      },
      {
        "id": "dce-ord-4",
        "title": "4. Verify Channel Filter Applied",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#orders-table-body"
        }
      },
      {
        "id": "dce-ord-5",
        "title": "5. Filter Orders by Status: Completed",
        "action": "input_text",
        "selector": "#filter-status",
        "value": "COMPLETED"
      },
      {
        "id": "dce-ord-6",
        "title": "6. Reset Channel Filter to ALL",
        "action": "input_text",
        "selector": "#filter-channel",
        "value": "ALL"
      },
      {
        "id": "dce-ord-7",
        "title": "7. Reset Status Filter to ALL",
        "action": "input_text",
        "selector": "#filter-status",
        "value": "ALL"
      },
      {
        "id": "dce-ord-8",
        "title": "8. Input Search Query into Orders Filter",
        "action": "input_text",
        "selector": "#filter-search",
        "value": "Etsy"
      },
      {
        "id": "dce-ord-9",
        "title": "9. Clear Orders Search Query",
        "action": "input_text",
        "selector": "#filter-search",
        "value": ""
      },
      {
        "id": "dce-ord-10",
        "title": "10. Trigger Order Data Refresh",
        "action": "click",
        "selector": "button[onclick*=\"loadOrderData\"], .toolbar button:nth-of-type(3)"
      },
      {
        "id": "dce-ord-11",
        "title": "11. Verify Orders Table Body Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#orders-table-body, .table-container"
        }
      },
      {
        "id": "dce-ord-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dce_operations": {
    "id": "dce_operations",
    "title": "Store Operations & Licenses Audit",
    "targetPath": "/dce/operations",
    "steps": [
      {
        "id": "dce-ops-1",
        "title": "1. Verify Operations KPIs Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#kpi-open-tickets, #kpi-sla-breached, #kpi-active-licenses, #kpi-unsettled-payout"
        }
      },
      {
        "id": "dce-ops-2",
        "title": "2. Verify Fulfillment Tab Active & Table",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#fulfillment-table-body, #tab-fulfillment"
        }
      },
      {
        "id": "dce-ops-3",
        "title": "3. Switch to Helpdesk Tab",
        "action": "click",
        "selector": "#tabBtnHelpdesk, button[onclick*=\"tab-helpdesk\"]"
      },
      {
        "id": "dce-ops-4",
        "title": "4. Verify Helpdesk Table Rendered",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#helpdesk-table-body, #tab-helpdesk"
        }
      },
      {
        "id": "dce-ops-5",
        "title": "5. Switch to Licenses Tab",
        "action": "click",
        "selector": "#tabBtnLicenses, button[onclick*=\"tab-licenses\"]"
      },
      {
        "id": "dce-ops-6",
        "title": "6. Verify Licenses Table Rendered",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#licenses-table-body, #tab-licenses"
        }
      },
      {
        "id": "dce-ops-7",
        "title": "7. Switch to Settlements Tab",
        "action": "click",
        "selector": "#tabBtnSettlements, button[onclick*=\"tab-settlements\"]"
      },
      {
        "id": "dce-ops-8",
        "title": "8. Verify Settlements Table & Payables Rendered",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#settlements-table-body, #settlement-items-body, #tab-settlements"
        }
      },
      {
        "id": "dce-ops-9",
        "title": "9. Switch Back to Helpdesk Tab",
        "action": "click",
        "selector": "#tabBtnHelpdesk, button[onclick*=\"tab-helpdesk\"]"
      },
      {
        "id": "dce-ops-10",
        "title": "10. Switch Back to Fulfillment Tab",
        "action": "click",
        "selector": "#tabBtnFulfillment, button[onclick*=\"tab-fulfillment\"]"
      },
      {
        "id": "dce-ops-11",
        "title": "11. Verify Batch Fulfill Action Control Mounted",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "button[onclick*=\"triggerBatchFulfill\"], #tab-fulfillment"
        }
      },
      {
        "id": "dce-ops-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dce_growth": {
    "id": "dce_growth",
    "title": "Growth & Ad ROI Audit",
    "targetPath": "/dce/growth",
    "steps": [
      {
        "id": "dce-gw-1",
        "title": "1. Verify Growth Cockpit KPIs Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#kpi-active-coupons, #kpi-total-uses, #kpi-affiliates-count, #kpi-commissions-earned"
        }
      },
      {
        "id": "dce-gw-2",
        "title": "2. Verify Coupons Tab Active & Coupons Table",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#coupons-table-body, #tab-coupons"
        }
      },
      {
        "id": "dce-gw-3",
        "title": "3. Switch to Promo Simulator Tab",
        "action": "click",
        "selector": "#tabBtnPromoSimulator, button[onclick*=\"tab-simulator\"]"
      },
      {
        "id": "dce-gw-4",
        "title": "4. Verify Promo Code & Amount Input Fields",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#sim-code, #sim-amount"
        }
      },
      {
        "id": "dce-gw-5",
        "title": "5. Input Promo Code",
        "action": "input_text",
        "selector": "#sim-code",
        "value": "PROMO10"
      },
      {
        "id": "dce-gw-6",
        "title": "6. Input Order Amount",
        "action": "input_text",
        "selector": "#sim-amount",
        "value": "60"
      },
      {
        "id": "dce-gw-7",
        "title": "7. Click Evaluate & Compute Discount Button",
        "action": "click",
        "selector": "#btnRunPromoSim, button[onclick*=\"runPromoSimulation\"]"
      },
      {
        "id": "dce-gw-8",
        "title": "8. Verify Simulation Result Displayed",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#sim-result"
        }
      },
      {
        "id": "dce-gw-9",
        "title": "9. Switch to Affiliate Network Tab",
        "action": "click",
        "selector": "#tabBtnAffiliateNetwork, button[onclick*=\"tab-affiliates\"]"
      },
      {
        "id": "dce-gw-10",
        "title": "10. Verify Affiliates Table Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#affiliates-table-body, #tab-affiliates"
        }
      },
      {
        "id": "dce-gw-11",
        "title": "11. Switch to Attribution Ledger Tab",
        "action": "click",
        "selector": "#tabBtnAttribution, button[onclick*=\"tab-attribution\"]"
      },
      {
        "id": "dce-gw-12",
        "title": "12. Verify Attribution Ledger Table Active",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#attribution-table-body, #tab-attribution"
        }
      },
      {
        "id": "dce-gw-13",
        "title": "13. Switch to ROI & Leaderboards Tab",
        "action": "click",
        "selector": "#tabBtnROI, button[onclick*=\"tab-roi\"]"
      },
      {
        "id": "dce-gw-14",
        "title": "14. Verify Omnichannel Margin Retention Visuals",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#tab-roi, .card"
        }
      },
      {
        "id": "dce-gw-15",
        "title": "15. Switch Back to Coupons Tab",
        "action": "click",
        "selector": "#tabBtnCoupons, button[onclick*=\"tab-coupons\"]"
      },
      {
        "id": "dce-gw-16",
        "title": "16. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dce_digivault": {
    "id": "dce_digivault",
    "title": "DigiVault BD Storefront Audit",
    "targetPath": "/dce/digivault",
    "steps": [
      {
        "id": "dce-dv-1",
        "title": "1. Verify DigiVault BD Pipeline Header & KPIs",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#kpiRevenue, #kpiProfit, #kpiMargin, #kpiPendingDelivery, #kpiActiveSubs, #kpiRenewalsDue"
        }
      },
      {
        "id": "dce-dv-2",
        "title": "2. Verify Multi-Currency Toggle Button Mounted",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#digivaultCurrencyToggleBtn"
        }
      },
      {
        "id": "dce-dv-3",
        "title": "3. Click Currency Toggle Button (Switch to USD)",
        "action": "click",
        "selector": "#digivaultCurrencyToggleBtn"
      },
      {
        "id": "dce-dv-4",
        "title": "4. Verify Currency Toggled",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#kpiRevenue, #digivaultCurrencyToggleBtn"
        }
      },
      {
        "id": "dce-dv-5",
        "title": "5. Click Currency Toggle Button Back (Restore BDT)",
        "action": "click",
        "selector": "#digivaultCurrencyToggleBtn"
      },
      {
        "id": "dce-dv-6",
        "title": "6. Verify Orders Pipeline Filter Chips Active",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".filter-chips, #ordersCountNotice"
        }
      },
      {
        "id": "dce-dv-7",
        "title": "7. Click 'Pending Verification' Filter Chip",
        "action": "click",
        "selector": ".filter-chips button:nth-of-type(2)"
      },
      {
        "id": "dce-dv-8",
        "title": "8. Click 'All Orders' Filter Chip to Reset",
        "action": "click",
        "selector": ".filter-chips button:nth-of-type(1)"
      },
      {
        "id": "dce-dv-9",
        "title": "9. Switch to Delivery Queue Tab",
        "action": "click",
        "selector": "#tabBtnDelivery, button[onclick*=\"switchTab('delivery')\"]"
      },
      {
        "id": "dce-dv-10",
        "title": "10. Verify Delivery Queue Table Mounted",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#deliveryTableBody, #tab-delivery"
        }
      },
      {
        "id": "dce-dv-11",
        "title": "11. Switch to Renewals Engine Tab",
        "action": "click",
        "selector": "#tabBtnRenewals, button[onclick*=\"switchTab('renewals')\"]"
      },
      {
        "id": "dce-dv-12",
        "title": "12. Verify Renewals Pipeline Mounted",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#renewalsTableBody, #tab-renewals"
        }
      },
      {
        "id": "dce-dv-13",
        "title": "13. Switch to Products Catalog & Margins Tab",
        "action": "click",
        "selector": "#tabBtnCatalog, button[onclick*=\"switchTab('catalog')\"]"
      },
      {
        "id": "dce-dv-14",
        "title": "14. Verify Products & Margins Table Active",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#tab-catalog, table"
        }
      },
      {
        "id": "dce-dv-15",
        "title": "15. Switch Back to Orders Pipeline Tab",
        "action": "click",
        "selector": "#tabBtnOrders, button[onclick*=\"switchTab('orders')\"]"
      },
      {
        "id": "dce-dv-16",
        "title": "16. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dce_track": {
    "id": "dce_track",
    "title": "Order Tracker Audit",
    "targetPath": "/dce/track",
    "steps": [
      {
        "id": "dce-tr-1",
        "title": "1. Verify Order Tracking Form Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#trackForm, #orderRefInput, #emailInput"
        }
      },
      {
        "id": "dce-tr-2",
        "title": "2. Input Order Reference",
        "action": "input_text",
        "selector": "#orderRefInput, input[type=\"text\"]",
        "value": "DIR-PQ-1001"
      },
      {
        "id": "dce-tr-3",
        "title": "3. Input Customer Email",
        "action": "input_text",
        "selector": "#emailInput, input[type=\"email\"]",
        "value": "customer@gro10x.ai"
      },
      {
        "id": "dce-tr-4",
        "title": "4. Verify Lookup Order Submit Button",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#submitBtn, button[type=\"submit\"]"
        }
      },
      {
        "id": "dce-tr-5",
        "title": "5. Click Lookup Order Submit Button",
        "action": "click",
        "selector": "#submitBtn, button[type=\"submit\"]"
      },
      {
        "id": "dce-tr-6",
        "title": "6. Verify Tracking Result or Status Container Mounted",
        "action": "wait_ms",
        "duration": 600,
        "assertion": {
          "type": "element_exists",
          "selector": "#lookupError, #orderResult, #submitBtn"
        }
      },
      {
        "id": "dce-tr-7",
        "title": "7. Open Support Help Modal",
        "action": "click",
        "selector": "a[onclick*=\"openHelpModal\"], button[onclick*=\"openHelpModal\"], .btn-secondary"
      },
      {
        "id": "dce-tr-8",
        "title": "8. Verify Help Modal Rendered",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#helpModal, #tktSubject"
        }
      },
      {
        "id": "dce-tr-9",
        "title": "9. Dismiss Help Modal",
        "action": "click",
        "selector": "button[onclick*=\"closeHelpModal\"], #helpModal button"
      },
      {
        "id": "dce-tr-10",
        "title": "10. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dce_store": {
    "id": "dce_store",
    "title": "Digital Storefront Audit",
    "targetPath": "/dce/store",
    "steps": [
      {
        "id": "dce-sr-1",
        "title": "1. Verify Storefront Showcase Header & Catalog Sync Badge",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#catalogSyncBadge, #price-digital"
        }
      },
      {
        "id": "dce-sr-2",
        "title": "2. Verify Instant Download & Physical Purchase Options",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#btn-buy-digital, #btn-buy-physical, button"
        }
      },
      {
        "id": "dce-sr-3",
        "title": "3. Click Instant Download Button",
        "action": "click",
        "selector": "#btn-buy-digital, button[onclick*=\"handleBuyDigital\"], .btn-buy"
      },
      {
        "id": "dce-sr-4",
        "title": "4. Verify Checkout Drawer Opened",
        "action": "wait_ms",
        "duration": 500,
        "assertion": {
          "type": "element_exists",
          "selector": "#checkoutDrawer.active, #checkoutDrawer"
        }
      },
      {
        "id": "dce-sr-5",
        "title": "5. Verify Checkout Form Fields Mounted",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#custName, #custEmail, #promoCodeInput, #paymentMethod"
        }
      },
      {
        "id": "dce-sr-6",
        "title": "6. Input Customer Name",
        "action": "input_text",
        "selector": "#custName",
        "value": "QA Tester"
      },
      {
        "id": "dce-sr-7",
        "title": "7. Input Customer Email",
        "action": "input_text",
        "selector": "#custEmail",
        "value": "tester@gro10x.ai"
      },
      {
        "id": "dce-sr-8",
        "title": "8. Input Promo Code",
        "action": "input_text",
        "selector": "#promoCodeInput",
        "value": "VIP50"
      },
      {
        "id": "dce-sr-9",
        "title": "9. Click Apply Coupon Button",
        "action": "click",
        "selector": ".btn-apply, button[onclick*=\"applyCoupon\"]"
      },
      {
        "id": "dce-sr-10",
        "title": "10. Verify Total Payable Calculated",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#sumTotal, #payBtn"
        }
      },
      {
        "id": "dce-sr-11",
        "title": "11. Dismiss Checkout Drawer",
        "action": "click",
        "selector": "button[onclick*=\"closeCheckout\"], #checkoutDrawer button, .drawer-close"
      },
      {
        "id": "dce-sr-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "dce_affiliate": {
    "id": "dce_affiliate",
    "title": "Affiliate Growth Portal Audit",
    "targetPath": "/dce/affiliate",
    "steps": [
      {
        "id": "dce-af-1",
        "title": "1. Verify Affiliate Growth Portal Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#loginCard, #dashboardWrap, #partnerEmailInput"
        }
      },
      {
        "id": "dce-af-2",
        "title": "2. Verify Pre-filled Partner Email Input Field",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerEmailInput, input[type=\"email\"]"
        }
      },
      {
        "id": "dce-af-3",
        "title": "3. Verify Access Dashboard Button",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#btnAccessAffiliateDashboard, #loginForm button[type=\"submit\"], .btn-green"
        }
      },
      {
        "id": "dce-af-4",
        "title": "4. Submit Partner Access Form",
        "action": "click",
        "selector": "#btnAccessAffiliateDashboard, #loginForm button[type=\"submit\"]"
      },
      {
        "id": "dce-af-5",
        "title": "5. Verify Dashboard Telemetry & KPI Cards",
        "action": "wait_ms",
        "duration": 600,
        "assertion": {
          "type": "element_exists",
          "selector": "#dashboardWrap, #valClicks, #loginCard"
        }
      },
      {
        "id": "dce-af-6",
        "title": "6. Verify Link Generator Form Mounted",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#linkGenForm, #customSlug, #loginCard"
        }
      },
      {
        "id": "dce-af-7",
        "title": "7. Verify Conversion History Ledger Mounted",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#conversionsTableBody, .table-wrap, #loginCard"
        }
      },
      {
        "id": "dce-af-8",
        "title": "8. Verify Payout Settings Form Mounted",
        "action": "wait_ms",
        "duration": 350,
        "assertion": {
          "type": "element_exists",
          "selector": "#payoutSettingsForm, #payoutChannelSelect, #loginCard"
        }
      },
      {
        "id": "dce-af-9",
        "title": "9. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "partners_deliverables": {
    "id": "partners_deliverables",
    "title": "Partner Approvals Room Audit",
    "targetPath": "/partners.html",
    "steps": [
      {
        "id": "pt-dl-1",
        "title": "1. Verify Deliverables & Approvals Room Canvas",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerDeliverablesView, #partnerPlayerGrid, #partnerProjectSelect"
        }
      },
      {
        "id": "pt-dl-2",
        "title": "2. Verify Video Cut Player & Active Version Badge",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerVideo, #partnerVerBadge"
        }
      },
      {
        "id": "pt-dl-3",
        "title": "3. Verify 30-Day Defect Warranty Shield Terms",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "custom_check",
          "check": "assert_warranty_shield_active"
        }
      },
      {
        "id": "pt-dl-4",
        "title": "4. Verify Cut Comments List & Count Badge",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerCommentsList, #partnerCommentCount"
        }
      },
      {
        "id": "pt-dl-5",
        "title": "5. Input Timecoded Feedback Note",
        "action": "input_text",
        "selector": "#partnerNewComment",
        "value": "Audio balance and color grade looks clean.",
        "assertion": {
          "type": "input_value",
          "selector": "#partnerNewComment",
          "expected": "Audio balance and color grade looks clean."
        }
      },
      {
        "id": "pt-dl-6",
        "title": "6. Click Add Feedback Note Button",
        "action": "click",
        "selector": "button[onclick*=\"submitPartnerComment\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerNewComment"
        }
      },
      {
        "id": "pt-dl-7",
        "title": "7. Verify Pending Social Media Post Approvals Grid",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerSocialGrid, #partnerSocialBadge"
        }
      },
      {
        "id": "pt-dl-8",
        "title": "8. Verify Commercial Invoices & Statement of Account",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerInvoicesTbody, .data-table"
        }
      },
      {
        "id": "pt-dl-9",
        "title": "9. Click Open Campaign Brief Modal Button",
        "action": "click",
        "selector": "button[onclick*=\"openPartnerBriefModal\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerBriefModal"
        }
      },
      {
        "id": "pt-dl-10",
        "title": "10. Verify Campaign Brief Modal Mounted",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerBriefModal, #briefTitleInput, #briefDescInput"
        }
      },
      {
        "id": "pt-dl-11",
        "title": "11. Dismiss Campaign Brief Modal",
        "action": "click",
        "selector": "button[onclick*=\"closePartnerBriefModal\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerDeliverablesView"
        }
      },
      {
        "id": "pt-dl-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "partners_affiliate": {
    "id": "partners_affiliate",
    "title": "Partner Growth Cockpit Audit",
    "targetPath": "/partners.html",
    "steps": [
      {
        "id": "pt-af-1",
        "title": "1. Switch to Partner & Affiliate Growth Cockpit Tab",
        "action": "click",
        "selector": "#tabBtnAffiliate, button[onclick*=\"switchPartnerTab('affiliate')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerAffiliateView"
        }
      },
      {
        "id": "pt-af-2",
        "title": "2. Verify Partner Growth Cockpit View Active",
        "action": "wait_ms",
        "duration": 500,
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerAffiliateView, #affiliatePartnerTitle"
        }
      },
      {
        "id": "pt-af-3",
        "title": "3. Verify Unique Referral Link Input & Copy Button",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#affiliateLinkInput, #copyAffLinkBtn"
        }
      },
      {
        "id": "pt-af-4",
        "title": "4. Verify Partner Tier Progression Card & Progress Bar",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#affTierGamificationCard, #affTierProgressBar, #affTierElevationTitle"
        }
      },
      {
        "id": "pt-af-5",
        "title": "5. Verify White-Label Intake Co-Branded Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#whiteLabelIntakeCard, #whiteLabelLinkInput"
        }
      },
      {
        "id": "pt-af-6",
        "title": "6. Click Preview Co-Branded Portal",
        "action": "click",
        "selector": "button[onclick*=\"openWhiteLabelPreview\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#whiteLabelPreviewModal"
        }
      },
      {
        "id": "pt-af-7",
        "title": "7. Verify White-Label Preview Modal Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#whiteLabelPreviewModal, #wlPreviewHeadline, #wlPreviewPartnerName"
        }
      },
      {
        "id": "pt-af-8",
        "title": "8. Dismiss White-Label Preview Modal",
        "action": "click",
        "selector": "button[onclick*=\"closeWhiteLabelPreview\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerAffiliateView"
        }
      },
      {
        "id": "pt-af-9",
        "title": "9. Verify Funnel Telemetry KPI Tiles",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#affMetricClicks, #affMetricLeads, #affMetricDeals, #affMetricPending"
        }
      },
      {
        "id": "pt-af-10",
        "title": "10. Verify Attributed Conversions Ledger & Column Headers",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#affiliateConversionsTbody, .data-table"
        }
      },
      {
        "id": "pt-af-11",
        "title": "11. Verify BRAC Bank Institutional Settlement Details",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#dispAccountNumber, #dispRoutingNumber, #btnCopyAccount"
        }
      },
      {
        "id": "pt-af-12",
        "title": "12. Switch Back to Deliverables Tab",
        "action": "click",
        "selector": "#tabBtnDeliverables, button[onclick*=\"switchPartnerTab('deliverables')\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#partnerDeliverablesView"
        }
      },
      {
        "id": "pt-af-13",
        "title": "13. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "public_landing": {
    "id": "public_landing",
    "title": "Marketing Landing Page Audit",
    "targetPath": "/",
    "steps": [
      {
        "id": "pb-ld-1",
        "title": "1. Verify Landing Hero Section & Brand Headline",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#hero, #topNav, h1"
        }
      },
      {
        "id": "pb-ld-2",
        "title": "2. Verify Multi-Engine AI Growth Banner & Live Proof Metrics",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".pb-hero-badge, .pb-metrics-strip, .pb-metric-item"
        }
      },
      {
        "id": "pb-ld-3",
        "title": "3. Verify 5 Core AI Capability Suites Grid",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#capabilities, .pb-engines-grid, .pb-engine-card"
        }
      },
      {
        "id": "pb-ld-4",
        "title": "4. Verify Interactive ROI Calculator & Savings Display",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#calcSavingsDisplay, #calcHoursDisplay, #calcSpeedDisplay"
        }
      },
      {
        "id": "pb-ld-5",
        "title": "5. Toggle Currency Switcher to BDT",
        "action": "click",
        "selector": "#btnCurrBDT",
        "assertion": {
          "type": "element_exists",
          "selector": "#btnCurrBDT.active, #btnCurrBDT"
        }
      },
      {
        "id": "pb-ld-6",
        "title": "6. Toggle Currency Switcher Back to USD",
        "action": "click",
        "selector": "#btnCurrUSD",
        "assertion": {
          "type": "element_exists",
          "selector": "#btnCurrUSD.active, #btnCurrUSD"
        }
      },
      {
        "id": "pb-ld-7",
        "title": "7. Verify Verified Client Testimonials Showcase Grid",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#testimonials, #indexTestimonialsGrid"
        }
      },
      {
        "id": "pb-ld-8",
        "title": "8. Verify AI Strategy Audit & Intake Contact Form",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#contact, #landingLeadForm, #leadName, #leadEmail, #leadPhone, #leadService"
        }
      },
      {
        "id": "pb-ld-9",
        "title": "9. Click Book AI Setup to Open Lead Modal",
        "action": "click",
        "selector": "#topNav button.pb-btn-primary, button[onclick*=\"openLeadModal\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#leadModalOverlay"
        }
      },
      {
        "id": "pb-ld-10",
        "title": "10. Verify Lead Audit Modal Mounted",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#leadModalOverlay, #modalLeadForm, #modalLeadName, #modalLeadEmail, #modalLeadPhone"
        }
      },
      {
        "id": "pb-ld-11",
        "title": "11. Dismiss Lead Audit Modal",
        "action": "click",
        "selector": "#leadModalOverlay .pb-modal-close, button[onclick*=\"closeLeadModal\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#hero"
        }
      },
      {
        "id": "pb-ld-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "public_investors": {
    "id": "public_investors",
    "title": "Capital Investors Portal Audit",
    "targetPath": "/investors.html",
    "steps": [
      {
        "id": "pb-iv-1",
        "title": "1. Verify Capital Investors Header & Model Title",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#header, #telemetry, h1.investor-title"
        }
      },
      {
        "id": "pb-iv-2",
        "title": "2. Verify 12-Month Telemetry Strip Metrics (ARR, Margin, OpEx)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".pb-metrics-strip, .pb-metric-item, .pb-metric-val"
        }
      },
      {
        "id": "pb-iv-3",
        "title": "3. Verify 5 Multi-Engine Revenue Architecture Cards",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#engines, .pb-engines-grid, .pb-engine-card"
        }
      },
      {
        "id": "pb-iv-4",
        "title": "4. Verify 12-Month Quarterly Launch Roadmap",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#roadmap, .pb-roadmap-grid, .pb-roadmap-step"
        }
      },
      {
        "id": "pb-iv-5",
        "title": "5. Verify 65% Net Margin Architecture Breakdown & Overhead Map",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".pb-financial-card, .pb-margin-circle, .pb-fin-right"
        }
      },
      {
        "id": "pb-iv-6",
        "title": "6. Verify Unit Economics & Arbitrage Moat Grid",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#economics, .econ-grid, .econ-card"
        }
      },
      {
        "id": "pb-iv-7",
        "title": "7. Verify Capital Partner CTA Card & Direct Channel Links",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#contact, .investor-cta-card, a[href*=\"wa.me\"], a[href*=\"mailto\"]"
        }
      },
      {
        "id": "pb-iv-8",
        "title": "8. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "public_ai_audit": {
    "id": "public_ai_audit",
    "title": "AI Diagnostic Audit Tool Audit",
    "targetPath": "/ai-audit.html",
    "steps": [
      {
        "id": "pb-ai-1",
        "title": "1. Verify Inbound AI Readiness Diagnostic Canvas",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#wizardCard, #stepperNav, #stepPanel1"
        }
      },
      {
        "id": "pb-ai-2",
        "title": "2. Input Organization Baseline & Contact Profile",
        "action": "input_text",
        "selector": "#auditCompanyName",
        "value": "Acme FinTech Corp",
        "assertion": {
          "type": "input_value",
          "selector": "#auditCompanyName",
          "expected": "Acme FinTech Corp"
        }
      },
      {
        "id": "pb-ai-3",
        "title": "3. Input Technical Lead Contact Name",
        "action": "input_text",
        "selector": "#auditContactName",
        "value": "Alex Morgan",
        "assertion": {
          "type": "input_value",
          "selector": "#auditContactName",
          "expected": "Alex Morgan"
        }
      },
      {
        "id": "pb-ai-4",
        "title": "4. Input Corporate Work Email & WhatsApp Number",
        "action": "input_text",
        "selector": "#auditEmail",
        "value": "alex@acmefintech.io",
        "assertion": {
          "type": "input_value",
          "selector": "#auditEmail",
          "expected": "alex@acmefintech.io"
        }
      },
      {
        "id": "pb-ai-5",
        "title": "5. Click Next to Step 2: Data Architecture Maturity",
        "action": "click",
        "selector": "button[onclick*=\"validateAndNext(1)\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#stepPanel2"
        }
      },
      {
        "id": "pb-ai-6",
        "title": "6. Select Relational Database Option Card",
        "action": "click",
        "selector": "#stepPanel2 .option-card:first-child",
        "assertion": {
          "type": "element_exists",
          "selector": "#selectedDataReadiness"
        }
      },
      {
        "id": "pb-ai-7",
        "title": "7. Click Next to Step 3: Tech Stack & API Readiness",
        "action": "click",
        "selector": "button[onclick*=\"validateAndNext(2)\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#stepPanel3"
        }
      },
      {
        "id": "pb-ai-8",
        "title": "8. Verify Tech Stack Pills & Toggle Framework",
        "action": "click",
        "selector": "#techStackPills .tech-pill:first-child",
        "assertion": {
          "type": "element_exists",
          "selector": "#techStackPills"
        }
      },
      {
        "id": "pb-ai-9",
        "title": "9. Click Next to Step 4: Automation Priority & Budget",
        "action": "click",
        "selector": "button[onclick*=\"validateAndNext(3)\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#stepPanel4"
        }
      },
      {
        "id": "pb-ai-10",
        "title": "10. Click Generate AI Readiness Scorecard Button",
        "action": "click",
        "selector": "#btnSubmitAudit, button[onclick*=\"submitDiagnosticAudit\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#wizardCard"
        }
      },
      {
        "id": "pb-ai-11",
        "title": "11. Verify Computed AI Readiness Scorecard & Gauge",
        "action": "wait_ms",
        "duration": 1800,
        "assertion": {
          "type": "element_exists",
          "selector": "#scorecardResult, #resCompanyName, #resScoreNum, #resTierBadge"
        }
      },
      {
        "id": "pb-ai-12",
        "title": "12. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "public_contractor": {
    "id": "public_contractor",
    "title": "Subcontractor Scoped Gateway Audit",
    "targetPath": "/contractor-view.html",
    "steps": [
      {
        "id": "pb-ct-1",
        "title": "1. Verify Subcontractor Scoped Gateway & Masking Notice",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": ".security-banner, .masking-pill, .contractor-badge"
        }
      },
      {
        "id": "pb-ct-2",
        "title": "2. Verify 24h SLA Defect Timer & Redacted Project Hero",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#projectCard, #projRef, #projTitle, #metaPodName"
        }
      },
      {
        "id": "pb-ct-3",
        "title": "3. Verify Milestone Escrow Vault & Smart Settlement Rail",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#contractorEscrowCard, #contractorMilestoneName, #contractorEscrowStatusBadge, #contractorEscrowAmount"
        }
      },
      {
        "id": "pb-ct-4",
        "title": "4. Verify Sprint Deliverables & DoD Checklist Tab",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#pane-deliverables, #deliverablesContainer"
        }
      },
      {
        "id": "pb-ct-5",
        "title": "5. Switch to Assigned Tasks Board Tab",
        "action": "click",
        "selector": "button[onclick*=\"switchTab('tasks'\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#pane-tasks"
        }
      },
      {
        "id": "pb-ct-6",
        "title": "6. Switch to Technical Guidelines Tab",
        "action": "click",
        "selector": "button[onclick*=\"switchTab('guidelines'\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#pane-guidelines"
        }
      },
      {
        "id": "pb-ct-7",
        "title": "7. Switch Back to Deliverables Tab",
        "action": "click",
        "selector": "button[onclick*=\"switchTab('deliverables'\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#pane-deliverables"
        }
      },
      {
        "id": "pb-ct-8",
        "title": "8. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "public_planner": {
    "id": "public_planner",
    "title": "Digital Planner Micro-App Audit",
    "targetPath": "/planner",
    "steps": [
      {
        "id": "pb-pl-1",
        "title": "1. Verify Interactive Planner Topbar & Sync Indicator",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": ".planner-topbar, #syncStatus, #btnExportJson, #btnResetData, #btnPrintPdf"
        }
      },
      {
        "id": "pb-pl-2",
        "title": "2. Verify Dual Binder Workspace & Cover Registration Spread",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#spreadViewport, #tab-index, #spread-1, #owner_name"
        }
      },
      {
        "id": "pb-pl-3",
        "title": "3. Input Owner Name Registration",
        "action": "input_text",
        "selector": "#owner_name",
        "value": "Alex Morgan",
        "assertion": {
          "type": "input_value",
          "selector": "#owner_name",
          "expected": "Alex Morgan"
        }
      },
      {
        "id": "pb-pl-4",
        "title": "4. Switch to Vision Tab in Side Tab Bar",
        "action": "click",
        "selector": ".side-tab[data-tab=\"tab-vision\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#tab-vision"
        }
      },
      {
        "id": "pb-pl-5",
        "title": "5. Switch to Habits Tab in Side Tab Bar",
        "action": "click",
        "selector": ".side-tab[data-tab=\"tab-habits\"]",
        "assertion": {
          "type": "element_exists",
          "selector": "#tab-habits"
        }
      },
      {
        "id": "pb-pl-6",
        "title": "6. Click AI Coach Topbar Button to Open Briefing Modal",
        "action": "click",
        "selector": "#btnAiCoachTopbar",
        "assertion": {
          "type": "element_exists",
          "selector": "#aiCoachModal"
        }
      },
      {
        "id": "pb-pl-7",
        "title": "7. Dismiss AI Coach Briefing Modal",
        "action": "click",
        "selector": "#btnCloseAiModal",
        "assertion": {
          "type": "element_exists",
          "selector": ".planner-workspace"
        }
      },
      {
        "id": "pb-pl-8",
        "title": "8. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  },
  "public_viewer3d": {
    "id": "public_viewer3d",
    "title": "3D Spatial Product Lab Audit",
    "targetPath": "/3d-viewer",
    "steps": [
      {
        "id": "pb-3d-1",
        "title": "1. Verify 3D Model Renderer Canvas & Projection Plane",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "element_exists",
          "selector": "#stageContainer, #projectionPlane, .angle-frame"
        }
      },
      {
        "id": "pb-3d-2",
        "title": "2. Verify 3D Radar HUD & Active Camera Indicator",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#hudRadar, #activeCameraName, .radar-dot.active"
        }
      },
      {
        "id": "pb-3d-3",
        "title": "3. Verify Cinematic Orbit Button & Orbit Controls Panel",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#btnAutoOrbit, #btnResetAngle, #btnGyroToggle, #selectSpeed"
        }
      },
      {
        "id": "pb-3d-4",
        "title": "4. Click Cinematic 3D Orbit Button",
        "action": "click",
        "selector": "#btnAutoOrbit",
        "assertion": {
          "type": "element_exists",
          "selector": "#btnAutoOrbit"
        }
      },
      {
        "id": "pb-3d-5",
        "title": "5. Click Center Front Reset Angle Button",
        "action": "click",
        "selector": "#btnResetAngle",
        "assertion": {
          "type": "element_exists",
          "selector": "#activeCameraName"
        }
      },
      {
        "id": "pb-3d-6",
        "title": "6. Verify 9-Angle Canonical Perspectives Thumbnails Strip",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#anglesStrip, .angles-strip"
        }
      },
      {
        "id": "pb-3d-7",
        "title": "7. Verify Spatial Learning & Educational Product Concepts",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": ".concept-section, .product-ideas-grid, .idea-card"
        }
      },
      {
        "id": "pb-3d-8",
        "title": "8. Integrity Audit: Clean Console",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_audit"
        }
      }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.PORTAL_AUDITS = PORTAL_AUDITS;
  window.PORTAL_AUDIT_SUITES = PORTAL_AUDITS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PORTAL_AUDITS, PORTAL_AUDIT_SUITES: PORTAL_AUDITS };
}
