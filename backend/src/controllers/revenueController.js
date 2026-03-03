const SellerError = require("../exceptions/SellerError");
const RevenuewService = require("../services/RevenuewService");


// Revenue Controller
class RevenueController {
  async getRevenueChart(req, res) {
    const type = req.query.type || 'daily';     

    try {
      const seller = await req.seller;
      
    //   const revenue = await getRevenueChartByType(type, seller._id);
    const revenue=await RevenuewService.getRevenueChartByType(type, seller._id);
      return res.status(200).json(revenue);
    } catch (error) {
    
      return res.status(500).json({ error:error.message });
    }
  }
}

module.exports = new RevenueController();
