const Transaction = require('../models/Transaction');
const Seller = require('../models/Seller');
const Order = require('../models/Order');

class TransactionService {
    // Create a new transaction from an order
    async createTransaction(orderId) {
        // Find the order by ID
        const order = await Order.findById(orderId).populate('seller'); 
        if (!order) {
            throw new Error('Order not found');
        }

        const seller = await Seller.findById(order.seller._id);
        if (!seller) {
            throw new Error('Seller not found');
        }

        // Create a new transaction
        const transaction = new Transaction({
            seller: seller._id,
            customer: order.user, 
            order: order._id,
        });

        // Save and return the transaction
        return await transaction.save();
    }

    // Get transactions by seller ID
    async getTransactionsBySellerId(sellerId) {
        return await Transaction.find({ seller: sellerId }).populate('order customer');
    }

    // Get all transactions
    async getAllTransactions() {
        return await Transaction.find().populate('seller order customer');
    }
}

module.exports = new TransactionService();
