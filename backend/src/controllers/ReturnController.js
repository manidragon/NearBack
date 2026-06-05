// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\ReturnController.js
const ReturnService = require('../services/ReturnService');
const WalletService = require('../services/WalletService');
const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');

class ReturnController {

  // ============================================================================
  // ✅ CUSTOMER: Create Return Request (Phase 2: Refund Method Support)
  // ============================================================================
  async createReturn(req, res) {
    try {
      // ✅ Use 'let' for variables that might be reassigned, or destructure separately
      const { orderItemId, reason, description, images, pickupAddress, refundMethod: requestedRefundMethod } = req.body;

      if (!orderItemId || !reason) {
        return res.status(400).json({ error: "orderItemId and reason are required" });
      }

      // ✅ VALIDATION: Fetch order to validate refund method against payment method
      const Order = require('../models/Order');
      const order = await Order.findOne({ orderItems: orderItemId });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // ✅ Determine final refund method (use a new variable, don't reassign const)
      let finalRefundMethod = requestedRefundMethod || 'WALLET';  // Default to WALLET

      // ✅ Business Rule: COD orders can ONLY use WALLET refunds
      if (order.paymentMethod === 'CASH_ON_DELIVERY') {
        if (requestedRefundMethod && requestedRefundMethod !== 'WALLET') {
          return res.status(400).json({
            error: 'COD orders only support wallet refunds. Please select "Wallet" as refund method.'
          });
        }
        finalRefundMethod = 'WALLET';  // Force WALLET for COD
      }

      // ✅ Business Rule: Razorpay orders can use WALLET or RAZORPAY
      if (order.paymentMethod === 'RAZORPAY') {
        if (requestedRefundMethod && !['WALLET', 'RAZORPAY'].includes(requestedRefundMethod)) {
          return res.status(400).json({
            error: 'Invalid refund method for Razorpay orders. Choose "Wallet" or "Original Payment Method".'
          });
        }
        // finalRefundMethod already defaults to WALLET or uses requested value
      }

      // ✅ Future-proof: Block unsupported methods
      if (finalRefundMethod && !['WALLET', 'RAZORPAY', 'BANK_TRANSFER'].includes(finalRefundMethod)) {
        return res.status(400).json({
          error: `Refund method "${finalRefundMethod}" is not supported.`
        });
      }

      const returnRequest = await ReturnService.createReturn(req.user, orderItemId, {
        reason,
        description,
        images,
        pickupAddress,
        refundMethod: finalRefundMethod  // ✅ Pass the validated method
      });

      res.status(201).json({
        success: true,
        message: "Return request submitted successfully",
        data: returnRequest
      });

    } catch (error) {
      console.error("❌ createReturn error:", error);

      // Handle specific errors
      if (error.code === 'RETURN_WINDOW_EXPIRED' ||
        error.code === 'DUPLICATE_RETURN' ||
        error.code === 'INVALID_REFUND_AMOUNT' ||
        error.code === 'INVALID_REFUND_METHOD') {
        return res.status(400).json({ error: error.message });
      }
      if (error.code === 'UNAUTHORIZED') {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to create return request" });
    }
  }

  // ============================================================================
  // ✅ CUSTOMER: Get My Returns
  // ============================================================================
  async getMyReturns(req, res) {
    try {
      const filters = req.query; // status, orderId, etc.

      const returns = await ReturnService.getReturnsByCustomer(req.user._id, filters);

      res.status(200).json({
        success: true,
        count: returns.length,
        data: returns
      });

    } catch (error) {
      console.error("❌ getMyReturns error:", error);
      res.status(500).json({ error: "Failed to fetch returns" });
    }
  }

  // ============================================================================
  // ✅ CUSTOMER: Cancel Return Request
  // ============================================================================
  async cancelReturn(req, res) {
    try {
      const { returnId } = req.params;

      const returnRequest = await ReturnService.cancelReturn(req.user._id, returnId);

      res.status(200).json({
        success: true,
        message: "Return request cancelled successfully",
        data: returnRequest
      });

    } catch (error) {
      console.error("❌ cancelReturn error:", error);

      if (error.code === 'INVALID_STATUS_FOR_CANCELLATION') {
        return res.status(400).json({ error: error.message });
      }
      if (error.code === 'UNAUTHORIZED') {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to cancel return" });
    }
  }

  // ============================================================================
  // ✅ SELLER: Get Returns for My Items
  // ============================================================================
  async getSellerReturns(req, res) {
    try {
      // Assuming req.seller is populated by sellerAuthMiddleware
      const sellerId = req.seller ? req.seller._id : req.user._id;

      const filters = req.query;
      const returns = await ReturnService.getReturnsBySeller(sellerId, filters);

      res.status(200).json({
        success: true,
        count: returns.length,
        data: returns
      });

    } catch (error) {
      console.error("❌ getSellerReturns error:", error);
      res.status(500).json({ error: "Failed to fetch seller returns" });
    }
  }

  // ============================================================================
  // ✅ SELLER: Approve Return
  // ============================================================================
  async approveReturn(req, res) {
    try {
      const { returnId } = req.params;
      const sellerId = req.seller ? req.seller._id : req.user._id;

      const returnRequest = await ReturnService.approveReturn(sellerId, returnId);

      res.status(200).json({
        success: true,
        message: "Return approved",
        data: returnRequest
      });

    } catch (error) {
      console.error(" approveReturn error:", error);

      if (error.code === 'INVALID_STATUS_TRANSITION') {
        return res.status(400).json({ error: error.message });
      }
      if (error.code === 'UNAUTHORIZED') {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to approve return" });
    }
  }

  // ============================================================================
  // ✅ SELLER: Reject Return
  // ============================================================================
  async rejectReturn(req, res) {
    try {
      const { returnId } = req.params;
      const { reason } = req.body;
      const sellerId = req.seller ? req.seller._id : req.user._id;

      const returnRequest = await ReturnService.rejectReturn(sellerId, returnId, reason);

      res.status(200).json({
        success: true,
        message: "Return rejected",
        data: returnRequest
      });

    } catch (error) {
      console.error("❌ rejectReturn error:", error);

      if (error.code === 'INVALID_STATUS_TRANSITION') {
        return res.status(400).json({ error: error.message });
      }
      if (error.code === 'UNAUTHORIZED') {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to reject return" });
    }
  }

  // ============================================================================
  // ✅ SELLER: Update Status (Picked Up -> Completed)
  // ============================================================================
  async updateReturnStatus(req, res) {
    try {
      const { returnId } = req.params;
      const { status } = req.body;  // ✅ Only extract status
      // ✅ Get seller ID properly from auth middleware
      const sellerId = req.seller ? req.seller._id : req.user._id;

      if (!status) {
        return res.status(400).json({ error: "New status is required" });
      }

      // ✅✅✅ FIX: Pass sellerId (not metadata) as third argument
      const returnRequest = await ReturnService.updateReturnStatus(returnId, status, sellerId);

      // If completed, we might want to highlight the refund in the response
      const responseMsg = status === 'COMPLETED'
        ? "Return completed and refund processed"
        : `Return status updated to ${status}`;

      res.status(200).json({
        success: true,
        message: responseMsg,
        data: returnRequest
      });

    } catch (error) {
      console.error("❌ updateReturnStatus error:", error);

      if (error.code === 'INVALID_TRANSITION') {
        return res.status(400).json({ error: error.message });
      }
      if (error.code === 'UNAUTHORIZED') {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to update return status" });
    }
  }

  // ============================================================================
  // ✅ CUSTOMER: Create Replacement Request (Phase 3)
  // ============================================================================
  async createReplacement(req, res) {
    try {
      const { orderItemId, reason, description, images, pickupAddress, replacementVariant, refundMethod } = req.body;

      if (!orderItemId || !replacementVariant?.variantId) {
        return res.status(400).json({ error: "orderItemId and replacementVariant.variantId are required" });
      }

      // ✅ Validate replacement variant has required fields
      if (!replacementVariant.sellingPrice) {
        return res.status(400).json({ error: "replacementVariant.sellingPrice is required" });
      }

      const replacementRequest = await ReturnService.createReplacementRequest(req.user, orderItemId, {
        reason,
        description,
        images,
        pickupAddress,
        replacementVariant,
        refundMethod: refundMethod || 'WALLET'
      });

      res.status(201).json({
        success: true,
        message: "Replacement request submitted successfully",
        data: replacementRequest
      });

    } catch (error) {
      console.error("❌ createReplacement error:", error);

      // Handle specific errors
      if (error.code === 'REPLACEMENT_WINDOW_EXPIRED' ||
        error.code === 'DUPLICATE_REPLACEMENT' ||
        error.code === 'VARIANT_NOT_FOUND' ||
        error.code === 'OUT_OF_STOCK') {
        return res.status(400).json({ error: error.message });
      }
      if (error.code === 'UNAUTHORIZED') {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: "Failed to create replacement request" });
    }
  }

  // ============================================================================
// ✅ SELLER: Get All Replacement Requests
// ============================================================================
async getSellerReplacements(req, res) {
  try {
    const sellerId = req.seller?._id || req.user._id;
    const { status } = req.query;

    const filters = { isReplacement: true };
    if (status) {
      filters.status = status;
    }

    const replacements = await ReturnService.getSellerReplacements(sellerId, filters);

    res.status(200).json({
      success: true,
      count: replacements.length,
      data: replacements
    });

  } catch (error) {
    console.error("❌ getSellerReplacements error:", error);
    res.status(500).json({ error: "Failed to fetch replacement requests" });
  }
}

// ============================================================================
// ✅ CUSTOMER: Get My Replacement Requests
// ============================================================================
async getMyReplacements(req, res) {
  try {
    const customerId = req.user._id;
    const filters = req.query;

    // Fetch replacements for this customer
    const replacements = await ReturnService.getReturnsByCustomer(customerId, {
      ...filters,
      isReplacement: true  // ✅ Only fetch replacements
    });

    res.status(200).json({
      success: true,
      count: replacements.length,
      data: replacements
    });

  } catch (error) {
    console.error("❌ getMyReplacements error:", error);
    res.status(500).json({ error: "Failed to fetch replacements" });
  }
}

// ============================================================================
// ✅ SELLER: Approve Replacement Request
// ============================================================================
async approveReplacement(req, res) {
  try {
    const { returnId } = req.params;
    const sellerId = req.seller?._id || req.user._id;

    const replacement = await ReturnService.approveReturn(sellerId, returnId);

    res.status(200).json({
      success: true,
      message: "Replacement request approved",
      data: replacement
    });

  } catch (error) {
    console.error("❌ approveReplacement error:", error);
    res.status(500).json({ error: "Failed to approve replacement" });
  }
}

// ============================================================================
// ✅ SELLER: Mark Replacement as Shipped
// ============================================================================
async shipReplacement(req, res) {
  try {
    const { returnId } = req.params;
    const { trackingNumber } = req.body;
    const sellerId = req.seller?._id || req.user._id;

    // ✅ VALIDATION: Check current status before shipping
    const returnRequest = await ReturnRequest.findById(returnId);
    if (!returnRequest) {
      return res.status(404).json({ error: "Replacement request not found" });
    }
    
    // ✅ Must be REVIEW_COMPLETED before shipping replacement
    if (returnRequest.status !== 'REVIEW_COMPLETED') {
      return res.status(400).json({ 
        error: `Cannot ship replacement: Review must be completed first. Current status: ${returnRequest.status}` 
      });
    }

    // ✅ Use correct status value: 'REPLACEMENT_SHIPPED'
    const updated = await ReturnService.updateReturnStatus(
      returnId, 
      'REPLACEMENT_SHIPPED',  // ✅ Fixed
      sellerId
    );

    // Update tracking number if provided
    if (trackingNumber && trackingNumber.trim() !== '') {
      updated.trackingNumber = trackingNumber;
      await updated.save();
    }

    res.status(200).json({
      success: true,
      message: "Replacement item shipped successfully",
      data: updated
    });

  } catch (error) {
    console.error("❌ shipReplacement error:", error);
    
    if (error.code === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: "Failed to ship replacement" });
  }
}

// ============================================================================
// ✅ SELLER: Mark Replacement as Completed (Customer Received)
// ============================================================================
async markReplacementCompleted(req, res) {
  try {
    const { returnId } = req.params;
    const sellerId = req.seller?._id || req.user._id;

    // ✅ Validate replacement exists and belongs to seller
    const returnRequest = await ReturnRequest.findById(returnId)
      .populate('replacementOrder');
    
    if (!returnRequest) {
      return res.status(404).json({ error: "Replacement request not found" });
    }

    if (returnRequest.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({ error: "Unauthorized: Not your replacement request" });
    }

    // ✅ Must be REPLACEMENT_SHIPPED before marking completed
    if (returnRequest.status !== 'REPLACEMENT_SHIPPED') {
      return res.status(400).json({ 
        error: `Cannot mark as completed: Status must be REPLACEMENT_SHIPPED. Current status: ${returnRequest.status}` 
      });
    }

    // ✅ Update status to COMPLETED
    returnRequest.status = 'COMPLETED';
    returnRequest.completedAt = new Date();
    await returnRequest.save();

    // ✅ Update replacement order status
    if (returnRequest.replacementOrder) {
      await Order.findByIdAndUpdate(
        returnRequest.replacementOrder._id,
        { 
          $set: { 
            orderStatus: 'DELIVERED',
            replacementStatus: 'COMPLETED',
            deliveredAt: new Date()
          } 
        }
      );
    }

    console.log('✅ Replacement marked as completed:', returnId);

    res.status(200).json({
      success: true,
      message: "Replacement marked as completed successfully",
      data: returnRequest
    });

  } catch (error) {
    console.error("❌ markReplacementCompleted error:", error);
    res.status(500).json({ error: "Failed to mark replacement as completed" });
  }
}

// ============================================================================
// ✅ SELLER: Mark Original Item as Returned (Replacement Flow Step 3)
// ============================================================================
async markOriginalReturned(req, res) {
  try {
    const { returnId } = req.params;
    const sellerId = req.seller?._id || req.user._id;

    const returnRequest = await ReturnService.updateReturnStatus(
      returnId, 
      'ORIGINAL_RETURNED',  // ✅ New status
      sellerId
    );

    res.status(200).json({
      success: true,
      message: "Original item marked as returned - awaiting review",
      data: returnRequest
    });

  } catch (error) {
    console.error("❌ markOriginalReturned error:", error);
    
    if (error.code === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: "Failed to mark original as returned" });
  }
}

// ============================================================================
// ✅ SELLER: Complete Review of Original Item (Replacement Flow Step 4)
// ============================================================================
async completeReview(req, res) {
  try {
    const { returnId } = req.params;
    const { reviewNotes } = req.body;
    const sellerId = req.seller?._id || req.user._id;

    const returnRequest = await ReturnService.updateReturnStatus(
      returnId, 
      'REVIEW_COMPLETED',  // ✅ New status
      sellerId,
      { reviewNotes }  // ✅ Pass review notes as options
    );

    res.status(200).json({
      success: true,
      message: "Review completed - ready to ship replacement",
      data: returnRequest
    });

  } catch (error) {
    console.error("❌ completeReview error:", error);
    
    if (error.code === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: "Failed to complete review" });
  }
}

// ============================================================================
// ✅ SELLER: Reject Replacement Request
// ============================================================================
async rejectReplacement(req, res) {
  try {
    const { returnId } = req.params;
    const { reason } = req.body;
    const sellerId = req.seller?._id || req.user._id;

    const replacement = await ReturnService.rejectReturn(sellerId, returnId, reason);

    res.status(200).json({
      success: true,
      message: "Replacement request rejected",
      data: replacement
    });

  } catch (error) {
    console.error("❌ rejectReplacement error:", error);
    res.status(500).json({ error: "Failed to reject replacement" });
  }
}
}

module.exports = new ReturnController();