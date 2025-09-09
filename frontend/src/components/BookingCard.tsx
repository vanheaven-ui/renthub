import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChatBubbleBottomCenterTextIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthProvider";
import { Booking, BookingStatus as BookingStatusEnum } from "@/types";

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
  
  // --- Role & Permissions ---
  const isRenter = user?.id === booking.renterId;
  const isOwner = user?.id === booking.ownerId;
  const showPaymentButton = isRenter && booking.paymentStatus === "PENDING";
  const showOwnerButtons = isOwner && booking.status === "PENDING";

  // --- Helpers ---
  // FIX: The formatDate function now accepts a string, resolving the type error.
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

  return (
    <div className="relative p-6 bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-[1.03] transform">
      {/* --- Background Hover Gradient --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* --- Card Content --- */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Listing Image */}
        <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-lg border-2 border-white mb-4">
          <Image
            src={
              booking.listing?.images[0] ||
              "https://via.placeholder.com/800"
            }
            alt={booking.listing?.title ?? "Listing image"}
            fill
            className="object-cover"
          />
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            {booking.listing?.title}
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              booking.status as BookingStatusEnum
            )}`}
          >
            {booking.status}
          </span>
        </div>

        {/* Details */}
        <div className="text-sm text-gray-600 space-y-2 flex-grow">
          <div className="flex items-center">
            <UserCircleIcon className="w-5 h-5 text-gray-500 mr-2" />
            <span>
              {isRenter
                ? // FIX: Use optional chaining for owner name
                  `Owner: ${booking.owner?.name}`
                : // FIX: Use optional chaining for renter name
                  `Renter: ${booking.renter?.name}`}
            </span>
          </div>
          <div className="flex items-center">
            <CalendarDaysIcon className="w-5 h-5 text-gray-500 mr-2" />
            <span>
              {/* FIX: Now pass the string directly, which the helper function expects */}
              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
            </span>
          </div>
          <div className="flex items-center font-bold text-gray-800">
            <CurrencyDollarIcon className="w-5 h-5 text-green-600 mr-2" />
            <span>Total: ${booking.totalPrice}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col space-y-4">
          {/* Checkout (Renter) */}
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

          {/* Owner Actions */}
          {showOwnerButtons && (
            <div className="grid grid-cols-2 gap-4">
              <button
                // FIX: Explicitly cast the string to the enum type
                onClick={() =>
                  onStatusChange(booking.id, "CONFIRMED" as BookingStatusEnum)
                }
                className="w-full px-4 py-3 text-sm font-semibold text-white bg-green-500 rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
              >
                Accept
              </button>
              <button
                // FIX: Explicitly cast the string to the enum type
                onClick={() =>
                  onStatusChange(booking.id, "CANCELED" as BookingStatusEnum)
                }
                className="w-full px-4 py-3 text-sm font-semibold text-white bg-red-500 rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
              >
                Decline
              </button>
            </div>
          )}

          {/* Chat */}
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
