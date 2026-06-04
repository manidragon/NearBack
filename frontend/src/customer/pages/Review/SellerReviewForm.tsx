import { useFormik } from "formik";
import * as Yup from "yup";

import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Rating,
  TextField,
  Typography,
  Card,
  Alert,
} from "@mui/material";

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CloseIcon from "@mui/icons-material/Close";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import StoreIcon from "@mui/icons-material/Store";

import { uploadToCloudinary } from "../../../util/uploadToCloudnary";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { createSellerReview } from "../../../Redux Toolkit/Customer/SellerReviewSlice";

interface SellerReviewRequest {
  reviewText: string;
  rating: number;
  images: string[];
}

const SellerReviewForm = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const sellerReviewState = useAppSelector((state) => state.sellerReview);
  const [uploadImage, setUploadingImage] = useState(false);

  const formik = useFormik<SellerReviewRequest>({
    initialValues: {
      reviewText: "",
      rating: 4,
      images: [],
    },

    validationSchema: Yup.object({
      reviewText: Yup.string()
        .required("Review text is required")
        .min(10, "Review must be at least 10 characters"),
      rating: Yup.number()
        .required("Rating required")
        .min(1, "Please select a rating")
        .max(5),
    }),

    onSubmit: async (values) => {
      if (!sellerId) return;
      // ✅ Use Redux thunk — handles save + navigate(-1)
      await dispatch(
        createSellerReview({
          sellerId,
          reviewText: values.reviewText,
          rating: values.rating,
          images: values.images,
          navigate,
        })
      );
    },
  });

  const handleImageChange = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const image = await uploadToCloudinary(file);
    if (image) {
      formik.setFieldValue("images", [...formik.values.images, image]);
    }
    setUploadingImage(false);
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...formik.values.images];
    updated.splice(index, 1);
    formik.setFieldValue("images", updated);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">

          {/* LEFT CARD */}
          <Card className="p-5 h-fit shadow-sm rounded-sm">
            <div className="flex flex-col items-center text-center">

              <div className="w-20 h-20 rounded-full bg-[#18c1b5] flex items-center justify-center">
                <StoreIcon sx={{ fontSize: 38, color: "white" }} />
              </div>

              <Typography sx={{ mt: 3, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.3 }}>
                Share your seller experience
              </Typography>

              <Typography sx={{ mt: 2, fontSize: "15px", color: "#666", maxWidth: "250px" }}>
                Your review helps other customers make better purchasing decisions.
              </Typography>

              <div className="w-full border-t mt-6 pt-6">
                <div className="flex items-start gap-4 text-left">
                  <span className="text-yellow-500 text-[22px]">★</span>
                  <div>
                    <Typography sx={{ fontWeight: 600, fontSize: "17px" }}>Rate Seller</Typography>
                    <Typography sx={{ color: "#666", fontSize: "14px" }}>
                      Give honest rating based on seller service.
                    </Typography>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-left mt-7">
                  <AddPhotoAlternateIcon sx={{ color: "#4f7cff", fontSize: 22, mt: "2px" }} />
                  <div>
                    <Typography sx={{ fontWeight: 600, fontSize: "17px" }}>Upload Photos</Typography>
                    <Typography sx={{ color: "#666", fontSize: "14px" }}>
                      Add real seller proof images for better trust.
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* RIGHT CARD */}
          <Card className="p-6 md:p-8 shadow-sm rounded-sm">

            <Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>
              Write a Seller Review
            </Typography>

            <Typography sx={{ mt: 1, color: "#666", fontSize: "15px" }}>
              Tell others what you think about this seller.
            </Typography>

            {sellerReviewState.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {sellerReviewState.error}
              </Alert>
            )}

            <div className="border-t mt-6 pt-6">
              <Box component="form" onSubmit={formik.handleSubmit}>

                {/* RATING */}
                <div>
                  <Typography fontWeight="600" sx={{ mb: 1 }}>Seller Rating</Typography>
                  <Rating
                    name="rating"
                    precision={1}
                    size="large"
                    value={formik.values.rating}
                    onChange={(event, value) => formik.setFieldValue("rating", value)}
                  />
                  {formik.touched.rating && formik.errors.rating && (
                    <Typography color="error" variant="body2">{formik.errors.rating}</Typography>
                  )}
                </div>

                {/* REVIEW TEXT */}
                <TextField
                  sx={{ mt: 3 }}
                  fullWidth
                  multiline
                  rows={7}
                  id="reviewText"
                  name="reviewText"
                  label="Write your review"
                  placeholder="Describe your experience with this seller..."
                  value={formik.values.reviewText}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.reviewText && Boolean(formik.errors.reviewText)}
                  helperText={formik.touched.reviewText && formik.errors.reviewText}
                />

                {/* IMAGES */}
                <div className="mt-8">
                  <Typography sx={{ mb: 3, fontWeight: 600, fontSize: "18px" }}>
                    Upload Images
                  </Typography>

                  <div className="flex flex-wrap gap-4">
                    <input
                      type="file"
                      id="sellerReviewImage"
                      accept="image/*"
                      hidden
                      onChange={handleImageChange}
                    />

                    <label htmlFor="sellerReviewImage" className="relative">
                      <div className="w-24 h-24 border border-dashed border-gray-400 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                        <AddPhotoAlternateIcon sx={{ fontSize: 35, color: "#666" }} />
                      </div>
                      {uploadImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-md">
                          <CircularProgress size={28} />
                        </div>
                      )}
                    </label>

                    {formik.values.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img src={image} alt="" className="w-24 h-24 rounded-md object-cover border" />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveImage(index)}
                          sx={{ position: "absolute", top: -8, right: -8, background: "white", boxShadow: 1 }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex gap-4 mt-10">
                  <Button variant="outlined" onClick={() => navigate(-1)} sx={{ px: 4, py: 1 }}>
                    CANCEL
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={formik.isSubmitting || sellerReviewState.loading}
                    sx={{
                      px: 5,
                      py: 1,
                      backgroundColor: "#12bfae",
                      "&:hover": { backgroundColor: "#0ea999" },
                    }}
                  >
                    {formik.isSubmitting || sellerReviewState.loading ? (
                      <CircularProgress size={20} sx={{ color: "white" }} />
                    ) : (
                      "SUBMIT REVIEW"
                    )}
                  </Button>
                </div>
              </Box>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerReviewForm;