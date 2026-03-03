const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/userAuthMiddleware');

router.get('/profile', authMiddleware, userController.getUserProfileByJwt);
router.put('/profile', authMiddleware, userController.updateUserProfile);
router.put('/profile/picture', authMiddleware, userController.updateProfilePicture);

module.exports = router;
