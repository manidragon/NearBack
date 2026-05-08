// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\sellerOrderRoutes.js
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
