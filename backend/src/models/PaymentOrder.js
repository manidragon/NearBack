// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\PaymentOrder.js
const mongoose = require('mongoose');
const PaymentStatus = require('../domain/PaymentStatus');
const PaymentMethod = require('../domain/PaymentMethod');
const PaymentOrderStatus = require('../domain/PaymentOrderStatus');

// Define the PaymentOrder schema
const paymentOrderSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true  // Amount is required
    },
    status: {
        type: String,
        enum: Object.values(PaymentOrderStatus),  
        default: PaymentStatus.PENDING 
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethod),
        default: PaymentMethod.RAZORPAY
    },
    paymentLinkId: {
        type: String,
        
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        required: true  
    },
 shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    }
}, {
    timestamps: true  
});

const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);
module.exports = PaymentOrder;
