import React from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { calcCategoryAverages } from "./ratingUtils";

const COLORS = { "Meting 1": "#E8724A", "Meting 2": "#4169E1", "Meting 3": "#FFFFFF" };

export default function RatingRadarChart({ ratings }) {
  if (!ratings || ratings.length === 0) return null;

  const metingen = ["Meting 1", "Meting 2", "Meting 3"];
  const categories = ["Technisch", "Inzicht", "Persoonlijkheid", "Fysiek"];

  const data = categories.map((cat) => {
    const point = { category: cat };
    metingen.forEach((m) => {
      const r = ratings.find((x) => x.meting === m);
      if (r) {
        const avgs = calcCategoryAverages(r);
        point[m] = avgs[cat];
      }
    });
    return point;
  });

  const presentMetingen = metingen.filter((m) => ratings.some((r) => r.meting === m));

  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.15)" />
          <PolarAngleAxis dataKey="category" tick={{ fill: "#fff", fontSize: 11 }} />
          {presentMetingen.map((m) => (
            <Radar
              key={m}
              name={m}
              dataKey={m}
              stroke={COLORS[m]}
              fill={COLORS[m]}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
          <Legend wrapperStyle={{ color: "#fff", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1A1F2E", border: "1px solid #E8724A", borderRadius: 8, color: "#fff" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}