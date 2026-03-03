const CartItem = require("../models/CartItem");
const User = require("../models/User");
const CartItemError = require("../exceptions/CartItemErrror");
const UserError = require("../exceptions/UserError");

class CartItemService {
  async updateCartItem(userId, id, cartItemData) {
    const cartItem = await this.findCartItemById(id);

    // console.log(cartItem,userId)

    if (cartItem.userId.toString() === userId.toString()) {
      const updatedFields = {
        quantity: cartItemData.quantity,
        mrpPrice: cartItemData.quantity * cartItem.product.mrpPrice,
        sellingPrice: cartItemData.quantity * cartItem.product.sellingPrice,
      };

      // Save updated cart item
      return await CartItem.findByIdAndUpdate(id, updatedFields, {
        new: true,
      }).populate("product");
    } else {
      throw new CartItemError("You can't update another user's cart item");
    }
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
