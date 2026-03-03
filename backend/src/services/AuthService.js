// src/services/AuthService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendVerificationEmail } = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOtp');
const VerificationCode = require('../models/VerificationCode');
const User = require('../models/User');
const Cart = require('../models/Cart');
const jwtProvider = require('../utils/jwtProvider');
const UserError = require('../exceptions/UserError');

class AuthService {
  async sendLoginOtp(email) {
    // Delete existing OTP
    await VerificationCode.deleteOne({ email });

    const otp = generateOTP();
    const verificationCode = new VerificationCode({ otp, email });
    await verificationCode.save();

    // Optional: send email
    // const subject = "Near Look Login/Signup OTP";
    // const text = `Your login OTP is - ${otp}`;
    // await sendVerificationEmail(email, subject, text);
  }

  async createUser(req) {
    const { email, fullName, otp } = req;

    // 🔑 Verify OTP
    const verificationCode = await VerificationCode.findOne({ email });
    if (!verificationCode || verificationCode.otp !== otp) {
      throw new Error("Wrong OTP...");
    }

    // 🔑 Delete used OTP
    await VerificationCode.deleteOne({ _id: verificationCode._id });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        fullName,
        role: 'ROLE_CUSTOMER',
        password: await bcrypt.hash(otp, 10)
      });
      await user.save();

      const cart = new Cart({ user: user._id });
      await cart.save();
    }

    // ✅ Include ROLE in JWT
    const token = jwtProvider.createJwt({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    return token;
  }

  async signin(req) {
    const { email, otp } = req;

    const user = await User.findOne({ email });
    if (!user) {
      throw new UserError("Invalid username or password");
    }

    // 🔑 Verify OTP
    const verificationCode = await VerificationCode.findOne({ email });
    if (!verificationCode || verificationCode.otp !== otp) {
      throw new Error("Wrong OTP...");
    }

    // 🔑 Delete used OTP
    await VerificationCode.deleteOne({ _id: verificationCode._id });

    // ✅ Include ROLE in JWT
const token = jwtProvider.createJwt({ 
      userId: user._id.toString(),  
      email: user.email,             
      role: user.role                
    });
    return {
      message: "Login Success",
      jwt: token,
      role: user.role
    };
  }
}

module.exports = new AuthService();