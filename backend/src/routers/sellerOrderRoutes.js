const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const sellerAuthMiddleware = require('../middlewares/sellerAuthMiddleware');



router.get('/', sellerAuthMiddleware, orderController.getSellersOrders);

// Update order status
router.patch(
    '/:orderId/status/:orderStatus', 
    sellerAuthMiddleware, 
    orderController.updateOrderStatus
);

router.delete('/:orderId', sellerAuthMiddleware, orderController.deleteOrder);

module.exports = router;
