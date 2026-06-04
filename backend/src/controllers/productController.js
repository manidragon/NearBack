// ✅ backend/src/controllers/productController.js
const { createProductSchema, updateProductSchema } = require("../validators/productValidators");
const ProductService = require("../services/ProductService");
const ProductError = require("../exceptions/ProductError");
const mongoose = require('mongoose');

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

      // ✅ CRITICAL: Extract location params BEFORE building specs
      const {
        color,
        // Location params (extract these FIRST)
        userLat, userLng, radiusKm, district,
        // ...specs captures ONLY remaining unknown params
        ...specs
      } = req.query;

      // ✅ Build location filter from extracted params
      let locationFilter = null;
      if (userLat && userLng) {
        const lat = parseFloat(userLat);
        const lng = parseFloat(userLng);
        const radius = radiusKm ? parseFloat(radiusKm) : 50;
        if (!isNaN(lat) && !isNaN(lng)) {
          locationFilter = {
            type: 'current',
            coordinates: { lat, lng },
            radiusKm: radius
          };
        }
      } else if (district && typeof district === 'string' && district.trim()) {
        locationFilter = {
          type: 'district',
          district: district.trim()
        };
      }

      // ✅ Only pass specs if it has non-location keys
      const validSpecs = Object.keys(specs).length > 0 ? specs : undefined;

      const product = await ProductService.getProductById(productId, {
        color: color?.toLowerCase(),
        specs: validSpecs,
        location: locationFilter
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

  // ✅ NEW: Get seller's catalog offers
  getSellerCatalogOffers = async (req, res) => {
    try {
      const seller = req.seller;
      const { page = 0, limit = 20 } = req.query;

      const query = {
        isActive: true,
        'variants.offers': {
          $elemMatch: {
            seller: seller._id,
            isActive: { $ne: false }
          }
        }
      };

      const products = await require('../services/ProductService').getProductsByQuery(
        query,
        parseInt(page),
        parseInt(limit)
      );

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

  // ✅ NEW: PRICE FILTERS
getPriceFilters = async (req, res) => {
  try {

    const filters = [
      {
        label: "Below ₹10,000",
        min: 0,
        max: 10000
      },
      {
        label: "₹10,000 - ₹20,000",
        min: 10000,
        max: 20000
      },
      {
        label: "₹20,000 - ₹30,000",
        min: 20000,
        max: 30000
      },
      {
        label: "₹30,000 - ₹50,000",
        min: 30000,
        max: 50000
      },
      {
        label: "Above ₹50,000",
        min: 50000,
        max: null
      }
    ];

    return res.status(200).json({
      success: true,
      data: filters
    });

  } catch (error) {

    console.error("❌ Get price filters error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch price filters"
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

// ✅✅✅ FULLY FIXED: searchProducts method with location + district support
searchProducts = async (req, res) => {
  try {
    // ✅ Extract ALL params explicitly (including location)
    const {
      q, query, search, category, colors, color, brand, size,
      minPrice, maxPrice, minDiscount, discount,
      sortBy, sort, page, pageNumber, limit, stock,
      // ✅ NEW: Location filter params
      userLat, userLng, radiusKm, district
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
      'jwt', 'token',
      // ✅ NEW: Location filter params
      'userLat', 'userLng', 'radiusKm', 'district'
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

    // ✅✅✅ FIX: Define searchTerm properly from q/query/search
    const searchTerm = q || query || search;

    // ✅ Handle page normalization
    const pageNum = pageNumber !== undefined ? parseInt(pageNumber) : (page ? parseInt(page) : 0);
    const limitNum = limit ? parseInt(limit) : 20;

    // ✅✅✅ NEW: Build location filter object
    let locationFilter = null;
    
    if (userLat && userLng) {
      // Current location mode: use coordinates + radius
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      const radius = radiusKm ? parseFloat(radiusKm) : 50; // Default 50km
      
      if (!isNaN(lat) && !isNaN(lng)) {
        locationFilter = {
          type: 'current',
          coordinates: { lat, lng },
          radiusKm: radius
        };
      }
    } else if (district && typeof district === 'string' && district.trim()) {
      // District mode: simple string match
      locationFilter = {
        type: 'district',
        district: district.trim()
      };
    }

    // ✅ Build complete filters object
    const filters = {
      search: searchTerm,  // ✅ Now searchTerm is defined
      category,
      colors: colors?.split?.(',').map(c => c.trim()).filter(Boolean),
      specs: Object.keys(specs).length > 0 ? specs : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minDiscount: minDiscount ? parseFloat(minDiscount) : undefined,
      sortBy: sortBy || sort || 'newest',
      page: pageNum,
      limit: limitNum,
      // ✅ NEW: Include location/district filter
      location: locationFilter,
      district: district && typeof district === 'string' ? district.trim() : undefined
    };

    // ✅ Debug logging
    console.log('🔍 [CONTROLLER] Search filters:', {
      search: filters.search,
      category: filters.category,
      location: filters.location,
      district: filters.district,
      page: filters.page,
      limit: filters.limit
    });

    // ✅ Call service with filters
    const products = await ProductService.searchProducts(filters);

    // ✅ Format response
    const responseData = {
      success: true,
      data: products || [],
      count: products?.length || 0,
      page: filters.page,
      totalPages: filters.limit ? Math.ceil((products?.length || 0) / filters.limit) : 1
    };

    // ✅ Add distance/district info if location search was used
    if (locationFilter?.type === 'current' && products?.length > 0) {
      responseData.locationInfo = {
        type: 'current',
        coordinates: locationFilter.coordinates,
        radiusKm: locationFilter.radiusKm,
        resultsSortedBy: 'distance'
      };
    } else if (filters.district) {
      responseData.locationInfo = {
        type: 'district',
        district: filters.district
      };
    }

    res.status(200).json(responseData);

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
      req.query = {
        ...req.query,
        page: req.query.page || 0,
        limit: req.query.limit || 20,
        sortBy: req.query.sortBy || 'newest'
        // ✅ Location params pass through automatically via spread operator
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

// ✅ CommonJS export
module.exports = new SellerProductController();
