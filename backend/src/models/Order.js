// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\Order.js
const mongoose = require('mongoose');
const OrderStatus = require('../domain/OrderStatus');
const PaymentStatus = require('../domain/PaymentStatus');
const { Schema } = mongoose;

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'Seller',
        required: true,
    },
    orderItems: [{
        type: Schema.Types.ObjectId,
        ref: 'OrderItem',
    }],
    shippingAddress: {
        type: Schema.Types.ObjectId,
        ref: 'Address',
        required: true,
    },

    totalMrpPrice: {
        type: Number,
        required: true,
    },
    totalSellingPrice: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    orderStatus: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PLACED,
    },
    fulfillmentType: {
        type: String,
        enum: ['DELIVERY', 'SELF_PICKUP'],
        default: 'DELIVERY'
    },
    totalItem: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['RAZORPAY', 'CASH_ON_DELIVERY', 'WALLET'], // ✅ Added 'WALLET' just in case
        default: 'RAZORPAY'
    },
    paymentStatus: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    pickupTime: {
        type: Date,
        default: null
    },
    deliverDate: {
        type: Date,
        default: function () {
            return Date.now() + 7 * 24 * 60 * 60 * 1000;
        },
    },
    
    // ============================================================================
    // ✅ REPLACEMENT FIELDS (Phase 3) - CLEANED & OPTIMIZED
    // ============================================================================
    replacementFor: {
        type: Schema.Types.ObjectId,
        ref: 'OrderItem',
        sparse: true,  // Only populated if this order is a replacement
        index: true    // ✅ Fast lookup for "find all replacement orders for an item"
    },
    replacementStatus: {
        type: String,
        // ✅ UPDATED: Matches ReturnRequest workflow to prevent validation errors
        enum: [
            'NONE', 
            'PENDING', 
            'APPROVED', 
            'ORIGINAL_RETURNED', 
            'REVIEW_COMPLETED', 
            'REPLACEMENT_SHIPPED', 
            'COMPLETED', 
            'CANCELLED'
        ],
        default: 'NONE',
        index: true
    },
    priceDifference: {
        type: Number,
        default: 0
    }
    // ❌ REMOVED: originalOrderItem (redundant with replacementFor)

}, {
    timestamps: true,
});

// ✅ Compound index for replacement order queries
orderSchema.index({ replacementFor: 1, replacementStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;