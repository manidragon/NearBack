// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\CartService.js
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const User = require("../models/User");
const Cart = require("../models/Cart");

class CartService {
  async findUserCart(user) {
    
    let cart = await Cart.findOne({ user: user._id });

    if (!cart) {
      const newCart = new Cart({ user: user._id, cartItems: [] });
      cart = await newCart.save();
      return cart;
    }

    try {
      cart = await Cart.findOne({ user: user._id })
        .populate({
          path: "cartItems",
          populate: [
            {
              path: "product",
              populate: [
                {
                  path: "seller",
                  select: "sellerName businessDetails.businessName businessDetails.logo"
                },
                {
                  path: "variants",
                  populate: {
                    path: "offers.seller",
                    select: "sellerName businessDetails.businessName"
                  }
                },
                { path: "category" }
              ]
            },
            {
              path: "sellerId",
              select: "sellerName businessDetails.businessName district"
            }
          ]
        });
    } catch (populateError) {
      console.error('❌ [STEP 3] Population failed:', populateError);
    }

    cart.cartItems = cart.cartItems.map(item => {
      if (item.sellerId && typeof item.sellerId === 'object') {
        item.sellerName = item.sellerId.businessDetails?.businessName ||
          item.sellerId.sellerName;
      }
      return item;
    });

    let totalPrice = 0;
    let totalDiscountedPrice = 0;
    let totalItem = 0;

    cart.cartItems.forEach((cartItem, index) => {
      totalPrice += cartItem.mrpPrice || 0;
      totalDiscountedPrice += cartItem.sellingPrice || 0;
      totalItem += cartItem.quantity || 0;
    });

    cart.totalMrpPrice = totalPrice;
    cart.totalSellingPrice = totalDiscountedPrice - (cart.couponPrice || 0);
    cart.totalItem = totalItem;
    cart.discount = this.calculateDiscountPercentage(totalPrice, totalDiscountedPrice);

    return cart;
  }

  calculateDiscountPercentage(mrpPrice, sellingPrice) {
    if (mrpPrice <= 0) {
      return 0;
    }
    const discount = mrpPrice - sellingPrice;
    const discountPercentage = (discount / mrpPrice) * 100;
    return Math.round(discountPercentage);
  }

  async addCartItem(
    user,
    productId,
    variantId,
    offerId,
    sellerId,
    size,
    quantity,
    unitMrpPrice,
    unitSellingPrice
  ) {
    const cart = await this.findUserCart(user);

    // ✅ Check if item already exists (same product + variant + size + seller)
    let existingItem = await CartItem.findOne({
      cart: cart._id,
      product: productId,
      size: size,
      ...(variantId && { variantId: variantId }),
      ...(sellerId && { sellerId: sellerId }),
    }).populate("product");

    if (!existingItem) {
      // ✅ Create new cart item with TOTAL prices (unit * quantity)
      const cartItem = new CartItem({
        cart: cart._id,
        product: productId,
        variantId: variantId,      // ✅ Track which variant
        sellerId: sellerId,         // ✅ Track which seller's offer
        offerId: offerId,           // ✅ Track specific offer
        size: size,
        quantity: quantity,
        // ✅ Store TOTAL prices (already multiplied)
        mrpPrice: unitMrpPrice * quantity,
        sellingPrice: unitSellingPrice * quantity,
        userId: user._id,
      });

      await cartItem.save();

      // Update cart with new item reference
      await Cart.findByIdAndUpdate(
        cart._id,
        { $push: { cartItems: cartItem._id } },
        { new: true }
      );

      return cartItem;
    }

    // ✅ Item exists - update quantity and recalculate TOTAL prices
    existingItem.quantity += quantity;
    existingItem.mrpPrice = unitMrpPrice * existingItem.quantity;
    existingItem.sellingPrice = unitSellingPrice * existingItem.quantity;

    await existingItem.save();
    return existingItem;
  }
}

module.exports = new CartService();
