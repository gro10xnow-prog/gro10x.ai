const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { readDB } = require('../services/db');

async function requireAuth(req, res, next) {
  // Extract token from Authorization header or cookie
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    const cookies = Object.fromEntries(req.headers.cookie.split('; ').map(c => c.split('=')));
    token = cookies['sb-access-token'] || cookies['sb_access_token'];
  }

  // If Supabase is configured and token is present
  if (isSupabaseConfigured() && token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        // Fetch matching profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${user.id},email.eq.${user.email}`)
          .single();

        req.user = {
          id: user.id,
          email: user.email,
          profile: profile || {
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            role: user.user_metadata?.role || 'Specialist',
            department: 'Production'
          }
        };
        return next();
      }
    } catch (err) {
      console.warn('Auth verification warning:', err.message);
    }
  }

  // Check PIN auth records if token is PIN token
  if (token) {
    const dbData = readDB();
    const pinUser = (dbData.authPins || []).find(p => p.pin === token || p.phone === token);
    if (pinUser) {
      const emp = (dbData.team || []).find(t => t.id === pinUser.linkedId || t.phone === pinUser.phone) || dbData.team[0];
      req.user = {
        id: emp.id || 'EMP-001',
        email: emp.email || 'owner@purplebot.co',
        profile: {
          emp_code: emp.id || 'EMP-001',
          name: emp.name || 'Mahmudul Hasan',
          role: emp.role || 'Agency Owner',
          accessLevel: 'Owner / Admin',
          department: emp.department || 'Management'
        }
      };
      return next();
    }
  }

  // Development Fallback: allow mock admin user session ONLY in non-production development environments
  if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_SUPABASE) {
    const db = readDB();
    const defaultEmp = (db.team && db.team[0]) || { name: 'Mahmudul Hasan', role: 'Agency Director' };

    req.user = {
      id: 'mock-user-001',
      email: 'claycoinbank@gmail.com',
      profile: {
        emp_code: defaultEmp.id || 'EMP-001',
        name: defaultEmp.name || 'Mahmudul Hasan',
        email: 'claycoinbank@gmail.com',
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
