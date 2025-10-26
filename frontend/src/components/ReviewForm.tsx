// components/ReviewForm.tsx (or wherever your ReviewForm is located)

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import { createReview } from "@/lib/api";
import { Review } from "@/types";

interface ReviewFormProps {
  // We'll remove setHasReviewed and replace it with a more explicit callback
  // setHasReviewed: (value: boolean) => void; 
  listingId: string;
  // NEW PROP: Callback to pass the successfully created review object to the parent
  onReviewSubmitted: (review: Review) => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  onReviewSubmitted, // Use the new prop
  listingId,
}) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { mutate, isPending: isSubmitting } = useMutation<
    Review,
    Error,
    { rating: number; comment?: string }
  >({
    mutationFn: (payload) => createReview(listingId, payload),
    onSuccess: (newReview) => {
      // 1. Call the new prop, passing the full Review object to the parent
      onReviewSubmitted(newReview); 
      
      toast.success(
        "Review submitted successfully! Thank you for your feedback."
      );
      // 2. Invalidate to update the listing cache for next time, but the UI is already updated via the callback.
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] }); 
      queryClient.invalidateQueries({ queryKey: ["booking", newReview.id] }); // Invalidate the booking to ensure the `userReview` state is eventually consistent if the user refreshes/navigates back
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit review.");
    },
  });

  const handleReviewSubmit = () => {
    if (rating === 0) {
      return toast.error("Please select a rating before submitting.");
    }
    mutate({ rating, comment });
  };

  return (
    <motion.div
      key="form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // ADDITION: Exit animation for when the form is replaced
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="mt-4 p-8 bg-gray-800 rounded-3xl shadow-xl border-t-4 border-yellow-400 text-white"
    >
      <h3 className="text-3xl font-extrabold text-yellow-400 mb-2">
        How Was Your Stay?
        <span className="text-lg font-normal ml-2">({rating}/5)</span>
      </h3>
      <p className="text-gray-300 mb-6">
        Share your experience to help future renters and property owners.
      </p>

      {/* Interactive Star Rating */}
      <div className="flex flex-wrap justify-center mb-8 gap-2">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <motion.button
            key={starValue}
            type="button"
            onClick={() => setRating(starValue)}
            disabled={isSubmitting}
            className="p-1 rounded-full transition-all duration-200 focus:outline-none"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg
              className={`
                w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 
                transition-colors duration-300
                ${
                  starValue <= rating
                    ? "text-yellow-400 drop-shadow-lg"
                    : "text-gray-600 hover:text-yellow-500"
                }
              `}
              fill={starValue <= rating ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.072 6.368a1.5 1.5 0 001.42 1.033h6.666c.96 0 1.353 1.25.568 1.838l-5.378 3.911a1.5 1.5 0 00-.54 1.637l2.072 6.368c.3.921-.755 1.688-1.554 1.106l-5.378-3.911a1.5 1.5 0 00-1.76 0l-5.378 3.911c-.799.582-1.854-.185-1.554-1.106l2.072-6.368a1.5 1.5 0 00-.54-1.637l-5.378-3.911c-.785-.588-.392-1.838.568-1.838h6.666a1.5 1.5 0 001.42-1.033l2.072-6.368z"
              />
            </svg>
          </motion.button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your detailed review here..."
        rows={4}
        className="w-full p-4 mb-6 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300 resize-y min-h-[8rem]"
        maxLength={500}
        disabled={isSubmitting}
      />

      <div className="flex justify-between items-center text-sm text-gray-400">
        <span>{500 - comment.length} characters remaining</span>
        <button
          onClick={handleReviewSubmit}
          disabled={isSubmitting || rating === 0}
          className="px-8 py-3 bg-yellow-400 text-gray-800 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? "Sending..." : "Submit Review"}
        </button>
      </div>
    </motion.div>
  );
};

export default ReviewForm;