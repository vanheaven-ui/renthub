"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { getBookingById, updateBookingDates } from "@/lib/api";
import { Booking, BookingDetails, BookingStatus } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";
import Image from "next/image";
import { format, isPast, isSameDay } from "date-fns"; 
import toast from "react-hot-toast";
import { formatNumber } from "@/lib/formatNumbers";
import { CheckBadgeIcon } from "@heroicons/react/24/solid"; 
import { ReviewForm } from "@/components/ReviewForm";

const STATUS_ORDER: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELED",
];

const BookingDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const bookingId = params?.id as string;

  const [editMode, setEditMode] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [hasReviewed, setHasReviewed] = useState(false);

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery<Booking, Error>({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
  });

  console.log(booking)

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
        // Add payment status for use in logic
        paymentStatus: booking.paymentStatus,
      }
    : null;

  // ----------------------------------------------------------------------
  // LOGIC: Determine the effective status for the timeline display
  // ----------------------------------------------------------------------
  let effectiveStatus: BookingStatus = bookingDetails?.status as BookingStatus;
  const isPaid = bookingDetails?.paymentStatus === "PAID";

  if (bookingDetails && isPaid) {
    const bookingEndDate = new Date(bookingDetails.endDate);
    const today = new Date();

    // Check if the end date is today or a past date
    const isDueOrPast =
      isPast(bookingEndDate) || isSameDay(bookingEndDate, today);

    // If booking is CONFIRMED, PAID, and the end date is due/past, mark as COMPLETED
    if (effectiveStatus === "CONFIRMED" && isDueOrPast) {
      effectiveStatus = "COMPLETED";
    } else if (effectiveStatus === "PENDING" && isDueOrPast) {
      // Edge case: if booking was never CONFIRMED but is due/past AND paid, still mark as COMPLETED
      effectiveStatus = "COMPLETED";
    }
  }

  // The status used for the timeline logic and blur effect
  const currentStatus = effectiveStatus;
  const isBookingCompleted = currentStatus === "COMPLETED";
  // ----------------------------------------------------------------------

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
    onError: (err) => {
      toast.error(err.message || "Failed to update booking dates");
    },
  });

  if (isLoading) return <LoadingScreen message="Loading booking details..." />;
  if (error)
    return <p className="text-center text-red-600 mt-10">{error.message}</p>;
  if (!bookingDetails)
    return <p className="text-center mt-10">Booking not found</p>;

  const formattedStartDate = format(new Date(bookingDetails.startDate), "PPP");
  const formattedEndDate = format(new Date(bookingDetails.endDate), "PPP");

  const getStatusClass = (status: BookingStatus) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-500";
      case "COMPLETED":
        return "bg-blue-500";
      case "CANCELED":
        return "bg-red-500";
      default:
        return "bg-yellow-400";
    }
  };

  const handleUpdateDates = () => {
    if (!startDate || !endDate) return toast.error("Both dates are required.");
    if (new Date(endDate) < new Date(startDate))
      return toast.error("End date must be after start date.");
    updateDates({ bookingId, startDate, endDate });
  };

  // Custom class for the blur effect
  const completedBlurClass = isBookingCompleted
    ? "backdrop-blur-sm backdrop-grayscale-[0.5] transition-all duration-700"
    : "";

  // The Completed Stamp Component
  const CompletedStamp = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 transition-opacity duration-700">
      <div className="text-9xl font-extrabold text-blue-600 opacity-20 transform -rotate-12 select-none border-8 border-blue-600 rounded-2xl p-6 shadow-2xl tracking-widest bg-white/20 backdrop-blur-sm">
        COMPLETED
      </div>
    </div>
  );

  // Function to handle "Book Again"
  const handleBookAgain = () => {
    // Assuming you have access to the listingId and a route to the listing page
    const listingId = bookingDetails.listingId;
    // Navigate to the specific listing page for a new booking
    router.push(`/listings/${listingId}`);
    toast("Redirecting to listing to book again!", { icon: "🏡" });
  };

  return (
    <div
      className={`relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-6 overflow-hidden ${completedBlurClass}`}
    >
      {/* 🟣 Abstract Background Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl -top-40 -left-40 animate-statusChange"></div>
        <div className="absolute w-[500px] h-[500px] bg-pink-300/25 rounded-full blur-2xl top-1/3 -right-32 animate-unreadBounce"></div>
        <div className="absolute w-[300px] h-[300px] bg-blue-300/30 rounded-full blur-2xl bottom-0 left-1/4 animate-pulse"></div>
      </div>

      {/* Booking Content */}
      <div className="relative max-w-5xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 space-y-6 border border-white/40 animate-fadeIn">
        {/* ADDED: The Completed Stamp */}
        {isBookingCompleted && <CompletedStamp />}

        <button
          onClick={() => router.push("/booking/my-bookings")}
          className="text-blue-600 hover:text-blue-800 font-semibold mb-4 transition"
        >
          &larr; Back to Bookings
        </button>

        <h1 className="text-3xl font-bold text-purple-900 mb-6 text-center drop-shadow-sm">
          Booking Details
        </h1>

        {/* Listing Images */}
        {booking?.listing?.images?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {booking.listing.images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
              >
                <Image
                  src={img}
                  alt={`Listing image ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized // Use unoptimized for better performance outside of ImageWithLoader
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No images available</p>
        )}

        {/* Booking Info */}
        <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 shadow-inner">
          <h2 className="text-2xl font-semibold text-purple-800">
            {booking?.listing?.title ?? "Listing"}
          </h2>
          <p className="text-gray-600">
            {booking?.listing?.location ?? "Unknown location"}
          </p>
          <p className="text-gray-700 font-medium">
            Total Price:{" "}
            <span className="text-purple-700">
              <span className="mr-1">UGX</span>
              {formatNumber(bookingDetails.totalPrice)}
            </span>
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <label className="font-medium text-gray-700">Start Date:</label>
            {editMode ? (
              <input
                type="date"
                value={startDate || bookingDetails.startDate.slice(0, 10)}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-3 py-2 rounded-md"
                disabled={isBookingCompleted} // Disable input if completed
              />
            ) : (
              <span>{formattedStartDate}</span>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center mt-2">
            <label className="font-medium text-gray-700">End Date:</label>
            {editMode ? (
              <input
                type="date"
                value={endDate || bookingDetails.endDate.slice(0, 10)}
                onChange={(e) => setEndDate(e.target.value)}
                className="border px-3 py-2 rounded-md"
                disabled={isBookingCompleted} // Disable input if completed
              />
            ) : (
              <span>{formattedEndDate}</span>
            )}
          </div>

          {/* 🌟 MODIFIED BUTTON LOGIC */}
          {isBookingCompleted ? (
            <button
              onClick={handleBookAgain}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition font-semibold"
            >
              Book Again
            </button>
          ) : editMode ? (
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleUpdateDates}
                disabled={isUpdating}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditMode(true);
                setStartDate(bookingDetails.startDate.slice(0, 10));
                setEndDate(bookingDetails.endDate.slice(0, 10));
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Edit Dates
            </button>
          )}
          {/* 🌟 END MODIFIED BUTTON LOGIC */}
        </div>

        {/* --- Review Form Rendering (using imported component) --- */}
        {isBookingCompleted && !hasReviewed && (
          <ReviewForm
            setHasReviewed={setHasReviewed}
            listingId={bookingDetails.listingId}
          />
        )}
        {/* --- END Review Form Rendering --- */}

        {/* Status Timeline */}
        <div className="mt-8 flex items-center justify-between relative">
          {STATUS_ORDER.filter((s) => s !== "CANCELED").map((status, idx) => {
            // Filter out CANCELED for a linear flow
            // Use currentStatus for the active status check
            const currentStatusIndex = STATUS_ORDER.indexOf(currentStatus);
            const isActive = currentStatusIndex >= idx;

            return (
              <div key={status} className="flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full border-4 transition-all duration-500 ${
                    isActive
                      ? getStatusClass(status) + " animate-statusChange"
                      : "border-gray-300 bg-gray-100"
                  }`}
                />
                <span className="mt-2 text-sm font-medium">{status}</span>

                {/* Connection Line and Paid Indicator */}
                {/* Only render lines between PENDING <-> CONFIRMED and CONFIRMED <-> COMPLETED */}
                {idx < STATUS_ORDER.length - 2 && (
                  // Calculate the position for the connection line segment
                  <div
                    className={`absolute top-4 h-1 w-[24%] flex justify-center items-center ${
                      idx === 0 ? "left-[13%]" : "left-[38%]"
                    }`}
                  >
                    {/* Connection line - uses Tailwind conditional classes for gradient width */}
                    <div
                      className={`h-1 w-full absolute transition-all duration-500 ${
                        isActive && status !== "COMPLETED" // Only apply gradient if this step is active/confirmed
                          ? "bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"
                          : "bg-gray-300"
                      }`}
                    />

                    {/* Paid Indicator on the CONFIRMED -> COMPLETED connector */}
                    {status === "CONFIRMED" && isPaid && (
                      <div className="relative z-20 flex flex-col items-center justify-center translate-y-[-1.25rem] translate-x-[50%]">
                        {/* Enhanced text and styling for the PAID indicator */}
                        <div className="flex items-center space-x-1 px-2 py-0.5 bg-green-500 rounded-lg shadow-lg">
                          <CheckBadgeIcon className="w-5 h-5 text-white flex-shrink-0" />
                          <span className="text-xs font-bold text-white uppercase leading-none">
                            PAID
                          </span>
                        </div>

                        <div className="w-8 h-8 hidden">
                          {/* Hidden pulsing ring for a subtle effect if desired later, but currently simplified */}
                          <span className="absolute inset-0 inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                          <span className="absolute inset-0 inline-flex h-full w-full rounded-full bg-green-500 opacity-90" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* CANCELED Status is a separate endpoint, not part of linear flow */}
          {bookingDetails.status === "CANCELED" && (
            <div key="CANCELED" className="flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 rounded-full border-4 transition-all duration-500 ${
                  getStatusClass("CANCELED") + " animate-statusChange"
                }`}
              />
              <span className="mt-2 text-sm font-medium">CANCELED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
