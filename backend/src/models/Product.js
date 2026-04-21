// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\Product.js
const mongoose = require('mongoose');
const Category = require('./Category');

// ✅ Variant sub-schema
const variantSchema = new mongoose.Schema({
  color: {
    type: String,
    required: [true, 'Color is required'],
    trim: true,
    index: true
  },

  specifications: {
    type: Object,
    default: {}
  },

  mrpPrice: {
    type: Number,
    required: [true, 'MRP Price is required'],
    min: 0
  },

  sellingPrice: {
    type: Number,
    required: [true, 'Selling Price is required'],
    min: 0 
  },

  stock: {
    type: Number,
    default: 0,
    min: 0
  },

  images: {
    type: [String],
    default: [],
    validate: [
      (val) => val.length > 0,
      'At least one image is required per variant'
    ]
  },

  sku: {
    type: String,
    trim: true,
    unique: true,  // Global SKU uniqueness
    sparse: true   // Allow nulls for auto-generation
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { _id: true });  // Each variant gets its own _id

// ✅ Main Product schema
const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  description: { 
    type: String,
    required: true,
    maxlength: 5000
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },

  // ✅ EMBEDDED VARIANTS
  variants: [variantSchema],

  // ✅ Aggregated fields for quick filtering (denormalized)
  availableColors: {
    type: [String],
    default: [],
    index: true
  },

  availableSpecs: {
    type: Map,
    of: [String],  // Array of possible values per spec
    default: {}
  },

  // ✅ SEO & Display
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  brand: {
    type: String,
    trim: true,
    index: true
  },

  // ✅ Aggregated pricing (for sorting/filtering)
  minPrice: { type: Number, index: true },
  maxPrice: { type: Number, index: true },

  // ✅ Ratings & Reviews (aggregated from variants)
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },

  // ✅ Metadata
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Indexes for performance
productSchema.index({ title: 'text', description: 'text' });  // Search
productSchema.index({ category: 1, 'variants.color': 1 });     // Filter by category + color
productSchema.index({ 'variants.specifications.ram': 1 });    // Filter by RAM
productSchema.index({ seller: 1, isActive: 1 });              // Seller's active products

// ✅ Virtual: Get all active variants
productSchema.virtual('activeVariants').get(function () {
  return this.variants.filter(v => v.isActive);
});

// ✅ Virtual: Get unique colors from active variants
productSchema.virtual('uniqueColors').get(function () {
  return [...new Set(this.activeVariants.map(v => v.color))];
});

// ✅ Pre-save: Auto-generate slug if not provided
productSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ✅ Auto-update aggregated fields
  if (this.isModified('variants')) {
    const active = this.activeVariants;

    // Update available colors
    this.availableColors = [...new Set(active.map(v => v.color))];

    // Update available specs (e.g., ram: ["4GB", "8GB"])
    const specsMap = {};
    active.forEach(v => {
      Object.entries(v.specifications || {}).forEach(([key, value]) => {
        if (!specsMap[key]) specsMap[key] = new Set();
        specsMap[key].add(value);
      });
    });
    this.availableSpecs = new Map(
      Object.entries(specsMap).map(([k, v]) => [k, Array.from(v)])
    );

    // Update price range
    const prices = active.map(v => v.sellingPrice).filter(p => p > 0);
    if (prices.length > 0) {
      this.minPrice = Math.min(...prices);
      this.maxPrice = Math.max(...prices);
    }
  }

  next();
});

// ✅ Instance method: Get variant by color + specs
productSchema.methods.getVariant = function (color, specs = {}) {
  return this.activeVariants.find(v => {
    if (v.color.toLowerCase() !== color.toLowerCase()) return false;

    // Match all provided specifications
    return Object.entries(specs).every(
      ([key, value]) => v.specifications?.[key]?.toLowerCase() === String(value).toLowerCase()
    );
  });
};

// ✅ Instance method: Get all variants for a specific color
productSchema.methods.getVariantsByColor = function (color) {
  return this.activeVariants.filter(
    v => v.color.toLowerCase() === color.toLowerCase()
  );
};

// ✅✅✅ FIXED: searchWithVariants - Handle empty sortBy and text search properly
productSchema.statics.searchWithVariants = async function (filters) {
  const {
    search,      // ✅ Added: text search query
    category,
    colors,
    specs,
    minPrice,
    maxPrice,
    sortBy = 'newest',  // ✅ Changed default from 'relevance' to 'newest'
    page = 0,
    limit = 20
  } = filters;

  const query = { isActive: true };

  // ✅ Add $text search ONLY if search query exists
  if (search && search.trim()) {
    query.$text = { $search: search };
  }

  if (category) {
  // ✅ Try to convert to ObjectId, but don't fail if it's not valid
  if (mongoose.Types.ObjectId.isValid(category)) {
    query.category = new mongoose.Types.ObjectId(category);
    console.log(`🔍 [MONGO] Filtering by category ObjectId: ${category}`);
  } else {
    // ✅ Fallback: try to find category by slug and use its _id
    console.warn(`⚠️ Category param not valid ObjectId, attempting slug lookup: ${category}`);
    try {
      const Category = mongoose.model('Category');
      const catDoc = await Category.findOne({ categoryId: category, level: 3 });
      if (catDoc) {
        query.category = catDoc._id;
        console.log(`✅ [MONGO] Resolved category slug to ObjectId: ${catDoc._id}`);
      } else {
        console.warn(`⚠️ Category not found by slug: ${category}, proceeding without category filter`);
        // Don't return empty - let other filters work
      }
    } catch (err) {
      console.error('❌ Category lookup error:', err.message);
      // Proceed without category filter rather than failing completely
    }
  }
}

  if (minPrice !== undefined) {
    query.minPrice = { $gte: minPrice };
  }
  if (maxPrice !== undefined) {
    query.maxPrice = { ...query.maxPrice, $lte: maxPrice };
  }

  // ✅ Filter by variants array (embedded)
  if (colors?.length > 0) {
    query['variants.color'] = { $in: colors.map(c => new RegExp(`^${c}$`, 'i')) };
    query['variants.isActive'] = true;
  }

  if (specs && typeof specs === 'object') {
  Object.entries(specs).forEach(([key, values]) => {
    if (Array.isArray(values) && values.length > 0) {
      // ✅ Ensure all values are strings for MongoDB match
      const stringValues = values.map(v => String(v).trim()).filter(Boolean);
      if (stringValues.length > 0) {
        query[`variants.specifications.${key}`] = { $in: stringValues };
        console.log(`🔍 [MONGO] Adding spec filter: ${key} IN [${stringValues.join(', ')}]`);
      }
    }
  });
}

  // ✅✅✅ FIXED: Sort options - only use textScore when $text query exists
  const hasTextSearch = search && search.trim();
  const sortOptions = {
    'price_low': { 'variants.sellingPrice': 1 },
    'price_high': { 'variants.sellingPrice': -1 },
    'newest': { createdAt: -1 },
    'rating': { averageRating: -1, createdAt: -1 },
    // ✅ Only use relevance sort if we have a text search
    'relevance': hasTextSearch
      ? { score: { $meta: 'textScore' }, createdAt: -1 }
      : { createdAt: -1 }  // Fallback to newest if no text search
  };

  // ✅ Safe sort selection with fallback
  const selectedSort = sortOptions[sortBy] || sortOptions.newest;

  console.log('🔍 searchWithVariants query:', {
    query,
    sort: selectedSort,
    page,
    limit
  });

  const products = await this.find(query)
    .populate('seller', 'sellerName businessDetails.businessName')
    .sort(selectedSort)
    .limit(limit)
    .skip(page * limit);

  return products;
};

const Product = mongoose.model('Product', productSchema);
module.exports = Product;