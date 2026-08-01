const { supabase, supabaseAnon, isSupabaseConfigured } = require('../services/supabase');
const { readDB } = require('../services/db');
const { verifyToken } = require('../services/jwt');

async function requireAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split('; ').map(c => {
        const parts = c.split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );
    token = cookies['sb-access-token'] || cookies['sb_access_token'] || cookies['purple_jwt'];
  }

  // 1. Verify Real Signed JWT first
  if (token) {
    const decodedPayload = verifyToken(token);
    if (decodedPayload) {
      req.user = {
        id: decodedPayload.userId || decodedPayload.id || 'USER-001',
        email: decodedPayload.email || '',
        role: decodedPayload.role || 'Specialist',
        accessLevel: decodedPayload.accessLevel || 'Specialist / Crew',
        department: decodedPayload.department || 'Production',
        linkedType: decodedPayload.linkedType || 'team',
        linkedId: decodedPayload.linkedId || decodedPayload.userId || 'EMP-001',
        profile: decodedPayload.profile || {
          emp_code: decodedPayload.linkedId || decodedPayload.userId || 'EMP-001',
          name: decodedPayload.name || 'User',
          role: decodedPayload.role || 'Specialist',
          accessLevel: decodedPayload.accessLevel || 'Specialist / Crew',
          department: decodedPayload.department || 'Production'
        }
      };
      return next();
    }
  }

  // 2. Verify Supabase Session if token is a Supabase Token
  if (isSupabaseConfigured() && token) {
    try {
      // Use supabaseAnon (not admin) to validate user-issued session tokens
      const client = supabaseAnon || supabase;
      const { data: { user }, error } = await client.auth.getUser(token);
      if (!error && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${user.id},email.eq.${user.email}`)
          .single();

        req.user = {
          id: user.id,
          email: user.email,
          role: profile?.role || 'Specialist',
          accessLevel: profile?.accessLevel || 'Specialist / Crew',
          department: profile?.department || 'Production',
          linkedType: 'team',
          linkedId: profile?.emp_code || user.id,
          profile: profile || {
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            role: user.user_metadata?.role || 'Specialist',
            department: 'Production'
          }
        };
        return next();
      }
    } catch (err) {
      console.warn('[Auth Middleware Warning]', err.message);
    }
  }

  // 3. Fallback PIN user lookup (if token matched raw phone/pin for legacy session compatibility)
  if (token) {
    const dbData = readDB();
    const pinUser = (dbData.authPins || []).find(p => p.pin === token || p.phone === token);
    if (pinUser) {
      const emp = (dbData.team || []).find(t => t.id === pinUser.linkedId || t.phone === pinUser.phone) || dbData.team[0];
      req.user = {
        id: emp.id || 'EMP-001',
        email: emp.email || 'owner@purplebot.co',
        role: emp.role || 'Agency Owner',
        accessLevel: emp.accessLevel || 'Owner / Admin',
        department: emp.department || 'Management',
        linkedType: pinUser.linkedType || 'team',
        linkedId: emp.id || 'EMP-001',
        profile: {
          emp_code: emp.id || 'EMP-001',
          name: emp.name || 'Mahmudul Hasan',
          role: emp.role || 'Agency Owner',
          accessLevel: emp.accessLevel || 'Owner / Admin',
          department: emp.department || 'Management'
        }
      };
      return next();
    }
  }

  // 4. Development Fallback ONLY when NODE_ENV is not production and FORCE_SUPABASE is false
  if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_SUPABASE) {
    const db = readDB();
    const defaultEmp = (db.team && db.team[0]) || { name: 'Mahmudul Hasan', role: 'Agency Director' };

    req.user = {
      id: defaultEmp.id || 'EMP-001',
      email: 'owner@purplebot.digital',
      role: defaultEmp.role || 'Agency Founder & Master Owner',
      accessLevel: 'Owner / Admin',
      department: defaultEmp.department || 'Management',
      linkedType: 'team',
      linkedId: defaultEmp.id || 'EMP-001',
      profile: {
        emp_code: defaultEmp.id || 'EMP-001',
        name: defaultEmp.name || 'Mahmudul Hasan',
        email: 'owner@purplebot.digital',
        role: defaultEmp.role || 'Agency Founder & Master Owner',
        accessLevel: 'Owner / Admin',
        phone: defaultEmp.phone || '+8801700000000',
        department: defaultEmp.department || 'Management',
        status: defaultEmp.status || 'In Studio'
      }
    };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Valid authentication token or session cookie is required' });
}

module.exports = {
  requireAuth
};
