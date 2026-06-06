import {
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  Rating,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import StarIcon from "@mui/icons-material/Star";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { uploadToCloudinary } from "../../../util/uploadToCloudnary";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import { createReview } from "../../../Redux Toolkit/Customer/ReviewSlice";

interface CreateReviewRequest {
  reviewText: string;
  rating: number;
  productImages: string[];
}

const WriteReview = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { productId } = useParams();
  const [uploadImage, setUploadingImage] = useState(false);

  const formik = useFormik<CreateReviewRequest>({
    initialValues: {
      reviewText: "",
      rating: 4,
      productImages: [],
    },

    validationSchema: Yup.object({
      reviewText: Yup.string()
        .required("Review is required")
        .min(10, "Minimum 10 characters required"),
      rating: Yup.number()
        .required("Rating is required")
        .min(1)
        .max(5),
    }),

    onSubmit: async (values) => {
      if (!productId) return;
      try {
        await dispatch(
          createReview({
            productId,
            review: values,
            jwt: localStorage.getItem("jwt") || "",
            navigate,
          })
        );
      } catch (error) {
        console.log("Review submit error:", error);
      }
    },
  });

  // ✅ FIX: uploadToCloudinary returns { success, url } — extract url correctly
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const result = await uploadToCloudinary(file);

      if (result.success && result.url) {
        formik.setFieldValue("productImages", [
          ...formik.values.productImages,
          result.url, // ✅ use result.url, not the whole result object
        ]);
      } else {
        console.error("Image upload failed:", result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploadingImage(false);
      event.target.value = ""; // ✅ reset input so same file can be re-uploaded
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...formik.values.productImages];
    updatedImages.splice(index, 1);
    formik.setFieldValue("productImages", updatedImages);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-2 md:px-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT SIDE */}
        <Card className="p-6 h-fit shadow-sm border rounded-xl">
          <div className="flex flex-col items-center text-center">
            <Avatar sx={{ width: 80, height: 80, bgcolor: "#14b8a6" }}>
              <ShoppingBagIcon sx={{ fontSize: 40 }} />
            </Avatar>

            <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>
              Share your experience
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your review helps other customers make better purchase decisions.
            </Typography>

            <Divider sx={{ width: "100%", my: 3 }} />

            <div className="space-y-4 w-full text-left">
              <div className="flex gap-3 items-start">
                <StarIcon className="text-yellow-500 mt-1" />
                <div>
                  <Typography fontWeight="600">Rate Product</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Give honest rating based on product quality.
                  </Typography>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <AddPhotoAlternateIcon className="text-blue-500 mt-1" />
                <div>
                  <Typography fontWeight="600">Upload Photos</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add real product images for better trust.
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* RIGHT SIDE */}
        <Card className="lg:col-span-2 p-6 shadow-sm border rounded-xl">
          <Typography variant="h5" fontWeight="bold">
            Write a Review
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tell others what you think about this product.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            className="space-y-6"
          >
            {/* PRODUCT RATING */}
            <div>
              <Typography fontWeight="600" sx={{ mb: 1 }}>
                Product Rating
              </Typography>
              <Rating
                name="rating"
                precision={1}
                size="large"
                value={formik.values.rating}
                onChange={(_event, value) =>
                  formik.setFieldValue("rating", value)
                }
              />
              {formik.touched.rating && formik.errors.rating && (
                <Typography color="error" variant="body2">
                  {formik.errors.rating}
                </Typography>
              )}
            </div>

            {/* REVIEW TEXT */}
            <TextField
              fullWidth
              multiline
              rows={6}
              id="reviewText"
              name="reviewText"
              label="Write your review"
              placeholder="Describe your experience with this product..."
              value={formik.values.reviewText}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.reviewText &&
                Boolean(formik.errors.reviewText)
              }
              helperText={
                formik.touched.reviewText && formik.errors.reviewText
              }
            />

            {/* IMAGE UPLOAD */}
            <div>
              <Typography fontWeight="600" sx={{ mb: 2 }}>
                Upload Images
              </Typography>

              <div className="flex flex-wrap gap-4">
                <input
                  type="file"
                  id="review-image"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />

                <label htmlFor="review-image" className="relative">
                  <div className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                    <AddPhotoAlternateIcon
                      className="text-gray-500"
                      sx={{ fontSize: 35 }}
                    />
                  </div>
                  {/* ✅ spinner overlay on the label, not inside the div */}
                  {uploadImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
                      <CircularProgress size={28} />
                    </div>
                  )}
                </label>

                {/* ✅ images are now proper string URLs — will render correctly */}
                {formik.values.productImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`review-${index}`}
                      className="w-28 h-28 rounded-xl object-cover border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        bgcolor: "white",
                        boxShadow: 1,
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={formik.isSubmitting}
                sx={{
                  backgroundColor: "#14b8a6",
                  px: 4,
                  "&:hover": { backgroundColor: "#0f766e" },
                }}
              >
                {formik.isSubmitting ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </Box>
        </Card>
      </div>
    </div>
  );
};

export default WriteReview;