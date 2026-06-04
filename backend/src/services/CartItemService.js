// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\CartItemService.js
const CartItem = require("../models/CartItem");
const User = require("../models/User");
const CartItemError = require("../exceptions/CartItemErrror");
const UserError = require("../exceptions/UserError");

class CartItemService {
  async updateCartItem(userId, id, cartItemData) {
    const cartItem = await this.findCartItemById(id);

    // Verify ownership
    if (cartItem.userId.toString() !== userId.toString()) {
      throw new CartItemError("You can't update another user's cart item");
    }

    const newQuantity = cartItemData.quantity;

    // ✅ FIX: Calculate unit prices from existing TOTAL prices
    // cartItem.mrpPrice and cartItem.sellingPrice are TOTALS (unit * old quantity)
    const oldQuantity = cartItem.quantity || 1;
    const unitMrpPrice = cartItem.mrpPrice / oldQuantity;
    const unitSellingPrice = cartItem.sellingPrice / oldQuantity;

    // ✅ Calculate new TOTAL prices
    const updatedFields = {
      quantity: newQuantity,
      mrpPrice: unitMrpPrice * newQuantity,      // ✅ Now a valid number
      sellingPrice: unitSellingPrice * newQuantity, // ✅ Now a valid number
      updatedAt: new Date()
    };

    // ✅ Validate prices are valid numbers before saving
    if (isNaN(updatedFields.mrpPrice) || isNaN(updatedFields.sellingPrice)) {
      throw new CartItemError("Invalid price calculation. Please refresh and try again.");
    }

   return await CartItem.findByIdAndUpdate(id, updatedFields, {
  new: true,
  runValidators: true
}).populate({
  path: "product",
  populate: [
    { path: "seller", select: "sellerName businessDetails.businessName" },
    { path: "category" }
  ]
})
.populate("sellerId"); 
  }

  // Remove a cart item from the user's cart
  async removeCartItem(userId, cartItemId) {
    // console.log(`userId: ${userId}, cartItemId: ${cartItemId}`);

    // Find cart item by ID
    const cartItem = await this.findCartItemById(cartItemId);


    if (cartItem.userId.toString() === userId.toString()) {
      // Delete the cart item
      await CartItem.deleteOne({ _id: cartItem._id });
    } else {
      throw new UserError("You can't remove another user's item");
    }
  }

  // Find a cart item by its ID
  async findCartItemById(cartItemId) {
    const cartItem = await CartItem.findById(cartItemId).populate("product");

    if (!cartItem) {
      throw new CartItemError(`Cart item not found with id: ${cartItemId}`);
    }

    return cartItem;
  }
}

module.exports = new CartItemService();
