// ✅ backend/src/routers/catalogRoutes.js
const express = require('express');
const catalogController = require('../controllers/ProductCatalogController');
const sellerAuthMiddleware = require('../middlewares/sellerAuthMiddleware');
const router = express.Router();

// ✅ Search catalog (before listing)
router.get('/search', sellerAuthMiddleware, catalogController.searchCatalog);

// ✅ Get catalog with all offers (Product Details)
router.get('/:catalogId', sellerAuthMiddleware, catalogController.getCatalogById); 

// ✅ List offer on existing catalog
router.post('/:catalogId/offer', sellerAuthMiddleware, catalogController.listOfferOnCatalog);

// ✅ Update seller's offer (price/stock only)
router.put('/offer/:offerId', sellerAuthMiddleware, catalogController.updateOffer);

// ✅ Get seller's offer for catalog
router.get('/:catalogId/offer/me', sellerAuthMiddleware, catalogController.getSellerOfferForCatalog);

router.get('/:catalogId/offers', catalogController.getAllOffersForCatalog);

module.exports = router;