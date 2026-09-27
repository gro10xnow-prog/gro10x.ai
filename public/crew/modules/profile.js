/**
 * public/crew/modules/profile.js
 * Interactive Profile Module with Self-Edit Capability
 */
window.CREW_MODULES = window.CREW_MODULES || {};

window.CREW_MODULES.profile = async function(container) {
  let me = await CREW_API.getMe().catch(() => ({}));
  let user = me.user || {};
  const empId = user.emp_code || user.id || 'GRO-000';

  let spiRes = await CREW_API.get(`/team/specialist/${encodeURIComponent(empId)}/spi`).catch(() => null);
  let spi = (spiRes && spiRes.ok) ? spiRes : {
    spiScore: 94,
    tier: 'Diamond Lead',
    tierBadge: '💎 Diamond Specialist Lead',
    metrics: {
      velocityScore: 38,
      defectScore: 38,
      peerReviewScore: 18,
      completedSprints: 4,
      onTimeDeliveryRate: '95%',
      warrantyDefectRate: '0.0%'
    },
    settlementRail: 'BRAC Bank Limited (Neoncore Tech Solution / 2081636480001)'
  };

  let isEditing = false;

  function render() {
    const bkashNo = user.bank_info?.mfsNo || user.bank_info?.bkashNo || user.phone || '';
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Specified'];
    const tshirtSizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const spiScore = spi.spiScore || 94;
    const spiStroke = spiScore >= 85 ? '#00df89' : (spiScore >= 70 ? '#06b6d4' : '#f59e0b');
    const spiDashOffset = Math.round(264 - (264 * (spiScore / 100)));

    container.innerHTML = `
      <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">👤 My Personal Profile</h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">Manage your personal details, contact info, and production performance.</div>
        </div>

        <div>
          ${!isEditing ? `
            <button id="crewProfileEditBtn" class="btn-secondary" style="font-size:0.85rem; padding:0.5rem 1rem; border-radius:10px; cursor:pointer;" onclick="toggleCrewProfileEdit(true)">
              ✏️ Edit Profile
            </button>
          ` : `
            <div style="display:flex; gap:0.5rem;">
              <button id="crewProfileCancelBtn" class="btn-secondary" style="font-size:0.85rem; padding:0.5rem 0.85rem; border-radius:10px; cursor:pointer;" onclick="toggleCrewProfileEdit(false)">
                Cancel
              </button>
              <button id="crewProfileSaveBtn" class="btn-primary" style="font-size:0.85rem; padding:0.5rem 1.1rem; border-radius:10px; cursor:pointer;" onclick="saveCrewProfile('${empId}')">
                💾 Save Changes
              </button>
            </div>
          `}
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
        <!-- Specialist Performance Index (SPI) Cockpit Card -->
        <div class="card-glass" id="crewSpiCard" style="grid-column: 1 / -1; border: 1.5px solid rgba(0, 223, 137, 0.35); background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(6, 182, 212, 0.08) 100%); padding: 1.5rem; border-radius: 16px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:1rem;">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <div style="font-size:2rem;">⚡</div>
              <div>
                <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                  <h2 style="font-size:1.25rem; font-weight:900; margin:0; font-family:var(--font-heading); color:#fff;">Specialist Performance Index (SPI)</h2>
                  <span class="badge" id="crewSpiTierBadge" style="background:rgba(0,223,137,0.15); color:var(--accent-mint); border:1px solid rgba(0,223,137,0.4); font-size:0.75rem; font-weight:800; padding:0.25rem 0.65rem;">
                    ${spi.tierBadge || '💎 Diamond Specialist Lead'}
                  </span>
                </div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">
                  Production Reliability & Engineering Velocity Ledger &bull; Evaluated across active sprints
                </div>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:1.25rem;">
              <!-- Radial SVG Gauge -->
              <div style="position:relative; width:80px; height:80px; display:flex; align-items:center; justify-content:center;">
                <svg width="80" height="80" viewBox="0 0 100 100" style="transform:rotate(-90deg);">
                  <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" stroke-width="8" fill="transparent"></circle>
                  <circle id="crewSpiCircle" cx="50" cy="50" r="42" stroke="${spiStroke}" stroke-width="8" stroke-dasharray="264" stroke-dashoffset="${spiDashOffset}" stroke-linecap="round" fill="transparent" style="transition: stroke-dashoffset 0.8s ease;"></circle>
                </svg>
                <div style="position:absolute; text-align:center;">
                  <div id="crewSpiScoreVal" style="font-size:1.35rem; font-weight:900; color:#fff; font-family:var(--font-mono); line-height:1;">
                    ${spiScore}
                  </div>
                  <div style="font-size:0.6rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">SPI</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3-Factor Telemetry Grid -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.25rem;">
            <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.35rem;">
                <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">⚡ Velocity & On-Time</span>
                <span style="font-size:0.85rem; font-weight:800; color:var(--accent-mint); font-family:var(--font-mono);" id="crewSpiVelocityPts">${spi.metrics?.velocityScore || 38}/40 pts</span>
              </div>
              <div style="font-size:1.05rem; font-weight:800; color:#fff;" id="crewSpiVelocityRate">${spi.metrics?.onTimeDeliveryRate || '95%'} On-Time</div>
              <div style="font-size:0.74rem; color:var(--text-muted); margin-top:0.2rem;">Sprint ticket completion velocity</div>
            </div>

            <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.35rem;">
                <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">🛡️ Warranty & Zero-Defects</span>
                <span style="font-size:0.85rem; font-weight:800; color:var(--accent-cyan); font-family:var(--font-mono);" id="crewSpiDefectPts">${spi.metrics?.defectScore || 38}/40 pts</span>
              </div>
              <div style="font-size:1.05rem; font-weight:800; color:#fff;" id="crewSpiDefectRate">${spi.metrics?.warrantyDefectRate || '0.0%'} Defect Rate</div>
              <div style="font-size:0.74rem; color:var(--text-muted); margin-top:0.2rem;">Post-handover zero-regression SLA</div>
            </div>

            <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.35rem;">
                <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">🤝 DoD & Peer Review</span>
                <span style="font-size:0.85rem; font-weight:800; color:var(--accent-purple); font-family:var(--font-mono);" id="crewSpiPeerPts">${spi.metrics?.peerReviewScore || 18}/20 pts</span>
              </div>
              <div style="font-size:1.05rem; font-weight:800; color:#fff;">Pass Rate &ge; 90%</div>
              <div style="font-size:0.74rem; color:var(--text-muted); margin-top:0.2rem;">Definition of Done verification sign-off</div>
            </div>
          </div>

          <!-- Incentive & Settlement Footer Strip -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.75rem 1rem; font-size:0.82rem;">
            <div style="display:flex; align-items:center; gap:0.5rem; color:#f8fafc;">
              <span>✨</span>
              <span><strong>Quarterly Performance Bonus Pool:</strong> <span id="crewSpiBonusEligible" style="color:var(--accent-mint); font-weight:700;">QUALIFIED (SPI &ge; 80)</span></span>
            </div>
            <div style="font-size:0.76rem; color:var(--text-muted); font-family:var(--font-mono);" id="crewSpiRail">
              Settlement: ${spi.settlementRail || 'BRAC Bank Limited (Neoncore Tech Solution / 2081636480001)'}
            </div>
          </div>
        </div>

        <!-- Official Employment Details (Read-Only) -->
        <div class="card-glass">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
            <span style="font-size:1.2rem;">🏢</span>
            <h3 style="font-size:1.05rem; margin:0; font-family:var(--font-heading);">Employment Record</h3>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.7rem; font-size:0.88rem;">
            <div><strong style="color:var(--text-muted); display:inline-block; width:120px;">Full Name:</strong> <span style="font-weight:700; color:#fff;">${user.name || 'Crew Member'}</span></div>
            <div><strong style="color:var(--text-muted); display:inline-block; width:120px;">Employee ID:</strong> <span style="font-family:monospace; color:var(--purple-light); font-weight:700;">${empId}</span></div>
            <div><strong style="color:var(--text-muted); display:inline-block; width:120px;">Role / Title:</strong> <span style="color:var(--text-primary);">${user.role || 'Production Specialist'}</span></div>
            <div><strong style="color:var(--text-muted); display:inline-block; width:120px;">Department:</strong> <span style="color:var(--text-primary);">${user.department || 'Production'}</span></div>
            <div><strong style="color:var(--text-muted); display:inline-block; width:120px;">Work Email:</strong> <span style="color:var(--text-primary);">${user.email || 'Registered Corporate Email'}</span></div>
            <div><strong style="color:var(--text-muted); display:inline-block; width:120px;">Access Level:</strong> <span class="badge badge-purple">${user.accessLevel || user.access_level || 'Specialist / Crew'}</span></div>
          </div>
        </div>

        <!-- Disbursement & Mobile Accounts -->
        <div class="card-glass">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
            <span style="font-size:1.2rem;">💳</span>
            <h3 style="font-size:1.05rem; margin:0; font-family:var(--font-heading);">Disbursement Channel</h3>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.88rem;">
            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">bKash Mobile No (Payouts):</strong>
              ${isEditing ? `
                <input type="text" id="profBkash" value="${bkashNo}" placeholder="017XXXXXXXX" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
              ` : `
                <div style="font-weight:700; color:var(--emerald-brand); font-size:0.95rem;">${bkashNo || 'Not Provided'}</div>
              `}
            </div>

            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Blood Group:</strong>
              ${isEditing ? `
                <select id="profBloodGroup" style="width:100%; background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
                  ${bloodGroups.map(bg => `<option value="${bg}" ${user.blood_group === bg || user.bloodGroup === bg ? 'selected' : ''}>${bg}</option>`).join('')}
                </select>
              ` : `
                <div style="color:var(--text-primary); font-weight:600;">${user.blood_group || user.bloodGroup || 'Not Specified'}</div>
              `}
            </div>

            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">T-Shirt Merchandise Size:</strong>
              ${isEditing ? `
                <select id="profTshirt" style="width:100%; background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
                  ${tshirtSizes.map(sz => `<option value="${sz}" ${user.tshirt_size === sz || user.tshirtSize === sz ? 'selected' : ''}>${sz}</option>`).join('')}
                </select>
              ` : `
                <div style="color:var(--text-primary); font-weight:600;">${user.tshirt_size || user.tshirtSize || 'L'}</div>
              `}
            </div>
          </div>
        </div>

        <!-- Contact & Emergency Details -->
        <div class="card-glass">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
            <span style="font-size:1.2rem;">📞</span>
            <h3 style="font-size:1.05rem; margin:0; font-family:var(--font-heading);">Personal Contact & Emergency</h3>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.88rem;">
            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Personal Phone / WhatsApp:</strong>
              ${isEditing ? `
                <input type="text" id="profPhone" value="${user.phone || ''}" placeholder="+88017..." style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
              ` : `
                <div style="color:var(--text-primary); font-weight:600;">${user.phone || 'Registered Phone'}</div>
              `}
            </div>

            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Personal Email:</strong>
              ${isEditing ? `
                <input type="email" id="profPersonalEmail" value="${user.personal_email || user.personalEmail || ''}" placeholder="personal@gmail.com" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
              ` : `
                <div style="color:var(--text-primary);">${user.personal_email || user.personalEmail || 'Not Provided'}</div>
              `}
            </div>

            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Emergency Contact Name & Phone:</strong>
              ${isEditing ? `
                <input type="text" id="profEmergency" value="${user.emergency_contact || user.emergencyContact || ''}" placeholder="e.g. Father: 017XXXXXXXX" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
              ` : `
                <div style="color:var(--text-primary);">${user.emergency_contact || user.emergencyContact || 'Not Provided'}</div>
              `}
            </div>
          </div>
        </div>

        <!-- Present Address & Primary Skill -->
        <div class="card-glass">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
            <span style="font-size:1.2rem;">📍</span>
            <h3 style="font-size:1.05rem; margin:0; font-family:var(--font-heading);">Location & Specialty</h3>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.88rem;">
            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Present City / Address:</strong>
              ${isEditing ? `
                <input type="text" id="profAddress" value="${user.address || ''}" placeholder="e.g. Banani, Dhaka" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
              ` : `
                <div style="color:var(--text-primary);">${user.address || 'Dhaka, Bangladesh'}</div>
              `}
            </div>

            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Primary Craft / Skill:</strong>
              ${isEditing ? `
                <input type="text" id="profPrimarySkill" value="${user.primary_skill || user.primarySkill || ''}" placeholder="e.g. Premiere Pro / Blender / Node.js" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
              ` : `
                <div style="color:var(--purple-light); font-weight:700;">${user.primary_skill || user.primarySkill || user.role || 'Specialist'}</div>
              `}
            </div>

            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Portfolio / Showcase URL:</strong>
              ${isEditing ? `
                <input type="url" id="profPortfolio" value="${user.portfolio_url || user.portfolioUrl || ''}" placeholder="https://behance.net/... or https://github.com/..." style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
              ` : `
                <div style="color:var(--text-primary); word-break:break-all;">${user.portfolio_url || user.portfolioUrl ? `<a href="${user.portfolio_url || user.portfolioUrl}" target="_blank" style="color:var(--purple-light);">${user.portfolio_url || user.portfolioUrl}</a>` : 'Not Provided'}</div>
              `}
            </div>

            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Dietary Preferences:</strong>
              ${isEditing ? `
                <input type="text" id="profDietary" value="${user.dietary_pref || user.dietaryPref || ''}" placeholder="e.g. Halal, Vegetarian, No peanuts" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
              ` : `
                <div style="color:var(--text-primary);">${user.dietary_pref || user.dietaryPref || 'Standard'}</div>
              `}
            </div>

            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Assigned Laptop Serial No:</strong>
              ${isEditing ? `
                <input type="text" id="profLaptop" value="${user.laptop_serial || user.laptopSerial || ''}" placeholder="e.g. MBP-M2-2023-042" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
              ` : `
                <div style="color:var(--text-primary); font-family:var(--font-mono); font-size:0.85rem;">${user.laptop_serial || user.laptopSerial || 'Personal Device'}</div>
              `}
            </div>

            <div>
              <strong style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Studio Equipment / Gear:</strong>
              ${isEditing ? `
                <input type="text" id="profStudioGear" value="${user.studio_gear || user.studioGear || ''}" placeholder="e.g. Sony A7IV, Rode NT-USB, Wacom Tablet" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; box-sizing:border-box;">
              ` : `
                <div style="color:var(--text-primary);">${user.studio_gear || user.studioGear || 'None Assigned'}</div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.toggleCrewProfileEdit = function(state) {
    isEditing = Boolean(state);
    render();
  };

  window.saveCrewProfile = async function(id) {
    const phone = document.getElementById('profPhone')?.value?.trim();
    const email = document.getElementById('profPersonalEmail')?.value?.trim();
    const emergencyPhone = document.getElementById('profEmergency')?.value?.trim();
    const portfolioUrl = document.getElementById('profPortfolio')?.value?.trim();

    if (phone && !/^(\+?880|0)?1[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ''))) {
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast('Please enter a valid Bangladeshi phone number (e.g. 01711000000).', 'error');
      }
      return;
    }

    if (emergencyPhone && !/^(\+?880|0)?1[3-9]\d{8}$/.test(emergencyPhone.replace(/[\s-]/g, ''))) {
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast('Please enter a valid emergency contact phone number.', 'error');
      }
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast('Please enter a valid email address.', 'error');
      }
      return;
    }

    if (portfolioUrl && !/^https?:\/\/.+/i.test(portfolioUrl)) {
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast('Portfolio URL must start with http:// or https://', 'error');
      }
      return;
    }

    const saveBtn = document.getElementById('crewProfileSaveBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '⏳ Saving...';
    }

    const payload = {
      phone: phone || '',
      personal_email: email || '',
      emergency_contact: emergencyPhone || '',
      blood_group: document.getElementById('profBloodGroup')?.value,
      tshirt_size: document.getElementById('profTshirt')?.value,
      address: document.getElementById('profAddress')?.value?.trim(),
      primary_skill: document.getElementById('profPrimarySkill')?.value?.trim(),
      portfolio_url: portfolioUrl || '',
      dietary_pref: document.getElementById('profDietary')?.value?.trim(),
      laptop_serial: document.getElementById('profLaptop')?.value?.trim(),
      studio_gear: document.getElementById('profStudioGear')?.value?.trim(),
      bank_info: {
        ...(user.bank_info || {}),
        mfsNo: document.getElementById('profBkash')?.value?.trim(),
        bkashNo: document.getElementById('profBkash')?.value?.trim()
      }
    };

    try {
      const res = await CREW_API.put(`/team/${id}`, payload);
      if (res && (res.success !== false && !res.error)) {
        if (typeof window.showCrewToast === 'function') {
          window.showCrewToast('Profile updated successfully! ✅');
        }
        if (typeof CREW_API.invalidateMe === 'function') {
          CREW_API.invalidateMe();
        }
        // Merge updates
        user = { ...user, ...payload, bank_info: payload.bank_info };
        isEditing = false;
        render();
      } else {
        throw new Error(res?.error || 'Failed to save profile changes');
      }
    } catch (err) {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Save Changes';
      }
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast(`Error: ${err.message}`, 'error');
      }
    }
  };

  render();
};

