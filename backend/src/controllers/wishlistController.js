// src/controllers/WishlistController.js
const WishlistService = require("../services/WishllistService");
const UserService = require("../services/UserService");
const ProductService = require("../services/ProductService");


class WishlistController {
  // Get wishlist by user ID
  async getWishlistByUserId(req, res) {
    try {
      // 🔑 Handle guest users
      if (!req.user) {
        return res.status(200).json({
          wishlistItems: [],
          _id: null,
          user: null
        });
      }

      // 🔑 Block non-customers
      if (req.user.role !== "ROLE_CUSTOMER") {
        return res.status(403).json({
          message: "Access denied: Only customers can access wishlist"
        });
      }

      const wishlist = await WishlistService.getWishlistByUserId(req.user);
      return res.status(200).json(wishlist);
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Error fetching wishlist: ${error.message}` });
    }
  }

  // Add or remove a product from the wishlist
  async addProductToWishlist(req, res) {
    try {
      const { productId } = req.params;

      // 🔑 Require authentication for modifications
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required to modify wishlist"
        });
      }

      // 🔑 Block non-customers
      if (req.user.role !== "ROLE_CUSTOMER") {
        return res.status(403).json({
          message: "Access denied: Only customers can modify wishlist"
        });
      }

      const product = await ProductService.findProductById(productId);
      const updatedWishlist = await WishlistService.addProductToWishlist(
        req.user,
        product
      );
      return res.status(200).json(updatedWishlist);
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Error updating wishlist: ${error.message}` });
    }
  }

  async removeProductFromWishlist(req, res) {
  try {
    const { productId } = req.params;

    if (!req.user) {
      return res.status(401).json({ 
        message: "Authentication required to modify wishlist" 
      });
    }

    if (req.user.role !== "ROLE_CUSTOMER") {
      return res.status(403).json({ 
        message: "Access denied: Only customers can modify wishlist" 
      });
    }

    const product = await ProductService.findProductById(productId);
    
    const updatedWishlist = await WishlistService.removeProductFromWishlist(
      req.user,
      product._id
    );
    
    return res.status(200).json(updatedWishlist);
  } catch (error) {
    console.error("❌ Remove from wishlist error:", error);
    return res
      .status(500)
      .json({ message: `Error removing from wishlist: ${error.message}` });
  }
}
}

module.exports = new WishlistController();