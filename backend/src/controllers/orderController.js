const OrderService = require("../services/OrderService");
const CartService = require("../services/CartService");
const UserService = require("../services/UserService");
const OrderError = require("../exceptions/OrderError");
const PaymentMethod = require("../domain/PaymentMethod");
const PaymentService = require("../services/PaymentService");
const PaymentOrder = require("../models/PaymentOrder");
const Address = require("../models/Address");
const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");

class OrderController {
  // Create a payment session (NOT actual orders)
  // Create a payment session OR place order directly (for COD/Self Pickup)
 async createOrder(req, res, next) {
  const { shippingAddress, fulfillmentType = 'DELIVERY', pickupTime } = req.body; // 👈 Extract pickupTime
  const { paymentMethod } = req.query;

  try {
    const user = await req.user;

    // ✅ FETCH CART EARLY — needed for both COD and online payments
    const cart = await CartService.findUserCart(user);
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return res.status(400).json({ message: "Cannot place order: cart is empty" });
    }


    // 🔹 Handle Self Pickup: no user shipping address needed
    let addressDoc = null;
    if (fulfillmentType === 'SELF_PICKUP') {
      // We'll use seller's pickup address during order creation
      // So no need to validate or create user address here
    } else {
      // 🔹 Regular delivery: validate/create shipping address
      if (shippingAddress._id) {
        const userHasAddress = user.addresses.some(addr => {
          const addrId = typeof addr === 'object' ? addr._id : addr;
          return addrId.toString() === shippingAddress._id.toString();
        });

        if (!userHasAddress) {
          throw new OrderError("Invalid shipping address: not associated with user");
        }

        addressDoc = await Address.findById(shippingAddress._id);
        if (!addressDoc) {
          throw new OrderError("Shipping address not found");
        }
      } else {
        addressDoc = await Address.create(shippingAddress);
      }
    }



    const totalAmount = cart.totalSellingPrice;

    console.log("Creating order for user:", user._id);
    console.log("Fulfillment type:", fulfillmentType);
    console.log("Payment method:", paymentMethod);
    console.log("Pickup time:", pickupTime); // 👈 Log pickupTime

    // ✅ CASE 1: Cash on Delivery (with or without self-pickup)
    if (paymentMethod === 'CASH_ON_DELIVERY') {
      // Create actual orders immediately — no payment session
      const orders = await OrderService.createOrder(
        user,
        addressDoc,           // null if self-pickup
        cart,
        fulfillmentType,      // 👈 Pass fulfillment type
        pickupTime            // 👈 Pass pickupTime
      );

      // ✅ FIX: Clear cart items AND cart using cart._id
      try {
        console.log('🔍 Clearing cart with ID:', cart._id);
        
        // Step 1: Delete all cart item documents from database
        const deletedItems = await CartItem.deleteMany({ cart: cart._id });
        console.log(`🗑️ Deleted ${deletedItems.deletedCount} cart items`);
        
        // Step 2: Clear the cart document
        const cartClearResult = await Cart.findByIdAndUpdate(
          cart._id,  // 👈 Use cart ID instead of querying by user
          { 
            cartItems: [], 
            totalSellingPrice: 0, 
            totalItem: 0, 
            totalMrpPrice: 0, 
            discount: 0,
            couponCode: null,
            couponPrice: 0
          },
          { new: true }
        );

        console.log('✅ Cart clear result:', cartClearResult);
        
        if (!cartClearResult) {
          console.error('❌ Cart clearing FAILED - cart not found');
        } else {
          console.log('✅ Cart cleared successfully!');
          console.log('   Cart ID:', cartClearResult._id);
          console.log('   Items:', cartClearResult.cartItems.length);
          console.log('   Total:', cartClearResult.totalSellingPrice);
        }
      } catch (clearError) {
        console.error('❌ Cart clearing error:', clearError);
        console.error('❌ Error stack:', clearError.stack);
      }

      return res.status(200).json({
        success: true,
        message: "Order placed successfully",
        orders: orders.map(o => o._id)
      });
    }

    // ✅ CASE 2: Online Payment (Razorpay/Stripe) → create payment session
    // Note: Self Pickup with online payment is allowed (e.g., pay online, pick up in store)

    const paymentOrder = new PaymentOrder({
      user: user._id,
      amount: totalAmount,
      paymentMethod: paymentMethod,
      shippingAddress: addressDoc?._id || null, // null for self-pickup
      pickupTime: pickupTime || null, // 👈 Store pickupTime for later use
      status: "PENDING"
    });

    await paymentOrder.save();

    const response = {};

    if (paymentMethod === PaymentMethod.RAZORPAY) {
      const payment = await PaymentService.createRazorpayPaymentLink(
        user,
        paymentOrder.amount,
        paymentOrder._id
      );
      response.payment_link_url = payment.short_url;
      paymentOrder.paymentLinkId = payment.id;
      await paymentOrder.save();

    } else if (paymentMethod === PaymentMethod.STRIPE) {
      const paymentUrl = await PaymentService.createStripePaymentLink(
        user,
        paymentOrder.amount,
        paymentOrder._id
      );
      response.payment_link_url = paymentUrl;

    } else {
      // This should not happen if frontend sends valid methods
      await paymentOrder.deleteOne();
      return res.status(400).json({ message: "Invalid payment method" });
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error("Order creation error:", error);
    return res.status(500).json({
      message: `Failed to process order: ${error.message || 'Unknown error'}`
    });
  }
}

  // Get order by ID
  async getOrderById(req, res, next) {
    try {
      const { orderId } = req.params;
      const order = await OrderService.findOrderById(orderId);
      return res.status(200).json(order);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  async getOrderItemById(req, res, next) {
    try {
      const { orderItemId } = req.params;
      const orderItem = await OrderService.findOrderItemById(orderItemId);
      return res.status(200).json(orderItem);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  // Get user's order history
  async getUserOrderHistory(req, res) {
    try {
      const userId = await req.user._id;
      const orderHistory = await OrderService.usersOrderHistory(userId);
      return res.status(200).json(orderHistory);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  // Get orders for a specific seller (shop)
  async getSellersOrders(req, res) {
    try {
      const sellerId = req.seller._id;
      const orders = await OrderService.getShopsOrders(sellerId);
      return res.status(200).json(orders);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { orderId, orderStatus } = req.params;

      const updatedOrder = await OrderService.updateOrderStatus(
        orderId,
        orderStatus
      );
      return res
        .status(200)
        .json(updatedOrder);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  // Cancel an order
  async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;
      const canceledOrder = await OrderService.cancelOrder(orderId, userId);
      return res
        .status(200)
        .json({
          message: "Order cancelled successfully",
          order: canceledOrder,
        });
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  // Delete an order
  async deleteOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      await OrderService.deleteOrder(orderId);
      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  
}

module.exports = new OrderController();