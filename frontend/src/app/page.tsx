import { useQuery } from "@tanstack/react-query";
import { getListings } from "@/lib/api";
import { Listing } from "@/types";

const HomePage = () => {
  const {
    data: listings,
    isLoading,
    error,
  } = useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: getListings,
  });

  if (isLoading) return <div>Loading listings...</div>;
  if (error) return <div>Error fetching listings.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Available Rentals</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listings?.map((listing) => (
          <div
            key={listing.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{listing.title}</h2>
              <p className="text-gray-600 mb-4">{listing.description}</p>
              <p className="text-gray-800 font-bold">
                ${listing.pricePerDay} per night
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
