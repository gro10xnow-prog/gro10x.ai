/**
 * public/client/modules/brief.js
 * 3-Step Campaign Briefing Wizard
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};

window.CLIENT_MODULES.brief = async function(container) {
  let isSubmitting = false;
  let currentStep = 1;

  function renderWizard() {
    container.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h1 style="font-size: 1.55rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.35rem;">
          📝 Campaign Briefing Studio
        </h1>
        <div style="font-size: 0.88rem; color: var(--text-muted);">
          Structure new campaign briefs, allocate retainer quotas, and trigger agency production kickoff.
        </div>
      </div>

      <!-- Step Indicator Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; max-width:800px; margin:0 auto 1.5rem; position:relative;">
        <div style="position:absolute; top:50%; left:10%; right:10%; height:2px; background:var(--surface-3); z-index:1; transform:translateY(-50%);"></div>
        
        <div style="position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:0.3rem;">
          <div style="width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; background:${currentStep >= 1 ? 'var(--purple-brand)' : 'var(--surface-3)'}; color:#fff; border:2px solid ${currentStep === 1 ? 'var(--pink-brand)' : 'transparent'};">
            1
          </div>
          <span style="font-size:0.75rem; font-weight:700; color:${currentStep === 1 ? '#fff' : 'var(--text-muted)'};">Scope & Goals</span>
        </div>

        <div style="position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:0.3rem;">
          <div style="width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; background:${currentStep >= 2 ? 'var(--purple-brand)' : 'var(--surface-3)'}; color:#fff; border:2px solid ${currentStep === 2 ? 'var(--pink-brand)' : 'transparent'};">
            2
          </div>
          <span style="font-size:0.75rem; font-weight:700; color:${currentStep === 2 ? '#fff' : 'var(--text-muted)'};">Deliverables</span>
        </div>

        <div style="position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:0.3rem;">
          <div style="width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; background:${currentStep >= 3 ? 'var(--purple-brand)' : 'var(--surface-3)'}; color:#fff; border:2px solid ${currentStep === 3 ? 'var(--pink-brand)' : 'transparent'};">
            3
          </div>
          <span style="font-size:0.75rem; font-weight:700; color:${currentStep === 3 ? '#fff' : 'var(--text-muted)'};">Assets & Launch</span>
        </div>
      </div>

      <div class="card-glass" style="max-width: 800px; margin: 0 auto; padding:1.75rem;">
        <form id="campaignBriefForm" onsubmit="window.CLIENT_BRIEF.submitBrief(event)">
          
          <!-- STEP 1: Campaign Scope & Goals -->
          <div id="briefStep1" style="display:${currentStep === 1 ? 'block' : 'none'};">
            <div style="font-size:1.1rem; font-weight:800; font-family:var(--font-heading); margin-bottom:1rem; color:var(--text-primary);">
              Step 1: Campaign Scope & Objectives
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:700; color:#fff;">Campaign / Project Title *</label>
              <input type="text" id="briefTitle" class="form-input" placeholder="e.g. Eid Mega Collection Launch / Summer Refresh Commercial" required>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:1rem;">
              <div class="form-group">
                <label class="form-label">Primary Objective *</label>
                <select id="briefObjective" class="form-select" required>
                  <option value="Brand Awareness & Commercial Reach">🎯 Brand Awareness & Commercial Reach</option>
                  <option value="Product Launch / Seasonal Campaign">🚀 Product Launch / Seasonal Campaign</option>
                  <option value="Performance & Conversion Marketing">📈 Performance & Conversion Marketing</option>
                  <option value="Social Retainer Content Refresh">📱 Monthly Social Retainer Content</option>
                  <option value="TVC / High-Production Commercial">🎬 TVC & Video Commercial Production</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Target Launch / Delivery Date</label>
                <input type="date" id="briefTimeline" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Target Audience & Brand Tone</label>
              <input type="text" id="briefAudience" class="form-input" placeholder="e.g. Gen-Z foodies (18-28), urban Dhaka & Chittagong, energetic & cinematic tone">
            </div>

            <div style="display:flex; justify-content:flex-end; margin-top:1.5rem;">
              <button type="button" class="btn-primary" onclick="window.CLIENT_BRIEF.goToStep(2)">
                Continue to Deliverables →
              </button>
            </div>
          </div>

          <!-- STEP 2: Deliverable Selection & Retainer Allocation -->
          <div id="briefStep2" style="display:${currentStep === 2 ? 'block' : 'none'};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
              <div style="font-size:1.1rem; font-weight:800; font-family:var(--font-heading); color:var(--text-primary);">
                Step 2: Deliverables & Retainer Quota
              </div>
              <div style="background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); color:#34d399; font-size:0.75rem; font-weight:700; padding:0.3rem 0.6rem; border-radius:20px;">
                ⚡ Retainer Scope: Active
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Select Required Deliverables:</label>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; margin-top:0.3rem;">
                <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.85rem; color:var(--text-secondary); cursor:pointer; background:var(--surface-3); padding:0.75rem; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                  <input type="checkbox" name="briefDeliv" value="Short-form Reels / TikTok (9:16)" checked> 📱 Reels / TikTok (9:16)
                </label>
                <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.85rem; color:var(--text-secondary); cursor:pointer; background:var(--surface-3); padding:0.75rem; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                  <input type="checkbox" name="briefDeliv" value="Static Social Graphics (1:1 / 4:5)"> 🎨 Static Social Graphics
                </label>
                <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.85rem; color:var(--text-secondary); cursor:pointer; background:var(--surface-3); padding:0.75rem; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                  <input type="checkbox" name="briefDeliv" value="Commercial TVC / Master Cut"> 🎬 Master TVC Commercial Cut
                </label>
                <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.85rem; color:var(--text-secondary); cursor:pointer; background:var(--surface-3); padding:0.75rem; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                  <input type="checkbox" name="briefDeliv" value="Product Photography / Lookbook"> 📸 Product Shoot & Stills
                </label>
                <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.85rem; color:var(--text-secondary); cursor:pointer; background:var(--surface-3); padding:0.75rem; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                  <input type="checkbox" name="briefDeliv" value="Motion Graphics / 3D VFX"> ✨ Motion Graphics & 3D
                </label>
                <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.85rem; color:var(--text-secondary); cursor:pointer; background:var(--surface-3); padding:0.75rem; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                  <input type="checkbox" name="briefDeliv" value="Copywriting & Hook Concepts"> ✍️ Copywriting & Hook Strategy
                </label>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; margin-top:1.5rem;">
              <button type="button" class="btn-secondary" onclick="window.CLIENT_BRIEF.goToStep(1)">
                ← Back
              </button>
              <button type="button" class="btn-primary" onclick="window.CLIENT_BRIEF.goToStep(3)">
                Continue to Creative Direction →
              </button>
            </div>
          </div>

          <!-- STEP 3: Creative Direction & Submission -->
          <div id="briefStep3" style="display:${currentStep === 3 ? 'block' : 'none'};">
            <div style="font-size:1.1rem; font-weight:800; font-family:var(--font-heading); margin-bottom:1rem; color:var(--text-primary);">
              Step 3: Creative Direction & Reference Assets
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:700; color:#fff;">Campaign Scope, Key Hook & Description *</label>
              <textarea id="briefDescription" class="form-input" rows="4" placeholder="Detail the campaign narrative, key product highlights, mandatory hashtags, and specific call-to-actions..." required></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Reference Drive / Figma / Moodboard Link (Optional)</label>
              <input type="url" id="briefAssetsUrl" class="form-input" placeholder="https://drive.google.com/... or https://figma.com/...">
            </div>

            <div style="background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.25); border-radius: 12px; padding: 0.85rem; margin-top: 1rem; font-size: 0.82rem; color: var(--text-secondary);">
              ⚡ <strong>Production Kickoff SLA:</strong> Your dedicated Account Manager will review this brief, allocate production specialists, and schedule the kickoff review within <strong>4 business hours</strong>.
            </div>

            <div style="display:flex; justify-content:space-between; margin-top:1.5rem;">
              <button type="button" class="btn-secondary" onclick="window.CLIENT_BRIEF.goToStep(2)">
                ← Back
              </button>
              <button type="submit" id="btnSubmitBrief" class="btn-primary" style="box-shadow: 0 4px 20px rgba(236,72,153,0.4);">
                🚀 Submit Campaign Brief to Production Team
              </button>
            </div>
          </div>

        </form>
      </div>
    `;
  }

  window.CLIENT_BRIEF = {
    goToStep(step) {
      if (step === 2) {
        const title = document.getElementById('briefTitle')?.value?.trim();
        if (!title) {
          if (window.showClientToast) window.showClientToast('Please enter a Campaign Title to proceed', 'error');
          else alert('Please enter a Campaign Title');
          return;
        }
      }
      currentStep = step;
      renderWizard();
    },

    async submitBrief(e) {
      e.preventDefault();
      if (isSubmitting) return;

      const title = document.getElementById('briefTitle')?.value?.trim();
      const objective = document.getElementById('briefObjective')?.value;
      const timeline = document.getElementById('briefTimeline')?.value;
      const audience = document.getElementById('briefAudience')?.value?.trim();
      const description = document.getElementById('briefDescription')?.value?.trim();
      const assetsUrl = document.getElementById('briefAssetsUrl')?.value?.trim();

      const selectedDelivs = Array.from(document.querySelectorAll('input[name="briefDeliv"]:checked'))
        .map(cb => cb.value);

      if (!title || !description) {
        if (window.showClientToast) window.showClientToast('Please fill in required fields (*)', 'error');
        else alert('Please fill in required fields');
        return;
      }

      isSubmitting = true;
      const submitBtn = document.getElementById('btnSubmitBrief');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = '⏳ Submitting Campaign Brief...';
      }

      const formattedDescription = `📌 Objective: ${objective}\n` +
        (timeline ? `📅 Target Delivery: ${timeline}\n` : '') +
        (selectedDelivs.length ? `🎬 Deliverables: ${selectedDelivs.join(', ')}\n` : '') +
        (audience ? `👥 Target Audience: ${audience}\n` : '') +
        (assetsUrl ? `🔗 Assets / References: ${assetsUrl}\n` : '') +
        `\n📝 Campaign Scope & Notes:\n${description}`;

      try {
        const res = await CLIENT_API.post('/tickets', {
          category: 'Campaign Scope',
          title: `[Campaign Brief] ${title}`,
          priority: 'High',
          description: formattedDescription
        });

        if (res.success || res.ticket) {
          if (window.showClientToast) {
            window.showClientToast('Campaign Brief submitted successfully! 🚀 Assigned to your AM.');
          } else {
            alert('Campaign Brief submitted! Your AM will contact you.');
          }
          window.location.hash = '#tickets';
        } else {
          throw new Error(res.error || 'Failed to submit brief');
        }
      } catch (err) {
        if (window.showClientToast) window.showClientToast('Submission error: ' + err.message, 'error');
        else alert('Error submitting brief: ' + err.message);
      } finally {
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = '🚀 Submit Campaign Brief to Production Team';
        }
      }
    }
  };

  renderWizard();
};
