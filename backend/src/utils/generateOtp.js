// utils/index.js
const nodemailer = require('nodemailer');

// OTP generation
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
}

module.exports = generateOTP;