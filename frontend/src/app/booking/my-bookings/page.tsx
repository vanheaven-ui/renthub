"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { ArrowLongLeftIcon } from "@heroicons/react/24/outline";
import type { Booking, BookingStatus, UnreadCount } from "@/types";
import {
  getMyBookings,
  getUnreadMessagesBatch,
  updateBookingStatus,
} from "@/lib/api";
import { socket } from "@/lib/socket";
import { useAuth } from "@/app/context/AuthProvider";
import BookingCard from "@/components/BookingCard";
import LoadingScreen from "@/components/LoadingScreen";

const BookingChat = dynamic(() => import("@/components/BookingChat"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <p className="text-white">Loading chat...</p>
    </div>
  ),
});

const ITEMS_PER_PAGE = 3;

const MyBookingsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const highlightedRef = useRef<HTMLDivElement>(null);

  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedBookingId, setHighlightedBookingId] = useState<
    string | null
  >(null);

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["myBookings", user?.id ?? ""],
    queryFn: async () => (user ? getMyBookings() : []),
    enabled: !!user,
  });

  const bookingIds = useMemo(
    () => bookings?.map((b) => b.id) ?? [],
    [bookings]
  );

  const { data: unreadCounts } = useQuery<UnreadCount[]>({
    queryKey: ["unreadMessagesBatch", bookingIds],
    queryFn: async () =>
      bookingIds.length > 0 ? getUnreadMessagesBatch(bookingIds) : [],
    enabled: bookingIds.length > 0,
  });

  const unreadMap = useMemo(
    () =>
      (unreadCounts ?? []).reduce((acc, item) => {
        acc[item.bookingId] = item.unreadCount;
        return acc;
      }, {} as Record<string, number>),
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
      bookingIds.forEach((id) => socket.emit("joinBookingRoom", id));
    }
  }, [bookingIds]);

  useEffect(() => {
    if (!user || bookingIds.length === 0) return;

    joinRooms();
    socket.on("connect", joinRooms);

    return () => {
      socket.off("connect", joinRooms);
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

  const bookingDetails = useMemo(() => {
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
  }, [activeBookingId, bookings, user]);

  const getThemeClass = (booking: Booking) => {
    if (booking.paymentStatus === "PENDING" && booking.status === "CONFIRMED")
      return "from-rose-50 via-orange-100 to-amber-50 border-rose-200 ring-rose-300";
    if (booking.paymentStatus === "PAID" && booking.status === "CONFIRMED")
      return "from-teal-50 via-emerald-100 to-green-50 border-emerald-300 ring-emerald-400";
    if (booking.paymentStatus === "PAID" && booking.status === "COMPLETED")
      return "from-indigo-50 via-fuchsia-100 to-cyan-50 border-indigo-200 ring-indigo-300";
    return "from-gray-50 via-slate-100 to-gray-50 border-gray-200 ring-gray-300";
  };

  const totalPages = Math.ceil((bookings?.length ?? 0) / ITEMS_PER_PAGE);
  const paginatedBookings = useMemo(
    () =>
      bookings?.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ) ?? [],
    [bookings, currentPage]
  );

  // Highlight booking based on query param
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!bookings?.length) return;

    const listingId = searchParams.get("listingId");
    if (!listingId) return;

    const matchedBooking = bookings.find((b) => b.listingId === listingId);
    if (!matchedBooking) return;

    setHighlightedBookingId(matchedBooking.id);
    const index = bookings.findIndex((b) => b.id === matchedBooking.id);
    const targetPage = Math.floor(index / ITEMS_PER_PAGE) + 1;

    if (targetPage !== currentPage) setCurrentPage(targetPage);

    router.replace("/booking/my-bookings", { scroll: false });
  }, [bookings, searchParams, currentPage, router]);

  // Scroll to highlighted booking
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (highlightedBookingId && highlightedRef.current) {
      requestAnimationFrame(() =>
        highlightedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      );
      const timeout = setTimeout(() => setHighlightedBookingId(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [highlightedBookingId, paginatedBookings]);

  // Auto-update expired bookings
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

    if (!updates.length) return;

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

        {user?.role === "RENTER" && (
          <Link href="/#listings" passHref>
            <motion.div
              className="fixed top-20 left-4 md:left-10 z-30 cursor-pointer p-2 rounded-full shadow-2xl bg-white/70 backdrop-blur-sm"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 30px rgba(168, 85, 247, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-1.5 p-2 pr-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold text-sm">
                <ArrowLongLeftIcon className="w-6 h-6" />
                <span className="hidden sm:inline">Back to Listings</span>
              </div>
            </motion.div>
          </Link>
        )}

        <div className={`grid gap-6 ${gridClass} pt-10 pb-20`}>
          {paginatedBookings.map((booking) => (
            <motion.div
              key={booking.id}
              ref={booking.id === highlightedBookingId ? highlightedRef : null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className={`relative rounded-3xl border-4 shadow-xl p-0.5 bg-gradient-to-br ${getThemeClass(
                booking
              )} transition-transform duration-500 ${
                booking.id === highlightedBookingId
                  ? "ring-8 ring-pink-500/50 shadow-2xl scale-[1.05]"
                  : ""
              }`}
            >
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
                onCheckoutClick={() => handleCheckout(booking)}
              />
            </motion.div>
          ))}
        </div>

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

export default dynamic(() => Promise.resolve(MyBookingsPage), { ssr: false });
