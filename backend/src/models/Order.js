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
        ref: 'Seller', // Reference to the Seller model
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
        default: function() {
            return Date.now() + 7 * 24 * 60 * 60 * 1000; 
        },
    },
}, {
    timestamps: true, 
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
