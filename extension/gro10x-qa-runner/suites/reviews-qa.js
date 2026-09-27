/**
 * Production Client Review Room & Proofing Hub QA Automation Suite (18 Steps)
 * KPI tiles, filter pills, review grid, new review modal, backdrop close (#reviews)
 */

const REVIEWS_QA_SUITE = {
  id: 'reviews',
  platform: 'admin',
  title: 'Client Review Room & Proofing Hub QA Suite',
  targetHash: '#reviews',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Client Review Room & Proofing Hub',
      action: 'navigate_hash',
      target: '#reviews',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 4 KPI Tiles Rendered (Total, Pending, Revision, Approved)',
      action: 'wait_ms',
      duration: 700,
      assertion: { type: 'custom_check', check: 'assert_reviews_kpi_strip' }
    },
    {
      id: 'step-3',
      title: '3. Verify 4 Filter Pills Rendered',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_reviews_filter_pills' }
    },
    {
      id: 'step-4',
      title: '4. Click All Media Filter Pill — Verify Active',
      action: 'click',
      selector: '#pill-all',
      assertion: { type: 'custom_check', check: 'assert_reviews_pill_all_active' }
    },
    {
      id: 'step-5',
      title: '5. Click Video Filter Pill — Verify Active',
      action: 'click',
      selector: '#pill-video',
      assertion: { type: 'custom_check', check: 'assert_reviews_pill_video_active' }
    },
    {
      id: 'step-6',
      title: '6. Click Image Filter Pill — Verify Active',
      action: 'click',
      selector: '#pill-image',
      assertion: { type: 'custom_check', check: 'assert_reviews_pill_image_active' }
    },
    {
      id: 'step-7',
      title: '7. Click PDF Filter Pill — Verify Active',
      action: 'click',
      selector: '#pill-pdf',
      assertion: { type: 'custom_check', check: 'assert_reviews_pill_pdf_active' }
    },
    {
      id: 'step-8',
      title: '8. Reset to All Media Filter',
      action: 'click',
      selector: '#pill-all',
      assertion: { type: 'custom_check', check: 'assert_reviews_pill_all_active' }
    },
    {
      id: 'step-9',
      title: '9. Verify Review Project Grid Rendered',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'custom_check', check: 'assert_reviews_grid' }
    },
    {
      id: 'step-10',
      title: '10. Open New Review Project Modal',
      action: 'click',
      selector: '#btnOpenNewReviewModal',
      assertion: { type: 'modal_open', selector: '#newReviewModal' }
    },
    {
      id: 'step-11',
      title: '11. Verify All Form Fields Present in Modal',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_reviews_form_fields' }
    },
    {
      id: 'step-12',
      title: '12. Fill Project Name Field',
      action: 'input_text',
      selector: '#nrProjectName',
      value: 'Test TVC Cut v3',
      assertion: { type: 'custom_check', check: 'assert_reviews_name_filled' }
    },
    {
      id: 'step-13',
      title: '13. Select Media Type: Image',
      action: 'input_text',
      selector: '#nrMediaType',
      value: 'image',
      assertion: { type: 'custom_check', check: 'assert_reviews_mediatype_image' }
    },
    {
      id: 'step-14',
      title: '14. Reset Media Type: Video',
      action: 'input_text',
      selector: '#nrMediaType',
      value: 'video',
      assertion: { type: 'custom_check', check: 'assert_reviews_mediatype_video' }
    },
    {
      id: 'step-15',
      title: '15. Close New Review Modal via ✕ Button',
      action: 'click',
      selector: '#btnCloseNewReviewModal',
      assertion: { type: 'modal_closed', selector: '#newReviewModal' }
    },
    {
      id: 'step-16',
      title: '16. Re-Open Modal — Dismiss via Backdrop Click',
      action: 'click',
      selector: '#btnOpenNewReviewModal',
      assertion: { type: 'modal_open', selector: '#newReviewModal' }
    },
    {
      id: 'step-16b',
      title: '16b. Backdrop Click Close',
      action: 'click_backdrop',
      selector: '#newReviewModal',
      assertion: { type: 'modal_closed', selector: '#newReviewModal' }
    },
    {
      id: 'step-17',
      title: '17. Verify window.switchReviewsCurrency Global Alias',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_reviews_currency_alias' }
    },
    {
      id: 'step-18',
      title: '18. Final Audit: Zero Native Dialogs & Unhandled Rejections',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.REVIEWS_QA_SUITE = REVIEWS_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { REVIEWS_QA_SUITE };
}