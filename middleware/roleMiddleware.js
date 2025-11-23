
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // prefer role from req.user, fallback to req.role
    const currentRole = (req.user && req.user.role) || req.role;

    if (!currentRole) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!roles.includes(currentRole)) {
      return res.status(403).json({ success: false, message: 'Access denied: insufficient role' });
    }

    next();
  };
};

