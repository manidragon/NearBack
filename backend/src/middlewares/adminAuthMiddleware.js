// D:\Mani\Code with Zosh\Backup\source code\backend\src\middlewares\adminAuthMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Seller = require('../models/Seller');
const jwtProvider = require('../utils/jwtProvider'); // ✅ Use existing jwtProvider for consistency

/**
 * ✅ Generic authentication middleware (for any authenticated user)
 * Attaches req.user with user/seller data
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // ✅ Validate Authorization header format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is missing or invalid'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is missing'
      });
    }

    // ✅ Verify token using jwtProvider (consistent with rest of app)
    const payload = jwtProvider.verifyJwt(token);
    
    // ✅ Try to find user in User model first, then Seller model
    let user = await User.findById(payload.userId).select('-password');
    
    if (!user) {
      user = await Seller.findById(payload.userId).select('-password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ Attach user to request for downstream handlers
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * ✅ Admin-only authentication middleware
 * Checks if authenticated user has ROLE_ADMIN
 * Works for both User and Seller models
 */
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // ✅ Validate Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is missing or invalid'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is missing'
      });
    }

    // ✅ Verify token using jwtProvider
    const payload = jwtProvider.verifyJwt(token);
    
    // ✅ CHECK ROLE FROM JWT PAYLOAD (fast, no DB query needed)
    if (payload.role !== 'ROLE_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        yourRole: payload.role
      });
    }

    // ✅ Fetch user for route handlers (optional, but useful for audit logs)
    let adminUser = await User.findById(payload.userId).select('-password');
    
    if (!adminUser) {
      adminUser = await Seller.findById(payload.userId).select('-password');
    }

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // ✅ Attach admin user to request
    req.admin = adminUser;
    req.userId = adminUser._id;
    req.userRole = payload.role;
    
    next();
  } catch (error) {
    console.error('❌ Admin auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * ✅ Optional: Seller-only middleware (for seller-specific routes)
 */
const sellerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is missing or invalid'
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwtProvider.verifyJwt(token);
    
    // ✅ Check if user is a seller with ROLE_SELLER
    if (payload.role !== 'ROLE_SELLER') {
      return res.status(403).json({
        success: false,
        message: 'Seller access required',
        yourRole: payload.role
      });
    }

    const seller = await Seller.findById(payload.userId).select('-password');
    
    if (!seller) {
      return res.status(401).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // ✅ Check account status
    if (seller.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Account is ${seller.accountStatus.toLowerCase()}`,
        accountStatus: seller.accountStatus
      });
    }

    req.seller = seller;
    req.userId = seller._id;
    req.userRole = payload.role;
    
    next();
  } catch (error) {
    console.error('❌ Seller auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = { auth, adminAuth, sellerAuth };