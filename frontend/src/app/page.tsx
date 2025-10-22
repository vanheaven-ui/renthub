"use client";

import { useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { getListings, getMyListings } from "@/lib/api";
import { useAuth } from "./context/AuthProvider";
import FilterPanel, { FilterOptions } from "@/components/FilterPanel";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";

import OwnerDashboard from "@/components/OwnerDashboard";
import ListingCard from "@/components/ListingCard";
import OwnerCallToAction from "@/components/OwnerCallToAction";
import Footer from "@/components/Footer";
import ServicesSection from "@/components/ServicesSection";

import { Listing } from "@/types";

const categories = [
  "Apartment",
  "House",
  "Villa",
  "Cabin",
  "Mansion",
  "Studio",
  "Hostel",
  "Cottage",
  "Penthouse",
];

const HomePage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const listingsRef = useRef<HTMLDivElement>(null);
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    category: null,
    minPrice: null,
    maxPrice: null,
    search: null,
    location: null,
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleCategorySelect = (category: string | null) => {
    setActiveCategory(category);
    setFilters((prev) => ({
      ...prev,
      category: prev.category === category ? null : category,
      minPrice: null,
      maxPrice: null,
      search: null,
      location: null,
    }));
    scrollToListings();
  };

  const {
    data: listings = [],
    isLoading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useQuery<Listing[]>({
    queryKey: ["listings", filters],
    queryFn: () => getListings(filters),
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

  const activeListings = myListings.length;
  const totalEarnings = myListings.reduce((sum, listing) => {
    const confirmed =
      listing.bookings?.filter((b) => b.status === "CONFIRMED") || [];
    return sum + confirmed.reduce((sub, b) => sub + (b.totalAmount || 0), 0);
  }, 0);

  const bookingsThisMonth = myListings.reduce((sum, listing) => {
    const now = new Date();
    const count =
      listing.bookings?.filter((b) => {
        const date = new Date(b.createdAt);
        return (
          b.status === "CONFIRMED" &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }).length || 0;
    return sum + count;
  }, 0);

  const filteredListings = listings.filter((l) => {
    if (filters.category && l.category !== filters.category) return false;
    if (filters.minPrice !== null && l.pricePerDay < filters.minPrice)
      return false;
    if (filters.maxPrice !== null && l.pricePerDay > filters.maxPrice)
      return false;
    if (
      filters.search &&
      !l.title.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    if (
      filters.location &&
      !l.location.toLowerCase().includes(filters.location.toLowerCase())
    )
      return false;
    return true;
  });

  const scrollToListings = useCallback(() => {
    if (listingsRef.current) {
      const yOffset = -100;
      const y =
        listingsRef.current.getBoundingClientRect().top +
        window.scrollY +
        yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

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

  // ✅ Owner Experience
  if (user?.role === "OWNER") {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <OwnerDashboard
          userName={user?.name ?? "Property Owner"}
          totalEarnings={totalEarnings}
          bookingsThisMonth={bookingsThisMonth}
          activeListings={activeListings}
        />
        <div className="text-center mt-16 text-gray-600">
          <p className="text-lg">
            You currently have <strong>{activeListings}</strong> active listings
            and <strong>{bookingsThisMonth}</strong> bookings this month.
          </p>
          <p className="mt-2 text-sm italic">
            Manage your listings efficiently with our dashboard tools.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  // ✅ Guest / Renter Experience
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Hero section with animated abstract shapes */}
      <div className="relative overflow-hidden hero-gradient">
        {/* Abstract Floating Shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="glass-orb orb-1"></div>
          <div className="glass-orb orb-2"></div>
          <div className="motion-trail"></div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-6 py-28 text-center relative z-10">
          <h1 className="text-6xl font-extrabold text-purple-900 mb-4 tracking-tighter leading-tight drop-shadow-md">
            Find Your{" "}
            <span className="text-pink-600 underline decoration-wavy">
              Ugandan
            </span>{" "}
            Home Away From Home 🏠
          </h1>
          <p className="text-2xl text-gray-700 font-light max-w-3xl mx-auto mb-10">
            Curated short-term rentals, secured with local Mobile Money and
            supported by 24/7 AI.
          </p>
          <div className="max-w-4xl mx-auto">
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              categories={categories}
              onFilterApply={scrollToListings}
              isCompact={true}
            />
          </div>
        </div>
      </div>

      {/* Services Section */}
      <ServicesSection />

      {/* Categories */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-md py-3 overflow-x-auto border-b border-gray-200">
        <div className="flex space-x-3 px-6 container mx-auto w-fit">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full transition-all ${
              activeCategory === null
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Listings
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                activeCategory === category
                  ? "bg-pink-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div
        ref={listingsRef}
        className="container mx-auto p-6 relative z-10"
        id="listings"
      >
        <h2 className="text-3xl font-bold text-purple-800 mb-6">
          {activeCategory
            ? `Explore ${activeCategory}s`
            : "All Featured Rentals"}
        </h2>

        {/* Horizontal scroll container */}
        <div className="flex space-x-6 overflow-x-auto scroll-smooth px-2 py-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-100">
          {filteredListings.length === 0 ? (
            <p className="text-center text-gray-500 py-10 text-xl flex-shrink-0 w-full bg-white rounded-xl shadow-inner">
              😔 No listings match your current filters. Try broadening your
              search!
            </p>
          ) : (
            filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="flex-none snap-start transition-transform hover:scale-105 hover:shadow-2xl cursor-pointer"
                style={{ minWidth: "20rem", maxWidth: "24rem" }} // Adjust responsive card width
                onClick={() => router.push(`/listing/${listing.id}`)}
              >
                <ListingCard
                  listing={listing}
                  hoveredListing={hoveredListing}
                  setHoveredListing={setHoveredListing}
                  onClick={() => router.push(`/listing/${listing.id}`)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Guest CTA + Footer */}
      <OwnerCallToAction />
      <Footer />
    </div>
  );
};

export default HomePage;
