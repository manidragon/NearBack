const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const authMiddleware = require("../middlewares/userAuthMiddleware");


router.get("/", authMiddleware,  
  wishlistController.getWishlistByUserId);

router.post("/add-product/:productId", authMiddleware,  
  wishlistController.addProductToWishlist);

module.exports = router;
