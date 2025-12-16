const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function authMiddleware(roles = []) {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
    const token = auth.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'forbidden' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: 'invalid token' });
    }
  };
}

module.exports = { authMiddleware };
