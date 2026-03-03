const Review = require("../models/Review");
const Product = require("../models/Product");
const createError = require("http-errors");
const ProductService = require("./ProductService");

class ReviewService {
  async createReview(reqBody, user, productId) {
    const product= await ProductService.findProductById(productId);
    const review = new Review({
      user: user._id,
      product: product._id,
      rating: reqBody.rating,
      reviewText: reqBody.reviewText,
    });
    const savedReview=await review.save();
    
    return Review.findById(savedReview._id).populate("user");
  }

  async getReviewsByProductId(productId) {
    const reviews = await Review.find({ product: productId }).populate("user");
    return reviews;
  }

  async updateReview(reviewId, reviewText, rating, userId) {
    const review = await Review.findById(reviewId);
    if (!review) throw createError.NotFound("Review not found");

    if (review.user.toString() !== userId.toString()) {
      throw createError.Unauthorized("You are not authorized to update this review");
    }

    review.reviewText = reviewText;
    review.rating = rating;
    await review.save();
    return review;
  }

  async deleteReview(reviewId, userId) {
    const review = await Review.findById(reviewId);
    if (!review) throw createError.NotFound("Review not found");

    if (review.user.toString() !== userId.toString()) {
      throw createError.Unauthorized("You are not authorized to delete this review");
    }

    await review.deleteOne();
  }
}

module.exports = new ReviewService();
