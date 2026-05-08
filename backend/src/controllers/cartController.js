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

// src/controllers/CartController.js

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

    const { 
      productId, 
      variantId, 
      sellerId, 
      quantity, 
      size, 
      color, 
      specifications,
      offerId  // ✅ Optional: specific offer to use
    } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    // ✅ FIX: Use getProductById WITHOUT filtering params 
    // (we'll do our own variant lookup to avoid double-filtering)
    const product = await ProductService.getProductById(productId, {}); // ✅ Pass empty filters
    
    if (!product || !product.variants || !Array.isArray(product.variants)) {
      return res.status(404).json({ error: "Product not found or has no variants" });
    }

    // ✅ FIX: Robust variant lookup with multiple fallback strategies
    let targetVariant = null;
    
    // Strategy 1: Find by exact variantId (handle ObjectId vs string)
    if (variantId) {
      targetVariant = product.variants.find(v => {
        const vId = v._id?.toString?.() || String(v._id);
        const reqId = String(variantId);
        return vId === reqId;
      });
    }
    
    // Strategy 2: Fallback - find by color + specifications match
    if (!targetVariant && color) {
      targetVariant = product.variants.find(v => {
        const colorMatch = v.color?.toLowerCase() === color.toLowerCase();
        
        // Match all provided specifications
        const specsMatch = specifications 
          ? Object.entries(specifications).every(([key, val]) => {
              const vVal = v.specifications?.[key];
              return vVal?.toLowerCase() === String(val).toLowerCase();
            })
          : true;
          
        return colorMatch && specsMatch;
      });
    }
    
    // Strategy 3: Last resort - find by color only
    if (!targetVariant && color) {
      targetVariant = product.variants.find(v => 
        v.color?.toLowerCase() === color.toLowerCase()
      );
    }

    if (!targetVariant) {
      return res.status(400).json({ 
        error: "Variant not found. Please select a valid variant.",
        debug: { variantId, color, specifications, availableVariants: product.variants.map(v => ({ _id: v._id?.toString?.(), color, specs: v.specifications })) }
      });
    }

    // ✅ FIX: Find the correct OFFER (seller-specific pricing)
    let targetOffer = null;
    
    if (!targetVariant.offers || !Array.isArray(targetVariant.offers)) {
      return res.status(400).json({ error: "Variant has no offers available" });
    }
    
    if (sellerId) {
      // User selected a specific seller - find their offer
      targetOffer = targetVariant.offers.find(o => {
        const oSeller = o.seller?.toString?.() || String(o.seller);
        const reqSeller = String(sellerId);
        return oSeller === reqSeller && o.isActive !== false;
      });
    } else if (offerId) {
      // User specified a specific offer
      targetOffer = targetVariant.offers.find(o => {
        const oId = o._id?.toString?.() || String(o._id);
        return oId === String(offerId) && o.isActive !== false;
      });
    }
    
    // Fallback: Use the BEST offer (lowest price) among active offers with stock
    if (!targetOffer) {
      const activeOffers = targetVariant.offers.filter(o => 
        o.isActive !== false && (o.stock ?? 0) > 0
      );
      
      if (activeOffers.length > 0) {
        targetOffer = activeOffers.reduce((best, curr) => 
          curr.sellingPrice < best.sellingPrice ? curr : best
        );
      }
    }

    if (!targetOffer) {
      return res.status(400).json({ 
        error: "No active offer available for this variant",
        debug: { 
          variantId: targetVariant._id?.toString?.(),
          offersCount: targetVariant.offers?.length,
          activeOffers: targetVariant.offers?.filter(o => o.isActive !== false)?.map(o => ({
            seller: o.seller?.toString?.(),
            price: o.sellingPrice,
            stock: o.stock
          }))
        }
      });
    }

    // ✅ Use offer prices (NOT product-level prices) - prices are PER UNIT
    const unitMrpPrice = targetOffer.mrpPrice;
    const unitSellingPrice = targetOffer.sellingPrice;
    
    // ✅ Calculate totals
    const totalMrpPrice = unitMrpPrice * quantity;
    const totalSellingPrice = unitSellingPrice * quantity;

    // ✅ Create cart item
    const cartItem = await CartService.addCartItem(
      user,
      product._id,
      targetVariant._id,        // ✅ Pass variant ID
      targetOffer._id,          // ✅ Pass offer ID  
      targetOffer.seller,       // ✅ Pass seller ID
      size || color || 'Default',
      quantity,
      unitMrpPrice,             // ✅ Pass unit prices (service will multiply)
      unitSellingPrice
    );

    res.status(202).json({
      success: true,
      message: "Item added to cart",
      data: cartItem
    });
    
  } catch (error) {
    console.error("❌ Add to cart error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to add item to cart",
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
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

    // ✅ Validate quantity
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: "Quantity is required" });
    }
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ error: "Quantity must be a positive number" });
    }

    let updatedCartItem;
    if (qty > 0) {
      updatedCartItem = await CartItemService.updateCartItem(
        user._id,
        cartItemId,
        { quantity: qty }  // ✅ Pass validated number
      );
    }

    res.status(202).json({
      success: true,
      message: "Cart item updated",
       updatedCartItem
    });
    
  } catch (error) {
    console.error("❌ Update cart item error:", error);
    
    if (error.name === 'CartItemError') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: error.message || "Failed to update cart item" 
    });
  }
}
}

module.exports = new CartController();