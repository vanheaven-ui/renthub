"use client";

import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChatBubbleBottomCenterTextIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "@/app/context/AuthProvider";
import { Booking, BookingStatus as BookingStatusEnum } from "@/types";
import ImageWithLoader from "./ImageWithLoader";
import { formatNumber } from "@/lib/formatNumbers";
import { useRouter } from "next/navigation";

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

  const listing = booking.listing;
  if (!listing) {
    return (
      <div className="p-6 bg-gray-100 rounded-3xl text-center text-gray-500">
        Listing unavailable
      </div>
    );
  }

  // --- Navigate to booking details page ---
  const handleCardClick = () => {
    router.push(`/booking/${booking.id}`);
  };

  return (
    <div
      className="relative p-6 bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-[1.03] transform cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Images stacked uniquely */}
        <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-lg border-2 border-white mb-4 flex items-center justify-center">
          {listing.images && listing.images.length > 0 ? (
            <div className="relative w-full h-full">
              {listing.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute top-0 left-0 w-full h-full transition-transform duration-500`}
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

        {/* Title & Status */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            {listing.title}
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              booking.status as BookingStatusEnum
            )}`}
          >
            {booking.status}
          </span>
        </div>

        {/* Booking Info */}
        <div className="text-sm text-gray-600 space-y-2 flex-grow">
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
              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
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
        </div>

        {/* Action Buttons */}
        <div
          className="mt-6 flex flex-col space-y-4"
          onClick={(e) => e.stopPropagation()} // Prevent navigating when clicking buttons
        >
          {showPaymentButton && (
            <button
              onClick={() => onCheckoutClick(booking.id)}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <span className="flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                Pay for Booking
              </span>
            </button>
          )}

          {showOwnerButtons && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() =>
                  onStatusChange(booking.id, "CONFIRMED" as BookingStatusEnum)
                }
                className="w-full px-4 py-3 text-sm font-semibold text-white bg-green-500 rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
              >
                Accept
              </button>
              <button
                onClick={() =>
                  onStatusChange(booking.id, "CANCELED" as BookingStatusEnum)
                }
                className="w-full px-4 py-3 text-sm font-semibold text-white bg-red-500 rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
              >
                Decline
              </button>
            </div>
          )}

          <button
            onClick={onChatClick}
            className="w-full px-4 py-3 text-sm font-semibold text-purple-700 bg-purple-100 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:bg-purple-200"
          >
            <span className="flex items-center justify-center relative">
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2" />
              Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
