const Enquiry = require("../models/Enquiry");

exports.createEnquiry = async (req, res) => {
  try {
    const {
      sellerId,
      name,
      email,
      subject,
      message,
    } = req.body;

    const enquiry = await Enquiry.create({
      seller: sellerId,
      name,
      email,
      subject,
      message,
    });

    res.status(201).json(enquiry);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getSellerEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({
      seller: req.params.sellerId,
    }).sort({ createdAt: -1 });

    res.status(200).json(enquiries);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};