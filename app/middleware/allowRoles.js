const allowRoles = (...roles) => {
  return (req, res, next) => {
    console.log("req.user =", req.user);
    console.log("Current role =", req.user?.role);
    console.log("Allowed roles =", roles);
    // auth check
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    // role check
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: false,
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = allowRoles;
