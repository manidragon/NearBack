// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\SellerReportService.js
const OrderStatus = require("../domain/OrderStatus");
const SellerReport = require("../models/SellerReport");  // ✅ FIXED: Correct filename
const Order = require("../models/Order");

class SellerReportService {

  // ✅ ENHANCED: Get or create seller report (doesn't recalculate all orders)
  async getSellerReport(seller) {
    try {
      // ✅ Find existing report or create new one
      let sellerReport = await SellerReport.findOne({ seller: seller._id });

      if (!sellerReport) {
        // Initialize new report with zero values
        sellerReport = new SellerReport({
          seller: seller._id,
          totalEarnings: 0,
          totalSales: 0,
          totalRefunds: 0,
          totalTax: 0,
          netEarnings: 0,
          totalOrders: 0,
          canceledOrders: 0,
          totalTransactions: 0
        });
        await sellerReport.save();
        console.log("📊 New seller report created for:", seller._id);
      }

      return sellerReport;
    } catch (err) {
      console.error("❌ Error fetching seller report:", err);
      throw new Error(`Error fetching seller report: ${err.message}`);
    }
  }

  // ✅ NEW: Incrementally update seller report when order is created/paid
  async incrementSellerReport(sellerId, orderData) {
    try {
      const {
        orderAmount,
        platformFee = 0,
        orderStatus = OrderStatus.PLACED,
        isCancelled = false
      } = orderData;

      const netEarnings = orderAmount - platformFee;

      // ✅ Use atomic $inc for race-condition safety
      const update = {
        $inc: {},
        $set: { updatedAt: new Date() }
      };

      // Always increment total orders
      update.$inc.totalOrders = 1;
      update.$inc.totalTransactions = 1;

      if (isCancelled || orderStatus === OrderStatus.CANCELLED) {
        // Cancelled order: increment canceled count, add to refunds
        update.$inc.canceledOrders = 1;
        update.$inc.totalRefunds = orderAmount;
        // Don't add to earnings for cancelled orders
      } else {
        // Successful order: add to earnings and sales
        update.$inc.totalEarnings = orderAmount;
        update.$inc.totalSales = 1;  // Count of successful sales
        update.$inc.netEarnings = netEarnings;
        update.$inc.totalTax = 0;  // Add tax calculation if needed
      }

      const updatedReport = await SellerReport.findOneAndUpdate(
        { seller: sellerId },
        update,
        { new: true, upsert: true, runValidators: true }
      );

      console.log("📈 Seller report updated:", {
        sellerId,
        orderAmount,
        platformFee,
        netEarnings,
        status: orderStatus
      });

      return updatedReport;
    } catch (err) {
      console.error("❌ Error incrementing seller report:", err);
      throw new Error(`Error updating seller report: ${err.message}`);
    }
  }

  // ✅ NEW: Decrement seller report when order is cancelled/refunded
  async decrementSellerReport(sellerId, refundData) {
    try {
      console.log('📉 Adjusting seller report:', { sellerId, amount: refundData.amount });

      let sellerReport = await SellerReport.findOne({ seller: sellerId });

      // ✅ Create report if not exists
      if (!sellerReport) {
        sellerReport = new SellerReport({
          seller: sellerId,
          totalRefunds: refundData.amount,
          netEarnings: -refundData.amount
        });
      } else {
        // ✅ Safe updates with null checks
        sellerReport.totalRefunds = (sellerReport.totalRefunds || 0) + refundData.amount;
        sellerReport.netEarnings = (sellerReport.netEarnings || 0) - refundData.amount;

        // ✅ Fix: Ensure transactions array exists before unshift
        if (!sellerReport.transactions) {
          sellerReport.transactions = [];
        }
        sellerReport.transactions.unshift({
          type: 'REFUND',
          amount: refundData.amount,
          reason: refundData.reason || 'Return refund',
          referenceId: refundData.referenceId,
          createdAt: new Date()
        });
      }

      await sellerReport.save();
      console.log('✅ Seller report adjusted');

    } catch (error) {
      // ✅ Don't fail the main flow for report errors
      console.error('⚠️ Seller report adjustment failed (non-critical):', error.message);
      // Continue without throwing - refund already initiated
    }
  }

  // ✅ UPDATED: Update seller report (for manual adjustments or bulk sync)
  async updateSellerReport(sellerReport) {
    try {
      // ✅ Validate required fields
      if (!sellerReport._id || !sellerReport.seller) {
        throw new Error('Seller report must have _id and seller fields');
      }

      // ✅ Only update specific fields, don't replace entire document
      const updateFields = {
        totalEarnings: sellerReport.totalEarnings,
        totalSales: sellerReport.totalSales,
        totalRefunds: sellerReport.totalRefunds,
        totalTax: sellerReport.totalTax,
        netEarnings: sellerReport.netEarnings,
        totalOrders: sellerReport.totalOrders,
        canceledOrders: sellerReport.canceledOrders,
        totalTransactions: sellerReport.totalTransactions,
        updatedAt: new Date()
      };

      return await SellerReport.findByIdAndUpdate(
        sellerReport._id,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
    } catch (err) {
      console.error("❌ Error updating seller report:", err);
      throw new Error(`Error updating seller report: ${err.message}`);
    }
  }

  // ✅ NEW: Recalculate seller report from scratch (for data repair)
async recalculateSellerReport(sellerId) {
  try {
    console.log("🔄 Recalculating seller report for:", sellerId);

    // Get all orders for this seller with populated orderItems and returnRequest
    const orders = await Order.find({ seller: sellerId })
      .populate({
        path: 'orderItems',
        populate: {
          path: 'returnRequest',
          select: 'status refundStatus refundAmount'
        }
      });

    let totalEarnings = 0;
    let totalSales = 0;
    let totalRefunds = 0;
    let totalOrders = orders.length;
    let canceledOrders = 0;

    for (const order of orders) {
      // ✅ Case 1: Cancelled order - exclude from earnings, add to refunds
      if (order.orderStatus === OrderStatus.CANCELLED) {
        canceledOrders++;
        totalRefunds += order.totalSellingPrice;
        continue;
      }

      // ✅ Case 2: Delivered order with COMPLETED payment
      if (order.paymentStatus === 'COMPLETED') {
        // Calculate refunded amount for this order
        const refundedAmount = order.orderItems?.reduce((sum, item) => {
          // ✅ Check if item has a COMPLETED return with COMPLETED refund
          if (item.returnRequest && 
              item.returnRequest.status === 'COMPLETED' && 
              item.returnRequest.refundStatus === 'COMPLETED') {
            return sum + (item.returnRequest.refundAmount || item.sellingPrice);
          }
          return sum;
        }, 0) || 0;

        // Add net earnings (total - refunded)
        const orderNetEarnings = order.totalSellingPrice - refundedAmount;
        
        if (orderNetEarnings > 0) {
          totalEarnings += orderNetEarnings;
          totalSales++;
        }
        
        // Track total refunds
        if (refundedAmount > 0) {
          totalRefunds += refundedAmount;
        }
      }
    }

    const platformFeeTotal = totalEarnings * 0;  // 0% for now
    const netEarnings = totalEarnings - platformFeeTotal;

    // ✅ Update or create report with calculated values
    const report = await SellerReport.findOneAndUpdate(
      { seller: sellerId },
      {
        $set: {
          totalEarnings,
          totalSales,
          totalRefunds,
          totalTax: 0,
          netEarnings,
          totalOrders,
          canceledOrders,
          totalTransactions: totalSales + canceledOrders,
          lastRecalculated: new Date(),
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    console.log("✅ Seller report recalculated:", {
      sellerId,
      totalOrders,
      totalEarnings,
      totalRefunds,
      netEarnings
    });

    return report;
  } catch (err) {
    console.error("❌ Error recalculating seller report:", err);
    throw new Error(`Error recalculating seller report: ${err.message}`);
  }
}
}

module.exports = new SellerReportService();