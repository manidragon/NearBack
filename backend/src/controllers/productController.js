// ✅ backend/src/controllers/productController.js
// ✅ CommonJS imports - NO 'import' statements
const { createProductSchema, updateProductSchema } = require("../validators/productValidators");
const ProductService = require("../services/ProductService");
const ProductError = require("../exceptions/ProductError");
const mongoose = require('mongoose'); // ✅ Add mongoose for ObjectId validation

class SellerProductController {
  // ✅ Arrow function methods = auto-bound 'this'

  createProduct = async (req, res) => {
    try {
      await createProductSchema.validate(req.body, { abortEarly: false });
      const seller = req.seller;
      const product = await ProductService.createProduct(req.body, seller);
      res.status(201).json({ success: true, message: "Product created", data: product });
    } catch (error) {
      console.error("❌ Create product error:", error.message);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: "Validation failed", errors: error.errors });
      }
      if (error instanceof ProductError) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  updateProduct = async (req, res) => {
    try {
      const { productId } = req.params;
      await updateProductSchema.validate(req.body, { abortEarly: false });
      const seller = req.seller;
      const product = await ProductService.updateProduct(productId, req.body, seller._id);
      res.status(200).json({ success: true, message: "Product updated", data: product });
    } catch (error) {
      console.error("❌ Update product error:", error.message);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: "Validation failed", errors: error.errors });
      }
      if (error instanceof ProductError) {
        const status = error.message.includes("not found") ? 404 : 400;
        return res.status(status).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  getProductById = async (req, res) => {
    try {
      const { productId } = req.params;
      const { color, ...specs } = req.query;
      const product = await ProductService.getProductById(productId, {
        color: color?.toLowerCase(),
        specs
      });
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      console.error("❌ Get product error:", error.message);
      if (error instanceof ProductError) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  getSellerProducts = async (req, res) => {
    try {
      const seller = req.seller;
      const { page = 0, limit = 20 } = req.query;
      const result = await ProductService.getSellerProducts(seller._id, parseInt(page), parseInt(limit));
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error("❌ Get seller products error:", error.message);
      res.status(500).json({ success: false, message: error.message || "Failed to fetch products" });
    }
  }

  // ✅✅✅ NEW: Get seller's catalog offers (products linked to catalogs)
  getSellerCatalogOffers = async (req, res) => {
     try {
    const seller = req.seller;
    const { page = 0, limit = 20 } = req.query;
    
    console.log('🔍 [Controller] Fetching catalog offers for seller:', {
      sellerId: seller._id,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    // ✅✅✅ FIXED: Query for products where seller has offers in variants[].offers[]
    // This finds products where the seller has listed an offer (catalog or independent)
    const query = {
      isActive: true,
      'variants.offers': { $elemMatch: { 
        seller: seller._id,  // ✅ Match seller ObjectId
        isActive: { $ne: false }  // ✅ Only active offers
      }}
    };
    
    console.log('🔍 [Controller] Query:', JSON.stringify(query, null, 2));
    
    const products = await require('../services/ProductService').getProductsByQuery(
      query, 
      parseInt(page), 
      parseInt(limit)
    );
    
    console.log(`✅ [Controller] Found ${products?.length || 0} products with seller offers`);
    
      res.status(200).json({
        success: true,
        data: products || [],
        count: products?.length || 0
      });
      
    } catch (error) {
      console.error("❌ Get seller catalog offers error:", error.message);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch catalog offers" 
      });
    }
  }

  deleteProduct = async (req, res) => {
    try {
      const { productId } = req.params;
      const seller = req.seller;
      await ProductService.deleteProduct(productId, seller._id);
      res.status(200).json({ success: true, message: "Product deactivated" });
    } catch (error) {
      console.error("❌ Delete product error:", error.message);
      if (error instanceof ProductError) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: "Failed to delete product" });
    }
  }

  // ✅✅✅ FIXED: searchProducts method - Proper query handling
  searchProducts = async (req, res) => {
    try {
      console.log('🔍 [CONTROLLER] Raw query params:', req.query);

      // ✅ Extract KNOWN params explicitly
      const {
        q, query, search, category, colors, color, brand, size,
        minPrice, maxPrice, minDiscount, discount,
        sortBy, sort, page, pageNumber, limit, stock
      } = req.query;

      // ✅ Define params that should NOT be treated as specs
      const KNOWN_PARAMS = new Set([
        // Search & category
        'q', 'query', 'search', 'category',
        // Filter params
        'colors', 'color', 'brand', 'size', 'stock',
        'minPrice', 'maxPrice', 'minDiscount', 'discount',
        // Pagination & sorting
        'page', 'pageNumber', 'limit', 'sortBy', 'sort',
        // Auth (if passed)
        'jwt', 'token'
      ]);

      // ✅ Safely collect ONLY true dynamic specs
      const specs = {};
      for (const [key, value] of Object.entries(req.query)) {
        if (KNOWN_PARAMS.has(key) || !value || value === 'undefined' || value === 'null') {
          continue;
        }
        const values = Array.isArray(value)
          ? value.map(v => String(v).trim()).filter(v => v && v !== 'undefined')
          : String(value).split(',').map(v => v.trim()).filter(v => v && v !== 'undefined');
        if (values.length > 0) {
          specs[key] = values;
          console.log(`🔍 [CONTROLLER] Adding dynamic spec: ${key} = [${values.join(', ')}]`);
        }
      }

      // ✅ Normalize search term from q, query, OR search
      const searchTerm = q || query || search;

      // ✅ Handle page/pageNumber normalization
      const pageNum = pageNumber !== undefined ? parseInt(pageNumber) : (page ? parseInt(page) : 0);
      const limitNum = limit ? parseInt(limit) : 20;

      // ✅ Build filters object
      const filters = {
        search: searchTerm,
        category,
        colors: colors?.split?.(',').map(c => c.trim()).filter(Boolean),
        specs: Object.keys(specs).length > 0 ? specs : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minDiscount: minDiscount ? parseFloat(minDiscount) : undefined,
        sortBy: sortBy || sort || 'newest',
        page: pageNum,
        limit: limitNum
      };

      console.log('🔍 [CONTROLLER] Final filters sent to service:', {
        search: filters.search,
        category: filters.category,
        specs: filters.specs,
        colors: filters.colors,
        priceRange: { min: filters.minPrice, max: filters.maxPrice },
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy
      });

      // ✅ Call service
      const products = await ProductService.searchProducts(filters);

      console.log(`✅ [CONTROLLER] Found ${products?.length || 0} products for search: "${filters.search}"`);

      res.status(200).json({
        success: true,
        data: products || [],
        count: products?.length || 0,
        page: filters.page,
        totalPages: filters.limit ? Math.ceil((products?.length || 0) / filters.limit) : 1
      });

    } catch (error) {
      console.error("❌ Search products error:", {
        message: error.message,
        stack: error.stack,
        query: req.query
      });

      res.status(200).json({
        success: false,
        message: "Search failed: " + error.message,
        data: [],
        count: 0
      });
    }
  }

  // ✅ Wrapper for searchProduct route
  searchProduct = async (req, res, next) => {
    return this.searchProducts(req, res, next);
  }

  // ✅ Wrapper for 'getAllProducts' route - delegates to searchProducts
  getAllProducts = async (req, res, next) => {
    try {
      console.log('🔍 DEBUG - getAllProducts query:', {
        query: req.query,
        category: req.query.category,
        categoryType: typeof req.query.category,
        isValidObjectId: mongoose.Types.ObjectId.isValid(req.query.category)
      });

      req.query = {
        ...req.query,
        page: req.query.page || 0,
        limit: req.query.limit || 20,
        sortBy: req.query.sortBy || 'newest'  // ✅ Default to 'newest', not 'relevance'
      };
      return this.searchProducts(req, res, next);
    } catch (error) {
      console.error('❌ getAllProducts error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return next(error);
    }
  }
}

// ✅ CommonJS export - NO 'export default'
module.exports = new SellerProductController();