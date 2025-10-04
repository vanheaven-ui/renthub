"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyBookings } from "@/lib/api";
import { Booking } from "@/types";
import Link from "next/link";
import {
  CalendarDaysIcon,
  HomeIcon,
  ArrowLeftCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthProvider";
import LoadingScreen from "@/components/LoadingScreen";

const MyBookingsPage = () => {
  const { user } = useAuth();
  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery<Booking[]>({
    queryKey: ["myBookings"],
    queryFn: getMyBookings,
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4 text-center">
        <UserIcon className="w-16 h-16 text-gray-500 mb-4" />
        <p className="text-xl font-semibold text-gray-700 mb-4">
          Please log in to view your bookings.
        </p>
        <Link
          href="/login"
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-lg hover:bg-purple-700 transition"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (isLoading)
    return <LoadingScreen message="Loading your bookings..." />

  if (error)
    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <p className="text-xl text-red-500">
          Error fetching bookings. Please try again.
        </p>
      </div>
    );

  const renterBookings = bookings?.filter((b) => b.renterId === user.id);
  const ownerBookings = bookings?.filter((b) => b.ownerId === user.id);

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-6 text-gray-500 bg-white/40 backdrop-blur-md rounded-xl shadow-inner">
      <CalendarDaysIcon className="w-12 h-12 mb-3 text-purple-400" />
      <p className="text-center">{message}</p>
      <Link
        href="/"
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition"
      >
        <ArrowLeftCircleIcon className="w-5 h-5" />
        Back to Listings
      </Link>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 py-12 px-4 overflow-hidden">
      {/* Abstract shapes from homepage */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="bg-white/50 backdrop-blur-md rounded-3xl p-8 shadow-2xl mb-12">
          <h1 className="text-4xl font-extrabold mb-4 text-center text-purple-800 drop-shadow">
            My Bookings
          </h1>
          {user && (
            <p className="text-xl text-center text-gray-700">
              Welcome back,
              <span className="ml-1 font-bold text-purple-600">
                {user.name || "User"}
              </span>
              ! Here are your bookings as a
              <span className="ml-1 font-bold text-purple-600">
                {user.role?.toLowerCase() || "N/A"}
              </span>
              .
            </p>
          )}
        </div>

        {/* Conditionally render sections based on user role */}
        {user.role === "RENTER" && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-purple-700 flex items-center gap-2">
              <HomeIcon className="w-6 h-6 text-purple-500" />
              Bookings as a Renter
            </h2>
            {renterBookings?.length === 0 ? (
              <EmptyState message="You have not made any bookings yet." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {renterBookings?.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6 transition hover:shadow-2xl hover:scale-[1.02]"
                  >
                    <p className="font-semibold text-purple-800">
                      Listing: {booking.listingId}
                    </p>
                    <p className="text-gray-600 mt-2">
                      Dates:{" "}
                      <span className="mr-1">
                        {new Date(booking.startDate).toLocaleDateString()}
                      </span>
                      - {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                    <p
                      className={`mt-2 font-medium ${
                        booking.status === "CONFIRMED"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      Status: {booking.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {user.role === "OWNER" && (
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-purple-700 flex items-center gap-2">
              <HomeIcon className="w-6 h-6 text-purple-500" />
              Bookings for your properties
            </h2>
            {ownerBookings?.length === 0 ? (
              <EmptyState message="You have no pending or active bookings for your properties." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownerBookings?.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6 transition hover:shadow-2xl hover:scale-[1.02]"
                  >
                    <p className="font-semibold text-purple-800">
                      Listing: {booking.listingId}
                    </p>
                    <p className="text-gray-600 mt-1">
                      Renter: {booking.renterId}
                    </p>
                    <p className="text-gray-600 mt-1">
                      Dates:{" "}
                      <span className="mr-1">
                        {new Date(booking.startDate).toLocaleDateString()}
                      </span>
                      - {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                    <p
                      className={`mt-2 font-medium ${
                        booking.status === "CONFIRMED"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      Status: {booking.status}
                    </p>
                    <p className="mt-2 font-bold text-gray-900">
                      Total Price: ${booking.totalPrice}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
