// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\WalletService.js
const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');

class WalletError extends Error {
  constructor(message, code = 'WALLET_ERROR') {
    super(message);
    this.name = 'WalletError';
    this.code = code;
  }
}

class WalletService {
  
  // ============================================================================
  // ✅ GET OR CREATE WALLET (Helper for lazy initialization)
  // ============================================================================
  async getWallet(userId) {
    try {
      // ✅ Handle both ObjectId and string
      const userIdStr = userId?.toString ? userId.toString() : userId;
      
      let wallet = await Wallet.findOne({ user: userIdStr });
      
      if (!wallet) {
        // Create wallet on first access
        wallet = new Wallet({ 
          user: userIdStr, 
          balance: 0,
          transactions: [],
          settings: {
            autoWithdraw: false,
            minWithdrawAmount: 100,
            notifications: { credit: true, debit: true }
          },
          totalCredited: 0,
          totalDebited: 0
        });
        await wallet.save();
        console.log(`🆕 New wallet created for user: ${userIdStr}`);
      }
      
      return wallet;

    } catch (error) {
      console.error('❌ WalletService.getWallet error:', error);
      throw new WalletError(`Failed to access wallet: ${error.message}`, 'ACCESS_FAILED');
    }
  }

  // ============================================================================
  // ✅ CREDIT WALLET (NEW - For Return Refunds)
  // ============================================================================
  async creditWallet(userId, transactionData) {
    try {
      // ✅ Handle both ObjectId and string
      const userIdStr = userId?.toString ? userId.toString() : userId;
      
      console.log('💳 Crediting wallet:', { 
        userId: userIdStr, 
        amount: transactionData.amount,
        reason: transactionData.reason 
      });
      
      const wallet = await this.getWallet(userIdStr);
      
      const newBalance = wallet.balance + transactionData.amount;
      
      // ✅ Add transaction record
      wallet.transactions.unshift({
        _id: new mongoose.Types.ObjectId(), // ✅ Add unique ID for each transaction
        type: 'CREDIT',
        amount: transactionData.amount,
        reason: transactionData.reason || 'CREDIT',
        referenceId: transactionData.referenceId?.toString?.() || transactionData.referenceId,
        referenceModel: transactionData.referenceModel,
        balanceAfter: newBalance,
        notes: transactionData.notes,
        createdAt: new Date()
      });
      
      // ✅ Keep only last 50 transactions for performance
      if (wallet.transactions.length > 50) {
        wallet.transactions = wallet.transactions.slice(0, 50);
      }
      
      // ✅ Update wallet totals
      wallet.balance = newBalance;
      wallet.totalCredited = (wallet.totalCredited || 0) + transactionData.amount;
      wallet.lastTransactionAt = new Date();
      wallet.updatedAt = new Date();
      
      await wallet.save();
      
      console.log('✅ Wallet credited successfully:', {
        userId: userIdStr,
        oldBalance: newBalance - transactionData.amount,
        newBalance: newBalance,
        transactionCount: wallet.transactions.length
      });
      
      return wallet;
      
    } catch (error) {
      console.error('❌ WalletService.creditWallet error:', {
        message: error.message,
        stack: error.stack,
        userId,
        transactionData
      });
      throw new WalletError(`Failed to credit wallet: ${error.message}`, 'CREDIT_FAILED');
    }
  }

  // ============================================================================
  // ✅ DEBIT WALLET (For Order Payments - Future Feature)
  // ============================================================================
  async debitWallet(userId, amount, reason, referenceId, referenceModel = 'Order', notes = '') {
    try {
      const userIdStr = userId?.toString ? userId.toString() : userId;
      const wallet = await this.getWallet(userIdStr);
      
      if (wallet.balance < amount) {
        throw new WalletError('Insufficient wallet balance', 'INSUFFICIENT_BALANCE');
      }
      
      const newBalance = wallet.balance - amount;
      
      wallet.transactions.unshift({
        _id: new mongoose.Types.ObjectId(),
        type: 'DEBIT',
        amount: amount,
        reason: reason || 'DEBIT',
        referenceId: referenceId?.toString?.() || referenceId,
        referenceModel: referenceModel,
        balanceAfter: newBalance,
        notes: notes,
        createdAt: new Date()
      });
      
      if (wallet.transactions.length > 50) {
        wallet.transactions = wallet.transactions.slice(0, 50);
      }
      
      wallet.balance = newBalance;
      wallet.totalDebited = (wallet.totalDebited || 0) + amount;
      wallet.lastTransactionAt = new Date();
      wallet.updatedAt = new Date();
      
      await wallet.save();
      
      console.log('💸 Wallet debited:', {
        userId: userIdStr,
        amount,
        newBalance
      });
      
      return wallet;
      
    } catch (error) {
      console.error('❌ WalletService.debitWallet error:', error);
      if (error instanceof WalletError) throw error;
      throw new WalletError(`Failed to debit wallet: ${error.message}`, 'DEBIT_FAILED');
    }
  }

  // ============================================================================
  // ✅ GET TRANSACTION HISTORY (Formatted for Frontend)
  // ============================================================================
  async getTransactionHistory(userId, options = {}) {
    try {
      const wallet = await this.getWallet(userId);
      
      const { limit = 20, page = 1, type = null } = options;
      
      // Filter transactions
      let transactions = [...wallet.transactions];
      
      if (type) {
        transactions = transactions.filter(t => t.type === type);
      }
      
      // Sort by date descending (newest first)
      transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Pagination
      const total = transactions.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedTransactions = transactions.slice(start, end);

      return {
        balance: wallet.balance,
        transactions: paginatedTransactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('❌ WalletService.getTransactionHistory error:', error);
      throw new WalletError(`Failed to fetch transaction history: ${error.message}`, 'HISTORY_FAILED');
    }
  }

  // ============================================================================
  // ✅ VERIFY BALANCE (For Order Placement)
  // ============================================================================
  async verifyBalance(userId, requiredAmount) {
    try {
      const wallet = await this.getWallet(userId);
      
      if (wallet.balance < requiredAmount) {
        return {
          sufficient: false,
          currentBalance: wallet.balance,
          requiredAmount,
          deficit: requiredAmount - wallet.balance
        };
      }
      
      return {
        sufficient: true,
        currentBalance: wallet.balance,
        requiredAmount
      };

    } catch (error) {
      console.error('❌ WalletService.verifyBalance error:', error);
      throw new WalletError(`Balance verification failed: ${error.message}`, 'VERIFY_FAILED');
    }
  }

  // ============================================================================
  // ✅ PAY WITH WALLET (For Order Payment - Future Feature)
  // ============================================================================
  async payWithWallet(userId, amount, referenceId, notes = '') {
    try {
      const wallet = await this.getWallet(userId);
      
      // Call the instance method defined in Wallet.js
      await wallet.debit(amount, 'ORDER_PAYMENT', referenceId, 'Order', notes);
      
      console.log(`💳 Wallet payment successful: -₹${amount} from ${userId}`);
      
      return {
        success: true,
        newBalance: wallet.balance,
        transaction: wallet.transactions[wallet.transactions.length - 1]
      };

    } catch (error) {
      console.error('❌ WalletService.payWithWallet error:', error);
      // Re-throw wallet errors (like insufficient balance)
      if (error.name === 'WalletError') throw error;
      throw new WalletError(`Payment failed: ${error.message}`, 'PAYMENT_FAILED');
    }
  }
}

module.exports = new WalletService();
module.exports.WalletError = WalletError;