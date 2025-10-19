import { motion } from "framer-motion";
import { StarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { Listing } from "@/types";

export default function ListingCard({
  listing,
  hoveredListing,
  setHoveredListing,
  onClick,
}: {
  listing: Listing;
  hoveredListing: string | null;
  setHoveredListing: (id: string | null) => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setHoveredListing(listing.id)}
      onMouseLeave={() => setHoveredListing(null)}
      onClick={onClick}
      className="relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden cursor-pointer transition hover:shadow-2xl hover:-translate-y-1 transform duration-300"
    >
      <div className="relative w-full h-56">
        <Image
          src={listing.images[0] || "/placeholder.jpg"}
          alt={listing.title}
          fill
          className="object-cover w-full h-full"
        />
        {hoveredListing === listing.id && listing.images.length > 1 && (
          <div className="absolute inset-0 grid grid-cols-3 gap-1 p-2 bg-black/40">
            {listing.images.slice(1, 4).map((img, idx) => (
              <div
                key={idx}
                className="relative w-full h-full rounded-md overflow-hidden"
              >
                <Image
                  src={img}
                  alt={`${listing.title}-${idx + 1}`}
                  fill
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
        )}
        <div className="absolute top-2 left-2 bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
          <StarIcon className="w-3 h-3 fill-current" />
          {listing.rating ?? "New"}
        </div>
        {listing.alreadyBooked && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            Booked
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-purple-900 truncate">
          {listing.title}
        </h3>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <MapPinIcon className="w-4 h-4 text-pink-500" /> {listing.location}
        </p>
        <p className="text-xl font-extrabold text-purple-700 mt-2">
          UGX {listing.pricePerDay.toLocaleString()}
          <span className="text-base font-medium text-gray-500">/day</span>
        </p>
      </div>
    </motion.div>
  );
}
