"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyBookings, getUnreadMessagesBatch } from "@/lib/api";
import { Booking } from "@/types";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthProvider";
import Link from "next/link";
import BookingCard from "@/components/BookingCard";
import BookingChat from "@/components/BookingChat";
import socket from "@/lib/socket";

// Define a type for the unread messages returned from API
interface UnreadCount {
  bookingId: string;
  unreadCount: number;
}

const MyBookingsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  // Fetch bookings
  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery<Booking[]>({
    queryKey: ["myBookings", user?.id ?? ""],
    queryFn: getMyBookings,
    enabled: !!user,
  });

  // Prepare booking IDs safely
  const bookingIds: string[] = bookings?.map((b) => b.id) ?? [];

  // Fetch unread messages in batch
  const { data: unreadCounts } = useQuery<UnreadCount[]>({
    queryKey: ["unreadMessagesBatch", bookingIds],
    queryFn: () => getUnreadMessagesBatch(bookingIds),
    enabled: bookingIds.length > 0,
  });

  // Map bookingId -> unreadCount
  const unreadMap: Record<string, number> = (unreadCounts ?? []).reduce(
    (acc: Record<string, number>, item: UnreadCount) => {
      acc[item.bookingId] = item.unreadCount;
      return acc;
    },
    {} as Record<string, number>
  );

  useEffect(() => {
    if (!user || !bookings) return;

    // Join all booking rooms for real-time updates
    const bookingIds = bookings.map((b) => b.id);
    bookingIds.forEach((id) => socket.emit("joinBookingRoom", id));

    const handleUnreadUpdate = ({
      bookingId,
      count,
    }: {
      bookingId: string;
      count: number;
    }) => {
      queryClient.setQueryData(
        ["unreadMessagesBatch", bookingIds],
        (oldData: UnreadCount[] | undefined) => {
          if (!oldData) return [{ bookingId, unreadCount: count }];
          return oldData.map((item) =>
            item.bookingId === bookingId
              ? { ...item, unreadCount: count }
              : item
          );
        }
      );
    };

    socket.on("updateUnreadCount", handleUnreadUpdate);

    return () => {
      socket.off("updateUnreadCount", handleUnreadUpdate);
    };
  }, [bookings, queryClient, user]);

  const openChat = (bookingId: string) => setActiveBookingId(bookingId);

  const handleCloseChat = () => {
    // Manually set the unread count for the active booking to zero in the cache
    queryClient.setQueryData<UnreadCount[]>(
      ["unreadMessagesBatch", bookingIds],
      (oldData) => {
        if (!oldData) return [];
        return oldData.map((item) =>
          item.bookingId === activeBookingId
            ? { ...item, unreadCount: 0 }
            : item
        );
      }
    );

    setActiveBookingId(null);
  };

  const shapeClass1 =
    "absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none";
  const shapeClass2 =
    "absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none";

  if (!user) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className={shapeClass1}></div>
        <div className={shapeClass2}></div>
        <div className="text-center p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl z-10">
          <p className="text-xl text-purple-700 font-semibold mb-4">
            Please log in to see your bookings.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-3 bg-purple-600 text-white rounded-full font-semibold shadow-lg hover:bg-purple-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className={shapeClass1}></div>
        <div className={shapeClass2}></div>
        <p className="text-gray-700 text-lg font-semibold z-10">
          Loading your bookings...
        </p>
      </div>
    );

  if (error || !bookings || bookings.length === 0)
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className={shapeClass1}></div>
        <div className={shapeClass2}></div>
        <div className="text-center p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl z-10">
          <p className="text-gray-700 text-xl font-semibold mb-4">
            No bookings found.
          </p>
          <Link
            href="/"
            className="px-8 py-3 bg-purple-600 text-white rounded-full font-semibold shadow-lg hover:bg-purple-700 transition"
          >
            Explore Listings
          </Link>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6 overflow-hidden">
      <div className={shapeClass1}></div>
      <div className={shapeClass2}></div>

      <div className="container mx-auto relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-purple-900 text-center drop-shadow-md">
          My Bookings 🗓️
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {bookings.map((booking) => {
            const unread = unreadMap[booking.id] ?? 0;

            return (
              <div key={booking.id} className="relative">
                <BookingCard
                  booking={booking}
                  onChatClick={() => openChat(booking.id)}
                  unreadCount={unread}
                />
              </div>
            );
          })}
        </div>
      </div>

      {activeBookingId && (
        <BookingChat
          bookingId={activeBookingId}
          onClose={handleCloseChat}
          bookingDetails={
            bookings.find((b) => b.id === activeBookingId) ?? null
          }
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
