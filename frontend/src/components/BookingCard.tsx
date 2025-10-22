"use client";

import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChatBubbleBottomCenterTextIcon,
  UserCircleIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "@/app/context/AuthProvider";
import { Booking, BookingStatus as BookingStatusEnum } from "@/types";
import ImageWithLoader from "./ImageWithLoader";
import { formatNumber } from "@/lib/formatNumbers";
import { useRouter } from "next/navigation";
import { isPast, isSameDay } from "date-fns";

interface BookingCardProps {
  booking: Booking;
  unreadCount: number;
  onChatClick: () => void;
  onStatusChange: (bookingId: string, status: BookingStatusEnum) => void;
  onCheckoutClick: (bookingId: string) => void;
}

const BookingCard = ({
  booking,
  unreadCount,
  onChatClick,
  onStatusChange,
  onCheckoutClick,
}: BookingCardProps) => {
  const { user } = useAuth();
  const router = useRouter();

  const isRenter = user?.id === booking.renterId;
  const isOwner = user?.id === booking.ownerId;
  const showPaymentButton = isRenter && booking.paymentStatus === "PENDING";
  const showOwnerButtons = isOwner && booking.status === "PENDING";
  const isPaymentComplete = booking.paymentStatus === "PAID";

  let displayedStatus: BookingStatusEnum;
  const bookingEndDate = new Date(booking.endDate);
  const today = new Date();
  const isDueOrPast =
    isPast(bookingEndDate) || isSameDay(bookingEndDate, today);

  if (isPaymentComplete && isDueOrPast) {
    displayedStatus = "COMPLETED";
  } else {
    displayedStatus = booking.status as BookingStatusEnum;
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getStatusColor = (status: BookingStatusEnum) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CANCELED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDynamicStatusClasses = (status: BookingStatusEnum) => {
    if (displayedStatus === "COMPLETED") {
      return "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md ring-2 ring-blue-300";
    }
    if (displayedStatus === "CANCELED") {
      return "bg-gradient-to-r from-red-400 to-red-600 text-white shadow-md ring-2 ring-red-300";
    }
    return getStatusColor(status);
  };

  const listing = booking.listing;
  if (!listing) {
    return (
      <div className="p-6 bg-gray-100 rounded-3xl text-center text-gray-500 min-h-[580px] flex items-center justify-center">
        Listing unavailable
      </div>
    );
  }

  const handleCardClick = () => {
    if (displayedStatus !== "CANCELED") {
      router.push(`/booking/${booking.id}`);
    }
  };

  const isDisabled = displayedStatus === "CANCELED";

  return (
    <div
      className={`relative p-6 bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-[1.03] transform cursor-pointer flex flex-col ${
        isDisabled ? "opacity-50 pointer-events-none" : ""
      }`}
      onClick={handleCardClick}
      style={{
        minHeight: "580px", // ✅ consistent card height
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Completed or Canceled Overlay */}
      {(displayedStatus === "COMPLETED" || displayedStatus === "CANCELED") && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div
            className={`text-5xl font-extrabold opacity-25 transform -rotate-12 select-none border-4 rounded-2xl p-6 shadow-xl bg-white/20 backdrop-blur-sm ${
              displayedStatus === "COMPLETED"
                ? "text-blue-600 border-blue-600"
                : "text-red-600 border-red-600"
            }`}
          >
            {displayedStatus}
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Top Section: Image */}
        <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-lg border-2 border-white mb-4 flex-shrink-0">
          {listing.images && listing.images.length > 0 ? (
            <div className="relative w-full h-full">
              {listing.images.map((img, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 left-0 w-full h-full transition-transform duration-500"
                  style={{
                    transform: `rotate(${
                      (idx - listing.images.length / 2) * 3
                    }deg) translate(${
                      (idx - listing.images.length / 2) * 4
                    }px, ${(idx - listing.images.length / 2) * 4}px)`,
                    zIndex: listing.images.length - idx,
                  }}
                >
                  <ImageWithLoader
                    src={img}
                    alt={listing.title ?? "Listing image"}
                    fill
                    className="object-cover rounded-2xl shadow-xl"
                    containerClassName="w-full h-full"
                    loaderType="spinner"
                  />
                </div>
              ))}
            </div>
          ) : (
            <ImageWithLoader
              src=""
              alt="Listing fallback image"
              fill
              className="object-cover rounded-2xl shadow-xl"
              containerClassName="w-full h-full"
            />
          )}
        </div>

        {/* Middle Section: Info */}
        <div className="flex flex-col justify-between flex-grow">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">
                {listing.title}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getDynamicStatusClasses(
                  booking.status as BookingStatusEnum
                )}`}
              >
                {displayedStatus}
              </span>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center">
                <UserCircleIcon className="w-5 h-5 text-gray-500 mr-2" />
                <span>
                  {isRenter
                    ? `Owner: ${booking.owner?.name}`
                    : `Renter: ${booking.renter?.name}`}
                </span>
              </div>

              <div className="flex items-center">
                <CalendarDaysIcon className="w-5 h-5 text-gray-500 mr-2" />
                <span>
                  {formatDate(booking.startDate)} -{" "}
                  {formatDate(booking.endDate)}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 p-3 bg-purple-50 rounded-xl shadow-inner border border-purple-100">
                <span className="text-gray-700 font-semibold text-sm">
                  Total Amount
                </span>
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <span className="text-xs font-semibold">UGX</span>
                  <span>{formatNumber(booking.totalPrice)}</span>
                </span>
              </div>

              {isPaymentComplete && (
                <div className="flex items-center p-3 bg-green-50 rounded-xl shadow-sm border border-green-200 mt-2">
                  <CheckBadgeIcon className="w-6 h-6 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-sm font-semibold text-green-700">
                    Payment Status:{" "}
                    <strong className="text-green-800">PAID</strong> 🎉
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Buttons */}
        <div
          className="mt-6 flex flex-col space-y-4 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {!isDisabled && showPaymentButton && (
            <button
              onClick={() => onCheckoutClick(booking.id)}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
            >
              <CurrencyDollarIcon className="w-5 h-5 mr-2 inline-block" />
              Pay for Booking
            </button>
          )}

          {!isDisabled && displayedStatus === "COMPLETED" && (
            <button
              onClick={() => router.push(`/booking/${booking.id}`)}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
            >
              <CheckBadgeIcon className="w-5 h-5 mr-2 inline-block" />
              View Booking Details
            </button>
          )}

          {!isDisabled &&
            isPaymentComplete &&
            displayedStatus !== "COMPLETED" && (
              <button
                onClick={() => router.push(`/booking/${booking.id}`)}
                className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              >
                <CheckBadgeIcon className="w-5 h-5 mr-2 inline-block" />
                View Confirmed Booking
              </button>
            )}

          {!isDisabled && showOwnerButtons && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onStatusChange(booking.id, "CONFIRMED")}
                className="w-full px-4 py-3 text-sm font-semibold text-white bg-green-500 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              >
                Accept
              </button>
              <button
                onClick={() => onStatusChange(booking.id, "CANCELED")}
                className="w-full px-4 py-3 text-sm font-semibold text-white bg-red-500 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              >
                Decline
              </button>
            </div>
          )}

          {!isDisabled && (
            <button
              onClick={onChatClick}
              className="w-full px-4 py-3 text-sm font-semibold text-purple-700 bg-purple-100 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300 relative"
            >
              <div className="flex items-center justify-center">
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2" />
                Chat
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
