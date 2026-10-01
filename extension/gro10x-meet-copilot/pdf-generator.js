/**
 * GRO10X Meet Copilot - PDF & Document Export Generator (v1.0 Production)
 * Creates professional, print-ready and downloadable PDF / executive summaries.
 * Engineered for 1-2 page executive briefs with zero Chromium flex-break pagination bugs.
 */

const PDFGenerator = {
  /**
   * Builds the formatted HTML template for the Executive Meeting Minutes
   */
  buildDocumentHtml(data) {
    const title = data.title || 'Google Meet Sync';
    const date = data.date || new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const participants = Array.isArray(data.participants) ? data.participants : [data.participants || 'Participants'];
    const overview = data.overview || 'No overview provided.';
    const decisions = Array.isArray(data.decisions) ? data.decisions : [];
    const actionItems = Array.isArray(data.actionItems) ? data.actionItems : [];
    const discussionPoints = Array.isArray(data.discussionPoints) ? data.discussionPoints : [];
    const userNotes = data.userNotes || '';
    const includeTranscript = !!data.includeTranscript;
    const transcript = Array.isArray(data.transcript) ? data.transcript : [];

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - GRO10X Executive Minutes</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 14mm 14mm;
    }
    * { box-sizing: border-box; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.45;
      font-size: 12px;
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      max-width: 100%;
      margin: 0 auto;
    }
    /* Robust Table-based Header (immune to Chromium flex print bugs) */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: middle;
      padding: 0 0 8px 0;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-badge {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
      vertical-align: middle;
    }
    .meeting-name {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
    }
    .meta-date {
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .meta-subtitle {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }
    /* Section Headings */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      margin: 12px 0 6px 0;
      display: block;
      border-left: 3px solid #4f46e5;
      padding-left: 6px;
    }
    .overview-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 12px;
      color: #1e293b;
      line-height: 1.5;
    }
    .attendees-wrap {
      margin-bottom: 10px;
    }
    .attendee-pill {
      display: inline-block;
      background: #f1f5f9;
      color: #334155;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      margin: 2px 4px 2px 0;
    }
    /* Action Items Table */
    .action-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 11px;
      page-break-inside: auto;
    }
    .action-table th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
    }
    .action-table td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .action-table tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .priority-high {
      color: #dc2626;
      font-weight: 700;
    }
    .priority-med {
      color: #d97706;
      font-weight: 700;
    }
    .priority-low {
      color: #059669;
      font-weight: 700;
    }
    ul.bullet-list {
      margin: 0;
      padding-left: 18px;
    }
    ul.bullet-list li {
      margin-bottom: 4px;
      line-height: 1.45;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .notes-box {
      white-space: pre-wrap;
      font-family: inherit;
      background: #fafafa;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 11px;
      color: #334155;
      line-height: 1.45;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    /* Compact Appendix (Only if explicitly enabled) */
    .appendix {
      margin-top: 14px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      break-before: page;
      page-break-before: always;
    }
    .compact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      font-size: 10px;
    }
    .transcript-entry {
      background: #f8fafc;
      padding: 4px 6px;
      border-radius: 4px;
      border: 1px solid #f1f5f9;
      line-height: 1.35;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .speaker-label {
      font-weight: 700;
      color: #4338ca;
    }
    .time-label {
      color: #94a3b8;
      font-size: 9px;
      margin-right: 2px;
    }
    /* Table-based Footer */
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      border-top: 1px solid #e2e8f0;
      margin-top: 18px;
      padding-top: 6px;
      font-size: 9px;
      color: #94a3b8;
    }
    .footer-table td {
      vertical-align: middle;
      padding-top: 6px;
    }
    /* Strictly Enforce Print Hygiene */
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
      .header-table, .footer-table {
        page-break-inside: avoid !important;
      }
      .overview-card, .notes-box, .action-table tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">

    <table class="header-table">
      <tr>
        <td>
          <h1 class="brand-title">GRO10X <span class="brand-badge">MEET COPILOT</span></h1>
          <div class="meeting-name">${title}</div>
        </td>
        <td class="meta-box">
          <div class="meta-date">📅 ${date}</div>
          <div class="meta-subtitle">Executive Brief · 1-2 Pages</div>
        </td>
      </tr>
    </table>

    ${participants && participants.length > 0 ? `
    <div class="attendees-wrap">
      <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 2px; text-transform: uppercase;">Participants (${participants.length})</div>
      <div>
        ${participants.map(p => `<span class="attendee-pill">👤 ${p}</span>`).join('')}
      </div>
    </div>` : ''}

    <div class="section-title">Executive Summary</div>
    <div class="overview-card">${overview}</div>

    ${decisions && decisions.length > 0 ? `
    <div class="section-title">Key Decisions & Agreements</div>
    <ul class="bullet-list">
      ${decisions.map(d => `<li><strong>${d}</strong></li>`).join('')}
    </ul>` : ''}

    ${actionItems && actionItems.length > 0 ? `
    <div class="section-title">Action Items & Next Steps</div>
    <table class="action-table">
      <thead>
        <tr>
          <th style="width: 52%;">Task</th>
          <th style="width: 18%;">Assignee</th>
          <th style="width: 14%;">Priority</th>
          <th style="width: 16%;">Timeline</th>
        </tr>
      </thead>
      <tbody>
        ${actionItems.map(item => `
        <tr>
          <td>${item.task || ''}</td>
          <td><strong>${item.owner || 'Team'}</strong></td>
          <td><span class="${item.priority === 'High' ? 'priority-high' : item.priority === 'Medium' ? 'priority-med' : 'priority-low'}">${item.priority || 'Medium'}</span></td>
          <td style="color: #64748b;">${item.deadline || 'Next Sync'}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : ''}

    ${discussionPoints && discussionPoints.length > 0 ? `
    <div class="section-title">Discussion Highlights</div>
    <ul class="bullet-list">
      ${discussionPoints.map(p => `<li>${p}</li>`).join('')}
    </ul>` : ''}

    ${userNotes ? `
    <div class="section-title">Meeting Notes</div>
    <div class="notes-box">${userNotes}</div>` : ''}

    ${includeTranscript && transcript && transcript.length > 0 ? `
    <div class="appendix">
      <div class="section-title">Appendix: Captions Log (Compact Sample · ${Math.min(transcript.length, 30)} of ${transcript.length} turns)</div>
      <div class="compact-grid">
        ${transcript.slice(0, 30).map(t => `
        <div class="transcript-entry">
          <span class="time-label">[${t.time || ''}]</span>
          <span class="speaker-label">${t.speaker || 'Speaker'}:</span>
          <span>${t.text || ''}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <table class="footer-table">
      <tr>
        <td>Compiled via GRO10X Meet Copilot · Real-time Google Meet Intelligence</td>
        <td style="text-align: right;">Confidential & Internal</td>
      </tr>
    </table>

  </div>
</body>
</html>`;
  },

  /**
   * Opens the printable document and triggers browser print-to-PDF
   */
  downloadPdf(data) {
    const htmlContent = this.buildDocumentHtml(data);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Open in dedicated print window
    const printWindow = window.open(url, '_blank', 'width=900,height=800');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 250);
      };
    } else {
      // Direct HTML document fallback
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(data.title || 'Meeting').replace(/[^a-z0-9_-]/gi, '_')}_Executive_Summary.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
};

if (typeof window !== 'undefined') {
  window.PDFGenerator = PDFGenerator;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PDFGenerator;
}
