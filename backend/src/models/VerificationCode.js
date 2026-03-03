const mongoose = require('mongoose');
const { Schema } = mongoose;


const verificationCodeSchema = new Schema({
    otp: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    seller: { 
        type: Schema.Types.ObjectId, 
        ref: 'Seller' 
    }
}, { timestamps: true });

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);

module.exports = VerificationCode;
