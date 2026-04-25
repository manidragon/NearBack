// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\ProductCatalogController.js
const ProductCatalogService = require('../services/ProductCatalogService');
const CatalogError = require('../exceptions/CatalogError');

class ProductCatalogController {

  // ✅ Search catalog (for sellers before listing)
  searchCatalog = async (req, res) => {
    try {
      const { q, page = 0, limit = 20, brand, category } = req.query;

      const result = await ProductCatalogService.searchCatalog(q, {
        page: parseInt(page),
        limit: parseInt(limit),
        brand,
        category
      });

      // ✅ NEW: Add isOwner flag to each catalog result
      // req.seller is attached by sellerAuthMiddleware
      const sellerId = req.seller?._id;

      const catalogs = result.catalogs.map(catalog => {
        // Handle both Mongoose docs and plain objects
        const catalogObj = catalog.toObject?.() || catalog;

        return {
          ...catalogObj,
          // ✅ isOwner: true if current seller created this catalog
          isOwner: sellerId &&
            catalogObj.createdBy?._id?.toString() === sellerId.toString()
        };
      });

      res.status(200).json({
        success: true,
        data: catalogs,  // ✅ Now includes isOwner for each catalog
        pagination: result.pagination
      });
    } catch (error) {
      console.error('❌ Search catalog error:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Search failed'
      });
    }
  }

  // ✅ Get catalog with all offers (for Product Details page)
  getCatalogById = async (req, res) => {
    try {
      const { catalogId } = req.params;

      const catalog = await ProductCatalogService.getCatalogById(catalogId);

      // ✅ NEW: Add isOwner flag to catalog response
      const sellerId = req.seller?._id;
      const catalogWithOwner = {
        ...catalog,
        isOwner: sellerId &&
          catalog.createdBy?._id?.toString() === sellerId.toString()
      };

      res.status(200).json({
        success: true,
        data: catalogWithOwner  // ✅ Now includes isOwner
      });
    } catch (error) {
      console.error('❌ Get catalog error:', error.message);
      const status = error instanceof CatalogError ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to fetch catalog'
      });
    }
  }


  listOfferOnCatalog = async (req, res) => {
    try {
      const { catalogId } = req.params;
      const seller = req.seller;

      console.log('🔍 [Controller] List offer request:', {
        catalogId,
        catalogIdType: typeof catalogId,
        sellerId: seller._id,
        bodyKeys: Object.keys(req.body),
        variantsCount: req.body?.variants?.length
      });

      const offer = await ProductCatalogService.listOfferOnCatalog(
        catalogId,
        req.body,  // ✅ Pass full body (contains variants array)
        seller._id
      );

      res.status(201).json({
        success: true,
        message: 'Offer listed successfully',
        data: offer
      });

    } catch (error) {
      console.error('❌ List offer controller error:', {
        message: error.message,
        name: error.name
      });

      const status = error.name === 'CatalogError' ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to list offer'
      });
    }
  }

  // ✅ Update seller's offer (price/stock only)
  updateOffer = async (req, res) => {
    try {
      const { offerId } = req.params;
      const seller = req.seller;
      const updates = req.body;

      const offer = await ProductCatalogService.updateOffer(offerId, updates, seller._id);

      res.status(200).json({
        success: true,
        message: 'Offer updated',
        data: offer
      });
    } catch (error) {
      console.error('❌ Update offer error:', error.message);
      const status = error instanceof CatalogError ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to update offer'
      });
    }
  }

  // ✅ Get seller's offer for a catalog
  getSellerOfferForCatalog = async (req, res) => {
    try {
      const { catalogId } = req.params;
      const seller = req.seller;

      const offer = await ProductCatalogService.getSellerOfferForCatalog(catalogId, seller._id);

      res.status(200).json({
        success: true,
        data: offer
      });
    } catch (error) {
      console.error('❌ Get seller offer error:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch offer'
      });
    }
  }

  // ✅✅✅ NEW: Get all seller offers for a catalog product (customer-facing, NO auth)
  getAllOffersForCatalog = async (req, res) => {
    try {
      const { catalogId } = req.params;

      // Find catalog product
      const catalogProduct = await require('../models/Product').findById(catalogId)
        .populate('seller', 'sellerName businessDetails.businessName')
        .populate('variants.offers.seller', 'sellerName businessDetails.businessName');

      if (!catalogProduct) {
        return res.status(404).json({ success: false, message: 'Catalog product not found' });
      }

      // Get all offers from all sellers
      const allOffers = [];

      // Add catalog owner's offers
      allOffers.push({
        _id: catalogProduct._id,
        seller: catalogProduct.seller,
        variants: catalogProduct.variants,
        minPrice: catalogProduct.minPrice,
        maxPrice: catalogProduct.maxPrice
      });

      // Find all linked offers (products that reference this catalog)
      const linkedOffers = await require('../models/Product').find({
        catalog: catalogId,
        isActive: true
      }).populate('seller', 'sellerName businessDetails.businessName')
        .populate('variants.offers.seller', 'sellerName businessDetails.businessName');

      linkedOffers.forEach(offer => {
        allOffers.push({
          _id: offer._id,
          seller: offer.seller,
          variants: offer.variants,
          minPrice: offer.minPrice,
          maxPrice: offer.maxPrice
        });
      });

      res.status(200).json({
        success: true,
        data: {
          catalogProduct,
          offers: allOffers
        }
      });
    } catch (error) {
      console.error('❌ Error fetching catalog offers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch offers' });
    }
  }
}

module.exports = new ProductCatalogController();