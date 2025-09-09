"use client";

import { useQuery } from "@tanstack/react-query";
import { getListingById } from "@/lib/api";
import { Listing, Review } from "@/types";
import Image from "next/image";

const ListingPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const {
    data: listing,
    isLoading,
    error,
  } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: () => getListingById(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg text-gray-500">
        Loading listing details...
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: Listing not found.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-10">
      {/* Decorative abstract shapes */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
      <div className="absolute top-20 right-10 w-60 h-60 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
      <div className="absolute bottom-10 left-1/2 w-48 h-48 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />

      <div className="relative container mx-auto max-w-4xl z-10">
        {/* Listing Card */}
        <div className="bg-white shadow-xl rounded-3xl overflow-hidden">
          {/* Image */}
          <div className="relative h-96 w-full">
            <Image
              src={listing.images[0] || "https://via.placeholder.com/600"}
              alt={listing.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="p-6">
            {/* Title & Price */}
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {listing.title}
              </h1>
              <span className="text-xl font-semibold text-indigo-600">
                ${listing.pricePerDay}/night
              </span>
            </div>

            {/* Location */}
            <p className="text-gray-600 mb-4">
              📍 <span className="font-medium">{listing.location}</span>
            </p>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed mb-6">
              {listing.description}
            </p>

            {/* Owner Info */}
            {listing.owner && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow">
                <Image
                  src={
                    listing.owner.profilePicture ||
                    "https://via.placeholder.com/50"
                  }
                  alt={listing.owner.name || "Owner"}
                  width={50}
                  height={50}
                  className="rounded-full object-cover border-2 border-indigo-200"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {listing.owner.name}
                  </p>
                  <p className="text-sm text-gray-500">Owner</p>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Reviews
              </h2>
              {listing.reviews && listing.reviews.length > 0 ? (
                <div className="space-y-4">
                  {listing.reviews.map((review: Review) => (
                    <div
                      key={review.id}
                      className="p-4 border border-gray-100 rounded-2xl shadow-sm bg-gray-50"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Image
                          src={
                            review.author?.profilePicture ||
                            "https://via.placeholder.com/40"
                          }
                          alt={review.author?.name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full border"
                        />
                        <div>
                          <p className="font-medium text-gray-800">
                            {review.author?.name || "Anonymous"}
                          </p>
                          <p className="text-yellow-500 text-sm">
                            {"⭐".repeat(review.rating)}
                          </p>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingPage;
