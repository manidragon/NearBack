const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const User = require("../models/User");
const Cart = require("../models/Cart");

class CartService {
  async findUserCart(user) {
  
    let cart = await Cart.findOne({ user: user._id }).populate({
      path: "cartItems",
      populate: { path: "product" },
    });

    if (!cart) {
      // If no cart found, you can create a new one or handle as needed
      const newCart = new Cart({ user: user._id, cartItems: [] });
      cart = await newCart.save();
    }

    let totalPrice = 0;
    let totalDiscountedPrice = 0;
    let totalItem = 0;

    cart.cartItems.forEach((cartsItem) => {
      totalPrice += cartsItem.mrpPrice;
      totalDiscountedPrice += cartsItem.sellingPrice;
      totalItem += cartsItem.quantity;
    });
    // console.log("total sellling price",totalDiscountedPrice)
    cart.totalMrpPrice = totalPrice;
    cart.totalItem = cart.cartItems.length;
    cart.totalSellingPrice = totalDiscountedPrice - (cart.couponPrice || 0);
    cart.discount = this.calculateDiscountPercentage(
      totalPrice,
      totalDiscountedPrice
    );
    cart.totalItem = totalItem;

    let cartItems=await CartItem.find({cart:cart._id}).populate("product")
    cart.cartItems = cartItems

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

  async addCartItem(user, product, size, quantity) {
    const cart = await this.findUserCart(user);

    let isPresent = await CartItem.findOne({
      cart: cart._id,
      product: product._id,
      size,
    }).populate("product");



    if (!isPresent) {
      const cartItem = new CartItem({
        product,
        quantity,
        userId: user._id,
        sellingPrice: quantity * product.sellingPrice,
        mrpPrice: quantity * product.mrpPrice,
        size,
        cart: cart._id,
      });

      await cartItem.save();

      let updatedCart = await Cart.findOneAndUpdate(
        { _id: cart._id }, // Match cart by ID
        { $push: { cartItems: cartItem._id } }, // Add cart item ID
        { new: true } // Return the updated document
      );

      console.log("updated cart",updatedCart);
      
      

      return cartItem;
    }

    return isPresent;
  }
}

module.exports = new CartService();
