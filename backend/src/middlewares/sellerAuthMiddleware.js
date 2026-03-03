// D:\Mani\Code with Zosh\Backup\source code\backend\src\middlewares\sellerAuthMiddleware.js
const Seller = require("../models/Seller");
const jwtProvider = require("../utils/jwtProvider");
const sellerAuthMiddleware = async (req, res, next) => {
  try {
    // Check if the Authorization header is present
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header is missing or invalid" });
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "JWT Token is missing" });
    }

    let email;
    try {
      email = jwtProvider.getEmailFromJwt(token);
    } catch (error) {
            console.error("JWT verification error:", error.message); 
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Find the seller using the extracted email
    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res
        .status(404)
        .json({ message: "Seller not found with email " + email });
    }

    // ✅ CRITICAL FIX: Check account status
    if (seller.accountStatus !== "ACTIVE") {
      let message = "Your account is not active.";
      if (seller.accountStatus === "PENDING_VERIFICATION") {
        message = "Your application is still pending. Please wait for admin approval.";
      } else if (seller.accountStatus === "SUSPENDED") {
        message = "Your account has been suspended. Please contact support.";
      } else if (seller.accountStatus === "BANNED") {
        message = "Your account has been banned.";
      } else if (seller.accountStatus === "DEACTIVATED") {
        message = "Your account has been deactivated.";
      } else if (seller.accountStatus === "CLOSED") {
        message = "Your account has been closed.";
      }
      
      return res.status(403).json({
        message: message,
        accountStatus: seller.accountStatus
      });
    }

    req.seller = seller;

    next();
  } catch (error) {
        console.error("Seller auth middleware error:", error); 
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = sellerAuthMiddleware;