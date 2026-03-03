const SellerService = require("../services/SellerService");
const TransactionService = require("../services/TransactionService");

class TransactionController {
  async getTransactionBySeller(req, res) {
    try {
      const seller = await req.seller;
      const transactions = await TransactionService.getTransactionsBySellerId(
        seller._id
      );
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TransactionController();