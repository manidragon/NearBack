// D:\Mani\Code with Zosh\Backup\source code\backend\src\models\Product.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// ✅✅✅ NEW: Offer sub-schema for multi-seller support
const offerSchema = new Schema({
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  mrpPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sku: {
    type: String,
    trim: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now  // ✅ Track when offer was added
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// ✅✅✅ UPDATED: Variant schema - specs are shared, offers are seller-specific
const variantSchema = new mongoose.Schema({
  // ✅ Shared variant identifier (color + specs combo)
  color: {
    type: String,
    required: [true, 'Color is required'],
    trim: true,
    index: true
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  images: {
    type: [String],
    default: [],
    validate: [(val) => val.length > 0, 'At least one image is required per variant']
  },

  // ✅✅✅ NEW: Multiple sellers can offer this variant
  offers: [offerSchema],

  variantOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    default: null,
    index: true
  },

  // ✅ Variant-level metadata
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { _id: true });

// ✅ Main Product schema (Seller's Offer)
const productSchema = new mongoose.Schema({

  // ✅ Seller-specific fields (ALWAYS editable)
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },

  // ✅ Variants with multi-seller offers
  variants: [variantSchema],

  // ✅ Independent product fields (only editable if catalog is null)
  title: {
    type: String,
    required: function () { return !this.catalog; },
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: function () { return !this.catalog; },
    maxlength: 5000
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },

  highlights: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },

  // ✅ Aggregated fields for quick filtering (denormalized)
  availableColors: { type: [String], default: [], index: true },
  availableSpecs: { type: Map, of: [String], default: {} },

  // ✅ SEO & Display
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    sparse: true  // Allow nulls for catalog-linked products
  },

  // ✅ Aggregated pricing (for sorting/filtering) - calculated from offers
  minPrice: { type: Number, index: true },
  maxPrice: { type: Number, index: true },

  // ✅ Ratings & Reviews (aggregated from variants)
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },

  // ✅ Metadata
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false },

  // ✅✅✅ Denormalized fields for faster search (auto-synced)
  sellerBusinessName: { type: String, lowercase: true, index: true },
  categoryName: { type: String, lowercase: true, index: true },
  categorySlug: { type: String, lowercase: true, index: true }

}, {
  timestamps: true,
 toJSON: {
  virtuals: true,
  transform: function (doc, ret) {
    // ✅ Convert product-level highlights Map to plain object
    if (ret.highlights && ret.highlights instanceof Map) {
      ret.highlights = Object.fromEntries(ret.highlights);
    }
    
    // ✅ Convert availableSpecs Map to plain object
    if (ret.availableSpecs && ret.availableSpecs instanceof Map) {
      ret.availableSpecs = Object.fromEntries(ret.availableSpecs);
    }
    
    // ✅ Convert variant specifications Maps to plain objects
    if (ret.variants && Array.isArray(ret.variants)) {
      ret.variants = ret.variants.map(v => {
        if (v.specifications && v.specifications instanceof Map) {
          v.specifications = Object.fromEntries(v.specifications);
        }
        // ✅ Ensure variantOwner is string
        if (v.variantOwner && typeof v.variantOwner !== 'string') {
          v.variantOwner = v.variantOwner._id || v.variantOwner.$oid || String(v.variantOwner);
        }
        return v;
      });
    }
    
    // Remove seller field from response when it equals productOwner
    if (ret.seller && ret.productOwner && 
        ret.seller.toString() === ret.productOwner.toString()) {
      delete ret.seller;
    }
    // Remove catalog field from response when null
    if (ret.catalog === null || ret.catalog === undefined) {
      delete ret.catalog;
    }
    return ret;
  }
},

  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      // ✅✅✅ CRITICAL: Convert Map fields to plain objects
      if (ret.highlights && ret.highlights instanceof Map) {
        ret.highlights = Object.fromEntries(ret.highlights);
      }
      if (ret.availableSpecs && ret.availableSpecs instanceof Map) {
        ret.availableSpecs = Object.fromEntries(ret.availableSpecs);
      }

      if (ret.seller && ret.productOwner &&
        ret.seller.toString() === ret.productOwner.toString()) {
        delete ret.seller;
      }
      if (ret.catalog === null || ret.catalog === undefined) {
        delete ret.catalog;
      }
      return ret;
    }
  }
});

// ✅ Performance indexes
productSchema.index({ category: 1, 'variants.color': 1 });
productSchema.index({ 'variants.specifications.ram': 1 });
productSchema.index({ 'variants.specifications.storage': 1 });
productSchema.index({ seller: 1, isActive: 1 });
productSchema.index({ sellerBusinessName: 1, isActive: 1 });
productSchema.index({ categoryName: 1, isActive: 1 });
productSchema.index({ catalog: 1, isActive: 1 });

// ✅ Virtual: Get all active variants
productSchema.virtual('activeVariants').get(function () {
  return this.variants.filter(v => v.isActive);
});

// ✅ Virtual: Get unique colors from active variants
productSchema.virtual('uniqueColors').get(function () {
  return [...new Set(this.activeVariants.map(v => v.color))];
});

// ✅ Virtual: Get best price across all offers
productSchema.virtual('bestPrice').get(function () {
  const prices = this.activeVariants
    .flatMap(v => v.offers || [])
    .filter(o => o.isActive && o.sellingPrice > 0)
    .map(o => o.sellingPrice);
  return prices.length > 0 ? Math.min(...prices) : null;
});

// ✅ Virtual: Get total number of active offers
productSchema.virtual('totalOffers').get(function () {
  return this.activeVariants.reduce((count, v) =>
    count + (v.offers?.filter(o => o.isActive).length || 0), 0);
});

// ✅✅✅ ENHANCED: Pre-save hook with multi-seller support
productSchema.pre('save', async function (next) {
  try {
    // ✅ Auto-generate slug for independent products only
    if (!this.catalog && this.isModified('title') && !this.slug) {
      this.slug = this.title
        .toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Convert highlights plain object to Map for independent products
    if (!this.catalog && this.isModified('highlights')) {
      if (this.highlights && typeof this.highlights === 'object' && !(this.highlights instanceof Map)) {
        this.highlights = new Map(Object.entries(this.highlights));
      }
    }

    // ✅ Denormalize seller business name for faster search
    if (this.isModified('seller') && this.seller) {
      const Seller = mongoose.model('Seller');
      const seller = await Seller.findById(this.seller).select('businessDetails.businessName sellerName');
      if (seller) {
        this.sellerBusinessName = (seller.businessDetails?.businessName || seller.sellerName || '').toLowerCase();
      }
    }

    // ✅ Denormalize category name for faster search
    if (this.isModified('category') && this.category) {
      const Category = mongoose.model('Category');
      const cat = await Category.findById(this.category).select('name categoryId');
      if (cat) {
        this.categoryName = (cat.name || '').toLowerCase();
        this.categorySlug = cat.categoryId?.toLowerCase();
      }
    }

    // ✅ Auto-update aggregated fields when variants or offers change
    if (this.isModified('variants') || this.isNew) {
      const active = this.activeVariants;

      // Update available colors
      this.availableColors = [...new Set(active.map(v => v.color))];

      // Update available specs
      const specsMap = {};
      active.forEach(v => {
        Object.entries(v.specifications || {}).forEach(([key, value]) => {
          if (!specsMap[key]) specsMap[key] = new Set();
          specsMap[key].add(String(value));
        });
      });
      this.availableSpecs = new Map(
        Object.entries(specsMap).map(([k, v]) => [k, Array.from(v)])
      );

      // ✅ Update price range from ALL active offers
      const allPrices = active
        .flatMap(v => v.offers || [])
        .filter(o => o.isActive && o.sellingPrice > 0)
        .map(o => o.sellingPrice);

      if (allPrices.length > 0) {
        this.minPrice = Math.min(...allPrices);
        this.maxPrice = Math.max(...allPrices);
      } else {
        this.minPrice = null;
        this.maxPrice = null;
      }

      // ✅✅✅ NEW: Set variantOwner to seller with EARLIEST offer (by createdAt)
      active.forEach(variant => {
        if (variant.offers && variant.offers.length > 0) {
          // Sort offers by createdAt (ascending) - earliest first
          const sortedOffers = [...variant.offers].sort((a, b) => {
            const dateA = a.createdAt || (a._id?.getTimestamp ? a._id.getTimestamp() : new Date(0));
            const dateB = b.createdAt || (b._id?.getTimestamp ? b._id.getTimestamp() : new Date(0));
            return new Date(dateA) - new Date(dateB);
          });

          // Set variantOwner to first seller
          const firstOffer = sortedOffers[0];
          if (firstOffer?.seller && !variant.variantOwner) {
            variant.variantOwner = firstOffer.seller;
          }
        }
      });

      // ✅✅✅ NEW: Set productOwner to seller with EARLIEST offer across ALL variants
      if (!this.productOwner) {
        let earliestOffer = null;
        let earliestDate = new Date('9999-12-31');

        active.forEach(variant => {
          if (variant.offers && variant.offers.length > 0) {
            variant.offers.forEach(offer => {
              if (offer.isActive && offer.seller) {
                const offerDate = offer.createdAt || (offer._id?.getTimestamp ? offer._id.getTimestamp() : new Date(0));
                if (new Date(offerDate) < earliestDate) {
                  earliestDate = new Date(offerDate);
                  earliestOffer = offer;
                }
              }
            });
          }
        });

        if (earliestOffer?.seller) {
          this.productOwner = earliestOffer.seller;
          console.log('👑 [Product Owner] Set to:', {
            sellerId: earliestOffer.seller,
            offerDate: earliestDate,
            productId: this._id
          });
        }
      }
    }

    next();
  } catch (err) {
    console.error('❌ Product pre-save error:', err.message);
    next(err);
  }
});

// ✅ Instance method: Get variant by color + specs
productSchema.methods.getVariant = function (color, specs = {}) {
  return this.activeVariants.find(v => {
    if (v.color.toLowerCase() !== color.toLowerCase()) return false;
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

// ✅✅✅ NEW: Get best offer for a specific variant
productSchema.methods.getBestOffer = function (color, specs = {}) {
  const variant = this.getVariant(color, specs);
  if (!variant) return null;

  const activeOffers = variant.offers?.filter(o => o.isActive && o.sellingPrice > 0) || [];
  if (activeOffers.length === 0) return null;

  // Return offer with lowest price
  return activeOffers.reduce((best, current) =>
    current.sellingPrice < best.sellingPrice ? current : best
  );
};

// ✅✅✅ NEW: Get all offers for a specific variant (for product detail page)
productSchema.methods.getOffersForVariant = function (color, specs = {}) {
  const variant = this.getVariant(color, specs);
  if (!variant) return [];

  return variant.offers
    ?.filter(o => o.isActive && o.sellingPrice > 0)
    .map(offer => ({
      ...offer.toObject(),
      // Optionally populate seller details if needed
    })) || [];
};

// ✅✅✅ ENHANCED: searchWithVariants with multi-seller support
productSchema.statics.searchWithVariants = async function (filters) {
  const {
    search, category, colors, specs,
    minPrice, maxPrice, minDiscount,
    sortBy = 'newest', page = 0, limit = 20
  } = filters;

  const safeLimit = Math.min(parseInt(limit) || 20, 100);

  const aggregationPipeline = [];
  const searchConditions = [];

  // ✅ Build comprehensive search conditions
  if (search && search.trim()) {
    const searchTerm = search.trim();
    const regexPattern = new RegExp(
      searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );

    searchConditions.push(
      { title: { $regex: regexPattern } },
      { description: { $regex: regexPattern } },
      { slug: { $regex: regexPattern } },
      { sellerBusinessName: { $regex: regexPattern } },
      { categoryName: { $regex: regexPattern } },
      { categorySlug: { $regex: regexPattern } },
      { 'variants.color': { $regex: regexPattern } },
      { 'variants.specifications': { $regex: regexPattern } },
      { availableColors: { $regex: regexPattern } }
    );
  }

  // ✅ Base match: isActive + optional catalog/category filter
  const baseMatch = { isActive: true };

  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      baseMatch.category = new mongoose.Types.ObjectId(category);
    } else {
      try {
        const Category = mongoose.model('Category');
        const catDoc = await Category.findOne({ categoryId: category, level: 3 });
        if (catDoc) baseMatch.category = catDoc._id;
      } catch (err) {
        console.warn('⚠️ Category slug resolution failed:', err.message);
      }
    }
  }

  aggregationPipeline.push({ $match: baseMatch });

  // ✅ Apply search conditions with $or
  if (searchConditions.length > 0) {
    aggregationPipeline.push({ $match: { $or: searchConditions } });
  }

  // ✅ Price filters (based on best offer price)
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceMatch = {};
    if (minPrice !== undefined) priceMatch.$gte = minPrice;
    if (maxPrice !== undefined) priceMatch.$lte = maxPrice;
    aggregationPipeline.push({ $match: { minPrice: priceMatch } });
  }

  
  // ✅ Discount filter (based on offer mrpPrice vs sellingPrice)
if (filters.minDiscount !== undefined || filters.maxDiscount !== undefined) {
  const minD = filters.minDiscount ?? 0;
  const maxD = filters.maxDiscount ?? 100;

  aggregationPipeline.push({
    $addFields: {
      variants: {
        $map: {
          input: '$variants',
          as: 'v',
          in: {
            $mergeObjects: [
              '$$v',
              {
                offers: {
                  $filter: {
                    input: { $ifNull: ['$$v.offers', []] },
                    as: 'o',
                    cond: {
                      $and: [
                        '$$o.isActive',
                        { $gt: ['$$o.mrpPrice', 0] },
                        {
                          $gte: [
                            {
                              $multiply: [
                                {
                                  $divide: [
                                    { $subtract: ['$$o.mrpPrice', '$$o.sellingPrice'] },
                                    '$$o.mrpPrice'
                                  ]
                                },
                                100
                              ]
                            },
                            minD
                          ]
                        },
                        {
                          $lte: [
                            {
                              $multiply: [
                                {
                                  $divide: [
                                    { $subtract: ['$$o.mrpPrice', '$$o.sellingPrice'] },
                                    '$$o.mrpPrice'
                                  ]
                                },
                                100
                              ]
                            },
                            maxD
                          ]
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      }
    }
  });

  // ✅ Remove products where NO variant has qualifying offers after discount filter
  aggregationPipeline.push({
    $match: {
      'variants.offers.0': { $exists: true }
    }
  });
}
  

  // ✅ Variant color filter
  if (colors?.length > 0) {
    aggregationPipeline.push({
      $match: {
        'variants.color': { $in: colors.map(c => new RegExp(`^${c}$`, 'i')) },
        'variants.isActive': true
      }
    });
  }

  // ✅ Dynamic spec filters
 // ✅ FIXED: Dynamic spec filters (support BOTH highlights + specifications)
if (specs && typeof specs === 'object') {
  Object.entries(specs).forEach(([key, values]) => {
    if (Array.isArray(values) && values.length > 0) {

      const regexValues = values.map(
        v => new RegExp(`^${String(v).trim()}$`, 'i')
      );

      aggregationPipeline.push({
        $match: {
          $or: [
            { [`highlights.${key}`]: { $in: regexValues } },           // ✅ MAIN FIX
            { [`variants.specifications.${key}`]: { $in: regexValues } } // fallback
          ]
        }
      });

    }
  });
}

  // ✅ Filter to only include products with active variants AND active offers
  aggregationPipeline.push({
    $addFields: {
      activeVariants: {
        $filter: {
          input: '$variants',
          as: 'v',
          cond: {
            $and: [
              '$$v.isActive',
              { $gt: [{ $size: { $ifNull: ['$$v.offers', []] } }, 0] }
            ]
          }
        }
      }
    }
  });
  aggregationPipeline.push({
    $match: { activeVariants: { $ne: [], $exists: true } }
  });


  

  // ✅ Sort options - support sorting by best offer price
  const sortOptions = {
    'price_low': { minPrice: 1 },
    'price_high': { minPrice: -1 },
    'newest': { createdAt: -1 },
    'rating': { averageRating: -1, createdAt: -1 },
    'relevance': { createdAt: -1 }
  };
  const selectedSort = sortOptions[sortBy] || sortOptions.newest;
  aggregationPipeline.push({ $sort: selectedSort });

  // ✅ Pagination
  aggregationPipeline.push({ $skip: page * safeLimit }, { $limit: safeLimit });

  // ✅ Populate seller
  aggregationPipeline.push({
    $lookup: {
      from: 'sellers',
      localField: 'seller',
      foreignField: '_id',
      as: 'seller',
      pipeline: [{ $project: { sellerName: 1, businessDetails: 1, email: 1, mobile: 1 } }]
    }
  });
  aggregationPipeline.push({ $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } });

  // ✅ Populate category
  aggregationPipeline.push({
    $lookup: {
      from: 'categories',
      localField: 'category',
      foreignField: '_id',
      as: 'category',
      pipeline: [{ $project: { name: 1, categoryId: 1, level: 1, image: 1 } }]
    }
  });
  aggregationPipeline.push({ $unwind: { path: '$category', preserveNullAndEmptyArrays: true } });

  console.log('🔍 [MONGO] Search pipeline stages:', aggregationPipeline.length);
  const products = await this.aggregate(aggregationPipeline);
  console.log(`✅ [MONGO] Found ${products.length} products for search: "${search}"`);

  return products;
};

// ✅ Helper: Recalculate prices for catalog-linked products
async function updateCatalogPrices(productId) {
  try {
    const Product = mongoose.model('Product');

    const product = await Product.findById(productId);
    if (!product) return;

    let minPrice = Infinity;
    let maxPrice = 0;
    let hasActiveOffers = false;

    product.variants.forEach(variant => {
      if (variant.isActive && Array.isArray(variant.offers)) {
        variant.offers.forEach(offer => {
          if (offer.isActive !== false && offer.sellingPrice > 0) {
            hasActiveOffers = true;
            minPrice = Math.min(minPrice, offer.sellingPrice);
            maxPrice = Math.max(maxPrice, offer.sellingPrice);
          }
        });
      }
    });

    // ✅ Update the product with new price range
    await Product.findByIdAndUpdate(productId, {
      minPrice: hasActiveOffers ? (minPrice === Infinity ? 0 : minPrice) : 0,
      maxPrice: hasActiveOffers ? maxPrice : 0,
      updatedAt: new Date()
    });

    console.log(`✅ Updated product ${productId}: price range: ₹${minPrice}-₹${maxPrice}`);
  } catch (err) {
    console.error('❌ Failed to update catalog prices:', err.message);
  }
}

// ✅ Migration helper: Convert old single-seller variants to multi-seller offers
productSchema.statics.migrateToMultiSeller = async function () {
  try {
    const products = await this.find({
      'variants.0.mrpPrice': { $exists: true },  // Old structure
      'variants.0.offers': { $exists: false }     // No offers array yet
    });

    console.log(`🔄 Migrating ${products.length} products to multi-seller structure...`);

    for (const product of products) {
      const updatedVariants = product.variants.map(v => {
        // Convert old direct price fields to offers array
        const offer = {
          seller: product.seller,
          mrpPrice: v.mrpPrice,
          sellingPrice: v.sellingPrice,
          stock: v.stock,
          sku: v.sku,
          isActive: v.isActive !== false
        };

        // Return new variant structure
        return {
          color: v.color,
          specifications: v.specifications || {},
          images: v.images || [],
          offers: [offer],
          isActive: v.isActive !== false
        };
      });

      product.variants = updatedVariants;
      await product.save();
    }

    console.log(`✅ Migration complete: ${products.length} products updated`);
    return { success: true, migrated: products.length };
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  }
};

// ✅ Export model with helper functions attached
const Product = mongoose.model('Product', productSchema);
Product.updateCatalogPrices = updateCatalogPrices;

module.exports = Product;