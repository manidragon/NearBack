// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\WalletController.js
const WalletService = require('../services/WalletService');
const Wallet = require('../models/Wallet');

class WalletController {
  
  // ✅ GET /api/wallet - Get user's wallet balance + recent transactions
  async getWallet(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 10 } = req.query;
      
      const walletData = await WalletService.getTransactionHistory(userId, { limit });
      
      res.status(200).json({
        success: true,
        balance: walletData.balance,
        recentTransactions: walletData.transactions,
        pagination: walletData.pagination
      });
    } catch (error) {
      console.error('❌ WalletController.getWallet error:', error);
      res.status(500).json({ error: 'Failed to fetch wallet data' });
    }
  }

  // ✅ NEW: POST /api/wallet/recalculate - Fix wallet balance inconsistencies
  async recalculateWallet(req, res) {
    try {
      const userId = req.user._id;
      
      console.log('🔄 Recalculating wallet for user:', userId);
      
      // Call the static method from Wallet model
      const wallet = await Wallet.recalculateWallet(userId);
      
      res.status(200).json({
        success: true,
        message: 'Wallet recalculated successfully',
        wallet: {
          balance: wallet.balance,
          totalCredited: wallet.totalCredited,
          totalDebited: wallet.totalDebited,
          transactionCount: wallet.transactions.length
        }
      });
    } catch (error) {
      console.error('❌ WalletController.recalculateWallet error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to recalculate wallet' 
      });
    }
  }

  // ✅ NEW: GET /api/wallet/debug - Check wallet consistency
  async debugWallet(req, res) {
    try {
      const userId = req.user._id;
      const wallet = await Wallet.findOne({ user: userId });
      
      if (!wallet) {
        return res.status(404).json({ 
          success: false, 
          error: 'Wallet not found' 
        });
      }
      
      // Calculate from visible transactions
      const visibleCredits = wallet.transactions
        .filter(t => t.type === 'CREDIT')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const visibleDebits = wallet.transactions
        .filter(t => t.type === 'DEBIT')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const calculatedBalance = visibleCredits - visibleDebits;
      
      res.status(200).json({
        success: true,
        currentBalance: wallet.balance,
        calculatedFromVisible: calculatedBalance,
        difference: wallet.balance - calculatedBalance,
        visibleCredits,
        visibleDebits,
        totalCredited: wallet.totalCredited,
        totalDebited: wallet.totalDebited,
        transactionCount: wallet.transactions.length,
        hasOldTransactions: wallet.totalCredited > visibleCredits || wallet.totalDebited > visibleDebits,
        transactions: wallet.transactions.map(t => ({
          type: t.type,
          amount: t.amount,
          reason: t.reason,
          balanceAfter: t.balanceAfter,
          createdAt: t.createdAt
        }))
      });
    } catch (error) {
      console.error('❌ WalletController.debugWallet error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new WalletController();