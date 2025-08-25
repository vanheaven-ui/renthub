"use client";
import { useQuery } from "@tanstack/react-query";
import { getListingById } from "@/lib/api";
import { Listing } from "@/types";

const ListingPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const {
    data: listing,
    isLoading,
    error,
  } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: () => getListingById(id),
  });

  if (isLoading) return <div>Loading listing details...</div>;
  if (error) return <div>Error: Listing not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4">{listing?.title}</h1>
        <div className="mb-4">
          <img
            src={listing?.images[0]}
            alt={listing?.title}
            className="w-full h-96 object-cover rounded-md"
          />
        </div>
        <p className="text-gray-800 text-lg mb-2">
          <span className="font-semibold">Price:</span>
          <span className="mx-1">${listing?.pricePerDay}</span>
          per night
        </p>
        <p className="text-gray-600 mb-4">
          <span className="font-semibold">Location:</span> {listing?.location}
        </p>
        <p className="text-gray-700">{listing?.description}</p>
      </div>
    </div>
  );
};

export default ListingPage;
