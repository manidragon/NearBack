// D:\Mani\Code with Zosh\Backup\source code\backend\src\config\razorpayClient.js
const Razorpay = require('razorpay');
require('dotenv').config();

// ✅ Get environment variables
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// ✅ Validate keys
if (!keyId || !keySecret) {
  throw new Error('Razorpay API keys are missing in environment variables!');
}

// ✅ Create Razorpay instance
const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

// ✅ DEBUG: Verify SDK structure at startup (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Razorpay client initialized:', {
    hasRefunds: !!razorpay.refunds,
    hasRefundsCreate: typeof razorpay.refunds?.create,
    availableMethods: Object.keys(razorpay).filter(k => typeof razorpay[k] === 'object').slice(0, 10)
  });
}

// ✅ Export the instance
module.exports = razorpay;

// ✅ Optional: Export a helper to verify refunds API
module.exports.verifyRefundsAPI = () => {
  return typeof razorpay.refunds?.create === 'function';
};