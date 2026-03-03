const ReviewService = require("../services/ReviewService");


class ReviewController {
  async createReview(req, res, next) {
    try {
      const productId=req.params.productId;
      const user=await req.user;

      const review = await ReviewService.createReview(req.body, user, productId);
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }

  async getReviewsByProductId(req, res, next) {
    try {
      const reviews = await ReviewService.getReviewsByProductId(req.params.productId);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const { reviewText, rating } = req.body;

      const review = await ReviewService.updateReview(
        reviewId,
        reviewText,
        rating,
        req.user._id
      );

      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const { reviewId } = req.params;

      await ReviewService.deleteReview(reviewId, req.user._id);
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();
