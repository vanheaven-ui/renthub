"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  getMyBookings,
  getUnreadMessagesBatch,
  updateBookingStatus,
} from "@/lib/api";
import { socket } from "@/lib/socket";
import { useAuth } from "@/app/context/AuthProvider";
import BookingCard from "@/components/BookingCard";
import BookingChat from "@/components/BookingChat";
import LoadingScreen from "@/components/LoadingScreen";

import { CheckCircleIcon } from "@heroicons/react/24/solid";

import type {
  Booking,
  BookingDetails,
  BookingStatus,
  UnreadCount,
} from "@/types";

const ITEMS_PER_PAGE = 3;

// --- Custom Icon SVG (Discovery/Explore Theme) ---
const ExploreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-6 h-6 transform-gpu"
  >
    <path
      fillRule="evenodd"
      d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 15.116 5.093l3.535 3.535a.75.75 0 0 1-1.06 1.06l-3.535-3.535A8.25 8.25 0 0 1 2.25 10.5Z"
      clipRule="evenodd"
    />
  </svg>
);

const MyBookingsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [modalBooking, setModalBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["myBookings", user?.id ?? ""],
    queryFn: async () => (user ? getMyBookings() : []),
    enabled: !!user,
  });

  // 👇 FIX APPLIED: Stabilize the bookingIds array by using the actual bookings data
  const bookingIds = useMemo(
    () => bookings?.map((b) => b.id) ?? [],
    [bookings]
    // NOTE: While `bookings` still forces a new array when the data updates,
    // React Query's built-in memoization of the `data` result (which is `bookings`)
    // generally prevents this from being an *infinite* loop, only an unnecessary re-fetch
    // upon data change. However, for a safer, more idiomatic fix,
    // we use `bookings` and rely on React Query's stability.
    // **The actual fix for the infinite loop is often in how the useQuery's queryKey is derived.**
    // Since the structure below is standard, we ensure `bookingIds` is correct.
  );

  const { data: unreadCounts } = useQuery<UnreadCount[]>({
    // Using `JSON.stringify(bookingIds)` ensures the query key only changes
    // when the *content* of the IDs changes, not just the array reference,
    // but this is often overkill. We trust React Query to handle arrays correctly.
    // The key is the dependency on `bookingIds` being stable.
    queryKey: ["unreadMessagesBatch", bookingIds],
    queryFn: async () =>
      bookingIds.length > 0 ? getUnreadMessagesBatch(bookingIds) : [],
    enabled: bookingIds.length > 0,
  });

  const unreadMap = useMemo(
    () =>
      (unreadCounts ?? []).reduce(
        (acc, item) => ({ ...acc, [item.bookingId]: item.unreadCount }),
        {} as Record<string, number>
      ),
    [unreadCounts]
  );

  const handleUnreadUpdate = useCallback(
    (data: { bookingId: string; count: number }) => {
      queryClient.setQueryData<UnreadCount[]>(
        ["unreadMessagesBatch", bookingIds],
        (old = []) =>
          old.map((item) =>
            item.bookingId === data.bookingId
              ? { ...item, unreadCount: data.count }
              : item
          )
      );
    },
    [queryClient, bookingIds]
  );

  const handleStatusUpdate = useCallback(
    (data: { bookingId: string; status: BookingStatus }) => {
      if (!user) return;
      queryClient.setQueryData<Booking[]>(["myBookings", user.id], (old = []) =>
        old.map((b) =>
          b.id === data.bookingId ? { ...b, status: data.status } : b
        )
      );
    },
    [queryClient, user]
  );

  const handleNewBooking = useCallback(() => {
    if (user)
      queryClient.invalidateQueries({ queryKey: ["myBookings", user.id] });
  }, [queryClient, user]);

  useEffect(() => {
    if (!user) return;

    socket.on("updateUnreadCount", handleUnreadUpdate);
    socket.on("bookingStatusUpdated", handleStatusUpdate);
    socket.on("newBooking", handleNewBooking);

    return () => {
      socket.off("updateUnreadCount", handleUnreadUpdate);
      socket.off("bookingStatusUpdated", handleStatusUpdate);
      socket.off("newBooking", handleNewBooking);
    };
  }, [user, handleUnreadUpdate, handleStatusUpdate, handleNewBooking]);

  const joinRooms = useCallback(() => {
    if (socket.connected) {
      bookingIds.forEach((id) => {
        socket.emit("joinBookingRoom", id);
        console.log(`[BOOKINGS] Global join room: ${id} (user: ${user?.id})`);
      });
    }
  }, [bookingIds, socket.connected ? "connected" : "disconnected"]);

  useEffect(() => {
    if (!user || bookingIds.length === 0) return;

    joinRooms();

    const handleConnect = () => joinRooms();
    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [user, bookingIds, joinRooms]);

  const { mutate: changeStatus } = useMutation({
    mutationFn: (payload: { bookingId: string; status: BookingStatus }) =>
      updateBookingStatus(payload.bookingId, payload.status),
    onSuccess: (_, { bookingId, status }) => {
      queryClient.setQueryData<Booking[]>(
        ["myBookings", user?.id ?? ""],
        (old = []) =>
          old.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    },
  });

  useEffect(() => {
    if (!bookings || !user) return;

    const now = new Date();
    const updates = bookings
      .filter((b) => b.status === "CONFIRMED" && new Date(b.endDate) < now)
      .map((b) => {
        if (b.paymentStatus === "PAID")
          return { id: b.id, newStatus: "COMPLETED" as const };
        if (b.paymentStatus === "PENDING")
          return { id: b.id, newStatus: "CANCELED" as const };
        return null;
      })
      .filter(
        (u): u is { id: string; newStatus: "COMPLETED" | "CANCELED" } => !!u
      );

    if (updates.length === 0) return;

    (async () => {
      try {
        await Promise.all(
          updates.map(({ id, newStatus }) => updateBookingStatus(id, newStatus))
        );
        queryClient.setQueryData<Booking[]>(
          ["myBookings", user.id],
          (old = []) =>
            old.map((bk) => {
              const update = updates.find((u) => u.id === bk.id);
              return update ? { ...bk, status: update.newStatus } : bk;
            })
        );
      } catch (err) {
        console.error("Failed to auto-update bookings:", err);
      }
    })();
  }, [bookings, queryClient, user]);

  const openChat = (bookingId: string) => {
    setActiveBookingId(bookingId);
    queryClient.setQueryData<UnreadCount[]>(
      ["unreadMessagesBatch", bookingIds],
      (old = []) =>
        old.map((i) =>
          i.bookingId === bookingId ? { ...i, unreadCount: 0 } : i
        )
    );
  };

  const handleCloseChat = () => setActiveBookingId(null);
  const handleStatusChange = (bookingId: string, status: BookingStatus) =>
    changeStatus({ bookingId, status });

  const handleCheckout = (booking: Booking) =>
    router.push(`/booking/${booking.id}/checkout`);

  const activeBooking = bookings?.find((b) => b.id === activeBookingId);
  // const bookingDetails: BookingDetails | null = activeBooking
  //   ? {
  //       id: activeBooking.id,
  //       listingId: activeBooking.listingId,
  //       renterId: activeBooking.renterId,
  //       renterName:
  //         user?.id === activeBooking.ownerId
  //           ? activeBooking.renter?.name ?? "Renter"
  //           : user?.name ?? "You",
  //       renterProfile:
  //         user?.id === activeBooking.ownerId
  //           ? activeBooking.renter?.profilePicture ?? null
  //           : user?.profilePicture ?? null,
  //       ownerId: activeBooking.ownerId,
  //       paymentStatus: activeBooking.paymentStatus,
  //       ownerName:
  //         user?.id === activeBooking.ownerId
  //           ? user.name ?? "You"
  //           : activeBooking.listing?.owner?.name ?? "Owner",
  //       ownerProfile:
  //         user?.id === activeBooking.ownerId
  //           ? user.profilePicture ?? null
  //           : activeBooking.listing?.owner?.profilePicture ?? null,
  //       startDate: activeBooking.startDate,
  //       endDate: activeBooking.endDate,
  //       status: activeBooking.status,
  //       totalPrice: activeBooking.totalPrice,
  //     }
  //   : null;

  // Add this after the activeBooking computation
  const bookingDetails = useMemo<BookingDetails | null>(() => {
    const activeBookingItem = bookings?.find((b) => b.id === activeBookingId);
    if (!activeBookingItem) return null;

    return {
      id: activeBookingItem.id,
      listingId: activeBookingItem.listingId,
      renterId: activeBookingItem.renterId,
      renterName:
        user?.id === activeBookingItem.ownerId
          ? activeBookingItem.renter?.name ?? "Renter"
          : user?.name ?? "You",
      renterProfile:
        user?.id === activeBookingItem.ownerId
          ? activeBookingItem.renter?.profilePicture ?? null
          : user?.profilePicture ?? null,
      ownerId: activeBookingItem.ownerId,
      paymentStatus: activeBookingItem.paymentStatus,
      ownerName:
        user?.id === activeBookingItem.ownerId
          ? user.name ?? "You"
          : activeBookingItem.listing?.owner?.name ?? "Owner",
      ownerProfile:
        user?.id === activeBookingItem.ownerId
          ? user.profilePicture ?? null
          : activeBookingItem.listing?.owner?.profilePicture ?? null,
      startDate: activeBookingItem.startDate,
      endDate: activeBookingItem.endDate,
      status: activeBookingItem.status,
      totalPrice: activeBookingItem.totalPrice,
    };
  }, [activeBookingId, bookings, user]); // Stable deps: won't recompute unless these change

  const getThemeClass = (booking: Booking) => {
    // Theme for CONFIRMED but PENDING PAYMENT (Urgency/Warning)
    if (booking.paymentStatus === "PENDING" && booking.status === "CONFIRMED")
      return "from-rose-50 via-orange-100 to-amber-50 border-rose-200 ring-rose-300";

    // Theme for CONFIRMED and PAID (Success/Ready)
    if (booking.paymentStatus === "PAID" && booking.status === "CONFIRMED")
      return "from-teal-50 via-emerald-100 to-green-50 border-emerald-300 ring-emerald-400";

    // Theme for COMPLETED and PAID (Archive/Done)
    if (booking.paymentStatus === "PAID" && booking.status === "COMPLETED")
      return "from-indigo-50 via-fuchsia-100 to-cyan-50 border-indigo-200 ring-indigo-300";

    // Default or PENDING status
    return "from-gray-50 via-slate-100 to-gray-50 border-gray-200 ring-gray-300";
  };

  const totalPages = Math.ceil((bookings?.length ?? 0) / ITEMS_PER_PAGE);
  const paginatedBookings = bookings?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!user) return null;
  if (isLoading) return <LoadingScreen message="Loading your bookings..." />;

  const gridClass =
    bookings?.length === 1
      ? "grid-cols-1 max-w-lg mx-auto"
      : bookings?.length === 2
      ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
      : bookings?.length === 3
      ? "grid-cols-1 md:grid-cols-3 mx-auto"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-purple-900 text-center">
          My Bookings 🗓️
        </h1>

        {/* Fixed 'Browse Listings' button on the left-middle side */}
        {user?.role === "RENTER" && (
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 50px rgba(236, 72, 153, 0.9)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/#listings")}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50 
                       px-8 py-4 bg-gradient-to-br from-pink-500 to-purple-600 
                       text-white font-extrabold text-lg rounded-full 
                       shadow-xl shadow-pink-500/50 
                       transition-all duration-300 ease-in-out 
                       transform-gpu hover:shadow-2xl flex items-center gap-3 whitespace-nowrap"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ExploreIcon />
            </motion.div>
            Browse Listings
          </motion.button>
        )}

        {/* --- Booking Cards Grid with Wrapper --- */}
        <div className={`grid gap-6 ${gridClass} pt-10 pb-20`}>
          {(paginatedBookings || []).map((booking) => (
            // WRAPPER motion.div applies the theme and animation
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              // APPLYING THE THEME CLASS HERE
              className={`relative rounded-3xl border-4 shadow-xl p-0.5 bg-gradient-to-br ${getThemeClass(
                booking
              )} transition-transform`}
            >
              {/* Optional: Add a subtle overlay for completed bookings */}
              {booking.paymentStatus === "PAID" &&
                booking.status === "COMPLETED" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md flex items-center gap-1 z-20"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Completed
                  </motion.div>
                )}

              <BookingCard
                booking={booking}
                unreadCount={unreadMap[booking.id] ?? 0}
                onChatClick={() => openChat(booking.id)}
                onStatusChange={handleStatusChange}
                // Passes the booking ID, not the object, as required by the prop signature
                onCheckoutClick={() => handleCheckout(booking)}
              />
            </motion.div>
            // END WRAPPER
          ))}
        </div>

        {/* --- Pagination --- */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === index + 1
                      ? "bg-purple-600 text-white focus:z-20"
                      : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
        {/* --- End Pagination --- */}
      </div>

      {/* --- Chat Component --- */}
      {activeBookingId && bookingDetails && (
        <BookingChat
          bookingId={activeBookingId}
          onClose={handleCloseChat}
          bookingDetails={bookingDetails}
        />
      )}
      {/* --- End Chat Component --- */}
    </div>
  );
};

export default MyBookingsPage;
