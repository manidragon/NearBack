// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\ProductService.js

const Product = require("../models/Product");
const Category = require("../models/Category");
const CategoryAttribute = require("../models/CategoryAttribute");
const ProductError = require("../exceptions/ProductError");
const mongoose = require("mongoose");


/* =========================================================
   ✅ NORMALIZE ATTRIBUTE VALUE
========================================================= */
const normalizeAttributeValue = (
  value = ""
) => {

  let formatted =
    String(value)
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  // ✅ AUTO FORMAT GB
  formatted =
    formatted.replace(
      /(\d+)\s*gb/gi,
      "$1 GB"
    );

  // ✅ AUTO FORMAT TB
  formatted =
    formatted.replace(
      /(\d+)\s*tb/gi,
      "$1 TB"
    );

  // ✅ AUTO FORMAT MB
  formatted =
    formatted.replace(
      /(\d+)\s*mb/gi,
      "$1 MB"
    );

  // ✅ Capitalize remaining words
  formatted =
    formatted.replace(
      /\b\w/g,
      (char) => char.toUpperCase()
    );

  return formatted;
};


/* =========================================================
   ✅ ADD CUSTOM OPTIONS TO CATEGORY ATTRIBUTES
========================================================= */
const addCustomOptionsToAttributes = async (
  categoryId,
  highlights,
  variants
) => {

  try {

    if (!categoryId) {
      console.log("❌ categoryId missing");
      return;
    }

    /* =====================================================
       ✅ COMMON FUNCTION
    ===================================================== */
    const processAttribute = async (
      key,
      rawValue
    ) => {

      if (
        rawValue === undefined ||
        rawValue === null ||
        rawValue === "" ||
        rawValue === "__custom__"
      ) {
        return;
      }

      // ✅ Normalize value
      const normalizedValue =
        normalizeAttributeValue(
          rawValue
        );

      // ✅ Find attribute
      const attribute =
        await CategoryAttribute.findOne({
          categoryId,
          name: key.toLowerCase(),
          type: "select"
        });

      if (!attribute) {
        return;
      }

      // ✅ Duplicate check
      const alreadyExists =
        (attribute.options || [])
          .some((option) => {

            return (
              normalizeAttributeValue(
                option
              ).toLowerCase()
              ===
              normalizedValue.toLowerCase()
            );
          });

      // ✅ Skip duplicate
      if (alreadyExists) {

        console.log(
          `⏭️ Skip duplicate option: ${normalizedValue}`
        );

        return;
      }

      // ✅ Add normalized value
      await CategoryAttribute.updateOne(
        {
          _id: attribute._id
        },
        {
          $addToSet: {
            options: normalizedValue
          }
        }
      );

      console.log(
        `✅ Added option: ${normalizedValue}`
      );
    };

    /* =====================================================
       ✅ HIGHLIGHTS
    ===================================================== */
    if (
      highlights &&
      typeof highlights === "object"
    ) {

      for (const [key, value]
        of Object.entries(highlights)) {

        await processAttribute(
          key,
          value
        );
      }
    }

    /* =====================================================
       ✅ VARIANT SPECIFICATIONS
    ===================================================== */
    if (Array.isArray(variants)) {

      for (const variant of variants) {

        const specs =
          variant.specifications || {};

        for (const [key, value]
          of Object.entries(specs)) {

          await processAttribute(
            key,
            value
          );
        }
      }
    }

    console.log(
      "✅ CategoryAttribute options updated"
    );

  } catch (error) {

    console.error(
      "❌ addCustomOptionsToAttributes ERROR:",
      error
    );
  }
};


class ProductService {

  /* =========================================================
     ✅ CREATE PRODUCT
  ========================================================= */
  async createProduct(req, seller) {

    try {

      // ✅ Validate category
      const category = await Category.findById(
        req.category
      );

      if (!category || category.level !== 3) {
        throw new ProductError(
          "Valid Level 3 category is required"
        );
      }

      // ✅ Get category attributes
      const categoryAttrs =
        await CategoryAttribute.find({
          categoryId: category.categoryId,
          isActive: true
        });

      const highlightFieldNames = categoryAttrs
        .filter(
          attr =>
            attr.displayInHighlights &&
            !attr.isVariantField
        )
        .map(attr => attr.name.toLowerCase());

      /* =====================================================
         ✅ PROCESS VARIANTS
      ===================================================== */
      const processedVariants =
        await Promise.all(

          req.variants.map(async (variant, index) => {

            // ✅ AUTO SKU
            if (!variant.sku) {

              const slug =
                req.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .slice(0, 20);

              variant.sku =
                `${slug}-${variant.color.toLowerCase()}-${index + 1}`
                  .substring(0, 100);
            }

            // ✅ IMAGE VALIDATION
            if (
              !variant.images ||
              variant.images.length === 0
            ) {
              throw new ProductError(
                `Variant ${index + 1}: At least one image required`
              );
            }

            /* =================================================
               ✅ OFFERS
            ================================================= */
            let finalOffers = variant.offers;

            // ✅ Legacy support
            if (
              !finalOffers ||
              !Array.isArray(finalOffers) ||
              finalOffers.length === 0
            ) {

              if (
                variant.mrpPrice === undefined ||
                variant.sellingPrice === undefined
              ) {

                throw new ProductError(
                  `Variant ${index + 1}: Either offers array or price fields required`
                );
              }

              finalOffers = [
                {
                  seller: seller._id,
                  mrpPrice: Number(
                    variant.mrpPrice
                  ),
                  sellingPrice: Number(
                    variant.sellingPrice
                  ),
                  stock:
                    Number(variant.stock) || 0,
                  sku: variant.sku,
                  isActive:
                    variant.isActive !== false
                }
              ];
            }

            // ✅ Validate offers
            for (
              let offerIdx = 0;
              offerIdx < finalOffers.length;
              offerIdx++
            ) {

              const offer =
                finalOffers[offerIdx];

              if (!offer.seller) {
                throw new ProductError(
                  `Variant ${index + 1}, Offer ${offerIdx + 1}: seller required`
                );
              }

              const mrpPrice =
                Number(offer.mrpPrice);

              const sellingPrice =
                Number(offer.sellingPrice);

              const stock =
                Number(offer.stock) || 0;

              if (
                !mrpPrice ||
                mrpPrice <= 0
              ) {
                throw new ProductError(
                  `Variant ${index + 1}: Invalid MRP`
                );
              }

              if (
                !sellingPrice ||
                sellingPrice <= 0
              ) {
                throw new ProductError(
                  `Variant ${index + 1}: Invalid Selling Price`
                );
              }

              if (
                sellingPrice > mrpPrice
              ) {
                throw new ProductError(
                  `Variant ${index + 1}: Selling price cannot exceed MRP`
                );
              }

              if (stock < 0) {
                throw new ProductError(
                  `Variant ${index + 1}: Invalid stock`
                );
              }

              finalOffers[offerIdx] = {
                ...offer,
                seller: offer.seller,
                mrpPrice,
                sellingPrice,
                stock,
                isActive:
                  offer.isActive !== false
              };
            }

            /* =================================================
               ✅ SPECIFICATIONS
            ================================================= */
            let variantSpecs = {};

            if (
              variant.specifications &&
              typeof variant.specifications === "object"
            ) {

              Object.entries(
                variant.specifications
              ).forEach(([key, value]) => {

                // ✅ Normalize specs
                variantSpecs[key] =
                  normalizeAttributeValue(
                    value
                  );
              });
            }

            console.log(
              "🔍 [Service] Saving variant specs:",
              variantSpecs
            );

            /* =================================================
               ✅ HIGHLIGHTS
            ================================================= */
            const variantHighlights = {};

            if (
              req.highlights &&
              typeof req.highlights === "object"
            ) {

              Object.entries(req.highlights)
                .forEach(([key, value]) => {

                  const keyLower =
                    key.toLowerCase();

                  if (
                    highlightFieldNames.includes(
                      keyLower
                    )
                  ) {

                    variantHighlights[key] =
                      normalizeAttributeValue(
                        value
                      );
                  }
                });
            }

            return {
              ...variant,

              specifications:
                variantSpecs,

              highlights:
                Object.keys(
                  variantHighlights
                ).length > 0
                  ? variantHighlights
                  : undefined,

              isActive:
                variant.isActive !== false,

              offers:
                finalOffers,

              variantOwner:
                seller._id,

              mrpPrice:
                undefined,

              sellingPrice:
                undefined,

              stock:
                undefined
            };
          })
        );

      /* =====================================================
         ✅ CREATE PRODUCT
      ===================================================== */
      const normalizedHighlights = {};

      if (
        req.highlights &&
        typeof req.highlights === "object"
      ) {

        Object.entries(req.highlights)
          .forEach(([key, value]) => {

            normalizedHighlights[key] =
              normalizeAttributeValue(
                value
              );
          });
      }

      const product = new Product({

        title:
          req.title.trim(),

        description:
          req.description.trim(),

        category:
          category._id,

        seller:
          seller._id,

        productOwner:
          seller._id,

        highlights:
          Object.keys(
            normalizedHighlights
          ).length > 0
            ? new Map(
                Object.entries(
                  normalizedHighlights
                )
              )
            : new Map(),

        variants:
          processedVariants,

        isActive:
          req.isActive !== false
      });

      // ✅ SAVE PRODUCT
      await product.save();

      /* =====================================================
         ✅ UPDATE ATTRIBUTE OPTIONS
      ===================================================== */
      await addCustomOptionsToAttributes(
        category.categoryId,
        normalizedHighlights,
        processedVariants
      );

      console.log(
        "✅ Product + CategoryAttribute updated"
      );

      // ✅ RETURN PRODUCT
      return await Product.findById(
        product._id
      )
        .populate(
          "seller",
          "sellerName businessDetails.businessName"
        );

    } catch (error) {

      console.error(
        "❌ Create product error:",
        error.message
      );

      if (
        error.name === "MongoServerError" &&
        error.code === 11000
      ) {

        throw new ProductError(
          "Duplicate SKU or product slug"
        );
      }

      throw new ProductError(
        error.message ||
        "Failed to create product"
      );
    }
  }

  /* =========================================================
     ✅ GET PRODUCTS BY QUERY
  ========================================================= */
  async getProductsByQuery(
    query,
    page = 0,
    limit = 20
  ) {

    try {

      const products =
        await Product.find(query)
          .populate(
            "seller",
            "sellerName businessDetails.businessName"
          )
          .populate(
            "category",
            "name categoryId level"
          )
          .populate(
            "variants.offers.seller",
            "sellerName businessDetails.businessName"
          )
          .sort({ createdAt: -1 })
          .skip(page * limit)
          .limit(limit);

      const total =
        await Product.countDocuments(query);

      return {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(
            total / limit
          )
        }
      };

    } catch (error) {

      console.error(
        "❌ Get products by query error:",
        error.message
      );

      throw new ProductError(
        error.message ||
        "Failed to fetch products"
      );
    }
  }

  /* =========================================================
     ✅ GET SELLER PRODUCTS
  ========================================================= */
  async getSellerProducts(
    sellerId,
    page = 0,
    limit = 20
  ) {

    try {

      return await this.getProductsByQuery(
        {
          seller: sellerId,
          isActive: true
        },
        page,
        limit
      );

    } catch (error) {

      console.error(
        "❌ Get seller products error:",
        error.message
      );

      throw new ProductError(
        error.message ||
        "Failed to fetch seller products"
      );
    }
  }

  /* =========================================================
     ✅ GET SELLER CATALOG OFFERS
  ========================================================= */
  async getSellerCatalogOffers(
    sellerId,
    page = 0,
    limit = 20
  ) {

    try {

      const query = {

        isActive: true,

        variants: {
          $elemMatch: {

            offers: {
              $elemMatch: {

                seller:
                  new mongoose.Types.ObjectId(
                    sellerId
                  ),

                isActive: {
                  $ne: false
                }
              }
            }
          }
        }
      };

      console.log(
        "🔍 [Service] Catalog query:",
        JSON.stringify(query, null, 2)
      );

      return await this.getProductsByQuery(
        query,
        page,
        limit
      );

    } catch (error) {

      console.error(
        "❌ Get seller catalog offers error:",
        error.message
      );

      throw new ProductError(
        error.message ||
        "Failed to fetch catalog offers"
      );
    }
  }
}

module.exports = new ProductService();