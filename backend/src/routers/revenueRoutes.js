// routes/revenueRoutes.js
const express = require('express');
const revenueController = require('../controllers/revenueController');
const sellerAuthMiddleware = require('../middlewares/sellerAuthMiddleware');
// const RevenueController = require('../controllers/RevenueController'); // Adjust the import path as necessary

const router = express.Router();

// Define the route
router.get('/chart', sellerAuthMiddleware, revenueController.getRevenueChart);

module.exports = router;
