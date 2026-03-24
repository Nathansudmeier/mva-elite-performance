import React from "react";

export default function AttendanceDots({ attendance }) {
  const last10 = [...attendance].slice(-10);
  if (last10.length === 0) return null;

  const presentCount = last10.filter(a => a.present).length;
  const pct = Math.round((presentCount / last10.length) * 100);

  let sentence;
  if (pct === 100) sentence = "Perfect! Je was bij alle laatste trainingen aanwezig. 🔥";
  else if (pct >= 80) sentence = `Goed bezig! Je was aanwezig bij ${presentCount} van de laatste ${last10.length} trainingen.`;
  else if (pct >= 60) sentence = `Je miste een aantal trainingen — ${last10.length - presentCount} van de laatste ${last10.length}.`;
  else sentence = `Je miste veel trainingen recentelijk (${last10.length - presentCount} van ${last10.length}).`;

  return (
    <div style={{
      background: "#ffffff", border: "2.5px solid #1a1a1a",
      borderRadius: "18px", boxShadow: "3px 3px 0 #1a1a1a",
      padding: "1rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "#FFD600", border: "2px solid #1a1a1a",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <i className="ti ti-calendar" style={{ fontSize: "18px", color: "#1a1a1a" }} />
        </div>
        <p style={{ fontSize: "9px", fontWeight: 800, color: "rgba(26,26,26,0.65)", textTransform: "uppercase", letterSpacing: "0.10em" }}>
          Laatste {last10.length} trainingen
        </p>
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {last10.map((a, i) => (
          <div key={i} style={{
            width: 11, height: 11, borderRadius: "50%",
            background: a.present ? "#1a1a1a" : "transparent",
            border: a.present ? "1.5px solid #1a1a1a" : "1.5px solid #1a1a1a",
            flexShrink: 0,
          }} />
        ))}
        {Array.from({ length: Math.max(0, 10 - last10.length) }).map((_, i) => (
          <div key={`empty-${i}`} style={{
            width: 11, height: 11, borderRadius: "50%",
            background: "transparent", border: "1.5px solid rgba(26,26,26,0.15)", flexShrink: 0,
          }} />
        ))}
      </div>
      <p style={{ fontSize: "12px", color: "rgba(26,26,26,0.55)", lineHeight: 1.5 }}>{sentence}</p>
    </div>
  );
}