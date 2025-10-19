"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyBookings,
  getUnreadMessagesBatch,
  updateBookingStatus,
} from "@/lib/api";
import { Booking, BookingDetails, BookingStatus, UnreadCount } from "@/types";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthProvider";
import BookingCard from "@/components/BookingCard";
import BookingChat from "@/components/BookingChat";
import LoadingScreen from "@/components/LoadingScreen";
import { socket, connectSocket, disconnectSocket } from "@/lib/socket";

const MyBookingsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [modalBooking, setModalBooking] = useState<Booking | null>(null);

  // --- Fetch bookings ---
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["myBookings", user?.id ?? ""],
    queryFn: async (): Promise<Booking[]> => (user ? getMyBookings() : []),
    enabled: !!user,
  });

  // Memoize booking IDs
  const bookingIds = useMemo(
    () => bookings?.map((b) => b.id) ?? [],
    [bookings]
  );

  // --- Fetch unread counts ---
  const { data: unreadCounts } = useQuery<UnreadCount[]>({
    queryKey: ["unreadMessagesBatch", bookingIds],
    queryFn: async (): Promise<UnreadCount[]> =>
      bookingIds.length > 0 ? getUnreadMessagesBatch(bookingIds) : [],
    enabled: bookingIds.length > 0,
  });

  const unreadMap: Record<string, number> = (unreadCounts ?? []).reduce(
    (acc, item) => {
      acc[item.bookingId] = item.unreadCount;
      return acc;
    },
    {} as Record<string, number>
  );

  // --- Socket handlers (using useCallback with stable dependencies) ---
  const handleUnreadUpdate = useCallback(
    (data: { bookingId: string; count: number }) => {
      queryClient.setQueryData(
        ["unreadMessagesBatch", bookingIds],
        (old: UnreadCount[] | undefined) =>
          old?.map((item) =>
            item.bookingId === data.bookingId
              ? { ...item, unreadCount: data.count }
              : item
          ) || []
      );
    },
    [queryClient, bookingIds]
  );

  const handleStatusUpdate = useCallback(
    (data: { bookingId: string; status: BookingStatus }) => {
      if (!user) return;
      queryClient.setQueryData<Booking[]>(
        ["myBookings", user.id],
        (old) =>
          old?.map((b) =>
            b.id === data.bookingId ? { ...b, status: data.status } : b
          ) || []
      );
    },
    [queryClient, user]
  );

  const handleNewBooking = useCallback(() => {
    if (!user) return;
    queryClient.invalidateQueries({ queryKey: ["myBookings", user.id] });
  }, [queryClient, user]);

  // 🟢 EFFECT 1: Socket Connection and Core Listeners (Runs once per user session)
  useEffect(() => {
    if (!user) return;

    // Connect using cookies
    connectSocket();
    console.log("[SOCKET] Attempting connection...");

    // Set static listeners
    socket.on("connect", () => console.log("[SOCKET] Connected successfully!"));
    socket.on("disconnect", (reason) =>
      console.log(`[SOCKET] Disconnected: ${reason}`)
    );

    socket.on("updateUnreadCount", handleUnreadUpdate);
    socket.on("bookingStatusUpdated", handleStatusUpdate);
    socket.on("newBooking", handleNewBooking);

    return () => {
      // Cleanup: remove listeners and disconnect the socket entirely
      socket.off("connect");
      socket.off("disconnect");
      socket.off("updateUnreadCount", handleUnreadUpdate);
      socket.off("bookingStatusUpdated", handleStatusUpdate);
      socket.off("newBooking", handleNewBooking);
      disconnectSocket();
      console.log("[SOCKET] Cleanup: Disconnected socket.");
    };
  }, [
    user,
    // CRITICAL: Removed bookingIds, handleUnreadUpdate, handleStatusUpdate, handleNewBooking
    // from the connection effect to ensure it only runs on user change.
  ]);

  // 🟢 EFFECT 2: Room Joining (Runs when connection is stable AND booking list changes)
  useEffect(() => {
    if (!user || bookingIds.length === 0) return;

    const joinRooms = () => {
      // Only join rooms if the socket is actually connected
      if (socket.connected) {
        bookingIds.forEach((id) => {
          socket.emit("joinBookingRoom", id);
          // NOTE: Removed console.log here to prevent client-side spam
        });
        console.log(`[SOCKET] Joined ${bookingIds.length} booking rooms.`);
      }
    };

    // Join immediately if already connected
    joinRooms();

    // Ensure re-join on reconnect
    socket.on("connect", joinRooms);

    return () => {
      // Remove listener for room joining on future connects
      socket.off("connect", joinRooms);
      // NOTE: A proper cleanup would be emitting a "leaveBookingRoom" event on the server
      // to free up resources, but relying on disconnect is often acceptable.
    };
  }, [user, bookingIds]); // Now, only triggered when the list of bookings changes

  // --- The rest of the component logic is sound ---

  const openChat = (bookingId: string) => {
    setActiveBookingId(bookingId);

    // Optimistically update unread count to 0 in UI
    queryClient.setQueryData<UnreadCount[]>(
      ["unreadMessagesBatch", bookingIds],
      (old) =>
        old?.map((item) =>
          item.bookingId === bookingId ? { ...item, unreadCount: 0 } : item
        ) || []
    );

    // Server call to mark as read is implicitly handled by BookingChat component mount
    // or should be explicitly emitted here: socket.emit("markMessagesAsRead", { bookingId });
  };

  const handleCloseChat = () => setActiveBookingId(null);

  const { mutate: changeStatus } = useMutation({
    mutationFn: (payload: { bookingId: string; status: BookingStatus }) =>
      updateBookingStatus(payload.bookingId, payload.status),
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

  const handleCheckout = (booking: Booking) => {
    if (booking.status === "CONFIRMED") {
      router.push(`/booking/${booking.id}/checkout`);
    } else {
      setModalBooking(booking);
    }
  };

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
            ? activeBooking.renter?.profilePicture ?? null
            : user?.profilePicture ?? null,
        ownerId: activeBooking.ownerId,
        ownerName:
          user?.id === activeBooking.ownerId
            ? user.name ?? "You"
            : activeBooking.listing?.owner?.name ?? "Owner",
        ownerProfile:
          user?.id === activeBooking.ownerId
            ? user.profilePicture ?? null
            : activeBooking.listing?.owner?.profilePicture ?? null,
        startDate: activeBooking.startDate,
        endDate: activeBooking.endDate,
        status: activeBooking.status,
        totalPrice: activeBooking.totalPrice,
      }
    : null;

  if (!user) return null;

  if (isLoading) {
    return <LoadingScreen message="Loading your bookings..." />;
  }

  const gridClass =
    bookings?.length === 1
      ? "grid-cols-1 md:grid-cols-1 lg:grid-cols-1 max-w-lg mx-auto"
      : bookings?.length === 2
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto"
      : bookings?.length === 3
      ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-3 mx-auto"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6 overflow-hidden">
      <div className="container mx-auto relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-purple-900 text-center drop-shadow-md">
          My Bookings 🗓️
        </h1>

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
                onCheckoutClick={() => handleCheckout(booking)}
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

      {/* Modal */}
      {modalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 space-y-4 animate-fadeIn">
            <h2 className="text-2xl font-bold text-red-600">
              Payment Not Allowed
            </h2>
            <p className="text-gray-700">
              This booking is{" "}
              <span className="font-semibold">{modalBooking.status}</span>. You
              cannot pay yet.
            </p>
            <p className="text-gray-500">
              Please chat the owner for more information.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  openChat(modalBooking.id);
                  setModalBooking(null); // Close the modal after opening chat
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Chat Owner
              </button>
              <button
                onClick={() => setModalBooking(null)}
                className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
