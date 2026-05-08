// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\WishllistService.js
const Wishlist = require('../models/Wishlist');

class WishlistService {
    constructor(wishlistRepository) {
        this.wishlistRepository = wishlistRepository;
    }

    async createWishlist(user) {
        try {
            const wishlist = new Wishlist({
                user: user._id,
                products: []
            });

            return await wishlist.save();
        } catch (error) {
            throw new Error(`Error creating wishlist: ${error.message}`);
        }
    }

    // Get wishlist by user ID
    async getWishlistByUserId(user) {
        try {
            let wishlist = await Wishlist.findOne({ user: user._id }).
                populate({ path: "products" });;

            // If no wishlist exists for the user, create a new one
            if (!wishlist) {
                wishlist = await this.createWishlist(user);
            }

            return wishlist;
        } catch (error) {
            throw new Error(`Error fetching wishlist: ${error.message}`);
        }
    }

    // Add or remove a product from the user's wishlist
    async addProductToWishlist(user, product) {
        try {
            const wishlist = await this.getWishlistByUserId(user);

            // ✅ FIX: Safely compare IDs (handles both populated objects AND ObjectId strings)
            const productIndex = wishlist.products.findIndex((p) => {
                // If p is a populated Product object, extract its _id
                // If p is an ObjectId string, use it directly
                const existingId = (typeof p === 'object' && p !== null && p._id)
                    ? p._id.toString()
                    : p.toString();
                return existingId === product._id.toString();
            });

            if (productIndex > -1) {
                // ✅ Product exists → Remove it (toggle OFF)
                wishlist.products.splice(productIndex, 1);
            } else {
                // ✅ Product doesn't exist → Add it (toggle ON)
                // Store as ObjectId reference (Mongoose will handle conversion)
                wishlist.products.push(product._id);
            }

            // ✅ Save changes and repopulate products for response
            const updatedWishlist = await Wishlist.findByIdAndUpdate(
                wishlist._id,
                { products: wishlist.products },
                { new: true, runValidators: true }
            ).populate("products");

            return updatedWishlist;
        } catch (error) {
            console.error("❌ Wishlist toggle error:", error);
            throw new Error(`Error updating wishlist: ${error.message}`);
        }
    }

    async removeProductFromWishlist(user, productId) {
  try {
    const wishlist = await this.getWishlistByUserId(user);
    
    // Filter out the product to remove
    wishlist.products = wishlist.products.filter(p => {
      const existingId = typeof p === 'object' && p._id 
        ? p._id.toString() 
        : p.toString();
      return existingId !== productId.toString();
    });
    
    // Save and repopulate
    const updatedWishlist = await Wishlist.findByIdAndUpdate(
      wishlist._id,
      { products: wishlist.products },
      { new: true, runValidators: true }
    ).populate("products");
    
    return updatedWishlist;
  } catch (error) {
    throw new Error(`Error removing from wishlist: ${error.message}`);
  }
}
}

module.exports = new WishlistService();
