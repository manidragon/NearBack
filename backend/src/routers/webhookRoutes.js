// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\webhookRoutes.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/WebhookController');

// ✅ Razorpay refund webhook (public endpoint - signature verified in controller)
router.post('/razorpay/refund', 
  express.json({ type: 'application/json' }),  // Ensure JSON parsing
  webhookController.handleRazorpayRefundWebhook
);

module.exports = router;