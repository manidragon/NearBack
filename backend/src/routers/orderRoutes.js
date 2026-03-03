const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const userAuthMiddleware = require('../middlewares/userAuthMiddleware');

// Create a new order
router.post('/', userAuthMiddleware, orderController.createOrder);


// Get user's order history
router.get('/user', userAuthMiddleware, orderController.getUserOrderHistory);


// Cancel an order
router.put('/:orderId/cancel', userAuthMiddleware, orderController.cancelOrder);

// Get order by ID
router.get('/:orderId', userAuthMiddleware, orderController.getOrderById);

router.get('/item/:orderItemId', userAuthMiddleware, orderController.getOrderItemById);

// Delete an order
router.delete('/:orderId', userAuthMiddleware, orderController.deleteOrder);

module.exports = router;

