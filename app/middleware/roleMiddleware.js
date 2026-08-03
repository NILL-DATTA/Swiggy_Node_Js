const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized access",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          status: false,
          message: `Access denied for role: ${req.user.role}`,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Role authorization failed",
      });
    }
  };
};

module.exports = authorizeRoles;