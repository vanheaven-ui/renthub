"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getListingById, createReview } from "@/lib/api";
import { Listing } from "@/types";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthProvider";
import { StarIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import ImageWithLoader from "@/components/ImageWithLoader";
import { ReviewSchema } from "@/validation/review";
import { formatNumber } from "@/lib/formatNumbers";

// 💰 Styled UGX Badge
const UgxBadge = ({ className }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center rounded bg-purple-600 text-white px-1.5 py-0.5 text-[10px] font-bold leading-none ${className}`}
  >
    UGX
  </span>
);

const ListingPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bookingEndDateString = searchParams.get("endDate");

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: () => getListingById(id),
  });

  const mutation = useMutation({
    mutationFn: (values: { rating: number; comment?: string }) =>
      createReview(id, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["listing", id] }),
  });

  if (isLoading) return <LoadingScreen message="Loading listing details..." />;
  if (error || !listing)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: Listing not found.
      </div>
    );

  const isRenter = user?.role === "RENTER";
  let showReviewForm = false;
  if (isRenter && bookingEndDateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(bookingEndDateString);
    endDate.setHours(0, 0, 0, 0);

    if (today.getTime() === endDate.getTime()) showReviewForm = true;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 py-10 overflow-hidden">
      {/* Background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none" />

      <div className="relative container mx-auto max-w-5xl z-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/50 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden p-6 md:p-10">
          {/* Image & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="relative h-64 md:h-full w-full rounded-2xl overflow-hidden shadow-lg">
              <ImageWithLoader
                src={listing.images[0] || ""}
                alt={listing.title}
                fill
                className="object-cover transition-transform duration-500 transform hover:scale-[1.02]"
                containerClassName="relative h-64 md:h-full w-full"
              />
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-900 mb-2 drop-shadow-sm leading-tight">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-2 text-3xl font-bold text-pink-600 mb-4">
                  <UgxBadge />
                  <span>{formatNumber(listing.pricePerDay)} / night</span>
                </div>
                <div className="flex items-center text-gray-600 mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 mr-2 text-purple-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.54 22.351A8.287 8.287 0 0 0 16.5 21h4.002c.414 0 .764-.325.802-.73l.228-2.284a1.995 1.995 0 0 0 .11-.194l.024-.055a.99.99 0 0 0-.853-1.4L15 14.128v-.111c.403-1.127.61-2.24.61-3.344 0-2.887-2.31-5.2-5.187-5.2C7.31 5.473 5 7.786 5 10.673c0 1.104.207 2.217.61 3.344v.111L3.423 16.43a.99.99 0 0 0-.852 1.401l.023.055a2.001 2.001 0 0 0 .11.194l.228 2.284c.038.405.389.73.802.73H7.5c1.867 0 3.693.645 5.152 1.83.189.151.385.293.584.426ZM9 10.673a2.673 2.673 0 1 1 5.346 0 2.673 2.673 0 0 1-5.346 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{listing.location}</span>
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {listing.description}
                </p>
              </div>

              {/* Book Button */}
              {isRenter && (
                <>
                  {!listing.alreadyBooked ? (
                    <Link
                      href={`/booking/create?listingId=${id}`}
                      className="w-full text-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Book Your Dream Stay
                    </Link>
                  ) : (
                    <button
                      className="w-full text-center px-8 py-4 bg-gray-300 text-gray-600 font-bold rounded-full shadow cursor-not-allowed"
                      disabled
                    >
                      Already Booked
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <hr className="my-10 border-gray-200" />

          {/* Owner & Reviews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Owner Info */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-purple-800 flex items-center">
                <UserCircleIcon className="w-8 h-8 mr-2 text-pink-500" />
                About the Owner
              </h2>
              <div className="p-6 bg-gray-50 rounded-2xl shadow-inner flex items-center gap-4">
                {listing.owner?.profilePicture ? (
                  <ImageWithLoader
                    src={listing.owner.profilePicture}
                    alt={listing.owner.name || "Owner"}
                    width={80}
                    height={80}
                    className="rounded-full border-4 border-white shadow-md object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-purple-200 flex items-center justify-center">
                    <UserCircleIcon className="w-12 h-12 text-purple-600" />
                  </div>
                )}
                <div>
                  <p className="text-xl font-semibold text-gray-900">
                    {listing.owner?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">Property Owner</p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-purple-800">
                Reviews ({listing.reviews?.length || 0})
              </h2>
              {listing.reviews?.length ? (
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {listing.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-gray-50 rounded-2xl shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <ImageWithLoader
                          src={review.author?.profilePicture || ""}
                          alt={review.author?.name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full border-2 border-white object-cover shadow-sm"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">
                            {review.author?.name || "Anonymous"}
                          </p>
                          <div className="flex items-center text-yellow-500">
                            {Array.from({ length: 5 }, (_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 text-sm italic">
                          &apos;{review.comment}&apos;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic mb-6">No reviews yet.</p>
              )}

              {/* Add Review Form */}
              {showReviewForm && (
                <>
                  <h3 className="text-xl font-bold mb-4 text-purple-800 mt-6">
                    Leave a Review
                  </h3>
                  <Formik
                    initialValues={{ rating: 5, comment: "" }}
                    validationSchema={ReviewSchema}
                    onSubmit={(values, { resetForm }) => {
                      mutation.mutate(values, { onSuccess: () => resetForm() });
                    }}
                  >
                    {({ isSubmitting }) => (
                      <Form className="p-6 bg-white rounded-2xl shadow-md">
                        <div className="mb-4">
                          <label className="block font-medium mb-2 text-gray-700">
                            Rating
                          </label>
                          <Field
                            type="number"
                            name="rating"
                            min="1"
                            max="5"
                            className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                          />
                          <ErrorMessage
                            name="rating"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block font-medium mb-2 text-gray-700">
                            Comment
                          </label>
                          <Field
                            as="textarea"
                            name="comment"
                            rows={3}
                            className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                            placeholder="Share your experience..."
                          />
                          <ErrorMessage
                            name="comment"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting || mutation.isPending}
                          className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition-all duration-300 transform hover:scale-[1.01]"
                        >
                          {mutation.isPending
                            ? "Submitting..."
                            : "Submit Review"}
                        </button>
                      </Form>
                    )}
                  </Formik>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingPage;
