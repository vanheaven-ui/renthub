"use client";

import React, { useState, useMemo } from "react";
import { motion, type TargetAndTransition } from "framer-motion";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPinIcon,
  StarIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import StarRating from "@/components/StarRating";

// Define booking status progression
const STATUS_ORDER = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELED"] as const;

interface Booking {
  id: string;
  listing?: {
    id: string;
    title: string;
    location: string;
    images?: string[];
    owner?: { name: string } | null;
    reviews?: { id: string; rating: number; comment: string }[];
  };
  startDate: string;
  endDate: string;
  status: (typeof STATUS_ORDER)[number];
  totalPrice: number;
}

interface BookingDetailsPageProps {
  booking: Booking;
}

// 🩸 Animated Canceled Stamp
const StampVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -20 },
  visible: { opacity: 1, scale: 1, rotate: -10, transition: { duration: 0.4 } },
};

const BookingDetailsPage: React.FC<BookingDetailsPageProps> = ({ booking }) => {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);

  const currentStatusIndex = STATUS_ORDER.indexOf(booking.status);
  const images = booking.listing?.images ?? [];

  // ⭐ Compute average rating
  const avgRating = useMemo(() => {
    const reviews = booking.listing?.reviews ?? [];
    if (!reviews.length) return 0;
    return reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  }, [booking.listing?.reviews]);

  const handleBookAgain = () => {
    router.push(`/listings/${booking.listing?.id}`);
  };

  const handleCancel = () => {
    console.log("Cancel booking");
  };

  const handleSave = () => {
    setEditMode(false);
    console.log("Saved changes");
  };

  // ✅ Canceled stamp component
  const CanceledStamp = () => {
    const visibleVariant = StampVariants.visible as TargetAndTransition;

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
        <motion.div
          variants={StampVariants}
          initial="hidden"
          animate={{
            ...visibleVariant,
            rotate: 6,
            opacity: 0.9,
          }}
          className="text-center font-extrabold select-none shadow-xl tracking-widest bg-red-100/70 backdrop-blur-sm
            text-5xl sm:text-7xl md:text-9xl
            text-red-700 border-4 sm:border-6 md:border-8 border-red-400
            rounded-xl sm:rounded-2xl
            p-3 sm:p-4 md:p-6"
        >
          CANCELED
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Booking Status Tracker */}
      <div className="flex justify-center items-center py-6 gap-6">
        {STATUS_ORDER.map((status, index) => {
          const isActive = index <= currentStatusIndex;
          return (
            <div key={status} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold ${
                  isActive
                    ? "bg-purple-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  isActive ? "text-purple-700" : "text-gray-400"
                }`}
              >
                {status}
              </span>
              {index < STATUS_ORDER.length - 1 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    index < currentStatusIndex ? "bg-purple-600" : "bg-gray-300"
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Booking Card */}
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-2xl overflow-hidden">
        <div className="relative">
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 relative">
              <div className="col-span-2 relative">
                <Image
                  src={images[0]}
                  alt={booking.listing?.title || "Listing image"}
                  width={800}
                  height={600}
                  className="object-cover h-full w-full rounded-l-2xl"
                />
              </div>
              <div className="flex flex-col gap-1">
                {images.slice(1, 3).map((img, idx) => (
                  <Image
                    key={idx}
                    src={img}
                    alt={`Listing image ${idx + 2}`}
                    width={400}
                    height={300}
                    className="object-cover h-full w-full"
                  />
                ))}
              </div>
              {booking.status === "CANCELED" && <CanceledStamp />}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-100 text-gray-500 font-semibold text-lg rounded-2xl">
              No images available for this listing.
            </div>
          )}
        </div>

        <div className="p-6 md:p-10">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            {/* Listing Info */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {booking.listing?.title}
              </h2>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPinIcon className="w-4 h-4 mr-1 text-purple-600" />
                <span>{booking.listing?.location}</span>
              </div>
              <div className="flex items-center mt-2">
                <StarRating rating={avgRating} />
                <span className="ml-2 text-gray-700">
                  ({booking.listing?.reviews?.length || 0} reviews)
                </span>
              </div>
            </div>

            {/* Booking Summary */}
            <motion.div
              className="bg-gray-100 rounded-2xl p-6 shadow-md flex flex-col gap-3 w-full md:w-1/3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-center text-gray-700">
                <div className="flex items-center gap-1">
                  <CalendarDaysIcon className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold">Check-In</span>
                </div>
                <span>
                  {format(new Date(booking.startDate), "dd MMM yyyy")}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-700">
                <div className="flex items-center gap-1">
                  <CalendarDaysIcon className="w-4 h-4 text-pink-500" />
                  <span className="font-semibold">Check-Out</span>
                </div>
                <span>{format(new Date(booking.endDate), "dd MMM yyyy")}</span>
              </div>

              <div className="flex justify-between items-center border-t border-gray-300 pt-3 mt-3">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-lg font-semibold text-purple-700">
                  ${booking.totalPrice}
                </span>
              </div>

              {/* Buttons */}
              {booking.status !== "CANCELED" && (
                <div className="mt-4">
                  {editMode ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="w-full py-2 bg-green-500 text-white rounded-xl shadow hover:bg-green-600 transition"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancel}
                        className="w-full py-2 text-purple-700 hover:text-purple-500 transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-xl shadow hover:scale-105 transition-transform"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                      Edit Dates
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleBookAgain}
                className="w-full py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-xl shadow hover:scale-105 transition-transform"
              >
                Book Again
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
