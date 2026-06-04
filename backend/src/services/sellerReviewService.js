const SellerReview =
require(
"../models/SellerReview"
);

class SellerReviewService{

async createReview(
data,
user
){

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
){

return await SellerReview
.find({
seller:sellerId
})
.populate(
"user",
"fullName"
);

}

}

module.exports=
new SellerReviewService();