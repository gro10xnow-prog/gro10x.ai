const { supabase, supabaseAnon, isSupabaseConfigured } = require('../services/supabase');
const { readDB } = require('../services/db');
const { verifyToken } = require('../services/jwt');

async function requireAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && (req.query.token || req.query.t)) {
    // Allow query-string token for EventSource (SSE) connections that cannot set headers
    token = req.query.token || req.query.t;
  } else if (req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split('; ').map(c => {
        const parts = c.split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );
    token = cookies['gro10x_token'] || cookies['sb-access-token'] || cookies['sb_access_token'] || cookies['purple_jwt'];
  }

  // 1. Verify Real Signed JWT first
  if (token) {
    const decodedPayload = verifyToken(token);
    if (decodedPayload) {
      req.user = {
        id: decodedPayload.userId || decodedPayload.id || 'USER-001',
        email: decodedPayload.email || '',
        role: decodedPayload.role || 'Specialist',
        accessLevel: decodedPayload.accessLevel || decodedPayload.access_level || 'Specialist / Crew',
        department: decodedPayload.department || 'Production',
        linkedType: decodedPayload.linkedType || decodedPayload.type || 'team',
        linkedId: decodedPayload.linkedId || decodedPayload.emp_code || decodedPayload.userId || decodedPayload.id || 'EMP-001',
        profile: decodedPayload.profile || {
          emp_code: decodedPayload.linkedId || decodedPayload.emp_code || decodedPayload.userId || decodedPayload.id || 'EMP-001',
          name: decodedPayload.name || 'User',
          role: decodedPayload.role || 'Specialist',
          accessLevel: decodedPayload.accessLevel || decodedPayload.access_level || 'Specialist / Crew',
          department: decodedPayload.department || 'Production'
        }
      };
      return next();
    }

    // If token was explicitly provided as a JWT (3 dot-separated parts) but failed verification (expired or invalid), reject immediately with 401
    if (typeof token === 'string' && token.split('.').length === 3) {
      return res.status(401).json({ error: 'Unauthorized: Session token is expired or invalid', expired: true });
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
          .maybeSingle();

        const isClient = (
          profile?.role === 'Client' ||
          profile?.role === 'Client Partner' ||
          profile?.role === 'Client Representative' ||
          profile?.accessLevel === 'Client Partner' ||
          profile?.access_level === 'Client Partner' ||
          profile?.accessLevel === 'Client' ||
          profile?.access_level === 'Client' ||
          profile?.linked_type === 'client' ||
          profile?.linkedType === 'client' ||
          user.user_metadata?.role === 'Client'
        );
        const resolvedLinkedType = isClient ? 'client' : (profile?.linked_type || profile?.linkedType || 'team');
        const resolvedLinkedId = isClient ? (profile?.client_id || profile?.linked_id || user.id) : (profile?.emp_code || user.id);

        req.user = {
          id: user.id,
          email: user.email,
          role: profile?.role || (isClient ? 'Client' : 'Specialist'),
          accessLevel: profile?.accessLevel || profile?.access_level || (isClient ? 'Client Partner' : 'Specialist / Crew'),
          department: profile?.department || (isClient ? 'Client Accounts' : 'Production'),
          linkedType: resolvedLinkedType,
          linkedId: resolvedLinkedId,
          profile: profile || {
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            role: user.user_metadata?.role || (isClient ? 'Client' : 'Specialist'),
            department: isClient ? 'Client Accounts' : 'Production'
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
    const dbData = await readDB();
    const pinUser = (dbData.authPins || []).find(p => p.pin === token || p.phone === token);
    if (pinUser) {
      const emp = (dbData.team || []).find(t => t.id === pinUser.linkedId || t.phone === pinUser.phone);
      if (emp) {
        req.user = {
          id: emp.id || 'GRO-001',
          email: emp.email || '',
          name: emp.name || 'Team Member',
          role: emp.role || 'Specialist',
          accessLevel: emp.accessLevel || 'Specialist / Crew',
          department: emp.department || 'Production',
          linkedType: pinUser.linkedType || 'team',
          linkedId: emp.id,
          profile: {
            emp_code: emp.id,
            name: emp.name,
            role: emp.role,
            accessLevel: emp.accessLevel,
            department: emp.department
          }
        };
        return next();
      }
    }
  }

  // 4. Development / Test Fallback ONLY on localhost or test runner (never active on external traffic or Vercel preview/production)
  if ((process.env.NODE_ENV === 'test' || (process.env.NODE_ENV === 'development' && !process.env.VERCEL && !process.env.FORCE_SUPABASE)) && req.headers['x-disable-dev-auth'] !== 'true') {
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
    if (!isLocalhost && process.env.NODE_ENV !== 'test') {
      return res.status(401).json({ error: 'Unauthorized: Remote requests in development require valid authentication' });
    }

    const db = await readDB();
    const defaultEmp = (db.team && db.team[0]) || { name: 'Firoz Uddin Ahmed', role: 'Agency Founder & Master Owner' };

    req.user = {
      id: defaultEmp.id || 'GRO-001',
      email: defaultEmp.email || 'gro10xnow@gmail.com',
      role: defaultEmp.role || 'Agency Founder & Master Owner',
      accessLevel: 'Owner / Admin',
      department: defaultEmp.department || 'Executive Leadership',
      linkedType: 'team',
      linkedId: defaultEmp.id || 'GRO-001',
      profile: {
        emp_code: defaultEmp.id || 'GRO-001',
        name: defaultEmp.name || 'Firoz Uddin Ahmed',
        email: defaultEmp.email || 'gro10xnow@gmail.com',
        role: defaultEmp.role || 'Agency Founder & Master Owner',
        accessLevel: 'Owner / Admin',
        phone: defaultEmp.phone || '+8801708459008',
        department: defaultEmp.department || 'Executive Leadership',
        status: defaultEmp.status || 'Active'
      }
    };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Valid authentication token or session cookie is required' });
}

module.exports = {
  requireAuth
};
