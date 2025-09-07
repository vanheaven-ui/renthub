"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getListings } from "@/lib/api";
import { Listing } from "@/types";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthProvider";
import Link from "next/link";
import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

const categories = ["Apartment", "House", "Villa", "Cabin"];

const HomePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const {
    data: listings,
    isLoading,
    error,
  } = useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: getListings,
  });

  const [hoveredListing, setHoveredListing] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<
    Record<string, number>
  >({});

  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  if (isLoading)
    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        Loading listings...
      </div>
    );

  if (error)
    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        Error fetching listings.
      </div>
    );

  // Conditional Hero Content
  const renderHeroContent = () => {
    if (user && user.role === "OWNER") {
      return (
        <div className="container mx-auto px-6 py-24 text-center relative z-10">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">
            Welcome, <span className="text-pink-600">{user.name}</span>!
          </h1>
          <p className="text-lg text-purple-800 mb-8">
            Your Performance at a Glance
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl flex flex-col items-center">
              <CurrencyDollarIcon className="w-10 h-10 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-gray-800">UGX 1.2M</p>
              <p className="text-gray-600">Total Earnings</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl flex flex-col items-center">
              <CalendarDaysIcon className="w-10 h-10 text-pink-600 mb-2" />
              <p className="text-2xl font-bold text-gray-800">14</p>
              <p className="text-gray-600">Bookings This Month</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl flex flex-col items-center">
              <HomeIcon className="w-10 h-10 text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-gray-800">5</p>
              <p className="text-gray-600">Active Listings</p>
            </div>
          </div>
        </div>
      );
    }

    if (user && user.role === "RENTER") {
      return (
        <div className="container mx-auto px-6 py-24 text-center relative z-10">
          <h1 className="text-5xl font-bold text-purple-900 mb-4">
            Find Your Dream Getaway,{" "}
            <span className="text-pink-600">{user.name}</span>!
          </h1>
          <p className="text-lg text-purple-800 mb-8">
            Explore unique properties and book your next adventure.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-full shadow-lg hover:bg-purple-700 transition"
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex justify-center mb-12">
            <input
              type="text"
              placeholder="Search by location or property..."
              className="w-full max-w-md px-4 py-3 rounded-l-2xl shadow-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
            />
            <button className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-r-2xl shadow-lg hover:bg-purple-700 transition">
              Search
            </button>
          </div>
        </div>
      );
    }

    // Default hero for non-logged-in users
    return (
      <div className="container mx-auto px-6 py-24 text-center relative z-10">
        <h1 className="text-5xl font-bold text-purple-900 mb-4">
          Discover Your Next Stay in Uganda
        </h1>
        <p className="text-lg text-purple-800 mb-8">
          Rent from verified owners or list your own property easily.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-full shadow-lg hover:bg-purple-700 transition"
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex justify-center mb-12">
          <input
            type="text"
            placeholder="Search by location or property..."
            className="w-full max-w-md px-4 py-3 rounded-l-2xl shadow-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
          />
          <button className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-r-2xl shadow-lg hover:bg-purple-700 transition">
            Search
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-tr from-purple-300 via-pink-200 to-blue-200 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"></div>

        {renderHeroContent()}
      </div>

      {/* Conditional Content based on user role */}

      {/* CTA Section (Visible only when user is logged out) */}
      {!user && (
        <div className="container mx-auto p-6 -mt-16 relative z-20">
          <div className="bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 rounded-3xl shadow-2xl p-12 text-center text-white flex flex-col md:flex-row justify-around items-center gap-6">
            <div>
              <h2 className="text-3xl font-bold mb-3">I'm a Renter</h2>
              <p className="mb-4">
                Find the perfect property for your stay in Uganda.
              </p>
              <Link
                href="/register?role=RENTER"
                className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition mr-4"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition"
              >
                Login
              </Link>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3">I'm an Owner</h2>
              <p className="mb-4">
                List your property and start earning today.
              </p>
              <Link
                href="/register?role=OWNER"
                className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition mr-4"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Listings Section (Visible for Renter or Logged-out users) */}
      {(user?.role === "RENTER" || !user) && (
        <div className="container mx-auto p-6 relative z-20">
          <h2 className="text-4xl font-bold mb-8 text-center text-purple-700">
            Available Rentals
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {listings?.map((listing) => {
              const images = listing.images || [];
              const currentIndex = currentImageIndex[listing.id] || 0;
              const hasError = imageError[listing.id] || false;

              return (
                <div
                  key={listing.id}
                  className="relative group bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden transition-transform hover:scale-105 hover:shadow-3xl"
                  onMouseEnter={() => setHoveredListing(listing.id)}
                  onMouseLeave={() => setHoveredListing(null)}
                >
                  {/* Abstract shapes inside card */}
                  <div className="absolute -top-6 -left-6 w-20 h-20 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 pointer-events-none"></div>
                  <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

                  {/* Carousel / Image */}
                  <div className="relative h-64 rounded-t-3xl overflow-hidden">
                    {images.length > 0 && !hasError ? (
                      <img
                        src={images[currentIndex]}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() =>
                          setImageError({ ...imageError, [listing.id]: true })
                        }
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gradient-to-tr from-purple-300 via-pink-300 to-blue-300">
                        <span className="text-white font-semibold text-lg text-center p-4">
                          Image not available
                        </span>
                      </div>
                    )}

                    {/* Carousel controls */}
                    {images.length > 1 && hoveredListing === listing.id && (
                      <div className="absolute inset-0 flex justify-between items-center px-3">
                        <button
                          className="bg-white/30 text-white p-2 rounded-full hover:bg-white/50 transition"
                          onClick={() =>
                            setCurrentImageIndex({
                              ...currentImageIndex,
                              [listing.id]:
                                (currentIndex - 1 + images.length) %
                                images.length,
                            })
                          }
                        >
                          ◀
                        </button>
                        <button
                          className="bg-white/30 text-white p-2 rounded-full hover:bg-white/50 transition"
                          onClick={() =>
                            setCurrentImageIndex({
                              ...currentImageIndex,
                              [listing.id]: (currentIndex + 1) % images.length,
                            })
                          }
                        >
                          ▶
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Info section with hover overlay */}
                  <div className="p-4 relative">
                    <h3 className="text-xl font-semibold text-purple-800 mb-1">
                      {listing.title}
                    </h3>
                    <p className="text-gray-700 line-clamp-2">
                      {listing.description}
                    </p>
                    <p className="text-gray-900 font-bold text-lg mt-2">
                      ${listing.pricePerDay} / night
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {listing.location}
                    </p>

                    {hoveredListing === listing.id && (
                      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center space-x-4 rounded-3xl transition-opacity">
                        <button
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
                          onClick={() => router.push(`/listing/${listing.id}`)}
                        >
                          View
                        </button>
                        {/* Only show the 'Book' button if the user is a Renter */}
                        {user && user.role === "RENTER" && (
                          <button
                            className="px-4 py-2 bg-white text-purple-700 rounded-lg shadow hover:bg-purple-100 transition"
                            onClick={() =>
                              router.push(
                                `/booking/create?listingId=${listing.id}`
                              )
                            }
                          >
                            Book
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Owner-specific view (Visible only when user is an Owner) */}
      {user?.role === "OWNER" && (
        <div className="container mx-auto p-6 -mt-16 relative z-20">
          <div className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 rounded-3xl shadow-2xl p-12 text-center text-white flex flex-col items-center gap-6">
            <h2 className="text-4xl font-bold mb-3">Welcome, Owner!</h2>
            <p className="text-lg mb-4">
              Your dashboard awaits. Manage your properties or create a new
              listing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/my-listings"
                className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition"
              >
                View My Listings
              </Link>
              <Link
                href="/listing/create"
                className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition"
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
