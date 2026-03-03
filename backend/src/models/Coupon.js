const mongoose = require('mongoose');
const { Schema } = mongoose;

const couponSchema = new Schema({
    code: {
        type: String,
        unique: true,
        required: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
    validityStartDate: {
        type: Date,
        required: true,
    },
    validityEndDate: {
        type: Date,
        required: true,
    },
    minimumOrderValue: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    usedByUsers: [{
        type: Schema.Types.ObjectId, 
        ref: 'User',
    }],
}, {
    timestamps: true, 
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
