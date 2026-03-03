// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\CategoryAttribute.js
const mongoose = require('mongoose');

const categoryAttributeSchema = new mongoose.Schema({
  // ✅ Reference to Level 3 category using categoryId (string slug)
  categoryId: {
    type: String,
    required: [true, 'Category ID is required'],
    trim: true,
    lowercase: true,
    index: true,  // Faster queries by categoryId
  },
  
  // ✅ Attribute key for specifications object (e.g., "ram", "fabric")
  name: {
    type: String,
    required: [true, 'Attribute name is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9_]+$/, 'Name must be lowercase alphanumeric with underscores'],
  },
  
  // ✅ Display label for forms (e.g., "RAM", "Fabric Type")
  label: {
    type: String,
    required: [true, 'Attribute label is required'],
    trim: true,
  },
  
  // ✅ Input type for form rendering
  type: {
    type: String,
    enum: {
      values: ['text', 'number', 'select', 'textarea', 'boolean'],
      message: '{VALUE} is not a valid attribute type'
    },
    required: [true, 'Attribute type is required'],
  },
  
  // ✅ Options for 'select' type inputs
  options: {
    type: [String],
    default: [],
    validate: {
      validator: function(val) {
        // Only allow options if type is 'select'
        return this.type !== 'select' || (val && val.length > 0);
      },
      message: 'Select type attributes must have at least one option'
    }
  },
  
  // ✅ Whether field is required in product form
  required: {
    type: Boolean,
    default: false,
  },
  
  // ✅ Placeholder text for text/number inputs
  placeholder: {
    type: String,
    trim: true,
  },
  
  // ✅ Validation constraints for number inputs
  min: { type: Number },
  max: { type: Number },
  step: { 
    type: Number, 
    default: 1 
  },
  
  // ✅ Display order in form (lower = earlier)
  order: {
    type: Number,
    default: 0,
    index: true,
  },
  
  // ✅✅✅ NEW: Variant Control Fields (Flipkart-Style Dynamic Specs)
  
  // If true, this attribute differentiates product variants (shown as selector cards)
  // Example: Mobile → RAM, Storage | Dress → Size, Color | TV → Screen Size
  isVariantField: { 
    type: Boolean, 
    default: false,
    description: "If true, this field differentiates product variants (shown as selector)"
  },
  
  // If true, show this attribute in Product Highlights section (same for all variants)
  // Example: Mobile → Processor, Camera, Warranty | Dress → Material, Care Instructions
  displayInHighlights: { 
    type: Boolean, 
    default: true,
    description: "If true, show this field in Product Highlights section"
  },

  // ✅ NEW: Control if attribute appears in customer filter section
isFilterable: { 
  type: Boolean, 
  default: true,  // ✅ Default: show in filters
  index: true,
  description: "If true, show this attribute in customer-facing filter section"
},
  
  // Order in UI for variant/highlight sections (lower = displayed first)
  // Allows admin to control: RAM before Storage, or Processor before Camera
  sortOrder: { 
    type: Number, 
    default: 0,
    description: "Order in UI (lower = first)",
    index: true
  },
  
  // ✅ Soft delete support
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  
  // ✅ Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller', // or 'Admin' if you have admin users
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
  },
  
}, {
  timestamps: true, // Adds createdAt, updatedAt automatically
});

// ✅ Compound unique index: one attribute name per category
categoryAttributeSchema.index(
  { categoryId: 1, name: 1 }, 
  { unique: true, name: 'unique_category_attribute' }
);

// ✅ Index for admin panel queries (list attributes by category)
categoryAttributeSchema.index(
  { categoryId: 1, isActive: 1, order: 1 },
  { name: 'category_active_order' }
);

// ✅✅✅ NEW: Index for efficient variant/highlight queries
categoryAttributeSchema.index(
  { categoryId: 1, isVariantField: 1, sortOrder: 1, isActive: 1 },
  { name: 'category_variant_query' }
);

categoryAttributeSchema.index(
  { categoryId: 1, displayInHighlights: 1, sortOrder: 1, isActive: 1 },
  { name: 'category_highlight_query' }
);

categoryAttributeSchema.index(
  { categoryId: 1, isFilterable: 1, isActive: 1, sortOrder: 1 },
  { name: 'category_filterable_query' }
);

// ✅ Virtual: Get full category info (optional, for admin display)
categoryAttributeSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: 'categoryId',
  justOne: true,
});

// ✅ Pre-save middleware: ensure name is lowercase
categoryAttributeSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase().trim();
  }
  next();
});

// ✅ Instance method: Check if attribute is editable
categoryAttributeSchema.methods.isEditable = function() {
  return this.isActive && !this.__v; // Simple example
};

// ✅✅✅ NEW: Instance methods for variant/highlight logic
categoryAttributeSchema.methods.isVariantSelector = function() {
  return this.isActive && this.isVariantField;
};

categoryAttributeSchema.methods.shouldShowInHighlights = function() {
  return this.isActive && this.displayInHighlights && !this.isVariantField;
};

// ✅ Static method: Get all active attributes for a category
categoryAttributeSchema.statics.getActiveByCategoryId = function(categoryId) {
  return this.find({ 
    categoryId, 
    isActive: true 
  }).sort({ order: 1, name: 1 });
};

// ✅✅✅ NEW: Static methods for variant/highlight separation
categoryAttributeSchema.statics.getVariantAttributes = function(categoryId) {
  return this.find({ 
    categoryId, 
    isActive: true, 
    isVariantField: true 
  }).sort({ sortOrder: 1, name: 1 });
};

categoryAttributeSchema.statics.getHighlightAttributes = function(categoryId) {
  return this.find({ 
    categoryId, 
    isActive: true, 
    displayInHighlights: true, 
    isVariantField: false 
  }).sort({ sortOrder: 1, name: 1 });
};

// ✅✅✅ NEW: Get all attributes separated by type
categoryAttributeSchema.statics.getAttributesByType = async function(categoryId) {
  const [variantAttrs, highlightAttrs] = await Promise.all([
    this.getVariantAttributes(categoryId),
    this.getHighlightAttributes(categoryId)
  ]);
  
  return {
    variantAttributes: variantAttrs,
    highlightAttributes: highlightAttrs
  };
};

const CategoryAttribute = mongoose.model('CategoryAttribute', categoryAttributeSchema);

module.exports = CategoryAttribute;