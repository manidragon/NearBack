// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\HomeCategory.js
const mongoose = require('mongoose');
const HomeCategorySection = require('../domain/HomeCategorySection');
const { Schema } = mongoose;

const homeCategorySchema = new Schema({
    image: {
        type: String,
        required: true,
    },
    description: { // ✅ NEW FIELD
        type: String,
        required: false,
        maxlength: 100,
    },
    section: {
        type: String,
        enum: Object.values(HomeCategorySection),
        required: true,
    },
}, {
    timestamps: true,
});

const HomeCategory = mongoose.model('HomeCategory', homeCategorySchema);
module.exports = HomeCategory;