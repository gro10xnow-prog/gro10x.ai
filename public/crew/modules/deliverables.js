/**
 * public/crew/modules/deliverables.js
 * Specialist Deliverables Submission, QC Pipeline & Reviewer Feedback Loop
 */
window.CREW_MODULES = window.CREW_MODULES || {};

window.crewDelivTab = function(tab) {
  const uploadEl = document.getElementById('delivUploadContent');
  const feedbackEl = document.getElementById('delivFeedbackContent');
  const uploadBtn = document.getElementById('delivTabUpload');
  const feedbackBtn = document.getElementById('delivTabFeedback');

  if (!uploadEl || !feedbackEl || !uploadBtn || !feedbackBtn) return;

  if (tab === 'upload') {
    uploadEl.style.display = 'flex';
    feedbackEl.style.display = 'none';
    uploadBtn.className = 'btn-primary';
    feedbackBtn.className = 'btn-secondary';
  } else {
    uploadEl.style.display = 'none';
    feedbackEl.style.display = 'flex';
    uploadBtn.className = 'btn-secondary';
    feedbackBtn.className = 'btn-primary';
  }
};

window.submitCrewDeliverable = async function(taskId, empId) {
  const fileInput = document.getElementById(`delivFile_${taskId}`);
  const extLinkInput = document.getElementById(`delivExtLink_${taskId}`);
  const noteInput = document.getElementById(`delivNote_${taskId}`);
  const btn = document.getElementById(`delivSubmitBtn_${taskId}`);

  const file = fileInput?.files?.[0];
  const externalLink = extLinkInput?.value?.trim();
  const versionNote = noteInput?.value?.trim() || 'Deliverable uploaded for review';

  if (!file && !externalLink) {
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast('Please select a file or provide a cloud link (Drive/Dropbox/Frame.io).', 'error');
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      btn.innerHTML = `⏳ Reading ${file.name} (${sizeMb}MB)...`;
    } else {
      btn.innerHTML = '⏳ Submitting Link...';
    }
  }

  try {
    if (file) {
      if (file.size > 28 * 1024 * 1024) {
        throw new Error('File size exceeds 25MB browser limit. Please paste a Google Drive/Frame.io link instead.');
      }

      const reader = new FileReader();
      reader.onload = async function(e) {
        try {
          if (btn) btn.innerHTML = '⏳ Uploading deliverable...';
          const base64 = e.target.result.split(',')[1];
          const res = await CREW_API.post('/team/upload-deliverable', {
            taskId,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64,
            versionNote,
            employeeId: empId
          });

          if (res && (res.success !== false && !res.error)) {
            if (btn) btn.innerHTML = '✅ Submitted!';
            if (typeof window.showCrewToast === 'function') {
              window.showCrewToast('Deliverable submitted for Internal QC! 🎬');
            }
            setTimeout(() => {
              const viewContainer = document.getElementById('crew-view');
              if (viewContainer && window.CREW_MODULES.deliverables) {
                window.CREW_MODULES.deliverables(viewContainer);
              }
            }, 600);
          } else {
            throw new Error(res?.error || 'Upload failed');
          }
        } catch (err) {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '📤 Submit for Internal QC';
          }
          if (typeof window.showCrewToast === 'function') {
            window.showCrewToast(`Error: ${err.message}`, 'error');
          }
        }
      };
      reader.onerror = () => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '📤 Submit for Internal QC';
        }
        if (typeof window.showCrewToast === 'function') window.showCrewToast('Could not read local file.', 'error');
      };
      reader.readAsDataURL(file);
    } else {
      // External link submission
      const res = await CREW_API.patch(`/tasks/${taskId}`, {
        stage: 'Internal QC',
        custom_fields: {
          deliverables: [{
            url: externalLink,
            fileName: 'Cloud Deliverable Link',
            versionNote: versionNote,
            submittedBy: empId,
            submittedAt: new Date().toISOString()
          }]
        }
      });

      if (res && (res.success !== false && !res.error)) {
        if (typeof window.showCrewToast === 'function') {
          window.showCrewToast('Deliverable link submitted for Internal QC! 🎬');
        }
        setTimeout(() => {
          const viewContainer = document.getElementById('crew-view');
          if (viewContainer && window.CREW_MODULES.deliverables) {
            window.CREW_MODULES.deliverables(viewContainer);
          }
        }, 600);
      } else {
        throw new Error(res?.error || 'Failed to submit link');
      }
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '📤 Submit for Internal QC';
    }
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast(`Error: ${err.message}`, 'error');
    }
  }
};

window.CREW_MODULES.deliverables = async function(container) {
  const me = await CREW_API.getMe().catch(() => ({}));
  const user = me.user || {};
  const empId = user.emp_code || user.id || 'PBD-001';
  const userName = (user.name || '').toLowerCase();

  const tasks = await CREW_API.get('/tasks').catch(() => []);
  const myTasks = (tasks || []).filter(t => {
    const codeMatch = empId && (t.assignee_id === empId || t.assigneeId === empId);
    const direct = userName && (t.assignee || '').toLowerCase().includes(userName);
    const list = userName && Array.isArray(t.assignees) && t.assignees.some(a => (a || '').toLowerCase().includes(userName));
    return codeMatch || direct || list;
  });

  const reviewStages = ['internal qc', 'client review', 'approved', 'published', 'in review'];
  const myReviewedTasks = myTasks.filter(t => reviewStages.includes((t.stage || '').toLowerCase()));

  container.innerHTML = `
    <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <div>
        <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">📤 Deliverables & QC Pipeline</h1>
        <div style="font-size:0.88rem; color:var(--text-muted);">Upload completed videos, 3D renders, and inspect reviewer feedback.</div>
      </div>
    </div>

    <!-- Tab Switcher -->
    <div style="display:flex; gap:0.6rem; margin-bottom:1.5rem;">
      <button onclick="crewDelivTab('upload')" id="delivTabUpload" class="btn-primary" style="font-size:0.82rem; padding:0.45rem 1rem; border-radius:10px; cursor:pointer;">
        📤 Upload Deliverables (${myTasks.length})
      </button>
      <button onclick="crewDelivTab('feedback')" id="delivTabFeedback" class="btn-secondary" style="font-size:0.82rem; padding:0.45rem 1rem; border-radius:10px; cursor:pointer;">
        📥 Feedback Received (${myReviewedTasks.length})
      </button>
    </div>

    <!-- TAB 1: Upload Deliverables Queue -->
    <div id="delivUploadContent" style="display:flex; flex-direction:column; gap:1.25rem;">
      ${myTasks.map(t => {
        const deliverables = t.custom_fields?.deliverables || t.deliverables || [];
        const isQC = (t.stage || '').toLowerCase().includes('qc') || (t.stage || '').toLowerCase().includes('review');
        return `
          <div class="card-glass" style="padding:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; margin-bottom:1rem;">
              <div>
                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                  <span class="badge ${isQC ? 'badge-purple' : 'badge-emerald'}" style="font-size:0.75rem;">${t.stage || 'In Production'}</span>
                  <span style="font-size:0.8rem; color:var(--text-muted);">${t.workflowType || t.category || 'Production Task'}</span>
                </div>
                <h3 style="margin:0; font-size:1.15rem; color:#fff; font-family:var(--font-heading);">${t.title}</h3>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">
                  🏢 Client: <strong>${t.client || 'Agency'}</strong> &bull; 📅 Due: <strong>${t.dueDate || 'ASAP'}</strong>
                </div>
              </div>
            </div>

            <!-- Existing Submissions History if any -->
            ${deliverables.length > 0 ? `
              <div style="background:rgba(0,0,0,0.2); border:1px solid var(--border-subtle); border-radius:10px; padding:0.85rem; margin-bottom:1.25rem;">
                <div style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-bottom:0.5rem;">Submitted Deliverables (${deliverables.length}):</div>
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                  ${deliverables.map((d, idx) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.82rem; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:6px;">
                      <div>
                        <strong>v${idx + 1}:</strong> ${d.fileName || 'Deliverable'}
                        ${d.versionNote ? `<span style="color:var(--text-muted);"> — "${d.versionNote}"</span>` : ''}
                      </div>
                      ${d.url ? `<a href="${d.url}" target="_blank" style="color:var(--purple-light); font-weight:700; text-decoration:none;">View / Download ↗</a>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Upload Submission Form -->
            <div style="background:rgba(255,255,255,0.02); border:1px dashed var(--border-subtle); border-radius:12px; padding:1.25rem;">
              <div style="font-size:0.9rem; font-weight:700; color:var(--text-primary); margin-bottom:0.75rem;">
                🎬 Submit New Version for QC Review
              </div>

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:0.75rem; margin-bottom:0.75rem;">
                <div>
                  <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">Upload File (MP4, MOV, ZIP, PNG, max 25MB)</label>
                  <input type="file" id="delivFile_${t.id}" style="width:100%; font-size:0.82rem; color:var(--text-muted);">
                </div>
                <div>
                  <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">Or Cloud Master Link (Drive / Dropbox / Frame.io)</label>
                  <input type="url" id="delivExtLink_${t.id}" placeholder="https://drive.google.com/..." style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.5rem; color:#fff; font-family:inherit; font-size:0.85rem; box-sizing:border-box;">
                </div>
              </div>

              <div style="margin-bottom:0.85rem;">
                <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">Version Notes / Changes Applied</label>
                <input type="text" id="delivNote_${t.id}" placeholder="e.g. Cut refined according to director notes, color LUT graded" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.5rem; color:#fff; font-family:inherit; font-size:0.85rem; box-sizing:border-box;">
              </div>

              <button id="delivSubmitBtn_${t.id}" class="btn-primary" style="font-size:0.85rem; padding:0.55rem 1.25rem; border-radius:10px; cursor:pointer;" onclick="submitCrewDeliverable('${t.id}', '${empId}')">
                📤 Submit for Internal QC
              </button>
            </div>
          </div>
        `;
      }).join('') || `
        <div class="card-glass" style="text-align:center; padding:3.5rem 1rem; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">🎬</div>
          <div style="font-weight:700; color:var(--text-primary); font-size:1.1rem;">No Deliverables Pending</div>
          <div style="font-size:0.85rem; margin-top:0.3rem;">You have no active production tasks assigned to upload deliverables for.</div>
        </div>
      `}
    </div>

    <!-- TAB 2: Reviewer Feedback Feed -->
    <div id="delivFeedbackContent" style="display:none; flex-direction:column; gap:1.25rem;">
      ${myReviewedTasks.length === 0 ? `
        <div class="card-glass" style="text-align:center; padding:3.5rem 1rem; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">📭</div>
          <div style="font-weight:700; color:var(--text-primary); font-size:1.1rem;">No Review Feedback Yet</div>
          <div style="font-size:0.85rem; margin-top:0.3rem;">Tasks in Internal QC or Client Review will display reviewer notes and status here.</div>
        </div>
      ` : myReviewedTasks.map(t => {
        const reviewNotes = t.custom_fields?.review_notes || t.custom_fields?.qc_notes || t.review_notes || null;
        const deliverables = t.custom_fields?.deliverables || t.deliverables || [];
        const lastDeliverable = deliverables[deliverables.length - 1];

        return `
          <div class="card-glass" style="padding:1.35rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; margin-bottom:0.75rem;">
              <div>
                <span class="badge badge-purple" style="font-size:0.75rem; margin-bottom:0.3rem; display:inline-block;">${t.stage}</span>
                <h3 style="margin:0; font-size:1.1rem; color:#fff; font-family:var(--font-heading);">${t.title}</h3>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
                  🏢 Client: <strong>${t.client || 'Agency'}</strong> &bull; 📂 ${t.workflowType || t.category || 'Production'}
                </div>
              </div>
            </div>

            <!-- Reviewer Notes Banner -->
            ${reviewNotes ? `
              <div style="background:rgba(139,92,246,0.08); border-left:3px solid var(--purple-light); padding:0.85rem 1rem; border-radius:0 10px 10px 0; font-size:0.86rem; color:var(--text-primary); line-height:1.5; margin-bottom:0.85rem;">
                <div style="font-weight:800; color:var(--purple-light); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:0.3rem;">
                  📝 Reviewer & Art Director Feedback
                </div>
                ${reviewNotes}
              </div>
            ` : `
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem 1rem; font-size:0.82rem; color:var(--text-muted); font-style:italic; margin-bottom:0.85rem;">
                ⏳ Submission is in review queue — no written revision notes logged yet.
              </div>
            `}

            ${lastDeliverable ? `
              <div style="font-size:0.78rem; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                <span>📤 Last file: <strong>${lastDeliverable.fileName || 'Deliverable'}</strong> (${lastDeliverable.versionNote || 'No notes'})</span>
                ${lastDeliverable.url ? `<a href="${lastDeliverable.url}" target="_blank" style="color:var(--purple-light); font-weight:700; text-decoration:none;">View Upload ↗</a>` : ''}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
};
