"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyBookings,
  getUnreadMessagesBatch,
  updateBookingStatus,
} from "@/lib/api";
import { Booking, BookingDetails, BookingStatus } from "@/types";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthProvider";
import BookingCard from "@/components/BookingCard";
import BookingChat from "@/components/BookingChat";
import socket from "@/lib/socket";

interface UnreadCount {
  bookingId: string;
  unreadCount: number;
}

const MyBookingsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  // --- Fetch bookings ---
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["myBookings", user?.id ?? ""],
    queryFn: getMyBookings,
    enabled: !!user,
  });
  

  const bookingIds = bookings?.map((b) => b.id) ?? [];

  // --- Fetch unread messages ---
  const { data: unreadCounts } = useQuery<UnreadCount[]>({
    queryKey: ["unreadMessagesBatch", bookingIds],
    queryFn: () => getUnreadMessagesBatch(bookingIds),
    enabled: bookingIds.length > 0,
  });

  const unreadMap: Record<string, number> = (unreadCounts ?? []).reduce(
    (acc, item) => {
      acc[item.bookingId] = item.unreadCount;
      return acc;
    },
    {} as Record<string, number>
  );

  // --- Socket listeners ---
  useEffect(() => {
    if (!user || !bookings) return;

    bookingIds.forEach((id) => socket.emit("joinBookingRoom", id));

    const handleUnreadUpdate = (data: { bookingId: string; count: number }) => {
      queryClient.setQueryData(
        ["unreadMessagesBatch", bookingIds],
        (old: any) =>
          old?.map((item: UnreadCount) =>
            item.bookingId === data.bookingId
              ? { ...item, unreadCount: data.count }
              : item
          ) || []
      );
    };

    const handleStatusUpdate = (data: {
      bookingId: string;
      status: BookingStatus;
    }) => {
      queryClient.setQueryData<Booking[]>(
        ["myBookings", user.id],
        (old) =>
          old?.map((b) =>
            b.id === data.bookingId ? { ...b, status: data.status } : b
          ) || []
      );
    };

    const handleUserTyping = (data: { bookingId: string; userId: string }) => {
      setTypingUsers((prev) => {
        const current = prev[data.bookingId] || [];
        if (!current.includes(data.userId)) {
          return { ...prev, [data.bookingId]: [...current, data.userId] };
        }
        return prev;
      });
    };

    const handleUserStoppedTyping = (data: {
      bookingId: string;
      userId: string;
    }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.bookingId]: (prev[data.bookingId] || []).filter(
          (id) => id !== data.userId
        ),
      }));
    };

    socket.on("updateUnreadCount", handleUnreadUpdate);
    socket.on("bookingStatusUpdated", handleStatusUpdate);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      socket.off("updateUnreadCount", handleUnreadUpdate);
      socket.off("bookingStatusUpdated", handleStatusUpdate);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
    };
  }, [bookings, bookingIds, queryClient, user]);

  // --- Open / close chat ---
  const openChat = (bookingId: string) => setActiveBookingId(bookingId);

  const handleCloseChat = () => {
    if (activeBookingId) {
      queryClient.setQueryData<UnreadCount[]>(
        ["unreadMessagesBatch", bookingIds],
        (old) =>
          old?.map((item) =>
            item.bookingId === activeBookingId
              ? { ...item, unreadCount: 0 }
              : item
          ) || []
      );
    }
    setActiveBookingId(null);
  };

  // --- Update booking status ---
  const { mutate: changeStatus } = useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: BookingStatus;
    }) => updateBookingStatus(bookingId, status),
    onSuccess: (_, { bookingId, status }) => {
      queryClient.setQueryData<Booking[]>(
        ["myBookings", user?.id ?? ""],
        (old) =>
          old?.map((b) => (b.id === bookingId ? { ...b, status } : b)) || []
      );
    },
  });

  const handleStatusChange = (bookingId: string, status: BookingStatus) => {
    changeStatus({ bookingId, status });
  };

  // --- Checkout handler ---
  const handleCheckout = (bookingId: string) => {
    router.push(`/booking/${bookingId}/checkout`);
  };

  // --- Active booking details ---
  const activeBooking = bookings?.find((b) => b.id === activeBookingId);
  const bookingDetails: BookingDetails | null = activeBooking
    ? {
        id: activeBooking.id,
        listingId: activeBooking.listingId,
        renterId: activeBooking.renterId,
        renterName:
          user?.id === activeBooking.ownerId
            ? activeBooking.renter?.name ?? "Renter"
            : user?.name ?? "You",
        renterProfile:
          user?.id === activeBooking.ownerId
            ? activeBooking.renter?.profilePicture
            : user?.profilePicture,
        ownerId: activeBooking.ownerId,
        ownerName:
          user?.id === activeBooking.ownerId
            ? user.name ?? "You"
            : activeBooking.listing?.owner?.name ?? "Owner",
        ownerProfile:
          user?.id === activeBooking.ownerId
            ? user.profilePicture
            : activeBooking.listing?.owner?.profilePicture,
        startDate: activeBooking.startDate,
        endDate: activeBooking.endDate,
        status: activeBooking.status,
        totalPrice: activeBooking.totalPrice,
      }
    : null;

  if (!user) return null;

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-gray-700">Loading bookings...</p>
      </div>
    );
  }

  // --- Dynamic grid layout based on booking count ---
  let gridClass = "";
  if (bookings?.length === 1) {
    gridClass = "grid-cols-1 md:grid-cols-1 lg:grid-cols-1 max-w-lg mx-auto";
  } else if (bookings?.length === 2) {
    gridClass = "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto";
  } else if (bookings?.length === 3) {
    gridClass = "grid-cols-1 md:grid-cols-3 lg:grid-cols-3 mx-auto";
  } else {
    gridClass = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6 overflow-hidden">
      <div className="container mx-auto relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-purple-900 text-center drop-shadow-md">
          My Bookings 🗓️
        </h1>

        {/* --- Bookings Grid --- */}
        <div className={`grid gap-8 ${gridClass}`}>
          {bookings?.length === 0 ? (
            <p className="text-center text-gray-500 col-span-full">
              You have no bookings yet.
            </p>
          ) : (
            bookings?.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onChatClick={() => openChat(booking.id)}
                unreadCount={unreadMap[booking.id] ?? 0}
                onStatusChange={handleStatusChange}
                onCheckoutClick={handleCheckout}
              />
            ))
          )}
        </div>
      </div>

      {activeBookingId && bookingDetails && (
        <BookingChat
          bookingId={activeBookingId}
          onClose={handleCloseChat}
          bookingDetails={bookingDetails}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
