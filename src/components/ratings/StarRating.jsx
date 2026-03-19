import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, label, readOnly = false }) {
  return (
    <div className="flex items-center justify-between py-3 last:border-0" style={{ borderBottom: "0.5px solid rgba(255,107,0,0.15)" }}>
      <span className="t-secondary flex-1 mr-3">{label}</span>
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onChange(star)}
            className={`p-1 touch-manipulation ${readOnly ? "cursor-default" : ""}`}
            disabled={readOnly}
          >
            <Star
              size={28}
              fill={star <= value ? "#FF6B00" : "transparent"}
              stroke={star <= value ? "#FF6B00" : "rgba(255,255,255,0.2)"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
    </div>
  );
}