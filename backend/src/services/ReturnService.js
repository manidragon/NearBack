// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\ReturnService.js
const ReturnRequest = require('../models/ReturnRequest');
const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const SellerReportService = require('./SellerReportService');
const TransactionService = require('./TransactionService');
const OrderStatus = require('../domain/OrderStatus');
const PaymentStatus = require('../domain/PaymentStatus');
const WalletService = require('./WalletService');
const razorpay = require('../config/razorpayClient');
const axios = require('axios');
const Transaction = require('../models/Transaction');


// ============================================================================
// ✅ RAZORPAY REFUND HELPER (Handles different SDK versions)
// ============================================================================
const createRazorpayRefund = async (paymentId, amountInPaise, notes) => {
  // Method 1: Standard SDK v2.x (most common)
  if (typeof razorpay.refunds?.create === 'function') {
    return await razorpay.refunds.create({
      payment_id: paymentId,
      amount: amountInPaise,
      notes
    });
  }

  // Method 2: Older SDK - payments.refund endpoint
  if (typeof razorpay.payments?.refund === 'function') {
    return await razorpay.payments.refund(paymentId, {
      amount: amountInPaise,
      notes
    });
  }

  // Method 3: Direct HTTP API call (last resort)

  const response = await axios.post(
    'https://api.razorpay.com/v1/refunds',
    { payment_id: paymentId, amount: amountInPaise, notes },
    {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      },
      headers: { 'Content-Type': 'application/json' }
    }
  );
  return response.data;
};

// ✅ Custom error class (matches your OrderError pattern)
class ReturnError extends Error {
  constructor(message, code = 'RETURN_ERROR') {
    super(message);
    this.name = 'ReturnError';
    this.code = code;
  }
}

// ✅ Return window configuration (Phase 1: 7 days from delivery)
const RETURN_WINDOW_DAYS = 7;

class ReturnService {

  // ============================================================================
  // ✅ CREATE RETURN REQUEST
  // ============================================================================
  async createReturn(customer, orderItemId, returnData) {
    try {
      console.log('🔄 Creating return request:', {
        customer: customer._id,
        orderItemId
      });

      // 🔍 Validate order item exists and belongs to customer
      const orderItem = await OrderItem.findById(orderItemId)
        .populate('product')
        .populate({
          path: 'product',
          populate: { path: 'seller', select: '_id sellerName businessDetails.businessName' }
        });

      if (!orderItem) {
        throw new ReturnError('Order item not found', 'ITEM_NOT_FOUND');
      }

      if (orderItem.userId.toString() !== customer._id.toString()) {
        throw new ReturnError('Unauthorized: This item does not belong to you', 'UNAUTHORIZED');
      }

      // ✅ VALIDATION: Check refund amount
      const refundAmount = orderItem.sellingPrice;

      if (!refundAmount || refundAmount <= 0) {
        throw new ReturnError('Invalid item price for refund', 'INVALID_AMOUNT');
      }

      // 🔍 Fetch parent order for status/window validation
      const order = await Order.findOne({ orderItems: orderItemId })
        .populate('seller');

      if (!order) {
        throw new ReturnError('Parent order not found', 'ORDER_NOT_FOUND');
      }

      // ✅ VALIDATION 1: Check return eligibility window
      const orderDeliveredDate = order.orderStatus === OrderStatus.DELIVERED
        ? order.updatedAt
        : null;

      if (orderDeliveredDate) {
        const daysSinceDelivery = Math.floor(
          (Date.now() - new Date(orderDeliveredDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
          throw new ReturnError(
            `Return window expired. Returns allowed within ${RETURN_WINDOW_DAYS} days of delivery.`,
            'RETURN_WINDOW_EXPIRED'
          );
        }
      }

      // ✅ VALIDATION 2: Check if item already has a pending/active return
      const existingReturn = await ReturnRequest.findOne({
        orderItem: orderItemId,
        status: { $in: ['PENDING', 'APPROVED', 'PICKED_UP'] }
      });

      if (existingReturn) {
        throw new ReturnError(
          `Return request already exists for this item (Status: ${existingReturn.status})`,
          'DUPLICATE_RETURN'
        );
      }

      // ✅ Create return request
      const returnRequest = new ReturnRequest({
        orderItem: orderItem._id,
        order: order._id,
        seller: order.seller._id,
        customer: customer._id,

        reason: returnData.reason,
        description: returnData.description?.trim(),
        images: returnData.images?.slice(0, 5) || [],

        refundAmount,
        refundMethod: returnData.refundMethod || 'WALLET',

        status: 'PENDING',

        pickupAddress: returnData.pickupAddress || {
          street: order.shippingAddress?.address || '',
          city: order.shippingAddress?.city || '',
          district: order.shippingAddress?.district || '',
          pincode: order.shippingAddress?.pinCode || ''
        }
      });

      await returnRequest.save();

      // ✅✅✅ CRITICAL: Update OrderItem with returnRequest reference
      // This is the missing piece!
      await OrderItem.findByIdAndUpdate(
        orderItemId,
        { $set: { returnRequest: returnRequest._id } },
        { new: true }
      );

      console.log('✅ Return request created & linked to OrderItem:', {
        returnId: returnRequest._id,
        seller: order.seller._id,
        refundAmount,
        status: returnRequest.status,
        orderItemId: orderItemId,
        orderItemUpdated: true
      });

      // ✅ Return populated request for frontend
      return await ReturnRequest.findById(returnRequest._id)
        .populate('seller', 'sellerName businessDetails.businessName')
        .populate('orderItem')
        .populate({
          path: 'orderItem',
          populate: { path: 'product', select: 'title images' }
        });

    } catch (error) {
      console.error('❌ ReturnService.createReturn error:', error);

      if (error instanceof ReturnError) {
        throw error;
      }

      throw new ReturnError(`Failed to create return: ${error.message}`, 'CREATE_FAILED');
    }
  }

  // ============================================================================
  // ✅ GET RETURNS BY SELLER (for seller dashboard)
  // ============================================================================
  async getReturnsBySeller(sellerId, filters = {}) {
    try {
      console.log('🔍 Fetching returns for seller:', sellerId, filters);

      const query = {
        seller: sellerId,
        // ✅ Match: isReplacement is false OR field doesn't exist
        $or: [
          { isReplacement: false },
          { isReplacement: { $exists: false } }
        ]
      };

      // ✅ Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.orderId) {
        query.order = filters.orderId;
      }
      if (filters.dateFrom) {
        query.createdAt = { $gte: new Date(filters.dateFrom) };
      }
      if (filters.dateTo) {
        query.createdAt = {
          ...query.createdAt,
          $lte: new Date(filters.dateTo)
        };
      }

      const returns = await ReturnRequest.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .populate('customer', 'fullName email mobile')
        .populate({
          path: 'orderItem',
          populate: [
            { path: 'product', select: 'title images' },
            { path: 'product.seller', select: 'businessDetails.businessName' }
          ]
        })
        .populate('order', 'orderStatus fulfillmentType');

      console.log(`✅ Found ${returns.length} returns for seller ${sellerId}`);

      return returns;

    } catch (error) {
      console.error('❌ ReturnService.getReturnsBySeller error:', error);
      throw new ReturnError(`Failed to fetch returns: ${error.message}`, 'FETCH_FAILED');
    }
  }

  // ============================================================================
  // ✅ GET RETURNS BY CUSTOMER (for order history)
  // ============================================================================
  async getReturnsByCustomer(customerId, filters = {}) {
    try {
      console.log('🔍 Fetching returns for customer:', customerId);

      const query = {
        customer: customerId,
        // ✅ Match: isReplacement is false OR field doesn't exist
        $or: [
          { isReplacement: false },
          { isReplacement: { $exists: false } }
        ]
      };

      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.orderId) {
        query.order = filters.orderId;
      }

      const returns = await ReturnRequest.find(query)
        .sort({ createdAt: -1 })
        .populate({
          path: 'orderItem',
          populate: [
            { path: 'product', select: 'title images variants' },
            { path: 'product.seller', select: 'businessDetails.businessName' }
          ]
        })
        .populate('order', 'orderStatus fulfillmentType deliverDate')
        .populate('seller', 'businessDetails.businessName');

      console.log(`✅ Found ${returns.length} returns for customer ${customerId}`);

      return returns;

    } catch (error) {
      console.error('❌ ReturnService.getReturnsByCustomer error:', error);
      throw new ReturnError(`Failed to fetch returns: ${error.message}`, 'FETCH_FAILED');
    }
  }

  // ============================================================================
  // ✅ APPROVE RETURN (seller action)
  // ============================================================================
  async approveReturn(sellerId, returnId) {
    try {
      console.log('👍 Approving return:', returnId, 'by seller:', sellerId);

      // ✅ Use the centralized updateReturnStatus method for type-aware validation
      return await this.updateReturnStatus(returnId, 'APPROVED', sellerId);

    } catch (error) {
      console.error('❌ ReturnService.approveReturn error:', error);
      if (error instanceof ReturnError) throw error;
      throw new ReturnError(`Failed to approve return: ${error.message}`, 'APPROVE_FAILED');
    }
  }

  // ============================================================================
  // ✅ REJECT RETURN (seller action)
  // ============================================================================
  async rejectReturn(sellerId, returnId, reason) {
    try {
      console.log('👎 Rejecting return:', returnId, 'by seller:', sellerId);

      const returnRequest = await ReturnRequest.findById(returnId);
      if (!returnRequest) {
        throw new ReturnError('Return request not found', 'NOT_FOUND');
      }

      // ✅ Verify seller ownership
      if (returnRequest.seller.toString() !== sellerId.toString()) {
        throw new ReturnError('Unauthorized: You can only reject returns for your items', 'UNAUTHORIZED');
      }

      // ✅ Use centralized method for type-aware validation
      return await this.updateReturnStatus(returnId, 'REJECTED', sellerId, { rejectedReason: reason });

    } catch (error) {
      console.error('❌ ReturnService.rejectReturn error:', error);
      if (error instanceof ReturnError) throw error;
      throw new ReturnError(`Failed to reject return: ${error.message}`, 'REJECT_FAILED');
    }
  }

  // ============================================================================
  // ✅ UPDATE RETURN STATUS (with proper refund processing)
  // ============================================================================
  async updateReturnStatus(returnId, newStatus, updatedBy, options = {}) {
    try {
      console.log('🔄 Updating return status:', { returnId, newStatus, updatedBy });

      const returnRequest = await ReturnRequest.findById(returnId)
        .populate('orderItem')
        .populate('order')
        .populate('seller')
        .populate('customer', '_id email fullName');

      if (!returnRequest) {
        throw new ReturnError('Return request not found', 'NOT_FOUND');
      }

      // ✅ Validate seller ownership
      const sellerId = updatedBy?.toString ? updatedBy.toString() : updatedBy;
      const returnSellerId = returnRequest.seller?._id?.toString() || returnRequest.seller?.toString();

      if (returnSellerId !== sellerId) {
        throw new ReturnError('Unauthorized: You can only update returns for your items', 'UNAUTHORIZED');
      }

      // ✅ Valid status transitions - Type-aware
      const validTransitions = returnRequest.isReplacement
        ? {
          'PENDING': ['APPROVED', 'REJECTED', 'CANCELLED'],
          'APPROVED': ['ORIGINAL_RETURNED', 'CANCELLED'],
          'ORIGINAL_RETURNED': ['REVIEW_COMPLETED', 'REJECTED'],
          'REVIEW_COMPLETED': ['REPLACEMENT_SHIPPED', 'CANCELLED'],
          'REPLACEMENT_SHIPPED': ['COMPLETED', 'CANCELLED'],
          'COMPLETED': [],
          'CANCELLED': [],
          'REJECTED': []
        }
        : {
          'PENDING': ['APPROVED', 'REJECTED', 'CANCELLED'],
          'APPROVED': ['PICKED_UP', 'CANCELLED'],
          'PICKED_UP': ['COMPLETED', 'CANCELLED'],
          'COMPLETED': [],
          'CANCELLED': [],
          'REJECTED': []
        };

      const currentStatus = returnRequest.status;
      const allowedNextStatuses = validTransitions[currentStatus] || [];

      if (!allowedNextStatuses.includes(newStatus)) {
        throw new ReturnError(
          `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedNextStatuses.join(', ') || 'none'}`,
          'INVALID_STATUS_TRANSITION'
        );
      }

      // ✅ Process status-specific logic
      if (newStatus === 'ORIGINAL_RETURNED') {
        returnRequest.originalReturnedAt = new Date();
        console.log('✅ Original item returned by customer');

      } else if (newStatus === 'REVIEW_COMPLETED') {
        returnRequest.reviewCompletedAt = new Date();
        if (options.reviewNotes) {
          returnRequest.reviewNotes = options.reviewNotes;
        }

        // ✅ CREATE REPLACEMENT ORDER HERE (after review is complete)
        if (returnRequest.isReplacement && !returnRequest.replacementOrder) {
          try {
            console.log('🔄 Creating replacement order after review completion...');

            const originalOrderItem = await OrderItem.findById(returnRequest.orderItem).populate('product');
            const originalOrder = await Order.findById(returnRequest.order);

            if (!originalOrderItem || !originalOrder) {
              throw new ReturnError('Original order or item not found', 'ORDER_NOT_FOUND');
            }

            const replacementSize = originalOrderItem.size;
            const originalPrice = originalOrderItem.sellingPrice;
            const replacementPrice = returnRequest.replacementVariant.sellingPrice;
            const priceDifference = replacementPrice - originalPrice;

            const replacementOrderItem = new OrderItem({
              product: originalOrderItem.product._id,
              size: replacementSize,
              quantity: originalOrderItem.quantity,
              mrpPrice: originalOrderItem.mrpPrice,
              sellingPrice: replacementPrice,
              userId: returnRequest.customer,
              variantId: returnRequest.replacementVariant.variantId
            });
            const savedReplacementItem = await replacementOrderItem.save();

            const replacementOrder = new Order({
              user: returnRequest.customer,
              seller: returnRequest.seller,
              orderItems: [savedReplacementItem._id],
              shippingAddress: originalOrder.shippingAddress,
              totalMrpPrice: originalOrderItem.mrpPrice,
              totalSellingPrice: replacementPrice,
              discount: 0,
              orderStatus: OrderStatus.PLACED,
              fulfillmentType: originalOrder.fulfillmentType,
              totalItem: 1,
              paymentMethod: originalOrder.paymentMethod,
              paymentStatus: priceDifference > 0 ? PaymentStatus.PENDING : PaymentStatus.COMPLETED,
              orderDate: new Date(),
              deliverDate: originalOrder.deliverDate,
              pickupTime: originalOrder.pickupTime,
              replacementFor: originalOrderItem._id,
              replacementStatus: 'PENDING',
              priceDifference: priceDifference
            });

            const savedReplacementOrder = await replacementOrder.save();
            returnRequest.replacementOrder = savedReplacementOrder._id;

            console.log('✅ Replacement order created:', savedReplacementOrder._id);
          } catch (orderError) {
            console.error('❌ Failed to create replacement order:', orderError);
            throw new ReturnError(`Failed to create replacement order: ${orderError.message}`, 'ORDER_CREATION_FAILED');
          }
        }

        console.log('✅ Review completed, ready to ship replacement');

      } else if (newStatus === 'REPLACEMENT_SHIPPED') {
        returnRequest.replacementShippedAt = new Date();

        if (returnRequest.replacementOrder) {
          await Order.findByIdAndUpdate(
            returnRequest.replacementOrder,
            {
              $set: {
                orderStatus: 'SHIPPED',
                replacementStatus: 'REPLACEMENT_SHIPPED'
              }
            }
          );
        }
        console.log('✅ Replacement order shipped to customer');

      } else if (newStatus === 'COMPLETED') {
        returnRequest.completedAt = new Date();
      }

      // ✅✅✅ CRITICAL FIX: Update status FIRST, then save, then process refund
      returnRequest.status = newStatus;
      returnRequest.updatedAt = new Date();
      await returnRequest.save();

      console.log('✅ Return status updated:', {
        returnId: returnRequest._id.toString(),
        oldStatus: currentStatus,
        newStatus,
        completedAt: returnRequest.completedAt
      });

      // ✅ NOW process refund AFTER status is COMPLETED
      if (newStatus === 'COMPLETED') {
        if (returnRequest.isReplacement) {
          // REPLACEMENT: Update replacement order status
          if (returnRequest.replacementOrder) {
            await Order.findByIdAndUpdate(
              returnRequest.replacementOrder,
              {
                $set: {
                  orderStatus: 'DELIVERED',
                  replacementStatus: 'COMPLETED'
                }
              }
            );
          }
          console.log('✅ Replacement flow completed');
        } else {
          // ✅ REGULAR RETURN: Process refund!
          if (returnRequest.refundMethod === 'WALLET' && returnRequest.refundStatus !== 'COMPLETED') {
            try {
              console.log('💰 Processing wallet refund...');
              const refundResult = await this.processRefund(returnRequest);
              returnRequest.refundStatus = 'COMPLETED';
              await returnRequest.save(); // ✅ Save the updated refundStatus
              console.log('✅ Wallet refund processed:', refundResult);
            } catch (refundError) {
              console.error('❌ Failed to process wallet refund:', refundError.message);
              returnRequest.refundStatus = 'FAILED';
              await returnRequest.save(); // ✅ Save the failed status
            }
          } else if (returnRequest.refundMethod === 'RAZORPAY') {
            // For Razorpay, we wait for webhook to update status
            returnRequest.refundStatus = 'PROCESSING';
            await returnRequest.save(); // ✅ Save the processing status
            console.log('⏳ Razorpay refund initiated, waiting for webhook...');
          }

          console.log('✅ Regular return completed');
        }
      }

      return returnRequest;

    } catch (error) {
      console.error('❌ ReturnService.updateReturnStatus error:', error);
      if (error instanceof ReturnError) throw error;
      throw new ReturnError(`Failed to update return status: ${error.message}`, 'UPDATE_FAILED');
    }
  }

  // ============================================================================
  // ✅ PROCESS REFUND (credit wallet, adjust seller report)
  // ============================================================================
  async processRefund(returnRequest) {
    try {
      console.log('💰 Processing refund for return:', returnRequest._id);

      // ✅ Validate return is completed and wallet method
      if (returnRequest.status !== 'COMPLETED') {
        throw new ReturnError('Can only process refund for COMPLETED returns', 'INVALID_STATUS');
      }

      if (returnRequest.refundMethod !== 'WALLET') {
        throw new ReturnError(`Refund method ${returnRequest.refundMethod} not supported in Phase 1`, 'UNSUPPORTED_METHOD');
      }

      const { customer, refundAmount, _id: returnId } = returnRequest;

      // ✅ Step 1: Credit customer wallet
      const wallet = await Wallet.getOrCreate(customer);

      await wallet.credit(
  refundAmount,
  'RETURN_REFUND',
  returnId,
  'ReturnRequest',
  `Refund for return #${returnId.toString().slice(-6)}`  // ✅ FIXED: Short, clean note
);

      console.log('✅ Wallet credited:', {
        userId: customer,
        amount: refundAmount,
        newBalance: wallet.balance,
        returnId
      });

      // ✅ Step 2: Adjust seller report (deduct earnings)
      try {
        await SellerReportService.decrementSellerReport(returnRequest.seller, {
          orderAmount: refundAmount,
          platformFee: 7,  // Match your platform fee logic
          refundReason: returnRequest.reason
        });

        console.log('✅ Seller report adjusted for refund:', {
          sellerId: returnRequest.seller,
          deductedAmount: refundAmount
        });
      } catch (reportError) {
        console.error('⚠️ Failed to adjust seller report:', reportError.message);
        // Don't fail refund for report error - log and continue
      }

      // ✅ Step 3: Update transaction status (optional, for audit)
      try {
        const transaction = await TransactionService.getTransactionByOrder(returnRequest.order);

        if (transaction) {
          // Note: For partial returns, we'd need orderItem-level transactions
          // Phase 1: Just log the refund reference
          await TransactionService.addRefundNote(transaction._id, {
            returnId,
            refundAmount,
            refundMethod: 'WALLET'
          });

          console.log('✅ Transaction updated with refund note:', transaction._id);
        }
      } catch (txError) {
        console.error('⚠️ Failed to update transaction:', txError.message);
        // Don't fail refund for transaction error
      }

      // ✅ Return summary
      return {
        success: true,
        refundAmount,
        walletBalance: wallet.balance,
        returnId: returnRequest._id,
        message: `₹${refundAmount} credited to wallet`
      };

    } catch (error) {
      console.error('❌ ReturnService.processRefund error:', error);

      if (error instanceof ReturnError) {
        throw error;
      }

      throw new ReturnError(`Failed to process refund: ${error.message}`, 'REFUND_FAILED');
    }
  }

  // ============================================================================
  // ✅ CANCEL RETURN (customer action - before approval)
  // ============================================================================
  async cancelReturn(customerId, returnId) {
    try {
      console.log('❌ Cancelling return:', returnId, 'by customer:', customerId);

      const returnRequest = await ReturnRequest.findById(returnId);

      if (!returnRequest) {
        throw new ReturnError('Return request not found', 'NOT_FOUND');
      }

      // ✅ Verify customer ownership
      if (returnRequest.customer.toString() !== customerId.toString()) {
        throw new ReturnError('Unauthorized: You can only cancel your own returns', 'UNAUTHORIZED');
      }

      // ✅ Only allow cancellation before approval
      if (returnRequest.status !== 'PENDING') {
        throw new ReturnError(
          `Cannot cancel return with status: ${returnRequest.status}`,
          'INVALID_STATUS_FOR_CANCELLATION'
        );
      }

      // ✅ Update status
      returnRequest.status = 'CANCELLED';
      returnRequest.cancelledBy = customerId;
      returnRequest.cancelledAt = new Date();

      await returnRequest.save();

      console.log('✅ Return cancelled:', returnId);

      return await ReturnRequest.findById(returnId)
        .populate('seller', 'businessDetails.businessName');

    } catch (error) {
      console.error('❌ ReturnService.cancelReturn error:', error);

      if (error instanceof ReturnError) {
        throw error;
      }

      throw new ReturnError(`Failed to cancel return: ${error.message}`, 'CANCEL_FAILED');
    }
  }

  // ============================================================================
  // ✅ GET RETURN BY ID (with population)
  // ============================================================================
  async getReturnById(returnId) {
    try {
      const returnRequest = await ReturnRequest.findById(returnId)
        .populate('seller', 'sellerName businessDetails.businessName district')
        .populate('customer', 'fullName email mobile')
        .populate({
          path: 'orderItem',
          populate: [
            { path: 'product', select: 'title images variants' },
            { path: 'product.seller', select: 'businessDetails.businessName' }
          ]
        })
        .populate('order', 'orderStatus fulfillmentType deliverDate pickupTime');

      if (!returnRequest) {
        throw new ReturnError('Return request not found', 'NOT_FOUND');
      }

      return returnRequest;

    } catch (error) {
      console.error('❌ ReturnService.getReturnById error:', error);
      throw new ReturnError(`Failed to fetch return: ${error.message}`, 'FETCH_FAILED');
    }
  }

  // ============================================================================
  // ✅ PHASE 3: CREATE REPLACEMENT REQUEST
  // ============================================================================
  async createReplacementRequest(customer, orderItemId, replacementData) {
    try {
      console.log('🔄 Creating replacement request:', {
        customer: customer._id,
        orderItemId,
        replacementVariant: replacementData.replacementVariant
      });

      // 🔍 Validate original order item exists and belongs to customer
      const originalOrderItem = await OrderItem.findById(orderItemId)
        .populate('product')
        .populate({
          path: 'product',
          populate: { path: 'seller', select: '_id sellerName businessDetails.businessName' }
        });

      if (!originalOrderItem) {
        throw new ReturnError('Order item not found', 'ITEM_NOT_FOUND');
      }

      if (originalOrderItem.userId.toString() !== customer._id.toString()) {
        throw new ReturnError('Unauthorized: This item does not belong to you', 'UNAUTHORIZED');
      }

      // 🔍 Fetch parent order for validation
      const originalOrder = await Order.findOne({ orderItems: orderItemId })
        .populate('seller');

      if (!originalOrder) {
        throw new ReturnError('Parent order not found', 'ORDER_NOT_FOUND');
      }

      // ✅ VALIDATION 1: Check replacement eligibility (same as return window)
      const orderDeliveredDate = originalOrder.orderStatus === OrderStatus.DELIVERED
        ? originalOrder.updatedAt
        : null;

      if (orderDeliveredDate) {
        const daysSinceDelivery = Math.floor(
          (Date.now() - new Date(orderDeliveredDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
          throw new ReturnError(
            `Replacement window expired. Replacements allowed within ${RETURN_WINDOW_DAYS} days of delivery.`,
            'REPLACEMENT_WINDOW_EXPIRED'
          );
        }
      }

      // ✅ VALIDATION 2: Check if replacement already exists
      const existingReplacement = await ReturnRequest.findOne({
        orderItem: orderItemId,
        isReplacement: true,
        status: { $in: ['PENDING', 'APPROVED', 'PICKED_UP'] }
      });

      if (existingReplacement) {
        throw new ReturnError(
          `Replacement request already exists for this item (Status: ${existingReplacement.status})`,
          'DUPLICATE_REPLACEMENT'
        );
      }

      // ✅ VALIDATION 3: Fetch replacement variant details from Product
      const Product = require('../models/Product');
      const product = await Product.findById(originalOrderItem.product._id);

      if (!product) {
        throw new ReturnError('Product not found', 'PRODUCT_NOT_FOUND');
      }

      const replacementVariant = product.variants?.find(
        v => v._id.toString() === replacementData.replacementVariant.variantId
      );

      if (!replacementVariant) {
        throw new ReturnError('Replacement variant not found', 'VARIANT_NOT_FOUND');
      }

      // ✅ VALIDATION 4: Check stock availability
      const offer = replacementVariant.offers?.find(
        o => o.seller?.toString() === originalOrder.seller._id.toString() && o.isActive !== false
      );

      if (!offer || offer.stock < 1) {
        throw new ReturnError('Replacement variant out of stock', 'OUT_OF_STOCK');
      }

      // ✅ Calculate price difference
      const originalPrice = originalOrderItem.sellingPrice;
      const replacementPrice = replacementData.replacementVariant.sellingPrice || offer.sellingPrice;
      const priceDifference = replacementPrice - originalPrice;  // Positive = customer pays more

      // ✅ Create replacement return request (links original item to replacement)
      const replacementReturn = new ReturnRequest({
        orderItem: originalOrderItem._id,
        order: originalOrder._id,
        seller: originalOrder.seller._id,
        customer: customer._id,

        reason: replacementData.reason || 'Replacement requested',
        description: replacementData.description?.trim(),
        images: replacementData.images?.slice(0, 5) || [],

        // ✅ Replacement-specific fields
        isReplacement: true,
        replacementVariant: {
          variantId: replacementVariant._id.toString(),
          color: replacementVariant.color,
          specifications: replacementVariant.specifications,
          sellingPrice: replacementPrice,
          stock: offer.stock
        },

        // ✅ Refund/charge amount based on price difference
        refundAmount: priceDifference < 0 ? Math.abs(priceDifference) : 0,  // Only refund if cheaper
        refundMethod: priceDifference < 0 ? (replacementData.refundMethod || 'WALLET') : null,

        status: 'PENDING',  // Awaiting seller approval

        pickupAddress: replacementData.pickupAddress || {
          street: originalOrder.shippingAddress?.address || '',
          city: originalOrder.shippingAddress?.city || '',
          district: originalOrder.shippingAddress?.district || '',
          pincode: originalOrder.shippingAddress?.pinCode || ''
        }
      });

      await replacementReturn.save();

      // ✅ Update original OrderItem with replacement reference
      await OrderItem.findByIdAndUpdate(
        orderItemId,
        { $set: { replacementRequest: replacementReturn._id } },
        { new: true }
      );

      console.log('✅ Replacement request created (order will be created after review):', {
        returnId: replacementReturn._id,
        priceDifference,
        status: replacementReturn.status,
        note: 'Replacement order will be created when seller completes review'
      });

      // ✅ Return populated replacement request
      return await ReturnRequest.findById(replacementReturn._id)
        .populate('seller', 'sellerName businessDetails.businessName')
        .populate('orderItem')
        .populate({
          path: 'orderItem',
          populate: { path: 'product', select: 'title images variants' }
        })

    } catch (error) {
      console.error('❌ ReturnService.createReplacementRequest error:', error);

      if (error instanceof ReturnError) {
        throw error;
      }

      throw new ReturnError(`Failed to create replacement: ${error.message}`, 'CREATE_FAILED');
    }
  }


  // ============================================================================
  // ✅ SELLER: Get Replacement Requests (Phase 3)
  // ============================================================================
  async getSellerReplacements(sellerId, filters = {}) {
    try {
      console.log('🔍 Fetching replacements for seller:', sellerId, filters);

      // ✅ Base query: filter by seller AND isReplacement = true
      const query = {
        seller: sellerId,
        isReplacement: true  // ✅ Only return replacements, not regular returns
      };

      // ✅ Apply additional filters
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.orderId) {
        query.order = filters.orderId;
      }
      if (filters.dateFrom) {
        query.createdAt = { $gte: new Date(filters.dateFrom) };
      }
      if (filters.dateTo) {
        query.createdAt = {
          ...query.createdAt,
          $lte: new Date(filters.dateTo)
        };
      }

      // ✅ Fetch replacements with populated data
      const replacements = await ReturnRequest.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .populate('customer', 'fullName email mobile')
        .populate({
          path: 'orderItem',
          populate: [
            { path: 'product', select: 'title images' },
            { path: 'product.seller', select: 'businessDetails.businessName' }
          ]
        })
        .populate('order', 'orderStatus fulfillmentType')
        .populate('replacementOrder', 'orderStatus replacementStatus trackingNumber');

      console.log(`✅ Found ${replacements.length} replacements for seller ${sellerId}`);

      return replacements;

    } catch (error) {
      console.error('❌ ReturnService.getSellerReplacements error:', error);
      throw new ReturnError(`Failed to fetch replacements: ${error.message}`, 'FETCH_FAILED');
    }
  }
}

module.exports = new ReturnService();
module.exports.ReturnError = ReturnError;