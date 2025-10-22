import Link from "next/link";
import ImageWithLoader from "@/components/ImageWithLoader";

interface OwnerInfoCardProps {
  listingId: string;
  ownerName: string;
  profileImageUrl?: string | null;
  hasActiveBooking: boolean;
}

const OwnerInfoCard: React.FC<OwnerInfoCardProps> = ({
  listingId,
  ownerName,
  profileImageUrl,
  hasActiveBooking,
}) => {
  const hostName = ownerName || "Unknown Host";
  const avatarUrl = profileImageUrl || "/default-avatar.png";

  return (
    <div className="p-6 bg-white border-4 border-purple-200 rounded-3xl shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01] duration-300">
      <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 mr-2 text-pink-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Hosted by <span className="ml-1 font-extrabold">{hostName}</span>
      </h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-pink-400/50 shadow-md">
            <ImageWithLoader
              src={avatarUrl}
              alt={hostName}
              fill
              className="object-cover"
              containerClassName="relative w-full h-full"
            />
          </div>
          <div className="ml-4">
            <p className="text-lg font-semibold text-gray-800">Your Host</p>
            <p className="text-sm text-gray-500">Joined RentHub</p>
          </div>
        </div>

        {/* CONDITIONAL BUTTON RENDERING */}
        {hasActiveBooking ? (
          <Link
            href={`/my-bookings?listingId=${listingId}`}
            className="px-4 py-2 text-sm font-semibold rounded-full bg-pink-500 text-white shadow-md hover:bg-pink-600 transition-colors duration-300 transform hover:scale-105 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-1"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm4 8H6V8h2v4zm4 0h-2V8h2v4zm4 0h-2V8h2v4z" />
            </svg>
            Chat via My Booking
          </Link>
        ) : (
          <button
            disabled
            className="px-4 py-2 text-sm font-semibold rounded-full bg-gray-300 text-gray-600 cursor-not-allowed shadow-inner transition-colors duration-300"
            title="You must have a confirmed booking to message the host."
          >
            Booking Required to Chat
          </button>
        )}
      </div>

      {/* Escaped quotes */}
      <p className="mt-4 text-sm text-gray-600 border-t pt-4 border-purple-100 italic">
        &quot;I am dedicated to ensuring your stay is comfortable and memorable.
        Feel free to reach out with any questions!&quot;
      </p>
    </div>
  );
};

export default OwnerInfoCard;
