// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\walletRoutes.js
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/WalletController');
const userAuthMiddleware = require('../middlewares/userAuthMiddleware');

// GET /api/wallet - Get user's wallet balance + recent transactions
router.get('/', userAuthMiddleware, walletController.getWallet);

// ✅ NEW: POST /api/wallet/recalculate - Fix wallet balance inconsistencies
router.post('/recalculate', userAuthMiddleware, walletController.recalculateWallet);

// ✅ NEW: GET /api/wallet/debug - Check wallet consistency (for debugging)
router.get('/debug', userAuthMiddleware, walletController.debugWallet);

module.exports = router;