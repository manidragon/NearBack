// services/VerificationService.js
const VerificationCode = require('../models/VerificationCode'); 

class VerificationService {
  // ✅ Create OTP
  async createVerificationCode(otp, email) {
    const existingCode = await VerificationCode.findOne({ email });
    if (existingCode) {
      await VerificationCode.deleteOne({ _id: existingCode._id });
    }

    const verificationCode = new VerificationCode({ otp, email });
    return await verificationCode.save();
  }

  // ✅ Get OTP by email
  async getVerificationCodeByEmail(email) {
    return await VerificationCode.findOne({ email });
  }

  // ✅ Delete OTP by ID
  async deleteVerificationCode(id) {
    return await VerificationCode.findByIdAndDelete(id);
  }
}

module.exports = new VerificationService(); // 👈 singleton instance