// src/components/ReviewSummary.tsx
import React from "react";
import { motion } from "framer-motion";
import StarRating from "./StarRating"; // Import the reusable component
import { Review } from "@/types"; // Import Review interface

interface ReviewSummaryProps {
  reviews: Review[];
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-gray-500 italic">
          No reviews yet. Be the first to share your experience! 🚀
        </p>
      </div>
    );
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  const getStarCounts = () => {
    const counts = [0, 0, 0, 0, 0]; // 1-star to 5-star
    reviews.forEach((review) => {
      // Ensure rating is between 1 and 5
      const index = Math.min(5, Math.max(1, Math.round(review.rating))) - 1;
      counts[index]++;
    });
    return counts;
  };

  const starCounts = getStarCounts();

  const RatingBar = ({ star, count }: { star: number; count: number }) => {
    const percentage = (count / reviews.length) * 100;
    return (
      <div className="flex items-center text-sm mb-1">
        <span className="w-4 font-medium text-gray-700">{star}★</span>
        <div className="flex-grow mx-2 h-2.5 rounded-full bg-purple-100 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-pink-500 rounded-full"
          />
        </div>
        <span className="w-8 text-right text-gray-500">{count}</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white rounded-3xl border border-purple-100 shadow-lg">
      <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-purple-50 rounded-2xl border border-purple-200">
        <p className="text-6xl font-extrabold text-purple-900 mb-2">
          {averageRating.toFixed(1)}
        </p>
        <StarRating rating={averageRating} />
        <p className="text-sm text-gray-600 mt-1">
          based on {reviews.length} reviews
        </p>
      </div>
      <div className="md:col-span-2 p-4">
        {starCounts
          .map((count, index) => (
            <RatingBar key={index} star={index + 1} count={count} />
          ))
          .reverse()}
      </div>
    </div>
  );
};

export default ReviewSummary;
