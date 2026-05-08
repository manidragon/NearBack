// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\User.js
const mongoose = require("mongoose");
const UserRoles = require("../domain/UserRole");

// Define the User schema
const userSchema = new mongoose.Schema(
  {
    password: {
      type: String,
      required: true,
      select: false, // This prevents the password from being returned in queries unless explicitly selected
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
    },
     profilePicture: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: [UserRoles.CUSTOMER, UserRoles.SELLER, UserRoles.ADMIN], 
      default: UserRoles.CUSTOMER,
    },
    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address", 
      },
    ],
    usedCoupons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon", 
      },
    ],
  },
  {
    timestamps: true, 
  }
);

// Create the User model
const User = mongoose.model("User", userSchema);

module.exports = User;
