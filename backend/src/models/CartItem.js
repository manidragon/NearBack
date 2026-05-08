// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\CartItem.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartItemSchema = new Schema({
    cart: { 
        type: Schema.Types.ObjectId, 
        ref: 'Cart', 
        required: true 
    },
    product: { 
        type: Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    // ✅ NEW: Track which variant was selected
    variantId: {
        type: Schema.Types.ObjectId,
        required: false
    },
    // ✅ NEW: Track which seller's offer was used
    sellerId: {
        type: Schema.Types.ObjectId,
        ref: 'Seller',
        required: false
    },
    // ✅ NEW: Track specific offer (for multi-offer variants)
    offerId: {
        type: Schema.Types.ObjectId,
        required: false
    },
    size: { 
        type: String, 
        required: true 
    },
    quantity: { 
        type: Number, 
        default: 1,
        min: 1
    },
    mrpPrice: { 
        type: Number, 
        default: 0,
        required: true 
    },
    sellingPrice: { 
        type: Number,
        default: 0,
        required: true 
    },
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    }
}, { timestamps: true });

const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = CartItem;
