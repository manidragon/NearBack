const mongoose =
require("mongoose");

const sellerReviewSchema =
new mongoose.Schema({

reviewText:{
type:String,
required:true
},

rating:{
type:Number,
required:true
},

images:{
type:[String],
default:[]
},

seller:{
type:
mongoose.Schema.Types.ObjectId,

ref:"Seller",

required:true
},

user:{
type:
mongoose.Schema.Types.ObjectId,

ref:"User",

required:true
}

},
{
timestamps:true
}
);


module.exports=
mongoose.model(
"SellerReview",
sellerReviewSchema
);