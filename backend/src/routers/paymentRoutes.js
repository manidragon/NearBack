// paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/userAuthMiddleware');

// Define route for payment success
router.get('/:paymentId',authMiddleware, paymentController.paymentSuccessHandler);

module.exports = router;
