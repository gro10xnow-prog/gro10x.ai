// 🔮 PURPLEBOT DIGITAL — PUBLIC AGENCY LANDING PAGE JS

document.addEventListener('DOMContentLoaded', () => {
  fetchLandingServices();
});

async function fetchLandingServices() {
  const container = document.getElementById('landingServicesGrid');
  if (!container) return;

  try {
    const res = await fetch('/api/services');
    const services = await res.json();

    if (!services || services.length === 0) return;

    container.innerHTML = services.map(s => `
      <div class="landing-service-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <span class="badge badge-purple">${s.category}</span>
            <strong style="color:#34d399; font-size:1.1rem;">${s.price}</strong>
          </div>
          <h3 style="font-size:1.25rem; color:#fff; font-weight:700; margin-bottom:0.5rem;">${s.title}</h3>
          <p style="font-size:0.88rem; color:#94a3b8; line-height:1.5; margin-bottom:1rem;">${s.description}</p>
          
          <div style="display:flex; flex-direction:column; gap:0.4rem; margin-bottom:1.5rem;">
            ${(s.includedFeatures || []).map(f => `
              <div style="font-size:0.8rem; color:#cbd5e1; display:flex; align-items:center; gap:0.4rem;">
                <span style="color:#a855f7;">✓</span> ${f}
              </div>
            `).join('')}
          </div>
        </div>

        <button onclick="selectLandingService('${s.title}')" class="btn-hero-secondary" style="width:100%; text-align:center; font-size:0.88rem; padding:0.6rem 1rem;">
          📋 Select This Package
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error fetching landing services:', err);
  }
}

function selectLandingService(serviceTitle) {
  const select = document.getElementById('inqService');
  if (select) {
    for (let opt of select.options) {
      if (opt.text.toLowerCase().includes(serviceTitle.toLowerCase())) {
        opt.selected = true;
        break;
      }
    }
  }
  const inquirySec = document.getElementById('inquiry');
  if (inquirySec) {
    inquirySec.scrollIntoView({ behavior: 'smooth' });
  }
}

async function submitPublicInquiry(event) {
  event.preventDefault();

  const clientName = document.getElementById('inqClient').value;
  const contactPerson = document.getElementById('inqContact').value;
  const contactEmail = document.getElementById('inqEmail').value;
  const serviceTitle = document.getElementById('inqService').value;
  const notes = document.getElementById('inqNotes').value;

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName,
        contactPerson,
        contactEmail,
        serviceTitle,
        notes,
        source: 'Public Agency Website'
      })
    });

    const data = await res.json();
    if (data.success) {
      alert(`🎉 Thank you ${contactPerson}! Your campaign brief for "${serviceTitle}" has been received by Purplebot Digital.\nOur account team will contact you shortly.`);
      document.getElementById('publicInquiryForm').reset();
    } else {
      alert('Error submitting inquiry: ' + (data.error || 'Please try again.'));
    }
  } catch (err) {
    console.error('Error submitting public inquiry:', err);
    alert('Network error while submitting inquiry.');
  }
}
