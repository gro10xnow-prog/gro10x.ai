function validateInput(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body format' });
    }

    // Generic sanitization (trimming strings, preventing excessive lengths)
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
        
        // Prevent extremely long string payloads (e.g., > 50,000 chars)
        if (req.body[key].length > 50000) {
          return res.status(400).json({ error: `Field '${key}' exceeds maximum allowed length.` });
        }
      }
    }
  }
  next();
}

module.exports = { validateInput };
