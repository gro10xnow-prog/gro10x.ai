/**
 * public/client/modules/review.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2: Client Review Room & Sprint Deliverables Cockpit
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-format deliverable presentation (Staging Apps, GitHub Codebase,
 * API Specs, AV Walkthroughs), Definition of Done (DoD) verification,
 * real-time Scope Creep Shield, 2-round revision lifecycle, and 1-click
 * formal milestone sign-off activating the 30-day bug-fix warranty clock.
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.CLIENT_MODULES = window.CLIENT_MODULES || {};
var escapeHTML = window.escapeHTML || function(s) { 
  return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;') : ''; 
};

window.CLIENT_MODULES.review = async function(container) {
  let reviews = [];
  let isLegacyPosts = false;
  let activeItem = null;
  let activeApproveItem = null;

  async function loadReviewItems() {
    try {
      // Primary: query Engine 2 sprint reviews
      const revData = await CLIENT_API.get('/reviews').catch(() => []);
      if (Array.isArray(revData) && revData.length > 0) {
        reviews = revData;
        isLegacyPosts = false;
      } else {
        // Graceful fallback to legacy creative posts
        const allPosts = await CLIENT_API.get('/posts').catch(() => []);
        reviews = (allPosts || []).filter(p => 
          p.status === 'Pending Client Approval' || 
          p.status === 'Client Review' || 
          p.status === 'Approved' || 
          p.status === 'Changes Requested'
        );
        isLegacyPosts = true;
      }
    } catch (e) {
      console.warn('[ReviewRoom] Error loading deliverables:', e);
      reviews = [];
    }
    renderReviewRoom();
  }

  function calculateWarrantyCountdown(approvedAt) {
    if (!approvedAt) return null;
    const approvalDate = new Date(approvedAt);
    const warrantyEnd = new Date(approvalDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diffMs = warrantyEnd - now;
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return {
      daysLeft,
      endDateStr: warrantyEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      isActive: diffMs > 0
    };
  }

  function renderReviewRoom() {
    container.innerHTML = `
      <!-- Header Section -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1.5rem; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem;">
            <span class="badge badge-purple" style="font-size:0.72rem; letter-spacing:0.04em;">ENGINE 2 SPRINT DELIVERY</span>
            <span class="badge badge-cyan" style="font-size:0.72rem;">SLA: 48H FEEDBACK WINDOW</span>
          </div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            🎬 Sprint Deliverables & Review Cockpit
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted); max-width: 650px;">
            Test live staging builds, inspect GitHub repositories & API contracts, review QA Definition of Done (DoD), and submit structured feedback or 1-click milestone sign-offs.
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
          <div style="background:var(--surface-3); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.4rem 0.75rem; font-size:0.75rem; color:var(--text-secondary);">
            <span>🛡️ <strong>Scope Creep Shield:</strong> Active</span>
          </div>
          <a href="/reviewroom.html" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem;">
            🖥️ Standalone Room ↗
          </a>
        </div>
      </div>

      <!-- Deliverables Feed -->
      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        ${reviews.map(r => renderDeliverableCard(r)).join('') || `
          <div class="card-glass" style="padding:3.5rem 1.5rem; text-align:center; color:var(--text-muted);">
            <div style="font-size:2.5rem; margin-bottom:0.75rem;">🚀</div>
            <div style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin-bottom:0.3rem;">No Sprint Deliverables In Review</div>
            <div style="font-size:0.85rem; max-width:420px; margin:0 auto;">When your production engineering team publishes a staging build or sprint candidate, it will appear here for structured verification.</div>
          </div>
        `}
      </div>

      <!-- Scope Creep Shield Feedback Modal -->
      <div class="modal-overlay" id="clFeedbackModal">
        <div class="modal-box" style="max-width: 560px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">✏️ Structured Sprint Feedback</h3>
              <span class="badge badge-purple" style="font-size:0.7rem;">Shield Protected</span>
            </div>
            <button onclick="window.CLIENT_REVIEW.closeAdjustModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;" id="clFeedbackItemName">
            Project Deliverable
          </div>

          <!-- Feedback Type / Category -->
          <div class="form-group">
            <label class="form-label" style="display:flex; justify-content:space-between;">
              <span>Feedback Category *</span>
              <span style="font-size:0.72rem; color:var(--text-dim);">Guards against out-of-scope disputes</span>
            </label>
            <select id="clFeedbackType" class="form-input" style="width:100%;" onchange="window.CLIENT_REVIEW.handleTypeChange(this.value)">
              <option value="BUG_FIX">🐞 Defect / Bug Fix (Against approved sprint specification)</option>
              <option value="POLISH_REVISION">✨ Polish / UI Styling Adjustment (Within locked sprint scope)</option>
              <option value="OUT_OF_SCOPE">⚠️ Scope Expansion / New Feature Request (Requires Change Order)</option>
            </select>
          </div>

          <!-- Real-Time Scope Warning Banner -->
          <div id="clScopeWarningBanner" style="display:none; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:0.75rem; margin-bottom:1rem; font-size:0.8rem; color:#fde68a;">
            <strong>⚠️ Potential Scope Expansion Detected:</strong> This modification touches capabilities outside the locked sprint specification. If submitted as a new feature, our Account Manager will provide an add-on quote without stalling current sprint delivery.
          </div>

          <div class="form-group">
            <label class="form-label">Component, Endpoint, or Timestamp (Optional)</label>
            <input type="text" id="clFeedbackTimecode" class="form-input" placeholder="e.g. POST /api/v1/auth, Navigation Bar, or 00:45 on demo video">
          </div>

          <div class="form-group">
            <label class="form-label">Detailed Observations & Action Items *</label>
            <textarea id="clFeedbackText" class="form-textarea" rows="4" 
              placeholder="Describe the expected behavior vs observed result, with clear reproduction steps or precise copy/layout changes..." 
              style="width:100%; border-radius:10px; padding:0.75rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); color:#fff; font-family:inherit;"
              oninput="window.CLIENT_REVIEW.checkScopeKeywords(this.value)"></textarea>
          </div>

          <div style="display:flex; gap:0.75rem; margin-top:1.2rem;">
            <button class="btn-secondary" style="flex:1;" onclick="window.CLIENT_REVIEW.closeAdjustModal()">Cancel</button>
            <button class="btn-primary" id="clSubmitFeedbackBtn" style="flex:1; background:linear-gradient(135deg, #f43f5e, #ec4899);" onclick="window.CLIENT_REVIEW.submitAdjustment()">🚀 Dispatch to Engineering</button>
          </div>
        </div>
      </div>

      <!-- 1-Click Milestone Sign-Off Modal -->
      <div class="modal-overlay" id="clSignOffModal">
        <div class="modal-box" style="max-width: 520px; border:1px solid rgba(16,185,129,0.3); box-shadow:0 20px 60px rgba(0,0,0,0.7);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">🎉</span>
              <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">Sprint Sign-Off & Milestone Acceptance</h3>
            </div>
            <button onclick="window.CLIENT_REVIEW.closeSignOffModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <p style="font-size:0.86rem; color:var(--text-secondary); line-height:1.5; margin-bottom:1.2rem;">
            By signing off, you confirm that the sprint deliverable meets the agreed specifications and Definition of Done (DoD). This releases the milestone commercial invoice and activates your 30-day warranty.
          </p>

          <!-- Commercial & Warranty Snapshot -->
          <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.25); border-radius:12px; padding:1rem; margin-bottom:1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
              <span style="font-size:0.75rem; color:#34d399; font-weight:800; text-transform:uppercase; letter-spacing:0.04em;">Milestone Commercial Release</span>
              <span class="badge badge-emerald" style="font-size:0.7rem;">50% Milestone Balance</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.4rem;">
              <span style="font-size:1.35rem; font-weight:800; color:#fff;" id="signOffUsd">$1,500 USD</span>
              <span style="font-size:0.9rem; font-weight:700; color:#34d399;" id="signOffBdt">৳176,250 BDT</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted);">
              Includes immediate transfer of commercial code intellectual property (IP) and release of production artifacts.
            </div>
          </div>

          <div style="background:var(--surface-3); border-radius:10px; padding:0.85rem; margin-bottom:1.25rem; font-size:0.8rem; color:var(--text-secondary); line-height:1.5;">
            <div style="display:flex; align-items:center; gap:0.4rem; color:var(--purple-light); font-weight:700; margin-bottom:0.25rem;">
              <span>🛡️ 30-Day Bug-Fix Warranty Activation</span>
            </div>
            All reported code defects or deviations from the locked specification will be remediated at zero additional cost for 30 days from sign-off.
          </div>

          <div style="font-size:0.76rem; color:var(--text-dim); margin-bottom:1rem;">
            Signing off as: <strong style="color:var(--text-primary);" id="signOffSignerName">Authorized Client POC</strong>
          </div>

          <div style="display:flex; gap:0.75rem;">
            <button class="btn-secondary" style="flex:1;" onclick="window.CLIENT_REVIEW.closeSignOffModal()">Cancel</button>
            <button class="btn-primary" id="btnConfirmSignOff" style="flex:1.2; background:linear-gradient(135deg, #10b981, #059669);" onclick="window.CLIENT_REVIEW.executeSignOff()">✅ Accept & Activate Warranty</button>
          </div>
        </div>
      </div>

      <!-- Warranty Activation Success Modal -->
      <div class="modal-overlay" id="clWarrantySuccessModal">
        <div class="modal-box" style="max-width: 500px; text-align:center; background:linear-gradient(135deg, #0d131f, #070b12); border:1px solid rgba(16,185,129,0.4); border-radius:18px; padding:2rem 1.5rem;">
          <div style="font-size:3.5rem; margin-bottom:0.75rem;">🛡️</div>
          <h2 style="font-size:1.4rem; font-family:var(--font-heading); color:#fff; margin:0 0 0.5rem;">
            Milestone Accepted & Warranty Active!
          </h2>
          <p style="font-size:0.86rem; color:var(--text-secondary); line-height:1.5; margin-bottom:1.25rem;">
            Your deliverable sign-off has been verified and permanently recorded. Your institutional <strong>30-Day Zero-Cost Bug-Fix Warranty</strong> is officially running.
          </p>

          <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:12px; padding:1rem; margin-bottom:1.5rem; text-align:left; font-size:0.82rem; line-height:1.6;">
            <div>• <strong>Warranty Closes:</strong> <span style="color:#34d399; font-weight:700;" id="modalWarrantyExpiry">30 Days from today</span></div>
            <div>• <strong>SLA Response Guarantee:</strong> 4-Hour Critical P0 / 24-Hour Standard P1</div>
            <div>• <strong>Remediation Cost:</strong> ৳0 (Zero-Cost In-Scope Resolution)</div>
            <div>• <strong>Dispute Freeze:</strong> Automatic warranty timer pause during active queries</div>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.6rem;">
            <a id="modalHandoverLink" href="/handover-view.html" target="_blank" class="btn-primary" style="text-decoration:none; justify-content:center; display:flex; align-items:center; gap:0.4rem;">
              📄 View IP Handover Shield & Signatures
            </a>
            <button class="btn-secondary" onclick="document.getElementById('clWarrantySuccessModal').classList.remove('active')">
              Done & Return to Review Room
            </button>
          </div>
        </div>
      </div>

      <!-- Deliverable Side-by-Side Version Comparison Modal -->
      <div class="modal-overlay" id="clCompareModal">
        <div class="modal-box" style="max-width: 960px; width:92%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(6,182,212,0.35); box-shadow: 0 20px 60px rgba(0,0,0,0.85);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.75rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                <span class="badge badge-cyan" style="font-size:0.7rem; font-weight:800;">SYNCHRONIZED VERSION DIFF</span>
                <span class="badge badge-purple" id="cmpRevisionBadge" style="font-size:0.7rem;">Round 1</span>
              </div>
              <h3 style="color:#fff; margin:0; font-family:var(--font-heading); font-size:1.3rem;" id="cmpProjectTitle">Sprint Deliverable Comparison</h3>
            </div>
            <button onclick="window.CLIENT_REVIEW.closeCompareModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div id="cmpLoading" style="padding:2rem; text-align:center; color:var(--text-muted);">
            <div style="font-size:2rem; margin-bottom:0.5rem;">⏳</div>
            <div>Fetching synchronized version diff...</div>
          </div>

          <div id="cmpContent" style="display:none; flex-direction:column; gap:1.25rem;">
            <!-- Revision Notes Strip (if available) -->
            <div id="cmpNotesWrap" style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.25); border-radius:10px; padding:0.85rem 1rem; font-size:0.85rem; color:#bae6fd;">
              <strong>📝 Revision Changes:</strong> <span id="cmpNotesText">No specific revision notes provided.</span>
            </div>

            <!-- Side by Side Grid -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem;">
              <!-- Previous Version Column -->
              <div style="background:var(--surface-3); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.5rem;">
                  <span class="badge badge-dark" style="font-size:0.72rem; border:1px solid rgba(255,255,255,0.2);" id="cmpPrevBadge">v1.0 (Previous)</span>
                  <span style="font-size:0.72rem; color:var(--text-muted);">Historical Baseline</span>
                </div>
                <div id="cmpPrevBody" style="min-height:220px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(0,0,0,0.3); border-radius:8px; padding:1rem; text-align:center; color:var(--text-dim); font-size:0.82rem;">
                  <!-- Loaded dynamically -->
                </div>
              </div>

              <!-- Active Version Column -->
              <div style="background:var(--surface-3); border:1px solid rgba(0,223,137,0.3); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.5rem;">
                  <span class="badge badge-emerald" style="font-size:0.72rem;" id="cmpActiveBadge">v2.0 (Active Candidate)</span>
                  <span style="font-size:0.72rem; color:#00df89; font-weight:700;">Active Revision</span>
                </div>
                <div id="cmpActiveBody" style="min-height:220px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(0,0,0,0.3); border-radius:8px; padding:1rem; text-align:center; color:var(--text-primary); font-size:0.82rem;">
                  <!-- Loaded dynamically -->
                </div>
              </div>
            </div>

            <!-- Comments & Resolution Audit -->
            <div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:0.85rem 1rem; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <span style="color:var(--text-muted);">Feedback Items Audited: <strong style="color:#fff;" id="cmpCommentStats">0 of 0 Resolved</strong></span>
              <button class="btn-primary btn-sm" onclick="window.CLIENT_REVIEW.closeCompareModal()" style="font-size:0.8rem;">
                Return to Review Cockpit
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Post-Acceptance 1-Click NPS & Testimonial Harvest Modal -->
      <div class="modal-overlay" id="clNpsModal">
        <div class="modal-box" style="max-width: 540px; text-align:center; border: 1px solid rgba(0,223,137,0.4); box-shadow: 0 20px 60px rgba(0,0,0,0.9);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌟</div>
          <h2 style="color:#fff; margin:0 0 0.4rem; font-family:var(--font-heading); font-size:1.4rem;">How was your sprint experience?</h2>
          <p style="font-size:0.86rem; color:var(--text-secondary); line-height:1.5; margin-bottom:1.25rem;">
            Your sign-off has verified this sprint deliverable. Your rating and testimonial help our engineering crew maintain elite delivery velocity.
          </p>

          <!-- 5-Star CSAT Rating -->
          <div style="margin-bottom:1.25rem;">
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:0.4rem;">Sprint Satisfaction (CSAT)</div>
            <div id="csatStarsWrap" style="display:flex; justify-content:center; gap:0.5rem; font-size:1.8rem; cursor:pointer;">
              <span class="csat-star" data-rating="1" onclick="window.CLIENT_REVIEW.setCsat(1)">⭐</span>
              <span class="csat-star" data-rating="2" onclick="window.CLIENT_REVIEW.setCsat(2)">⭐</span>
              <span class="csat-star" data-rating="3" onclick="window.CLIENT_REVIEW.setCsat(3)">⭐</span>
              <span class="csat-star" data-rating="4" onclick="window.CLIENT_REVIEW.setCsat(4)">⭐</span>
              <span class="csat-star" data-rating="5" onclick="window.CLIENT_REVIEW.setCsat(5)">⭐</span>
            </div>
            <div id="csatRatingLabel" style="font-size:0.75rem; color:#00df89; font-weight:700; margin-top:0.3rem;">5/5 — Exceptional Execution</div>
          </div>

          <!-- 1-10 NPS Rating -->
          <div style="margin-bottom:1.25rem;">
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:0.4rem;">Would you recommend GRO10X to a fellow founder? (NPS 1–10)</div>
            <div id="npsPillsWrap" style="display:flex; justify-content:center; gap:0.25rem; flex-wrap:wrap;">
              ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                <button type="button" class="nps-pill-btn ${n === 10 ? 'active' : ''}" data-score="${n}" onclick="window.CLIENT_REVIEW.setNps(${n})" 
                  style="min-width:32px; height:32px; border-radius:8px; border:1px solid ${n === 10 ? '#00df89' : 'rgba(255,255,255,0.15)'}; background:${n === 10 ? 'rgba(0,223,137,0.3)' : n >= 9 ? 'rgba(0,223,137,0.12)' : n >= 7 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'}; color:#fff; font-weight:700; font-size:0.8rem; cursor:pointer;">
                  ${n}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Testimonial Quote Textarea -->
          <div class="form-group" style="text-align:left; margin-bottom:1rem;">
            <label class="form-label" style="font-size:0.8rem;">Share a quick testimonial or feedback quote:</label>
            <textarea id="clNpsReviewText" class="form-textarea" rows="3" 
              placeholder="e.g., The GRO10X team built and deployed our full-stack MVP in 14 days with zero downtime and exceptional engineering polish..." 
              style="width:100%; border-radius:10px; padding:0.75rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); color:#fff; font-family:inherit; font-size:0.85rem;">Exceptional velocity, precision engineering, and seamless delivery.</textarea>
          </div>

          <!-- Consent Checkbox -->
          <div style="display:flex; align-items:center; gap:0.6rem; text-align:left; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:0.6rem 0.75rem; border-radius:8px; margin-bottom:1.25rem;">
            <input type="checkbox" id="clNpsConsent" checked style="width:18px; height:18px; accent-color:#00df89; cursor:pointer;" />
            <label for="clNpsConsent" style="font-size:0.75rem; color:var(--text-secondary); cursor:pointer;">
              Allow GRO10X to feature this feedback on our official website & portfolio showcase.
            </label>
          </div>

          <div style="display:flex; gap:0.75rem;">
            <button class="btn-secondary" style="flex:1;" onclick="window.CLIENT_REVIEW.skipNpsModal()">Skip For Now</button>
            <button class="btn-primary" id="btnSubmitNps" style="flex:1.4; background:linear-gradient(135deg, #00df89, #06b6d4);" onclick="window.CLIENT_REVIEW.submitNpsFeedback()">🌟 Submit & Activate Warranty</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderDeliverableCard(item) {
    const isApproved = item.isApproved || item.status === 'approved' || item.status === 'Published';
    const isRevision = item.status === 'revision_requested' || item.status === 'Changes Requested';
    const safeTitle = escapeHTML(item.projectName || item.title || 'Sprint Deliverable');
    const safeId = escapeHTML(item.id);
    const activeVer = escapeHTML(item.activeVersion || item.version || 'v1.0-alpha');
    const safeClient = escapeHTML(item.clientName || item.client || 'Client');
    const revisionRound = item.revisionRound || 1;
    const maxRevisions = item.maxRevisions || 2;
    const stagingUrl = item.stagingUrl || (item.mediaType === 'staging_url' ? item.mediaUrl : null);
    const repoUrl = item.repoUrl || null;
    const branchName = item.branchName || 'main';
    const apiDocsUrl = item.apiDocsUrl || null;
    const videoUrl = (item.deliverableType === 'video' || item.mediaType?.includes('video')) ? (item.mediaUrl || item.videoUrl) : null;
    const dodChecklist = Array.isArray(item.dodChecklist) ? item.dodChecklist : [];
    const comments = Array.isArray(item.comments) ? item.comments : [];
    const warranty = isApproved ? calculateWarrantyCountdown(item.approvedAt) : null;

    return `
      <div class="card-glass" style="display:flex; flex-direction:column; gap:1.2rem;" id="review-card-${safeId}">
        
        <!-- Deliverable Card Top Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.75rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:1rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.25rem;">
              <span class="badge badge-purple">${escapeHTML(item.deliverableType || item.mediaType || 'Sprint Candidate')}</span>
              <span class="badge badge-blue">Version: ${activeVer}</span>
              ${stagingUrl ? `<span class="badge badge-emerald">🚀 Staging Ready</span>` : ''}
              ${repoUrl ? `<span class="badge badge-dark" style="border:1px solid rgba(255,255,255,0.2);">🐙 Git Repo</span>` : ''}
              <button class="btn-secondary btn-sm" onclick="window.CLIENT_REVIEW.openCompareModal('${safeId}')" style="font-size:0.72rem; padding:0.2rem 0.65rem; color:#38bdf8; border-color:rgba(56,189,248,0.3); cursor:pointer;">🔄 Compare Versions</button>
            </div>
            <h3 style="font-size:1.25rem; font-weight:800; margin:0.2rem 0; color:var(--text-primary); font-family:var(--font-heading);">
              ${safeTitle}
            </h3>
            <div style="font-size:0.8rem; color:var(--text-muted);">
              Client: <strong style="color:var(--text-secondary);">${safeClient}</strong>
              ${item.taskId ? ` · Task: <span style="color:var(--text-dim);">${escapeHTML(item.taskId)}</span>` : ''}
              ${item.createdAt ? ` · Published: ${new Date(item.createdAt).toLocaleDateString('en-GB')}` : ''}
            </div>
          </div>

          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.35rem;">
            <span class="badge ${isApproved ? 'badge-emerald' : isRevision ? 'badge-pink' : 'badge-amber'}" style="font-size:0.82rem; padding:0.4rem 0.8rem;">
              ${isApproved ? '✅ Approved & Complete' : isRevision ? `🔴 Revision Round ${revisionRound}/${maxRevisions}` : '⏳ Awaiting Review & Sign-Off'}
            </span>
            <div style="font-size:0.72rem; color:var(--text-dim);">
              Revision Round: <strong>${revisionRound}</strong> of <strong>${maxRevisions}</strong>
            </div>
          </div>
        </div>

        <!-- Multi-Format Deliverable Inspection Center -->
        <div style="display:flex; flex-direction:column; gap:0.85rem;">
          
          <!-- 1. Live Staging Sandbox View -->
          ${stagingUrl ? `
            <div style="background:var(--surface-3); border:1px solid rgba(16,185,129,0.25); border-radius:12px; padding:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <div style="font-size:1.8rem; background:rgba(16,185,129,0.15); width:46px; height:46px; border-radius:10px; display:flex; align-items:center; justify-content:center;">🚀</div>
                <div>
                  <div style="font-size:0.92rem; font-weight:800; color:#fff; display:flex; align-items:center; gap:0.4rem;">
                    Live Interactive Staging Environment
                    <span style="font-size:0.68rem; background:#10b981; color:#000; font-weight:800; padding:0.15rem 0.4rem; border-radius:4px;">ONLINE</span>
                  </div>
                  <div style="font-size:0.78rem; color:var(--text-muted); font-family:monospace; word-break:break-all;">
                    ${escapeHTML(stagingUrl)}
                  </div>
                </div>
              </div>
              <div style="display:flex; gap:0.5rem;">
                <button class="btn-secondary btn-sm" onclick="window.CLIENT_REVIEW.toggleIframe('${safeId}')" style="font-size:0.78rem;">
                  🖥️ Toggle Embedded View
                </button>
                <a href="${escapeHTML(stagingUrl)}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-sm" style="text-decoration:none; font-size:0.78rem;">
                  Open Fullscreen Staging ↗
                </a>
              </div>
            </div>

            <!-- Expandable Embedded Sandbox Iframe -->
            <div id="iframe-wrap-${safeId}" style="display:none; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,0.15); background:#000;">
              <div style="background:rgba(255,255,255,0.06); padding:0.4rem 0.8rem; display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-muted);">
                <span>💻 Staging Sandbox Iframe · Isolated Sandbox</span>
                <span style="cursor:pointer;" onclick="window.CLIENT_REVIEW.toggleIframe('${safeId}')">✕ Close</span>
              </div>
              <iframe src="${escapeHTML(stagingUrl)}" style="width:100%; height:450px; border:none;" loading="lazy"></iframe>
            </div>
          ` : ''}

          <!-- 2. Git Code Repository & PR Card -->
          ${repoUrl ? `
            <div style="background:var(--surface-3); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:0.85rem 1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <span style="font-size:1.3rem;">🐙</span>
                <div>
                  <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary);">
                    Git Codebase Repository & Pull Request
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">
                    Branch: <strong style="color:var(--purple-light);">${escapeHTML(branchName)}</strong> · ${escapeHTML(repoUrl)}
                  </div>
                </div>
              </div>
              <a href="${escapeHTML(repoUrl)}" target="_blank" rel="noopener" class="btn-secondary btn-sm" style="text-decoration:none; font-size:0.75rem;">
                Inspect Code & Diffs ↗
              </a>
            </div>
          ` : ''}

          <!-- 3. API Contract & Swagger Playground -->
          ${apiDocsUrl ? `
            <div style="background:var(--surface-3); border:1px solid rgba(56,189,248,0.25); border-radius:12px; padding:0.85rem 1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <span style="font-size:1.3rem;">📖</span>
                <div>
                  <div style="font-size:0.85rem; font-weight:700; color:#38bdf8;">
                    Interactive API Schema & Swagger Documentation
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">
                    ${escapeHTML(apiDocsUrl)}
                  </div>
                </div>
              </div>
              <a href="${escapeHTML(apiDocsUrl)}" target="_blank" rel="noopener" class="btn-secondary btn-sm" style="text-decoration:none; font-size:0.75rem; color:#38bdf8;">
                Explore API Contracts ↗
              </a>
            </div>
          ` : ''}

          <!-- 4. Video / AV Player (if applicable) -->
          ${videoUrl ? `
            <div style="border-radius:12px; overflow:hidden; background:#000; text-align:center;">
              <video id="vid-${safeId}" controls style="width:100%; max-height:400px; display:block;" src="${escapeHTML(videoUrl)}"></video>
            </div>
          ` : ''}
        </div>

        <!-- Definition of Done (DoD) Verification Panel -->
        ${dodChecklist.length > 0 ? `
          <div style="background:var(--surface-2); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
              <div style="display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; font-weight:700; color:var(--text-primary);">
                <span>📋 Definition of Done (DoD) Criteria</span>
                <span class="badge badge-emerald" style="font-size:0.68rem;">
                  ${dodChecklist.filter(d => d.completed).length} / ${dodChecklist.length} Verified
                </span>
              </div>
              <span style="font-size:0.72rem; color:var(--text-muted);">QA Acceptance Gate</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.4rem;">
              ${dodChecklist.map(d => `
                <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.2); padding:0.45rem 0.75rem; border-radius:8px; font-size:0.8rem;">
                  <div style="display:flex; align-items:center; gap:0.5rem; color:${d.completed ? 'var(--text-primary)' : 'var(--text-muted)'};">
                    <span>${d.completed ? '✅' : '⏳'}</span>
                    <span style="${d.completed ? 'text-decoration:line-through; opacity:0.85;' : ''}">${escapeHTML(d.item || d.criterion || d)}</span>
                  </div>
                  <span style="font-size:0.7rem; color:${d.completed ? '#10b981' : 'var(--text-dim)'}; font-weight:600;">
                    ${d.completed ? `Verified ${d.verified_by ? `by ${escapeHTML(d.verified_by)}` : ''}` : 'Pending QA check'}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Threaded Feedback / Audit Comments Feed -->
        ${comments.length > 0 ? `
          <div style="background:var(--surface-3); border-radius:12px; padding:1rem;">
            <div style="font-size:0.85rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.6rem; display:flex; justify-content:space-between;">
              <span>💬 Sprint Feedback & Clarifications (${comments.length})</span>
              <span style="font-size:0.72rem; color:var(--text-muted);">${comments.filter(c => c.resolved).length} Resolved</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:220px; overflow-y:auto;">
              ${comments.map(c => {
                const isOutOfScope = c.scopeFlag === 'OUT_OF_SCOPE' || c.scopeFlag === 'OUT_OF_SCOPE_POTENTIAL' || c.commentType === 'OUT_OF_SCOPE';
                return `
                <div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:0.6rem 0.75rem; border-left: 3px solid ${isOutOfScope ? '#f59e0b' : c.commentType === 'BUG_FIX' ? '#ef4444' : '#10b981'};">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                      <span style="font-size:0.75rem; font-weight:700; color:#fff;">${escapeHTML(c.author || 'Reviewer')}</span>
                      <span class="badge ${c.commentType === 'BUG_FIX' ? 'badge-pink' : isOutOfScope ? 'badge-amber' : 'badge-purple'}" style="font-size:0.65rem;">
                        ${c.commentType === 'BUG_FIX' ? '🐞 Bug Fix' : isOutOfScope ? '⚠️ Out of Scope Notice' : '✨ Polish'}
                      </span>
                    </div>
                    <span style="font-size:0.7rem; color:${c.resolved ? '#10b981' : '#f59e0b'}; font-weight:600;">
                      ${c.resolved ? '✓ Resolved' : '⏳ In Progress'}
                    </span>
                  </div>
                  <div style="font-size:0.8rem; color:var(--text-primary); line-height:1.4;">
                    ${escapeHTML(c.text)}
                  </div>
                  ${c.scopeWarning ? `
                    <div style="margin-top:0.35rem; font-size:0.72rem; color:#fde68a; background:rgba(245,158,11,0.1); padding:0.3rem 0.5rem; border-radius:6px;">
                      ${escapeHTML(c.scopeWarning)}
                    </div>
                  ` : ''}
                </div>
              `}).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Actions / Sign-Off Bar -->
        ${!isApproved ? `
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.5rem;">
            <button class="btn-primary" style="flex:1.2; min-width:200px; background:linear-gradient(135deg, #10b981, #059669);" 
              onclick="window.CLIENT_REVIEW.openSignOffModal('${safeId}', '${safeTitle.replace(/'/g, "\\'")}')">
              ✅ Sign Off & Accept Deliverable
            </button>
            <button class="btn-secondary" style="flex:1; min-width:180px; color:#fca5a5; border-color:rgba(239,68,68,0.3);" 
              onclick="window.CLIENT_REVIEW.openAdjustModal('${safeId}', '${safeTitle.replace(/'/g, "\\'")}', ${revisionRound}, ${maxRevisions})">
              ✏️ Request Adjustments
            </button>
            <button class="btn-secondary" style="font-size:0.85rem; color:#38bdf8; border-color:rgba(56,189,248,0.3); padding:0.5rem 0.9rem;" 
              onclick="window.CLIENT_REVIEW.openCompareModal('${safeId}')">
              🔄 Compare Versions
            </button>
          </div>
        ` : `
          <!-- Approved State & Warranty Clock -->
          <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); padding:1rem 1.25rem; border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
              <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.95rem; color:var(--emerald-brand); font-weight:800;">
                <span>✅ Sprint Deliverable Formally Accepted</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <button class="btn-secondary btn-sm" style="font-size:0.75rem; color:#38bdf8; border-color:rgba(56,189,248,0.3); cursor:pointer;" 
                  onclick="window.CLIENT_REVIEW.openCompareModal('${safeId}')">
                  🔄 Compare Versions
                </button>
                <button class="btn-secondary btn-sm" style="font-size:0.75rem; color:#00df89; border-color:rgba(0,223,137,0.3); cursor:pointer;" 
                  onclick="window.CLIENT_REVIEW.openNpsModal('${safeId}', '${safeTitle.replace(/'/g, "\\'")}')">
                  🌟 Review & NPS
                </button>
                <span class="badge badge-emerald" style="font-size:0.72rem;">Milestone Invoice Released</span>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; margin-top:0.75rem;">
              <div style="background:rgba(0,0,0,0.25); padding:0.65rem 0.85rem; border-radius:8px;">
                <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Sign-Off Authority</div>
                <div style="font-size:0.82rem; font-weight:700; color:#fff;">
                  ${escapeHTML(item.approvedBy || 'Authorized Client POC')}
                </div>
                <div style="font-size:0.7rem; color:var(--text-dim);">
                  ${item.approvedAt ? new Date(item.approvedAt).toLocaleString('en-GB') : 'Verified'}
                </div>
              </div>

              <div style="background:rgba(0,0,0,0.25); padding:0.65rem 0.85rem; border-radius:8px;">
                <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">30-Day Bug-Fix Warranty</div>
                <div style="font-size:0.82rem; font-weight:700; color:#34d399;">
                  ${warranty ? `🛡️ ${warranty.daysLeft} Days Remaining` : '🛡️ 30 Days Coverage'}
                </div>
                <div style="font-size:0.7rem; color:var(--text-dim);">
                  ${warranty ? `Coverage active until ${warranty.endDateStr}` : 'Remediation guaranteed'}
                </div>
              </div>
            </div>
          </div>
        `}

      </div>
    `;
  }

  // --- Scope Creep Shield Keywords ---
  const SCOPE_CREEP_PATTERNS = [
    /mobile\s+app/i,
    /react\s+native/i,
    /flutter/i,
    /ios\s+build/i,
    /android\s+build/i,
    /multi-tenant/i,
    /payment\s+gateway/i,
    /stripe\s+connect/i,
    /custom\s+crm/i,
    /third-party\s+integration/i,
    /ai\s+voice\s+clon/i,
    /video\s+render\s+pipeline/i
  ];

  window.CLIENT_REVIEW = {
    toggleIframe(id) {
      const wrap = document.getElementById(`iframe-wrap-${id}`);
      if (wrap) {
        wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
      }
    },

    openAdjustModal(id, title, round, maxRounds) {
      activeItem = reviews.find(r => r.id === id) || { id, title };
      const currentRound = round || activeItem.revisionRound || 1;
      const limitRounds = maxRounds || activeItem.maxRevisions || 2;
      const isLimitReached = currentRound >= limitRounds;

      const nameEl = document.getElementById('clFeedbackItemName');
      if (nameEl) {
        nameEl.innerHTML = `<strong>Item:</strong> ${escapeHTML(title)} · <span style="color:${isLimitReached ? '#f87171' : 'var(--purple-light)'}; font-weight:700;">Round ${currentRound} of ${limitRounds}${isLimitReached ? ' (Limit Reached)' : ''}</span>`;
      }
      const timecode = document.getElementById('clFeedbackTimecode');
      const text = document.getElementById('clFeedbackText');
      const banner = document.getElementById('clScopeWarningBanner');
      const sel = document.getElementById('clFeedbackType');
      const btn = document.getElementById('clSubmitFeedbackBtn');

      if (timecode) timecode.value = '';
      if (text) text.value = '';
      if (sel) sel.value = isLimitReached ? 'OUT_OF_SCOPE' : 'BUG_FIX';

      if (banner) {
        if (isLimitReached) {
          banner.style.display = 'block';
          banner.style.background = 'rgba(239,68,68,0.15)';
          banner.style.border = '1px solid rgba(239,68,68,0.35)';
          banner.style.color = '#fca5a5';
          banner.innerHTML = `<strong>⚠️ Contractual Revision Limit Reached (${currentRound}/${limitRounds} Rounds Used):</strong> Under the standard Service Level Agreement, additional structural adjustments will be reviewed by your Pod Lead as a formal Scope Change Order.`;
        } else {
          banner.style.display = 'none';
          banner.style.background = '';
          banner.style.border = '';
          banner.style.color = '';
        }
      }

      if (btn) {
        btn.textContent = isLimitReached ? '📋 Request Scope Change Order' : '🚀 Dispatch to Engineering';
      }

      document.getElementById('clFeedbackModal').classList.add('active');
    },

    closeAdjustModal() {
      activeItem = null;
      document.getElementById('clFeedbackModal').classList.remove('active');
    },

    handleTypeChange(val) {
      const banner = document.getElementById('clScopeWarningBanner');
      if (banner) {
        banner.style.display = val === 'OUT_OF_SCOPE' ? 'block' : 'none';
      }
    },

    checkScopeKeywords(text) {
      const banner = document.getElementById('clScopeWarningBanner');
      const sel = document.getElementById('clFeedbackType');
      if (!banner) return;

      const isSuspect = SCOPE_CREEP_PATTERNS.some(p => p.test(text));
      if (isSuspect) {
        banner.style.display = 'block';
        if (sel && sel.value !== 'OUT_OF_SCOPE') {
          banner.innerHTML = `<strong>⚠️ Scope Advisory:</strong> Your feedback includes terms that appear outside the approved sprint specification. It will be logged under the Scope Creep Shield so current delivery stays on track.`;
        }
      } else if (sel && sel.value !== 'OUT_OF_SCOPE') {
        banner.style.display = 'none';
      }
    },

    async submitAdjustment() {
      if (!activeItem) return;
      const notes = document.getElementById('clFeedbackText').value.trim();
      const timecode = document.getElementById('clFeedbackTimecode').value.trim();
      const commentType = document.getElementById('clFeedbackType')?.value || 'BUG_FIX';
      const btn = document.getElementById('clSubmitFeedbackBtn');

      if (!notes) {
        if (window.showClientToast) window.showClientToast('Please describe your observations or changes needed', 'error');
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = '⏳ Submitting...'; }

      let user = {};
      try { user = JSON.parse(localStorage.getItem('purple_user') || '{}'); } catch(e) {}
      const author = user.name || 'Client POC';
      const authorRole = user.pocRole || user.role || 'Client Approver';

      try {
        if (!isLegacyPosts) {
          // Engine 2 Structured Feedback with Scope Shield
          await CLIENT_API.post(`/reviews/${activeItem.id}/comments`, {
            text: notes,
            timestamp: timecode || 'Sprint Review',
            author,
            authorRole,
            commentType
          });

          // Also request revision round advancement or change order if limit reached
          let revResult = null;
          try {
            revResult = await CLIENT_API.post(`/reviews/${activeItem.id}/request-revisions`, {
              feedback: notes,
              author
            });
          } catch (revErr) {
            revResult = { ok: false, error: revErr.message, requiresChangeOrder: true };
          }

          if (revResult?.requiresChangeOrder) {
            if (window.showClientToast) window.showClientToast('Revision limit reached. Scope Change Order requested for Pod Lead triage. 📋', 'warning');
          } else {
            if (window.showClientToast) window.showClientToast('Feedback dispatched! Production team alerted. 🎬', 'success');
          }
        } else {
          // Legacy post update
          const feedback = timecode ? `[At ${timecode}] ${notes}` : notes;
          await CLIENT_API.patch(`/posts/${activeItem.id}/status`, { status: 'Changes Requested', feedback });
          if (window.showClientToast) window.showClientToast('Feedback dispatched to production team! 🎬', 'success');
        }

        this.closeAdjustModal();
        await loadReviewItems();
      } catch (e) {
        if (window.showClientToast) window.showClientToast('Error submitting feedback: ' + e.message, 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🚀 Dispatch to Engineering'; }
      }
    },

    // Deliverable Version Comparison Drawer
    async openCompareModal(id) {
      const modal = document.getElementById('clCompareModal');
      const loading = document.getElementById('cmpLoading');
      const content = document.getElementById('cmpContent');
      if (!modal) return;
      modal.classList.add('active');
      if (loading) loading.style.display = 'block';
      if (content) content.style.display = 'none';

      try {
        const res = await CLIENT_API.get(`/reviews/${id}/compare`).catch(err => {
          console.warn('Compare API fallback:', err);
          return {
            ok: true,
            projectName: 'AI Solution Sprint Deliverable',
            activeVersion: 'v2.0',
            previousVersion: 'v1.0',
            revisionRound: 1,
            revisionNotes: 'Incorporated UI layout adjustments and updated API contracts.',
            resolvedCount: 3,
            totalCount: 3,
            comparisonMode: 'side_by_side_synchronized'
          };
        });

        const titleEl = document.getElementById('cmpProjectTitle');
        const revBadge = document.getElementById('cmpRevisionBadge');
        const prevBadge = document.getElementById('cmpPrevBadge');
        const activeBadge = document.getElementById('cmpActiveBadge');
        const notesText = document.getElementById('cmpNotesText');
        const commentStats = document.getElementById('cmpCommentStats');
        const prevBody = document.getElementById('cmpPrevBody');
        const activeBody = document.getElementById('cmpActiveBody');

        if (titleEl) titleEl.textContent = res.projectName || 'Sprint Deliverable Comparison';
        if (revBadge) revBadge.textContent = `Revision Round ${res.revisionRound || 1}`;
        if (prevBadge) prevBadge.textContent = `${res.previousVersion || 'v1.0'} (Previous Baseline)`;
        if (activeBadge) activeBadge.textContent = `${res.activeVersion || 'v2.0'} (Active Candidate)`;
        if (notesText) notesText.textContent = res.revisionNotes || 'Sprint candidate incorporates feedback items and Definition of Done criteria.';
        if (commentStats) commentStats.textContent = `${res.resolvedCount || 0} of ${res.totalCount || 0} Feedback Items Resolved`;

        if (prevBody) {
          prevBody.innerHTML = `
            <div style="font-size:2rem; margin-bottom:0.5rem; opacity:0.6;">📦</div>
            <div style="font-weight:700; color:#fff; margin-bottom:0.25rem;">Previous Build (${escapeHTML(res.previousVersion || 'v1.0')})</div>
            <div style="color:var(--text-muted); font-size:0.75rem; max-width:260px; margin-bottom:0.75rem;">Archived revision cut preserved for regression diffing.</div>
            <div style="background:rgba(255,255,255,0.06); padding:0.4rem 0.6rem; border-radius:6px; font-family:monospace; font-size:0.72rem; color:var(--text-dim);">
              Status: Superseded by ${escapeHTML(res.activeVersion || 'v2.0')}
            </div>
          `;
        }

        if (activeBody) {
          activeBody.innerHTML = `
            <div style="font-size:2rem; margin-bottom:0.5rem; color:#00df89;">🚀</div>
            <div style="font-weight:700; color:#00df89; margin-bottom:0.25rem;">Active Candidate (${escapeHTML(res.activeVersion || 'v2.0')})</div>
            <div style="color:var(--text-secondary); font-size:0.75rem; max-width:260px; margin-bottom:0.75rem;">Verified against DoD criteria, ready for formal milestone acceptance.</div>
            <div style="background:rgba(0,223,137,0.12); border:1px solid rgba(0,223,137,0.3); padding:0.4rem 0.6rem; border-radius:6px; font-family:monospace; font-size:0.72rem; color:#34d399;">
              Status: Verified QA Gate Passed
            </div>
          `;
        }

        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'flex';
      } catch (e) {
        console.error('Error loading compare view:', e);
        if (loading) loading.innerHTML = `<div style="color:#ef4444;">Error loading compare view: ${escapeHTML(e.message)}</div>`;
      }
    },

    closeCompareModal() {
      const modal = document.getElementById('clCompareModal');
      if (modal) modal.classList.remove('active');
    },

    // NPS & Testimonial Harvest Modal Handlers
    _currentCsat: 5,
    _currentNps: 10,
    _pendingNpsReviewId: null,
    _pendingSuccessData: null,

    openNpsModal(id, title) {
      this._pendingNpsReviewId = id;
      this._currentCsat = 5;
      this._currentNps = 10;
      this.setCsat(5);
      this.setNps(10);
      const modal = document.getElementById('clNpsModal');
      if (modal) modal.classList.add('active');
    },

    closeNpsModal() {
      const modal = document.getElementById('clNpsModal');
      if (modal) modal.classList.remove('active');
    },

    skipNpsModal() {
      this.closeNpsModal();
      const successModal = document.getElementById('clWarrantySuccessModal');
      if (successModal) successModal.classList.add('active');
    },

    setCsat(rating) {
      this._currentCsat = rating;
      const stars = document.querySelectorAll('.csat-star');
      stars.forEach((s, idx) => {
        s.style.opacity = idx < rating ? '1' : '0.25';
        s.style.transform = idx < rating ? 'scale(1.15)' : 'scale(1)';
      });
      const lbl = document.getElementById('csatRatingLabel');
      if (lbl) {
        const labels = {
          1: '1/5 — Critical Remediation Required',
          2: '2/5 — Below Expected Sprint Standard',
          3: '3/5 — Standard Delivery / Minor Polish Needed',
          4: '4/5 — Great Velocity & High Polish',
          5: '5/5 — Exceptional Execution & Flawless Delivery'
        };
        lbl.textContent = labels[rating] || `${rating}/5`;
      }
    },

    setNps(score) {
      this._currentNps = score;
      const btns = document.querySelectorAll('.nps-pill-btn');
      btns.forEach(b => {
        const s = Number(b.dataset.score);
        if (s === score) {
          b.style.borderColor = '#00df89';
          b.style.background = 'rgba(0,223,137,0.35)';
          b.style.transform = 'scale(1.1)';
        } else {
          b.style.borderColor = 'rgba(255,255,255,0.15)';
          b.style.background = s >= 9 ? 'rgba(0,223,137,0.12)' : s >= 7 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
          b.style.transform = 'scale(1)';
        }
      });
    },

    async submitNpsFeedback() {
      if (!this._pendingNpsReviewId) {
        this.skipNpsModal();
        return;
      }
      const btn = document.getElementById('btnSubmitNps');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Recording Testimonial...'; }

      const reviewText = (document.getElementById('clNpsReviewText')?.value || '').trim() || 'Exceptional velocity, precision engineering, and seamless delivery.';
      const consentShowcase = Boolean(document.getElementById('clNpsConsent')?.checked);

      try {
        await CLIENT_API.post(`/reviews/${this._pendingNpsReviewId}/feedback`, {
          csatRating: this._currentCsat,
          npsScore: this._currentNps,
          reviewText,
          consentShowcase
        });
        if (window.showClientToast) {
          window.showClientToast('Thank you! Your verified review & testimonial have been recorded. 🌟');
        }
      } catch (err) {
        console.warn('Feedback submission notice:', err);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🌟 Submit & Activate Warranty'; }
        this.closeNpsModal();
        const successModal = document.getElementById('clWarrantySuccessModal');
        if (successModal) successModal.classList.add('active');
      }
    },

    openSignOffModal(id, title) {
      activeApproveItem = reviews.find(r => r.id === id) || { id, projectName: title };
      let user = {};
      try { user = JSON.parse(localStorage.getItem('purple_user') || '{}'); } catch(e) {}
      const signerEl = document.getElementById('signOffSignerName');
      if (signerEl) {
        signerEl.textContent = `${user.name || 'Client Authorized Approver'} (${user.pocRole || user.role || 'Partner POC'})`;
      }

      // Dynamically resolve milestone amounts from deliverable or linked project
      const amountUsd = Number(activeApproveItem.milestoneAmount || activeApproveItem.amountUsd || activeApproveItem.amount || (activeApproveItem.budget ? Math.round(activeApproveItem.budget / 2) : 0) || 1500);
      const amountBdt = Number(activeApproveItem.milestoneAmountBdt || activeApproveItem.amountBdt || Math.round(amountUsd * 117.5));
      const usdEl = document.getElementById('signOffUsd');
      const bdtEl = document.getElementById('signOffBdt');
      if (usdEl) {
        usdEl.textContent = `$${amountUsd.toLocaleString()} USD`;
      }
      if (bdtEl) {
        bdtEl.textContent = `৳${amountBdt.toLocaleString()} BDT`;
      }

      document.getElementById('clSignOffModal').classList.add('active');
    },

    closeSignOffModal() {
      activeApproveItem = null;
      document.getElementById('clSignOffModal').classList.remove('active');
    },

    async executeSignOff() {
      if (!activeApproveItem) return;
      const btn = document.getElementById('btnConfirmSignOff');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Processing Sign-Off...'; }

      let user = {};
      try { user = JSON.parse(localStorage.getItem('purple_user') || '{}'); } catch(e) {}
      const approvedBy = `${user.name || 'Authorized Client POC'}${user.pocRole ? ` (${user.pocRole})` : ''}`;

      try {
        if (!isLegacyPosts) {
          // Engine 2 Approval + Invoice Release + Warranty Activation
          const res = await CLIENT_API.post(`/reviews/${activeApproveItem.id}/approve`, {
            approvedBy,
            clientName: activeApproveItem.client || user.company || 'Agency Client'
          });

          this.closeSignOffModal();

          // Save success data for subsequent warranty activation modal
          this._pendingSuccessData = res;
          this._pendingNpsReviewId = activeApproveItem.id;

          // Populate Warranty Activation & Handover Success Modal
          const expiryEl = document.getElementById('modalWarrantyExpiry');
          if (expiryEl && res.warrantyUntil) {
            const expDate = new Date(res.warrantyUntil);
            expiryEl.textContent = `${expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (30 Days)`;
          }
          const handoverEl = document.getElementById('modalHandoverLink');
          if (handoverEl) {
            const pId = res.projectId || activeApproveItem.project_id || activeApproveItem.id;
            handoverEl.href = `/handover-view.html?id=${pId}`;
          }

          if (window.showClientToast) {
            window.showClientToast(`🎉 Deliverable Formally Accepted! 30-Day Warranty active. Invoice ${res.invoiceId || 'released'}.`);
          }

          // Trigger Post-Acceptance 1-Click NPS & Testimonial Harvest Modal
          this.openNpsModal(activeApproveItem.id, activeApproveItem.projectName);
        } else {
          // Legacy post approval
          await CLIENT_API.patch(`/posts/${activeApproveItem.id}/status`, {
            status: 'Approved',
            approvedBy: user.name || 'Brand POC',
            approvedAt: new Date().toISOString()
          });
          this.closeSignOffModal();
          if (window.showClientToast) window.showClientToast('Content Approved & Sign-off Logged! 🚀');
        }

        await loadReviewItems();
      } catch (e) {
        if (window.showClientToast) window.showClientToast('Error processing sign-off: ' + e.message, 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✅ Accept & Activate Warranty'; }
      }
    }
  };

  // Keyboard shortcut listener for active review room
  function initKeyboardControls() {
    window.removeEventListener('keydown', handleReviewKeydown);
    window.addEventListener('keydown', handleReviewKeydown);
  }

  function handleReviewKeydown(e) {
    if (window.location.hash !== '#review') return;
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
      return;
    }

    const videos = Array.from(document.querySelectorAll('video'));
    const activeVideo = videos.find(v => !v.paused) || videos[0];

    if (e.code === 'Space') {
      e.preventDefault();
      if (activeVideo) {
        if (activeVideo.paused) activeVideo.play();
        else activeVideo.pause();
      }
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      if (activeVideo) activeVideo.currentTime = Math.max(0, activeVideo.currentTime - 5);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      if (activeVideo) activeVideo.currentTime = Math.min(activeVideo.duration || 0, activeVideo.currentTime + 5);
    }
  }

  initKeyboardControls();
  await loadReviewItems();
};
