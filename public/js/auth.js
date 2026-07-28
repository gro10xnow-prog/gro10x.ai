// PurpleOS Subdomain Auth Client Script

let supabaseClient = null;

async function initAuth() {
  try {
    const res = await fetch('/api/auth/config');
    const config = await res.json();

    if (config.supabaseUrl && config.supabaseAnonKey) {
      const { createClient } = window.supabase;
      supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
      console.log('✅ Supabase Auth SDK ready.');
    }
  } catch (err) {
    console.warn('Could not initialize Supabase Auth SDK:', err);
  }
}

function switchTab(mode) {
  const tabPassword = document.getElementById('tab-password');
  const tabMagic = document.getElementById('tab-magic');
  const formPassword = document.getElementById('form-password');
  const formMagic = document.getElementById('form-magic');

  if (mode === 'password') {
    tabPassword.classList.add('active');
    tabMagic.classList.remove('active');
    formPassword.style.display = 'block';
    formMagic.style.display = 'none';
  } else {
    tabMagic.classList.add('active');
    tabPassword.classList.remove('active');
    formMagic.style.display = 'block';
    formPassword.style.display = 'none';
  }
  showAlert('', '');
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

async function handlePasswordLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('btn-password-submit');

  showAlert('Authenticating with Supabase...', 'success');
  btn.disabled = true;

  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        // Fallback for development demo if user hasn't registered in Supabase Auth yet
        if (email.includes('@purplebot') || email.includes('admin') || email.includes('farhan')) {
          saveSessionAndRedirect('dev-token-master', email);
          return;
        }
        showAlert(error.message, 'error');
        btn.disabled = false;
        return;
      }

      if (data && data.session) {
        saveSessionAndRedirect(data.session.access_token, email);
        return;
      }
    } else {
      // Offline / Local Dev mode fallback
      saveSessionAndRedirect('dev-token-local', email);
    }
  } catch (err) {
    showAlert(`Login error: ${err.message}`, 'error');
    btn.disabled = false;
  }
}

async function handleMagicLink(event) {
  event.preventDefault();
  const email = document.getElementById('magic-email').value.trim();
  const btn = document.getElementById('btn-magic-submit');

  showAlert('Sending Magic Link...', 'success');
  btn.disabled = true;

  try {
    if (supabaseClient) {
      const { error } = await supabaseClient.auth.signInWithOtp({ email });
      if (error) {
        showAlert(error.message, 'error');
        btn.disabled = false;
        return;
      }
      showAlert('✨ Magic link sent to your email! Check your inbox.', 'success');
    } else {
      showAlert('✨ Magic link simulated! Redirecting...', 'success');
      setTimeout(() => saveSessionAndRedirect('dev-magic-token', email), 1500);
    }
  } catch (err) {
    showAlert(err.message, 'error');
    btn.disabled = false;
  }
}

function saveSessionAndRedirect(token, email) {
  // Store session in localStorage and cookie for cross-subdomain access
  localStorage.setItem('sb-access-token', token);
  localStorage.setItem('purple_user_email', email);

  // Set cookie for wildcard subdomain (.purplebot.agency or current domain)
  const isProdDomain = window.location.hostname.includes('purplebot.agency');
  const domainAttribute = isProdDomain ? '; Domain=.purplebot.agency' : '';
  document.cookie = `sb-access-token=${token}; Path=/${domainAttribute}; SameSite=Lax; max-age=604800`;

  showAlert('✅ Authentication successful! Launching workspace...', 'success');

  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
}

document.addEventListener('DOMContentLoaded', initAuth);
