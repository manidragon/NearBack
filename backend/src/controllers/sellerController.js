// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\sellerController.js
const UserRoles = require("../domain/UserRole");
const SellerError = require("../exceptions/SellerError");
const Seller = require("../models/Seller");
const VerificationCode = require("../models/VerificationCode");
const SellerService = require("../services/SellerService");
const VerificationService = require("../services/VerificationService");
const generateOTP = require("../utils/generateOtp");
const jwtProvider = require("../utils/jwtProvider");
const { sendVerificationEmail } = require("../utils/sendEmail");

class SellerController {
  async getSellerProfile(req, res) {
    try {
      const jwt = req.headers.authorization.split(" ")[1];
      const seller = await SellerService.getSellerProfile(jwt);

      res.status(200).json(seller);
    } catch (err) {
      res
        .status(err instanceof SellerError ? 404 : 500)
        .json({ message: err.message });
    }
  }

  async createSeller(req, res) {
    try {
      const { email, otp, ...sellerData } = req.body;

      // 🔑 Verify OTP FIRST (mandatory)
      const verificationCode = await VerificationService.getVerificationCodeByEmail(email);
      if (!verificationCode || verificationCode.otp !== otp) {
        throw new SellerError("Invalid or expired OTP");
      }

      // Check if seller already exists
      const existingSeller = await Seller.findOne({ email });
      if (existingSeller) {
        await VerificationService.deleteVerificationCode(verificationCode._id);
        throw new SellerError("Seller already exists with this email");
      }

      // 🔑 Delete used OTP
      await VerificationService.deleteVerificationCode(verificationCode._id);

      const newSeller = await SellerService.createSeller({
        email,
        ...sellerData
      });

      return res.status(201).json({
        message: "Seller registration successful. Your application is pending admin approval.",
        seller: {
          _id: newSeller._id,
          email: newSeller.email,
          sellerName: newSeller.sellerName,
          accountStatus: newSeller.accountStatus
        }
      });

    } catch (err) {
      res
        .status(err instanceof SellerError ? 400 : 500)
        .json({ error: err.message });
    }
  }

  async getSellerById(req, res) {
    try {
      const seller = await SellerService.getSellerById(req.params.id);
      res.status(200).json(seller);
    } catch (err) {
      res
        .status(err instanceof SellerError ? 404 : 500)
        .json({ message: err.message });
    }
  }

  // ✅ UPDATED: now returns totalReviews + averageRating per product
  async getSellerProductsById(req, res) {
    try {
      const Product = require("../models/Product");
      const Review = require("../models/Review");

      const sellerId = req.params.id;

      // Fetch all active products that have at least one offer from this seller
      const products = await Product.find({
        "variants.offers.seller": sellerId,
        isActive: true
      }).lean();

      // For each product, count reviews and compute average rating
      const productsWithReviews = await Promise.all(
        products.map(async (product) => {
          const reviews = await Review.find(
            { product: product._id },
            { rating: 1 }   // only fetch rating field — faster
          ).lean();

          const totalReviews = reviews.length;
          const averageRating =
            totalReviews > 0
              ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                totalReviews
              : 0;

          return { ...product, totalReviews, averageRating };
        })
      );

      res.status(200).json(productsWithReviews);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getAllSellers(req, res) {
    try {
      const { status } = req.query;
      const sellers = await SellerService.getAllSellers(status);
      res.status(200).json(sellers);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async updateSeller(req, res) {
    try {
      const seller = await req.seller;
      const updatedSeller = await SellerService.updateSeller(
        seller,
        req.body
      );
      res.status(200).json(updatedSeller);
    } catch (err) {
      res
        .status(err instanceof SellerError ? 404 : 500)
        .json({ message: err.message });
    }
  }

  async deleteSeller(req, res) {
    try {
      await SellerService.deleteSeller(req.params.id);
      res.status(204).send();
    } catch (err) {
      res
        .status(err instanceof SellerError ? 404 : 500)
        .json({ message: err.message });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { email, otp } = req.body;
      const seller = await SellerService.verifyEmail(email, otp);
      res.status(200).json(seller);
    } catch (err) {
      res
        .status(err instanceof SellerError ? 404 : 500)
        .json({ message: err.message });
    }
  }

  async updateSellerAccountStatus(req, res) {
    try {
      const updatedSeller = await SellerService.updateSellerAccountStatus(
        req.params.id,
        req.params.status
      );
      res.status(200).json(updatedSeller);
    } catch (err) {
      res
        .status(err instanceof SellerError ? 404 : 500)
        .json({ message: err.message });
    }
  }

  async sendLoginOtp(req, res) {
    try {
      const { email } = req.body;
      const otp = generateOTP();
      await VerificationService.createVerificationCode(otp, email);
      return res.status(200).json({ message: "OTP sent successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async verifyLoginOtp(req, res) {
    try {
      const { otp, email } = req.body;

      const seller = await Seller.findOne({ email });
      if (!seller) {
        throw new SellerError("Invalid email or password");
      }

      if (seller.accountStatus !== "ACTIVE") {
        let message = "Your account is not active.";
        if (seller.accountStatus === "PENDING_VERIFICATION") {
          message = "Your application is still pending. Please wait for admin approval.";
        } else if (seller.accountStatus === "SUSPENDED") {
          message = "Your account has been suspended. Please contact support.";
        } else if (seller.accountStatus === "BANNED") {
          message = "Your account has been banned.";
        } else if (seller.accountStatus === "DEACTIVATED") {
          message = "Your account has been deactivated.";
        } else if (seller.accountStatus === "CLOSED") {
          message = "Your account has been closed.";
        }
        throw new SellerError(message);
      }

      const verificationCode = await VerificationCode.findOne({ email });
      if (!verificationCode || verificationCode.otp !== otp) {
        throw new Error("Invalid OTP");
      }

      await VerificationCode.deleteOne({ _id: verificationCode._id });

      const token = jwtProvider.createJwt({
        email: seller.email,
        id: seller._id,
        role: seller.role
      });

      return res.status(200).json({
        message: "Login Success",
        jwt: token,
        role: seller.role,
        accountStatus: seller.accountStatus
      });

    } catch (err) {
      res
        .status(err instanceof SellerError ? 403 : 400)
        .json({ message: err.message });
    }
  }
}

module.exports = new SellerController();