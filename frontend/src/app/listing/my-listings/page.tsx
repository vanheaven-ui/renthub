"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyListings } from "@/lib/api";
import { Listing } from "@/types";
import Link from "next/link";
import Image from "next/image"; // ✅ Added Image import
import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  HomeIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/app/context/AuthProvider";

// Keen Slider
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";

const MyListingsPage = () => {
  // const { user } = useAuth(); // ✅ Removed 'user' to resolve unused variable warning
  useAuth();

  // --- Hooks (top-level) ---
  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    slides: { perView: 1.2, spacing: 16 },
    breakpoints: {
      "(min-width: 640px)": { slides: { perView: 1.5, spacing: 20 } },
      "(min-width: 768px)": { slides: { perView: 2, spacing: 20 } },
    },
  });

  const {
    data: listings = [],
    isLoading,
    error: myListingsError,
    refetch: refetchMyListings,
  } = useQuery<Listing[]>({
    queryKey: ["myListings"],
    queryFn: getMyListings,
  });

  // --- Loading/Error early returns ---
  if (isLoading) return <LoadingScreen message="Loading your listings..." />;
  if (myListingsError)
    return (
      <ErrorScreen
        error={myListingsError || undefined}
        retry={() => {
          if (myListingsError) refetchMyListings();
        }}
      />
    );

  // --- Compute dashboard-wide stats ---
  const totalEarnings = listings.reduce(
    (sum, listing) =>
      sum +
      (listing.bookings || []).reduce(
        (s, booking) =>
          s + (booking.status === "CONFIRMED" ? booking.totalAmount || 0 : 0),
        0
      ),
    0
  );

  // --- Current month bookings ---
  const now = new Date();
  const bookingsThisMonth = listings.reduce((sum, listing) => {
    const monthlyBookings = listing.bookings?.filter((b) => {
      const bookingDate = new Date(b.createdAt);
      return (
        bookingDate.getMonth() === now.getMonth() &&
        bookingDate.getFullYear() === now.getFullYear()
      );
    }).length;
    return sum + (monthlyBookings || 0);
  }, 0);

  // --- Grid helper ---
  const getGridClasses = (count: number) => {
    if (count === 0) return "grid-cols-1";
    if (count === 1) return "grid-cols-1 md:grid-cols-1 max-w-3xl mx-auto";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto";
    if (count === 3)
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto";
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto";
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-purple-50 to-blue-50 p-4 md:p-6">
      {/* Stats */}
      <h1 className="text-3xl font-bold text-purple-900 mb-6">
        My Listings Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-purple-100 rounded-xl flex items-center gap-3">
          <HomeIcon className="w-6 h-6 text-purple-700" />
          <span className="font-medium">{listings.length} Active Listings</span>
        </div>
        <div className="p-4 bg-pink-100 rounded-xl flex items-center gap-3">
          <CalendarDaysIcon className="w-6 h-6 text-pink-600" />
          <span className="font-medium">
            {bookingsThisMonth} Bookings This Month
          </span>
        </div>
        <div className="p-4 bg-green-100 rounded-xl flex items-center gap-3">
          <CurrencyDollarIcon className="w-6 h-6 text-green-700" />
          <span className="font-medium">
            UGX {totalEarnings.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Create button */}
      <div className="mb-8 flex justify-center sm:justify-end">
        <Link
          href="/listing/create"
          className="px-6 py-3 bg-purple-700 text-white rounded-full shadow hover:bg-purple-800 transition"
        >
          + New Listing
        </Link>
      </div>

      {/* --- Swipeable slider (small screens) --- */}
      <div className="md:hidden">
        <div ref={sliderRef} className="keen-slider">
          {listings.map((listing) => {
            const currentImage = listing.images?.[0] || "";
            return (
              <div
                key={listing.id}
                className="keen-slider__slide flex justify-center"
              >
                <div className="relative bg-white rounded-2xl shadow hover:shadow-xl overflow-hidden transition group">
                  {/* Added relative to container for Image fill */}
                  <div className="relative h-48 bg-gray-100">
                    {currentImage ? (
                      <Image // ✅ Replaced <img> with <Image />
                        src={currentImage}
                        alt={listing.title}
                        fill
                        className="object-cover" // object-cover is equivalent to the old class
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-purple-800">
                      {listing.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {listing.description}
                    </p>
                    <p className="font-semibold mt-2 text-purple-900">
                      UGX {listing.pricePerDay} / night
                    </p>
                    <p className="text-sm text-gray-500">{listing.location}</p>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <Link
                      href={`/listing/${listing.id}/edit`}
                      className="px-3 py-1 bg-white text-purple-700 border rounded-md shadow hover:bg-gray-50 text-sm flex items-center gap-1"
                    >
                      <PencilSquareIcon className="w-4 h-4" /> Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Grid for large screens --- */}
      <div
        className="hidden md:grid gap-8"
        style={{ gridTemplateColumns: getGridClasses(listings.length) }}
      >
        {listings.map((listing) => {
          const currentImage = listing.images?.[0] || "";
          return (
            <div
              key={listing.id}
              className="relative bg-white rounded-2xl shadow hover:shadow-xl overflow-hidden transition group"
            >
              {/* Added relative to container for Image fill */}
              <div className="relative h-48 bg-gray-100">
                {currentImage ? (
                  <Image // ✅ Replaced <img> with <Image />
                    src={currentImage}
                    alt={listing.title}
                    fill
                    className="object-cover" // object-cover is equivalent to the old class
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No image
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-bold text-purple-800">
                  {listing.title}
                </h3>
                <p className="text-gray-600 line-clamp-2">
                  {listing.description}
                </p>
                <p className="font-semibold mt-2 text-purple-900">
                  UGX {listing.pricePerDay} / night
                </p>
                <p className="text-sm text-gray-500">{listing.location}</p>
              </div>

              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <Link
                  href={`/listing/${listing.id}/edit`}
                  className="px-3 py-1 bg-white text-purple-700 border rounded-md shadow hover:bg-gray-50 text-sm flex items-center gap-1"
                >
                  <PencilSquareIcon className="w-4 h-4" /> Edit
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyListingsPage;
