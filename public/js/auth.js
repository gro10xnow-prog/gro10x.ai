// PurpleOS Phone + 4-Digit PIN Authentication Script

let currentPhone = '';

function initAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  const phoneParam = urlParams.get('phone');
  if (phoneParam) {
    document.getElementById('phone').value = phoneParam;
  }
}

function togglePinVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerText = '🙈';
  } else {
    input.type = 'password';
    btn.innerText = '👁️';
  }
}

function showAlert(text, type) {

  const box = document.getElementById('alert-box');
  if (!text) {
    box.style.display = 'none';
    return;
  }
  box.className = `alert alert-${type}`;
  box.innerText = text;
  box.style.display = 'block';
}

async function handlePinLogin(event) {
  event.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  const pin = document.getElementById('pin').value.trim();
  const emailElem = document.getElementById('email');
  const email = emailElem ? emailElem.value.trim() : '';
  const btn = document.getElementById('btn-pin-submit');

  showAlert('Verifying credentials...', 'success');
  btn.disabled = true;
  currentPhone = phone;

  try {
    const res = await fetch('/api/auth/pin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });

    const data = await res.json();

    if (!data.success) {
      showAlert(data.error || 'Authentication failed', 'error');
      btn.disabled = false;
      return;
    }

    if (data.isTemp) {
      tempAuthToken = data.token;
      if (email && !data.email) {
        document.getElementById('perm-email').value = email;
      } else if (data.email) {
        document.getElementById('perm-email').value = data.email;
      }
      document.getElementById('setup-pin-modal').style.display = 'flex';
      btn.disabled = false;
      return;
    }

    saveSessionAndRedirect(data.user, data.linkedType, email || data.email, data.token);

  } catch (err) {
    showAlert(`Authentication error: ${err.message}`, 'error');
    btn.disabled = false;
  }
}

async function submitPermanentPinSetup(event) {
  event.preventDefault();
  const newPin = document.getElementById('new-perm-pin').value.trim();
  const confirmPin = document.getElementById('confirm-perm-pin').value.trim();
  const email = document.getElementById('perm-email').value.trim();

  if (newPin !== confirmPin) {
    showAlert('PIN codes do not match. Please re-enter.', 'danger');
    return;
  }

  try {
    const res = await fetch('/api/auth/pin/set', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tempAuthToken}` 
      },
      body: JSON.stringify({ phone: currentPhone, newPin, email })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('setup-pin-modal').style.display = 'none';
      // Use the temp token that was already verified to get through auth
      saveSessionAndRedirect({ phone: currentPhone }, 'team', email, tempAuthToken);
    } else {
      showAlert('Error setting permanent PIN: ' + (data.error || 'Please try again.'), 'danger');
    }
  } catch (err) {
    console.error('Permanent PIN setup error:', err);
  }
}

function saveSessionAndRedirect(user, linkedType, email, realToken) {
  const cleanPhone = (user?.phone || currentPhone || '').replace(/[^0-9+]/g, '');
  localStorage.setItem('purple_user_phone', cleanPhone);
  if (email) localStorage.setItem('purple_user_email', email);
  if (user?.name) localStorage.setItem('purple_user_name', user.name);
  if (user?.role) localStorage.setItem('purple_user_role', user.role);
  if (user?.accessLevel) localStorage.setItem('purple_user_access', user.accessLevel);
  if (user?.id) localStorage.setItem('purple_user_id', user.id);

  // Use the real signed JWT from the server — NOT a fake timestamp token
  const token = realToken || user?.token || '';
  if (token) {
    localStorage.setItem('sb-access-token', token);
    document.cookie = `sb-access-token=${token}; Path=/; SameSite=Lax; max-age=604800`;
  }

  showAlert('✅ Authentication successful! Launching workspace...', 'success');

  setTimeout(() => {
    const role = (user?.role || '').toLowerCase();
    const access = (user?.accessLevel || '').toLowerCase();
    const empId = user?.id || '';

    const isOwnerAdmin = ['PBD-000', 'PBD-001', 'PBD-002'].includes(empId) ||
      access.includes('owner') || role.includes('owner') ||
      role.includes('managing director') || role.includes('chairman') ||
      role.includes('technology admin') ||
      cleanPhone.includes('1708459008') || cleanPhone.includes('1612309290') || cleanPhone.includes('1708455081');

    const isFinance = access.includes('finance') || role.includes('finance');
    const isManager = access.includes('director') || access.includes('manager') ||
      role.includes('director') || role.includes('manager') || role.includes('head');

    if (isOwnerAdmin) {
      window.location.href = '/admin';
    } else if (isFinance) {
      window.location.href = '/admin#financials';
    } else if (isManager) {
      window.location.href = '/manager';
    } else if (linkedType === 'client' || role.includes('client')) {
      window.location.href = '/partners';
    } else {
      window.location.href = '/team-miniapp';
    }
  }, 1000);
}

document.addEventListener('DOMContentLoaded', initAuth);
