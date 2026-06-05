const mongoose = require('mongoose');
const { Schema } = mongoose;

// ✅ Return reasons enum (expandable)
const RETURN_REASONS = [
  'Wrong size',
  'Defective/Damaged',
  'Wrong item delivered',
  'Not as described',
  'Changed mind',
  'Better price found',
  'Other'
];

// ✅ Return/Replacement status workflow - Unified for both types
const RETURN_STATUS = {
  // Regular return statuses
  PENDING: 'PENDING',           // Customer submitted, awaiting seller approval
  APPROVED: 'APPROVED',         // Seller approved, awaiting pickup
  REJECTED: 'REJECTED',         // Seller rejected return
  PICKED_UP: 'PICKED_UP',       // Courier picked up return item
  COMPLETED: 'COMPLETED',       // Item received, refund processed
  CANCELLED: 'CANCELLED',       // Request cancelled
  
  // ✅ Replacement-specific statuses (Phase 3)
  ORIGINAL_RETURNED: 'ORIGINAL_RETURNED',     // Customer returned original, seller reviewing
  REVIEW_COMPLETED: 'REVIEW_COMPLETED',       // Seller verified original, ready to ship replacement
  REPLACEMENT_SHIPPED: 'REPLACEMENT_SHIPPED'  // Replacement shipped to customer
};

const returnRequestSchema = new Schema({
  // ============================================================================
  // 🔗 CORE REFERENCES (Shared by returns & replacements)
  // ============================================================================
  orderItem: {
    type: Schema.Types.ObjectId,
    ref: 'OrderItem',
    required: true,
    index: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // ============================================================================
  // 📝 RETURN/REPLACEMENT DETAILS (Shared)
  // ============================================================================
  reason: {
    type: String,
    enum: RETURN_REASONS,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  images: [{
    type: String,
    trim: true
  }],

  // ============================================================================
  // 💰 REFUND CONFIGURATION (Phase 2 - Only for regular returns)
  // ============================================================================
  refundAmount: {
    type: Number,
    required: function() { return !this.isReplacement; },  // ✅ Only required for non-replacements
    min: 0
  },
  refundMethod: {
    type: String,
    enum: ['WALLET', 'RAZORPAY', 'BANK_TRANSFER'],
    default: 'WALLET'
  },
  razorpayRefundId: {
    type: String,
    trim: true,
    sparse: true
  },
  bankRefundDetails: {
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    accountHolderName: { type: String, trim: true }
  },
  refundStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
    index: true
  },

  // ============================================================================
  // 🔄 REPLACEMENT FIELDS (Phase 3 - Only populated when isReplacement = true)
  // ============================================================================
  isReplacement: {
    type: Boolean,
    default: false,
    index: true
  },
  replacementOrder: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    sparse: true  // Only populated when isReplacement = true
  },
  replacementVariant: {
    variantId: { type: String, trim: true },
    color: { type: String, trim: true },
    specifications: { type: Map, of: String },
    sellingPrice: { type: Number, min: 0 },
    stock: { type: Number, min: 0 }
  },
  // ✅ Replacement workflow timestamps
  originalReturnedAt: { type: Date },
  reviewCompletedAt: { type: Date },
  replacementShippedAt: { type: Date },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // ============================================================================
  // 🔄 STATUS WORKFLOW (Unified enum with type-aware validation)
  // ============================================================================
  status: {
    type: String,
    enum: Object.values(RETURN_STATUS),
    default: RETURN_STATUS.PENDING,
    index: true
  },

  // ============================================================================
  // 📍 PICKUP LOGISTICS (Shared)
  // ============================================================================
  pickupAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true, index: true },
    pincode: { type: String, trim: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' }
    }
  },

  // ============================================================================
  // 👤 APPROVAL & TRACKING (Shared)
  // ============================================================================
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Seller'
  },
  approvedAt: Date,
  pickedUpAt: Date,
  completedAt: Date,
  rejectedReason: {
    type: String,
    trim: true,
    maxlength: 200
  },
  cancelledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,

  // ============================================================================
  // 📊 METADATA
  // ============================================================================
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================================
// ✅ INDEXES FOR PERFORMANCE
// ============================================================================
returnRequestSchema.index({ seller: 1, status: 1, createdAt: -1 });  // Seller dashboard
returnRequestSchema.index({ customer: 1, status: 1, createdAt: -1 }); // Customer history
returnRequestSchema.index({ order: 1, orderItem: 1 }, { unique: true }); // Prevent duplicate returns
returnRequestSchema.index({ refundMethod: 1, refundStatus: 1 });  // Phase 2: Filter by refund
returnRequestSchema.index({ isReplacement: 1, replacementOrder: 1 }); // Phase 3: Replacement lookup
returnRequestSchema.index({ isReplacement: 1, status: 1, createdAt: -1 }); // Phase 3: Replacement workflow queries

// ============================================================================
// ✅ VIRTUALS FOR DISPLAY
// ============================================================================
returnRequestSchema.virtual('product', {
  ref: 'Product',
  localField: 'orderItem',
  foreignField: '_id',
  justOne: false,
  options: { 
    select: 'title images variants',
    populate: { path: 'variants', select: 'color specifications images' }
  }
});

returnRequestSchema.virtual('daysSinceCreated').get(function() {
  if (!this.createdAt || !(this.createdAt instanceof Date) || isNaN(this.createdAt.getTime())) {
    return 0;
  }
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// ============================================================================
// ✅ PRE-SAVE HOOKS
// ============================================================================
returnRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // ✅ Auto-set refundAmount to 0 for replacements (no refund, just exchange)
  if (this.isReplacement && this.refundAmount === undefined) {
    this.refundAmount = 0;
  }
  
  next();
});

// ============================================================================
// ✅ TYPE-AWARE VALIDATION (Pre-validate hook)
// ============================================================================
returnRequestSchema.pre('validate', function(next) {
  // REPLACEMENT-specific validation
  if (this.isReplacement) {
    // Replacements don't need refundAmount > 0 (price difference handled separately)
    if (this.refundAmount !== undefined && this.refundAmount < 0) {
      return next(new Error('Replacement refundAmount cannot be negative'));
    }
    
    // Replacement variant is required for replacements
    if (!this.replacementVariant?.variantId) {
      return next(new Error('Replacement requests require replacementVariant.variantId'));
    }
  }
  
  // RETURN-specific validation (non-replacements)
  if (!this.isReplacement) {
    if (this.refundAmount === undefined || this.refundAmount <= 0) {
      return next(new Error('Return requests require a valid refundAmount > 0'));
    }
  }
  
  next();
});

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);

module.exports = ReturnRequest;
module.exports.RETURN_STATUS = RETURN_STATUS;
module.exports.RETURN_REASONS = RETURN_REASONS;