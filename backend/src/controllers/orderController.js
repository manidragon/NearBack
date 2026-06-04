// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\orderController.js
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
const razorpay = require("../config/razorpayClient");

class OrderController {
  async createOrder(req, res, next) {
    // ✅ Extract finalAmount from frontend (includes shipping, fees, discount)
    const { shippingAddress, fulfillmentType = 'DELIVERY', pickupTime, finalAmount } = req.body;
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

      const subtotal = cart.totalSellingPrice;
      const shippingCost = 0; // Your shipping logic
      const platformFee = 7; // Your platform fee logic
      const discount = cart.couponPrice || 0;

      // ✅ Use finalAmount from frontend if provided (trusted after validation), else calculate here
      const totalAmount = finalAmount !== undefined && finalAmount > 0
        ? finalAmount
        : subtotal + shippingCost + platformFee - discount;

      console.log("💰 Final Amount Calculation:", {
        subtotal,
        shipping: shippingCost,
        platformFee,
        discount,
        finalAmountFromFrontend: finalAmount,
        usedAmount: totalAmount
      });

      console.log("Creating order for user:", user._id);
      console.log("Fulfillment type:", fulfillmentType);
      console.log("Payment method:", paymentMethod);
      console.log("Pickup time:", pickupTime);


      // ✅ CASE 1: Cash on Delivery (with or without self-pickup)
      if (paymentMethod === 'CASH_ON_DELIVERY') {
        // Create actual orders immediately — no payment session
        const orders = await OrderService.createOrder(
          req.user,
          shippingAddress,
          cart,
          fulfillmentType,
          pickupTime,
          req.query.paymentMethod || 'RAZORPAY'
        );

        // ✅ FIX: Clear cart items AND cart using cart._id
        try {
          console.log('🔍 Clearing cart with ID:', cart._id);
          const deletedItems = await CartItem.deleteMany({ cart: cart._id });
          console.log(`🗑️ Deleted ${deletedItems.deletedCount} cart items`);

          const cartClearResult = await Cart.findByIdAndUpdate(
            cart._id,
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
        } catch (clearError) {
          console.error('❌ Cart clearing error:', clearError);
        }

        return res.status(200).json({
          success: true,
          message: "Order placed successfully",
          orders: orders.map(o => o._id)
        });
      }

      // ✅✅✅ NEW CASE 2: WALLET PAYMENT
      if (paymentMethod === 'WALLET') {
        console.log('💳 Processing wallet payment for user:', user._id);

        // Step 1: Verify wallet balance
        const WalletService = require('../services/WalletService');
        const balanceCheck = await WalletService.verifyBalance(user._id, totalAmount);

        if (!balanceCheck.sufficient) {
          return res.status(400).json({
            success: false,
            message: `Insufficient wallet balance. Required: ₹${totalAmount}, Available: ₹${balanceCheck.currentBalance}`,
            currentBalance: balanceCheck.currentBalance,
            requiredAmount: totalAmount,
            deficit: balanceCheck.deficit
          });
        }

        // Step 2: Create the order first (to get order IDs)
        const orders = await OrderService.createOrder(
          req.user,
          shippingAddress,
          cart,
          fulfillmentType,
          pickupTime,
          'WALLET'  // ✅ Pass WALLET as payment method
        );

      // Step 3: Deduct from wallet using FINAL AMOUNT (includes platform fee)
try {
    console.log('💳 Deducting from wallet:', {
        finalAmount,  // ✅ Use the total amount from frontend
        ordersCount: orders.length
    });
    
    // ✅ Deduct the FULL amount (including platform fee) from wallet
    const updatedWallet = await WalletService.debitWallet(
        user._id,
        finalAmount,  // ✅ Use finalAmount (65), not order.totalSellingPrice (58)
        'ORDER_PAYMENT',
        orders[0]._id,  // Link to first order (or create a combined reference)
        'Order',
        `Payment for ${orders.length} order(s) - Total: ₹${finalAmount}`
    );
    
    console.log('💳 Wallet debited successfully:', {
        amount: finalAmount,
        newBalance: updatedWallet.balance
    });
    
    // Create transaction records for EACH order
    for (const order of orders) {
        try {
            const TransactionService = require('../services/TransactionService');
            await TransactionService.createTransaction(order._id, {
                paymentStatus: 'COMPLETED',
                paymentMethod: 'WALLET',
                razorpayPaymentId: null,
                razorpayOrderId: null
            });
            console.log(`✅ WALLET Transaction created for order: ${order._id}`);
        } catch (txErr) {
            console.error('⚠️ Failed to create WALLET transaction:', txErr.message);
        }
    }
    
    console.log('💳 Wallet payment successful:', {
        totalDeducted: finalAmount,
        ordersCount: orders.length,
        finalBalance: updatedWallet.balance
    });
    
} catch (walletError) {
    console.error('❌ Wallet deduction failed:', walletError);
    
    // ❌ CRITICAL: Rollback - Delete created orders if wallet deduction fails
    for (const order of orders) {
        await Order.findByIdAndDelete(order._id);
        console.log('🔄 Rolled back order:', order._id);
    }
    
    return res.status(400).json({
        success: false,
        message: walletError.message || 'Wallet payment failed'
    });
}

        // Step 4: Clear cart (same as COD)
        try {
          console.log('🔍 Clearing cart with ID:', cart._id);
          const deletedItems = await CartItem.deleteMany({ cart: cart._id });
          console.log(`🗑️ Deleted ${deletedItems.deletedCount} cart items`);

          await Cart.findByIdAndUpdate(
            cart._id,
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
          console.log('✅ Cart cleared after wallet payment');
        } catch (clearError) {
          console.error('❌ Cart clearing error:', clearError);
        }

        // Step 5: Return success response
        return res.status(200).json({
          success: true,
          message: "Order placed successfully using wallet",
          orders: orders.map(o => o._id),
          paymentMethod: 'WALLET',
          totalAmount: totalAmount
        });
      }

      // ✅ CASE 3: Online Payment (Razorpay/Stripe) → create payment session
      const paymentOrder = new PaymentOrder({
        user: user._id,
        amount: totalAmount,
        paymentMethod: "RAZORPAY",
        shippingAddress: addressDoc?._id || null,
        pickupTime: pickupTime || null,
        fulfillmentType: fulfillmentType,
        status: "PENDING"
      });

      await paymentOrder.save();

      // ✅ RAZORPAY ONLY: Create Order for Desktop Modal
      try {
        console.log("🔗 Creating Razorpay ORDER for modal (amount: ₹" + totalAmount + ")");

        // ✅ Create Razorpay Order (for modal popup) - NOT payment link
        const razorpayOrder = await razorpay.orders.create({
          amount: totalAmount * 100,  // Convert ₹ to paise
          currency: 'INR',
          receipt: `order_${paymentOrder._id}`,
          notes: {
            paymentOrderId: paymentOrder._id.toString(),
            userId: user._id.toString(),
            fulfillmentType: fulfillmentType
          }
        });

        console.log("✅ Razorpay Order created:", razorpayOrder.id);

        // ✅ Return order details for frontend modal (desktop view)
        const response = {
          success: true,
          type: 'RAZORPAY_ORDER',  // ✅ Flag for frontend to open modal
          razorpayOrder: {
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,      // in paise
            currency: razorpayOrder.currency,
            customer: {
              name: user.fullName || 'Customer',
              email: user.email,
              contact: user.mobile || ''
            }
          },
          paymentOrderId: paymentOrder._id,    // For callback verification
          fulfillmentType: fulfillmentType,    // Pass to frontend
          pickupTime: pickupTime               // Pass to frontend
        };

        // ✅ Save razorpay order ID for reference
        paymentOrder.paymentLinkId = razorpayOrder.id;
        await paymentOrder.save();

        return res.status(200).json(response);

      } catch (razorpayError) {
        console.error("❌ Razorpay order creation failed:", {
          name: razorpayError.name,
          message: razorpayError.message,
          description: razorpayError.description,
          statusCode: razorpayError.statusCode
        });

        // Cleanup: Delete the PaymentOrder if Razorpay fails
        await paymentOrder.deleteOne();

        const errorMsg = razorpayError.description
          || razorpayError.error?.description
          || razorpayError.message
          || 'Unknown Razorpay error';

        return res.status(500).json({
          message: "Failed to initialize payment: " + errorMsg
        });
      }

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
