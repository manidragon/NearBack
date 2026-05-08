// D:\Mani\Code with Zosh\Backup\source code\backend\src\config\razorpayClient.js
const Razorpay = require('razorpay');
require('dotenv').config();

// ✅ CORRECT ENVIRONMENT VARIABLE NAMES
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Add validation
if (!keyId || !keySecret) {
  throw new Error('Razorpay API keys are missing in environment variables!');
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

module.exports = razorpay;