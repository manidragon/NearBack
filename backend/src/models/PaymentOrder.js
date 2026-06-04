// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\PaymentOrder.js
const mongoose = require('mongoose');
const PaymentStatus = require('../domain/PaymentStatus');
const PaymentMethod = require('../domain/PaymentMethod');
const PaymentOrderStatus = require('../domain/PaymentOrderStatus');

// Define the PaymentOrder schema
const paymentOrderSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(PaymentOrderStatus),  
        default: PaymentOrderStatus.PENDING  // ✅ Fixed: was PaymentStatus.PENDING
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethod),
        default: PaymentMethod.RAZORPAY
    },
    paymentLinkId: {
        type: String,  // Stores Razorpay order_id
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        required: true  
    },
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    },
    // ✅ ADD THESE MISSING FIELDS:
    fulfillmentType: {
        type: String,
        enum: ['DELIVERY', 'SELF_PICKUP'],
        default: 'DELIVERY'
    },
    pickupTime: {
        type: Date,
        default: null
    }
}, {
    timestamps: true  
});

const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);
module.exports = PaymentOrder;