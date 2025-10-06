"use client";

import { Listing } from "@/types";
import { useState } from "react";
import Link from "next/link";
// Import Next.js Image component
import Image from "next/image";
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { formatNumber } from "@/lib/formatNumbers";

interface ListingCardProps {
  listing: Listing;
}

const ListingCard = ({ listing }: ListingCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = listing.images || [];
  const currentImageUrl = images[currentImageIndex] || "";

  // Carousel dots handler
  const goToImage = (idx: number) => setCurrentImageIndex(idx);

  const totalBookings = listing.bookings?.length || 0;
  const totalEarnings = (listing.bookings || []).reduce(
    (sum, b) => sum + (b.status === "CONFIRMED" ? b.totalAmount || 0 : 0),
    0
  );

  return (
    <div className="group relative bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden transition-transform hover:scale-105 hover:shadow-3xl">
      {/* Image */}
      <div className="relative h-64 rounded-t-3xl overflow-hidden bg-gray-200 flex items-center justify-center">
        {currentImageUrl ? (
          // Replaced <img> with <Image />
          <Image
            src={currentImageUrl}
            alt={listing.title}
            // Mandatory Next.js Image props (aspect ratio of 16:9 for a typical h-64 container)
            width={700}
            height={400}
            // Setting 'priority' because this is a primary visible element in the card list
            priority={true}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-gray-500 font-semibold text-lg text-center p-4">
            No image available
          </span>
        )}
        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <span
                key={idx}
                onClick={() => goToImage(idx)}
                className={`w-2 h-2 rounded-full cursor-pointer ${
                  idx === currentImageIndex ? "bg-purple-700" : "bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-purple-800 mb-2">
          {listing.title}
        </h3>
        <p className="text-gray-700 line-clamp-2">{listing.description}</p>
        <p className="text-gray-900 font-semibold mt-2">
          <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-1 rounded-full font-bold flex items-center gap-2">
            <span className="text-xs font-semibold">UGX</span>
            <span>{formatNumber(listing.pricePerDay)} / night</span>
          </span>
        </p>
        <p className="text-gray-500 text-sm mt-1">{listing.location}</p>

        {/* Stats */}
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-6 h-6 text-pink-600" />
            <span className="text-gray-700 font-medium">
              {totalBookings} Bookings
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
            <span className="text-gray-700 font-medium">
              UGX {totalEarnings}
            </span>
          </div>
        </div>

        {/* Edit button */}
        <div className="mt-4 flex justify-end">
          <Link
            href={`/listing/edit/${listing.id}`}
            className="px-4 py-2 bg-white text-purple-700 rounded-lg shadow hover:bg-gray-100 transition flex items-center gap-1"
          >
            <PencilSquareIcon className="w-5 h-5" /> Edit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
