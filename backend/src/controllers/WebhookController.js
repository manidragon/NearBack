// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\WebhookController.js
const crypto = require('crypto');
const ReturnRequest = require('../models/ReturnRequest');
const Transaction = require('../models/Transaction');

class WebhookController {
  
  // ✅ Verify Razorpay webhook signature
  verifySignature(payload, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  }

  // ✅ POST /api/webhooks/razorpay/refund
  async handleRazorpayRefundWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      // ✅ Verify signature (skip in dev with env flag)
      if (process.env.NODE_ENV !== 'development' && webhookSecret) {
        if (!signature) {
          console.error('❌ Missing webhook signature');
          return res.status(400).json({ error: 'Missing signature' });
        }
        const isValid = this.verifySignature(req.body, signature, webhookSecret);
        if (!isValid) {
          console.error('❌ Webhook signature verification failed');
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }
      
      const event = req.body;
      console.log('🔔 Razorpay webhook received:', {
        event: event.event,
        refundId: event.payload?.refund?.entity?.id
      });
      
      // ✅ Handle refund events
      if (event.event === 'refund.created' || event.event === 'refund.updated') {
        const refundData = event.payload?.refund?.entity;
        const returnId = refundData?.notes?.returnId;
        
        if (!returnId) {
          console.warn('⚠️ Webhook missing returnId in notes');
          return res.status(200).json({ received: true });
        }
        
        // ✅ Update return request with refund status
        const returnRequest = await ReturnRequest.findById(returnId);
        
        if (!returnRequest) {
          console.warn(`⚠️ Return request not found: ${returnId}`);
          return res.status(200).json({ received: true });
        }
        
        // Map Razorpay status to our status
        const statusMap = {
          'processed': 'COMPLETED',
          'pending': 'PROCESSING',
          'failed': 'FAILED'
        };
        
        const newStatus = statusMap[refundData.status] || 'PROCESSING';
        
        // ✅✅✅ CRITICAL FIX: Save the Razorpay refund ID!
        returnRequest.razorpayRefundId = refundData.id;
        
        if (newStatus === 'COMPLETED' && returnRequest.refundStatus !== 'COMPLETED') {
          returnRequest.refundStatus = 'COMPLETED';
          returnRequest.completedAt = returnRequest.completedAt || new Date();
          
          console.log('✅ Razorpay refund completed via webhook:', {
            returnId,
            razorpayRefundId: refundData.id,
            amount: refundData.amount / 100
          });
        } else if (newStatus === 'FAILED') {
          returnRequest.refundStatus = 'FAILED';
          returnRequest.rejectedReason = `Razorpay refund failed: ${refundData.error?.description || 'Unknown error'}`;
          console.error('❌ Razorpay refund failed:', {
            returnId,
            error: refundData.error
          });
        } else {
          returnRequest.refundStatus = newStatus;
        }
        
        returnRequest.updatedAt = new Date();
        await returnRequest.save();
        
        // ✅ ALSO UPDATE TRANSACTION (for audit trail)
        try {
          const transaction = await Transaction.findOne({ order: returnRequest.order });
          if (transaction) {
            transaction.paymentStatus = 'REFUNDED';
            transaction.razorpayRefundId = refundData.id;
            transaction.refundAmount = refundData.amount / 100;
            transaction.refundReason = returnRequest.reason;
            await transaction.save();
            console.log('✅ Transaction updated with refund details:', transaction._id);
          }
        } catch (txError) {
          console.error('⚠️ Failed to update transaction:', txError.message);
        }
        
        console.log('✅ Return request updated from webhook:', {
          returnId,
          refundStatus: returnRequest.refundStatus,
          razorpayRefundId: returnRequest.razorpayRefundId
        });
      }
      
      // ✅ Always return 200 to acknowledge receipt
      res.status(200).json({ received: true });
      
    } catch (error) {
      console.error('❌ Webhook handler error:', error);
      res.status(200).json({ received: true, error: 'Handler error' });
    }
  }
}

module.exports = new WebhookController();