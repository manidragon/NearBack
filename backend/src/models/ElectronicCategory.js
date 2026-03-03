// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\ElectronicCategory.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const electronicCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  categoryId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 150
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ElectronicCategory = mongoose.model('ElectronicCategory', electronicCategorySchema);
module.exports = ElectronicCategory;