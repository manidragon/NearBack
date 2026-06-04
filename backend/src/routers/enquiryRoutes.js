const express = require("express");
const router = express.Router();

const enquiryController =
  require("../controllers/enquiryController");

router.post(
  "/create",
  enquiryController.createEnquiry
);

router.get(
  "/seller/:sellerId",
  enquiryController.getSellerEnquiries
);

module.exports = router;