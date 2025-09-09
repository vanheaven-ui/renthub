"use client";

import Link from "next/link";
import { Booking, BookingStatus } from "@/types";
import { useAuth } from "@/app/context/AuthProvider";
import {
  CalendarDaysIcon,
  HomeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

interface BookingCardProps {
  booking: Booking;
  onChatClick: (bookingId: string) => void;
  unreadCount: number;
  onStatusChange?: (bookingId: string, status: BookingStatus) => void;
}

const BookingCard = ({
  booking,
  onChatClick,
  unreadCount,
  onStatusChange,
}: BookingCardProps) => {
  const { user } = useAuth();
  const [statusAnimation, setStatusAnimation] = useState(false);
  const [prevStatus, setPrevStatus] = useState(booking.status);

  if (!user) return null;

  const isOwner = user.id === booking.ownerId;
  const chatWithLabel = isOwner
    ? booking.renter?.name ?? "Renter"
    : booking.listing?.owner?.name ?? "Owner";

  // Trigger animation when status changes
  useEffect(() => {
    if (prevStatus !== booking.status) {
      setStatusAnimation(true);
      const timer = setTimeout(() => setStatusAnimation(false), 1500);
      setPrevStatus(booking.status);
      return () => clearTimeout(timer);
    }
  }, [booking.status, prevStatus]);

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden transition-transform hover:scale-105 hover:shadow-2xl">
      {/* Image Section */}
      <div className="relative h-56">
        <img
          src={
            booking.listing?.images?.[0] ||
            "https://images.unsplash.com/photo-1560518883-ce0927974c43?auto=format&fit=crop&w=1974&q=80"
          }
          alt={booking.listing?.title || "Listing Image"}
          className="w-full h-full object-cover rounded-t-3xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        <div className="absolute bottom-4 left-4">
          <span className="text-sm px-3 py-1 bg-purple-600 text-white rounded-full font-semibold shadow-md">
            {isOwner ? "Owner View" : "Renter View"}
          </span>
        </div>
      </div>

      {/* Booking Details */}
      <div className="p-5">
        <div className="flex items-center gap-2 text-gray-700 mb-1">
          <HomeIcon className="w-5 h-5 text-purple-600" />
          <Link
            href={`/listing/${booking.listingId}`}
            className="text-xl font-bold text-purple-900 hover:text-purple-700 transition"
          >
            {booking.listing?.title ?? "Unknown Listing"}
          </Link>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          {booking.listing?.location ?? "Unknown Location"}
        </p>

        <div className="border-t border-purple-200 pt-4 mt-4">
          <div className="flex items-center gap-2 text-gray-800 mb-2">
            <CalendarDaysIcon className="w-5 h-5 text-pink-600" />
            <span className="font-semibold">Check-in:</span>{" "}
            {new Date(booking.startDate).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div className="flex items-center gap-2 text-gray-800 mb-2">
            <CalendarDaysIcon className="w-5 h-5 text-pink-600" />
            <span className="font-semibold">Check-out:</span>{" "}
            {new Date(booking.endDate).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div className="flex items-center gap-2 text-gray-800 font-bold text-lg mt-3">
            <UserIcon className="w-5 h-5 text-blue-600" />
            <span className="text-gray-900">Total:</span>{" "}
            <span className="text-purple-700">
              ${booking.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-purple-200 space-y-3">
          {/* Owner-specific actions */}
          {isOwner && (
            <>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    statusAnimation ? "animate-statusChange" : ""
                  }`}
                >
                  Status:{" "}
                  <span
                    className={`font-bold ${
                      booking.status === BookingStatus.CONFIRMED
                        ? "text-green-600"
                        : booking.status === BookingStatus.CANCELED
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {booking.status}
                  </span>
                </span>
              </div>

              {booking.status === BookingStatus.PENDING && (
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      onStatusChange?.(booking.id, BookingStatus.CONFIRMED)
                    }
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-full font-semibold shadow-md hover:bg-green-700 transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() =>
                      onStatusChange?.(booking.id, BookingStatus.CANCELED)
                    }
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full font-semibold shadow-md hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </>
          )}

          {/* Chat Button (shared) */}
          <button
            onClick={() => onChatClick(booking.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full font-semibold shadow-md hover:bg-indigo-700 transition"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Chat with {chatWithLabel}
            {unreadCount > 0 && (
              <span className="bg-orange-500 w-5 h-5 text-xs flex items-center justify-center rounded-full animate-unreadBounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
