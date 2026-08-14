const jwt = require("jsonwebtoken");

const AuthCheck = async (req, res, next) => {
  try {

    console.log("========== AUTH CHECK ==========");

    const authHeader =
      req.headers.authorization;

    console.log(
      "Authorization:",
      authHeader
    );

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      console.log(
        "Authorization header missing"
      );

      return res.status(401).json({
        status: false,
        message: "Access denied",
      });
    }

    const token =
      authHeader.split(" ")[1];

    console.log(
      "Token exists:",
      !!token
    );

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
      "sagnikduttawebskitters"
    );

    console.log(
      "Decoded JWT:",
      decoded
    );

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    console.log(
      "req.user:",
      req.user
    );

    console.log(
      "✅ AuthCheck passed"
    );

    next();

  } catch (error) {

    console.error(
      "AuthCheck Error:",
      error.message
    );

    return res.status(401).json({
      status: false,
      message: error.message,
    });
  }
};

module.exports = AuthCheck;