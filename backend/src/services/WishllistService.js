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
            populate({path:"products"});;

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

            const productIndex = wishlist.products.findIndex(
                (p) => p._id.toString() === product._id.toString()
              );
            if (productIndex > -1) {
                
                wishlist.products.splice(productIndex, 1);
            } else {
               
                wishlist.products.push(product._id);
            }

            // Save the updated wishlist
            return await Wishlist.findByIdAndUpdate(wishlist._id, wishlist,{new : true}).
            populate({path:"products"});
        } catch (error) {
            throw new Error(`Error updating wishlist: ${error.message}`);
        }
    }
}

module.exports = new WishlistService();
