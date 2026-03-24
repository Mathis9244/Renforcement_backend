const jwt = require('jsonwebtoken');
const { ROLES } = require('../constants/roles');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-only-change-me-in-production';
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = {
      id: payload.sub,
      role: payload.role,
      username: payload.username,
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { role } = req.user;
    if (role === ROLES.ADMIN) {
      return next();
    }
    if (allowedRoles.includes(role)) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      username: user.username,
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

module.exports = { requireAuth, requireRoles, signToken, getJwtSecret };
