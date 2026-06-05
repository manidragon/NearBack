// src/utils/jwtProvider.js
require('dotenv').config();

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET; // ✅ Correct name

if (!SECRET_KEY) {
  throw new Error("JWT_SECRET is not defined in environment variables!");
}

class JwtProvider {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }

    // Method to create JWT
    createJwt(payload) {
        return jwt.sign(payload, this.secretKey, { expiresIn: '48h' }); 
    }

    getEmailFromJwt(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            return decoded.email; 
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Method to verify JWT
    verifyJwt(token) {
        try {
            return jwt.verify(token, this.secretKey);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

module.exports = new JwtProvider(SECRET_KEY); 
