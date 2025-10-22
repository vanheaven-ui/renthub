"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getListingById, createReview } from "@/lib/api";
import { Listing } from "@/types";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthProvider";
import {
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import ImageWithLoader from "@/components/ImageWithLoader";
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const bookingEndDateString = searchParams.get("endDate");

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: () => getListingById(id),
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

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () =>
    setLightboxIndex((prev) =>
      prev !== null
        ? (prev - 1 + listing.images.length) % listing.images.length
        : 0
    );
  const nextImage = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % listing.images.length : 0
    );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 py-10 overflow-hidden">
      {/* 🌀 Animated Background Shapes */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"
      />

      <div className="relative container mx-auto max-w-5xl z-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/50 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden p-6 md:p-10">
          {/* 🖼️ Image Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div
              className="relative w-full h-80 md:h-full rounded-2xl overflow-hidden shadow-lg cursor-pointer"
              onClick={() => openLightbox(0)}
            >
              <ImageWithLoader
                src={listing.images[0] || ""}
                alt={listing.title}
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                containerClassName="relative h-80 md:h-full w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {listing.images.slice(1, 5).map((img, i) => (
                <div
                  key={i}
                  className="relative w-full h-36 md:h-40 rounded-2xl overflow-hidden shadow-md cursor-pointer"
                  onClick={() => openLightbox(i + 1)}
                >
                  <ImageWithLoader
                    src={img}
                    alt={`${listing.title}-${i + 1}`}
                    fill
                    className="object-cover"
                    containerClassName="relative w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Fullscreen Lightbox */}
          <AnimatePresence>
            {lightboxIndex !== null && (
              <motion.div
                className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  onClick={closeLightbox}
                  className="absolute top-5 right-5 text-white text-3xl p-2 rounded-full hover:bg-white/20 transition"
                >
                  <XMarkIcon className="w-8 h-8" />
                </button>
                <button
                  onClick={prevImage}
                  className="absolute left-5 text-white text-3xl p-2 rounded-full hover:bg-white/20 transition"
                >
                  <ArrowLeftIcon className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-5 text-white text-3xl p-2 rounded-full hover:bg-white/20 transition"
                >
                  <ArrowRightIcon className="w-8 h-8" />
                </button>
                <motion.img
                  key={lightboxIndex}
                  src={listing.images[lightboxIndex]}
                  alt={`Image ${lightboxIndex + 1}`}
                  className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🏠 Listing Details */}
          <div className="mb-10">
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
            {isRenter && (
              <>
                {!listing.alreadyBooked ? (
                  <Link
                    href={`/booking/create?listingId=${id}`}
                    className="w-full block text-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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

          {/* Owner & Reviews */}
          {/* to be implemented */}
        </div>
      </div>
    </div>
  );
};

export default ListingPage;
