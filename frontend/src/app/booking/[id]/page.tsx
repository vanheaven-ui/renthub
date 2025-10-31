"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { getBookingById, updateBookingDates } from "@/lib/api";
import { Booking, BookingDetails, BookingStatus, Review } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";
import { format, isPast, isSameDay, differenceInDays } from "date-fns";
import toast from "react-hot-toast";
import { formatNumber } from "@/lib/formatNumbers";
import {
  CheckBadgeIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  MapPinIcon,
  ArrowLongLeftIcon,
} from "@heroicons/react/24/outline";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewSubmittedCard } from "@/components/ReviewSubmittedCard";
import { AnimatePresence, motion, Variants } from "framer-motion";
import ImageWithLoader from "@/components/ImageWithLoader";

const STATUS_ORDER: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELED",
];

// --- Responsive Stamps (Adjusted to Light Theme Colors) ---

const StampVariants: Variants = {
  hidden: { scale: 0.5, rotate: 0, opacity: 0.2 },
  visible: {
    scale: 1,
    rotate: -12,
    opacity: 0.9,
    transition: { duration: 0.7, type: "spring" },
  },
};

// Responsive COMPLETED Stamp
const CompletedStamp = () => (
  // Use light colors: text-blue-700, bg-blue-100/70, border-blue-400
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
    <motion.div
      variants={StampVariants}
      initial="hidden"
      animate="visible"
      className="text-center font-extrabold select-none shadow-xl tracking-widest bg-blue-100/70 backdrop-blur-sm
        text-5xl sm:text-7xl md:text-9xl
        text-blue-700 border-4 sm:border-6 md:border-8 border-blue-400
        rounded-xl sm:rounded-2xl
        p-3 sm:p-4 md:p-6"
    >
      COMPLETED
    </motion.div>
  </div>
);

// Responsive CANCELED Stamp
const CanceledStamp = () => (
  // Use light colors: text-red-700, bg-red-100/70, border-red-400
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
    <motion.div
      variants={StampVariants}
      initial="hidden"
      // FIX: Use the spread operator approach for clean overrides and to include the transition
      animate={{
        ...(StampVariants.visible as any),
        rotate: 6, // Override the rotation
        opacity: 0.9, // Keep or override opacity
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

// ---------------------------

const BookingDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const bookingId = params?.id as string;
  const [editMode, setEditMode] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [hasReviewed, setHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery<Booking, Error>({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (booking && booking.renterId && !userReview) {
      const review =
        booking?.listing?.reviews?.find(
          (r) => r.authorId === booking.renterId
        ) || null;
      setUserReview(review);
      setHasReviewed(!!review);
    }
  }, [booking, userReview]);

  const handleReviewSubmitted = (review: Review) => {
    setUserReview(review);
    setHasReviewed(true);
  };

  const bookingDetails: BookingDetails | null = booking
    ? {
        id: booking.id,
        listingId: booking.listingId,
        renterId: booking.renterId,
        renterName: booking.renter?.name ?? "Renter",
        renterProfile: booking.renter?.profilePicture ?? null,
        ownerId: booking.ownerId,
        ownerName: booking.owner?.name ?? "Owner",
        ownerProfile: booking.owner?.profilePicture ?? null,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        totalPrice: booking.totalPrice,
        paymentStatus: booking.paymentStatus,
      }
    : null;

  const bookingStartDate = bookingDetails
    ? new Date(bookingDetails.startDate)
    : null;
  const bookingEndDate = bookingDetails
    ? new Date(bookingDetails.endDate)
    : null;
  const today = new Date();

  let effectiveStatus: BookingStatus = bookingDetails?.status as BookingStatus;
  const isBookingCompleted = effectiveStatus === "COMPLETED";
  const isBookingCanceled = effectiveStatus === "CANCELED";
  const isPaid = bookingDetails?.paymentStatus === "PAID";
  const numberOfNights =
    bookingStartDate && bookingEndDate
      ? differenceInDays(bookingEndDate, bookingStartDate)
      : 0;
  const isDueOrPast =
    bookingEndDate &&
    (isPast(bookingEndDate) || isSameDay(bookingEndDate, today));

  if (bookingDetails && isPaid) {
    if (
      (effectiveStatus === "CONFIRMED" || effectiveStatus === "PENDING") &&
      isDueOrPast
    ) {
      effectiveStatus = "COMPLETED";
    }
  }

  const currentStatus = effectiveStatus;
  const isCurrentlyExtendable =
    bookingDetails &&
    !isBookingCompleted &&
    bookingEndDate &&
    isSameDay(bookingEndDate, today) &&
    isPaid;

  const isPrePaymentEditable =
    bookingDetails &&
    !isDueOrPast &&
    (bookingDetails.status === "PENDING" ||
      (bookingDetails.status === "CONFIRMED" &&
        bookingDetails.paymentStatus === "PENDING"));

  const showEditButton: boolean | null =
    isCurrentlyExtendable || isPrePaymentEditable;

  const { mutate: updateDates, isPending: isUpdating } = useMutation<
    Booking,
    Error,
    { bookingId: string; startDate: string; endDate: string }
  >({
    mutationFn: ({ bookingId, startDate, endDate }) =>
      updateBookingDates({ bookingId, startDate, endDate }),
    onSuccess: (updatedBooking) => {
      toast.success("Booking dates updated!");
      queryClient.setQueryData<Booking>(["booking", bookingId], updatedBooking);
      setEditMode(false);
    },
    onError: (err) =>
      toast.error(err.message || "Failed to update booking dates"),
  });

  if (isLoading) return <LoadingScreen message="Loading booking details..." />;
  if (error || !bookingDetails || !bookingEndDate)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Booking not found.
      </div>
    );

  const formattedStartDate = format(bookingStartDate!, "PPP");
  const formattedEndDate = format(bookingEndDate, "PPP");

  // --- Adjusted Status Colors for Light Theme ---
  const getStatusClass = (status: BookingStatus) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-500 border-green-600 text-white"; // Green for confirmed
      case "COMPLETED":
        return "bg-blue-500 border-blue-600 text-white"; // Blue for completed
      case "CANCELED":
        return "bg-red-500 border-red-600 text-white"; // Red for canceled
      default:
        return "bg-yellow-400 border-yellow-500 text-gray-800"; // Yellow for pending
    }
  };

  const handleUpdateDates = () => {
    if (
      isCurrentlyExtendable &&
      (!endDate || new Date(endDate) <= bookingEndDate)
    ) {
      return toast.error("New end date must be after current end date.");
    }
    if (
      !isCurrentlyExtendable &&
      (!startDate || !endDate || new Date(endDate) < new Date(startDate))
    ) {
      return toast.error("Please enter valid start and end dates.");
    }
    const finalStartDate = isCurrentlyExtendable
      ? bookingDetails.startDate.slice(0, 10)
      : startDate;
    updateDates({ bookingId, startDate: finalStartDate, endDate });
  };

  const handleBookAgain = () => {
    router.push(`/listings/${bookingDetails.listingId}`);
    toast("Redirecting to listing to book again!", { icon: "🏡" });
  };

  return (
    // --- Main Container: Light Theme Background ---
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 py-10 overflow-hidden">
      {/* 🌀 Animated Background Shapes (Copied from ListingPage) */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"
      />

      <div className="relative container mx-auto max-w-5xl z-10 px-4 sm:px-6 lg:px-8">
        {/* --- Main Card: White/Blur Background with Soft Shadow --- */}
        <div className="bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden p-6 md:p-10 space-y-8">
          <AnimatePresence>
            {isBookingCompleted && <CompletedStamp key="completed" />}
            {isBookingCanceled && <CanceledStamp key="canceled" />}
          </AnimatePresence>

          {/* ⬅️ Back to Bookings Button (Using ArrowLongLeftIcon to match ListingPage) */}
          <motion.button
            onClick={() => router.push("/booking/my-bookings")}
            className="flex items-center gap-1.5 p-2 pr-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ArrowLongLeftIcon className="w-6 h-6" />
            <span className="">Back to My Bookings</span>
          </motion.button>

          {/* --- Title --- */}
          <motion.h1
            className="text-4xl font-extrabold text-purple-900 text-center drop-shadow-sm leading-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Booking ID: {bookingDetails.id.substring(0, 8).toUpperCase()}
          </motion.h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: Listing and Images (2/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                className="p-6 rounded-2xl bg-white/70 border border-purple-200 shadow-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h2 className="text-3xl font-bold text-purple-900 mb-2">
                  {booking?.listing?.title ?? "Listing Title"}
                </h2>
                <p className="text-purple-700 flex items-center gap-2 mb-4">
                  <MapPinIcon className="w-5 h-5 text-pink-500" />
                  {booking?.listing?.location ?? "Unknown location"}
                </p>

                {/* Image Gallery */}
                {booking?.listing?.images?.length ? (
                  <div className="grid grid-cols-2 gap-4">
                    {booking.listing.images.slice(0, 4).map((img, idx) => (
                      <motion.div
                        key={idx}
                        className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md border border-gray-100"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                      >
                        <ImageWithLoader
                          src={img}
                          alt={`Listing image ${idx + 1}`}
                          containerClassName="w-full h-full"
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 p-8 border border-dashed border-purple-200 rounded-xl">
                    No images available
                  </div>
                )}
              </motion.div>

              {/* Review Section */}
              {isBookingCompleted && (
                <motion.div
                  className="mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <AnimatePresence mode="wait">
                    {hasReviewed && userReview ? (
                      <ReviewSubmittedCard
                        key="submitted"
                        review={userReview}
                      />
                    ) : (
                      <ReviewForm
                        key="form"
                        onReviewSubmitted={handleReviewSubmitted}
                        listingId={bookingDetails.listingId}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* RIGHT COLUMN: Summary and Actions (1/3 width on large screens) */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                className="p-6 rounded-2xl bg-white/70 border border-blue-200 shadow-lg space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h3 className="text-xl font-bold text-purple-900 border-b border-blue-200 pb-2">
                  Booking Summary
                </h3>

                {/* Status Badge */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600 font-medium">Status</span>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(
                      currentStatus
                    )} shadow-md`}
                  >
                    {currentStatus}
                  </span>
                </div>

                {/* Payment Status */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Payment</span>
                  <span
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full text-white ${
                      isPaid ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    <CreditCardIcon className="w-4 h-4" />
                    {isPaid ? "PAID" : "PENDING"}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Duration</span>
                  <span className="text-gray-800 font-semibold">
                    {numberOfNights} {numberOfNights === 1 ? "Night" : "Nights"}
                  </span>
                </div>

                {/* Total Price */}
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="text-lg font-bold text-purple-700">
                    Total Price
                  </span>
                  <span className="text-xl font-extrabold text-pink-600">
                    <span className="mr-1">UGX</span>
                    {formatNumber(bookingDetails.totalPrice)}
                  </span>
                </div>
              </motion.div>

              {/* Date Details and Edit Form */}
              <motion.div
                className="p-6 rounded-2xl bg-white/70 border border-pink-200 shadow-lg space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <h3 className="text-xl font-bold text-purple-900 border-b border-pink-200 pb-2">
                  Booking Dates
                </h3>

                <div className="space-y-4">
                  {/* Start Date */}
                  <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-600 flex items-center gap-2">
                      <CalendarDaysIcon className="w-5 h-5 text-purple-500" />{" "}
                      Start Date
                    </label>
                    {editMode && !isCurrentlyExtendable ? (
                      <input
                        type="date"
                        value={
                          startDate || bookingDetails.startDate.slice(0, 10)
                        }
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-purple-300 bg-white text-gray-800 px-3 py-2 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                        disabled={
                          !!isBookingCompleted || !!isCurrentlyExtendable
                        }
                      />
                    ) : (
                      <span className="text-lg text-gray-800 font-semibold">
                        {formattedStartDate}
                      </span>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-600 flex items-center gap-2">
                      <CalendarDaysIcon className="w-5 h-5 text-purple-500" />{" "}
                      End Date
                    </label>
                    {editMode ? (
                      <input
                        type="date"
                        value={endDate || bookingDetails.endDate.slice(0, 10)}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={
                          isCurrentlyExtendable
                            ? format(bookingEndDate, "yyyy-MM-dd")
                            : undefined
                        }
                        className="border border-purple-300 bg-white text-gray-800 px-3 py-2 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                        disabled={isBookingCompleted}
                      />
                    ) : (
                      <span className="text-lg text-gray-800 font-semibold">
                        {formattedEndDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-pink-200">
                  {isBookingCompleted ? (
                    <button
                      onClick={handleBookAgain}
                      className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                    >
                      Book Again
                    </button>
                  ) : showEditButton ? (
                    <AnimatePresence mode="wait">
                      {editMode ? (
                        <motion.div
                          key="edit-actions"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-4"
                        >
                          <button
                            onClick={handleUpdateDates}
                            disabled={isUpdating}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-500"
                          >
                            {isUpdating ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="flex-1 px-4 py-3 bg-gray-200 text-purple-700 font-semibold rounded-xl hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="edit-button"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          onClick={() => {
                            setEditMode(true);
                            if (!isCurrentlyExtendable) {
                              setStartDate(
                                bookingDetails.startDate.slice(0, 10)
                              );
                            }
                            setEndDate(bookingDetails.endDate.slice(0, 10));
                          }}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                        >
                          {isCurrentlyExtendable
                            ? "Extend Booking"
                            : "Edit Dates"}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  ) : null}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Status Timeline */}
          <motion.div
            className="mt-8 pt-8 border-t border-purple-200"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h3 className="text-xl font-bold text-purple-900 mb-6 text-center">
              Status Timeline
            </h3>
            <div className="flex items-start justify-between relative">
              {STATUS_ORDER.filter((s) => s !== "CANCELED").map(
                (status, idx) => {
                  const currentStatusIndex =
                    STATUS_ORDER.indexOf(currentStatus);
                  const isActive = currentStatusIndex >= idx;
                  const isConfirmed = status === "CONFIRMED";

                  // Map status to a primary color for the timeline circles/line
                  const primaryColor =
                    status === "PENDING"
                      ? "yellow-500"
                      : status === "CONFIRMED"
                      ? "green-500"
                      : "blue-500";

                  return (
                    <div
                      key={status}
                      className="flex flex-col items-center flex-1 z-10 min-w-0"
                    >
                      {/* Status Circle */}
                      <motion.div
                        className={`w-8 h-8 rounded-full border-4 transition-all duration-500 flex items-center justify-center ${
                          isActive
                            ? `bg-${primaryColor} border-${primaryColor}`
                            : "border-gray-300 bg-white"
                        }`}
                        whileHover={{ scale: 1.2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {isActive && (
                          <CheckBadgeIcon className="w-5 h-5 text-white" />
                        )}
                      </motion.div>

                      {/* Status Label */}
                      <span
                        className={`mt-2 text-sm font-medium transition-colors ${
                          isActive ? "text-purple-700" : "text-gray-500"
                        }`}
                      >
                        {status}
                      </span>

                      {/* Connecting Line + Paid Badge */}
                      {idx < STATUS_ORDER.length - 2 && (
                        <div className="absolute top-4 h-1 w-[26%] flex justify-center items-center">
                          <div
                            className={`h-1 w-full absolute transition-all duration-500 rounded-full ${
                              isActive && status !== "COMPLETED"
                                ? "bg-gradient-to-r from-purple-500 to-pink-500"
                                : "bg-gray-200"
                            }`}
                          />
                          {/* Paid Badge for Confirmed Status */}
                          {isConfirmed && isPaid && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", delay: 1 }}
                              className="relative z-20 flex flex-col items-center justify-center translate-y-[-1.5rem] translate-x-1/2"
                            >
                              <div className="flex items-center space-x-1 px-2 py-0.5 bg-green-500 rounded-lg shadow-xl shadow-green-500/30">
                                <span className="text-xs font-bold text-white uppercase leading-none">
                                  PAID
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
              {/* CANCELED Status (Displayed separately if applicable) */}
              {isBookingCanceled && (
                <div
                  key="CANCELED"
                  className="flex flex-col items-center flex-1 z-10 min-w-0"
                >
                  <motion.div
                    className={`w-8 h-8 rounded-full border-4 flex items-center justify-center ${getStatusClass(
                      "CANCELED"
                    )}`}
                    initial={{ scale: 0.5, rotate: 0 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.5 }}
                  >
                    <CheckBadgeIcon className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="mt-2 text-sm font-medium text-red-500">
                    CANCELED
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
