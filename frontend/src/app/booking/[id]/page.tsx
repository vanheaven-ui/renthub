"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo, JSX } from "react";
import { format, differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  MapPinIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/24/solid";

import { getBookingById, updateBookingDates } from "@/lib/api";
import StarRating from "@/components/StarRating";
import LoadingScreen from "@/components/LoadingScreen";
import type { Booking, UpdateBookingDatesParams } from "@/types";
import { formatNumber } from "@/lib/formatNumbers";

// ----------------- UGX Badge -----------------
const UgxBadge = ({ className }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center rounded bg-purple-600 text-white px-1.5 py-0.5 text-[10px] font-bold leading-none ${className}`}
  >
    UGX
  </span>
);

// ----------------- Helper Functions -----------------
const STATUS_ORDER = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELED"] as const;

const StampVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -20 },
  visible: { opacity: 1, scale: 1, rotate: -10, transition: { duration: 0.4 } },
};

const CanceledStamp = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
    <motion.div
      variants={StampVariants}
      initial="hidden"
      animate={{ ...StampVariants.visible, rotate: 6, opacity: 0.9 }}
      className="text-center font-extrabold select-none shadow-2xl tracking-widest bg-red-100/80
                 text-5xl sm:text-7xl md:text-9xl text-red-700 border-4 sm:border-6 md:border-8 border-red-400/50
                 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 transform rotate-6"
    >
      CANCELED
    </motion.div>
  </div>
);

// ----------------- Subcomponents -----------------
const StatusTracker = ({
  currentStatus,
}: {
  currentStatus: Booking["status"];
}) => {
  const currentStatusIndex = STATUS_ORDER.indexOf(currentStatus);
  const isCanceled = currentStatus === "CANCELED";

  return (
    <div className="flex justify-between items-start py-6 gap-2 sm:gap-4">
      {STATUS_ORDER.filter((s) => s !== "CANCELED").map((status, index) => {
        const isActive = index <= currentStatusIndex;
        const isCurrent = index === currentStatusIndex;

        let colorClasses = isActive
          ? "bg-purple-600 text-white shadow-lg shadow-purple-400/50"
          : "bg-gray-200 text-gray-500 border border-gray-300";

        if (isCurrent && !isCanceled) {
          colorClasses =
            "bg-pink-500 text-white shadow-xl shadow-pink-400/50 ring-4 ring-pink-200";
        }

        return (
          <div
            key={status}
            className="flex flex-col items-center flex-1 min-w-0"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 10,
                delay: index * 0.1,
              }}
              className={`w-12 h-12 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${colorClasses}`}
            >
              {isCurrent && !isCanceled ? (
                <ArrowLongRightIcon className="w-6 h-6" />
              ) : (
                index + 1
              )}
            </motion.div>
            <span
              className={`text-xs sm:text-sm mt-2 font-semibold text-center whitespace-nowrap ${
                isActive ? "text-purple-700" : "text-gray-500"
              }`}
            >
              {status}
            </span>
            {index < STATUS_ORDER.length - 2 && (
              <div
                className={`w-full h-1 -mt-7 mx-auto ${
                  index < currentStatusIndex ? "bg-purple-400" : "bg-gray-300"
                } z-[-1]`}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DetailRow = ({
  icon,
  label,
  value,
  isEditing,
  dateValue,
  onDateChange,
  dateKey,
}: {
  icon: JSX.Element;
  label: string;
  value: string | JSX.Element;
  isEditing: boolean;
  dateValue?: string;
  onDateChange?: (key: "startDate" | "endDate", date: string) => void;
  dateKey?: "startDate" | "endDate";
}) => {
  const formattedDate = dateValue
    ? format(new Date(dateValue), "yyyy-MM-dd")
    : "";
  return (
    <div className="flex justify-between items-center border-b border-purple-100 pb-3">
      <div className="flex items-center gap-3 text-purple-800">
        {icon}
        <span className="font-bold text-lg">{label}</span>
      </div>
      {isEditing && dateKey && onDateChange ? (
        <input
          type="date"
          value={formattedDate}
          onChange={(e) => onDateChange(dateKey, e.target.value)}
          className="px-3 py-1 border-2 border-purple-500 rounded-xl focus:ring-4 focus:ring-pink-300 transition w-auto font-medium text-gray-900 shadow-md"
        />
      ) : (
        <span className="text-gray-900 font-semibold text-lg">{value}</span>
      )}
    </div>
  );
};

const BackToListingButton = () => (
  <Link href={"#listings"} passHref>
    <motion.div
      className="cursor-pointer inline-block"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
      whileHover={{
        scale: 1.03,
        boxShadow: "0 5px 15px rgba(168, 85, 247, 0.4)",
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-1.5 p-3 px-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold text-base shadow-lg hover:shadow-xl transition">
        <ArrowLongLeftIcon className="w-6 h-6" />
        <span>View Listing Details</span>
      </div>
    </motion.div>
  </Link>
);

// ----------------- Main Page Component -----------------
const BookingDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [newDates, setNewDates] = useState({ startDate: "", endDate: "" });

  const bookingQuery = useQuery<Booking>({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(id),
    enabled: !!id,
  });

  const booking = bookingQuery.data;

  const updateMutation = useMutation({
    mutationFn: (params: UpdateBookingDatesParams) =>
      updateBookingDates(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      setEditMode(false);
    },
    onError: (error) => {
      console.error("Failed to update booking dates:", error);
      alert("Failed to update booking dates. Please try again.");
    },
  });

  useEffect(() => {
    if (booking) {
      setNewDates({ startDate: booking.startDate, endDate: booking.endDate });
    }
  }, [booking]);

  const { avgRating, totalDays } = useMemo(() => {
    if (!booking) return { avgRating: 0, totalDays: 0 };
    const reviews = booking.listing?.reviews ?? [];
    const avg = reviews.length
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : 0;
    const start = new Date(
      editMode && newDates.startDate ? newDates.startDate : booking.startDate
    );
    const end = new Date(
      editMode && newDates.endDate ? newDates.endDate : booking.endDate
    );
    const nights = differenceInDays(end, start);
    return { avgRating: avg, totalDays: nights > 0 ? nights : 0 };
  }, [booking, editMode, newDates]);

  const estimatedNewPrice = useMemo(() => {
    if (!booking) return 0;
    const originalNights = Math.max(
      differenceInDays(new Date(booking.endDate), new Date(booking.startDate)),
      1
    );
    const pricePerNight = booking.totalPrice / originalNights;
    const newPrice = pricePerNight * totalDays;
    return editMode && totalDays > 0
      ? Math.round(newPrice)
      : Math.round(booking.totalPrice);
  }, [booking, totalDays, editMode]);

  const handleDateChange = (key: "startDate" | "endDate", date: string) =>
    setNewDates((prev) => ({ ...prev, [key]: date }));

  const handleSave = () => {
    if (!newDates.startDate || !newDates.endDate)
      return alert("Please select both check-in and check-out dates.");
    if (new Date(newDates.startDate) >= new Date(newDates.endDate))
      return alert("Check-in must be before Check-out.");
    updateMutation.mutate({
      bookingId: id,
      startDate: newDates.startDate,
      endDate: newDates.endDate,
      currentBooking: booking!,
    });
  };
  const handleBookAgain = () =>
    booking?.listing?.id &&
    router.push(`/booking/create?listingId=${booking.listing.id}`);
  const handleCancel = () => router.push("/booking/myBookings");

  if (bookingQuery.isLoading || updateMutation.isPending)
    return (
      <LoadingScreen
        message={
          updateMutation.isPending
            ? "Updating booking dates..."
            : "Loading booking details..."
        }
      />
    );

  if (bookingQuery.isError || !booking)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-600 p-8 bg-gray-50">
        <h1 className="text-4xl font-extrabold text-red-600">
          Booking Not Found 😢
        </h1>
        <p className="text-xl mt-4">
          We couldn&apos;t load the details for this booking.
        </p>
        <button
          onClick={() => router.push("/booking/my-bookings")}
          className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-extrabold text-lg shadow-xl hover:shadow-2xl transition transform hover:scale-105"
        >
          Back to My Bookings
        </button>
      </div>
    );

  const images = booking.listing?.images ?? [];
  const isCancellable =
    booking.status !== "CANCELED" && booking.status !== "COMPLETED";
  const isCompleted = booking.status === "COMPLETED";
  const isPaymentPending = booking.paymentStatus === "PENDING";
  const paymentRoute = `/booking/${id}/checkout`;

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 py-10 overflow-hidden">
      {/* Animated Background Shapes */}
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

      {/* Back to My Bookings */}
      <Link href="/booking/my-bookings" passHref>
        <motion.div
          className="fixed top-20 left-4 md:left-10 z-30 cursor-pointer p-2 rounded-full shadow-2xl bg-white/70 backdrop-blur-sm"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 10px 30px rgba(168, 85, 247, 0.5)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-1.5 p-2 pr-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold text-sm">
            <ArrowLongLeftIcon className="w-6 h-6" />
            <span className="hidden sm:inline">Back to My Bookings</span>
          </div>
        </motion.div>
      </Link>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <header className="mb-8 p-6 bg-white/50 backdrop-blur-md shadow-xl rounded-3xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 text-center mb-6 leading-tight">
            Your Booking Summary
            <span className="block text-xl font-medium text-purple-600 mt-1">
              Ref: #{id.substring(0, 8)}
            </span>
          </h1>
          <StatusTracker currentStatus={booking.status} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
              className="bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden relative border border-purple-200"
            >
              {/* Image Grid */}
              <div className="grid grid-cols-2 grid-rows-2 gap-1 h-96 relative">
                {images.slice(0, 4).map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative overflow-hidden ${
                      idx === 0 ? "row-span-2" : ""
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${booking.listing?.title} image ${idx + 1}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className={`object-cover w-full h-full transition-transform duration-500 hover:scale-110 ${
                        idx === 0 ? "brightness-95" : "brightness-85"
                      }`}
                    />
                    {idx === 0 && (
                      <div className="absolute inset-0 bg-black/10 flex flex-col justify-end p-6">
                        <h2 className="text-3xl font-extrabold text-white drop-shadow-2xl leading-snug">
                          {booking.listing?.title}
                        </h2>
                        <div className="flex items-center text-white mt-1">
                          <MapPinIcon className="w-5 h-5 mr-1 text-pink-300" />
                          <span className="font-medium text-lg drop-shadow-lg">
                            {booking.listing?.location}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {booking.status === "CANCELED" && <CanceledStamp />}
              </div>

              {/* Listing Details */}
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 mb-4 border-purple-100">
                  <div className="mb-4 sm:mb-0">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Property Details
                    </h3>
                  </div>
                  <div className="flex items-center">
                    <StarRating rating={avgRating} />
                    <span className="ml-3 text-gray-700 font-medium text-sm">
                      <span className="font-bold text-purple-700">
                        {avgRating.toFixed(1)}/5
                      </span>{" "}
                      ({booking.listing?.reviews?.length || 0} reviews)
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-xl font-semibold text-purple-800 mb-3">
                    Your Stay Overview
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    This reservation is for{" "}
                    <b className="text-pink-600">
                      {totalDays} night{totalDays !== 1 ? "s" : ""}
                    </b>
                    , and we hope you enjoy your experience at this stunning{" "}
                    {booking.listing?.location || "property"}.
                  </p>
                </div>

                {/* Details Rows */}
                <div className="mt-8 border-t pt-4 space-y-4">
                  <DetailRow
                    icon={
                      <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
                    }
                    label="Check-in Date"
                    value={format(
                      new Date(
                        editMode ? newDates.startDate : booking.startDate
                      ),
                      "PPP"
                    )}
                    isEditing={editMode}
                    dateValue={newDates.startDate}
                    onDateChange={handleDateChange}
                    dateKey="startDate"
                  />
                  <DetailRow
                    icon={
                      <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
                    }
                    label="Check-out Date"
                    value={format(
                      new Date(editMode ? newDates.endDate : booking.endDate),
                      "PPP"
                    )}
                    isEditing={editMode}
                    dateValue={newDates.endDate}
                    onDateChange={handleDateChange}
                    dateKey="endDate"
                  />
                  <DetailRow
                    icon={
                      <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
                    }
                    label="Total Price"
                    value={
                      <span className="flex items-center gap-1">
                        <UgxBadge />
                        {formatNumber(Number(estimatedNewPrice))}
                      </span>
                    }
                    isEditing={false}
                  />
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {editMode ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-700 transition"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="border border-purple-500 text-purple-600 px-6 py-2 rounded-xl font-bold hover:bg-purple-50 transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {isCancellable && (
                        <button
                          onClick={() => setEditMode(true)}
                          className="bg-pink-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-pink-600 transition"
                        >
                          Edit Dates
                        </button>
                      )}
                      {isCancellable && (
                        <button
                          onClick={handleCancel}
                          className="border border-red-500 text-red-600 px-6 py-2 rounded-xl font-bold hover:bg-red-50 transition"
                        >
                          Cancel Booking
                        </button>
                      )}
                      {!isCompleted && isPaymentPending && (
                        <Link href={paymentRoute}>
                          <button className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-700 transition">
                            Pay Now
                          </button>
                        </Link>
                      )}
                      {isCompleted && (
                        <button
                          onClick={handleBookAgain}
                          className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition"
                        >
                          Book Again
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <BackToListingButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
