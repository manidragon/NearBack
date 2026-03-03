// paymentController.js - UPDATED VERSION
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

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    const user = req.user;

    if (!paymentLinkId) {
      return res.status(400).json({ message: "Payment link ID is required" });
    }

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const paymentOrder = await PaymentService.getPaymentOrderByPaymentId(paymentLinkId);
    
    if (!paymentOrder) {
      return res.status(404).json({ message: "Payment order not found" });
    }

    const paymentSuccess = await PaymentService.proceedPaymentOrder(
      paymentOrder,
      paymentId,
      paymentLinkId
    );

    if (paymentSuccess) {
      // ✅ NOW CREATE ACTUAL ORDERS (only after payment success)
      const cart = await Cart.findOne({ user: user._id }).populate('cartItems');
      const shippingAddress = await Address.findById(paymentOrder.shippingAddress);
      
      if (!cart || !shippingAddress) {
        return res.status(400).json({ message: "Cart or shipping address not found" });
      }

      // Create actual orders from cart
      const orders = await OrderService.createOrder(user, shippingAddress, cart);
      
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
              console.log("Updated seller report:", sellerReport._id);
            }
          } catch (reportError) {
            console.error(`Failed to update seller report:`, reportError.message);
          }
        } catch (orderProcessingError) {
          console.error(`Failed to process order ${order._id}:`, orderProcessingError.message);
        }
      }

      // Clear user's cart
      await Cart.findOneAndUpdate(
        { user: user._id },
        { cartItems: [] },
        { new: true }
      );

      return res.status(200).json({
        message: "Payment processed successfully",
        success: true,
        orders: orders.map(o => o._id) // Return order IDs if needed
      });
    } else {
      return res.status(400).json({
        message: "Payment verification failed",
        success: false
      });
    }
  } catch (err) {
    console.error("Payment success handler error:", err);
    return res.status(500).json({
      message: err.message || "Internal server error during payment processing",
      success: false
    });
  }
};

module.exports = {
  paymentSuccessHandler,
};