/**
 * GRO10X Unified Multi-Engine Workspace QA Automation Suite
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive deep interactive health audits across all 16 operational tabs
 * and 4 strategic pillars of the Single-Pane-of-Glass Internal OS:
 * 
 * Pillar 1: Command Hub (#overview, #velocity, #pnl)
 * Pillar 2: Sales & Growth (#leads, #proposals, #crm, #invoices)
 * Pillar 3: Sprint Delivery (#tasks, #kanban, #deliverables, #tickets)
 * Pillar 4: Operations & Governance (#team, #leaves, #claims, #tech, #settings)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const WORKSPACE_QA_SUITES = {
  // ──────── PILLAR 1: COMMAND HUB ────────
  "ws_overview": {
    "id": "ws_overview",
    "title": "Executive Overview Health Audit",
    "targetHash": "#overview",
    "steps": [
      {
        "id": "wso-1",
        "title": "1. Navigate to #overview",
        "action": "navigate_hash",
        "target": "#overview",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wso-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wso-3",
        "title": "3. Verify Dhaka Live Clock (BST UTC+6)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_dhaka_clock"
        }
      },
      {
        "id": "wso-4",
        "title": "4. Verify Seniority Tier Badge Active",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_tier_badge"
        }
      },
      {
        "id": "wso-5",
        "title": "5. Verify Dynamic Engine Switcher Control",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#engineSwitcherSelect"
        }
      },
      {
        "id": "wso-6",
        "title": "6. Verify Overview Header & Welcome Hero",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wso-7",
        "title": "7. Verify Overview KPI Tiles & Metrics Grid",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view .kpi-tile"
        }
      },
      {
        "id": "wso-8",
        "title": "8. Verify 4-Pillar Sidebar Structure",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#pillar-command, #pillar-growth, #pillar-delivery, #pillar-operations"
        }
      },
      {
        "id": "wso-9",
        "title": "9. Verify Theme Toggle Control",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#themeToggleBtn"
        }
      },
      {
        "id": "wso-10",
        "title": "10. Click Theme Toggle (Switch Theme)",
        "action": "click",
        "selector": "#themeToggleBtn",
        "assertion": {
          "type": "element_exists",
          "selector": "#themeToggleBtn"
        }
      },
      {
        "id": "wso-11",
        "title": "11. Click Theme Toggle (Restore Theme)",
        "action": "click",
        "selector": "#themeToggleBtn",
        "assertion": {
          "type": "element_exists",
          "selector": "#themeToggleBtn"
        }
      },
      {
        "id": "wso-12",
        "title": "12. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_velocity": {
    "id": "ws_velocity",
    "title": "Velocity & Targets Health Audit",
    "targetHash": "#velocity",
    "steps": [
      {
        "id": "wsv-1",
        "title": "1. Navigate to #velocity",
        "action": "navigate_hash",
        "target": "#velocity",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wsv-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wsv-3",
        "title": "3. Verify 5-Engine Operations Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wsv-4",
        "title": "4. Verify Engine Revenue Cards Grid",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view [class*=\"engine\"]"
        }
      },
      {
        "id": "wsv-5",
        "title": "5. Verify Target Milestone Telemetry",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass"
        }
      },
      {
        "id": "wsv-6",
        "title": "6. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#velocity\"]"
        }
      },
      {
        "id": "wsv-7",
        "title": "7. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_pnl": {
    "id": "ws_pnl",
    "title": "Consolidated P&L Financial Waterfall Audit",
    "targetHash": "#pnl",
    "steps": [
      {
        "id": "wsp-1",
        "title": "1. Navigate to #pnl",
        "action": "navigate_hash",
        "target": "#pnl",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wsp-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wsp-3",
        "title": "3. Verify P&L Waterfall Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1"
        }
      },
      {
        "id": "wsp-4",
        "title": "4. Verify Gross Inflow Cards (USD / BDT)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass"
        }
      },
      {
        "id": "wsp-5",
        "title": "5. Verify Total COGS (Compute & Dev Guardrails)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass"
        }
      },
      {
        "id": "wsp-6",
        "title": "6. Verify Net Margin Benchmark (65%+ Target)",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass"
        }
      },
      {
        "id": "wsp-7",
        "title": "7. Verify Operating Cash Reserves & Runway",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass"
        }
      },
      {
        "id": "wsp-8",
        "title": "8. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  // ──────── PILLAR 2: SALES & GROWTH ────────
  "ws_leads": {
    "id": "ws_leads",
    "title": "Leads Pipeline Health Audit",
    "targetHash": "#leads",
    "steps": [
      {
        "id": "wsl-1",
        "title": "1. Navigate to #leads",
        "action": "navigate_hash",
        "target": "#leads",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wsl-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wsl-3",
        "title": "3. Verify Leads Pipeline Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wsl-4",
        "title": "4. Verify Leads Filter Pills / Stage Controls",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view button, #workspace-view .tab-btn, #workspace-view .filter-btn, #workspace-view .btn"
        }
      },
      {
        "id": "wsl-5",
        "title": "5. Verify Leads Table or Data Container",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view table, #workspace-view .card-glass, #workspace-view .lead-row, #workspace-view [class*=\"lead\"]"
        }
      },
      {
        "id": "wsl-6",
        "title": "6. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#leads\"]"
        }
      },
      {
        "id": "wsl-7",
        "title": "7. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_proposals": {
    "id": "ws_proposals",
    "title": "Proposals Studio Health Audit",
    "targetHash": "#proposals",
    "steps": [
      {
        "id": "wsprop-1",
        "title": "1. Navigate to #proposals",
        "action": "navigate_hash",
        "target": "#proposals",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wsprop-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wsprop-3",
        "title": "3. Verify Proposals Studio Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wsprop-4",
        "title": "4. Verify Proposals Roster or Form Container",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view table, #workspace-view form"
        }
      },
      {
        "id": "wsprop-5",
        "title": "5. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#proposals\"]"
        }
      },
      {
        "id": "wsprop-6",
        "title": "6. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_crm": {
    "id": "ws_crm",
    "title": "Clients & Retainers CRM Health Audit",
    "targetHash": "#crm",
    "steps": [
      {
        "id": "wscrm-1",
        "title": "1. Navigate to #crm",
        "action": "navigate_hash",
        "target": "#crm",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wscrm-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wscrm-3",
        "title": "3. Verify Clients CRM Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wscrm-4",
        "title": "4. Verify Retainers Roster & Client Accounts",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view table, #workspace-view .client-card"
        }
      },
      {
        "id": "wscrm-5",
        "title": "5. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#crm\"]"
        }
      },
      {
        "id": "wscrm-6",
        "title": "6. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_invoices": {
    "id": "ws_invoices",
    "title": "Invoices & Settlement Rails Health Audit",
    "targetHash": "#invoices",
    "steps": [
      {
        "id": "wsinv-1",
        "title": "1. Navigate to #invoices",
        "action": "navigate_hash",
        "target": "#invoices",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wsinv-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wsinv-3",
        "title": "3. Verify Invoices & Financial Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wsinv-4",
        "title": "4. Verify Financial Ledger & Invoices Table",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view table, #workspace-view .data-table"
        }
      },
      {
        "id": "wsinv-5",
        "title": "5. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#invoices\"]"
        }
      },
      {
        "id": "wsinv-6",
        "title": "6. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  // ──────── PILLAR 3: SPRINT DELIVERY ────────
  "ws_tasks": {
    "id": "ws_tasks",
    "title": "Tasks Pipeline Health Audit",
    "targetHash": "#tasks",
    "steps": [
      {
        "id": "wstsk-1",
        "title": "1. Navigate to #tasks",
        "action": "navigate_hash",
        "target": "#tasks",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wstsk-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wstsk-3",
        "title": "3. Verify Tasks Pipeline Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wstsk-4",
        "title": "4. Verify Task Search & Filter Controls",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view input, #workspace-view button, #workspace-view .filter-btn"
        }
      },
      {
        "id": "wstsk-5",
        "title": "5. Verify Tasks Pipeline Table or Card List",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view table, #workspace-view .task-row, #workspace-view [class*=\"task\"]"
        }
      },
      {
        "id": "wstsk-6",
        "title": "6. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#tasks\"]"
        }
      },
      {
        "id": "wstsk-7",
        "title": "7. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_kanban": {
    "id": "ws_kanban",
    "title": "Kanban Studio Health Audit",
    "targetHash": "#kanban",
    "steps": [
      {
        "id": "wskan-1",
        "title": "1. Navigate to #kanban",
        "action": "navigate_hash",
        "target": "#kanban",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wskan-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wskan-3",
        "title": "3. Verify Kanban Columns & Swimlanes",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view [class*=\"kanban\"], #workspace-view [class*=\"column\"]"
        }
      },
      {
        "id": "wskan-4",
        "title": "4. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#kanban\"]"
        }
      },
      {
        "id": "wskan-5",
        "title": "5. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_deliverables": {
    "id": "ws_deliverables",
    "title": "Deliverables Vault & Staging Room Audit",
    "targetHash": "#deliverables",
    "steps": [
      {
        "id": "wsdel-1",
        "title": "1. Navigate to #deliverables",
        "action": "navigate_hash",
        "target": "#deliverables",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wsdel-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wsdel-3",
        "title": "3. Verify Deliverables Vault Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1"
        }
      },
      {
        "id": "wsdel-4",
        "title": "4. Verify Staging Proofing & Warranty Shield Card",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass"
        }
      },
      {
        "id": "wsdel-5",
        "title": "5. Verify 30-Day Defect Warranty Terms Banner",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass"
        }
      },
      {
        "id": "wsdel-6",
        "title": "6. Verify Bridge CTA to Tasks Pipeline",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view a[href=\"#tasks\"]"
        }
      },
      {
        "id": "wsdel-7",
        "title": "7. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_tickets": {
    "id": "ws_tickets",
    "title": "24h Defect SLAs Support Desk Audit",
    "targetHash": "#tickets",
    "steps": [
      {
        "id": "wstck-1",
        "title": "1. Navigate to #tickets",
        "action": "navigate_hash",
        "target": "#tickets",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wstck-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wstck-3",
        "title": "3. Verify Support Desk Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wstck-4",
        "title": "4. Verify 24h Defect SLA Enforcement Banner",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view [class*=\"sla\"], #workspace-view [class*=\"alert\"], #workspace-view table"
        }
      },
      {
        "id": "wstck-5",
        "title": "5. Verify Tickets Queue Table or Card Deck",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view table, #workspace-view .ticket-row"
        }
      },
      {
        "id": "wstck-6",
        "title": "6. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#tickets\"]"
        }
      },
      {
        "id": "wstck-7",
        "title": "7. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  // ──────── PILLAR 4: OPERATIONS & GOVERNANCE ────────
  "ws_team": {
    "id": "ws_team",
    "title": "Team & Attendance Health Audit",
    "targetHash": "#team",
    "steps": [
      {
        "id": "wstm-1",
        "title": "1. Navigate to #team",
        "action": "navigate_hash",
        "target": "#team",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wstm-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wstm-3",
        "title": "3. Verify Team Roster Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wstm-4",
        "title": "4. Verify Team Roster Grid & Live Indicators",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view table, #workspace-view .team-card, #workspace-view [class*=\"member\"]"
        }
      },
      {
        "id": "wstm-5",
        "title": "5. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#team\"]"
        }
      },
      {
        "id": "wstm-6",
        "title": "6. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_leaves": {
    "id": "ws_leaves",
    "title": "Leaves Desk Health Audit",
    "targetHash": "#leaves",
    "steps": [
      {
        "id": "wslv-1",
        "title": "1. Navigate to #leaves",
        "action": "navigate_hash",
        "target": "#leaves",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wslv-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wslv-3",
        "title": "3. Verify Leaves Desk Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wslv-4",
        "title": "4. Verify Leave Balance Cards or Queue",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view table"
        }
      },
      {
        "id": "wslv-5",
        "title": "5. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#leaves\"]"
        }
      },
      {
        "id": "wslv-6",
        "title": "6. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_claims": {
    "id": "ws_claims",
    "title": "Expense Claims Health Audit",
    "targetHash": "#claims",
    "steps": [
      {
        "id": "wsclm-1",
        "title": "1. Navigate to #claims",
        "action": "navigate_hash",
        "target": "#claims",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wsclm-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wsclm-3",
        "title": "3. Verify Expense Claims Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wsclm-4",
        "title": "4. Verify Financial Telemetry Tiles",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view table"
        }
      },
      {
        "id": "wsclm-5",
        "title": "5. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#claims\"]"
        }
      },
      {
        "id": "wsclm-6",
        "title": "6. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_tech": {
    "id": "ws_tech",
    "title": "Tech Diagnostics Health Audit",
    "targetHash": "#tech",
    "steps": [
      {
        "id": "wstch-1",
        "title": "1. Navigate to #tech",
        "action": "navigate_hash",
        "target": "#tech",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wstch-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wstch-3",
        "title": "3. Verify Tech Diagnostics Header",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2"
        }
      },
      {
        "id": "wstch-4",
        "title": "4. Verify Real-time Service Health Grid",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view .card-glass, #workspace-view [class*=\"health\"], #workspace-view [class*=\"service\"]"
        }
      },
      {
        "id": "wstch-5",
        "title": "5. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#tech\"]"
        }
      },
      {
        "id": "wstch-6",
        "title": "6. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  },

  "ws_settings": {
    "id": "ws_settings",
    "title": "Workspace Settings & Engine Switcher Audit",
    "targetHash": "#settings",
    "steps": [
      {
        "id": "wsset-1",
        "title": "1. Navigate to #settings",
        "action": "navigate_hash",
        "target": "#settings",
        "assertion": {
          "type": "wait_selector",
          "selector": "#workspace-view",
          "timeout": 5000
        }
      },
      {
        "id": "wsset-2",
        "title": "2. Verify Workspace Container Mounted",
        "action": "wait_ms",
        "duration": 400,
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_mounted"
        }
      },
      {
        "id": "wsset-3",
        "title": "3. Verify Settings Header & Controls",
        "action": "wait_ms",
        "duration": 300,
        "assertion": {
          "type": "element_exists",
          "selector": "#workspace-view h1, #workspace-view h2, #workspace-view .card-glass"
        }
      },
      {
        "id": "wsset-4",
        "title": "4. Verify Navigation Link Active State",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "element_exists",
          "selector": ".workspace-nav-item.active[href=\"#settings\"]"
        }
      },
      {
        "id": "wsset-5",
        "title": "5. Switch Engine Context to Engine 1 (Micro-SaaS)",
        "action": "simulate_input",
        "selector": "#engineSwitcherSelect",
        "value": "engine1",
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_engine_switched",
          "engineId": "engine1"
        }
      },
      {
        "id": "wsset-6",
        "title": "6. Switch Engine Context back to Engine 2 (AI Agency)",
        "action": "simulate_input",
        "selector": "#engineSwitcherSelect",
        "value": "engine2",
        "assertion": {
          "type": "custom_check",
          "check": "assert_workspace_engine_switched",
          "engineId": "engine2"
        }
      },
      {
        "id": "wsset-7",
        "title": "7. Clean Console & Runtime Audit",
        "action": "wait_ms",
        "duration": 200,
        "assertion": {
          "type": "custom_check",
          "check": "assert_clean_console_audit"
        }
      }
    ]
  }
};

// Mount into global PORTAL_AUDITS
if (typeof window !== 'undefined') {
  window.PORTAL_AUDITS = window.PORTAL_AUDITS || {};
  Object.assign(window.PORTAL_AUDITS, WORKSPACE_QA_SUITES);
  window.WORKSPACE_QA_SUITES = WORKSPACE_QA_SUITES;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WORKSPACE_QA_SUITES };
}
