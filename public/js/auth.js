// PurpleOS Phone + 4-Digit PIN Authentication Script

let currentPhone = '';

function initAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  const phoneParam = urlParams.get('phone');
  if (phoneParam) {
    document.getElementById('phone').value = phoneParam;
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
  const email = document.getElementById('email').value.trim();
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
      if (email && !data.email) {
        document.getElementById('perm-email').value = email;
      } else if (data.email) {
        document.getElementById('perm-email').value = data.email;
      }
      document.getElementById('setup-pin-modal').style.display = 'flex';
      btn.disabled = false;
      return;
    }

    saveSessionAndRedirect(data.user, data.linkedType, email || data.email);

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
    alert('PIN codes do not match. Please re-enter.');
    return;
  }

  try {
    const res = await fetch('/api/auth/pin/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentPhone, newPin, email })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('setup-pin-modal').style.display = 'none';
      saveSessionAndRedirect({ phone: currentPhone }, 'team', email);
    } else {
      alert('Error setting permanent PIN: ' + (data.error || 'Please try again.'));
    }
  } catch (err) {
    console.error('Permanent PIN setup error:', err);
  }
}

function saveSessionAndRedirect(user, linkedType, email) {
  const cleanPhone = (user?.phone || currentPhone || '').replace(/[^0-9+]/g, '');
  localStorage.setItem('purple_user_phone', cleanPhone);
  if (email) localStorage.setItem('purple_user_email', email);
  if (user?.name) localStorage.setItem('purple_user_name', user.name);
  if (user?.role) localStorage.setItem('purple_user_role', user.role);

  const token = `pin-token-${Date.now()}`;
  localStorage.setItem('sb-access-token', token);
  document.cookie = `sb-access-token=${token}; Path=/; SameSite=Lax; max-age=604800`;

  showAlert('✅ Authentication successful! Launching workspace...', 'success');

  setTimeout(() => {
    const role = (user?.role || user?.accessLevel || '').toLowerCase();
    const isOwner = cleanPhone.includes('8801700000000') || role.includes('owner') || role.includes('founder');
    const isManager = role.includes('director') || role.includes('manager');

    if (isOwner) {
      window.location.href = '/admin';
    } else if (isManager) {
      window.location.href = '/manager';
    } else if (linkedType === 'client' || role.includes('client')) {
      window.location.href = '/partners';
    } else {
      window.location.href = '/team';
    }
  }, 1000);
}

document.addEventListener('DOMContentLoaded', initAuth);
