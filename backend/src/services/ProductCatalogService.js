// ✅ backend/src/services/ProductCatalogService.js
const Product = require('../models/Product');
const CatalogError = require('../exceptions/CatalogError');
const mongoose = require('mongoose');  // ✅ ADD: Require mongoose at top

class ProductCatalogService {

  // ✅ Search catalog products (stored in Product model with catalog field)
  async searchCatalog(searchQuery, filters = {}) {
    try {
      const { page = 0, limit = 20, brand, category } = filters;

      const query = {
        isActive: true
      };

      if (brand) {
        query.brand = brand;
      }

      if (category) {
        if (mongoose.Types.ObjectId.isValid(category)) {
          query.category = new mongoose.Types.ObjectId(category);
        } else {
          // Try to find category by slug
          const Category = mongoose.model('Category');
          const catDoc = await Category.findOne({ categoryId: category, level: 3 });
          if (catDoc) {
            query.category = catDoc._id;
          }
        }
      }

      // ✅ Search with $text index on Product model
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = searchQuery.trim();
        query.$text = { $search: searchTerm };
      }

      const catalogs = await Product.find(query)
        .populate('category', 'name categoryId')
        .populate('seller', 'sellerName businessDetails.businessName')
        .sort({ totalOffers: -1, minPrice: 1 })
        .limit(limit)
        .skip(page * limit);

      const total = await Product.countDocuments(query);

      // ✅ Transform Product docs to catalog-like format for frontend
      const transformedCatalogs = catalogs.map(p => {
        const productObj = p.toObject?.() || p;

        // ✅✅✅ Safely convert Map fields to plain objects
        let specifications = {};
        if (productObj.availableSpecs) {
          if (productObj.availableSpecs instanceof Map) {
            specifications = Object.fromEntries(productObj.availableSpecs);
          } else if (typeof productObj.availableSpecs === 'object') {
            specifications = productObj.availableSpecs;
          }
        }

        let highlights = {};
        if (productObj.highlights) {
          if (productObj.highlights instanceof Map) {
            highlights = Object.fromEntries(productObj.highlights);
          } else if (typeof productObj.highlights === 'object') {
            highlights = productObj.highlights;
          }
        }

        return {
          _id: productObj._id?.toString?.(),
          title: productObj.title,
          description: productObj.description,
          brand: productObj.brand,
          images: productObj.images,
          category: productObj.category,
          specifications: specifications,  // ✅ Safe conversion
          highlights: highlights,  // ✅ Safe conversion
          variantTemplate: productObj.variants?.map(v => {
            const variantObj = v.toObject?.() || v;

            // ✅✅✅ Convert variant.specifications Map to plain object
            let variantSpecs = {};
            if (variantObj.specifications) {
              if (variantObj.specifications instanceof Map) {
                variantSpecs = Object.fromEntries(variantObj.specifications);
              } else if (typeof variantObj.specifications === 'object') {
                variantSpecs = variantObj.specifications;
              }
            }

            return {
              _id: variantObj._id?.toString?.(),
              color: variantObj.color,
              specifications: variantSpecs,  // ✅ Now properly converted!
              images: variantObj.images,
              variantOwner: variantObj.variantOwner?.toString?.()
            };
          }) || [],
          createdBy: productObj.seller,
          status: 'approved',
          totalOffers: productObj.variants?.reduce((sum, v) => sum + (v.offers?.length || 0), 0) || 0,
          lowestPrice: productObj.minPrice,
          highestPrice: productObj.maxPrice,
          isIndependent: true  // ✅ All products are now independent in your architecture
        };
      });

      return {
        catalogs: transformedCatalogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Search catalog error:', error.message);
      throw new CatalogError(error.message || 'Search failed');
    }
  }

  // ✅ Get catalog product by ID (from Product model)
  async getCatalogById(catalogId) {
    try {
      console.log('🔍 [Service] getCatalogById called:', {
        catalogId,
        catalogIdType: typeof catalogId,
        isValidObjectId: mongoose.Types.ObjectId.isValid(catalogId)
      });

      const catalogObjectId = mongoose.Types.ObjectId.isValid(catalogId)
        ? new mongoose.Types.ObjectId(catalogId)
        : catalogId;

      // ✅ Fetch from Product model where _id matches and catalog is not null (catalog-linked)
      const catalog = await Product.findOne({
        _id: catalogObjectId,
        isActive: true
      })
        .populate('category', 'name categoryId level')
        .populate('seller', 'sellerName businessDetails.businessName email mobile');

      console.log('🔍 [Service] Catalog fetch result:', {
        found: !!catalog,
        _id: catalog?._id?.toString(),
        isActive: catalog?.isActive,
        title: catalog?.title
      });

      if (!catalog) {
        throw new CatalogError(`Catalog product with ID ${catalogId} does not exist or is not a catalog-linked product`);
      }

      // ✅ Transform to catalog-like response with properly stringified variantOwner
      const catalogObj = catalog.toObject?.() || catalog;

      return {
        ...catalogObj,
        _id: catalogObj._id?.toString?.(),
        status: 'approved',
        // ✅ Map variants to include stringified variantOwner
        variants: catalogObj.variants?.map(variant => {
          const variantObj = variant.toObject?.() || variant;
          return {
            _id: variantObj._id?.toString?.(),
            color: variantObj.color,
            specifications: variantObj.specifications,
            images: variantObj.images,
            offers: variantObj.offers?.map(o => {
              const offerObj = o.toObject?.() || o;
              return {
                ...offerObj,
                _id: offerObj._id?.toString?.(),
                seller: offerObj.seller?.toString?.() || offerObj.seller
              };
            }),
            // ✅✅✅ CRITICAL: Stringify variantOwner for frontend
            variantOwner: variantObj.variantOwner?.toString?.(),
            isActive: variantObj.isActive
          };
        }) || [],
        highlights: catalogObj.highlights ? Object.fromEntries(catalogObj.highlights) : {},
        createdBy: catalogObj.seller,
        totalOffers: catalogObj.variants?.reduce((sum, v) => sum + (v.offers?.length || 0), 0) || 0,
        lowestPrice: catalogObj.minPrice,
        highestPrice: catalogObj.maxPrice
      };
    } catch (error) {
      console.error('❌ Get catalog error:', {
        message: error.message,
        name: error.name,
        catalogId
      });
      throw new CatalogError(error.message || 'Failed to fetch catalog');
    }
  }


  async listOfferOnCatalog(productId, offerData, sellerId) {
    try {
      console.log('🔍 [Service] listOfferOnCatalog called:', {
        productId,
        sellerId,
        sellerIdType: typeof sellerId,
        variantsCount: offerData?.variants?.length
      });

      const mongoose = require('mongoose');
      const Product = require('../models/Product');

      const productObjectId = mongoose.Types.ObjectId.isValid(productId)
        ? new mongoose.Types.ObjectId(productId)
        : productId;

      // ✅ Find the EXISTING Product document
      const existingProduct = await Product.findOne({
        _id: productObjectId,
        isActive: true
      });

      console.log('🔍 [Service] Product lookup:', {
        found: !!existingProduct,
        _id: existingProduct?._id?.toString(),
        title: existingProduct?.title,
        totalVariants: existingProduct?.variants?.length
      });

      if (!existingProduct) {
        throw new CatalogError(`Product with ID ${productId} does not exist or is inactive`);
      }

      // ✅✅✅ HELPER: Extract seller ID from various formats (NON-RECURSIVE)
      const extractSellerId = (sellerField) => {
        if (!sellerField) return null;
        if (sellerField._bsontype === 'ObjectID' || sellerField._bsontype === 'ObjectId') {
          return sellerField.toString();
        }
        if (sellerField.$oid && typeof sellerField.$oid === 'string') {
          return sellerField.$oid;
        }
        if (typeof sellerField === 'string') {
          return sellerField;
        }
        if (sellerField._id) {
          if (sellerField._id._bsontype === 'ObjectID' || sellerField._id._bsontype === 'ObjectId') {
            return sellerField._id.toString();
          }
          if (sellerField._id.$oid) return sellerField._id.$oid;
          if (typeof sellerField._id === 'string') return sellerField._id;
        }
        return null;
      };

      // ✅ Convert incoming sellerId to string
      const incomingSellerId = mongoose.Types.ObjectId.isValid(sellerId)
        ? new mongoose.Types.ObjectId(sellerId).toString()
        : String(sellerId);

      // ✅✅✅ FIXED: Process each input variant correctly
      const updateOperations = [];
      const newVariantsToPush = [];  // Track new variants separately

      for (const inputVariant of offerData.variants) {
        // ✅ Build NEW offer objects FIRST (before any conditional logic)
        const newOffers = inputVariant.offers.map(offer => ({
          _id: new mongoose.Types.ObjectId(),
          seller: incomingSellerId,
          mrpPrice: offer.mrpPrice,
          sellingPrice: offer.sellingPrice,
          stock: offer.stock,
          sku: offer.sku,
          isActive: offer.isActive !== false,
          createdAt: new Date()  // ✅ Track when offer was added
        }));

        // ✅ Find matching variant by color + specifications
        const matchingVariant = existingProduct.variants.find(v =>
          v.color === inputVariant.color &&
          JSON.stringify(v.specifications) === JSON.stringify(inputVariant.specifications)
        );

        let targetVariantId;
        let isNewVariant = false;
        let variantHadOffersBefore = false;

        if (!matchingVariant) {
          // ✅ Get category attributes to separate variant vs highlight fields
          const CategoryAttribute = mongoose.model('CategoryAttribute');
          const categoryAttrs = await CategoryAttribute.find({
            categoryId: existingProduct.category?.categoryId || existingProduct.category,
            isActive: true
          });

          const variantFieldNames = categoryAttrs
            .filter(attr => attr.isVariantField)
            .map(attr => attr.name.toLowerCase());

          console.log('🔍 [Backend] Variant field filtering:', {
            categoryId: existingProduct.category?.categoryId || existingProduct.category,
            totalAttributes: categoryAttrs.length,
            variantFieldNames,
            inputSpecs: inputVariant.specifications,
            inputSpecsKeys: Object.keys(inputVariant.specifications || {})
          });

          // ✅ Filter input specifications to ONLY variant fields
          let variantSpecs = inputVariant.specifications || {};
          if (typeof variantSpecs === 'object' && !(variantSpecs instanceof Map)) {
            const filteredEntries = Object.entries(variantSpecs).filter(([key, value]) => {
              const keyLower = key.toLowerCase();
              const matches = variantFieldNames.includes(keyLower);

              console.log(`  🔍 Spec "${key}":`, {
                isVariantField: matches,
                variantFieldNames,
                value
              });

              // ✅ If no variant fields found, KEEP all specs as fallback
              if (variantFieldNames.length === 0) {
                console.log(`  ⚠️ No variant fields configured - keeping spec "${key}"`);
                return true;
              }

              return matches;
            });

            variantSpecs = Object.fromEntries(filteredEntries);
          }

          console.log('✅ [Backend] Final filtered specs:', {
            originalKeys: Object.keys(inputVariant.specifications || {}),
            filteredKeys: Object.keys(variantSpecs),
            variantSpecs
          });

          const newVariant = {
            _id: new mongoose.Types.ObjectId(),
            color: inputVariant.color,
            specifications: variantSpecs,  // ✅ ONLY variant-specific fields
            images: inputVariant.images || existingProduct.images || [],
            offers: newOffers,  // ✅✅✅ INCLUDE offers directly in new variant!
            variantOwner: incomingSellerId,
            isActive: inputVariant.isActive !== false,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Track new variant for separate $push operation
          newVariantsToPush.push(newVariant);
          targetVariantId = newVariant._id;
          isNewVariant = true;
          variantHadOffersBefore = false;  // New variant has no offers yet (but we're adding them now)

          // ✅ Skip the separate offer push operation for new variants (offers already included)
          continue;  // ✅ Skip to next input variant
        } else {
          targetVariantId = matchingVariant._id;
          variantHadOffersBefore = matchingVariant.offers?.length > 0;

          // ✅✅✅ CHECK: Does THIS seller already have an offer in THIS SPECIFIC variant?
          const sellerHasOfferInThisVariant = matchingVariant.offers?.some(offer => {
            const offerSellerId = extractSellerId(offer.seller);
            const isActive = offer.isActive !== false;
            return offerSellerId === incomingSellerId && isActive;
          });

          if (sellerHasOfferInThisVariant) {
            throw new CatalogError(`You already have an active offer for the "${matchingVariant.color}" variant with these specifications. Please update your existing offer instead.`);
          }
        }

        // ✅✅✅ Only push offers separately for EXISTING variants
        // For NEW variants, offers are already included in the variant object above
        if (!isNewVariant) {
          // ✅ Prepare offer update operation for existing variant
          const offerUpdate = {
            $push: {
              'variants.$[variant].offers': { $each: newOffers }
            },
            $set: { updatedAt: new Date() }
          };

          // ✅✅✅ NEW: Set variantOwner if this is the FIRST offer for this variant
          if (!variantHadOffersBefore && newOffers.length > 0) {
            offerUpdate.$set['variants.$[variant].variantOwner'] = incomingSellerId;
            console.log('👑 [Service] Set variantOwner:', {
              variantId: targetVariantId,
              owner: incomingSellerId,
              reason: 'First offer added to existing variant'
            });
          }

          // Add offer update operation
          updateOperations.push({
            updateOne: {
              filter: { _id: existingProduct._id },
              update: offerUpdate,
              arrayFilters: [
                { 'variant._id': targetVariantId }
              ]
            }
          });
        } else {
          console.log('✅ [Service] Skipping separate offer push for new variant (offers already included)');
        }

        console.log('✅ [Service] Prepared offer for variant:', {
          variantId: targetVariantId,
          color: inputVariant.color,
          isNew: isNewVariant,
          offersCount: newOffers.length,
          isFirstOffer: !variantHadOffersBefore
        });
      }

      // ✅✅✅ NEW: Add new variants to product (if any)
      if (newVariantsToPush.length > 0) {
        updateOperations.push({
          updateOne: {
            filter: { _id: existingProduct._id },
            update: {
              $push: { variants: { $each: newVariantsToPush } },
              $set: { updatedAt: new Date() }
            }
          }
        });
        console.log(`✅ [Service] Added ${newVariantsToPush.length} new variants`);
      }

      // ✅✅✅ NEW: Set productOwner if this is the FIRST offer for this product
      if (!existingProduct.productOwner) {
        // Check if any offers were added in this operation
        const hasNewOffers = updateOperations.some(op =>
          op.updateOne?.update?.$push?.['variants.$[variant].offers']
        );

        if (hasNewOffers) {
          // Find the earliest offer to set as productOwner
          let earliestOfferSeller = null;
          let earliestDate = new Date('9999-12-31');

          for (const inputVariant of offerData.variants) {
            for (const offer of inputVariant.offers) {
              // Use createdAt from the offer we just created
              const offerDate = new Date();  // All new offers have same timestamp
              if (offerDate < earliestDate) {
                earliestDate = offerDate;
                earliestOfferSeller = incomingSellerId;
              }
            }
          }

          if (earliestOfferSeller) {
            updateOperations.push({
              updateOne: {
                filter: { _id: existingProduct._id },
                update: {
                  $set: {
                    productOwner: earliestOfferSeller,
                    updatedAt: new Date()
                  }
                }
              }
            });
            console.log('👑 [Service] Set productOwner:', {
              productId: existingProduct._id,
              owner: earliestOfferSeller,
              reason: 'First offer added to product'
            });
          }
        }
      }

      // ✅ If no operations were created, throw error
      if (updateOperations.length === 0) {
        throw new CatalogError('No matching variants found in the product to add offers to');
      }

      // ✅ Execute bulk write
      await Product.bulkWrite(updateOperations);

      // ✅ Recalculate aggregated prices
      await recalculateProductPrices(existingProduct._id);

      const updatedProduct = await Product.findById(existingProduct._id)
        .populate('seller', 'sellerName businessDetails.businessName')
        .populate('variants.offers.seller', 'sellerName businessDetails.businessName');

      // ✅ Ensure variantOwner is properly stringified in response
      const productResponse = updatedProduct.toObject?.() || updatedProduct;
      if (productResponse.variants?.length > 0) {
        productResponse.variants = productResponse.variants.map(v => {
          const variantObj = v.toObject?.() || v;
          return {
            ...variantObj,
            _id: variantObj._id?.toString?.(),
            // ✅✅✅ Stringify variantOwner
            variantOwner: variantObj.variantOwner?.toString?.(),
            offers: variantObj.offers?.map(o => {
              const offerObj = o.toObject?.() || o;
              return {
                ...offerObj,
                _id: offerObj._id?.toString?.(),
                seller: offerObj.seller?.toString?.() || offerObj.seller
              };
            })
          };
        });
      }

      console.log('✅ [Service] Offer(s) added successfully');
      return productResponse;

    } catch (error) {
      console.error('❌ List offer service error:', error.message);
      if (error.name === 'CatalogError') throw error;
      throw new CatalogError(error.message || 'Failed to list offer');
    }
  }


  // ✅ Update seller's offer (price/stock only)
  async updateOffer(offerId, updates, sellerId) {
    try {
      const offer = await Product.findOne({
        _id: offerId,
        seller: sellerId,
        catalog: { $ne: null }  // Must be catalog-linked
      });

      if (!offer) {
        throw new CatalogError('Offer not found or access denied');
      }

      // ✅ ONLY allow price/stock updates for catalog-linked products
      const allowedUpdates = ['variants', 'isActive'];
      const updateData = {};

      for (const field of allowedUpdates) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }

      // ✅ Block title/description/image changes
      if (updates.title || updates.description || updates.images) {
        throw new CatalogError('Cannot modify shared product details. Contact catalog owner or admin.');
      }

      Object.assign(offer, updateData);
      await offer.save();

      // ✅ Update catalog aggregated prices
      await recalculateProductPrices(offer._id);

      return await Product.findById(offer._id)
        .populate('seller', 'sellerName businessDetails.businessName');
    } catch (error) {
      console.error('❌ Update offer error:', error.message);
      throw new CatalogError(error.message || 'Failed to update offer');
    }
  }

  // ✅ Get seller's offer for a catalog
  async getSellerOfferForCatalog(catalogId, sellerId) {
    try {
      const offer = await Product.findOne({
        catalog: catalogId,
        seller: sellerId,
        isActive: true
      }).populate('seller', 'sellerName businessDetails.businessName');

      return offer;
    } catch (error) {
      console.error('❌ Get seller offer error:', error.message);
      throw new CatalogError(error.message || 'Failed to fetch offer');
    }
  }

  async createCatalog(catalogData, sellerId) {
    throw new CatalogError('Direct catalog creation is not supported. Use Product model with catalog: null for independent products.');
  }
}  // ✅ CLOSE class ProductCatalogService HERE

// ✅ Helper: Recalculate min/max prices for a Product after offers change
async function recalculateProductPrices(productId) {
  const productObjectId = mongoose.Types.ObjectId.isValid(productId)
    ? new mongoose.Types.ObjectId(productId)
    : productId;

  const product = await Product.findById(productObjectId);
  if (!product) return;

  let minPrice = Infinity;
  let maxPrice = 0;
  let hasActiveOffers = false;

  // ✅ Scan all variants and their offers for active prices
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
  await Product.findByIdAndUpdate(productObjectId, {
    minPrice: hasActiveOffers ? (minPrice === Infinity ? 0 : minPrice) : 0,
    maxPrice: hasActiveOffers ? maxPrice : 0,
    updatedAt: new Date()
  });
}

// ✅ Export the service instance
module.exports = new ProductCatalogService();