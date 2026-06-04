// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\Wallet.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletTransactionSchema = new Schema({
  // 💳 Transaction Type
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT'],
    required: true,
    index: true
  },

  // 💰 Amount
  amount: {
    type: Number,
    required: true,
    min: 0
  },

  // 📝 Reason/Category
  reason: {
    type: String,
    enum: [
      'RETURN_REFUND',      // From return request
      'ORDER_PAYMENT',      // Used for order
      'WITHDRAWAL',         // Bank transfer out
      'ADMIN_ADJUSTMENT',   // Manual correction
      'COUPON_CASHBACK',    // Promotional credit
      'REFERRAL_BONUS'      // Referral reward
    ],
    required: true
  },

  // 🔗 Reference to source document (polymorphic)
  referenceId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  referenceModel: {
    type: String,
    enum: ['ReturnRequest', 'Order', 'Withdrawal', 'Coupon', 'Referral'],
    required: true
  },

  // 📊 Balance snapshot (for audit trail)
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },

  // 📝 Optional notes
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  },

  createdAt: { type: Date, default: Date.now }
});

const walletSchema = new Schema({
  // 🔗 User Reference
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,  // One wallet per user
    index: true
  },

  // 💰 Current Balance
  balance: {
    type: Number,
    default: 0,
    min: 0,  // Prevent negative balances
    index: true  // ✅ For "users with balance > X" queries
  },

  // 📜 Transaction History (embedded for fast access)
  transactions: [walletTransactionSchema],

  // ⚙️ Settings (future-proofing)
  settings: {
    autoWithdraw: { type: Boolean, default: false },
    minWithdrawAmount: { type: Number, default: 100 },
    notifications: {
      credit: { type: Boolean, default: true },
      debit: { type: Boolean, default: true }
    }
  },

  // 📊 Metadata
  lastTransactionAt: Date,
  totalCredited: { type: Number, default: 0 },  // Lifetime credits
  totalDebited: { type: Number, default: 0 },    // Lifetime debits

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Index for transaction queries
walletSchema.index({ 'transactions.referenceId': 1, 'transactions.reason': 1 });

// ✅ Virtual: Get recent transactions (last 10)
walletSchema.virtual('recentTransactions').get(function () {
  return this.transactions.slice(-10).reverse();
});

// ✅ Virtual: Get total refunds (for customer insight)
walletSchema.virtual('totalRefunds').get(function () {
  return this.transactions
    .filter(t => t.reason === 'RETURN_REFUND' && t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);
});

// ✅ Pre-save: Update metadata
walletSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.transactions.length > 0) {
    this.lastTransactionAt = this.transactions[this.transactions.length - 1].createdAt;
  }
  next();
});

// ✅ Instance Method: Credit wallet (atomic)
walletSchema.methods.credit = async function (amount, reason, referenceId, referenceModel, notes = '') {
  if (amount <= 0) throw new Error('Credit amount must be positive');

  const transaction = {
    type: 'CREDIT',
    amount,
    reason,
    referenceId,
    referenceModel,
    balanceAfter: this.balance + amount,
    notes
  };

  this.balance += amount;
  this.totalCredited += amount;
  this.transactions.push(transaction);

  return await this.save();
};

// ✅ Instance Method: Debit wallet (atomic)
walletSchema.methods.debit = async function (amount, reason, referenceId, referenceModel, notes = '') {
  if (amount <= 0) throw new Error('Debit amount must be positive');
  if (amount > this.balance) {
    throw new Error(`Insufficient balance: ${this.balance} < ${amount}`);
  }

  const transaction = {
    type: 'DEBIT',
    amount,
    reason,
    referenceId,
    referenceModel,
    balanceAfter: this.balance - amount,
    notes
  };

  this.balance -= amount;
  this.totalDebited += amount;
  this.transactions.push(transaction);

  return await this.save();
};

// ✅ Static Method: Get or create wallet for user
walletSchema.statics.getOrCreate = async function (userId) {
  let wallet = await this.findOne({ user: userId });

  if (!wallet) {
    wallet = new this({
      user: userId,
      balance: 0,
      settings: {
        autoWithdraw: false,
        minWithdrawAmount: 100,
        notifications: { credit: true, debit: true }
      }
    });
    await wallet.save();
  }

  return wallet;
};

// ✅ Static Method: Recalculate wallet balance and totals from transactions
walletSchema.statics.recalculateWallet = async function (userId) {
  const wallet = await this.findOne({ user: userId });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Sort transactions by date
  const sortedTransactions = wallet.transactions.sort((a, b) =>
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Recalculate from scratch
  let balance = 0;
  let totalCredited = 0;
  let totalDebited = 0;

  // Update each transaction with correct balanceAfter
  for (const transaction of sortedTransactions) {
    if (transaction.type === 'CREDIT') {
      balance += transaction.amount;
      totalCredited += transaction.amount;
    } else if (transaction.type === 'DEBIT') {
      balance -= transaction.amount;
      totalDebited += transaction.amount;
    }

    // Update balanceAfter for this transaction
    transaction.balanceAfter = balance;
  }

  // Update wallet
  wallet.balance = balance;
  wallet.totalCredited = totalCredited;
  wallet.totalDebited = totalDebited;
  wallet.transactions = sortedTransactions;
  wallet.updatedAt = new Date();

  await wallet.save();

  console.log('✅ Wallet recalculated:', {
    userId,
    balance,
    totalCredited,
    totalDebited,
    transactionCount: sortedTransactions.length
  });

  return wallet;
};

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;