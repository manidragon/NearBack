// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',  
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    },
    // ✅ ADD THESE PAYMENT FIELDS:
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    platformFee: {
        type: Number,
        default: 0,
        min: 0
    },
    netAmount: {
        type: Number,  // amount - platformFee
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: ['RAZORPAY', 'CASH_ON_DELIVERY', 'WALLET'],
        default: 'RAZORPAY'
    },
    razorpayPaymentId: {
        type: String,
        trim: true
    },
    razorpayOrderId: {
        type: String,
        trim: true
    },
    refundAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    refundReason: {
        type: String,
        trim: true
    },
    // ✅ Keep existing fields:
    date: {
        type: Date,
        default: Date.now 
    }
}, {
    timestamps: true  
});

// ✅ Add index for faster seller lookups
transactionSchema.index({ seller: 1, date: -1 });
transactionSchema.index({ order: 1 }, { unique: true });  // One transaction per order

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;