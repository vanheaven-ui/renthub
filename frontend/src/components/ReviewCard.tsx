import React from "react";
import { motion } from "framer-motion";
import StarRating from "./StarRating";
import ImageWithLoader from "@/components/ImageWithLoader";
import { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const authorName = review.author.name || "Anonymous Renter";
  const commentText = review.comment || "The reviewer left no comment.";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="p-5 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-center mb-3">
        {review.author.profilePicture ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-pink-400/50">
            <ImageWithLoader
              src={review.author.profilePicture}
              alt={authorName}
              fill
              className="object-cover"
              containerClassName="relative w-full h-full"
            />
          </div>
        ) : (
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {authorName[0]}
          </div>
        )}

        <div className="ml-3">
          <p className="font-semibold text-gray-800">{authorName}</p>
          <div className="flex items-center space-x-2">
            <StarRating rating={review.rating} />
            <p className="text-xs text-gray-500">· {date}</p>
          </div>
        </div>
      </div>
      <p className="text-gray-700 italic border-l-4 border-pink-400/50 pl-3 leading-relaxed">
        {commentText}
      </p>
    </motion.div>
  );
};

export default ReviewCard;
