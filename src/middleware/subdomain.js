const path = require('path');

function subdomainRouter(req, res, next) {
  const host = req.headers.host || '';
  const isAuthSubdomain = host.startsWith('auth.') || req.path.startsWith('/auth');

  // If request is targeting Auth subdomain or /auth path
  if (isAuthSubdomain) {
    if (req.path === '/auth' || req.path === '/' || req.path === '/index.html' || req.path === '/login') {
      return res.sendFile(path.join(__dirname, '../../public/auth.html'));
    }
  }

  next();
}

module.exports = subdomainRouter;
