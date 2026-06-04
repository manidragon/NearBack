// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\TransactionService.js
const Transaction = require('../models/Transaction');
const Seller = require('../models/Seller');
const Order = require('../models/Order');

// ✅ Platform fee configuration (can move to env/config later)
const PLATFORM_FEE_PERCENTAGE = 0;  // 0% for now, or set to 0.05 for 5%
const PLATFORM_FEE_FIXED = 7;       // ₹7 fixed fee per order

class TransactionService {

  // ✅ ENHANCED: Create transaction with full payment details
  async createTransaction(orderId, paymentDetails = {}) {
    const order = await Order.findById(orderId).populate('seller');
    if (!order) {
      throw new Error('Order not found');
    }

    const seller = await Seller.findById(order.seller._id);
    if (!seller) {
      throw new Error('Seller not found');
    }

    // ✅ CORRECTED CALCULATION:
    const orderAmount = order.totalSellingPrice;  // ₹100 (what seller earns)
    const platformFee = this._calculatePlatformFee(orderAmount);  // ₹7
    const totalPaidByCustomer = orderAmount + platformFee;  // ₹107 (customer pays)
    const netAmount = orderAmount;  // ₹100 (seller receives full selling price)

    // ✅ Check if transaction already exists (prevent duplicates)
    const existingTx = await Transaction.findOne({ order: orderId });
    if (existingTx) {
      console.log("⚠️ Transaction already exists for order:", orderId);
      return existingTx;
    }

    // ✅ Create transaction with CORRECT payment details
    const transaction = new Transaction({
      seller: seller._id,
      customer: order.user,
      order: order._id,
      // ✅ Payment fields:
      amount: totalPaidByCustomer,  // ₹107 (total customer paid)
      platformFee: platformFee,     // ₹7
      netAmount: netAmount,         // ₹100 (seller earnings)
      paymentStatus: paymentDetails.paymentStatus || 'COMPLETED',
      paymentMethod: paymentDetails.paymentMethod || 'RAZORPAY',
      razorpayPaymentId: paymentDetails.razorpayPaymentId || null,
      razorpayOrderId: paymentDetails.razorpayOrderId || null,
      date: new Date()
    });

    console.log("💰 Transaction created:", {
      orderId,
      totalPaidByCustomer,  // ₹107
      platformFee,          // ₹7
      netAmount,            // ₹100 (seller gets this)
      status: transaction.paymentStatus
    });

    return await transaction.save();
  }

  // ✅ Helper: Calculate platform fee
  _calculatePlatformFee(orderAmount) {
    const percentageFee = orderAmount * PLATFORM_FEE_PERCENTAGE;
    return Math.round(percentageFee + PLATFORM_FEE_FIXED);
  }

  // ✅ NEW: Update transaction status (for refunds, etc.)
  async updateTransactionStatus(transactionId, updates) {
    const allowedUpdates = ['paymentStatus', 'refundAmount', 'refundReason'];
    const validUpdates = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        validUpdates[key] = updates[key];
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }

    return await Transaction.findByIdAndUpdate(
      transactionId,
      { $set: validUpdates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  // ✅ ENHANCED: Get transactions by seller with date range
async getTransactionsBySellerId(sellerId, options = {}) {
  const { startDate, endDate, status } = options;
  
  const query = { seller: sellerId };
  
  // ✅ Filter transactions by THEIR date field (not order date)
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  if (status) {
    query.paymentStatus = status;
  }

  return await Transaction.find(query)
    // ✅ Populate order with orderItems and their returnRequest
    .populate({
      path: 'order',
      select: 'orderStatus totalSellingPrice totalMrpPrice orderDate deliverDate fulfillmentType createdAt', // ✅ Added createdAt as fallback
      populate: {
        path: 'orderItems',
        populate: {
          path: 'returnRequest',
          select: 'status refundStatus refundAmount'
        }
      }
    })
    // ✅ Populate customer
    .populate('customer', 'fullName email mobile')
    // ✅ Populate seller for reference
    .populate('seller', 'sellerName businessDetails.businessName')
    // ✅ Sort by transaction date descending (newest first)
    .sort({ date: -1 });
}

// ✅ ENHANCED: Get seller earnings summary (excludes refunded items)
async getSellerEarningsSummary(sellerId, startDate, endDate) {
  const query = { 
    seller: sellerId,
    paymentStatus: 'COMPLETED'
  };
  
  // ✅ Filter transactions by THEIR date field
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // ✅ Step 1: Get base summary from transactions
  const baseSummary = await Transaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$amount' },
        totalPlatformFees: { $sum: '$platformFee' },
        totalNet: { $sum: '$netAmount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);

  // ✅ Step 2: Calculate refunded amounts from completed returns
  // Fetch orders with populated orderItems and returnRequest
  const orders = await Order.find({ 
    seller: sellerId,
    paymentStatus: 'COMPLETED'
  })
  .populate({
    path: 'orderItems',
    populate: {
      path: 'returnRequest',
      select: 'status refundStatus refundAmount'
    }
  });

  // ✅ Filter orders by transaction date (not order date)
  // First, get the transaction dates for this seller
  const transactionDates = await Transaction.find(
    { seller: sellerId, paymentStatus: 'COMPLETED' },
    { order: 1, date: 1 }
  );
  
  const orderDateMap = new Map(
    transactionDates.map(tx => [tx.order.toString(), tx.date])
  );

  // Filter by date range using transaction date
  const filteredOrders = orders.filter(order => {
    if (!startDate && !endDate) return true;
    
    const txDate = orderDateMap.get(order._id.toString());
    if (!txDate) return false; // Skip if no transaction found
    
    const orderDate = new Date(txDate);
    if (startDate && orderDate < new Date(startDate)) return false;
    if (endDate && orderDate > new Date(endDate)) return false;
    return true;
  });

  // Calculate total refunded amount from COMPLETED returns
  const totalRefundedAmount = filteredOrders.reduce((sum, order) => {
    const orderRefunded = order.orderItems?.reduce((itemSum, item) => {
      if (item.returnRequest && 
          item.returnRequest.status === 'COMPLETED' && 
          item.returnRequest.refundStatus === 'COMPLETED') {
        return itemSum + (item.returnRequest.refundAmount || item.sellingPrice);
      }
      return itemSum;
    }, 0) || 0;
    return sum + orderRefunded;
  }, 0);

  const base = baseSummary[0] || {
    totalGross: 0,
    totalPlatformFees: 0,
    totalNet: 0,
    transactionCount: 0
  };

  // ✅ Return summary with refunded amounts deducted
  return {
    totalGross: base.totalGross,
    totalPlatformFees: base.totalPlatformFees,
    totalNet: base.totalNet,
    transactionCount: base.transactionCount,
    refundedAmount: totalRefundedAmount,
    netAfterReturns: base.totalNet - totalRefundedAmount
  };
}

  // Get all transactions (admin use)
  async getAllTransactions() {
    return await Transaction.find()
      .populate('seller', 'sellerName businessDetails.businessName')
      .populate('order', 'orderStatus totalSellingPrice')
      .populate('customer', 'fullName email')
      .sort({ date: -1 });
  }
}

module.exports = new TransactionService();