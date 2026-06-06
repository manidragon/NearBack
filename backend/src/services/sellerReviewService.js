const SellerReview =
    require(
        "../models/SellerReview"
    );

class SellerReviewService {

    async createReview(
        data,
        user
    ) {

        const existingReview =
            await SellerReview.findOne({

                seller: data.sellerId,

                user: user._id

            });

        if (existingReview) {

            throw new Error(
                "You have already reviewed this seller"
            );

        }

        const review =
            await SellerReview.create({

                reviewText:
                    data.reviewText,

                rating:
                    data.rating,

                images:
                    data.images,

                seller:
                    data.sellerId,

                user:
                    user?._id

            });

        return review;

    }


    async getReviews(
        sellerId
    ) {

        return await SellerReview
            .find({
                seller: sellerId
            })
            .populate(
                "user",
                "fullName"
            );

    }

}

module.exports =
    new SellerReviewService();