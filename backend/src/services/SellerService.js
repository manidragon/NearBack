// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\SellerService.js
const Seller = require("../models/Seller"); // Your Seller model
const Address = require("../models/Address"); // Your Address model
const jwtProvider = require("../utils/jwtProvider"); // JWT utility
const bcrypt = require("bcrypt");
const UserRoles = require("../domain/UserRole");
const SellerError = require("../exceptions/SellerError");

class SellerService {
  async getSellerProfile(jwt) {
    const payload = jwtProvider.verifyJwt(jwt);
    const email = payload.email;
    // console.log("email -----  ",email)
    return this.getSellerByEmail(email);
  }

  async createSeller(sellerData) {
    const existingSeller = await Seller.findOne({ email: sellerData.email });
    if (existingSeller) {
      throw new SellerError("Seller already exists, use a different email");
    }

    let savedAddress = sellerData.pickupAddress;

    if (!sellerData.pickupAddress._id) {
      savedAddress = await Address.create(sellerData.pickupAddress);
    }

    const newSeller = new Seller({
      email: sellerData.email,
      pickupAddress: savedAddress,
      sellerName: sellerData.sellerName,
      GSTIN: sellerData.GSTIN,
      role: UserRoles.ROLE_SELLER,
      mobile: sellerData.mobile,
      password: await bcrypt.hash(sellerData.password, 10),
      bankDetails: sellerData.bankDetails,
      businessDetails: sellerData.businessDetails,
    });

    return await newSeller.save();
  }

  async getSellerById(id) {
    const seller = await Seller.findById(id);
    if (!seller) {
      throw new SellerError("Seller not found");
    }
    return seller;
  }

  async getSellerByEmail(email) {
    const seller = await Seller.findOne({ email }).populate("pickupAddress");
    // console.log("seller ",seller)
    if (!seller) {
      throw new SellerError("Seller not found");
    }
    return seller;
  }

  async getAllSellers(status) {
    return await Seller.find({ accountStatus: status });
  }

  async updateSeller(existingSeller, sellerData) {
    return await Seller.findByIdAndUpdate(existingSeller._id, sellerData, {
      new: true,
    }).populate("pickupAddress");
  }

  async deleteSeller(id) {
    const exists = await Seller.exists({ _id: id });
    if (!exists) {
      throw new SellerError("Seller not found with id " + id);
    }
    await Seller.deleteOne({ _id: id });
  }

  async verifyEmail(email, otp) {
    const seller = await this.getSellerByEmail(email);
    seller.isEmailVerified = true;
    return await seller.save();
  }

  async updateSellerAccountStatus(sellerId, status) {
    const seller = await this.getSellerById(sellerId);
    seller.accountStatus = status;
    return await seller.save();
  }
}

module.exports = new SellerService();
