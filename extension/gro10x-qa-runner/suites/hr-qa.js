/**
 * HR Operations, Team Roster & Staff Profiles QA Test Suite (#hr)
 * 18-Step Comprehensive Automated Validation
 */

const HR_QA_SUITE = {
  id: 'hr',
  name: 'HR & Roster Ops QA Suite',
  platform: 'admin',
  targetHash: '#hr',
  description: 'Validates HR command center, 4 master KPIs, 5 navigation subtabs, staff roster table, staff profile drawer lifecycle, onboarding PIN invitation pipeline, attendance logs, EOD reports, leave requests, onboard member modal lifecycle, edit profile modal with Escape dismissal, multi-currency engine, and zero native dialogs policy.',
  steps: [
    {
      id: 'step-01',
      title: '1. Navigate to HR Operations, Team Roster & Staff Profiles',
      action: 'navigate_hash',
      target: '#hr',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_mounted'
      }
    },
    {
      id: 'step-02',
      title: '2. Verify 4 Master KPI Metrics Rendered',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_kpis'
      }
    },
    {
      id: 'step-03',
      title: '3. Verify 5 Navigation Subtabs Rendered in Nav Bar',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_tabs'
      }
    },
    {
      id: 'step-04',
      title: '4. Verify Team Roster & Profiles Subtab Active',
      action: 'click',
      selector: '#btnHrTabRoster',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_roster_active'
      }
    },
    {
      id: 'step-05',
      title: '5. Verify Staff Directory Table & Member Cards Rendered',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_roster_table'
      }
    },
    {
      id: 'step-06',
      title: '6. Open Staff Profile Drawer for Lead Specialist',
      action: 'click',
      selector: '.hr-view-profile-btn',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_profile_drawer_open'
      }
    },
    {
      id: 'step-07',
      title: '7. Dismiss Staff Profile Drawer via Close Button',
      action: 'click',
      selector: '#btnCloseProfileDrawer',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_profile_drawer_closed'
      }
    },
    {
      id: 'step-08',
      title: '8. Switch to Onboarding & PIN Invites Subtab',
      action: 'click',
      selector: '#btnHrTabInvitations',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_invitations_active'
      }
    },
    {
      id: 'step-09',
      title: '9. Verify PIN Invitation Pipeline & Progress Bar Rendered',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_invitations_pipeline'
      }
    },
    {
      id: 'step-10',
      title: "10. Switch to Today's Attendance Subtab",
      action: 'click',
      selector: '#btnHrTabAttendance',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_attendance_active'
      }
    },
    {
      id: 'step-11',
      title: '11. Switch to EOD Reports Subtab',
      action: 'click',
      selector: '#btnHrTabEod',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_eod_active'
      }
    },
    {
      id: 'step-12',
      title: '12. Switch to Leave Requests Subtab',
      action: 'click',
      selector: '#btnHrTabLeaves',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_leaves_active'
      }
    },
    {
      id: 'step-13',
      title: '13. Open Onboard Team Member Modal',
      action: 'click',
      selector: '#btnOnboardTeamMember',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_add_modal_opened'
      }
    },
    {
      id: 'step-14',
      title: '14. Verify Onboarding Form Fields Rendered',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_add_modal_fields'
      }
    },
    {
      id: 'step-15',
      title: '15. Dismiss Onboarding Modal via Cancel Button',
      action: 'click',
      selector: '#btnCancelAddMember',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_add_modal_dismissed'
      }
    },
    {
      id: 'step-16',
      title: '16. Open Edit Member Modal & Dismiss via Escape Key',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_edit_modal_escape'
      }
    },
    {
      id: 'step-17',
      title: '17. Currency Toggle: BDT (৳) & USD ($) — Verify Currency Engine',
      action: 'click',
      selector: '#hrCurrencyToggleBtn',
      assertion: {
        type: 'custom_check',
        check: 'assert_hr_currency_toggle'
      }
    },
    {
      id: 'step-18',
      title: '18. Final Clean Audit — 0 Native Dialogs, 0 Unhandled Rejections',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_clean_audit'
      }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.HR_QA_SUITE = HR_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HR_QA_SUITE };
}
