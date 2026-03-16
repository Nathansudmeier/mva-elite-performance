import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#FDE8DC] last:border-0">
      <span className="text-sm text-[#1A1A1A] flex-1 mr-3 font-400">{label}</span>
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 touch-manipulation"
          >
            <Star
              size={28}
              fill={star <= value ? "#FF6B00" : "transparent"}
              stroke={star <= value ? "#FF6B00" : "#E8E6E1"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
    </div>
  );
}