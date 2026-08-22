/**
 * public/crew/modules/profile.js
 * Interactive Profile Module with Self-Edit Capability
 */
window.CREW_MODULES = window.CREW_MODULES || {};

window.CREW_MODULES.profile = async function(container) {
  let me = await CREW_API.getMe().catch(() => ({}));
  let user = me.user || {};
  const empId = user.emp_code || user.id || 'PBD-001';

  let isEditing = false;

  function render() {
    const bkashNo = user.bank_info?.mfsNo || user.bank_info?.bkashNo || user.phone || '';
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Specified'];
    const tshirtSizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

    container.innerHTML = `
      <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">👤 My Personal Profile</h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">Manage your personal details, contact info, and bKash payout account.</div>
        </div>

        <div>
          ${!isEditing ? `
            <button id="crewProfileEditBtn" class="btn-secondary" style="font-size:0.85rem; padding:0.5rem 1rem; border-radius:10px; cursor:pointer;" onclick="toggleCrewProfileEdit(true)">
              ✏️ Edit Profile
            </button>
          ` : `
            <div style="display:flex; gap:0.5rem;">
              <button class="btn-secondary" style="font-size:0.85rem; padding:0.5rem 0.85rem; border-radius:10px; cursor:pointer;" onclick="toggleCrewProfileEdit(false)">
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

