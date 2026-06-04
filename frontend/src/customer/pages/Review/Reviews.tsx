import React, { useEffect } from "react";
import {
    Box,
    Typography,
    Divider,
    CircularProgress
} from "@mui/material";

import { useParams } from "react-router-dom";

import { useAppDispatch, useAppSelector }
from "../../../Redux Toolkit/Store";

import {
    fetchReviewsByProductId
} from "../../../Redux Toolkit/Customer/ReviewSlice";

import ProductReviewCard
from "./ProductReviewCard";

const ReviewPage = () => {

    const dispatch = useAppDispatch();

    const { productId } = useParams();

    const review = useAppSelector(
        (state: any) => state.review
    );

    useEffect(() => {

        if (productId) {

            dispatch(
                fetchReviewsByProductId({
                    productId
                })
            );

        }

    }, [dispatch, productId]);

    if (review.loading) {

        return (
            <Box className="flex justify-center mt-20">
                <CircularProgress />
            </Box>
        );

    }

    return (

        <div className="px-5 lg:px-20 py-10">

            <Typography
                variant="h5"
                fontWeight="bold"
                className="mb-10"
            >
                All Reviews
            </Typography>

            {/* NO REVIEWS */}
            {(!review.reviews ||
                review.reviews.length === 0) && (

                <Typography>
                    No reviews found
                </Typography>

            )}

            {/* ALL REVIEWS */}
            <div className="space-y-5">

                {(review.reviews || [])
                    .slice()
                    .sort(
                        (a: any, b: any) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    )
                    .map(
                        (
                            item: any,
                            index: number
                        ) => (

                            <div key={index}>

                                <ProductReviewCard
                                    item={item}
                                />

                                <Divider
                                    sx={{ mt: 3 }}
                                />

                            </div>

                        )
                    )}

            </div>

        </div>

    );

};

export default ReviewPage;