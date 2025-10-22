import React from "react";

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center space-x-0.5">
      {Array(fullStars)
        .fill(0)
        .map((_, i) => (
          <svg
            key={`full-${i}`}
            className="w-5 h-5 text-yellow-500 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      {hasHalfStar && (
        <svg
          className="w-5 h-5 text-yellow-500 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l-2.93 6.64L2 9.24l4.9 4.26L5.82 21L12 17.27V2z" />
        </svg>
      )}
      {Array(emptyStars)
        .fill(0)
        .map((_, i) => (
          <svg
            key={`empty-${i}`}
            className="w-5 h-5 text-gray-300 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
    </div>
  );
};

export default StarRating;
