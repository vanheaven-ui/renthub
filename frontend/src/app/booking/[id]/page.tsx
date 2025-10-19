"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { getBookingById, updateBookingDates } from "@/lib/api";
import { Booking, BookingDetails, BookingStatus } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";
import Image from "next/image";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { formatNumber } from "@/lib/formatNumbers";

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

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery<Booking, Error>({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
  });

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
      }
    : null;

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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-6 overflow-hidden">
      {/* 🟣 Abstract Background Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl -top-40 -left-40 animate-statusChange"></div>
        <div className="absolute w-[500px] h-[500px] bg-pink-300/25 rounded-full blur-2xl top-1/3 -right-32 animate-unreadBounce"></div>
        <div className="absolute w-[300px] h-[300px] bg-blue-300/30 rounded-full blur-2xl bottom-0 left-1/4 animate-pulse"></div>
      </div>

      {/* Booking Content */}
      <div className="relative max-w-5xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 space-y-6 border border-white/40 animate-fadeIn">
        <button
          onClick={() => router.back()}
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
              />
            ) : (
              <span>{formattedEndDate}</span>
            )}
          </div>

          {editMode ? (
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

        {/* Status Timeline */}
        <div className="mt-8 flex items-center justify-between relative">
          {STATUS_ORDER.map((status, idx) => {
            const isActive = STATUS_ORDER.indexOf(bookingDetails.status) >= idx;
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

                {idx < STATUS_ORDER.length - 1 && (
                  <div
                    className={`absolute top-4 h-1 ${
                      idx === 0
                        ? "left-[13%]"
                        : idx === 1
                        ? "left-[38%]"
                        : "left-[63%]"
                    } w-[24%] ${
                      isActive
                        ? "bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
