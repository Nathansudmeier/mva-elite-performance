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
    <div className="glass p-4">
      <p className="t-label mb-3">Laatste {last10.length} trainingen</p>
      <div className="flex gap-[6px] mb-3">
        {last10.map((a, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: a.present ? "#4ade80" : "#f87171", flexShrink: 0 }} />
        ))}
        {Array.from({ length: Math.max(0, 10 - last10.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
        ))}
      </div>
      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{sentence}</p>
    </div>
  );
}