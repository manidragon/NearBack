import React, {
  useEffect,
  useState
}
  from "react";

import {
  useAppDispatch,
  useAppSelector
}
  from "../../../Redux Toolkit/Store";

import {
  fetchSellerReviews
}
  from "../../../Redux Toolkit/Customer/SellerReviewSlice";


export default function Reviews({
  seller
}: any) {

  const dispatch =
    useAppDispatch();

  const sellerReviewState =
    useAppSelector(
      state => state.sellerReview
    );


  const [
    showReviewForm,
    setShowReviewForm
  ] =
    useState(false);


  /* NEW */
  const [
    helpfulCounts,
    setHelpfulCounts
  ] =
    useState<
      { [key: string]: number }
    >({});



  useEffect(() => {

    if (
      seller?._id
    ) {

      dispatch(

        fetchSellerReviews({

          sellerId:
            seller._id

        })

      );

    }

  }, [
    seller,
    dispatch
  ]);


  const reviews =

    sellerReviewState
      .reviewsBySeller[
    seller?._id
    ]

    ||

    [];



  const average =

    reviews.length

      ?

      (

        reviews.reduce(
          (sum: number, r: any) =>

            sum + r.rating,

          0

        )

        /

        reviews.length

      ).toFixed(1)

      :

      "0";



  const countStar =
    (star: number) =>

      reviews.filter(
        (r: any) =>

          r.rating === star

      ).length;



  /* NEW */
  const handleHelpful =
    (reviewId: string) => {

      setHelpfulCounts(
        prev => ({

          ...prev,

          [reviewId]:

            (prev[
              reviewId
            ] || 24) + 1

        })
      );

    };



  return (

    <section
      className="section"
      id="reviews"
    >

      <div className="section-header">

        <h2 className="section-title">

          ⭐ Customer Reviews

        </h2>




      </div>






      {/* SUMMARY */}

      <div className="reviews-summary">

        <div className="rating-overall">

          <div className="big-rating">

            {average}

          </div>


          <div className="summary-stars">

            {

              "★".repeat(
                Math.round(
                  Number(
                    average
                  )
                )
              )

            }

          </div>


          <div className="review-count">

            Based on

            {" "}

            {
              reviews.length
            }

            reviews

          </div>

        </div>



        <div className="rating-bars">

          {

            [5, 4, 3, 2, 1]

              .map(
                star => (

                  <div
                    key={star}
                    className="bar-row"
                  >

                    <span>

                      {
                        star
                      }

                    </span>


                    <div
                      className="
bar-track
"
                    >

                      <div

                        className="
bar-fill
"

                        style={{

                          width:

                            reviews.length

                              ?

                              `${(

                                countStar(
                                  star
                                )

                                /

                                reviews.length

                              )

                              * 100}%`

                              :

                              "0%"

                        }}

                      >

                      </div>

                    </div>


                    <span>

                      {
                        countStar(
                          star
                        )
                      }

                    </span>

                  </div>

                ))

          }

        </div>

      </div>




      {/* REVIEW CARDS */}

      {

        reviews.map(
          (review: any) => (

            <div

              key={
                review._id
              }

              className="
review-card
"

            >

              <div
                className="
review-header
"
              >

                <div
                  className="
review-user
"
                >

                  <div
                    className="
avatar
"
                  >

                    {

                      review.user
                        ?.fullName

                        ?.substring(
                          0,
                          2
                        )

                        .toUpperCase()

                      ||

                      "U"

                    }

                  </div>



                  <div>

                    <div
                      className="
review-name
"
                    >

                      {
                        review.user
                          ?.fullName
                      }

                    </div>


                    <div
                      className="
review-date
"
                    >

                      2 days ago · Verified Purchase

                    </div>

                  </div>

                </div>



                <div
                  className="
review-stars
"
                >

                  {
                    "★".repeat(
                      review.rating
                    )
                  }

                </div>

              </div>




              <p
                className="
review-text
"
              >

                {
                  review.reviewText
                }

              </p>




              {

                review.images
                  ?.length > 0 && (

                  <div
                    className="
review-images
"
                  >

                    {

                      review.images.map(
                        (
                          img: string,
                          i: number
                        ) => (

                          <img

                            key={i}

                            src={img}

                            alt="review"

                          />

                        ))

                    }

                  </div>

                )

              }






            </div>

          ))

      }

    </section>

  )

}