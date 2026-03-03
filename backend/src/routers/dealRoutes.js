// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\dealRoutes.js
const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController.js'); 

// ✅ NO adminAuth middleware - routes are PUBLIC
router.get('/', dealController.getAllDeals);
router.post('/', dealController.createDeals);
router.patch('/:id', dealController.updateDeal);
router.delete('/:id', dealController.deleteDeals);

module.exports = router; 