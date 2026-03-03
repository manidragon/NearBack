// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\Deal.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const dealSchema = new Schema({
    discount: {
        type: Number,
        required: true,
    },
    category: {
        type: Schema.Types.ObjectId, 
        ref: 'HomeCategory',
        required: true,
    },
}, {
    timestamps: true, 
});

const Deal = mongoose.model('Deal', dealSchema);

module.exports = Deal;
