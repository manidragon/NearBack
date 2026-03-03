// src/types/seller.ts

export interface PickupAddress {
    _id?: string;
    name: string;
    mobile: string;
    pinCode: string;
    address: string;
    locality: string;
    city: string;
    state: string;
}

export interface BankDetails {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
}

export interface BusinessDetails {
    businessName: string;
    businessEmail?: string;      // ✅ Added
    businessMobile?: string;     // ✅ Added
    businessAddress?: string;    // ✅ Added
    logo?: string;
    banner?: string;
}

export interface Seller {
    _id: string;                 // ✅ Changed from number to string (MongoDB ObjectId)
    mobile: string;
    GSTIN: string;
    pickupAddress: string | PickupAddress;  // ✅ Can be ObjectId string or populated object
    bankDetails: BankDetails;
    sellerName: string;
    email: string;
    businessDetails: BusinessDetails;
    password?: string;           // ✅ Made optional (not returned in responses)
    accountStatus?: string;
    role: string;
    isEmailVerified?: boolean;   // ✅ Added
}

// ✅ New type for API responses that include JWT
export interface SellerAuthResponse extends Seller {
  jwt: string;
}

export interface SellerReport {
    _id: string;
    seller: Seller;
    totalEarnings: number;
    totalSales: number;
    totalRefunds: number;
    totalTax: number;
    netEarnings: number;
    totalOrders: number;
    canceledOrders: number;
    totalTransactions: number;
}