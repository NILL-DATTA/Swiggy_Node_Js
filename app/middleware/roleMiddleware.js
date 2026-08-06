const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {

      console.log("========== AUTHORIZE ROLE ==========");

      console.log(
        "User role:",
        req.user?.role
      );

      console.log(
        "Allowed roles:",
        allowedRoles
      );

      if (!req.user || !req.user.role) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized access",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        console.log("❌ ROLE MISMATCH");

        return res.status(403).json({
          status: false,
          message: `Access denied for role: ${req.user.role}`,
        });
      }

      console.log("✅ ROLE AUTHORIZED");

      next();

    } catch (err) {

      console.error(
        "Role authorization error:",
        err
      );

      return res.status(500).json({
        status: false,
        message: "Role authorization failed",
      });
    }
  };
};

module.exports = authorizeRoles;