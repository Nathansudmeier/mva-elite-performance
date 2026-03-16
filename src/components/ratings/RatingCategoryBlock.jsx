import React from "react";
import StarRating from "./StarRating";

export default function RatingCategoryBlock({ title, criteria, form, onChange }) {
  const scores = criteria.map((c) => form[c.key] || 0).filter((v) => v > 0);
  const avg = scores.length > 0 ? Math.ceil(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">{title}</h3>
        {avg > 0 && (
          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: "#E8724A", color: "#fff" }}>
            ⌀ {avg}/5
          </span>
        )}
      </div>
      {criteria.map((c) => (
        <StarRating
          key={c.key}
          label={c.label}
          value={form[c.key] || 0}
          onChange={(v) => onChange(c.key, v)}
        />
      ))}
    </div>
  );
}