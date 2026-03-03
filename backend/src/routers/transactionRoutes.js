const express = require('express');
const router = express.Router();
const sellerAuthMiddleware = require('../middlewares/sellerAuthMiddleware');
const transactionController = require('../controllers/transactionController');

router.get('/seller',sellerAuthMiddleware,transactionController.getTransactionBySeller);

module.exports = router;
