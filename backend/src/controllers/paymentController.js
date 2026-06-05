// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\paymentController.js
const PaymentService = require("../services/PaymentService");
const UserService = require("../services/UserService");
const SellerService = require("../services/SellerService");
const OrderService = require("../services/OrderService");
const SellerReportService = require("../services/SellerReportService");
const TransactionService = require("../services/TransactionService");
const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Address = require("../models/Address");

const paymentSuccessHandler = async (req, res) => {
  const { paymentId } = req.params;
  const { paymentLinkId } = req.query;

  console.log("🔔 Payment callback received:", {
    paymentId,
    paymentLinkId,
    user: req.user?._id,
    hasUser: !!req.user
  });

  try {
    if (!req.user) {
      console.error("❌ No authenticated user");
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    const user = req.user;

    if (!paymentLinkId) {
      return res.status(400).json({ message: "Payment link ID is required" });
    }

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    // ✅ Find PaymentOrder (supports both MongoDB _id and Razorpay order_id)
    const paymentOrder = await PaymentService.getPaymentOrderByPaymentId(paymentLinkId);

    if (!paymentOrder) {
      return res.status(404).json({ message: "Payment order not found" });
    }

    console.log("✅ PaymentOrder found:", {
      _id: paymentOrder._id,
      status: paymentOrder.status,
      amount: paymentOrder.amount,
      shippingAddress: paymentOrder.shippingAddress
    });

    const paymentSuccess = await PaymentService.proceedPaymentOrder(
      paymentOrder,
      paymentId,
      paymentLinkId
    );

    if (paymentSuccess) {
      // ✅ NOW CREATE ACTUAL ORDERS (only after payment success)

      // Find cart - handle case where cart might not exist
      const cart = await Cart.findOne({ user: user._id })
        .populate({
          path: 'cartItems',
          populate: [
            {
              path: 'product',
              populate: [
                { path: 'seller', select: '_id sellerName businessDetails' },  // ✅ Populate seller
                { path: 'category', select: '_id name' },
                {
                  path: 'variants',  // ✅ Also populate variants if needed
                  populate: {
                    path: 'offers.seller',
                    select: '_id sellerName'
                  }
                }
              ]
            }
          ]
        });

      if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        console.log("⚠️ Cart is empty or not found - orders may have been created already");
        // Don't fail - payment was successful, just skip order creation
        return res.status(200).json({
          message: "Payment processed successfully (cart already cleared)",
          success: true,
          paymentId
        });
      }

      // ✅ Handle shipping address - may be null for SELF_PICKUP
      let shippingAddress = null;
      if (paymentOrder.shippingAddress) {
        shippingAddress = await Address.findById(paymentOrder.shippingAddress);
        if (!shippingAddress) {
          console.error("❌ Shipping address not found:", paymentOrder.shippingAddress);
          return res.status(400).json({ message: "Shipping address not found" });
        }
      }
      // If shippingAddress is null, that's OK for SELF_PICKUP

      console.log("📦 Creating orders with:", {
        userId: user._id,
        cartItems: cart.cartItems.length,
        fulfillmentType: paymentOrder.fulfillmentType || 'DELIVERY',
        hasShippingAddress: !!shippingAddress
      });

      // ✅ Create actual orders from cart
      let orders;
      try {
        orders = await OrderService.createOrder(
          user,
          shippingAddress,
          cart,
          paymentOrder.fulfillmentType || 'DELIVERY',
          paymentOrder.pickupTime
        );

        // ✅ Ensure orders is a valid array
        if (!orders || !Array.isArray(orders)) {
          console.error("❌ OrderService.createOrder did not return an array:", orders);
          orders = [];
        }
      } catch (orderCreationError) {
        console.error("❌ Failed to create orders:", orderCreationError.message);
        return res.status(500).json({
          message: "Failed to create orders: " + orderCreationError.message,
          success: false
        });
      }

      console.log("✅ Orders created:", orders.map(o => o?._id).filter(id => id));

      // Process each newly created order
      for (const order of orders) {
        // ✅ Skip invalid orders
        if (!order || !order._id) {
          console.warn("⚠️ Skipping invalid order:", order);
          continue;
        }

        try {
          // ✅ Create transaction with payment details
          await TransactionService.createTransaction(order._id, {
            paymentStatus: 'COMPLETED',
            paymentMethod: 'RAZORPAY',
            razorpayPaymentId: paymentId,
            razorpayOrderId: paymentLinkId
          });

          // ✅ Null safety for seller - use order.seller or fallback to paymentOrder
          const sellerId = order.seller?._id || order.seller || paymentOrder.user;

          if (!sellerId) {
            console.warn("⚠️ No seller found for order:", order._id, "- skipping report update");
          } else {
            // ✅ Increment seller report atomically
            await SellerReportService.incrementSellerReport(sellerId, {
              orderAmount: order.totalSellingPrice,
              platformFee: 7,
              orderStatus: order.orderStatus,
              isCancelled: false
            });
          }

          console.log("✅ Transaction & report updated for order:", order._id);

        } catch (orderProcessingError) {
          console.error(`⚠️ Failed to process order ${order._id}:`, {
            message: orderProcessingError.message,
            stack: orderProcessingError.stack
          });
          // Don't fail the whole flow for individual order error
        }
      }

      // ✅ Clear user's cart - use cart._id directly
      try {
        console.log("🗑️ Clearing cart for user:", user._id, "cartId:", cart._id);

        // Step 1: Delete all cart item documents
        const deleteResult = await CartItem.deleteMany({ cart: cart._id });
        console.log(`✅ Deleted ${deleteResult.deletedCount} cart items from database`);

        // Step 2: Reset cart document fields
        const updatedCart = await Cart.findByIdAndUpdate(
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
          { new: true, runValidators: true }
        );

        // Step 3: Verify cart was cleared
        if (updatedCart) {
          console.log("✅ Cart reset successfully:", {
            cartId: updatedCart._id,
            itemsCount: updatedCart.cartItems?.length || 0,
            total: updatedCart.totalSellingPrice
          });
        } else {
          console.warn("⚠️ Cart document not found after update");
        }

      } catch (clearError) {
        console.error("⚠️ Failed to clear cart (non-fatal - payment succeeded):", {
          message: clearError.message,
          stack: clearError.stack,
          cartId: cart._id,
          userId: user._id
        });
      }

      return res.status(200).json({
        message: "Payment processed successfully",
        success: true,
        // ✅ Filter out null/undefined order IDs
        orders: orders.map(o => o?._id).filter(id => id),
        paymentId
      });
    } else {
      console.error("❌ Payment verification failed");
      return res.status(400).json({
        message: "Payment verification failed",
        success: false
      });
    }
  } catch (err) {
    console.error("❌ Payment success handler error:", {
      message: err.message,
      stack: err.stack,
      paymentId,
      paymentLinkId
    });

    return res.status(500).json({
      message: "Internal server error during payment processing: " + err.message,
      success: false,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

module.exports = {
  paymentSuccessHandler,
};