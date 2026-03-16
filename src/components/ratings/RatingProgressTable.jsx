import React from "react";
import { calcCategoryAverages } from "./ratingUtils";

const METING_COLORS = { "Meting 1": "#E8724A", "Meting 2": "#4169E1", "Meting 3": "#FFFFFF" };
const CATEGORIES = ["Technisch", "Inzicht", "Persoonlijkheid", "Fysiek"];

export default function RatingProgressTable({ ratings }) {
  if (!ratings || ratings.length === 0) return null;

  const metingen = ["Meting 1", "Meting 2", "Meting 3"].filter((m) => ratings.some((r) => r.meting === m));

  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 pr-3 text-white/60 font-medium text-xs uppercase tracking-wider">Categorie</th>
            {metingen.map((m) => (
              <th key={m} className="text-center py-2 px-2 text-xs font-bold" style={{ color: METING_COLORS[m] }}>
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((cat) => (
            <tr key={cat} className="border-t border-white/10">
              <td className="py-2 pr-3 text-white/80 text-xs">{cat}</td>
              {metingen.map((m) => {
                const r = ratings.find((x) => x.meting === m);
                const avg = r ? calcCategoryAverages(r)[cat] : "-";
                return (
                  <td key={m} className="text-center py-2 px-2 font-bold text-white text-sm">
                    {avg !== "-" ? `${avg}/5` : <span className="text-white/30">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t-2 border-white/30">
            <td className="py-2 pr-3 text-white font-bold text-xs uppercase">Totaal ⌀</td>
            {metingen.map((m) => {
              const r = ratings.find((x) => x.meting === m);
              if (!r) return <td key={m} className="text-center py-2 px-2 text-white/30">—</td>;
              const avgs = calcCategoryAverages(r);
              const vals = Object.values(avgs).filter((v) => v > 0);
              const total = vals.length > 0 ? Math.ceil(vals.reduce((a, b) => a + b, 0) / vals.length) : "-";
              return (
                <td key={m} className="text-center py-2 px-2 font-black text-sm" style={{ color: METING_COLORS[m] }}>
                  {total !== "-" ? `${total}/5` : <span className="text-white/30">—</span>}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}