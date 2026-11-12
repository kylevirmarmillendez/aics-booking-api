export function requireAuth(req, res, next) {
  if (req.isAuthenticated?.()) return next();
  return res.status(401).json({ success: false, message: 'Authentication required.' });
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Your role is not permitted to access this resource.' });
    }
    return next();
  };
}
