// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\sellerRoutes.js
const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const sellerAuthMiddleware = require('../middlewares/sellerAuthMiddleware');

router.get('/profile',sellerAuthMiddleware, sellerController.getSellerProfile);

router.post('/', sellerController.createSeller);

router.get('/', sellerController.getAllSellers);

router.patch('/',sellerAuthMiddleware, sellerController.updateSeller);

router.get('/:id', sellerController.getSellerById);

router.post('/verify/login-otp', sellerController.verifyLoginOtp);

router.post('/send-login-otp', sellerController.sendLoginOtp); 

router.delete('/:id', sellerController.deleteSeller);

router.post('/verify/otp', sellerController.verifyEmail);

module.exports = router;
