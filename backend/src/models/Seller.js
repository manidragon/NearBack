// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\Seller.js
const mongoose = require('mongoose');
const UserRoles = require('../domain/UserRole');
const AccountStatus = require('../domain/AccountStatus');


// Define the Seller schema
const sellerSchema = new mongoose.Schema({
    sellerName: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    }, 
    password: {
        type: String,
        required: true,
        select: false  
    },
    businessDetails: {
        businessName: {
            type: String,
            required: true
        },
        businessEmail: {
            type: String,
            
        },
        businessMobile: {
            type: String,
            
        },
        businessAddress: {
            type: String,
            
        },
        logo: {  
            type: String   
        },
        banner: {
            type: String
        }
    },
    bankDetails: {
        accountNumber: {
            type: String,
            required: true
        },
        accountHolderName: {
            type: String,
            required: true
        },
        ifscCode: {
            type: String,
            required: true
        }
    },
    pickupAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'  
    },
    GSTIN: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [UserRoles.CUSTOMER, UserRoles.SELLER, UserRoles.ADMIN],  // Use the USER_ROLE enum
        default: UserRoles.SELLER
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    accountStatus: {
        type: String,
        enum: [
            AccountStatus.PENDING_VERIFICATION, 
            AccountStatus.ACTIVE, 
            AccountStatus.SUSPENDED, 
            AccountStatus.DEACTIVATED, 
            AccountStatus.BANNED, 
            AccountStatus.CLOSED
        ],  
        default: AccountStatus.PENDING_VERIFICATION
    }
}, {
    timestamps: true  
});

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;
