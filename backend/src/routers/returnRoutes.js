// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\returnRoutes.js
const express = require('express');
const router = express.Router();
const returnController = require('../controllers/ReturnController');
const userAuthMiddleware = require('../middlewares/userAuthMiddleware');
const sellerAuthMiddleware = require('../middlewares/sellerAuthMiddleware');

// ============================================================================
//  CUSTOMER ROUTES (Protected by User Auth)
// ============================================================================

// POST /api/returns - Create a new return request
router.post('/', userAuthMiddleware, returnController.createReturn);

// GET /api/returns - Get customer's return history
router.get('/', userAuthMiddleware, returnController.getMyReturns);

// PUT /api/returns/:returnId/cancel - Cancel a pending return request
router.put('/:returnId/cancel', userAuthMiddleware, returnController.cancelReturn);

// POST /api/replacements - Create replacement request
router.post('/replacements',userAuthMiddleware, returnController.createReplacement);

// Customer route to view their replacements
router.get('/my-replacements', userAuthMiddleware, returnController.getMyReplacements);

// ============================================================================
// 🏪 SELLER ROUTES (Protected by Seller Auth)
// ============================================================================

// GET /api/returns/seller - Get returns for items sold by this seller
router.get('/seller', sellerAuthMiddleware, returnController.getSellerReturns);

// PUT /api/returns/:returnId/approve - Approve a pending return
router.put('/:returnId/approve', sellerAuthMiddleware, returnController.approveReturn);

// PUT /api/returns/:returnId/reject - Reject a pending return
router.put('/:returnId/reject', sellerAuthMiddleware, returnController.rejectReturn);

// PUT /api/returns/:returnId/status - Update status (PICKED_UP → COMPLETED)
router.put('/:returnId/status', sellerAuthMiddleware, returnController.updateReturnStatus);

// ============================================================================
// 🏪 SELLER REPLACEMENT ROUTES
// ============================================================================

// GET /api/returns/replacements/seller - Get all replacement requests for seller
router.get('/replacements/seller', sellerAuthMiddleware, returnController.getSellerReplacements);

// PUT /api/returns/replacements/:returnId/approve - Approve replacement
router.put('/replacements/:returnId/approve', sellerAuthMiddleware, returnController.approveReplacement);

// PUT /api/returns/replacements/:returnId/ship - Mark replacement as shipped
router.put('/replacements/:returnId/ship', sellerAuthMiddleware, returnController.shipReplacement);

// PUT /api/returns/replacements/:returnId/reject - Reject replacement
router.put('/replacements/:returnId/reject', sellerAuthMiddleware, returnController.rejectReplacement);

// Mark original item as returned (customer returned it)
router.put('/replacements/:returnId/mark-original-returned', sellerAuthMiddleware, returnController.markOriginalReturned);

// Complete review of returned original item
router.put('/replacements/:returnId/complete-review', sellerAuthMiddleware, returnController.completeReview);

// Ship replacement item (after review) - UPDATED to use correct status
router.put('/replacements/:returnId/ship', sellerAuthMiddleware, returnController.shipReplacement);

// Mark replacement as completed (customer received it)
router.put('/replacements/:returnId/mark-completed', sellerAuthMiddleware, returnController.markReplacementCompleted);


module.exports = router;