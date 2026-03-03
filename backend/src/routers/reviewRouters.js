const express = require("express");
const router = express.Router();
// const ReviewController = require("../controllers/ReviewController");
const authMiddleware = require("../middlewares/userAuthMiddleware");
const reviewController = require("../controllers/reviewController");
// const authMiddleware = require("../middleware/auth"); // assumes JWT-based middleware

// Create a review
router.post("/product/:productId", authMiddleware, reviewController.createReview);

// Get reviews for a product
router.get("/product/:productId", reviewController.getReviewsByProductId);

// Update a review
router.put("/:reviewId", authMiddleware, reviewController.updateReview);

// Delete a review
router.delete("/:reviewId", authMiddleware, reviewController.deleteReview);

module.exports = router;

