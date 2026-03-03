// src/routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middlewares/userAuthMiddleware');

// GET all user addresses
router.get('/', authMiddleware, addressController.getUserAddresses);

// POST add new address
router.post('/', authMiddleware, addressController.addAddress);

// PUT update an address
router.put('/:addressId', authMiddleware, addressController.updateAddress);

// DELETE an address
router.delete('/:addressId', authMiddleware, addressController.deleteAddress);

module.exports = router;