// PurpleOS Phone + 4-Digit PIN Authentication Script

let currentPhone = '';
let tempAuthToken = '';

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
    const urlParams = new URLSearchParams(window.location.search);
    const portal = urlParams.get('portal') || (window.location.pathname.includes('client') ? 'client' : '');

    const res = await fetch('/api/auth/pin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin, portal }),
      signal: AbortSignal.timeout(15000)
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
    showAlert('PINs do not match. Please verify.', 'error');
    return;
  }
  if (newPin.length < 4) {
    showAlert('PIN must be at least 4 digits.', 'error');
    return;
  }

  showAlert('Saving your permanent PIN...', 'success');

  try {
    const res = await fetch('/api/auth/pin/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tempAuthToken}`
      },
      body: JSON.stringify({
        phone: currentPhone,
        newPin: newPin,
        email: email
      })
    });

    const data = await res.json();
    if (!data.success) {
      showAlert(data.error || 'Failed to save permanent PIN', 'error');
      return;
    }

    document.getElementById('setup-pin-modal').style.display = 'none';
    const userPayload = { phone: currentPhone, email: email, token: tempAuthToken };
    saveSessionAndRedirect(userPayload, 'team', email, tempAuthToken);

  } catch (err) {
    showAlert(`Error setting PIN: ${err.message}`, 'error');
  }
}

function saveSessionAndRedirect(user, linkedType, email, realToken) {
  const cleanPhone = (user?.phone || currentPhone || '').replace(/[^0-9+]/g, '');
  
  // Build unified user object for shell and profile hydration
  const userObj = {
    id: user?.id || 'USR-001',
    pocId: user?.pocId || 'poc_1',
    name: user?.name || 'GRO10X Specialist',
    company: user?.company || user?.name || '',
    pocRole: user?.pocRole || '',
    role: user?.role || user?.accessLevel || (linkedType === 'client' ? 'Client Representative' : 'AI Specialist'),
    phone: cleanPhone,
    email: email || user?.email || '',
    accessLevel: user?.accessLevel || (linkedType === 'client' ? 'Client' : 'Specialist / Crew')
  };

  try {
    localStorage.setItem('gro10x_user', JSON.stringify(userObj));
    localStorage.setItem('gro10x_user_phone', cleanPhone);
    localStorage.setItem('purple_user', JSON.stringify(userObj));
    localStorage.setItem('purple_user_phone', cleanPhone);
    if (email || userObj.email) localStorage.setItem('purple_user_email', email || userObj.email);
    if (userObj.name) localStorage.setItem('purple_user_name', userObj.name);
    if (userObj.company) localStorage.setItem('purple_user_company', userObj.company);
    if (userObj.pocRole) localStorage.setItem('purple_user_poc_role', userObj.pocRole);
    if (userObj.role) localStorage.setItem('purple_user_role', userObj.role);
    if (userObj.accessLevel) localStorage.setItem('purple_user_access', userObj.accessLevel);
    if (userObj.id) localStorage.setItem('purple_user_id', userObj.id);

    // Use the real signed JWT from the server
    const token = realToken || user?.token || '';
    if (token) {
      localStorage.setItem('gro10x_token', token);
      localStorage.setItem('sb-access-token', token);
      document.cookie = `sb-access-token=${token}; Path=/; SameSite=Lax; max-age=604800`;
    }
  } catch (storageErr) {
    console.warn('[auth] localStorage unavailable, continuing with cookie only:', storageErr.message);
    const token = realToken || user?.token || '';
    if (token) {
      document.cookie = `sb-access-token=${token}; Path=/; SameSite=Lax; max-age=604800`;
    }
  }

  showAlert('✅ Authentication successful! Launching workspace...', 'success');

  setTimeout(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetRedirect = urlParams.get('redirect') || urlParams.get('return');
    if (targetRedirect && targetRedirect.startsWith('/') && !targetRedirect.startsWith('//')) {
      window.location.href = targetRedirect;
      return;
    }

    const role = (user?.role || '').toLowerCase();
    const access = (user?.accessLevel || '').toLowerCase();

    const isOwnerAdmin = access.includes('owner') || access.includes('admin') || 
      role === 'owner' ||
      role.includes('owner') || role.includes('managing director') || 
      role.includes('chairman') || role.includes('admin') || role.includes('head');

    const isManager = !isOwnerAdmin && (access.includes('director') || access.includes('manager') ||
      role.includes('director') || role.includes('manager'));

    if (isOwnerAdmin) {
      window.location.href = '/app';
    } else if (isManager) {
      window.location.href = '/manager';
    } else if (linkedType === 'client' || role.includes('client')) {
      window.location.href = '/partners.html';
    } else {
      window.location.href = '/team.html';
    }
  }, 1000);
}

document.addEventListener('DOMContentLoaded', initAuth);
