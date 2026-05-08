// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\sellerReportRoutes.js
const express = require('express');
const router = express.Router();
const SellerController = require('../controllers/sellerController');
const sellerAuthMiddleware = require('../middlewares/sellerAuthMiddleware');
const sellerReportController = require('../controllers/sellerReportController');

router.get('/',sellerAuthMiddleware, sellerReportController.getSellerReport);


module.exports = router;
