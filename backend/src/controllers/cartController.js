// src/controllers/CartController.js
const CartService = require("../services/CartService");
const UserService = require("../services/UserService");
const ProductService = require("../services/ProductService");
const CartItemService = require("../services/CartItemService");

class CartController {
  async findUserCartHandler(req, res) {
    try {
      // 🔑 Handle guest users
      if (!req.user) {
        return res.status(200).json({
          cartItems: [],
          totalSellingPrice: 0,
          totalMrpPrice: 0,
          _id: null,
          user: null
        });
      }

      // 🔑 Block non-customers
      if (req.user.role !== "ROLE_CUSTOMER") {
        return res.status(403).json({ 
          error: "Access denied: Only customers can access cart" 
        });
      }

      const cart = await CartService.findUserCart(req.user);
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addItemToCart(req, res) {
    try {
      const user = req.user;

      // 🔑 Validate user
      if (!user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }
      if (user.role !== "ROLE_CUSTOMER") {
        return res.status(403).json({ error: "Access denied: Only customers can modify cart" });
      }

      const product = await ProductService.findProductById(req.body.productId);
      const cartItem = await CartService.addCartItem(
        user,
        product,
        req.body.size,
        req.body.quantity
      );

      res.status(202).json(cartItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteCartItemHandler(req, res) {
    try {
      const user = req.user;

      // 🔑 Validate user
      if (!user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }
      if (user.role !== "ROLE_CUSTOMER") {
        return res.status(403).json({ error: "Access denied: Only customers can modify cart" });
      }

      await CartItemService.removeCartItem(user._id, req.params.cartItemId);
      res.status(202).json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCartItemHandler(req, res) {
    try {
      const user = req.user;
      const { quantity } = req.body;
      const cartItemId = req.params.cartItemId;

      // 🔑 Validate user
      if (!user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }
      if (user.role !== "ROLE_CUSTOMER") {
        return res.status(403).json({ error: "Access denied: Only customers can modify cart" });
      }

      let updatedCartItem;
      if (quantity > 0) {
        updatedCartItem = await CartItemService.updateCartItem(
          user._id,
          cartItemId,
          { quantity }
        );
      }

      res.status(202).json(updatedCartItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CartController();