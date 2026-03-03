// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\ProductService.js
const Product = require("../models/Product");
const Category = require("../models/Category");
const ProductError = require("../exceptions/ProductError");
const mongoose = require("mongoose"); // ✅ Required for ObjectId in updateProduct

class ProductService {

  // ✅ CREATE product with variants
  async createProduct(req, seller) {
    try {
      // Validate category is Level 3
      const category = await Category.findById(req.category);
      if (!category || category.level !== 3) {
        throw new ProductError("Valid Level 3 category is required");
      }

      // ✅ Process variants: ensure unique SKU, validate images
      const processedVariants = await Promise.all(
        req.variants.map(async (variant, index) => {
          // Auto-generate SKU if not provided
          if (!variant.sku) {
            const slug = req.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20);
            variant.sku = `${slug}-${variant.color.toLowerCase()}-${index + 1}`.substring(0, 100);
          }

          // Ensure images array is valid
          if (!variant.images || variant.images.length === 0) {
            throw new ProductError(`Variant ${index + 1}: At least one image required`);
          }

          return {
            ...variant,
            specifications: variant.specifications || {},
            isActive: variant.isActive !== false  // Default true
          };
        })
      );

      // Create product with embedded variants
      const product = new Product({
        title: req.title.trim(),
        description: req.description.trim(),
        category: category._id,
        seller: seller._id,
        variants: processedVariants,
        isActive: req.isActive !== false
        // ✅ Aggregated fields (colors, specs, prices) auto-calculated by pre-save hook
      });

      await product.save();

      // ✅ Populate and return with seller info
      return await Product.findById(product._id).populate('seller', 'sellerName businessDetails.businessName');

    } catch (error) {
      console.error("❌ Create product error:", error.message);
      if (error.name === 'MongoServerError' && error.code === 11000) {
        throw new ProductError("Duplicate SKU or product slug. Please use unique values.");
      }
      throw new ProductError(error.message || "Failed to create product");
    }
  }

  // ✅ UPDATE product (merge variants)
 async updateProduct(productId, updates, sellerId) {
  try {
    // ✅ First, verify product exists and belongs to seller
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      throw new ProductError("Product not found or access denied");
    }

    // ✅ Build update object for MongoDB $set operator (top-level fields)
    const topLevelUpdate = { $set: { updatedAt: new Date() } };
    
    // ✅ Update top-level fields if provided
    const topLevelFields = ['title', 'description', 'isActive', 'isFeatured'];
    topLevelFields.forEach(field => {
      if (updates[field] !== undefined && updates[field] !== null) {
        topLevelUpdate.$set[field] = updates[field];
      }
    });

    // ✅ Execute top-level fields update if there are changes
    if (Object.keys(topLevelUpdate.$set).length > 1) {
      await Product.updateOne(
        { _id: productId, seller: sellerId },
        topLevelUpdate,
        { runValidators: true }
      );
    }

    // ✅✅✅ Handle variant updates - Support updating, adding, AND deleting variants
    if (updates.variants && Array.isArray(updates.variants) && updates.variants.length > 0) {
      const existingVariants = new Map(
        product.variants.map(v => [String(v._id), v])
      );
      
      const variantsToUpdate = [];
      const variantsToAdd = [];
      const incomingVariantIds = new Set();  // ✅ Track IDs in incoming payload
      
      // ✅ Separate variants into "update existing" vs "add new"
      for (const updateVar of updates.variants) {
        // ✅ Check if this is an existing variant (has valid 24-char hex _id)
        const isValidExistingId = updateVar._id && 
                                  typeof updateVar._id === 'string' && 
                                  updateVar._id.length === 24 &&
                                  existingVariants.has(updateVar._id);
        
        if (isValidExistingId) {
          variantsToUpdate.push(updateVar);
          incomingVariantIds.add(updateVar._id);  // ✅ Track this ID
        } else {
          variantsToAdd.push(updateVar);
        }
      }
      
      // ✅✅✅ Process UPDATES to existing variants using arrayFilters
      for (const updateVar of variantsToUpdate) {
        const variantUpdate = { $set: {} };
        
        // Simple fields
        if (updateVar.color !== undefined) variantUpdate.$set[`variants.$[elem].color`] = updateVar.color;
        if (updateVar.mrpPrice !== undefined) variantUpdate.$set[`variants.$[elem].mrpPrice`] = updateVar.mrpPrice;
        if (updateVar.sellingPrice !== undefined) variantUpdate.$set[`variants.$[elem].sellingPrice`] = updateVar.sellingPrice;
        if (updateVar.stock !== undefined) variantUpdate.$set[`variants.$[elem].stock`] = updateVar.stock;
        if (updateVar.images !== undefined) variantUpdate.$set[`variants.$[elem].images`] = updateVar.images;
        if (updateVar.sku !== undefined) variantUpdate.$set[`variants.$[elem].sku`] = updateVar.sku;
        if (updateVar.isActive !== undefined) variantUpdate.$set[`variants.$[elem].isActive`] = updateVar.isActive;
        
        // ✅ Handle specifications as plain object (replace entire object)
        if (updateVar.specifications && typeof updateVar.specifications === 'object') {
          const specsObj = {};
          Object.entries(updateVar.specifications).forEach(([key, value]) => {
            specsObj[key] = String(value);
          });
          variantUpdate.$set[`variants.$[elem].specifications`] = specsObj;
        }
        
        if (Object.keys(variantUpdate.$set).length > 0) {
          await Product.updateOne(
            { 
              _id: productId, 
              seller: sellerId, 
              'variants._id': new mongoose.Types.ObjectId(updateVar._id) 
            },
            variantUpdate,
            { 
              arrayFilters: [{ 'elem._id': new mongoose.Types.ObjectId(updateVar._id) }],
              runValidators: true 
            }
          );
        }
      }
      
      // ✅✅✅ Process ADDITIONS of new variants using $push
      if (variantsToAdd.length > 0) {
        const newVariants = variantsToAdd.map(newVar => {
          const variantId = newVar._id || new mongoose.Types.ObjectId();
          return {
            _id: variantId,
            color: newVar.color || '',
            specifications: new Map(Object.entries(newVar.specifications || {}).map(([k, v]) => [k, String(v)])),
            mrpPrice: newVar.mrpPrice || 0,
            sellingPrice: newVar.sellingPrice || 0,
            stock: newVar.stock || 0,
            images: newVar.images || [],
            sku: newVar.sku || `${updates.title?.toLowerCase().slice(0,20) || 'product'}-${newVar.color || 'new'}-${Date.now()}`.substring(0, 100),
            isActive: newVar.isActive !== false,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });
        
        await Product.updateOne(
          { _id: productId, seller: sellerId },
          { $push: { variants: { $each: newVariants } } },
          { runValidators: true }
        );
      }
      
      // ✅✅✅ CRITICAL: Delete variants that are NOT in the incoming payload (full replacement approach)
      const variantsToDelete = Array.from(existingVariants.keys()).filter(id => !incomingVariantIds.has(id));
      
      if (variantsToDelete.length > 0) {
        await Product.updateOne(
          { _id: productId, seller: sellerId },
          { 
            $pull: { 
              variants: { 
                _id: { $in: variantsToDelete.map(id => new mongoose.Types.ObjectId(id)) } 
              } 
            } 
          },
          { runValidators: true }
        );
        console.log('🗑️ Deleted variants:', variantsToDelete);
      }
    }

    // ✅ Fetch and return the fully updated product
    const updatedProduct = await Product.findById(productId)
      .populate('seller', 'sellerName businessDetails.businessName');
    
    if (!updatedProduct) {
      throw new ProductError("Failed to fetch updated product");
    }
    
    return updatedProduct;
    
  } catch (error) {
    console.error("❌ Update product error:", error.message);
    if (error.name === 'MongoServerError' && error.code === 11000) {
      throw new ProductError("Duplicate SKU detected. Please use unique values.");
    }
    throw new ProductError(error.message || "Failed to update product");
  }
}

  // ✅ GET product with color/variant filtering
  async getProductById(productId, filters = {}) {
    try {
      const { color, specs } = filters;

      const product = await Product.findById(productId)
        .populate('seller', 'sellerName businessDetails.businessName')
        .populate('category', 'name categoryId level');

      if (!product || !product.isActive) {
        throw new ProductError("Product not found");
      }

      // ✅ Filter variants by color if requested
      let variants = product.activeVariants;
      if (color) {
        variants = variants.filter(v =>
          v.color.toLowerCase() === color.toLowerCase()
        );
      }

      // ✅ Filter by specifications if requested
      if (specs && typeof specs === 'object') {
        Object.entries(specs).forEach(([key, value]) => {
          variants = variants.filter(v =>
            v.specifications?.[key]?.toLowerCase() === String(value).toLowerCase()
          );
        });
      }

      // ✅ Return product with filtered variants
      return {
        ...product.toObject(),
        variants,  // Override with filtered list
        // Include helper data for frontend
        meta: {
          availableColors: product.uniqueColors,
          availableSpecs: Object.fromEntries(product.availableSpecs || {}),
          priceRange: {
            min: product.minPrice,
            max: product.maxPrice
          }
        }
      };

    } catch (error) {
      console.error("❌ Get product error:", error.message);
      throw new ProductError(error.message || "Failed to fetch product");
    }
  }

  // ✅ SEARCH products with variant filters
  async searchProducts(filters) {
    try {
      return await Product.searchWithVariants(filters);
    } catch (error) {
      console.error("❌ Search products error:", error.message);
      throw new ProductError(error.message || "Search failed");
    }
  }

  // ✅ GET seller's products - FIXED: Complete field projection for ProductTable
  async getSellerProducts(sellerId, page = 0, limit = 20) {
    try {
      // ✅ FIXED: Include ALL fields needed for ProductTable display
      const products = await Product.find({
        seller: sellerId,
        isActive: true
      })
      .populate('seller', 'sellerName businessDetails.businessName') 
        .select(`
        _id title  category description
        minPrice maxPrice isActive isFeatured createdAt updatedAt
        variants._id variants.color variants.mrpPrice variants.sellingPrice 
        variants.stock variants.images variants.sku variants.isActive variants.specifications
      `)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(page * limit);

      const total = await Product.countDocuments({
        seller: sellerId,
        isActive: true
      });

      // ✅ DEBUG LOGGING - Remove in production
      console.log('🔍 [DEBUG] getSellerProducts:', {
        sellerId,
        page,
        limit,
        foundCount: products.length,
        total,
        productIds: products.map(p => p._id),
        firstProduct: products[0] ? {
          _id: products[0]._id,
          title: products[0].title,
          variantCount: products[0].variants?.length,
          firstVariant: products[0].variants?.[0] ? {
            _id: products[0].variants[0]._id,
            color: products[0].variants[0].color,
            mrpPrice: products[0].variants[0].mrpPrice,
            sellingPrice: products[0].variants[0].sellingPrice,
            stock: products[0].variants[0].stock,
            images: products[0].variants[0].images?.length,
            sku: products[0].variants[0].sku,
            isActive: products[0].variants[0].isActive,
            specifications: products[0].variants[0].specifications
          } : null
        } : null
      });

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error("❌ Get seller products error:", error.message);
      throw new ProductError(error.message || "Failed to fetch products");
    }
  }

  // ✅ DELETE product (soft delete)
  async deleteProduct(productId, sellerId) {
    try {
      const product = await Product.findOne({ _id: productId, seller: sellerId });
      if (!product) {
        throw new ProductError("Product not found or access denied");
      }

      // Soft delete: set isActive = false
      product.isActive = false;
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(v => {
          if (v && typeof v === 'object') {
            v.isActive = false;
          }
        });
      }

      await product.save();
      return { message: "Product deactivated successfully" };

    } catch (error) {
      console.error("❌ Delete product error:", error.message);
      throw new ProductError(error.message || "Failed to delete product");
    }
  }
}

module.exports = new ProductService();