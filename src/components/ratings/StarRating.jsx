import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
      <span className="text-sm text-white/80 flex-1 mr-3">{label}</span>
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
              fill={star <= value ? "#E8724A" : "transparent"}
              stroke={star <= value ? "#E8724A" : "rgba(255,255,255,0.3)"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
    </div>
  );
}