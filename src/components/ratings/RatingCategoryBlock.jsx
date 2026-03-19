import React from "react";
import StarRating from "./StarRating";

export default function RatingCategoryBlock({ title, criteria, form, onChange, readOnly = false }) {
  const scores = criteria.map((c) => form[c.key] || 0).filter((v) => v > 0);
  const avg = scores.length > 0 ? Math.ceil(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(255,107,0,0.08)", border: "0.5px solid rgba(255,107,0,0.2)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="t-label">{title}</h3>
        {avg > 0 && (
          <span className="badge" style={{ background: "#FF6B00", color: "#fff" }}>⌀ {avg}/5</span>
        )}
      </div>
      {criteria.map((c) => (
        <StarRating
          key={c.key}
          label={c.label}
          value={form[c.key] || 0}
          onChange={(v) => onChange(c.key, v)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}