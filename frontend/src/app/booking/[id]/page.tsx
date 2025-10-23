"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { getBookingById, updateBookingDates } from "@/lib/api";
import { Booking, BookingDetails, BookingStatus, Review } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";
import Image from "next/image";
import { format, isPast, isSameDay } from "date-fns";
import toast from "react-hot-toast";
import { formatNumber } from "@/lib/formatNumbers";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewSubmittedCard } from "@/components/ReviewSubmittedCard";

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
    if (booking && booking.renterId) {
      const reviews = booking.listing?.reviews || [];
      const review =
        reviews.find((r) => r.authorId === booking.renterId) || null;
      setUserReview(review);
      setHasReviewed(!!review);
    }
  }, [booking]);

  // const renterId = booking?.renterId;
  // const reviews = booking?.listing?.reviews || [];
  // const userReview = reviews.find((r) => r.authorId === renterId);
  // const [hasReviewed, setHasReviewed] = useState(!!userReview);

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

  let effectiveStatus: BookingStatus = bookingDetails?.status as BookingStatus;
  const isPaid = bookingDetails?.paymentStatus === "PAID";

  if (bookingDetails && isPaid) {
    const bookingEndDate = new Date(bookingDetails.endDate);
    const today = new Date();
    const isDueOrPast =
      isPast(bookingEndDate) || isSameDay(bookingEndDate, today);

    if (effectiveStatus === "CONFIRMED" && isDueOrPast) {
      effectiveStatus = "COMPLETED";
    } else if (effectiveStatus === "PENDING" && isDueOrPast) {
      effectiveStatus = "COMPLETED";
    }
  }

  const currentStatus = effectiveStatus;
  const isBookingCompleted = currentStatus === "COMPLETED";

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

  const completedBlurClass = isBookingCompleted
    ? "backdrop-blur-sm backdrop-grayscale-[0.5] transition-all duration-700"
    : "";

  const CompletedStamp = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 transition-opacity duration-700">
      <div className="text-9xl font-extrabold text-blue-600 opacity-20 transform -rotate-12 select-none border-8 border-blue-600 rounded-2xl p-6 shadow-2xl tracking-widest bg-white/20 backdrop-blur-sm">
        COMPLETED
      </div>
    </div>
  );

  const handleBookAgain = () => {
    const listingId = bookingDetails.listingId;
    router.push(`/listings/${listingId}`);
    toast("Redirecting to listing to book again!", { icon: "🏡" });
  };

  return (
    <div
      className={`relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-6 overflow-hidden ${completedBlurClass}`}
    >
      {/* Background Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl -top-40 -left-40 animate-statusChange"></div>
        <div className="absolute w-[500px] h-[500px] bg-pink-300/25 rounded-full blur-2xl top-1/3 -right-32 animate-unreadBounce"></div>
        <div className="absolute w-[300px] h-[300px] bg-blue-300/30 rounded-full blur-2xl bottom-0 left-1/4 animate-pulse"></div>
      </div>

      <div className="relative max-w-5xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 space-y-6 border border-white/40 animate-fadeIn">
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
                  unoptimized
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
                disabled={isBookingCompleted}
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
                disabled={isBookingCompleted}
              />
            ) : (
              <span>{formattedEndDate}</span>
            )}
          </div>

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
        </div>

        {/* --- Review Section --- */}
        {isBookingCompleted && (
          <div className="mt-8">
            {hasReviewed && userReview ? (
              <ReviewSubmittedCard review={userReview} />
            ) : (
              <ReviewForm
                setHasReviewed={setHasReviewed}
                listingId={bookingDetails.listingId}
              />
            )}
          </div>
        )}

        {/* Status Timeline */}
        <div className="mt-8 flex items-center justify-between relative">
          {STATUS_ORDER.filter((s) => s !== "CANCELED").map((status, idx) => {
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

                {idx < STATUS_ORDER.length - 2 && (
                  <div
                    className={`absolute top-4 h-1 w-[24%] flex justify-center items-center ${
                      idx === 0 ? "left-[13%]" : "left-[38%]"
                    }`}
                  >
                    <div
                      className={`h-1 w-full absolute transition-all duration-500 ${
                        isActive && status !== "COMPLETED"
                          ? "bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"
                          : "bg-gray-300"
                      }`}
                    />

                    {status === "CONFIRMED" && isPaid && (
                      <div className="relative z-20 flex flex-col items-center justify-center translate-y-[-1.25rem] translate-x-[50%]">
                        <div className="flex items-center space-x-1 px-2 py-0.5 bg-green-500 rounded-lg shadow-lg">
                          <CheckBadgeIcon className="w-5 h-5 text-white flex-shrink-0" />
                          <span className="text-xs font-bold text-white uppercase leading-none">
                            PAID
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

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
