/**
 * GRO10X QA Automation Runner - Admin Command Center E2E Workflows
 */

const ADMIN_WORKFLOWS = {
  workflow_task_lifecycle: {
    id: 'workflow_task_lifecycle',
    platform: 'admin',
    pageId: 'kanban',
    title: '🚀 Task Pipeline: Create ➔ Drawer ➔ Advance Stage ➔ Teardown',
    description: 'Creates an ephemeral task, inspects drawer, advances through stages, asserts toast, and cleans up.',
    targetHash: '#kanban',
    steps: [
      {
        id: 'wf-task-1',
        title: '1. Navigate to Production Pipeline (#kanban)',
        action: 'navigate_hash',
        target: '#kanban',
        assertion: { type: 'wait_selector', selector: '#kanbanBoardArea, .kanban-col, h1', timeout: 5000 }
      },
      {
        id: 'wf-task-2',
        title: '2. Switch to Board View',
        action: 'click',
        selector: '#btnViewKanbanBoard',
        fallbackSelector: '.view-btn',
        assertion: { type: 'custom_check', check: 'assert_kanban_board_view' }
      },
      {
        id: 'wf-task-3',
        title: '3. Open New Task Modal',
        action: 'click',
        selector: '#btnOpenNewTask',
        fallbackSelector: 'button[onclick*="openNewTaskModal"], .btn-primary',
        assertion: { type: 'modal_open', selector: '#newTaskModalOverlay, #taskModal, .modal-overlay' }
      },
      {
        id: 'wf-task-4',
        title: '4. Fill Ephemeral Task Details [QA-TASK-RUN]',
        action: 'workflow_fill_task_form',
        prefix: 'QA-TASK-',
        assertion: { type: 'custom_check', check: 'assert_task_form_filled' }
      },
      {
        id: 'wf-task-5',
        title: '5. Submit Task Creation & Assert Toast Feedback',
        action: 'workflow_submit_task',
        assertion: { type: 'wait_for_toast', keyword: 'Task' }
      },
      {
        id: 'wf-task-6',
        title: '6. Verify Created Task Card Rendered in Board DOM',
        action: 'workflow_verify_task_card',
        assertion: { type: 'custom_check', check: 'assert_task_card_rendered' }
      },
      {
        id: 'wf-task-7',
        title: '7. Open Task Drawer & Advance Stage to Client Review',
        action: 'workflow_advance_task_stage',
        targetStage: 'Client Review',
        assertion: { type: 'custom_check', check: 'assert_task_stage_updated' }
      },
      {
        id: 'wf-task-8',
        title: '8. Ephemeral Teardown: Safely Remove Test Task',
        action: 'workflow_cleanup_task',
        assertion: { type: 'custom_check', check: 'assert_task_cleaned_up' }
      }
    ]
  },

  workflow_finance_billing: {
    id: 'workflow_finance_billing',
    platform: 'admin',
    pageId: 'finance',
    title: '🚀 Institutional Billing: Create ➔ 5% VAT & BRAC Rail ➔ Mark Paid ➔ Teardown',
    description: 'Validates invoice creation, 5% VAT computation, BRAC Bank settlement details, and status update.',
    targetHash: '#finance',
    steps: [
      {
        id: 'wf-fin-1',
        title: '1. Navigate to Financial Intelligence (#finance)',
        action: 'navigate_hash',
        target: '#finance',
        assertion: { type: 'wait_selector', selector: '#finance-summary-grid, h1, .stat-card', timeout: 5000 }
      },
      {
        id: 'wf-fin-2',
        title: '2. Open New Invoice Modal',
        action: 'workflow_open_invoice_modal',
        assertion: { type: 'custom_check', check: 'assert_invoice_modal_open' }
      },
      {
        id: 'wf-fin-3',
        title: '3. Fill Invoice Form with Ephemeral Tag [QA-INV-RUN]',
        action: 'workflow_fill_invoice_form',
        prefix: 'QA-INV-',
        amount: 2500,
        assertion: { type: 'custom_check', check: 'assert_invoice_form_filled' }
      },
      {
        id: 'wf-fin-4',
        title: '4. Validate 5% VAT & BRAC Bank Institutional Account Details',
        action: 'workflow_verify_brac_rail',
        assertion: { type: 'custom_check', check: 'assert_brac_rail_details' }
      },
      {
        id: 'wf-fin-5',
        title: '5. Save Invoice & Assert Real-Time Toast',
        action: 'workflow_submit_invoice',
        assertion: { type: 'wait_for_toast', keyword: 'Invoice' }
      },
      {
        id: 'wf-fin-6',
        title: '6. Verify Invoice in Table & Transition to Paid',
        action: 'workflow_transition_invoice_paid',
        assertion: { type: 'custom_check', check: 'assert_invoice_paid_state' }
      },
      {
        id: 'wf-fin-7',
        title: '7. Ephemeral Teardown: Clean Test Invoice',
        action: 'workflow_cleanup_invoice',
        assertion: { type: 'custom_check', check: 'assert_invoice_cleaned_up' }
      }
    ]
  },

  workflow_creator_ai: {
    id: 'workflow_creator_ai',
    platform: 'admin',
    pageId: 'content-os',
    title: '🚀 Content OS: Prompt Input ➔ AI Scene Breakdown ➔ Save Draft',
    description: 'Validates multimodal generation, scene breakdown cards, and local draft persistence.',
    targetHash: '#content-os',
    steps: [
      {
        id: 'wf-cos-1',
        title: '1. Navigate to Content OS & Brand Engine (#content-os)',
        action: 'navigate_hash',
        target: '#content-os',
        assertion: { type: 'wait_selector', selector: '#content-os-main, h1', timeout: 5000 }
      },
      {
        id: 'wf-cos-2',
        title: '2. Fill AI Creative Prompt [QA-CREATIVE-RUN]',
        action: 'workflow_fill_ai_prompt',
        prefix: 'QA-CREATIVE-',
        assertion: { type: 'custom_check', check: 'assert_ai_prompt_filled' }
      },
      {
        id: 'wf-cos-3',
        title: '3. Generate Scene Breakdown & Assert Scene Cards in DOM',
        action: 'workflow_generate_scenes',
        assertion: { type: 'custom_check', check: 'assert_scenes_rendered' }
      },
      {
        id: 'wf-cos-4',
        title: '4. Teardown: Clean Test Generation',
        action: 'workflow_cleanup_creative',
        assertion: { type: 'custom_check', check: 'assert_creative_cleaned_up' }
      }
    ]
  },

  workflow_lead_crm: {
    id: 'workflow_lead_crm',
    platform: 'admin',
    pageId: 'leads',
    title: '🚀 Leads Pipeline: Capture ➔ 5-Stage Progression ➔ CRM Conversion',
    description: 'Captures new lead, advances through pipeline stages, converts to CRM client record, and cleans up.',
    targetHash: '#leads',
    steps: [
      {
        id: 'wf-lead-1',
        title: '1. Navigate to Leads Pipeline (#leads)',
        action: 'navigate_hash',
        target: '#leads',
        assertion: { type: 'wait_selector', selector: '#leads-pipeline-board, h1', timeout: 5000 }
      },
      {
        id: 'wf-lead-2',
        title: '2. Create New Lead [QA-LEAD-RUN]',
        action: 'workflow_create_lead',
        prefix: 'QA-LEAD-',
        assertion: { type: 'custom_check', check: 'assert_lead_created' }
      },
      {
        id: 'wf-lead-3',
        title: '3. Advance Lead through Qualified & Proposal Stages',
        action: 'workflow_advance_lead_stage',
        assertion: { type: 'custom_check', check: 'assert_lead_stage_advanced' }
      },
      {
        id: 'wf-lead-4',
        title: '4. Teardown: Clean Test Lead Record',
        action: 'workflow_cleanup_lead',
        assertion: { type: 'custom_check', check: 'assert_lead_cleaned_up' }
      }
    ]
  },

  workflow_lead_inbound_audit_verification: {
    id: 'workflow_lead_inbound_audit_verification',
    platform: 'admin',
    pageId: 'leads',
    title: '🚀 Inbound Scorecard Lead: Filter ➔ Drawer Scorecard ➔ Conversion',
    description: 'Filters for inbound AI Diagnostic Scorecard leads, verifies drawer scorecard card and gauge, and asserts conversion readiness.',
    targetHash: '#leads',
    steps: [
      {
        id: 'wf-lia-1',
        title: '1. Navigate to Leads Pipeline (#leads)',
        action: 'navigate_hash',
        target: '#leads',
        assertion: { type: 'wait_selector', selector: '#leads-pipeline-board, h1', timeout: 5000 }
      },
      {
        id: 'wf-lia-2',
        title: '2. Search for AI Readiness Scorecard Leads',
        action: 'input_text',
        selector: '#leadsSearchInput',
        value: 'AI Readiness',
        assertion: { type: 'custom_check', check: 'assert_leads_search' }
      },
      {
        id: 'wf-lia-3',
        title: '3. Open Lead Drawer & Inspect AI Scorecard',
        action: 'workflow_verify_inbound_scorecard',
        assertion: { type: 'custom_check', check: 'assert_leads_drawer_ai_scorecard' }
      },
      {
        id: 'wf-lia-4',
        title: '4. Verify WhatsApp Fast-CTA & Convert Button',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'element_exists', selector: '#leadProfileDrawer a[href*="wa.me"], #leadProfileDrawer button[onclick*="convertLead"]' }
      },
      {
        id: 'wf-lia-5',
        title: '5. Dismiss Lead Drawer & Clear Search Filter',
        action: 'click',
        selector: '#btnCloseDrawer',
        assertion: { type: 'custom_check', check: 'assert_leads_drawer_closed' }
      }
    ]
  },

  workflow_expense_approval: {
    id: 'workflow_expense_approval',
    platform: 'admin',
    pageId: 'finance',
    title: '🚀 2-Tier Expense Governance: Submit Claim ➔ Tier 1 & 2 Approvals',
    description: 'Submits out-of-pocket claim, verifies multi-tier governance, and asserts disbursed state.',
    targetHash: '#finance',
    steps: [
      {
        id: 'wf-exp-1',
        title: '1. Navigate to Financials & Expenses (#finance)',
        action: 'navigate_hash',
        target: '#finance',
        assertion: { type: 'wait_selector', selector: '#finance-summary-grid, h1', timeout: 5000 }
      },
      {
        id: 'wf-exp-2',
        title: '2. Submit Ephemeral Expense Claim [QA-EXP-RUN]',
        action: 'workflow_submit_expense_claim',
        prefix: 'QA-EXP-',
        assertion: { type: 'custom_check', check: 'assert_expense_claim_submitted' }
      },
      {
        id: 'wf-exp-3',
        title: '3. Assert Tier 1 Pending State & Approve',
        action: 'workflow_approve_expense_tier1',
        assertion: { type: 'custom_check', check: 'assert_expense_tier1_approved' }
      },
      {
        id: 'wf-exp-4',
        title: '4. Teardown: Clean Test Expense Claim',
        action: 'workflow_cleanup_expense',
        assertion: { type: 'custom_check', check: 'assert_expense_cleaned_up' }
      }
    ]
  },

  workflow_ticket_triage: {
    id: 'workflow_ticket_triage',
    platform: 'admin',
    pageId: 'tickets',
    title: '🚀 Support Desk: Create Ticket ➔ Assign Engineer ➔ Escalate ➔ Resolve',
    description: 'Files bug ticket, assigns lead engineer, escalates SLA priority, and marks resolved.',
    targetHash: '#tickets',
    steps: [
      {
        id: 'wf-tck-1',
        title: '1. Navigate to Support Desk (#tickets)',
        action: 'navigate_hash',
        target: '#tickets',
        assertion: { type: 'wait_selector', selector: '#tickets-table, h1, .ticket-card', timeout: 5000 }
      },
      {
        id: 'wf-tck-2',
        title: '2. File Support Ticket [QA-TCK-RUN]',
        action: 'workflow_create_ticket',
        prefix: 'QA-TCK-',
        assertion: { type: 'custom_check', check: 'assert_ticket_created' }
      },
      {
        id: 'wf-tck-3',
        title: '3. Reassign to Lead Engineer & Escalate Priority',
        action: 'workflow_escalate_ticket',
        assertion: { type: 'custom_check', check: 'assert_ticket_escalated' }
      },
      {
        id: 'wf-tck-4',
        title: '4. Teardown: Clean Test Ticket',
        action: 'workflow_cleanup_ticket',
        assertion: { type: 'custom_check', check: 'assert_ticket_cleaned_up' }
      }
    ]
  },

  workflow_proposal_acceptance_onboarding: {
    id: 'workflow_proposal_acceptance_onboarding',
    platform: 'admin',
    pageId: 'proposals',
    title: '🚀 SOW Acceptance ➔ Client Provisioning ➔ Project Lock-In Spec',
    description: 'Simulates client proposal acceptance, verifies client auto-creation, tokenized handover URL generation, and lock-in spec linkage.',
    targetHash: '#proposals',
    steps: [
      {
        id: 'wf-prop-1',
        title: '1. Navigate to Proposals Command Studio (#proposals)',
        action: 'navigate_hash',
        target: '#proposals',
        assertion: { type: 'wait_selector', selector: '#proposalsTableBody, #kpiTotalProposals, h1', timeout: 5000 }
      },
      {
        id: 'wf-prop-2',
        title: '2. Verify Enterprise Proposals Present in Studio',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_proposals_table' }
      },
      {
        id: 'wf-prop-3',
        title: '3. Simulate SOW Proposal Acceptance via Public Rail',
        action: 'workflow_accept_sow_proposal',
        token: 'nhf-enterprise-ai-2026',
        acceptedBy: 'MD Zahin Khandaker (NHF)',
        assertion: { type: 'custom_check', check: 'assert_proposal_accepted_workflow' }
      },
      {
        id: 'wf-prop-4',
        title: '4. Verify 30-Day Client Session Token & Lock-In Spec Provisioned',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_client_token_provisioned' }
      },
      {
        id: 'wf-prop-5',
        title: '5. Audit Clean: Zero Native Dialogs & Zero Unhandled Rejections',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_crm_client_lifecycle: {
    id: 'workflow_crm_client_lifecycle',
    platform: 'admin',
    pageId: 'crm',
    title: '🚀 CRM Operations: Inspect Clients ➔ Open Client Drawer ➔ Verify Retainer Health',
    description: 'Validates client directory rendering, profile drawer inspection, retainer quota, and SLA compliance.',
    targetHash: '#crm',
    steps: [
      {
        id: 'wf-crm-1',
        title: '1. Navigate to Clients & Retainers CRM (#crm)',
        action: 'navigate_hash',
        target: '#crm',
        assertion: { type: 'wait_selector', selector: '#crmClientTable, #crmClientsGrid, h1', timeout: 5000 }
      },
      {
        id: 'wf-crm-2',
        title: '2. Verify Client Portfolio Rendered in DOM',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_crm_clients_rendered' }
      },
      {
        id: 'wf-crm-3',
        title: '3. Open Client Profile Drawer / Details Modal',
        action: 'click',
        selector: '.crm-view-client-btn, .client-card',
        fallbackSelector: 'button[onclick*="viewClient"]',
        assertion: { type: 'custom_check', check: 'assert_crm_drawer_open' }
      },
      {
        id: 'wf-crm-4',
        title: '4. Verify Retainer Quota & Active Tier SLA',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_crm_retainer_sla' }
      },
      {
        id: 'wf-crm-5',
        title: '5. Dismiss Drawer & Audit Clean State',
        action: 'click',
        selector: '#btnCloseClientDrawer, .drawer-close-btn, .modal-close',
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_review_room_cycle: {
    id: 'workflow_review_room_cycle',
    platform: 'admin',
    pageId: 'reviews',
    title: '🚀 Review Room: Filter Deliverables ➔ Inspect Frame Review ➔ Approval Audit',
    description: 'Navigates to reviews hub, checks deliverable cards, opens player/viewer, and audits review approval status.',
    targetHash: '#reviews',
    steps: [
      {
        id: 'wf-rev-1',
        title: '1. Navigate to Review Room Hub (#reviews)',
        action: 'navigate_hash',
        target: '#reviews',
        assertion: { type: 'wait_selector', selector: '#reviewsContainer, #reviewGrid, h1', timeout: 5000 }
      },
      {
        id: 'wf-rev-2',
        title: '2. Verify Review Items & Deliverable Cards',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_reviews_rendered' }
      },
      {
        id: 'wf-rev-3',
        title: '3. Inspect Active Review Item',
        action: 'click',
        selector: '.review-item-card, .btn-open-review',
        fallbackSelector: 'button[onclick*="openReview"]',
        assertion: { type: 'custom_check', check: 'assert_review_inspect_active' }
      },
      {
        id: 'wf-rev-4',
        title: '4. Audit Clean: Zero Native Dialogs & Zero Unhandled Rejections',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_social_post_schedule: {
    id: 'workflow_social_post_schedule',
    platform: 'admin',
    pageId: 'social',
    title: '🚀 Social Planner: Calendar Grid ➔ Post Draft Composer ➔ Channel Filter',
    description: 'Validates social planner multi-channel grid, scheduling modal, and post lifecycle.',
    targetHash: '#social',
    steps: [
      {
        id: 'wf-soc-1',
        title: '1. Navigate to Social Planner (#social)',
        action: 'navigate_hash',
        target: '#social',
        assertion: { type: 'wait_selector', selector: '#socialCalendarView, #socialPostsGrid, h1', timeout: 5000 }
      },
      {
        id: 'wf-soc-2',
        title: '2. Verify Social Scheduling Grid & Channels',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_social_calendar_rendered' }
      },
      {
        id: 'wf-soc-3',
        title: '3. Open Schedule New Post Modal',
        action: 'click',
        selector: '#btnOpenNewPostModal, .btn-schedule-post',
        fallbackSelector: 'button[onclick*="openPostModal"]',
        assertion: { type: 'custom_check', check: 'assert_social_modal_open' }
      },
      {
        id: 'wf-soc-4',
        title: '4. Dismiss Composer Modal Cleanly',
        action: 'click',
        selector: '#btnCancelPostModal, .modal-close',
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_platforms_registry_cycle: {
    id: 'workflow_platforms_registry_cycle',
    platform: 'admin',
    pageId: 'platforms',
    title: '🚀 Platform Registry: List Micro-SaaS ➔ View Ecosystem Health ➔ Real DB Sync',
    description: 'Inspects micro-SaaS platform registry, verifies live DB persistence, and tests registration UI.',
    targetHash: '#platforms',
    steps: [
      {
        id: 'wf-plat-1',
        title: '1. Navigate to Platform Portfolio Registry (#platforms)',
        action: 'navigate_hash',
        target: '#platforms',
        assertion: { type: 'wait_selector', selector: '#platformsGrid, #platformsSummary, h1', timeout: 5000 }
      },
      {
        id: 'wf-plat-2',
        title: '2. Verify Micro-SaaS Platform Cards Rendered',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_platforms_rendered' }
      },
      {
        id: 'wf-plat-3',
        title: '3. Open Register Platform Modal',
        action: 'click',
        selector: '#btnRegisterPlatform, .btn-add-platform',
        fallbackSelector: 'button[onclick*="openPlatformModal"]',
        assertion: { type: 'custom_check', check: 'assert_platform_modal_open' }
      },
      {
        id: 'wf-plat-4',
        title: '4. Audit Clean: Dismiss Modal & Confirm Sync',
        action: 'click',
        selector: '#btnCancelPlatformModal, .modal-close',
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_brands_store_cycle: {
    id: 'workflow_brands_store_cycle',
    platform: 'admin',
    pageId: 'brands',
    title: '🚀 Brand Hub: Storefronts ➔ Brand Assets ➔ Multi-Brand Filter',
    description: 'Navigates to brand command center, verifies active brand cards, and audits store inventory.',
    targetHash: '#brands',
    steps: [
      {
        id: 'wf-brd-1',
        title: '1. Navigate to Brand Command Center (#brands)',
        action: 'navigate_hash',
        target: '#brands',
        assertion: { type: 'wait_selector', selector: '#brandsGrid, #brandPortfolio, h1', timeout: 5000 }
      },
      {
        id: 'wf-brd-2',
        title: '2. Verify Brand Portfolio & Catalog Tiles',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_brands_rendered' }
      },
      {
        id: 'wf-brd-3',
        title: '3. Audit Clean: Zero Native Dialogs & Zero Unhandled Rejections',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_digistore_product_cycle: {
    id: 'workflow_digistore_product_cycle',
    platform: 'admin',
    pageId: 'digistore',
    title: '🚀 DigiVault: Digital Products ➔ Subscription Tiers ➔ License Vault',
    description: 'Validates DigiStore product inventory, checkout links, and subscription tiers.',
    targetHash: '#digistore',
    steps: [
      {
        id: 'wf-digi-1',
        title: '1. Navigate to DigiVault Subs & Commerce (#digistore)',
        action: 'navigate_hash',
        target: '#digistore',
        assertion: { type: 'wait_selector', selector: '#digistoreGrid, #digiVaultCatalog, h1', timeout: 5000 }
      },
      {
        id: 'wf-digi-2',
        title: '2. Verify Digital Products & License Pricing',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_digistore_rendered' }
      },
      {
        id: 'wf-digi-3',
        title: '3. Audit Clean: Zero Native Dialogs & Zero Unhandled Rejections',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_hr_onboarding_lifecycle: {
    id: 'workflow_hr_onboarding_lifecycle',
    platform: 'admin',
    pageId: 'hr',
    title: '🚀 HR Operations: Roster Table ➔ PIN Invite Pipeline ➔ Payslip & Agreement Check',
    description: 'Validates team roster, onboarding PIN workflow, survey & agreement status, and payslip generation.',
    targetHash: '#hr',
    steps: [
      {
        id: 'wf-hr-1',
        title: '1. Navigate to HR & Roster Ops (#hr)',
        action: 'navigate_hash',
        target: '#hr',
        assertion: { type: 'wait_selector', selector: '#hrRosterTable, #btnHrTabRoster, h1', timeout: 5000 }
      },
      {
        id: 'wf-hr-2',
        title: '2. Verify Staff Directory Table & Member Cards',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_hr_roster_table' }
      },
      {
        id: 'wf-hr-3',
        title: '3. Switch to Invitations Subtab & Verify PIN Pipeline',
        action: 'click',
        selector: '#btnHrTabInvitations',
        assertion: { type: 'custom_check', check: 'assert_hr_invitations_pipeline' }
      },
      {
        id: 'wf-hr-4',
        title: '4. Verify Agreement Stage Callbacks & Onboarding State',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_agreement_callbacks' }
      },
      {
        id: 'wf-hr-5',
        title: '5. Audit Clean: Multi-Currency Toggle & Zero Errors',
        action: 'click',
        selector: '#btnHrTabRoster',
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_assets_inventory_cycle: {
    id: 'workflow_assets_inventory_cycle',
    platform: 'admin',
    pageId: 'assets',
    title: '🚀 Hardware Assets: Category Tabs ➔ Asset Assignment ➔ Valuation Audit',
    description: 'Checks hardware inventory, assigned custodian, maintenance status, and total valuation.',
    targetHash: '#assets',
    steps: [
      {
        id: 'wf-ast-1',
        title: '1. Navigate to Hardware Assets Hub (#assets)',
        action: 'navigate_hash',
        target: '#assets',
        assertion: { type: 'wait_selector', selector: '#assetsCategoryTabs, #kpiAssetsTotal, h1', timeout: 5000 }
      },
      {
        id: 'wf-ast-2',
        title: '2. Verify 4 Master KPI Tiles & Inventory Items',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_assets_kpis' }
      },
      {
        id: 'wf-ast-3',
        title: '3. Audit Clean: Zero Native Dialogs & Zero Unhandled Rejections',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_settings_config_cycle: {
    id: 'workflow_settings_config_cycle',
    platform: 'admin',
    pageId: 'settings',
    title: '🚀 Settings: FX Rate Config ➔ Security PIN Drawer ➔ Audit Policy',
    description: 'Verifies system settings navigation, currency exchange rate configuration, and PIN security policy.',
    targetHash: '#settings',
    steps: [
      {
        id: 'wf-set-1',
        title: '1. Navigate to Workspace Settings (#settings)',
        action: 'navigate_hash',
        target: '#settings',
        assertion: { type: 'wait_selector', selector: '#settingsNavTabs, h1', timeout: 5000 }
      },
      {
        id: 'wf-set-2',
        title: '2. Switch to Security & Credentials Tab',
        action: 'click',
        selector: 'button[data-tab="security"]',
        assertion: { type: 'custom_check', check: 'assert_settings_security_active' }
      },
      {
        id: 'wf-set-3',
        title: '3. Audit Clean: Agency Config & Security Policy',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.ADMIN_WORKFLOWS = ADMIN_WORKFLOWS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ADMIN_WORKFLOWS };
}
