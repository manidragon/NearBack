const mongoose = require('mongoose');

// Define the Review schema
const reviewSchema = new mongoose.Schema({
    reviewText: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    productImages: {
        type: [String],  
        default: []
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',  
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now  
    }
}, {
    timestamps: true  
});

// Create and export the Review model
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
