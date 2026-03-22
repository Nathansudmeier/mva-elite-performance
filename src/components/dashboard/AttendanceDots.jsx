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
      <div className="flex items-center gap-3 mb-3">
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(234,179,8,0.15)", border: "0.5px solid rgba(234,179,8,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="trainGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#FF8C3A"/></linearGradient></defs>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="url(#trainGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="2" x2="16" y2="6" stroke="url(#trainGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="8" y1="2" x2="8" y2="6" stroke="url(#trainGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke="url(#trainGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="t-label">Laatste {last10.length} trainingen</p>
      </div>
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