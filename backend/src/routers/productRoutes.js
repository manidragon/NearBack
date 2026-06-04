// D:\Mani\Code with Zosh\Backup\source code\backend\src\routers\productRoutes.js

const express = require('express');
const router = express.Router();

const productController =
  require('../controllers/productController');


/* =========================================================
   ✅ SEARCH PRODUCTS
========================================================= */
router.get(
  '/search',
  productController.searchProducts
);


/* =========================================================
   ✅ GET ALL PRODUCTS
========================================================= */
router.get(
  '/',
  async (req, res, next) => {

    try {

      // ✅ Default pagination
      req.query = {
        ...req.query,
        page: req.query.page || 0,
        limit: req.query.limit || 20
      };

      await productController.searchProducts(
        req,
        res,
        next
      );

    } catch (error) {

      next(error);
    }
  }
);


/* =========================================================
   ✅ PRICE FILTERS
========================================================= */
router.get(
  '/price-filters',
  productController.getPriceFilters
);


/* =========================================================
   ✅ SELLER PRODUCTS
========================================================= */
router.get(
  '/seller-products',
  productController.getSellerProducts
);


/* =========================================================
   ✅ SELLER CATALOG OFFERS
========================================================= */
router.get(
  '/catalog-offers',
  productController.getSellerCatalogOffers
);


/* =========================================================
   ✅ GET PRODUCT BY ID
========================================================= */
router.get(
  '/:productId',
  productController.getProductById
);


module.exports = router;