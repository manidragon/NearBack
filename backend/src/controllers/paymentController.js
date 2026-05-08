// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\paymentController.js
const PaymentService = require("../services/PaymentService");
const UserService = require("../services/UserService");
const SellerService = require("../services/SellerService");
const OrderService = require("../services/OrderService");
const SellerReportService = require("../services/SellerReportService");
const TransactionService = require("../services/TransactionService");
const Cart = require("../models/Cart");
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
      const cart = await Cart.findOne({ user: user._id }).populate('cartItems');
      
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
      // Pass fulfillmentType and pickupTime if available
      const orders = await OrderService.createOrder(
        user, 
        shippingAddress, 
        cart,
        paymentOrder.fulfillmentType || 'DELIVERY',
        paymentOrder.pickupTime
      );
      
      console.log("✅ Orders created:", orders.map(o => o._id));
      
      // Process each newly created order
      for (let order of orders) {
        try {
          // Create transaction
          await TransactionService.createTransaction(order._id);

          // Update seller report
          try {
            const seller = await SellerService.getSellerById(order.seller);
            if (seller) {
              let sellerReport = await SellerReportService.getSellerReport(seller._id);
              
              sellerReport.totalOrders += 1;
              sellerReport.totalEarnings += order.totalSellingPrice;
              sellerReport.totalSales += order.orderItems.length;

              await SellerReportService.updateSellerReport(sellerReport);
              console.log("✅ Updated seller report:", sellerReport._id);
            }
          } catch (reportError) {
            console.error(`⚠️ Failed to update seller report:`, reportError.message);
            // Don't fail the whole flow for report update error
          }
        } catch (orderProcessingError) {
          console.error(`⚠️ Failed to process order ${order._id}:`, orderProcessingError.message);
          // Don't fail the whole flow for individual order error
        }
      }

      // ✅ Clear user's cart - use cart._id directly
      try {
        await CartItem.deleteMany({ cart: cart._id });
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
        console.log("✅ Cart cleared for user:", user._id);
      } catch (clearError) {
        console.error("⚠️ Failed to clear cart:", clearError.message);
        // Don't fail the whole flow for cart clearing error
      }

      return res.status(200).json({
        message: "Payment processed successfully",
        success: true,
        orders: orders.map(o => o._id),
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