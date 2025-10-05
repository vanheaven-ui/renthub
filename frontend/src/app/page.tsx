"use client";

import { JSX, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getListings, getMyListings } from "@/lib/api";
import { Listing } from "@/types";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthProvider";
import Link from "next/link";
import Image from "next/image"; 
import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  HomeIcon,
  HomeModernIcon,
  SparklesIcon,
  ChatBubbleBottomCenterTextIcon,
  CreditCardIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import FilterPanel, { FilterOptions } from "@/components/FilterPanel";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";

// --- CATEGORY ICONS ---
const categories = ["Apartment", "House", "Villa", "Cabin"];
const CategorySVG: Record<string, JSX.Element> = {
  Apartment: <BuildingOfficeIcon className="w-10 h-10 text-purple-600" />,
  House: <HomeIcon className="w-10 h-10 text-pink-600" />,
  Villa: <BanknotesIcon className="w-10 h-10 text-blue-600" />,
  Cabin: <HomeModernIcon className="w-10 h-10 text-green-600" />,
};

const HomePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    category: null,
    minPrice: null,
    maxPrice: null,
  });

  // --- FETCH DATA ---
  const {
    data: listings = [],
    isLoading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useQuery<Listing[]>({
    queryKey: ["listings", user?.id],
    queryFn: getListings,
  });

  const {
    data: myListings = [],
    isLoading: myListingsLoading,
    error: myListingsError,
    refetch: refetchMyListings,
  } = useQuery<Listing[]>({
    queryKey: ["myListings", user?.id],
    queryFn: getMyListings,
    enabled: user?.role === "OWNER",
  });

  // --- OWNER STATS ---
  const activeListings = myListings.length;

  const totalEarnings = myListings.reduce((sum, listing) => {
    const confirmedBookings =
      listing.bookings?.filter((b) => b.status === "CONFIRMED") || [];

    return (
      sum +
      confirmedBookings.reduce(
        (subSum, booking) => subSum + (booking.totalAmount || 0),
        0
      )
    );
  }, 0);

  const bookingsThisMonth = myListings.reduce((sum, listing) => {
    const monthlyBookings =
      listing.bookings?.filter((b) => {
        const bookingDate = new Date(b.createdAt);
        const now = new Date();
        return (
          b.status === "CONFIRMED" &&
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear()
        );
      }).length || 0;

    return sum + monthlyBookings;
  }, 0);

  // --- FILTER LISTINGS ---
  const filteredListings = listings.filter((listing) => {
    if (filters.category && listing.category !== filters.category) return false;
    if (filters.minPrice !== null && listing.pricePerDay < filters.minPrice)
      return false;
    if (filters.maxPrice !== null && listing.pricePerDay > filters.maxPrice)
      return false;
    return true;
  });

  const getGridColsClass = (count: number) => {
    if (count === 1)
      return "grid-cols-1 md:grid-cols-1 lg:grid-cols-1 max-w-lg mx-auto";
    if (count === 2)
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mx-auto";
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };
  const gridColsClass = getGridColsClass(filteredListings.length);

  // --- HERO CONTENT ---
  const renderHeroContent = () => {
    if (user?.role === "OWNER") {
      return (
        <div className="container mx-auto px-6 py-16 text-center relative z-10">
          <h1 className="text-4xl font-extrabold text-purple-800 drop-shadow-sm mb-2">
            Welcome back, <span className="text-pink-600">{user.name}</span>!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your Performance Dashboard
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl flex flex-col items-center border border-gray-100">
              <CurrencyDollarIcon className="w-10 h-10 text-pink-500 mb-2" />
              <p className="text-3xl font-bold text-purple-700">
                UGX {totalEarnings.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total Earnings</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl flex flex-col items-center border border-gray-100">
              <CalendarDaysIcon className="w-10 h-10 text-blue-500 mb-2" />
              <p className="text-3xl font-bold text-purple-700">
                {bookingsThisMonth}
              </p>
              <p className="text-sm text-gray-500 mt-1">Bookings This Month</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl flex flex-col items-center border border-gray-100">
              <HomeIcon className="w-10 h-10 text-purple-500 mb-2" />
              <p className="text-3xl font-bold text-purple-700">
                {activeListings}
              </p>
              <p className="text-sm text-gray-500 mt-1">Active Listings</p>
            </div>
          </div>
        </div>
      );
    }

    // RENTER / GUEST HERO
    return (
      <div className="container mx-auto px-6 py-24 text-center relative z-10">
        <h1 className="text-5xl font-extrabold text-purple-900 mb-4 tracking-tight leading-snug">
          Find Your Perfect Stay in{" "}
          <span className="text-pink-600">Uganda</span>
        </h1>
        <p className="text-xl text-gray-600 font-medium mb-8">
          Secure, simple bookings with Mobile Money and 24/7 AI assistance.
        </p>
        {!user && (
          <Link
            href="/register?role=OWNER"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 mb-12 text-lg font-bold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95"
          >
            <PlusIcon className="w-6 h-6" />
            List Your Property & Start Earning
          </Link>
        )}
        <div className="flex justify-center gap-10 mb-12 border-y border-gray-300 py-4">
          <div className="flex items-center text-gray-700 font-semibold text-lg">
            <ChatBubbleBottomCenterTextIcon className="w-6 h-6 mr-2 text-pink-500" />
            In-App Chat
          </div>
          <div className="flex items-center text-gray-700 font-semibold text-lg">
            <CreditCardIcon className="w-6 h-6 mr-2 text-blue-500" />
            Mobile Money Ready
          </div>
          <div className="flex items-center text-gray-700 font-semibold text-lg">
            <SparklesIcon className="w-6 h-6 mr-2 text-purple-500" />
            AI Hub Scout
          </div>
        </div>

        <h2 className="text-3xl font-bold text-purple-800 mb-6 mt-12">
          Explore Listings by Property Type
        </h2>
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {categories.map((cat) => (
            <div
              key={cat}
              className={`w-36 h-36 bg-white/70 backdrop-blur-sm rounded-2xl shadow-md flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border ${
                filters.category === cat
                  ? "border-pink-500 ring-2 ring-pink-300 bg-white"
                  : "border-gray-200 hover:shadow-lg"
              }`}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  category: prev.category === cat ? null : cat,
                }))
              }
            >
              {CategorySVG[cat]}
              <span className="mt-2 font-semibold text-base text-gray-800">
                {cat}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- LOADING / ERROR ---
  if (listingsLoading || myListingsLoading)
    return <LoadingScreen message="Loading the RentHub experience..." />;

  if (listingsError || myListingsError)
    return (
      <ErrorScreen
        error={listingsError || myListingsError || undefined}
        retry={() => {
          if (listingsError) refetchListings();
          if (myListingsError) refetchMyListings();
        }}
      />
    );

  // --- MAIN RENDER ---
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"></div>

        {renderHeroContent()}
      </div>

      {/* RENTER/NON-USER LISTINGS */}
      {(user?.role === "RENTER" || !user) && (
        <div className="container mx-auto p-6 relative z-20 -mt-10">
          <FilterPanel filters={filters} setFilters={setFilters} />
          <h2 className="text-4xl font-extrabold mb-8 text-center text-purple-800 pt-8">
            Featured Listings
          </h2>

          <div className="pb-20">
            <div
              className={`grid gap-8 ${
                filteredListings.length > 0 ? gridColsClass : ""
              }`}
            >
              {filteredListings.length === 0 ? (
                <p className="text-center text-gray-500 col-span-full py-10 text-xl">
                  No listings match your current filters. Try broadening your
                  search!
                </p>
              ) : (
                filteredListings.map((listing) => {
                  const images = listing.images || [];
                  const currentImageUrl = images[0] || "";

                  return (
                    <div
                      key={listing.id}
                      className="relative group bg-white/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden transition-all duration-300 border border-gray-200 hover:scale-[1.02] hover:shadow-2xl"
                      onMouseEnter={() => setHoveredListing(listing.id)}
                      onMouseLeave={() => setHoveredListing(null)}
                    >
                      <div className="relative h-64 overflow-hidden bg-gray-100 flex items-center justify-center">
                        {currentImageUrl ? (
                          <Image // Replaced <img> with <Image />
                            src={currentImageUrl}
                            alt={listing.title}
                            fill // Use fill to take up the parent div's space
                            className="object-cover transition-transform duration-500 group-hover:scale-110" // object-cover for fit and transition for hover effect
                          />
                        ) : (
                          <span className="text-gray-500 font-semibold text-lg text-center p-4">
                            Image not available
                          </span>
                        )}
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-blue-400 to-green-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          M-Money Pay
                        </span>
                      </div>

                      <div className="p-5 relative">
                        <h3 className="text-2xl font-bold text-purple-700 mb-1">
                          {listing.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 text-sm mb-3">
                          {listing.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-gray-900 font-extrabold text-xl">
                            Ugx {listing.pricePerDay.toLocaleString()}
                            <span className="text-base font-normal text-gray-500">
                              {" "}
                              / night
                            </span>
                          </p>
                          <p className="text-purple-500 text-sm font-medium">
                            {listing.location}
                          </p>
                        </div>

                        {hoveredListing === listing.id && (
                          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 rounded-2xl transition-opacity p-4">
                            <button
                              className="w-4/5 px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-bold rounded-full shadow-xl hover:scale-105 transition transform"
                              onClick={() =>
                                router.push(`/listing/${listing.id}`)
                              }
                            >
                              View Details
                            </button>
                            {!listing.alreadyBooked &&
                            user?.role === "RENTER" ? (
                              <button
                                className="w-4/5 px-6 py-3 bg-pink-500 text-white font-bold rounded-full shadow-lg hover:bg-pink-600 transition transform hover:scale-105"
                                onClick={() =>
                                  router.push(
                                    `/booking/create?listingId=${listing.id}`
                                  )
                                }
                              >
                                Book Now
                              </button>
                            ) : (
                              <button
                                className="w-4/5 px-6 py-3 bg-gray-400 text-white rounded-full shadow cursor-not-allowed"
                                disabled
                              >
                                Already Booked
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* OWNER ACTION SECTION */}
      {user?.role === "OWNER" && (
        <div className="container mx-auto p-6 relative z-20 -mt-16">
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-10 text-center text-purple-800 flex flex-col items-center gap-6 border border-gray-200">
            <h2 className="text-3xl font-bold mb-2">Manage Your Portfolio</h2>
            <p className="text-lg font-light max-w-2xl text-gray-600">
              Quickly jump into your management tools to handle bookings, update
              listings, or add a new property to your fleet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/listing/my-listings"
                className="px-8 py-3 bg-pink-500 text-white font-bold rounded-full shadow-lg hover:bg-pink-600 transition transform hover:scale-105"
              >
                View My Listings
              </Link>
              <Link
                href="/listing/create"
                className="px-8 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition transform"
              >
                Create New Listing
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
