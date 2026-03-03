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
    size: { 
        type: String, 
        required: true 
    },
    quantity: { 
        type: Number, 
        default: 1 
    },
    mrpPrice: { 
        type: Number, 
        default:0,
        required: true 
    },
    sellingPrice: { 
        type: Number,
        default:0,
        required: true 
    },
    userId: { 
        type: String, 
        required: true 
    }
}, { timestamps: true });

const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = CartItem;
