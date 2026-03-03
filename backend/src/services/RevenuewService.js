const Order = require("../models/Order");

class RevenueService {
  // Helper function to get the start of a day
  getStartOfDay(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  // Helper function to get the end of a day
  getEndOfDay(date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  // Helper function to format the date
  formatDate(date) {
    return date.toISOString().split('T')[0]; // Format as "YYYY-MM-DD"
  }

  // Get daily revenue data for the past X days
  async getDailyRevenueForChart(days, sellerId) {
    const revenueData = [];
    const currentDate = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);

      const startOfDay = this.getStartOfDay(date);
      const endOfDay = this.getEndOfDay(date);

      const dailyRevenue = await Order.find({
        seller: sellerId,
        orderDate: { $gte: startOfDay, $lte: endOfDay },
      }).then(orders =>
        orders.reduce((total, order) => total + order.totalSellingPrice, 0)
      );

      revenueData.push({
        revenue: dailyRevenue,
        date: this.formatDate(date), // Format as string
      });
    }

    return revenueData;
  }

  // Get monthly revenue data for the past X months
  async getMonthlyRevenueForChart(months, sellerId) {
    const revenueData = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);

      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthlyRevenue = await Order.find({
        seller: sellerId,
        orderDate: { $gte: startOfMonth, $lte: endOfMonth },
      }).then(orders =>
        orders.reduce((total, order) => total + order.totalSellingPrice, 0)
      );

      revenueData.push({
        revenue: monthlyRevenue,
        date: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`, // Format as "YYYY-MM"
      });
    }

    return revenueData;
  }

  // Get yearly revenue data for the past X years
  async getYearlyRevenueForChart(years, sellerId) {
    const revenueData = [];
    const currentDate = new Date();

    for (let i = years - 1; i >= 0; i--) {
      const date = new Date();
      date.setFullYear(currentDate.getFullYear() - i);

      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

      const yearlyRevenue = await Order.find({
        sellerId: sellerId,
        orderDate: { $gte: startOfYear, $lte: endOfYear },
      }).then(orders =>
        orders.reduce((total, order) => total + order.totalSellingPrice, 0)
      );

      revenueData.push({
        revenue: yearlyRevenue,
        date: String(startOfYear.getFullYear()), // Format as "YYYY"
      });
    }

    return revenueData;
  }

  // Get hourly revenue data for the current day
  async getHourlyRevenueForChart(sellerId) {
    const revenueData = [];
    const currentDate = new Date();
    const startOfDay = this.getStartOfDay(currentDate);

    for (let i = 0; i < 24; i++) {
      const startOfHour = new Date(startOfDay);
      startOfHour.setHours(i, 0, 0, 0);
      const endOfHour = new Date(startOfDay);
      endOfHour.setHours(i, 59, 59, 999);

      

      const hourlyRevenue = await Order.find({
        seller: sellerId,
        orderDate: { $gte: startOfHour, $lte: endOfHour },
      })
      .then(orders =>
      {
        return orders.reduce((total, order) => total + order.totalSellingPrice, 0)
      }
        
      );

    

      revenueData.push({
        revenue: hourlyRevenue,
        date: `${String(i).padStart(2, '0')}:00`, // Format as "HH:00"
      });
    }

    return revenueData;
  }

  // Get revenue chart data by type (daily, monthly, or hourly)
  async getRevenueChartByType(type, sellerId) {
    // console.log("type chart",type,sellerId)
    if (type === 'monthly') {
      return await this.getMonthlyRevenueForChart(12, sellerId);
    } else if (type === 'daily') {
      return await this.getDailyRevenueForChart(30, sellerId);
    } else {
        
      return await this.getHourlyRevenueForChart(sellerId);
    }
  }
}

module.exports = new RevenueService();
