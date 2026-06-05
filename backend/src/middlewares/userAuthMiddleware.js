// D:\Mani\Code with Zosh\Backup\source code\backend\src\middlewares\userAuthMiddleware.js
const jwt = require("jsonwebtoken");
const UserService = require("../services/UserService");
const jwtProvider = require("../utils/jwtProvider");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 🔑 If no token, continue without user (guest)
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // 👈 Allow guest access
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(); // 👈 Allow guest access
    }

    // 🔑 Verify token and attach user
    const payload = jwtProvider.verifyJwt(token);
    const user = await UserService.findUserProfileByJwt(token);

    if (user) {
      req.user = user;
    }
    // If user not found, still allow request (guest behavior)

    next();
  } catch (error) {
    console.error("Auth middleware error::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::", error.message);
    // 🔑 Don't block on invalid token — treat as guest
    next();
  }
};

module.exports = authMiddleware;