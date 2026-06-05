// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\transactionController.js
const SellerService = require("../services/SellerService");
const TransactionService = require("../services/TransactionService");

class TransactionController {
async getTransactionBySeller(req, res) {
  try {
    const seller = await req.seller;
    
    // ✅ Parse query params for filtering
    const { startDate, endDate, status } = req.query;
    
    const transactions = await TransactionService.getTransactionsBySellerId(
      seller._id,
      { startDate, endDate, status }
    );
    
    console.log(`✅ Fetched ${transactions.length} transactions for seller:`, seller._id);
    
    // ✅ Return just the array (simpler for frontend)
    return res.status(200).json(transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions:", {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: "Failed to fetch transactions", 
      message: error.message 
    });
  }
}
}

module.exports = new TransactionController();