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

      // ✅✅✅ FIX 1: Get category attributes ONCE (outside loop)
      const CategoryAttribute = mongoose.model('CategoryAttribute');
      const categoryAttrs = await CategoryAttribute.find({
        categoryId: category.categoryId,
        isActive: true
      });

      const variantFieldNames = categoryAttrs
        .filter(attr => attr.isVariantField)
        .map(attr => attr.name.toLowerCase());

      const highlightFieldNames = categoryAttrs
        .filter(attr => attr.displayInHighlights && !attr.isVariantField)
        .map(attr => attr.name.toLowerCase());

      // ✅ Process variants: handle offers array + legacy compatibility
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

          // ✅✅✅ Handle offers array (multi-seller) OR legacy direct fields
          let finalOffers = variant.offers;

          // If no offers array, convert legacy direct fields to offers array
          if (!finalOffers || !Array.isArray(finalOffers) || finalOffers.length === 0) {
            if (variant.mrpPrice === undefined || variant.sellingPrice === undefined) {
              throw new ProductError(`Variant ${index + 1}: Either 'offers' array or 'mrpPrice/sellingPrice' fields are required`);
            }
            // Convert legacy format to offers array
            finalOffers = [{
              seller: seller._id,  // ✅ FIX: Use 'seller' (ObjectId) to match schema
              mrpPrice: Number(variant.mrpPrice),
              sellingPrice: Number(variant.sellingPrice),
              stock: Number(variant.stock) || 0,
              sku: variant.sku,
              isActive: variant.isActive !== false
            }];
          }

          // ✅ Validate each offer in the array
          for (const [offerIdx, offer] of finalOffers.entries()) {
            // ✅ FIX: Check 'seller' field (not sellerId)
            if (!offer.seller) {
              throw new ProductError(`Variant ${index + 1}, Offer ${offerIdx + 1}: seller is required`);
            }

            // Validate and convert prices to numbers
            const mrpPrice = Number(offer.mrpPrice);
            const sellingPrice = Number(offer.sellingPrice);
            const stock = Number(offer.stock) || 0;

            if (!offer.mrpPrice || isNaN(mrpPrice) || mrpPrice <= 0) {
              throw new ProductError(`Variant ${index + 1}, Offer ${offerIdx + 1}: Valid MRP Price (>0) is required`);
            }
            if (!offer.sellingPrice || isNaN(sellingPrice) || sellingPrice <= 0) {
              throw new ProductError(`Variant ${index + 1}, Offer ${offerIdx + 1}: Valid Selling Price (>0) is required`);
            }
            if (sellingPrice > mrpPrice) {
              throw new ProductError(`Variant ${index + 1}, Offer ${offerIdx + 1}: Selling price cannot exceed MRP`);
            }
            if (stock < 0) {
              throw new ProductError(`Variant ${index + 1}, Offer ${offerIdx + 1}: Stock cannot be negative`);
            }

            // Update offer with validated/converted values
            finalOffers[offerIdx] = {
              ...offer,
              seller: offer.seller,  // ✅ Ensure seller is ObjectId
              mrpPrice,
              sellingPrice,
              stock,
              isActive: offer.isActive !== false
            };
          }

          let variantSpecs = {};
          if (variant.specifications && typeof variant.specifications === 'object') {
            // ✅ Save all specs as strings (Mongoose Map requirement)
            Object.entries(variant.specifications).forEach(([key, value]) => {
              variantSpecs[key] = String(value);
            });
          }

          // ✅ Log for debugging (remove after testing)
          console.log('🔍 [Service] Saving variant specs:', {
            originalCount: Object.keys(variant.specifications || {}).length,
            savedCount: Object.keys(variantSpecs).length,
            savedKeys: Object.keys(variantSpecs)
          });

          // ✅ Extract highlights for product-level storage
          const variantHighlights = {};
          if (req.highlights && typeof req.highlights === 'object') {
            Object.entries(req.highlights).forEach(([key, value]) => {
              const keyLower = key.toLowerCase();
              // Only include if it's a valid highlight field
              if (highlightFieldNames.includes(keyLower)) {
                variantHighlights[key] = value;
              }
            });
          }


          // ✅ Return processed variant with filtered specs
          return {
            ...variant,
            specifications: variantSpecs,  // ✅ ONLY variant-specific fields
            highlights: Object.keys(variantHighlights).length > 0 ? variantHighlights : undefined,
            isActive: variant.isActive !== false,
            offers: finalOffers,
            variantOwner: seller._id,  // ✅ Set variantOwner BEFORE save
            // Remove legacy direct fields
            mrpPrice: undefined,
            sellingPrice: undefined,
            stock: undefined
          };
        })
      );

      // ✅✅✅ FIX 3: Collect highlights from ALL variants (or just first one)
      const productHighlights = {};
      for (const variant of processedVariants) {
        if (variant.highlights) {
          Object.assign(productHighlights, variant.highlights);
        }
      }

      // ✅ Create product with embedded variants (now with offers array)
      const product = new Product({
        title: req.title.trim(),
        description: req.description.trim(),
        category: category._id,
        seller: seller._id,
        productOwner: seller._id,
        highlights: req.highlights && Object.keys(req.highlights).length > 0
          ? new Map(Object.entries(req.highlights))
          : new Map(),
        variants: processedVariants,
        isActive: req.isActive !== false
      });

      // ✅✅✅ FIX 4: Save ONCE (pre-save hook will handle aggregated fields + ownership)
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

  async getProductsByQuery(query, page = 0, limit = 20) {
    try {
      const Product = require('../models/Product');

      const products = await Product.find(query)
        .populate('category', 'name categoryId level')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(page * limit);

      return products;
    } catch (error) {
      console.error('❌ Get products by query error:', error.message);
      throw new ProductError(error.message || 'Failed to fetch products');
    }
  }

  async updateProduct(productId, updates, sellerId) {
    console.log('🔍 [DEBUG] updateProduct called:', {
      productId,
      sellerId,
      updatesReceived: {
        variantsCount: updates.variants?.length,
        firstVariant: updates.variants?.[0] ? {
          color: updates.variants[0].color,
          offersCount: updates.variants[0].offers?.length,
          firstOffer: updates.variants[0].offers?.[0] ? {
            _id: updates.variants[0].offers[0]._id,
            seller: updates.variants[0].offers[0].seller,
            stock: updates.variants[0].offers[0].stock
          } : null
        } : null
      }
    });

    try {
      // ✅ 1. Fetch product with full details
      const product = await Product.findById(productId)
        .populate('variants.offers.seller', 'sellerName businessDetails.businessName');

      console.log('🔍 [DEBUG] Product fetched:', {
        found: !!product,
        variantsCount: product?.variants?.length,
        firstVariantOffers: product?.variants?.[0]?.offers?.length
      });

      if (!product) {
        console.error('❌ [DEBUG] Product not found');
        throw new ProductError("Product not found");
      }

      // ✅ 2. Authorization check
      const sellerHasOffer = product.variants.some(v =>
        v.offers?.some(o => {
          // ✅ Handle both populated seller object AND string/ObjectId seller
          const offerSellerId = typeof o.seller === 'string'
            ? o.seller
            : o.seller?._id?.toString() || o.seller?.toString();

          return offerSellerId === sellerId.toString() && o.isActive !== false;
        })
      );

      const isProductOwner = typeof product.seller === 'string'
        ? product.seller === sellerId.toString()
        : product.seller?._id?.toString() === sellerId.toString();

      console.log('🔍 [DEBUG] Authorization:', {
        sellerHasOffer,
        isProductOwner,
        productSeller: product.seller?.toString(),
        requestSeller: sellerId
      });

      if (!sellerHasOffer && !isProductOwner) {
        console.error('❌ [DEBUG] Access denied');
        throw new ProductError("Access denied: You don't have offers in this product");
      }

      // ✅ 3. Build update operations
      const updateOps = [];

      // ✅ 4. Handle variant updates
      if (updates.variants && Array.isArray(updates.variants)) {
        for (const updateVar of updates.variants) {
          console.log('🔍 [DEBUG] Processing variant update:', {
            updateVarId: updateVar._id,
            updateVarColor: updateVar.color
          });

          // Find existing variant
          const existingVariant = product.variants.find(v => v._id.toString() === updateVar._id);
          console.log('🔍 [DEBUG] Found existing variant:', {
            found: !!existingVariant,
            variantId: existingVariant?._id?.toString(),
            offersCount: existingVariant?.offers?.length
          });

          if (!existingVariant) {
            console.warn('⚠️ [DEBUG] Variant not found in product, skipping');
            continue;
          }

          // ✅ Process offers
          if (updateVar.offers && Array.isArray(updateVar.offers)) {
            for (const offerUpdate of updateVar.offers) {
              console.log('🔍 [DEBUG] Processing offer update:', {
                offerUpdateId: offerUpdate._id,
                offerUpdateSeller: offerUpdate.seller,
                offerUpdateStock: offerUpdate.stock
              });

              // Find existing offer by _id
              let existingOffer = existingVariant.offers?.find(
                o => o._id?.toString() === offerUpdate._id?.toString()
              );

              // Fallback: find by seller if _id missing
              if (!existingOffer && !offerUpdate._id) {
                existingOffer = existingVariant.offers?.find(
                  o => o.seller?.toString() === sellerId.toString()
                );
                console.log('⚠️ [DEBUG] Fallback match by seller ID');
              }

              console.log('🔍 [DEBUG] Found existing offer:', {
                found: !!existingOffer,
                offerId: existingOffer?._id?.toString(),
                offerSeller: existingOffer?.seller?.toString(),
                currentStock: existingOffer?.stock
              });

              if (!existingOffer) {
                console.warn('⚠️ [DEBUG] No matching offer found, skipping');
                continue;
              }

              const offerSellerId = typeof existingOffer.seller === 'string'
                ? existingOffer.seller
                : existingOffer.seller?._id?.toString() || existingOffer.seller?.toString();

              if (offerSellerId !== sellerId.toString()) {
                console.log('🚫 [DEBUG] Skipping offer: not owned by current seller', {
                  offerSellerId,
                  currentSeller: sellerId.toString()
                });
                continue;
              }

              // ✅ Build update
              const offerUpdates = {};
              if (offerUpdate.mrpPrice !== undefined) offerUpdates['variants.$[v].offers.$[o].mrpPrice'] = offerUpdate.mrpPrice;
              if (offerUpdate.sellingPrice !== undefined) offerUpdates['variants.$[v].offers.$[o].sellingPrice'] = offerUpdate.sellingPrice;
              if (offerUpdate.stock !== undefined) offerUpdates['variants.$[v].offers.$[o].stock'] = offerUpdate.stock;
              if (offerUpdate.sku !== undefined) offerUpdates['variants.$[v].offers.$[o].sku'] = offerUpdate.sku;
              if (offerUpdate.isActive !== undefined) offerUpdates['variants.$[v].offers.$[o].isActive'] = offerUpdate.isActive;
              offerUpdates['variants.$[v].offers.$[o].updatedAt'] = new Date();

              console.log('🔍 [DEBUG] Offer updates to apply:', offerUpdates);

              if (Object.keys(offerUpdates).length > 0) {
                // ✅ Execute update
                const result = await Product.updateOne(
                  {
                    _id: productId,
                    'variants._id': new mongoose.Types.ObjectId(updateVar._id),
                    'variants.offers._id': new mongoose.Types.ObjectId(existingOffer._id)
                  },
                  { $set: offerUpdates },
                  {
                    arrayFilters: [
                      { 'v._id': new mongoose.Types.ObjectId(updateVar._id) },
                      { 'o._id': new mongoose.Types.ObjectId(existingOffer._id) }
                    ],
                    runValidators: true
                  }
                );

                console.log('✅ [DEBUG] MongoDB update result:', {
                  matchedCount: result.matchedCount,
                  modifiedCount: result.modifiedCount,
                  acknowledged: result.acknowledged
                });

                if (result.modifiedCount === 0) {
                  console.error('❌ [DEBUG] Update matched but modified 0 documents!');
                  console.error('🔍 [DEBUG] Query filters:', {
                    productId,
                    variantId: updateVar._id,
                    offerId: existingOffer._id
                  });
                }
              }
            }
          }

          const variantLevelUpdates = {};

          // ✅ Update images if provided
          if (updateVar.images && Array.isArray(updateVar.images)) {
            variantLevelUpdates['variants.$[v].images'] = updateVar.images;
          }

          // ✅ Update color if provided (optional)
          if (updateVar.color !== undefined) {
            variantLevelUpdates['variants.$[v].color'] = updateVar.color;
          }

          // ✅ Update isActive if provided (optional)
          if (updateVar.isActive !== undefined) {
            variantLevelUpdates['variants.$[v].isActive'] = updateVar.isActive;
          }

          // ✅ Execute variant-level updates if any
          if (Object.keys(variantLevelUpdates).length > 0) {
            await Product.updateOne(
              {
                _id: productId,
                'variants._id': new mongoose.Types.ObjectId(updateVar._id)
              },
              { $set: variantLevelUpdates },
              {
                arrayFilters: [{ 'v._id': new mongoose.Types.ObjectId(updateVar._id) }],
                runValidators: true
              }
            );

            console.log('✅ [DEBUG] Variant-level updates applied:', variantLevelUpdates);
          }
        }
      }

     // ✅ CORRECT: Use for...of loop for async operations
const topLevelFields = ['title', 'description', 'isActive', 'isFeatured'];
const topLevelUpdates = {};

for (const field of topLevelFields) {
  if (updates[field] !== undefined && updates[field] !== null) {
    // ✅ If catalog product, only allow catalog owner to update these fields
    if (product.catalog) {
      const catalogProduct = await Product.findById(product.catalog).select('seller');
      const isCatalogOwner = catalogProduct?.seller?.toString() === sellerId.toString();
      
      if (!isCatalogOwner) {
        console.log(`🚫 [DEBUG] Skipping ${field} update: not catalog owner`);
        continue;  // ✅ Use continue instead of return
      }
    }
    topLevelUpdates[field] = updates[field];
  }
}

// ✅ Execute top-level fields update if there are changes
if (Object.keys(topLevelUpdates).length > 0) {
  await Product.updateOne(
    { _id: productId },
    { $set: { ...topLevelUpdates, updatedAt: new Date() } },
    { runValidators: true }
  );
  console.log('✅ [DEBUG] Top-level updates applied:', topLevelUpdates);
}

      // ✅ 5. Recalculate aggregated fields
      await Product.updateCatalogPrices(productId);
      console.log('✅ [DEBUG] Recalculated catalog prices');

      // ✅ 6. Fetch and return updated product
      const updatedProduct = await Product.findById(productId)
        .populate('seller', 'sellerName businessDetails.businessName')
        .populate('variants.offers.seller', 'sellerName businessDetails.businessName');

      console.log('✅ [DEBUG] Returning updated product:', {
        variantsCount: updatedProduct?.variants?.length,
        blackVariant6GB: updatedProduct?.variants?.find(v => v.color === 'Black' && v.specifications?.storage === '256 GB')?.offers?.[0]?.stock
      });

      return updatedProduct;

    } catch (error) {
      console.error('❌ [DEBUG] Update product error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw new ProductError(error.message || "Failed to update product");
    }
  }
  // ✅ GET product with color/variant filtering
  async getProductById(productId, filters = {}) {
    try {
      const { color, specs } = filters;

      const product = await Product.findById(productId)
        .populate('seller', 'sellerName businessDetails.businessName')
        .populate('category', 'name categoryId level')
         .populate('variants.offers.seller', 'sellerName businessDetails.businessName'); 

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
      // ✅ Query for products
      const products = await Product.find({ seller: sellerId, isActive: true })
        .populate('seller', 'sellerName businessDetails.businessName')
        .populate('variants.offers.seller', 'sellerName businessDetails.businessName')
        .populate('category', 'name categoryId level')
        .lean();

      // ✅ Transform to ensure specifications are plain objects
      const transformedProducts = products.map(product => {
        if (product.variants && Array.isArray(product.variants)) {
          product.variants = product.variants.map(variant => {
            if (variant.specifications instanceof Map) {
              variant.specifications = Object.fromEntries(variant.specifications);
            }
            if (variant.variantOwner && typeof variant.variantOwner !== 'string') {
              variant.variantOwner = variant.variantOwner._id || variant.variantOwner.$oid || String(variant.variantOwner);
            }
            return variant;
          });
        }
        if (product.highlights instanceof Map) {
          product.highlights = Object.fromEntries(product.highlights);
        }
        return product;
      });

      // ✅✅✅ ADD THIS: Get total count for pagination
      const total = await Product.countDocuments({ seller: sellerId, isActive: true });

      return {
        products: transformedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,  // ✅ Now defined!
          totalPages: Math.ceil(total / parseInt(limit))
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