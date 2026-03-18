import React from "react";

export default function AttendanceDots({ attendance }) {
  // Take last 10 sessions sorted by session (use record order)
  const last10 = [...attendance].slice(-10);

  if (last10.length === 0) return null;

  const presentCount = last10.filter(a => a.present).length;
  const pct = Math.round((presentCount / last10.length) * 100);

  let sentence;
  if (pct === 100) sentence = "Perfect! Je was bij alle laatste trainingen aanwezig. 🔥";
  else if (pct >= 80) sentence = `Goed bezig! Je was aanwezig bij ${presentCount} van de laatste ${last10.length} trainingen.`;
  else if (pct >= 60) sentence = `Je miste een aantal trainingen — ${last10.length - presentCount} van de laatste ${last10.length}. Probeer erbij te zijn!`;
  else sentence = `Je miste veel trainingen recentelijk (${last10.length - presentCount} van ${last10.length}). Kom terug op schema!`;

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-sm">
      <p className="text-xs uppercase tracking-wide text-[#888888] font-medium mb-3">Laatste {last10.length} trainingen</p>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {last10.map((a, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: a.present ? "#3B6D11" : "#C0392B" }}
            title={a.present ? "Aanwezig" : "Afwezig"}
          >
            <span className="text-white text-[10px] font-bold">{a.present ? "✓" : "✗"}</span>
          </div>
        ))}
        {/* Fill remaining dots grey if less than 10 */}
        {Array.from({ length: Math.max(0, 10 - last10.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="w-7 h-7 rounded-full bg-[#E8E6E1]" />
        ))}
      </div>
      <p className="text-sm text-[#1A1A1A] leading-snug">{sentence}</p>
    </div>
  );
}