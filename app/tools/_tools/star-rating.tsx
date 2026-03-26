"use client";

import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}

export const StarRating = ({ rating, count, size = "sm" }: StarRatingProps) => {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.floor(rating);
    const partial = !filled && i < rating;
    return { filled, partial };
  });

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {stars.map((s, i) => (
          <Star
            key={i}
            className={`${iconSize} ${
              s.filled
                ? "fill-amber-400 text-amber-400"
                : s.partial
                ? "fill-amber-200 text-amber-300"
                : "fill-gray-100 text-gray-200"
            }`}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-gray-400">
          {rating > 0 ? rating.toFixed(1) : "—"}
          {count > 0 && <span className="text-gray-300 ml-1">({count})</span>}
        </span>
      )}
    </div>
  );
};