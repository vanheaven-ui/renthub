"use client";

import { motion } from "framer-motion";
import { Review } from "@/types";
import StarRating from "@/components/StarRating";

interface ReviewSubmittedCardProps {
  review: Review;
}

export const ReviewSubmittedCard: React.FC<ReviewSubmittedCardProps> = ({
  review,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 p-8 bg-gray-800 rounded-3xl shadow-xl border-t-4 border-yellow-400 text-white flex flex-col items-center justify-center text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-yellow-400 rounded-full p-6 mb-6"
      >
        <svg
          className="w-12 h-12 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.div>
      <h3 className="text-3xl font-extrabold text-yellow-400 mb-2">
        Thank You!
      </h3>
      <p className="text-gray-300 text-lg mb-4">
        For providing a review on this listing.
      </p>

      <StarRating rating={review.rating} />
      {review.comment && (
        <p className="mt-4 text-gray-200 max-w-xl">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}
    </motion.div>
  );
};

export default ReviewSubmittedCard;
